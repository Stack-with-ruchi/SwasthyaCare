import Groq from "groq-sdk";
import Patient from "../models/Patient.js";
import Document from "../models/Document.js";
import TokenCase from "../models/TokenCase.js";
import Appointment from "../models/Appointment.js";

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY,
});

// =====================================================
// LANGUAGE NAMES
// =====================================================

const LANGUAGE_NAMES = {
  en: "English",
  hi: "Hindi",
  hne: "Chhattisgarhi",
  cg: "Chhattisgarhi",
  as: "Assamese",
  bn: "Bengali",
  brx: "Bodo",
  doi: "Dogri",
  gu: "Gujarati",
  kn: "Kannada",
  ks: "Kashmiri",
  kok: "Konkani",
  mai: "Maithili",
  ml: "Malayalam",
  mni: "Manipuri",
  mr: "Marathi",
  ne: "Nepali",
  or: "Odia",
  pa: "Punjabi",
  sa: "Sanskrit",
  sat: "Santali",
  sd: "Sindhi",
  ta: "Tamil",
  te: "Telugu",
  ur: "Urdu",
};

const resolveLanguageName = (languagePreference) => {
  if (!languagePreference) {
    return "English";
  }

  const normalizedInput = String(languagePreference).trim();

  if (LANGUAGE_NAMES[normalizedInput]) {
    return LANGUAGE_NAMES[normalizedInput];
  }

  const matchedLanguage = Object.entries(LANGUAGE_NAMES).find(
    ([, languageName]) =>
      languageName.toLowerCase() === normalizedInput.toLowerCase(),
  );

  return matchedLanguage?.[1] || "English";
};

// =====================================================
// SANITIZE AI SUMMARY
// =====================================================

const sanitizeSummaryText = (text) => {
  if (typeof text !== "string") {
    return "";
  }

  let sanitized = text
    .replace(/\r/g, "")
    .replace(/```[\s\S]*?```/g, "")
    .replace(/\*\*/g, "")
    .replace(/__/g, "")
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/\|/g, " ")
    .replace(/[ \t]+\n/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();

  sanitized = sanitized
    .replace(
      /^(AI[-\s]?Generated Healthcare Case Summary|AI Case Summary|Case Summary)\s*:?\s*/i,
      "",
    )
    .trim();

  sanitized = sanitized
    .replace(/[ \t]{2,}/g, " ")
    .replace(/\n{3,}/g, "\n\n")
    .trim();

  return sanitized;
};

// =====================================================
// HELPER: GET CURRENT PATIENT DOCUMENTS
// =====================================================

const getPatientDocumentContext = async (patientId) => {
  try {
    /*
     * Only documents currently available to this patient
     * with AI-processing consent are considered.
     *
     * This does NOT fetch complete ABDM/HIS history.
     */

    const documents = await Document.find({
      patientId,
      "aiProcessingConsent.accepted": true,
      ocrStatus: "Completed",
    })
      .sort({ uploadDate: -1 })
      .limit(5)
      .select("name type ocrText uploadDate");

    if (!documents.length) {
      return {
        documents: [],
        text: "No current medical documents have been submitted for AI processing.",
      };
    }

    const MAX_TOTAL_OCR_LENGTH = 30000;

    let totalLength = 0;

    const documentSections = [];

    for (const doc of documents) {
      if (typeof doc.ocrText !== "string" || !doc.ocrText.trim()) {
        continue;
      }

      const remaining = MAX_TOTAL_OCR_LENGTH - totalLength;

      if (remaining <= 0) {
        break;
      }

      let text = doc.ocrText.trim();

      if (text.length > remaining) {
        text =
          text.substring(0, remaining) +
          "\n\n[OCR text truncated for processing.]";
      }

      documentSections.push(`
Document Name:
${doc.name}

Document Type:
${doc.type}

Upload Date:
${doc.uploadDate || "Not available"}

OCR Extracted Text:
${text}
`);

      totalLength += text.length;
    }

    return {
      documents,

      text:
        documentSections.length > 0
          ? documentSections.join("\n\n-----------------------------\n\n")
          : "Submitted documents were found, but no readable OCR text is available.",
    };
  } catch (error) {
    console.error("Failed to fetch current patient document context:", error);

    return {
      documents: [],
      text: "Current medical document information could not be loaded.",
    };
  }
};

// =====================================================
// HELPER: PREPARE SAFE CHAT HISTORY
// =====================================================

const prepareConversationHistory = (conversation, currentMessage) => {
  if (!Array.isArray(conversation)) {
    return [];
  }

  let safeConversation = conversation
    .filter((item) => {
      if (!item || typeof item.text !== "string") {
        return false;
      }

      const text = item.text.trim();

      if (!text) {
        return false;
      }

      return (
        item.sender === "user" ||
        item.sender === "bot" ||
        item.role === "user" ||
        item.role === "assistant"
      );
    })
    .map((item) => {
      const sender = item.sender || item.role;

      return {
        role: sender === "user" ? "user" : "assistant",
        content: item.text.trim(),
      };
    });

  const normalizedCurrentMessage = currentMessage.trim();

  const lastMessage = safeConversation[safeConversation.length - 1];

  if (
    lastMessage?.role === "user" &&
    lastMessage.content === normalizedCurrentMessage
  ) {
    safeConversation.pop();
  }

  safeConversation = safeConversation.slice(-16);

  return safeConversation;
};

// =====================================================
// HELPER: PREPARE SUMMARY CONVERSATION
// =====================================================

const prepareSummaryConversation = (conversation) => {
  if (!Array.isArray(conversation)) {
    return "No current chatbot conversation available.";
  }

  const safeConversation = conversation
    .filter(
      (item) =>
        item &&
        typeof item.text === "string" &&
        item.text.trim() &&
        (item.sender === "user" ||
          item.sender === "bot" ||
          item.role === "user" ||
          item.role === "assistant"),
    )
    .map((item) => {
      const sender = item.sender || item.role;

      return `${sender === "user" ? "Patient" : "AI"}: ${item.text.trim()}`;
    });

  if (!safeConversation.length) {
    return "No current chatbot conversation available.";
  }

  const MAX_CONVERSATION_LENGTH = 30000;

  let result = safeConversation.join("\n");

  if (result.length > MAX_CONVERSATION_LENGTH) {
    result =
      result.substring(0, MAX_CONVERSATION_LENGTH) +
      "\n\n[Conversation truncated.]";
  }

  return result;
};

