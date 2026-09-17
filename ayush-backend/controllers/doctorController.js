import mongoose from "mongoose";
import Groq from "groq-sdk";

import Doctor from "../models/Doctor.js";
import Patient from "../models/Patient.js";
import TokenCase from "../models/TokenCase.js";
import Document from "../models/Document.js";
import Appointment from "../models/Appointment.js";

/*
  ========================================
  GROQ AI
  ========================================
*/

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY,
});

/*
  ========================================
  FIND DOCTOR FROM LOGIN IDENTIFIER
  ========================================
*/

const findDoctorByIdentifier = async (identifier) => {
  if (!identifier || typeof identifier !== "string") {
    return null;
  }

  const value = identifier.trim();

  if (!value) {
    return null;
  }

  return await Doctor.findOne({
    $or: [
      { mobile: value },
      { email: value.toLowerCase() },
      { regNumber: value },
    ],
  });
};

/*
  ========================================
  GET DOCTOR IDENTIFIER
  ========================================
*/

const getDoctorIdentifier = (req) => {
  return (
    req.query.identifier ||
    req.query.doctorIdentifier ||
    req.body?.identifier ||
    req.headers["x-doctor-identifier"] ||
    ""
  );
};

/*
  ========================================
  CHECK VALID MONGODB ID
  ========================================
*/

const isValidObjectId = (id) => {
  return mongoose.Types.ObjectId.isValid(id);
};

/*
  ========================================
  SANITIZE AI SUMMARY
  ========================================
*/

