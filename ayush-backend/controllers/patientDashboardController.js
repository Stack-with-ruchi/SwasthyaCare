import TokenCase from "../models/TokenCase.js";
import Document from "../models/Document.js";
import Patient from "../models/Patient.js";

// =====================================================
// 1. GET PATIENT HOME DASHBOARD OVERVIEW
// =====================================================

export const getPatientDashboardOverview = async (req, res) => {
  try {
    const patientId = req.user.id;

    // -------------------------------------------------
    // Get logged-in patient's details
    // -------------------------------------------------

    const patient =
      await Patient.findById(patientId).select("-passwordHash -otp");

    if (!patient) {
      return res.status(404).json({
        success: false,
        message: "Patient not found.",
      });
    }

    // -------------------------------------------------
    // Get all cases belonging only to this patient
    // -------------------------------------------------

    const patientCases = await TokenCase.find({
      patientId,
    }).sort({
      createdAt: -1,
    });

    // -------------------------------------------------
    // Get all documents belonging only to this patient
    // -------------------------------------------------

    const documents = await Document.find({
      patientId,
    }).sort({
      uploadDate: -1,
      createdAt: -1,
    });

    // -------------------------------------------------
    // Latest case
    // -------------------------------------------------

    const latestCase = patientCases.length > 0 ? patientCases[0] : null;

    const hasAiSummaryContent = (patientCase) => {
      return (
        patientCase?.summaryStatus === "AI summary Available" ||
        Boolean(patientCase?.aiSummary?.fullSummary) ||
        Boolean(patientCase?.aiSummary?.overview) ||
        Boolean(patientCase?.aiSummary?.summary)
      );
    };

    // -------------------------------------------------
    // Find latest consultation/case with AI summary
    // -------------------------------------------------

    const lastConsultation = patientCases.find(hasAiSummaryContent) || null;

    // -------------------------------------------------
    // Find upcoming appointment if appointmentDate
    // exists
    // -------------------------------------------------

    const upcomingAppointment =
      patientCases.find(
        (patientCase) =>
          patientCase.appointmentDate &&
          new Date(patientCase.appointmentDate) > new Date(),
      ) || null;

    // -------------------------------------------------
    // Response
    // -------------------------------------------------

    return res.status(200).json({
      success: true,

      // =================================================
      // PATIENT PROFILE
      // =================================================

      patientProfile: {
        id: patient._id,

        fullName: patient.fullName,

        mobile: patient.mobile,

        email: patient.email || "",

        abhaId: patient.abhaId || "",

        dob: patient.dob,

        gender: patient.gender,

        languagePreference: patient.languagePreference || "en",
      },

      // =================================================
      // DASHBOARD STATS
      // =================================================

      dashboardStats: {
        totalCases: patientCases.length,

        totalDocuments: documents.length,

        pendingAISummaries: patientCases.filter(
          (patientCase) => patientCase.aiSummaryStatus === "PendingReview",
        ).length,

        approvedAISummaries: patientCases.filter(
          (patientCase) => patientCase.aiSummaryStatus === "Approved",
        ).length,
      },

      // =================================================
      // LATEST TOKEN / CASE
      // =================================================

      recentToken: latestCase
        ? {
            id: latestCase._id,

            hospitalName: latestCase.hospitalName,

            department: latestCase.department,

            tokenNumber: latestCase.tokenNumber,

            crNumber: latestCase.crNumber,

            summaryStatus: latestCase.summaryStatus,

            aiSummaryStatus: latestCase.aiSummaryStatus || "NotGenerated",

            patientApproved: latestCase.patientApproved || false,

            approvedForDoctorSharing:
              latestCase.approvedForDoctorSharing || false,

            createdAt: latestCase.createdAt,
          }
        : null,

      // =================================================
      // LATEST CONSULTATION
      // =================================================

      lastConsultation: lastConsultation
        ? {
            id: lastConsultation._id,

            hospitalName: lastConsultation.hospitalName,

            department: lastConsultation.department,

            createdAt: lastConsultation.createdAt,

            summaryStatus: lastConsultation.summaryStatus,

            aiSummaryStatus: lastConsultation.aiSummaryStatus || "NotGenerated",

            aiSummary: lastConsultation.aiSummary || null,

            summaryMode: lastConsultation.aiSummary?.summaryMode || "ayurveda",

            patientApproved: lastConsultation.patientApproved || false,

            approvedForDoctorSharing:
              lastConsultation.approvedForDoctorSharing || false,
          }
        : null,

      // =================================================
      // UPCOMING APPOINTMENT
      // =================================================

      upcomingAppointment: upcomingAppointment
        ? {
            id: upcomingAppointment._id,

            hospitalName: upcomingAppointment.hospitalName,

            department: upcomingAppointment.department,

            appointmentDate: upcomingAppointment.appointmentDate,
          }
        : null,

      // =================================================
      // RECENT DOCUMENTS
      // =================================================

      recentDocuments: documents.slice(0, 5).map((document) => ({
        id: document._id,

        name: document.name,

        type: document.type,

        doctorName: document.doctorName || "Not specified",

        fileUrl: document.fileUrl,

        uploadDate: document.uploadDate || document.createdAt,
      })),
    });
  } catch (error) {
    console.error("Dashboard Error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to load patient dashboard.",
      error: error.message,
    });
  }
};

