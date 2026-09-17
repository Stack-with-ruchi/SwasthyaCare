import mongoose from "mongoose";

const tokenCaseSchema = new mongoose.Schema(
  {
    // =========================================================
    // PATIENT & DOCTOR
    // =========================================================
    patientId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Patient",
      required: true,
    },

    doctorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Doctor",
      default: null,
    },

    // =========================================================
    // HOSPITAL / CASE DETAILS
    // =========================================================
    hospitalName: {
      type: String,
      required: true,
      trim: true,
    },

    department: {
      type: String,
      required: true,
      trim: true,
    },

    tokenNumber: {
      type: String,
      required: true,
      trim: true,
    },

    crNumber: {
      type: String,
      required: true,
      trim: true,
    },

    // =========================================================
    // DATA CONSENT
    // =========================================================
    dataConsent: {
      status: {
        type: String,
        enum: ["Pending", "Confirmed", "Declined"],
        default: "Pending",
      },

      confirmedAt: {
        type: Date,
        default: null,
      },

      sharedItems: {
        type: [String],
        default: [],
      },
    },

    // ABDM-related consent status
    abdmConsent: {
      type: Boolean,
      default: false,
    },

    // =========================================================
    // DOCTOR ACTION
    // =========================================================
    doctorAction: {
      type: String,
      enum: ["Pending", "Accepted", "Rejected"],
      default: "Pending",
    },

    // =========================================================
    // BASIC AI CASE ENQUIRY
    // =========================================================
    aiCaseEnquiry: {
      prakriti: {
        type: String,
        default: "",
      },

      symptoms: {
        type: [String],
        default: [],
      },

      notes: {
        type: String,
        default: "",
      },
    },

    // =========================================================
    // UPLOADED MEDICAL DOCUMENTS
    // =========================================================
    uploadedDocuments: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Document",
      },
    ],

    // =========================================================
    // AI SUMMARY
    // =========================================================
    aiSummary: {
      // Main generated summary
      overview: {
        type: String,
        default: "",
      },

      // Ayurveda-related evaluation
      ayushEvaluation: {
        prakritiProfile: {
          type: String,
          default: "",
        },
      },

      // General recommendations / considerations
      recommendations: {
        type: String,
        default: "",
      },

      // Additional information
      additionalNotes: {
        type: String,
        default: "",
      },

      // Complete formatted AI summary
      fullSummary: {
        type: String,
        default: "",
      },

      // Language in which the summary was generated
      summaryLanguage: {
        type: String,
        default: "en",
      },

      // AI consultation mode
      summaryMode: {
        type: String,
        enum: ["ayurveda", "allopathy"],
        default: "ayurveda",
      },

      // When AI generated the summary
      generatedAt: {
        type: Date,
        default: null,
      },

      // Whether a summary has been generated
      generatedBy: {
        type: String,
        default: "AI",
      },
    },

    // =========================================================
    // DOCTOR-EDITED FINAL SUMMARY
    // =========================================================
    // Original AI summary remains unchanged.
    // This stores the complete summary after the doctor
    // consults the patient offline and makes corrections/additions.

    doctorEditedSummary: {
      type: String,
      default: "",
    },

    // When the doctor saved the edited summary
    doctorEditedAt: {
      type: Date,
      default: null,
    },

    // Which doctor made the edits
    doctorEditedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Doctor",
      default: null,
    },

    // Identifies which version is currently the final version
    summarySource: {
      type: String,
      enum: ["AI", "DoctorEdited"],
      default: "AI",
    },

    // =========================================================
    // AI SUMMARY STATUS
    // =========================================================
    summaryStatus: {
      type: String,
      enum: ["AI summary Not available", "AI summary Available"],
      default: "AI summary Not available",
    },

    // More detailed status for the review/approval workflow
    aiSummaryStatus: {
      type: String,
      enum: [
        "NotGenerated",
        "PendingReview",
        "Approved",
        "Rejected",
        "Regenerated",
      ],
      default: "NotGenerated",
    },

    // =========================================================
    // PATIENT REVIEW / APPROVAL
    // =========================================================

    // When the patient receives the summary for review
    summarySentForReviewAt: {
      type: Date,
      default: null,
    },

    // When the patient approves the summary
    patientApprovedAt: {
      type: Date,
      default: null,
    },

    // Whether the patient has approved the summary
    patientApproved: {
      type: Boolean,
      default: false,
    },

    // Whether the approved summary can be shared with doctor
    approvedForDoctorSharing: {
      type: Boolean,
      default: false,
    },

    // =========================================================
    // SUMMARY REVIEW NOTES
    // =========================================================
    patientReviewNote: {
      type: String,
      default: "",
    },

    // =========================================================
    // DOCTOR NOTES
    // =========================================================
    doctorNotes: {
      type: String,
      default: "",
    },

    // =========================================================
    // TIMESTAMPS
    // =========================================================
  },
  {
    timestamps: true,
  },
);

const TokenCase = mongoose.model("TokenCase", tokenCaseSchema);

export default TokenCase;