const sanitizeSummaryText = (text) => {
  if (typeof text !== "string") {
    return text;
  }

  let sanitized = text
    .replace(/\r/g, "")
    .replace(/^\s*#{1,6}\s*/gm, "")
    .replace(/^\s*[-*•]\s*/gm, "")
    .replace(/^\s*\d+\.\s*/gm, "")
    .replace(/\*\*/g, "")
    .replace(
      /(Case Overview|Symptoms Reported|Relevant History|Report Information|Prakriti Profile|Important Observations|AYUSH Considerations|Points for Doctor Review|Safety Note)\s*:?/gi,
      "",
    )
    .replace(/\s*#\s*/g, " ")
    .replace(/\n+/g, " ")
    .replace(/\s{2,}/g, " ")
    .trim();

  sanitized = sanitized.replace(
    /(^|\s)(Patient ID|Case ID|Token Number|Token #|Token ID|ABHA ID|ABHA Number|Case No\.?|Token No\.?):[^\n]*(?=\s|$)/gim,
    "$1",
  );

  sanitized = sanitized.replace(/\s{2,}/g, " ").trim();

  return sanitized;
};

/*
  ========================================
  CHECK PATIENT DATA CONSENT
  ========================================
*/

const hasConfirmedConsent = (patientCase) => {
  return patientCase?.dataConsent?.status === "Confirmed";
};

/*
  ========================================
  GET DOCTOR DASHBOARD
  ========================================
*/

export const getDoctorDashboard = async (req, res) => {
  try {
    const identifier = getDoctorIdentifier(req);

    if (!identifier) {
      return res.status(400).json({
        success: false,
        message: "Doctor identifier is required.",
      });
    }

    const doctor = await findDoctorByIdentifier(identifier);

    if (!doctor) {
      return res.status(404).json({
        success: false,
        message: "Doctor not found.",
      });
    }

    const doctorId = doctor._id;

    /*
      ========================================
      TODAY DATE RANGE
      ========================================
    */

    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);

    const endOfToday = new Date();
    endOfToday.setHours(23, 59, 59, 999);

    /*
      ========================================
      DOCTOR CASES
      ========================================
    */

    const doctorCases = await TokenCase.find({
      doctorId,
    })
      .populate(
        "patientId",
        "fullName mobile email dob gender abhaId languagePreference",
      )
      .populate(
        "uploadedDocuments",
        "patientId name type doctorName fileUrl uploadDate",
      )
      .sort({ createdAt: -1 });

    /*
      ========================================
      TODAY'S APPOINTMENTS
      ========================================
    */

    const todayAppointments = await Appointment.find({
      doctorId,
      appointmentDate: {
        $gte: startOfToday,
        $lte: endOfToday,
      },
    })
      .populate("patientId", "fullName mobile email dob gender abhaId")
      .populate(
        "tokenCaseId",
        "tokenNumber crNumber department summaryStatus doctorAction dataConsent",
      )
      .sort({ appointmentTime: 1 });

    /*
      ========================================
      TOTAL UNIQUE PATIENTS
      ========================================
    */

    const totalPatients = new Set(
      doctorCases
        .filter((item) => item.patientId)
        .map((item) => item.patientId._id.toString()),
    ).size;

    /*
      ========================================
      PENDING CASES
      ========================================
    */

    const pendingCases = doctorCases.filter(
      (item) => item.doctorAction === "Pending",
    ).length;

    /*
      ========================================
      ACCEPTED CASES
      ========================================
    */

    const completedCases = doctorCases.filter(
      (item) => item.doctorAction === "Accepted",
    ).length;

    /*
      ========================================
      AI SUMMARIES
      ========================================
    */

    const sharedSummaryCases = doctorCases.filter(
      (item) =>
        item.patientApproved === true &&
        item.approvedForDoctorSharing === true &&
        item.summaryStatus === "AI summary Available" &&
        Boolean(item.aiSummary?.fullSummary),
    );

    const availableAiSummaries = sharedSummaryCases.length;

    /*
      ========================================
      LATEST APPROVED SUMMARY
      ========================================
    */

    const latestApprovedSummaryCase = [...doctorCases]
      .filter(
        (item) =>
          item.doctorAction === "Accepted" &&
          item.approvedForDoctorSharing === true &&
          item.aiSummary?.fullSummary,
      )
      .sort(
        (a, b) =>
          new Date(b.aiSummary?.generatedAt || b.createdAt) -
          new Date(a.aiSummary?.generatedAt || a.createdAt),
      )[0];

    /*
      ========================================
      RESPONSE
      ========================================
    */

    return res.status(200).json({
      success: true,

      doctor: {
        id: doctor._id,
        fullName: doctor.fullName,
        mobile: doctor.mobile,
        email: doctor.email || "",
        specialization: doctor.specialization || "Ayurveda",
        degree: doctor.degree || "",
        regNumber: doctor.regNumber || "",
        hospitalClinic: doctor.hospitalClinic || "",
        department: doctor.department || "",
      },

      stats: {
        totalPatients,
        pendingCases,
        completedCases,
        availableAiSummaries,
        todayAppointments: todayAppointments.length,
      },

      todayAppointments,

      appointments: todayAppointments,

      recentCases: sharedSummaryCases.slice(0, 10).map((patientCase) => ({
        _id: patientCase._id,

        patient: patientCase.patientId
          ? {
              id: patientCase.patientId._id,
              fullName: patientCase.patientId.fullName || "",
              mobile: patientCase.patientId.mobile || "",
              email: patientCase.patientId.email || "",
              dob: patientCase.patientId.dob || null,
              gender: patientCase.patientId.gender || "",
              abhaId: patientCase.patientId.abhaId || "",
              languagePreference:
                patientCase.patientId.languagePreference || "en",
            }
          : null,

        hospitalName: patientCase.hospitalName,
        department: patientCase.department,
        tokenNumber: patientCase.tokenNumber,
        crNumber: patientCase.crNumber,
        doctorAction: patientCase.doctorAction,

        summaryStatus: patientCase.summaryStatus,

        dataConsent: patientCase.dataConsent || {
          status: "Pending",
          confirmedAt: null,
          sharedItems: [],
        },

        aiSummary: {
          overview: patientCase.aiSummary.fullSummary,
          summary: patientCase.aiSummary.fullSummary,
          generatedAt:
            patientCase.aiSummary.generatedAt || patientCase.createdAt,
          summaryStatus: patientCase.aiSummaryStatus || "Approved",
          patientApproved: true,
          approvedForDoctorSharing: true,
        },

        doctorEditedSummary: patientCase.doctorEditedSummary || "",

        summarySource: patientCase.summarySource || "AI",

        doctorEditedAt: patientCase.doctorEditedAt || null,

        createdAt: patientCase.createdAt,
      })),

      aiSummary: latestApprovedSummaryCase
        ? {
            caseId: latestApprovedSummaryCase._id,

            overview:
              latestApprovedSummaryCase.aiSummary?.fullSummary ||
              latestApprovedSummaryCase.aiSummary?.overview ||
              "",

            summary:
              latestApprovedSummaryCase.aiSummary?.fullSummary ||
              latestApprovedSummaryCase.aiSummary?.overview ||
              "",

            generatedAt:
              latestApprovedSummaryCase.aiSummary?.generatedAt ||
              latestApprovedSummaryCase.createdAt,

            summaryStatus:
              latestApprovedSummaryCase.aiSummaryStatus || "Approved",

            patientApproved: latestApprovedSummaryCase.patientApproved || false,

            approvedForDoctorSharing:
              latestApprovedSummaryCase.approvedForDoctorSharing || false,

            doctorEditedSummary:
              latestApprovedSummaryCase.doctorEditedSummary || "",

            summarySource: latestApprovedSummaryCase.summarySource || "AI",

            doctorEditedAt: latestApprovedSummaryCase.doctorEditedAt || null,

            patient: latestApprovedSummaryCase.patientId
              ? {
                  id: latestApprovedSummaryCase.patientId._id,
                  fullName: latestApprovedSummaryCase.patientId.fullName || "",
                  mobile: latestApprovedSummaryCase.patientId.mobile || "",
                  email: latestApprovedSummaryCase.patientId.email || "",
                  dob: latestApprovedSummaryCase.patientId.dob || null,
                  gender: latestApprovedSummaryCase.patientId.gender || "",
                  abhaId: latestApprovedSummaryCase.patientId.abhaId || "",
                  languagePreference:
                    latestApprovedSummaryCase.patientId.languagePreference ||
                    "en",
                }
              : null,
          }
        : null,
    });
  } catch (error) {
    console.error("Doctor Dashboard Error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to load doctor dashboard.",
      error: error.message,
    });
  }
};

/*
  ========================================
  GET DOCTOR PATIENTS
  ========================================
*/

export const getDoctorPatients = async (req, res) => {
  try {
    const identifier = getDoctorIdentifier(req);

    if (!identifier) {
      return res.status(400).json({
        success: false,
        message: "Doctor identifier is required.",
      });
    }

    const doctor = await findDoctorByIdentifier(identifier);

    if (!doctor) {
      return res.status(404).json({
        success: false,
        message: "Doctor not found.",
      });
    }

    const doctorId = doctor._id;

    const cases = await TokenCase.find({
      doctorId,
    })
      .populate("patientId", "fullName mobile email dob gender abhaId")
      .sort({ createdAt: -1 });

    const patientMap = new Map();

    for (const patientCase of cases) {
      if (!patientCase.patientId) {
        continue;
      }

      const patient = patientCase.patientId;

      const patientId = patient._id.toString();

      if (!patientMap.has(patientId)) {
        patientMap.set(patientId, {
          id: patient._id,
          fullName: patient.fullName || "",
          mobile: patient.mobile || "",
          email: patient.email || "",
          dob: patient.dob || null,
          gender: patient.gender || "",
          abhaId: patient.abhaId || "",

          latestCaseId: patientCase._id,

          latestCaseDate: patientCase.createdAt,

          summaryStatus: hasConfirmedConsent(patientCase)
            ? patientCase.summaryStatus || "AI summary Not available"
            : "AI summary Not available",

          latestCaseSummary:
            patientCase.aiSummary?.fullSummary ||
            patientCase.aiSummary?.overview ||
            patientCase.doctorEditedSummary ||
            "",

          doctorAction: patientCase.doctorAction || "Pending",

          consentStatus: patientCase.dataConsent?.status || "Pending",

          aiSummary:
            patientCase.aiSummary?.fullSummary ||
            patientCase.aiSummary?.overview ||
            patientCase.doctorEditedSummary ||
            "",

          approvedForDoctorSharing:
            patientCase.approvedForDoctorSharing || false,

          patientApproved: patientCase.patientApproved || false,
        });
      }
    }

    const patients = Array.from(patientMap.values());

    return res.status(200).json({
      success: true,
      totalPatients: patients.length,
      patients,
    });
  } catch (error) {
    console.error("Get Doctor Patients Error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch doctor patients.",
      error: error.message,
    });
  }
};