// =====================================================
// 2. CREATE PATIENT TOKEN
// =====================================================

export const createPatientToken = async (req, res) => {
  try {
    const patientId = req.user.id;

    const { hospitalName, department, tokenNumber, crNumber, dataConsent } =
      req.body;

    // -------------------------------------------------
    // Validate required fields
    // -------------------------------------------------

    if (!hospitalName || !department || !tokenNumber || !crNumber) {
      return res.status(400).json({
        success: false,
        message:
          "Hospital name, department, token number, and CR number are required.",
      });
    }

    // -------------------------------------------------
    // Consent required
    // -------------------------------------------------

    if (dataConsent !== true) {
      return res.status(400).json({
        success: false,
        message: "Data consent is required to create a token.",
      });
    }

    // -------------------------------------------------
    // Create case
    // -------------------------------------------------

    const newCase = await TokenCase.create({
      patientId,

      hospitalName,

      department,

      tokenNumber,

      crNumber,

      dataConsent: {
        status: "Confirmed",

        confirmedAt: new Date(),

        sharedItems: ["Patient Details", "AI Summary", "Medical Reports"],
      },

      summaryStatus: "AI summary Not available",

      aiSummaryStatus: "NotGenerated",

      patientApproved: false,

      approvedForDoctorSharing: false,
    });

    // -------------------------------------------------
    // Response
    // -------------------------------------------------

    return res.status(201).json({
      success: true,

      message: "Token created successfully.",

      tokenDetails: {
        caseId: newCase._id,

        hospitalName: newCase.hospitalName,

        department: newCase.department,

        tokenNumber: newCase.tokenNumber,

        crNumber: newCase.crNumber,

        summaryStatus: newCase.summaryStatus,

        aiSummaryStatus: newCase.aiSummaryStatus,

        patientApproved: newCase.patientApproved,

        approvedForDoctorSharing: newCase.approvedForDoctorSharing,

        createdAt: newCase.createdAt,
      },
    });
  } catch (error) {
    console.error("Token Creation Error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to create token.",
      error: error.message,
    });
  }
};

// =====================================================
// 3. AI CASE ENQUIRY AND SUMMARY
// =====================================================

