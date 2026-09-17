import TokenCase from "../models/TokenCase.js";
import Doctor from "../models/Doctor.js";

// ============================================================
// PATIENT WORKFLOW ENDPOINTS
// ============================================================

// 1. Create Token Details (Patient Side)
//
// Patient enters the token information.
// At this stage, doctorId can remain null if the hospital
// has not assigned a particular doctor yet.
export const createTokenDetails = async (req, res) => {
  try {
    const patientId = req.user.id;

    const { hospitalName, department, tokenNumber, crNumber, dataConsent } =
      req.body;

    if (!hospitalName || !department || !tokenNumber) {
      return res.status(400).json({
        success: false,
        message: "Hospital name, department and token number are required.",
      });
    }

    const newCase = new TokenCase({
      patientId,
      hospitalName,
      department,
      tokenNumber,
      crNumber: crNumber || "",
      dataConsent: !!dataConsent,

      // Doctor is assigned later by the hospital/doctor
      doctorId: null,

      doctorAction: "Pending",
      summaryStatus: "AI summary Not available",
    });

    await newCase.save();

    return res.status(201).json({
      success: true,
      message: "Token case created successfully.",
      caseId: newCase._id,
      tokenNumber: newCase.tokenNumber,
      hospitalName: newCase.hospitalName,
      department: newCase.department,
      status: newCase.summaryStatus,
    });
  } catch (error) {
    console.error("Create token error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to create token.",
      error: error.message,
    });
  }
};

// ============================================================
// 2. Submit AI Case Enquiry & Generate Summary
// ============================================================

export const submitAiSummary = async (req, res) => {
  try {
    const patientId = req.user.id;

    const { caseId, aiCaseEnquiry, documentIds, abdmConsent } = req.body;

    if (!caseId) {
      return res.status(400).json({
        success: false,
        message: "Case ID is required.",
      });
    }

    // IMPORTANT:
    // Make sure this case belongs to the logged-in patient.
    const tokenCase = await TokenCase.findOne({
      _id: caseId,
      patientId,
    });

    if (!tokenCase) {
      return res.status(404).json({
        success: false,
        message: "Case not found or access denied.",
      });
    }

    // Simulated AI Summary
    const mockAiSummary = {
      overview: `Patient presented symptoms of ${
        aiCaseEnquiry?.symptoms?.join(", ") || "N/A"
      }. Identified AYUSH Prakriti profile: ${
        aiCaseEnquiry?.prakriti || "General"
      }.`,
      recommendations:
        "Suggested lifestyle modifications & primary herbal evaluation.",
      generatedAt: new Date(),
    };

    tokenCase.aiCaseEnquiry = aiCaseEnquiry || {};
    tokenCase.uploadedDocuments = documentIds || [];
    tokenCase.abdmConsent = !!abdmConsent;
    tokenCase.aiSummary = mockAiSummary;
    tokenCase.summaryStatus = "AI summary Available";

    await tokenCase.save();

    return res.status(200).json({
      success: true,
      message: "Summary sent successfully.",
      summaryStatus: tokenCase.summaryStatus,
      case: tokenCase,
    });
  } catch (error) {
    console.error("Submit AI summary error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to submit AI summary.",
      error: error.message,
    });
  }
};

// ============================================================
// DOCTOR WORKFLOW ENDPOINTS
// ============================================================

// 3. Get Today's Appointments / Token Cases for Doctor
//
// IMPORTANT:
// Only cases assigned to the logged-in doctor are returned.
export const getDoctorAppointments = async (req, res) => {
  try {
    const doctorId = req.user.id;

    const doctor = await Doctor.findById(doctorId);

    if (!doctor) {
      return res.status(404).json({
        success: false,
        message: "Doctor not found.",
      });
    }

    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);

    const endOfToday = new Date();
    endOfToday.setHours(23, 59, 59, 999);

    const appointments = await TokenCase.find({
      doctorId: doctor._id,

      createdAt: {
        $gte: startOfToday,
        $lte: endOfToday,
      },
    })
      .populate(
        "patientId",
        "fullName dob gender abhaId mobile email languagePreference",
      )
      .populate("uploadedDocuments")
      .sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,

      doctor: {
        doctorCode: doctor.doctorCode || "",
        fullName: doctor.fullName,
        hospitalClinic: doctor.hospitalClinic || "",
        department: doctor.department || "",
      },

      total: appointments.length,
      appointments,
    });
  } catch (error) {
    console.error("Get doctor appointments error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch appointments.",
      error: error.message,
    });
  }
};

// ============================================================
// 4. Doctor Action: Accept / Reject Token
// ============================================================