/*
  ========================================
  GET ONE PATIENT
  ========================================
*/

export const getDoctorPatientDetails = async (req, res) => {
  try {
    const identifier = getDoctorIdentifier(req);

    const { patientId } = req.params;

    if (!identifier) {
      return res.status(400).json({
        success: false,
        message: "Doctor identifier is required.",
      });
    }

    if (!isValidObjectId(patientId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid patient ID.",
      });
    }

    const doctor = await findDoctorByIdentifier(identifier);

    if (!doctor) {
      return res.status(404).json({
        success: false,
        message: "Doctor not found.",
      });
    }

    const doctorId = doctor._id;

    const patientCase = await TokenCase.findOne({
      patientId,
      doctorId,
    });

    if (!patientCase) {
      return res.status(403).json({
        success: false,
        message: "You are not authorized to access this patient.",
      });
    }

    const patient = await Patient.findById(patientId).select(
      "fullName mobile email dob gender abhaId languagePreference",
    );

    if (!patient) {
      return res.status(404).json({
        success: false,
        message: "Patient not found.",
      });
    }

    const cases = await TokenCase.find({
      patientId,
      doctorId,
    })
      .select(
        "hospitalName department tokenNumber crNumber doctorAction summaryStatus dataConsent createdAt aiSummary doctorEditedSummary summarySource doctorEditedAt uploadedDocuments approvedForDoctorSharing patientApproved",
      )
      .sort({
        createdAt: -1,
      });

    return res.status(200).json({
      success: true,

      patient: {
        id: patient._id,
        fullName: patient.fullName || "",
        mobile: patient.mobile || "",
        email: patient.email || "",
        dob: patient.dob || null,
        gender: patient.gender || "",
        abhaId: patient.abhaId || "",
        languagePreference: patient.languagePreference || "en",
      },

      cases,
    });
  } catch (error) {
    console.error("Get Patient Details Error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch patient details.",
      error: error.message,
    });
  }
};