export const processAiCaseEnquiry = async (req, res) => {
  try {
    const patientId = req.user.id;

    const { caseId, prakriti, symptoms, notes, abdmConsent, documentIds } =
      req.body;

    // -------------------------------------------------
    // Validate case ID
    // -------------------------------------------------

    if (!caseId) {
      return res.status(400).json({
        success: false,
        message: "Case ID is required.",
      });
    }

    // -------------------------------------------------
    // Validate ABDM consent
    // -------------------------------------------------

    if (abdmConsent !== true) {
      return res.status(400).json({
        success: false,
        message:
          "ABDM consent is required to generate and share the AI summary.",
      });
    }

    // -------------------------------------------------
    // Find case belonging to patient
    // -------------------------------------------------

    const patientCase = await TokenCase.findOne({
      _id: caseId,
      patientId,
    });

    if (!patientCase) {
      return res.status(404).json({
        success: false,
        message: "Case not found or you are not authorized to access it.",
      });
    }

    // -------------------------------------------------
    // Format symptoms
    // -------------------------------------------------

    const symptomList = Array.isArray(symptoms)
      ? symptoms.filter(Boolean).join(", ")
      : symptoms || "No symptoms provided";

    const primaryDosha = prakriti || "Not provided";

    // -------------------------------------------------
    // Current rule-based AI case summary
    // -------------------------------------------------

    const aiSummaryResult = {
      overview:
        `Patient reported: ${symptomList}. ` +
        `Prakriti assessment: ${primaryDosha}.`,

      ayushEvaluation: {
        prakritiProfile: primaryDosha,
      },

      additionalNotes: notes || "No additional notes provided.",

      fullSummary:
        `Patient reported: ${symptomList}. ` +
        `Prakriti assessment: ${primaryDosha}.`,

      summaryLanguage: "en",

      summaryMode: "ayurveda",

      generatedAt: new Date(),

      generatedBy: "AI",
    };

    // -------------------------------------------------
    // Update AI case enquiry
    // -------------------------------------------------

    patientCase.aiCaseEnquiry = {
      prakriti: primaryDosha,

      symptoms: Array.isArray(symptoms) ? symptoms : symptoms ? [symptoms] : [],

      notes: notes || "",
    };

    // -------------------------------------------------
    // Uploaded documents
    // -------------------------------------------------

    patientCase.uploadedDocuments = Array.isArray(documentIds)
      ? documentIds
      : [];

    // -------------------------------------------------
    // ABDM consent
    // -------------------------------------------------

    patientCase.abdmConsent = true;

    // -------------------------------------------------
    // Save AI summary
    // -------------------------------------------------

    patientCase.aiSummary = aiSummaryResult;

    patientCase.summaryStatus = "AI summary Available";

    // -------------------------------------------------
    // Patient review status
    // -------------------------------------------------

    patientCase.aiSummaryStatus = "PendingReview";

    patientCase.summarySentForReviewAt = new Date();

    patientCase.patientApproved = false;

    patientCase.patientApprovedAt = null;

    patientCase.approvedForDoctorSharing = false;

    patientCase.patientReviewNote = "";

    // -------------------------------------------------
    // Save
    // -------------------------------------------------

    await patientCase.save();

    // -------------------------------------------------
    // Response
    // -------------------------------------------------

    return res.status(200).json({
      success: true,

      message:
        "AI case summary generated successfully and is waiting for patient review.",

      caseDetails: {
        caseId: patientCase._id,

        hospitalName: patientCase.hospitalName,

        department: patientCase.department,

        tokenNumber: patientCase.tokenNumber,

        summaryStatus: patientCase.summaryStatus,

        aiSummaryStatus: patientCase.aiSummaryStatus,

        patientApproved: patientCase.patientApproved,

        approvedForDoctorSharing: patientCase.approvedForDoctorSharing,
      },

      aiSummary: patientCase.aiSummary,
    });
  } catch (error) {
    console.error("AI Case Enquiry Error:", error);

    return res.status(500).json({
      success: false,
      message: "AI case enquiry processing failed.",
      error: error.message,
    });
  }
};

// =====================================================
// 4. GET PATIENT CASE HISTORY
// =====================================================

export const getPatientCaseHistory = async (req, res) => {
  try {
    const patientId = req.user.id;

    // -------------------------------------------------
    // Get only patient's cases
    // -------------------------------------------------

    const patientCases = await TokenCase.find({
      patientId,
    })
      .populate("uploadedDocuments")
      .sort({
        createdAt: -1,
      });

    // -------------------------------------------------
    // Format cases
    // -------------------------------------------------

    const formattedCases = patientCases.map((patientCase) => ({
      id: patientCase._id,

      hospitalName: patientCase.hospitalName,

      department: patientCase.department,

      tokenNumber: patientCase.tokenNumber,

      crNumber: patientCase.crNumber,

      summaryStatus: patientCase.summaryStatus,

      aiSummaryStatus: patientCase.aiSummaryStatus || "NotGenerated",

      patientApproved: patientCase.patientApproved || false,

      approvedForDoctorSharing: patientCase.approvedForDoctorSharing || false,

      patientApprovedAt: patientCase.patientApprovedAt || null,

      summarySentForReviewAt: patientCase.summarySentForReviewAt || null,

      aiCaseEnquiry: patientCase.aiCaseEnquiry || null,

      aiSummary: patientCase.aiSummary || null,

      uploadedDocuments: patientCase.uploadedDocuments || [],

      createdAt: patientCase.createdAt,

      updatedAt: patientCase.updatedAt,
    }));

    return res.status(200).json({
      success: true,

      totalCases: formattedCases.length,

      cases: formattedCases,
    });
  } catch (error) {
    console.error("Case History Error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch patient case history.",
      error: error.message,
    });
  }
};

// =====================================================
// 5. GET LOGGED-IN PATIENT PROFILE
// =====================================================

