import mongoose from "mongoose";

const patientSchema = new mongoose.Schema(
  {
    fullName: {
      type: String,
      required: true,
      trim: true,
    },

    mobile: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },

    email: {
      type: String,
      sparse: true,
      lowercase: true,
      trim: true,
    },

    dob: {
      type: Date,
      required: true,
    },

    gender: {
      type: String,
      enum: ["Male", "Female", "Other"],
      required: true,
    },

    // Patient's ABHA identifier
    abhaId: {
      type: String,
      unique: true,
      sparse: true,
      trim: true,
    },

    // ABDM integration status
    abdmLinked: {
      type: Boolean,
      default: false,
    },

    // Consent specifically for ABDM health-information access
    abdmConsentStatus: {
      type: String,
      enum: ["NotRequested", "Pending", "Granted", "Denied", "Expired"],
      default: "NotRequested",
    },

    abdmConsentAt: {
      type: Date,
      default: null,
    },

    abdmLinkedAt: {
      type: Date,
      default: null,
    },

    languagePreference: {
      type: String,
      default: "en",
    },

    passwordHash: {
      type: String,
    }, // Optional if using password auth alongside OTP

    // Consent for using uploaded health documents
    // in AI Chat for OCR, processing and case-summary generation
    aiDocumentConsent: {
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

    otp: {
      code: {
        type: String,
      },

      expiresAt: {
        type: Date,
      },
    },
  },
  {
    timestamps: true,
  },
);

export default mongoose.model("Patient", patientSchema);