/*
  ========================================
  GET ONE CASE
  ========================================
*/

export const getDoctorCaseDetails = async (req, res) => {
  try {
    const identifier = getDoctorIdentifier(req);

    const { caseId } = req.params;

    if (!identifier) {
      return res.status(400).json({
        success: false,
        message: "Doctor identifier is required.",
      });
    }

    if (!isValidObjectId(caseId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid case ID.",
      });
    }

    const doctor = await findDoctorByIdentifier(identifier);

    if (!doctor) {
      return res.status(404).json({
        success: false,
        message: "Doctor not found.",
      });
    }

    const doctorId = doctor._id;

    const patientCase = await TokenCase.findOne({
      _id: caseId,
      doctorId,
    })
      .populate(
        "patientId",
        "fullName mobile email dob gender abhaId languagePreference",
      )
      .populate(
        "uploadedDocuments",
        "patientId name type doctorName fileUrl uploadDate",
      );

    if (!patientCase) {
      return res.status(404).json({
        success: false,
        message: "Case not found or access denied.",
      });
    }

    if (!hasConfirmedConsent(patientCase)) {
      return res.status(403).json({
        success: false,
        message: "Patient data sharing consent has not been confirmed.",
        consentStatus: patientCase.dataConsent?.status || "Pending",
      });
    }

    return res.status(200).json({
      success: true,
      case: patientCase,
    });
  } catch (error) {
    console.error("Get Doctor Case Error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch case details.",
      error: error.message,
    });
  }
};

/*
  ========================================
  GET CASE DOCUMENTS
  ========================================
*/

export const getDoctorPatientDocuments = async (req, res) => {
  try {
    const identifier = getDoctorIdentifier(req);

    const { caseId } = req.params;

    if (!identifier) {
      return res.status(400).json({
        success: false,
        message: "Doctor identifier is required.",
      });
    }

    if (!isValidObjectId(caseId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid case ID.",
      });
    }

    const doctor = await findDoctorByIdentifier(identifier);

    if (!doctor) {
      return res.status(404).json({
        success: false,
        message: "Doctor not found.",
      });
    }

    const doctorId = doctor._id;

    const patientCase = await TokenCase.findOne({
      _id: caseId,
      doctorId,
    });

    if (!patientCase) {
      return res.status(403).json({
        success: false,
        message: "You are not authorized to access these documents.",
      });
    }

    if (!hasConfirmedConsent(patientCase)) {
      return res.status(403).json({
        success: false,
        message: "Patient data sharing consent has not been confirmed.",
        consentStatus: patientCase.dataConsent?.status || "Pending",
      });
    }

    const documentIds = patientCase.uploadedDocuments || [];

    if (documentIds.length === 0) {
      return res.status(200).json({
        success: true,
        totalDocuments: 0,
        documents: [],
      });
    }

    const documents = await Document.find({
      _id: {
        $in: documentIds,
      },

      patientId: patientCase.patientId,
    })
      .select(
        "_id patientId name type doctorName fileUrl uploadDate createdAt updatedAt",
      )
      .sort({
        uploadDate: -1,
      });

    return res.status(200).json({
      success: true,
      totalDocuments: documents.length,
      documents,
    });
  } catch (error) {
    console.error("Get Doctor Documents Error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch patient documents.",
      error: error.message,
    });
  }
};

