import mongoose from "mongoose";

const documentSchema = new mongoose.Schema(
  {
    // =====================================================
    // PATIENT
    // =====================================================

    patientId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Patient",
      required: true,
    },

    // =====================================================
    // DOCUMENT INFORMATION
    // =====================================================

    name: {
      type: String,
      required: true,
      trim: true,
    },

    type: {
      type: String,
      required: true,
      default: "Uploaded Document",
    },

    doctorName: {
      type: String,
      default: "Self Uploaded",
    },

    fileUrl: {
      type: String,
      required: true,
    },

    // =====================================================
    // OCR INFORMATION
    // =====================================================

    ocrText: {
      type: String,
      default: "",
    },

    ocrStatus: {
      type: String,
      enum: ["Pending", "Processing", "Completed", "Failed"],
      default: "Pending",
    },

    ocrError: {
      type: String,
      default: "",
    },

    ocrProcessedAt: {
      type: Date,
      default: null,
    },

    // =====================================================
    // AI PROCESSING CONSENT
    // =====================================================

    aiProcessingConsent: {
      accepted: {
        type: Boolean,
        default: false,
      },

      acceptedAt: {
        type: Date,
        default: null,
      },

      consentVersion: {
        type: String,
        default: "1.0",
      },
    },

    // =====================================================
    // UPLOAD DATE
    // =====================================================

    uploadDate: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  },
);

export default mongoose.model("Document", documentSchema);