// =====================================================
// HELPER: PARSE AI RESPONSE
// =====================================================

const parseRedFlagResponse = (content) => {
  const defaultResult = {
    reply:
      typeof content === "string" && content.trim()
        ? content.trim()
        : "Sorry, I could not generate a response.",

    options: [],

    questionType: "none",

    redFlagDetected: false,

    redFlagLevel: "None",

    redFlagReasons: [],
  };

  if (!content || typeof content !== "string") {
    return defaultResult;
  }

  try {
    let cleanedContent = content.trim();

    cleanedContent = cleanedContent
      .replace(/^```json\s*/i, "")
      .replace(/^```\s*/i, "")
      .replace(/\s*```$/i, "")
      .trim();

    const parsed = JSON.parse(cleanedContent);

    const validLevels = ["None", "Moderate", "High"];

    const redFlagDetected = parsed.redFlagDetected === true;

    const redFlagLevel = validLevels.includes(parsed.redFlagLevel)
      ? parsed.redFlagLevel
      : redFlagDetected
        ? "Moderate"
        : "None";

    const redFlagReasons = Array.isArray(parsed.redFlagReasons)
      ? parsed.redFlagReasons
          .filter((reason) => typeof reason === "string")
          .map((reason) => reason.trim())
          .filter(Boolean)
          .slice(0, 5)
      : [];

    const options = Array.isArray(parsed.options)
      ? parsed.options
          .filter(
            (option) => typeof option === "string" && option.trim().length > 0,
          )
          .map((option) => option.trim())
          .filter((option, index, array) => array.indexOf(option) === index)
          .slice(0, 8)
      : [];

    const questionType =
      parsed.questionType === "multiple"
        ? "multiple"
        : parsed.questionType === "single"
          ? "single"
          : "none";

    return {
      reply:
        typeof parsed.reply === "string" && parsed.reply.trim()
          ? parsed.reply.trim()
          : defaultResult.reply,

      options,

      questionType: options.length > 0 ? questionType : "none",

      redFlagDetected,

      redFlagLevel: redFlagDetected ? redFlagLevel : "None",

      redFlagReasons: redFlagDetected ? redFlagReasons : [],
    };
  } catch (error) {
    console.warn("AI response was not valid JSON. Using safe fallback.");

    return defaultResult;
  }
};

// =====================================================
// HELPER: SAVE RED FLAG TO ACTIVE TOKEN CASE
// =====================================================

const saveRedFlagToActiveCase = async ({
  patientId,
  redFlagDetected,
  redFlagLevel,
  redFlagReasons,
}) => {
  try {
    const latestAppointment = await Appointment.findOne({
      patientId,

      status: {
        $in: ["Pending", "Accepted"],
      },

      tokenCaseId: {
        $ne: null,
      },
    })
      .sort({
        requestDate: -1,
        createdAt: -1,
      })
      .select("tokenCaseId");

    if (!latestAppointment?.tokenCaseId) {
      return null;
    }

    const tokenCase = await TokenCase.findOne({
      _id: latestAppointment.tokenCaseId,
      patientId,
    });

    if (!tokenCase) {
      return null;
    }

    tokenCase.redFlagDetected = redFlagDetected;

    tokenCase.redFlagLevel = redFlagDetected ? redFlagLevel : "None";

    tokenCase.redFlagReasons = redFlagDetected ? redFlagReasons : [];

    tokenCase.redFlagCheckedAt = new Date();

    await tokenCase.save();

    return tokenCase;
  } catch (error) {
    console.error("Failed to save red-flag information:", error);

    return null;
  }
};

// =====================================================
// 1. CHATBOT REPLY
// =====================================================

export const chatbotReply = async (req, res) => {
  try {
    const { message, mode = "ayurveda", conversation = [] } = req.body;

    // =================================================
    // VALIDATE MESSAGE
    // =================================================

    if (!message || typeof message !== "string" || !message.trim()) {
      return res.status(400).json({
        success: false,
        reply: "Please enter a message.",
        options: [],
        questionType: "none",
      });
    }

    // =================================================
    // VALIDATE PATIENT
    // =================================================

    if (!req.user?.id || req.user.role !== "patient") {
      return res.status(403).json({
        success: false,
        reply: "Only logged-in patients can use the healthcare assistant.",
        options: [],
        questionType: "none",
      });
    }

    // =================================================
    // GET PATIENT
    // =================================================

    const patient = await Patient.findById(req.user.id).select(
      "fullName languagePreference",
    );

    if (!patient) {
      return res.status(404).json({
        success: false,
        reply: "Patient account not found.",
        options: [],
        questionType: "none",
      });
    }

    // =================================================
    // LANGUAGE
    // =================================================

    const languageCode = patient.languagePreference || "en";

    const preferredLanguageName = resolveLanguageName(languageCode);

    // =================================================
    // AI MODE
    // =================================================

    const selectedMode = mode === "allopathy" ? "Allopathy" : "Ayurveda";

    // =================================================
    // CURRENT DOCUMENT CONTEXT
    // =================================================

    const documentContext = await getPatientDocumentContext(req.user.id);

    // =================================================
    // CHAT HISTORY
    // =================================================

    const safeConversation = prepareConversationHistory(conversation, message);

    // =================================================
    // SYSTEM PROMPT
    // =================================================

    const systemPrompt = `
You are SwasthyaCare AI, a healthcare case-taking
assistant.

Your main task is to have a natural conversation with
the patient and collect useful information that can
later be included in a case summary for an authorized
doctor.

You are NOT a doctor.

Do not provide a confirmed diagnosis.

Do not prescribe medicines.

Do not provide medication dosages.

Do not create a treatment plan.


CURRENT PATIENT MESSAGE
=======================

The current patient message is the newest information.

Always understand the current message using the
previous conversation.

If the patient gives a short answer such as:

"yes"
"no"
"yesterday"
"at night"
"same"
"since then"

use the previous conversation to understand what
the patient means.

Do not repeat the question unnecessarily.


PATIENT LANGUAGE ADAPTATION
===========================

The patient's CURRENT MESSAGE is the strongest signal
for the language used in the response.

Stored patient language preference:
${preferredLanguageName}

Stored language code:
${languageCode}

IMPORTANT:

- Detect the language of the patient's CURRENT message.
- Respond in the same language whenever possible.
- If the patient switches language, switch your response
  language accordingly.
- Do not force the stored language preference when the
  current message clearly uses another language.
- If the patient uses mixed language or natural Hinglish,
  respond naturally in a similar style.
- Keep language simple and patient-friendly.
- Do not unnecessarily switch to English.


CLICKABLE OPTION LANGUAGE
=========================

Every option in the options array MUST use the SAME
language and natural communication style as the current
AI reply.

If the patient speaks Hindi:
- Reply in Hindi.
- Options must be Hindi.

If the patient speaks English:
- Reply in English.
- Options must be English.

If the patient speaks Hinglish:
- Reply naturally in Hinglish.
- Options should also be natural Hinglish.

Never use fixed English option labels for every patient.

Options should sound like natural patient answers.


CURRENT MODE
============

${selectedMode}


PATIENT-FACING AYURVEDA MODE
===========================

When Ayurveda mode is active, collect information
through simple, patient-friendly questions.

The patient does NOT need to know Ayurvedic terminology.

During normal case-taking DO NOT ask:

- What is your Prakriti?
- What is your Vikriti?
- What is your Sara?
- What is your Samhanana?
- What is your Pramana?
- What is your Satmya?
- What is your Sattva?
- What is your Ahara Shakti?
- What is your Vyayama Shakti?
- What is your Vaya?
- Are you Vata, Pitta or Kapha?

Do not mention Dashavidha Pariksha during normal
patient-facing conversation.

Instead, ask ordinary questions that naturally collect
the information needed for later doctor-facing
organization.


INFORMATION TO COLLECT
======================

CURRENT HEALTH PROBLEM

Collect naturally:

- main complaint
- body location
- onset
- duration
- severity
- progression
- aggravating factors
- relieving factors
- associated symptoms


GENERAL BODY CHARACTERISTICS

Gradually collect, when relevant:

- usual body build
- naturally thin, medium or broad build
- usual weight pattern
- whether weight changes easily or with difficulty
- general physical development
- general body proportions
- general strength


APPETITE AND DIGESTION

Ask naturally about:

- appetite
- hunger pattern
- digestion
- comfort after meals
- bloating
- heaviness
- acidity
- amount of food comfortably eaten


FOOD AND DIET

Ask about:

- usual foods
- meal timings
- foods the patient prefers
- foods that suit the patient
- foods that cause discomfort
- food tolerance
- dietary habits


SLEEP

When relevant ask about:

- sleeping time
- sleep duration
- difficulty falling asleep
- waking during sleep
- early waking
- feeling rested after sleep


PHYSICAL ACTIVITY

Ask about:

- daily activity
- exercise
- exercise frequency
- stamina
- tiredness
- ability to continue physical activity


STRESS AND MENTAL WELL-BEING

When relevant ask about:

- current stress
- mood
- concentration
- ability to handle daily stress
- mental rest
- general emotional well-being

Do NOT make psychiatric diagnoses.


AGE / LIFE STAGE

Use recorded patient age when available.

Do not repeatedly ask for age if it is already available.


IMPORTANT QUESTION RULE
=======================

Ask ONE relevant question at a time.

Do not ask a long questionnaire.

Do not repeat information already provided.

Prioritize the most useful missing information.

Keep the conversation natural.


INTERNAL ORGANIZATION
=====================

The patient answers may later be organized into
doctor-facing Ayurvedic fields.

Examples:

"Naturally thin and difficult to gain weight"
may provide general body-build information.

"I usually feel comfortable in cool weather"
may provide general characteristic information.

"I usually have a good appetite and can eat normal
meals comfortably"
may provide appetite and meal-capacity information.

"I exercise regularly and have good stamina"
may provide physical-activity information.

"I sleep around seven hours and wake rested"
provides sleep information.

"I get stressed during exams but can usually
concentrate"
provides stress and concentration information.

However:

- Do NOT automatically diagnose Prakriti.
- Do NOT automatically diagnose Vikriti.
- Do NOT automatically assign Vata, Pitta or Kapha.
- Do NOT treat one isolated observation as a confirmed
  Ayurvedic finding.
- Use multiple relevant observations when organizing
  doctor-facing information.


DOCTOR-FACING AYURVEDIC ORGANIZATION
====================================

The final case summary may contain:

- Prakriti
- Vikriti
- Sara
- Samhanana
- Pramana
- Satmya
- Sattva
- Ahara Shakti
- Vyayama Shakti
- Vaya
- Vata
- Pitta
- Kapha

These terms are for the doctor-facing summary only.

Never expose these technical terms to the patient
during normal case-taking unless the patient specifically
asks about them.

Never guess an Ayurvedic finding.

Never assign Prakriti from one symptom.

Never assign Vikriti from one symptom.

Never assign Vata, Pitta or Kapha from one isolated
symptom.

The final summary must distinguish:

1. Information directly reported by the patient.
2. AI-organized observations.

If the available information is insufficient for a field,
the final summary must say:

"Not sufficiently assessed"


ALLOPATHY MODE
==============

When Allopathy mode is active, ask about:

- symptoms
- duration
- relevant medical history
- current medicines
- allergies
- investigations
- current reports
- lifestyle

Do not diagnose.

Do not prescribe.

Do not provide medication dosages.

Do not tell the patient to start, stop or change
prescribed medication.


CURRENT SUBMITTED DOCUMENTS
===========================

${documentContext.text}


DOCUMENT SAFETY
===============

OCR may contain errors.

Be careful with:

- numbers
- units
- dates
- medicine names
- test names
- handwritten information

Never invent missing information.

Never silently correct OCR values.

If information is unclear, say that the original
document should be checked.


DYNAMIC CASE-TAKING OPTIONS
===========================

Clickable options must be generated dynamically.

Do NOT use a fixed questionnaire.

Do NOT show options on the initial welcome message.

Options should start only AFTER the patient has
provided their main problem or symptom and the AI
asks a relevant follow-up question.

Generate short clickable answers whenever suitable.

The question must be inside "reply".

Clickable answers must be inside "options".


OPTIONS RULES
=============

- Return 3 to 6 options when useful.
- Maximum 8 options.
- Keep options short.
- Do not create options for open-ended questions when
  they would not be useful.
- When options are unsuitable, return options as [].
- Use "single" when one answer should be selected.
- Use "multiple" only when multiple answers make sense.
- Never force options.
- Never duplicate options.
- Never include option numbers.
- Options MUST match the patient's current language.


CONVERSATION FLOW
=================

Ayurveda:

1. Chief Complaint
2. Clinical History
3. Patient-friendly general body questions
4. Appetite and digestion
5. Food and diet
6. Sleep
7. Physical activity
8. Stress and daily routine
9. Current submitted records

Allopathy:

1. Chief Complaint
2. History
3. Medical History
4. Current Submitted Records

Do not ask all questions at once.

Ask one relevant question at a time.


CONVERSATION RULES
==================

1. Read previous conversation.

2. Understand current message in context.

3. Detect current language.

4. Respond in current language/style.

5. Match clickable options to that language/style.

6. Do not ask for information already provided.

7. Do not repeat questions unnecessarily.

8. Respond specifically to latest message.

9. Ask at most ONE follow-up question.

10. Keep response short and natural.

11. If patient asks a general health question,
answer it instead of forcing case-taking.

12. If patient asks about a submitted document,
use available document information carefully.

13. Never invent information.

14. When enough information has been collected,
tell the patient that the information can be used
to prepare a case summary for patient review.


RED FLAG DETECTION
==================

Screen the CURRENT message and CURRENT conversation
for potentially serious warning signs.

This is safety screening, NOT diagnosis.

If potentially serious warning information is reported:

- Set redFlagDetected to true.
- Set redFlagLevel to "High" or "Moderate".
- Give short factual reasons.
- Recommend prompt professional medical evaluation.
- If immediately urgent, advise seeking emergency
  medical help now.
- Do not diagnose.
- Do not prescribe.
- Do not provide dosages.
- Do not tell the patient to stop or change prescribed
  medicines.
- Do not exaggerate.
- Do not invent symptoms.

Examples include:

- severe or rapidly worsening symptoms
- serious breathing difficulty
- severe chest-related symptoms
- loss of consciousness
- major change in awareness
- sudden severe neurological symptoms
- uncontrolled or significant bleeding
- severe allergic-type symptoms
- serious injury or trauma
- other symptoms reasonably suggesting prompt
  professional evaluation

Do not classify something as a red flag merely because
it could theoretically occur in a serious disease.

Only use information actually supported by the current
message or conversation.

If a red flag is detected, prioritize the safety warning
over ordinary case-taking.

If no warning sign is supported:

- redFlagDetected false
- redFlagLevel None
- redFlagReasons []


SAFETY
======

You are an AI assistant, not a doctor.

Do not provide confirmed diagnosis.

Do not prescribe medicines.

Do not provide medication dosages.

Do not tell the patient to stop or change prescribed
medication.

If potentially serious symptoms are described,
recommend prompt professional medical attention.


COMMUNICATION STYLE
===================

Keep responses:

- short
- simple
- clear
- respectful
- conversational
- easy to understand

Patient name:
${patient.fullName || "Patient"}

Your purpose is to collect and organize information
for an authorized healthcare professional.


OUTPUT FORMAT
=============

Return valid JSON only.

Use exactly:

{
  "reply": "Your natural response to the patient",
  "options": [],
  "questionType": "none",
  "redFlagDetected": false,
  "redFlagLevel": "None",
  "redFlagReasons": []
}

Possible questionType:

- none
- single
- multiple

Possible redFlagLevel:

- None
- Moderate
- High

If redFlagDetected is true:

- redFlagLevel must be Moderate or High.
- redFlagReasons must contain factual reasons.

If redFlagDetected is false:

- redFlagLevel must be None.
- redFlagReasons must be [].

The reply and every option MUST use the patient's
CURRENT language/style.

Do not include Markdown.

Do not include code fences.

Do not include explanations outside the JSON object.
`;

    // =================================================
    // BUILD MESSAGES
    // =================================================

    const messages = [
      {
        role: "system",
        content: systemPrompt,
      },

      ...safeConversation,

      {
        role: "user",
        content: message.trim(),
      },
    ];

    // =================================================
    // GROQ CHAT
    // =================================================

    const completion = await groq.chat.completions.create({
      model: "openai/gpt-oss-120b",

      messages,

      temperature: 0.3,

      max_completion_tokens: 500,

      response_format: {
        type: "json_object",
      },
    });

    // =================================================
    // RAW AI RESPONSE
    // =================================================

    const rawAIResponse = completion.choices[0]?.message?.content?.trim() || "";

    // =================================================
    // PARSE RESPONSE
    // =================================================

    const aiResult = parseRedFlagResponse(rawAIResponse);

    // =================================================
    // SAVE RED FLAG
    // =================================================

    const savedTokenCase = await saveRedFlagToActiveCase({
      patientId: req.user.id,

      redFlagDetected: aiResult.redFlagDetected,

      redFlagLevel: aiResult.redFlagLevel,

      redFlagReasons: aiResult.redFlagReasons,
    });

    // =================================================
    // RESPONSE
    // =================================================

    return res.status(200).json({
      success: true,

      reply: aiResult.reply,

      options: aiResult.options,

      questionType: aiResult.questionType,

      mode: selectedMode,

      language: languageCode,

      redFlagDetected: aiResult.redFlagDetected,

      redFlagLevel: aiResult.redFlagLevel,

      redFlagReasons: aiResult.redFlagReasons,

      redFlagCheckedAt: savedTokenCase?.redFlagCheckedAt
        ? savedTokenCase.redFlagCheckedAt.toISOString()
        : null,

      documentsAvailable: documentContext.documents.length > 0,

      conversationMessagesUsed: safeConversation.length,
    });
  } catch (error) {
    console.error("Groq Chatbot Error:", error);

    return res.status(500).json({
      success: false,

      reply: "Sorry, something went wrong. Please try again.",

      options: [],

      questionType: "none",

      redFlagDetected: false,

      redFlagLevel: "None",

      redFlagReasons: [],
    });
  }
};

// =====================================================
// 2. GENERATE + SAVE AI CASE SUMMARY
// =====================================================

export const generateCaseSummary = async (req, res) => {
  try {
    // =================================================
    // AUTHENTICATION
    // =================================================

    if (!req.user?.id || req.user.role !== "patient") {
      return res.status(403).json({
        success: false,
        message: "Only logged-in patients can generate a case summary.",
      });
    }

    // =================================================
    // REQUEST DATA
    // =================================================

    const {
      tokenCaseId = null,
      symptoms,
      duration,
      prakriti,
      age,
      gender,
      history,
      reports,
      conversation,
      mode = "ayurveda",
    } = req.body;

    // =================================================
    // EXTRACT PATIENT MESSAGES
    // =================================================

    const extractedSymptomsFromConversation = Array.isArray(conversation)
      ? conversation
          .filter(
            (item) =>
              item &&
              typeof item.text === "string" &&
              item.text.trim() &&
              (item.sender === "user" || item.role === "user"),
          )
          .map((item) => item.text.trim())
          .join("\n")
      : "";

    const normalizedSymptoms =
      typeof symptoms === "string"
        ? symptoms.trim()
        : Array.isArray(symptoms)
          ? symptoms.filter(Boolean).join(", ")
          : "";

    const finalSymptoms =
      normalizedSymptoms || extractedSymptomsFromConversation || "";

    // =================================================
    // GET PATIENT
    // =================================================

    const patient = await Patient.findById(req.user.id).select(
      "fullName languagePreference abhaId dob gender mobile",
    );

    if (!patient) {
      return res.status(404).json({
        success: false,
        message: "Patient account not found.",
      });
    }

    // =================================================
    // GET CURRENT ACTIVE CASE
    // =================================================

    let activeTokenCase = null;

    if (tokenCaseId) {
      activeTokenCase = await TokenCase.findOne({
        _id: tokenCaseId,
        patientId: req.user.id,
      }).select("hospitalName department tokenNumber crNumber aiCaseEnquiry");
    }

    if (!activeTokenCase) {
      const latestAppointment = await Appointment.findOne({
        patientId: req.user.id,

        status: {
          $in: ["Pending", "Accepted"],
        },

        tokenCaseId: {
          $ne: null,
        },
      })
        .sort({
          requestDate: -1,
          createdAt: -1,
        })
        .select("tokenCaseId");

      if (latestAppointment?.tokenCaseId) {
        activeTokenCase = await TokenCase.findOne({
          _id: latestAppointment.tokenCaseId,
          patientId: req.user.id,
        }).select("hospitalName department tokenNumber crNumber aiCaseEnquiry");
      }
    }

    // =================================================
    // CURRENT DOCUMENTS
    // =================================================

    const documentContext = await getPatientDocumentContext(req.user.id);

    // =================================================
    // VALIDATE CURRENT INPUT
    // =================================================

    const hasSymptoms = finalSymptoms.trim().length > 0;

    const hasConversation = Array.isArray(conversation)
      ? conversation.some(
          (item) => item && typeof item.text === "string" && item.text.trim(),
        )
      : typeof conversation === "string" && conversation.trim().length > 0;

    const userMessageCount = Array.isArray(conversation)
      ? conversation.filter(
          (item) =>
            item &&
            typeof item.text === "string" &&
            item.text.trim() &&
            (item.sender === "user" || item.role === "user"),
        ).length
      : 0;

    const hasReports = typeof reports === "string" && reports.trim().length > 0;

    const hasUploadedDocuments =
      documentContext.documents.length > 0 &&
      documentContext.text &&
      !documentContext.text.startsWith("Submitted documents were found");

    if (userMessageCount < 8) {
      return res.status(400).json({
        success: false,
        message:
          "At least 8 patient chat messages are required before generating a summary.",
      });
    }

    if (
      !hasSymptoms &&
      !hasConversation &&
      !hasReports &&
      !hasUploadedDocuments
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Current patient information, conversation, or submitted reports are required.",
      });
    }

    // =================================================
    // LANGUAGE
    // =================================================

    const languageCode = patient.languagePreference || "en";

    const languageName = resolveLanguageName(languageCode);

    // =================================================
    // MODE
    // =================================================

    const selectedMode = mode === "allopathy" ? "Allopathy" : "Ayurveda";

    // =================================================
    // CURRENT CONVERSATION
    // =================================================

    const conversationText = prepareSummaryConversation(conversation);

    // =================================================
    // CURRENT REPORTS
    // =================================================

    const uploadedReportText = documentContext.text;

    const frontendReports =
      reports || "No additional current report information provided.";

    // =================================================
    // SUMMARY FORMAT + RULES
    // =================================================

    let summaryFormat = "";
    let modeRules = "";

    // =================================================
    // ALLOPATHY
    // =================================================

    if (selectedMode === "Allopathy") {
      summaryFormat = `
ALLOPATHIC MODE — PATIENT SUMMARY

Patient: [Patient name] | Age: [Age] | Gender: [Gender]
ABHA: [ABHA if available] | CR/UHID: [CR/UHID if available] | Token: [Token if available]
Department: [Department if available] | Date: [Current date]

Chief Complaint
[Main complaint reported by the patient]

History
Onset/Duration: [Information]
Location: [Information]
Character: [Information]
Severity: [Information]
Progression: [Information]
Aggravating/Relieving: [Information]
Associated Symptoms: [Information]

Medical History
Past Illness/Surgery: [Information]
Allergies: [Information]
Medications: [Information]
Family/Personal History: [Information]

Current Submitted Records
Diagnosis: [Only if explicitly documented in current submitted reports]
Investigations: [Current investigations]
Key Findings: [Important current report findings]

Key Patient-Reported Findings
[Important information directly reported by the patient]

Doctor Review / Notes
[Reserved for doctor]

Note: AI-generated summary from patient-provided information and records; not a diagnosis or prescription.
`;

      modeRules = `
ALLOPATHIC SUMMARY RULES:

- Use only current consultation information.
- Use current submitted reports only.
- Do not create a diagnosis.
- If a diagnosis exists in a submitted report,
  report it only as a documented finding.
- Do not prescribe medicines.
- Do not provide dosages.
- Do not recommend changing medication.
- Do not invent medical history.
- Do not invent examination findings.
- Do not invent investigation values.
`;
    }

    // =================================================
    // AYURVEDA
    // =================================================
    else {
      summaryFormat = `
AYURVEDA MODE — DOCTOR REVIEW SUMMARY

Patient: [Patient name] | Age: [Age] | Gender: [Gender]
ABHA: [ABHA if available] | CR/UHID: [CR/UHID if available] | Token: [Token if available]
Department: [Department if available] | Date: [Current date]

Chief Complaint
[Main complaint reported by the patient]

Clinical History
Onset/Duration: [Information]
Location: [Information]
Nature/Severity: [Information]
Associated Symptoms: [Information]
Aggravating/Relieving Factors: [Information]

Dashavidha Pariksha
Prakriti: [Information]
Vikriti: [Information]
Sara: [Information]
Samhanana: [Information]
Pramana: [Information]
Satmya: [Information]
Sattva: [Information]
Ahara Shakti: [Information]
Vyayama Shakti: [Information]
Vaya: [Information]

Dosha-Related Observations
Vata: [Information]
Pitta: [Information]
Kapha: [Information]

Ahara–Vihara
Diet: [Information]
Digestion: [Information]
Sleep: [Information]
Exercise: [Information]
Daily Routine: [Information]
Stress / Mental State: [Information]

Current Submitted Records
Diagnosis/Findings: [Only information explicitly documented in current submitted reports]
Medications/Treatment: [Only information explicitly documented in current submitted reports or current conversation]

Key Findings
[Important patient-reported information and relevant findings from current submitted reports]

Doctor Review / Notes
[Reserved for doctor]

Note: AI-generated summary from patient-provided information and records; not a diagnosis or prescription.
`;

      modeRules = `
AYURVEDA SUMMARY RULES:

This is a DOCTOR-FACING organizational summary.

The patient-facing conversation did NOT ask the
patient to provide Ayurvedic technical terminology.

Instead, the current conversation contains ordinary
patient answers.

Your job is to organize those ordinary answers into
the appropriate doctor-facing Ayurvedic fields.

MANDATORY DASHAVIDHA PARIKSHA FIELDS:

1. Prakriti
2. Vikriti
3. Sara
4. Samhanana
5. Pramana
6. Satmya
7. Sattva
8. Ahara Shakti
9. Vyayama Shakti
10. Vaya


HOW TO ORGANIZE PATIENT INFORMATION
===================================

Prakriti:

Use ONLY multiple consistent observations about the
patient's usual or long-term baseline characteristics.

Potential supporting information can include:

- usual body build
- usual weight tendency
- usual energy
- usual temperature preference
- long-term appetite pattern
- long-term sleep pattern
- long-term physical characteristics
- other consistent baseline characteristics

Do NOT determine Prakriti from one symptom.

Do NOT automatically label the patient Vata, Pitta
or Kapha.

If the baseline information is insufficient:

Prakriti: Not sufficiently assessed


Vikriti:

Vikriti relates to CURRENT changes from the patient's
usual condition.

Use current reported changes such as:

- appetite changes
- digestion changes
- sleep changes
- bowel changes
- energy changes
- current symptoms
- current stress
- changes from normal routine
- current complaint pattern

Do NOT invent a Vikriti.

If insufficient:

Vikriti: Not sufficiently assessed


Sara:

Use only information that actually describes general
tissue quality, nourishment or physical robustness
when the patient has provided such information.

Do NOT infer Sara merely from weight or one symptom.

If not sufficiently described:

Sara: Not sufficiently assessed


Samhanana:

Use only explicit information about body structure,
physical build, body proportions or structural
characteristics.

Do NOT infer detailed body structure from a vague
statement.

If insufficient:

Samhanana: Not sufficiently assessed


Pramana:

Use only actual measurements or explicitly reported
body dimensions.

Examples:

- height
- weight
- circumference
- other explicitly provided measurements

NEVER calculate or invent measurements.

If measurements are not sufficiently available:

Pramana: Not sufficiently assessed


Satmya:

Use information about food and lifestyle tolerance
when explicitly provided.

Relevant information can include:

- foods that suit the patient
- foods that cause discomfort
- dietary tolerance
- usual dietary habits
- lifestyle compatibility

Do NOT assume tolerance.

If insufficient:

Satmya: Not sufficiently assessed


Sattva:

Use only patient-reported information related to:

- stress handling
- concentration
- emotional response
- mental resilience
- ability to manage ordinary stress
- general mental well-being

Do NOT make psychiatric diagnoses.

Do NOT label mental strength from one statement.

If insufficient:

Sattva: Not sufficiently assessed


Ahara Shakti:

Use information about:

- appetite
- hunger
- meal capacity
- digestive comfort
- ability to consume meals
- food-related tolerance when relevant

Do NOT infer digestive capacity without evidence.

If insufficient:

Ahara Shakti: Not sufficiently assessed


Vyayama Shakti:

Use information about:

- physical activity
- exercise
- stamina
- ability to continue activity
- tiredness during activity
- exercise frequency

Do NOT invent exercise capacity.

If insufficient:

Vyayama Shakti: Not sufficiently assessed


Vaya:

Use the patient's recorded age or explicitly provided
age/life-stage information.

Do NOT guess age.

If age is unavailable:

Vaya: Not sufficiently assessed


DOSHA-RELATED OBSERVATIONS
==========================

Vata, Pitta and Kapha may be mentioned ONLY when
supported by multiple relevant observations.

Do NOT assign a Dosha merely because of one symptom.

Do NOT present an AI inference as a confirmed diagnosis.

Use wording such as:

"Observations may be consistent with..."

only when the available information genuinely supports
an observation.

If insufficient:

Vata: Not sufficiently assessed
Pitta: Not sufficiently assessed
Kapha: Not sufficiently assessed


IMPORTANT EVIDENCE RULE
======================

The patient's ordinary answers are the primary source
for Ayurvedic organization.

For example:

Patient:
"I am naturally thin and usually don't gain weight
easily."

This may contribute to baseline body-characteristic
information.

Patient:
"I usually sleep seven hours and wake up rested."

This contributes to sleep-related information but does
NOT by itself establish Prakriti.

Patient:
"I exercise five days a week and can continue for
about an hour without unusual tiredness."

This can support organization of Vyayama Shakti.

Patient:
"I usually eat normal meals comfortably and rarely
feel digestive discomfort."

This can support organization of Ahara Shakti.

Patient:
"Milk usually causes me discomfort."

This can support Satmya-related information.

Patient:
"My appetite has decreased since this problem started."

This may be relevant to Vikriti and Ahara Shakti.

Always distinguish between:

- patient-reported information
- AI-organized observation

Never invent missing details.


CRITICAL RULE FOR "NOT SUFFICIENTLY ASSESSED"
=============================================

Do NOT automatically write "Not sufficiently assessed"
just because the patient did not use Ayurvedic terminology.

The patient is NOT expected to know Ayurvedic terminology.

Look through the ENTIRE CURRENT conversation and
organize ordinary answers into the appropriate fields.

Only write:

"Not sufficiently assessed"

when the current consultation genuinely lacks enough
information for that particular field.

Do not fill one field using information that belongs
to a different field.


DATA BOUNDARY
=============

Use ONLY:

1. Current patient chatbot conversation.
2. Current submitted medical documents.
3. Current case information supplied in this request.

Do NOT use:

- previous chatbot conversations
- previous consultations
- previous AI summaries
- old medical records
- automatically fetched ABDM/HIS history
- unrelated stored information

Do not invent missing information.


SAFETY
======

This is an organizational summary for professional review.

It is NOT a diagnosis.

Do not create a treatment plan.

Do not prescribe medicines.

Do not recommend herbs or therapies as treatment.

Do not provide medication dosages.

The final summary must be reviewed by an authorized
doctor.
`;
    }

    // =================================================
    // FINAL SUMMARY PROMPT
    // =================================================

    const prompt = `
You are generating a patient case summary for
SwasthyaCare.

The summary will be reviewed by the patient before
it is shared with an authorized doctor.

CURRENT AI MODE:
${selectedMode}

PATIENT LANGUAGE:
${languageName}


IMPORTANT DATA BOUNDARY
======================

Use ONLY:

1. The patient's CURRENT chatbot conversation.
2. Reports/documents submitted for the CURRENT consultation.
3. Current case information explicitly supplied below.

Do NOT use:

- Previous chatbot conversations.
- Previous AI consultations.
- Previous case summaries.
- Old medical records.
- Automatically fetched ABDM/HIS history.
- Unrelated stored patient information.

ABHA, CR/UHID and Token are identifiers.

They do NOT authorize retrieval or inference of
additional medical information.

If general information is missing, write:

"Not provided"

For Ayurveda Dashavidha Pariksha fields, follow the
specific "Not sufficiently assessed" rule.


${modeRules}


REPORT/OCR SAFETY
=================

Submitted report text may contain OCR errors.

Pay special attention to:

- numbers
- units
- dates
- medicine names
- laboratory values
- test names

Never invent or modify a value.

If information is unclear, write:

"Could not be verified from the submitted report."

Do not silently correct OCR.


SUMMARY FORMAT
==============

Use EXACTLY this format:

${summaryFormat}


FORMATTING RULES
================

1. Keep section headings exactly as shown.

2. Keep field names exactly as shown.

3. Do not add extra sections.

4. Do not add a diagnosis.

5. Do not add treatment recommendations.

6. Do not add prescriptions.

7. Do not add medical advice outside the summary.

8. Use "Not provided" for missing general information.

9. For Ayurveda Dashavidha Pariksha fields, use
   "Not sufficiently assessed" ONLY when the current
   consultation genuinely lacks sufficient evidence.

10. Do not include internal IDs.

11. Do not include database identifiers.

12. Do not include information from previous cases.

13. Keep the summary concise and doctor-readable.

14. "Doctor Review / Notes" must remain reserved
    for the doctor.

15. Keep the final Note exactly as provided.


CURRENT PATIENT INFORMATION
===========================

Patient Name:
${patient.fullName || "Not provided"}

Age:
${age || patient.dob || "Not provided"}

Gender:
${gender || patient.gender || "Not provided"}

Language:
${languageName}

Mode:
${selectedMode}


CURRENT CASE DETAILS
====================

Hospital / Clinic:
${activeTokenCase?.hospitalName || "Not provided"}

Department:
${activeTokenCase?.department || "Not provided"}

Token Number:
${activeTokenCase?.tokenNumber || "Not provided"}

CR / UHID:
${activeTokenCase?.crNumber || "Not provided"}

ABHA ID / Number:
${patient.abhaId || "Not provided"}


CURRENT AI CASE ENQUIRY
=======================

Prakriti field:
${activeTokenCase?.aiCaseEnquiry?.prakriti || "Not provided"}

Symptoms:
${
  Array.isArray(activeTokenCase?.aiCaseEnquiry?.symptoms)
    ? activeTokenCase.aiCaseEnquiry.symptoms.join(", ")
    : "Not provided"
}

Notes:
${activeTokenCase?.aiCaseEnquiry?.notes || "Not provided"}


CURRENT SYMPTOMS
================

${finalSymptoms || "Not provided"}


CURRENT DURATION
================

${duration || "Not provided"}


CURRENT PRAKRITI INFORMATION
============================

${prakriti || "Not provided"}


CURRENT MEDICAL HISTORY
=======================

${history || "Not provided"}


CURRENT CHATBOT CONVERSATION
============================

${conversationText}


CURRENT SUBMITTED MEDICAL DOCUMENTS
===================================

${uploadedReportText}


CURRENT ADDITIONAL REPORT INFORMATION
=====================================

${frontendReports}


FINAL INSTRUCTION
=================

Generate ONLY the requested ${selectedMode} summary.

For Ayurveda mode:

IMPORTANT:

The patient was intentionally asked ordinary,
non-Ayurvedic questions.

Therefore, analyze the patient's current conversation
carefully and organize the answers into the ten
Dashavidha Pariksha fields.

Do NOT require the patient to have explicitly said
"Prakriti", "Sara", "Satmya", etc.

Use the information that actually corresponds to each
field.

Do not force a value when evidence is insufficient.

Do not use one patient's statement to fill unrelated
fields.

Do not provide explanations before or after the summary.
`;

    // =================================================
    // GROQ SUMMARY
    // =================================================

    const completion = await groq.chat.completions.create({
      model: "openai/gpt-oss-120b",

      messages: [
        {
          role: "system",
          content: `
You are a safe healthcare case-summary assistant.

Generate structured summaries from ONLY the current
patient conversation and current submitted reports.

Never use previous cases or unrelated patient records.

Never invent information.

Never diagnose.

Never prescribe.

Never provide medication dosages.

Never create treatment plans.

For Ayurveda doctor-facing summaries, Ayurvedic
terminology may be used.

The patient-facing conversation uses ordinary language.

Your job is to organize the ordinary patient answers
into the appropriate doctor-facing Ayurvedic fields.

For the ten Dashavidha Pariksha fields:

Prakriti
Vikriti
Sara
Samhanana
Pramana
Satmya
Sattva
Ahara Shakti
Vyayama Shakti
Vaya

use current consultation evidence.

Do NOT require the patient to have explicitly used
Ayurvedic terminology.

Do NOT guess.

Do NOT fill a field simply because another field has
related information.

Use:

"Not sufficiently assessed"

only when that particular field genuinely lacks
sufficient information.

Never diagnose Prakriti.

Never diagnose Vikriti.

Never assign Vata, Pitta or Kapha from one isolated
symptom.

Clearly distinguish patient-reported information from
AI-organized observations.

The summary must be reviewed by an authorized doctor.

Follow the requested format exactly.
`,
        },

        {
          role: "user",
          content: prompt,
        },
      ],

      temperature: 0.2,

      max_completion_tokens: 1400,
    });

    // =================================================
    // GET SUMMARY
    // =================================================

    const summary =
      completion.choices[0]?.message?.content?.trim() ||
      "Unable to generate AI case summary.";

    const sanitizedSummary = sanitizeSummaryText(summary);

    // =================================================
    // FIND TOKEN CASE
    // =================================================

    let tokenCase = null;

    // -------------------------------------------------
    // OPTION 1: EXACT TOKEN CASE ID
    // -------------------------------------------------

    if (tokenCaseId) {
      tokenCase = await TokenCase.findOne({
        _id: tokenCaseId,
        patientId: req.user.id,
      });
    }

    // -------------------------------------------------
    // OPTION 2: LATEST ACTIVE APPOINTMENT
    // -------------------------------------------------

    if (!tokenCase) {
      const latestAppointment = await Appointment.findOne({
        patientId: req.user.id,

        status: {
          $in: ["Pending", "Accepted"],
        },

        tokenCaseId: {
          $ne: null,
        },
      })
        .sort({
          requestDate: -1,
          createdAt: -1,
        })
        .select("tokenCaseId");

      if (latestAppointment?.tokenCaseId) {
        tokenCase = await TokenCase.findOne({
          _id: latestAppointment.tokenCaseId,
          patientId: req.user.id,
        });
      }
    }

    // =================================================
    // CASE NOT FOUND
    // =================================================

    if (!tokenCase) {
      return res.status(404).json({
        success: false,

        message:
          "No active case was found. Please submit Case Taking before generating the AI summary.",
      });
    }

    // =================================================
    // GENERATED TIME
    // =================================================

    const generatedAt = new Date();

    // =================================================
    // SAVE AI SUMMARY
    // =================================================

    tokenCase.aiSummary = {
      overview: sanitizedSummary,

      ayushEvaluation: {
        prakritiProfile: typeof prakriti === "string" ? prakriti.trim() : "",
      },

      recommendations: "",

      additionalNotes: "AI-generated summary pending patient review.",

      fullSummary: sanitizedSummary,

      summaryLanguage: languageCode,

      summaryMode: mode === "allopathy" ? "allopathy" : "ayurveda",

      generatedAt,

      generatedBy: "AI",
    };

    // =================================================
    // SUMMARY STATUS
    // =================================================

    tokenCase.summaryStatus = "AI summary Available";

    tokenCase.aiSummaryStatus = "PendingReview";

    // =================================================
    // PATIENT REVIEW STATUS
    // =================================================

    tokenCase.summarySentForReviewAt = generatedAt;

    tokenCase.patientApproved = false;

    tokenCase.patientApprovedAt = null;

    tokenCase.approvedForDoctorSharing = false;

    tokenCase.patientReviewNote = "";

    // =================================================
    // SAVE CURRENT DOCUMENT REFERENCES
    // =================================================

    if (documentContext.documents.length > 0) {
      tokenCase.uploadedDocuments = documentContext.documents.map(
        (doc) => doc._id,
      );
    }

    // =================================================
    // SAVE TOKEN CASE
    // =================================================

    await tokenCase.save();

    // =================================================
    // RESPONSE
    // =================================================

    return res.status(200).json({
      success: true,

      summary: sanitizedSummary,

      generatedAt: generatedAt.toISOString(),

      generatedBy: "AI",

      status: "Pending Patient Review",

      aiSummaryStatus: tokenCase.aiSummaryStatus,

      patientApproved: tokenCase.patientApproved,

      approvedForDoctorSharing: tokenCase.approvedForDoctorSharing,

      mode: selectedMode,

      language: languageCode,

      tokenCaseId: tokenCase._id,

      documentsUsed: documentContext.documents.map((doc) => ({
        id: doc._id,
        name: doc.name,
        type: doc.type,
      })),
    });
  } catch (error) {
    console.error("Groq Case Summary Error:", error);

    return res.status(500).json({
      success: false,

      message: "Failed to generate AI case summary.",

      error: error.message,
    });
  }
};