/*
  ========================================
  ACCEPT OR REJECT CASE
  ========================================
*/

export const updateCaseAction = async (req, res) => {
  try {
    const { caseId } = req.params;

    const { action, identifier } = req.body;

    if (!identifier) {
      return res.status(400).json({
        success: false,
        message: "Doctor identifier is required",
      });
    }

    if (!["Accepted", "Rejected"].includes(action)) {
      return res.status(400).json({
        success: false,
        message: "Invalid action",
      });
    }

    if (!isValidObjectId(caseId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid case ID",
      });
    }

    const doctor = await findDoctorByIdentifier(identifier);

    if (!doctor) {
      return res.status(404).json({
        success: false,
        message: "Doctor not found",
      });
    }

    const patientCase = await TokenCase.findOne({
      _id: caseId,
      doctorId: doctor._id,
    });

    if (!patientCase) {
      return res.status(403).json({
        success: false,
        message: "You are not authorized to update this case",
      });
    }

    patientCase.doctorAction = action;

    await patientCase.save();

    await Appointment.updateMany(
      {
        tokenCaseId: patientCase._id,
        doctorId: doctor._id,
      },
      {
        $set: {
          status: action === "Accepted" ? "Accepted" : "Rejected",
        },
      },
    );

    return res.status(200).json({
      success: true,
      message: `Case ${action.toLowerCase()} successfully`,
      case: patientCase,
    });
  } catch (error) {
    console.error("Update case action error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to update case action",
      error: error.message,
    });
  }
};

/*
  ========================================
  SAVE DOCTOR NOTES
  ========================================
*/

export const updateDoctorNotes = async (req, res) => {
  try {
    const { caseId } = req.params;

    const { notes, identifier } = req.body;

    if (!identifier) {
      return res.status(400).json({
        success: false,
        message: "Doctor identifier is required",
      });
    }

    if (!isValidObjectId(caseId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid case ID",
      });
    }

    const doctor = await findDoctorByIdentifier(identifier);

    if (!doctor) {
      return res.status(404).json({
        success: false,
        message: "Doctor not found",
      });
    }

    const patientCase = await TokenCase.findOne({
      _id: caseId,
      doctorId: doctor._id,
    });

    if (!patientCase) {
      return res.status(403).json({
        success: false,
        message: "You are not authorized to update this case",
      });
    }

    patientCase.doctorNotes = notes || "";

    await patientCase.save();

    return res.status(200).json({
      success: true,
      message: "Doctor notes saved successfully",
      doctorNotes: patientCase.doctorNotes,
    });
  } catch (error) {
    console.error("Update doctor notes error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to save doctor notes",
      error: error.message,
    });
  }
};

/*
  ========================================
  GENERATE AI CASE SUMMARY
  ========================================
*/

