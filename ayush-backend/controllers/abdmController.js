import mongoose from "mongoose";
import ABDMRecord from "../models/ABDMRecord.js";
import Patient from "../models/Patient.js";

// =====================================================
// GET PATIENT ABDM / HIS RECORDS
// =====================================================

export const getPatientABDMRecords = async (req, res) => {
  try {
    const patientId = req.user?.id || req.params.patientId;

    // -----------------------------------------------
    // Validate patient ID
    // -----------------------------------------------
    if (!patientId || !mongoose.Types.ObjectId.isValid(patientId)) {
      return res.status(400).json({
        success: false,
        message: "Valid patient ID is required.",
      });
    }

    // -----------------------------------------------
    // Find patient
    // -----------------------------------------------
    const patient = await Patient.findById(patientId).select(
      "fullName mobile abhaId abdmLinked abdmConsentStatus abdmConsentAt abdmLinkedAt",
    );

    if (!patient) {
      return res.status(404).json({
        success: false,
        message: "Patient not found.",
      });
    }

    // -----------------------------------------------
    // Check ABDM consent/linking
    // -----------------------------------------------
    if (!patient.abhaId || patient.abdmConsentStatus !== "Granted") {
      return res.status(200).json({
        success: true,

        linked: false,

        consentStatus: patient.abdmConsentStatus || "NotRequested",

        records: [],

        recordCount: 0,

        message: "No ABDM records are currently available for this patient.",
      });
    }

    // -----------------------------------------------
    // Fetch records belonging ONLY to this patient
    // -----------------------------------------------
    const records = await ABDMRecord.find({
      patientId: patient._id,
    })
      .sort({ recordDate: -1, importedAt: -1 })
      .lean();

    // -----------------------------------------------
    // Return patient + records
    // -----------------------------------------------
    return res.status(200).json({
      success: true,

      linked: patient.abdmLinked,

      consentStatus: patient.abdmConsentStatus,

      abhaId: patient.abhaId,

      consentAt: patient.abdmConsentAt,

      linkedAt: patient.abdmLinkedAt,

      recordCount: records.length,

      records,
    });
  } catch (error) {
    console.error("Get ABDM records error:", error);

    return res.status(500).json({
      success: false,

      message: "Failed to fetch patient health records.",

      error: error.message,
    });
  }
};
