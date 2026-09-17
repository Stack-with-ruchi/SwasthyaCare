import fs from "fs/promises";

import Document from "../models/Document.js";
import Patient from "../models/Patient.js";
import { extractDocumentText } from "../services/ocrService.js";

// =====================================================
// CURRENT CONSENT VERSION
// =====================================================

const CURRENT_CONSENT_VERSION = "1.0";

// =====================================================
// UPLOAD DOCUMENT + OCR
// =====================================================

export const uploadChatbotDocument = async (req, res) => {
  let uploadedFilePath = null;

  try {
    // -------------------------------------------------
    // CHECK PATIENT
    // -------------------------------------------------

    if (!req.user || req.user.role !== "patient") {
      return res.status(403).json({
        message: "Only patients can upload documents to the AI assistant.",
      });
    }

    // -------------------------------------------------
    // CHECK SAVED DATABASE CONSENT
    // -------------------------------------------------

    const patient = await Patient.findById(req.user.id).select(
      "aiDocumentConsent",
    );

    if (!patient) {
      return res.status(404).json({
        message: "Patient account not found.",
      });
    }

    const consentAccepted =
      patient.aiDocumentConsent?.accepted === true &&
      patient.aiDocumentConsent?.consentVersion === CURRENT_CONSENT_VERSION;

    if (!consentAccepted) {
      return res.status(400).json({
        success: false,
        consentRequired: true,
        message:
          "Consent is required before processing health information or uploaded medical documents.",
        consentVersion: CURRENT_CONSENT_VERSION,
      });
    }

    // -------------------------------------------------
    // CHECK FILE
    // -------------------------------------------------

    if (!req.file) {
      return res.status(400).json({
        message: "Please upload a medical report or document.",
      });
    }

    uploadedFilePath = req.file.path;

    // -------------------------------------------------
    // OCR PROCESSING
    // -------------------------------------------------

    console.log(`[Chatbot OCR] Processing document: ${req.file.originalname}`);

    const extractedText = await extractDocumentText(
      req.file.path,
      req.file.mimetype,
    );

    // -------------------------------------------------
    // CLEAN OCR TEXT
    // -------------------------------------------------

    const cleanedText = String(extractedText || "")
      .replace(/\r/g, "")
      .replace(/[ \t]+/g, " ")
      .trim();

    // -------------------------------------------------
    // LIMIT OCR TEXT SIZE
    // -------------------------------------------------

    const MAX_OCR_LENGTH = 100000;

    const finalOcrText =
      cleanedText.length > MAX_OCR_LENGTH
        ? cleanedText.substring(0, MAX_OCR_LENGTH) +
          "\n\n[OCR text truncated for processing.]"
        : cleanedText;

    // -------------------------------------------------
    // CREATE DOCUMENT
    // -------------------------------------------------

    const newDocument = new Document({
      patientId: req.user.id,

      name: req.body.name || req.file.originalname,

      type: req.body.type || "AI Chatbot Medical Document",

      doctorName: req.body.doctorName || "Self Uploaded",

      fileUrl: `/uploads/${req.file.filename}`,

      ocrText: finalOcrText,

      ocrStatus: "Completed",

      ocrError: "",

      ocrProcessedAt: new Date(),

      aiProcessingConsent: {
        accepted: true,
        acceptedAt: patient.aiDocumentConsent.acceptedAt || new Date(),
        consentVersion: CURRENT_CONSENT_VERSION,
      },
    });

    await newDocument.save();

    // -------------------------------------------------
    // RESPONSE
    // -------------------------------------------------

    return res.status(201).json({
      success: true,

      message: finalOcrText
        ? "Document uploaded and text extracted successfully."
        : "Document uploaded, but no readable text was detected.",

      document: {
        id: newDocument._id,
        name: newDocument.name,
        type: newDocument.type,
        ocrStatus: newDocument.ocrStatus,
        ocrText: finalOcrText,
        uploadedAt: newDocument.uploadDate,
      },

      extractedText: finalOcrText,
    });
  } catch (error) {
    console.error("[Chatbot OCR Error]:", error);

    // -------------------------------------------------
    // REMOVE FILE IF PROCESSING FAILED
    // -------------------------------------------------

    if (uploadedFilePath) {
      try {
        await fs.unlink(uploadedFilePath);
      } catch (deleteError) {
        console.error("Failed to remove uploaded file:", deleteError.message);
      }
    }

    return res.status(500).json({
      success: false,
      message: "Failed to process the uploaded medical document.",
      error: error.message,
    });
  }
};