export const generateDoctorCaseSummary = async (req, res) => {
  try {
    const { caseId } = req.params;

    const identifier = getDoctorIdentifier(req);

    /*
      ========================================
      VALIDATE DOCTOR IDENTIFIER
      ========================================
    */

    if (!identifier) {
      return res.status(400).json({
        success: false,
        message: "Doctor identifier is required.",
      });
    }

    /*
      ========================================
      VALIDATE CASE ID
      ========================================
    */

    if (!isValidObjectId(caseId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid case ID.",
      });
    }

    /*
      ========================================
      FIND DOCTOR
      ========================================
    */

    const doctor = await findDoctorByIdentifier(identifier);

    if (!doctor) {
      return res.status(404).json({
        success: false,
        message: "Doctor not found.",
      });
    }

    /*
      ========================================
      FIND ASSIGNED CASE
      ========================================
    */

    const patientCase = await TokenCase.findOne({
      _id: caseId,
      doctorId: doctor._id,
    }).populate(
      "patientId",
      "fullName mobile email dob gender abhaId languagePreference",
    );

    if (!patientCase) {
      return res.status(403).json({
        success: false,
        message: "You are not authorized to access this case.",
      });
    }

    /*
      ========================================
      CHECK DATA CONSENT
      ========================================
    */

    if (!hasConfirmedConsent(patientCase)) {
      return res.status(403).json({
        success: false,
        message:
          "Patient data sharing consent must be confirmed before generating an AI case summary.",
        consentStatus: patientCase.dataConsent?.status || "Pending",
      });
    }

    const patient = patientCase.patientId;

    if (!patient) {
      return res.status(404).json({
        success: false,
        message: "Patient not found.",
      });
    }

    /*
      ========================================
      CURRENT CASE ENQUIRY
      ========================================
    */

    const currentEnquiry = patientCase.aiCaseEnquiry || {};

    const symptoms = currentEnquiry.symptoms || "Not provided";
    const prakriti = currentEnquiry.prakriti || "Not provided";
    const duration = currentEnquiry.duration || "Not provided";
    const notes = currentEnquiry.notes || "Not provided";

    /*
      ========================================
      PREVIOUS AUTHORIZED CASES
      ========================================
    */

    const previousCases = await TokenCase.find({
      patientId: patient._id,
      doctorId: doctor._id,
      _id: {
        $ne: patientCase._id,
      },
      "dataConsent.status": "Confirmed",
    })
      .select(
        "tokenNumber crNumber hospitalName department doctorAction summaryStatus aiCaseEnquiry createdAt",
      )
      .sort({
        createdAt: -1,
      })
      .limit(10);

    let previousCaseData = "No previous authorized cases available.";

    if (previousCases.length > 0) {
      previousCaseData = previousCases
        .map((previousCase, index) => {
          const enquiry = previousCase.aiCaseEnquiry || {};

          return `
Previous Case ${index + 1}

Case ID:
${previousCase._id}

Token Number:
${previousCase.tokenNumber || "Not available"}

Hospital:
${previousCase.hospitalName || "Not available"}

Department:
${previousCase.department || "Not available"}

Date:
${previousCase.createdAt || "Not available"}

Symptoms:
${enquiry.symptoms || "Not available"}

Prakriti:
${enquiry.prakriti || "Not available"}

Notes:
${enquiry.notes || "Not available"}

Doctor Action:
${previousCase.doctorAction || "Not available"}
`;
        })
        .join("\n");
    }

    /*
      ========================================
      GET CURRENT CASE DOCUMENTS
      ========================================
    */

    let documents = [];

    if (
      patientCase.uploadedDocuments &&
      patientCase.uploadedDocuments.length > 0
    ) {
      documents = await Document.find({
        _id: {
          $in: patientCase.uploadedDocuments,
        },

        patientId: patient._id,
      })
        .select("_id name type doctorName uploadDate")
        .sort({
          uploadDate: -1,
        });
    }

    /*
      ========================================
      REPORT DATA
      ========================================
    */

    let reportData = "No uploaded reports available.";

    if (documents.length > 0) {
      reportData = documents
        .map(
          (document, index) => `
Report ${index + 1}

Name:
${document.name || "Not available"}

Type:
${document.type || "Not available"}

Doctor:
${document.doctorName || "Not available"}

Upload Date:
${document.uploadDate || "Not available"}
`,
        )
        .join("\n");
    }

    /*
      ========================================
      AI PROMPT
      ========================================
    */

    const prompt = `
You are an AI Health and Ayurveda Case Summary Assistant.

You are assisting an authorized doctor.

Create a concise, professional case summary using ONLY the information
provided below.

IMPORTANT SAFETY RULES:

- This is an AI-generated clinical support summary.
- Do NOT diagnose a disease.
- Do NOT claim that a disease is confirmed.
- Do NOT prescribe medicines.
- Do NOT recommend stopping or changing medicines.
- Ayurveda/AYUSH suggestions must be general considerations only.
- Do NOT invent symptoms, medical history, test results,
  report findings, or patient information.
- Clearly distinguish observations from diagnosis.
- Mention information requiring doctor review.
- If potentially serious symptoms are present, recommend
  appropriate medical evaluation.
- The doctor must review this AI-generated information
  before making clinical decisions.
- Do NOT include patient IDs, token IDs, ABHA IDs,
  case IDs, or token numbers anywhere in the summary.

PATIENT INFORMATION
===================

Name:
${patient.fullName || "Not provided"}

Age / Date of Birth:
${patient.dob || "Not provided"}

Gender:
${patient.gender || "Not provided"}

CURRENT CASE
============

Hospital / Clinic:
${patientCase.hospitalName || "Not provided"}

Department:
${patientCase.department || "Not provided"}

Symptoms:
${symptoms}

Duration:
${duration}

Prakriti:
${prakriti}

Case Notes:
${notes}

PREVIOUS AUTHORIZED CASES
=========================

${previousCaseData}

UPLOADED REPORTS
================

${reportData}

OUTPUT FORMAT
=============

Write the entire summary as one simple paragraph in clear medical prose.
Do not use headings, bullets, numbered lists, markdown, or characters like #.

The paragraph should briefly cover the case overview, reported symptoms,
relevant history, report information, Prakriti profile, important observations,
AYUSH considerations, points for doctor review, and a safety note.

Keep the summary concise and professional.
Do not include patient IDs, token IDs, ABHA IDs,
case IDs, or token numbers in the output.
`;

    /*
      ========================================
      CALL GROQ
      ========================================
    */

    const completion = await groq.chat.completions.create({
      model: "openai/gpt-oss-120b",

      messages: [
        {
          role: "system",
          content: `
You are a safe AI clinical-support assistant.

Generate factual, doctor-reviewable
case summaries.

Never provide a confirmed diagnosis.
Never prescribe medicines.
Never invent patient information.

Return only one plain paragraph with no headings,
no bullet points, no numbered lists, and no characters like #.
`,
        },

        {
          role: "user",
          content: prompt,
        },
      ],

      temperature: 0.3,
      max_completion_tokens: 900,
    });

    const summary = completion.choices[0]?.message?.content?.trim();

    if (!summary) {
      return res.status(500).json({
        success: false,
        message: "AI did not return a case summary.",
      });
    }

    const sanitizedSummary = sanitizeSummaryText(summary);

    /*
      ========================================
      SAVE AI SUMMARY
      ========================================
    */

    patientCase.aiSummary = {
      overview: sanitizedSummary,

      /*
        IMPORTANT:
        Store the complete AI summary in fullSummary
        so the doctor editor and frontend can use
        the same field consistently.
      */

      fullSummary: sanitizedSummary,

      ayushEvaluation: {
        prakritiProfile: prakriti,

        recommendations:
          "See the AI-generated summary for general AYUSH considerations.",
      },

      additionalNotes: "AI-generated summary. Doctor review required.",

      summaryLanguage: "en",

      summaryMode: "ayurveda",

      generatedAt: new Date(),

      generatedBy: "Groq AI",
    };

    patientCase.summaryStatus = "AI summary Available";

    /*
      When a fresh AI summary is generated,
      the doctor-edited version should be reset
      because the AI source has changed.
    */

    patientCase.doctorEditedSummary = "";

    patientCase.doctorEditedAt = null;

    patientCase.doctorEditedBy = null;

    patientCase.summarySource = "AI";

    await patientCase.save();

    /*
      ========================================
      RESPONSE
      ========================================
    */

    return res.status(200).json({
      success: true,

      message: "AI case summary generated successfully.",

      summary: sanitizedSummary,

      summaryStatus: patientCase.summaryStatus,

      generatedAt: patientCase.aiSummary.generatedAt,

      case: patientCase,
    });
  } catch (error) {
    console.error("Generate AI Case Summary Error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to generate AI case summary.",
      error: error.message,
    });
  }
};