export const getPatientProfile = async (req, res) => {
  try {
    const patient = await Patient.findById(req.user.id).select(
      "fullName mobile email gender dob abhaId languagePreference",
    );

    if (!patient) {
      return res.status(404).json({
        success: false,
        message: "Patient not found.",
      });
    }

    return res.status(200).json({
      success: true,

      patient: {
        id: patient._id,

        fullName: patient.fullName,

        mobile: patient.mobile,

        email: patient.email || "",

        gender: patient.gender,

        dob: patient.dob,

        abhaId: patient.abhaId || "",

        languagePreference: patient.languagePreference || "en",
      },
    });
  } catch (error) {
    console.error("Get patient profile error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch patient profile.",
      error: error.message,
    });
  }
};

// =====================================================
// 6. GET LOGGED-IN PATIENT ABHA DETAILS
// =====================================================

export const getPatientAbha = async (req, res) => {
  try {
    const patient = await Patient.findById(req.user.id).select(
      "fullName abhaId mobile gender dob",
    );

    if (!patient) {
      return res.status(404).json({
        success: false,
        message: "Patient not found.",
      });
    }

    return res.status(200).json({
      success: true,

      patient: {
        id: patient._id,

        fullName: patient.fullName,

        abhaId: patient.abhaId || "",

        mobile: patient.mobile,

        gender: patient.gender,

        dob: patient.dob,
      },
    });
  } catch (error) {
    console.error("Get ABHA details error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch ABHA details.",
      error: error.message,
    });
  }
};

// =====================================================
// 7. GET AI DOCUMENT PROCESSING CONSENT
// =====================================================

export const getAIDocumentConsent = async (req, res) => {
  try {
    const patient = await Patient.findById(req.user.id).select(
      "aiDocumentConsent",
    );

    if (!patient) {
      return res.status(404).json({
        success: false,
        message: "Patient not found.",
      });
    }

    const CURRENT_CONSENT_VERSION = "1.0";

    const consentAccepted =
      patient.aiDocumentConsent?.accepted === true &&
      patient.aiDocumentConsent?.consentVersion === CURRENT_CONSENT_VERSION;

    return res.status(200).json({
      success: true,

      consentAccepted,

      consentVersion:
        patient.aiDocumentConsent?.consentVersion || CURRENT_CONSENT_VERSION,

      acceptedAt: patient.aiDocumentConsent?.acceptedAt || null,
    });
  } catch (error) {
    console.error("Get AI document consent error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to check AI document consent.",
      error: error.message,
    });
  }
};

// =====================================================
// 8. ACCEPT AI DOCUMENT PROCESSING CONSENT
// =====================================================

export const acceptAIDocumentConsent = async (req, res) => {
  try {
    const patient = await Patient.findById(req.user.id);

    if (!patient) {
      return res.status(404).json({
        success: false,
        message: "Patient not found.",
      });
    }

    const CURRENT_CONSENT_VERSION = "1.0";

    const acceptedAt = new Date();

    patient.aiDocumentConsent = {
      accepted: true,

      acceptedAt,

      consentVersion: CURRENT_CONSENT_VERSION,
    };

    await patient.save();

    return res.status(200).json({
      success: true,

      message: "AI document processing consent saved.",

      consentAccepted: true,

      consentVersion: CURRENT_CONSENT_VERSION,

      acceptedAt,
    });
  } catch (error) {
    console.error("Accept AI document consent error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to save AI document consent.",
      error: error.message,
    });
  }
};

// =====================================================
// 9. GET AI SUMMARY FOR PATIENT REVIEW
// =====================================================

export const getAISummaryForReview = async (req, res) => {
  try {
    // -------------------------------------------------
    // Validate patient
    // -------------------------------------------------

    if (!req.user?.id || req.user.role !== "patient") {
      return res.status(403).json({
        success: false,
        message: "Only logged-in patients can view AI summaries.",
      });
    }

    // -------------------------------------------------
    // Get case ID
    // -------------------------------------------------

    const { tokenCaseId } = req.params;

    if (!tokenCaseId) {
      return res.status(400).json({
        success: false,
        message: "Token case ID is required.",
      });
    }

    // -------------------------------------------------
    // Find patient's case
    // -------------------------------------------------

    const tokenCase = await TokenCase.findOne({
      _id: tokenCaseId,

      patientId: req.user.id,
    }).populate("uploadedDocuments", "name type fileUrl uploadDate ocrStatus");

    if (!tokenCase) {
      return res.status(404).json({
        success: false,
        message: "Case not found.",
      });
    }

    // -------------------------------------------------
    // Check summary
    // -------------------------------------------------

    if (
      tokenCase.summaryStatus !== "AI summary Available" ||
      !tokenCase.aiSummary?.fullSummary
    ) {
      return res.status(404).json({
        success: false,
        message: "AI case summary is not available yet.",
      });
    }

    // -------------------------------------------------
    // Return summary
    // -------------------------------------------------

    return res.status(200).json({
      success: true,

      tokenCaseId: tokenCase._id,

      hospitalName: tokenCase.hospitalName,

      department: tokenCase.department,

      tokenNumber: tokenCase.tokenNumber,

      crNumber: tokenCase.crNumber,

      summary: tokenCase.aiSummary.fullSummary,

      summaryStatus: tokenCase.summaryStatus,

      aiSummaryStatus: tokenCase.aiSummaryStatus || "NotGenerated",

      patientApproved: tokenCase.patientApproved || false,

      approvedForDoctorSharing: tokenCase.approvedForDoctorSharing || false,

      generatedAt: tokenCase.aiSummary.generatedAt,

      summaryLanguage: tokenCase.aiSummary.summaryLanguage || "en",

      summaryMode: tokenCase.aiSummary.summaryMode || "ayurveda",

      documents: tokenCase.uploadedDocuments || [],
    });
  } catch (error) {
    console.error("Get AI Summary Error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to load AI case summary.",
      error: error.message,
    });
  }
};