export const respondToToken = async (req, res) => {
  try {
    const doctorId = req.user.id;

    const { caseId, action } = req.body;

    if (!caseId) {
      return res.status(400).json({
        success: false,
        message: "Case ID is required.",
      });
    }

    if (!["Accepted", "Rejected"].includes(action)) {
      return res.status(400).json({
        success: false,
        message: "Invalid action type.",
      });
    }

    // Verify doctor exists
    const doctor = await Doctor.findById(doctorId);

    if (!doctor) {
      return res.status(404).json({
        success: false,
        message: "Doctor not found.",
      });
    }

    // IMPORTANT:
    // Only update a case belonging to this doctor.
    const tokenCase = await TokenCase.findOne({
      _id: caseId,
      doctorId: doctor._id,
    });

    if (!tokenCase) {
      return res.status(404).json({
        success: false,
        message: "Case not found or not assigned to this doctor.",
      });
    }

    tokenCase.doctorAction = action;

    await tokenCase.save();

    return res.status(200).json({
      success: true,
      message: `Token ${action.toLowerCase()} successfully.`,
      doctorAction: tokenCase.doctorAction,
      caseId: tokenCase._id,
    });
  } catch (error) {
    console.error("Respond to token error:", error);

    return res.status(500).json({
      success: false,
      message: "Action failed.",
      error: error.message,
    });
  }
};

// ============================================================
// 5. Doctor Review / Edit / Save Case Notes
// ============================================================

export const updateCaseNotes = async (req, res) => {
  try {
    const doctorId = req.user.id;

    const { caseId, doctorNotes } = req.body;

    if (!caseId) {
      return res.status(400).json({
        success: false,
        message: "Case ID is required.",
      });
    }

    // IMPORTANT:
    // Doctor can only edit notes for their own assigned case.
    const tokenCase = await TokenCase.findOne({
      _id: caseId,
      doctorId,
    });

    if (!tokenCase) {
      return res.status(404).json({
        success: false,
        message: "Case not found or not assigned to this doctor.",
      });
    }

    tokenCase.doctorNotes = doctorNotes || "";

    await tokenCase.save();

    return res.status(200).json({
      success: true,
      message: "Case notes saved successfully.",
      case: tokenCase,
    });
  } catch (error) {
    console.error("Update case notes error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to save notes.",
      error: error.message,
    });
  }
};

// ============================================================
// 6. ASSIGN TOKEN CASE TO DOCTOR
// ============================================================
//
// This is the important new function.
//
// Hospital/authorized doctor can assign a patient's token case
// to a particular doctor.
//
// The patient NEVER sends doctorId from the frontend.
//
// The backend gets the doctor from the authorized request.
// ============================================================

export const assignTokenToDoctor = async (req, res) => {
  try {
    const { caseId, doctorId } = req.body;

    if (!caseId || !doctorId) {
      return res.status(400).json({
        success: false,
        message: "Case ID and doctor ID are required.",
      });
    }

    const doctor = await Doctor.findById(doctorId);

    if (!doctor) {
      return res.status(404).json({
        success: false,
        message: "Doctor not found.",
      });
    }

    const tokenCase = await TokenCase.findById(caseId);

    if (!tokenCase) {
      return res.status(404).json({
        success: false,
        message: "Token case not found.",
      });
    }

    // Make sure doctor belongs to the same hospital
    if (
      tokenCase.hospitalName &&
      doctor.hospitalClinic !== tokenCase.hospitalName
    ) {
      return res.status(400).json({
        success: false,
        message: "Doctor does not belong to this hospital.",
      });
    }

    // Make sure doctor belongs to the same department
    if (tokenCase.department && doctor.department !== tokenCase.department) {
      return res.status(400).json({
        success: false,
        message: "Doctor does not belong to this department.",
      });
    }

    tokenCase.doctorId = doctor._id;
    tokenCase.doctorAction = "Pending";

    await tokenCase.save();

    return res.status(200).json({
      success: true,
      message: "Token assigned to doctor successfully.",

      token: {
        tokenNumber: tokenCase.tokenNumber,
        hospitalName: tokenCase.hospitalName,
        department: tokenCase.department,
      },

      // Internal ID is NOT returned to the patient.
      doctor: {
        fullName: doctor.fullName,
        specialization: doctor.specialization || "",
      },
    });
  } catch (error) {
    console.error("Assign token error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to assign token.",
      error: error.message,
    });
  }
};

// ============================================================
// 7. Get Complete Case For Assigned Doctor
// ============================================================

export const getDoctorCase = async (req, res) => {
  try {
    const doctorId = req.user.id;
    const { caseId } = req.params;

    const tokenCase = await TokenCase.findOne({
      _id: caseId,
      doctorId,
    })
      .populate(
        "patientId",
        "fullName dob gender abhaId mobile email languagePreference",
      )
      .populate("uploadedDocuments");

    if (!tokenCase) {
      return res.status(404).json({
        success: false,
        message: "Case not found or access denied.",
      });
    }

    return res.status(200).json({
      success: true,

      case: {
        id: tokenCase._id,
        tokenNumber: tokenCase.tokenNumber,
        hospitalName: tokenCase.hospitalName,
        department: tokenCase.department,

        patient: tokenCase.patientId,

        aiCaseEnquiry: tokenCase.aiCaseEnquiry,
        aiSummary: tokenCase.aiSummary,

        uploadedDocuments: tokenCase.uploadedDocuments,

        doctorNotes: tokenCase.doctorNotes,
        doctorAction: tokenCase.doctorAction,
        summaryStatus: tokenCase.summaryStatus,
      },
    });
  } catch (error) {
    console.error("Get doctor case error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch case.",
      error: error.message,
    });
  }
};