/*
  ========================================
  GET DOCTOR EDITABLE SUMMARY
  ========================================
*/

export const getDoctorEditableSummary = async (req, res) => {
  try {
    const { caseId } = req.params;

    const identifier = getDoctorIdentifier(req);

    /*
      ========================================
      VALIDATE DOCTOR IDENTIFIER
      ========================================
    */

    if (!identifier) {
      return res.status(400).json({
        success: false,
        message: "Doctor identifier is required.",
      });
    }

    /*
      ========================================
      VALIDATE CASE ID
      ========================================
    */

    if (!isValidObjectId(caseId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid case ID.",
      });
    }

    /*
      ========================================
      FIND DOCTOR
      ========================================
    */

    const doctor = await findDoctorByIdentifier(identifier);

    if (!doctor) {
      return res.status(404).json({
        success: false,
        message: "Doctor not found.",
      });
    }

    /*
      ========================================
      FIND CASE
      ========================================
    */

    const patientCase = await TokenCase.findOne({
      _id: caseId,
      doctorId: doctor._id,
    });

    if (!patientCase) {
      return res.status(404).json({
        success: false,
        message: "Case not found or access denied.",
      });
    }

    /*
      ========================================
      CHECK DATA CONSENT
      ========================================
    */

    if (!hasConfirmedConsent(patientCase)) {
      return res.status(403).json({
        success: false,
        message: "Patient data sharing consent has not been confirmed.",
        consentStatus: patientCase.dataConsent?.status || "Pending",
      });
    }

    /*
      ========================================
      ORIGINAL AI SUMMARY
      ========================================
    */

    const aiSummary =
      patientCase.aiSummary?.fullSummary ||
      patientCase.aiSummary?.overview ||
      "";

    /*
      ========================================
      DOCTOR EDITED SUMMARY
      ========================================
    */

    const doctorEditedSummary = patientCase.doctorEditedSummary || "";

    /*
      ========================================
      SUMMARY TO DISPLAY
      ========================================
    */

    const editableSummary = doctorEditedSummary || aiSummary;

    /*
      ========================================
      RESPONSE
      ========================================
    */

    return res.status(200).json({
      success: true,

      caseId: patientCase._id,

      summary: {
        aiSummary,

        doctorEditedSummary,

        editableSummary,

        summarySource: patientCase.summarySource || "AI",

        doctorEditedAt: patientCase.doctorEditedAt || null,

        doctorEditedBy: patientCase.doctorEditedBy || null,
      },
    });
  } catch (error) {
    console.error("Get Doctor Editable Summary Error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to load editable summary.",
      error: error.message,
    });
  }
};