// =====================================================
// 10. APPROVE AI SUMMARY
// =====================================================

export const approveAISummary = async (req, res) => {
  try {
    // -------------------------------------------------
    // Validate patient
    // -------------------------------------------------

    if (!req.user?.id || req.user.role !== "patient") {
      return res.status(403).json({
        success: false,
        message: "Only logged-in patients can approve AI summaries.",
      });
    }

    // -------------------------------------------------
    // Get case ID
    // -------------------------------------------------

    const { tokenCaseId } = req.params;

    if (!tokenCaseId) {
      return res.status(400).json({
        success: false,
        message: "Token case ID is required.",
      });
    }

    // -------------------------------------------------
    // Optional patient review note
    // -------------------------------------------------

    const reviewNote =
      typeof req.body?.reviewNote === "string"
        ? req.body.reviewNote.trim()
        : "";

    const consentConfirmed = req.body?.consent === true;

    if (!consentConfirmed) {
      return res.status(400).json({
        success: false,
        message:
          "Patient consent is required before sending the AI summary to the doctor.",
      });
    }

    // -------------------------------------------------
    // Find patient's case
    // -------------------------------------------------

    const tokenCase = await TokenCase.findOne({
      _id: tokenCaseId,

      patientId: req.user.id,
    });

    if (!tokenCase) {
      return res.status(404).json({
        success: false,
        message: "Case not found.",
      });
    }

    // -------------------------------------------------
    // Check AI summary
    // -------------------------------------------------

    if (
      tokenCase.summaryStatus !== "AI summary Available" ||
      !tokenCase.aiSummary?.fullSummary
    ) {
      return res.status(400).json({
        success: false,
        message: "There is no AI summary available for approval.",
      });
    }

    // -------------------------------------------------
    // Already approved
    // -------------------------------------------------

    if (
      tokenCase.patientApproved === true &&
      tokenCase.approvedForDoctorSharing === true
    ) {
      return res.status(200).json({
        success: true,

        message: "This AI summary has already been approved.",

        tokenCaseId: tokenCase._id,

        aiSummaryStatus: tokenCase.aiSummaryStatus,

        patientApproved: tokenCase.patientApproved,

        approvedForDoctorSharing: tokenCase.approvedForDoctorSharing,

        patientApprovedAt: tokenCase.patientApprovedAt,
      });
    }

    // -------------------------------------------------
    // Approve summary
    // -------------------------------------------------

    const approvedAt = new Date();

    tokenCase.aiSummaryStatus = "Approved";

    tokenCase.patientApproved = true;

    tokenCase.patientApprovedAt = approvedAt;

    tokenCase.approvedForDoctorSharing = true;

    tokenCase.patientReviewNote = reviewNote;

    // -------------------------------------------------
    // Save
    // -------------------------------------------------

    await tokenCase.save();

    // -------------------------------------------------
    // Response
    // -------------------------------------------------

    return res.status(200).json({
      success: true,

      message: "AI case summary approved successfully.",

      tokenCaseId: tokenCase._id,

      aiSummaryStatus: tokenCase.aiSummaryStatus,

      patientApproved: tokenCase.patientApproved,

      approvedForDoctorSharing: tokenCase.approvedForDoctorSharing,

      patientApprovedAt: tokenCase.patientApprovedAt,
    });
  } catch (error) {
    console.error("Approve AI Summary Error:", error);

    return res.status(500).json({
      success: false,

      message: "Failed to approve AI case summary.",

      error: error.message,
    });
  }
};