/*
  ========================================
  SAVE DOCTOR EDITED SUMMARY
  ========================================
*/

export const updateDoctorEditedSummary = async (req, res) => {
  try {
    const { caseId } = req.params;

    const { doctorEditedSummary } = req.body;

    const identifier = getDoctorIdentifier(req);

    /*
      ========================================
      VALIDATE DOCTOR IDENTIFIER
      ========================================
    */

    if (!identifier) {
      return res.status(400).json({
        success: false,
        message: "Doctor identifier is required.",
      });
    }

    /*
      ========================================
      VALIDATE CASE ID
      ========================================
    */

    if (!isValidObjectId(caseId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid case ID.",
      });
    }

    /*
      ========================================
      VALIDATE SUMMARY
      ========================================
    */

    if (
      typeof doctorEditedSummary !== "string" ||
      !doctorEditedSummary.trim()
    ) {
      return res.status(400).json({
        success: false,
        message: "Doctor-edited summary cannot be empty.",
      });
    }

    /*
      ========================================
      FIND DOCTOR
      ========================================
    */

    const doctor = await findDoctorByIdentifier(identifier);

    if (!doctor) {
      return res.status(404).json({
        success: false,
        message: "Doctor not found.",
      });
    }

    /*
      ========================================
      FIND CASE
      ========================================
    */

    const patientCase = await TokenCase.findOne({
      _id: caseId,
      doctorId: doctor._id,
    });

    if (!patientCase) {
      return res.status(404).json({
        success: false,
        message: "Case not found or access denied.",
      });
    }

    /*
      ========================================
      CHECK DATA CONSENT
      ========================================
    */

    if (!hasConfirmedConsent(patientCase)) {
      return res.status(403).json({
        success: false,
        message: "Patient data sharing consent has not been confirmed.",
        consentStatus: patientCase.dataConsent?.status || "Pending",
      });
    }

    /*
      ========================================
      SAVE DOCTOR EDITED SUMMARY
      ========================================

      IMPORTANT:

      aiSummary remains unchanged.

      doctorEditedSummary contains the final version
      after the doctor makes corrections/additions.
    */

    patientCase.doctorEditedSummary = doctorEditedSummary.trim();

    patientCase.doctorEditedAt = new Date();

    patientCase.doctorEditedBy = doctor._id;

    patientCase.summarySource = "DoctorEdited";

    /*
      ========================================
      SAVE CASE
      ========================================
    */

    await patientCase.save();

    /*
      ========================================
      RESPONSE
      ========================================
    */

    return res.status(200).json({
      success: true,

      message: "Doctor-edited summary saved successfully.",

      summary: {
        aiSummary:
          patientCase.aiSummary?.fullSummary ||
          patientCase.aiSummary?.overview ||
          "",

        doctorEditedSummary: patientCase.doctorEditedSummary,

        editableSummary: patientCase.doctorEditedSummary,

        summarySource: patientCase.summarySource,

        doctorEditedAt: patientCase.doctorEditedAt,

        doctorEditedBy: patientCase.doctorEditedBy,
      },

      case: patientCase,
    });
  } catch (error) {
    console.error("Update Doctor Edited Summary Error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to save doctor-edited summary.",
      error: error.message,
    });
  }
};
