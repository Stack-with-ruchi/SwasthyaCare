import mongoose from "mongoose";

const abdmRecordSchema = new mongoose.Schema(
  {
    // ---------------------------------------------------
    // Patient who owns this health record
    // ---------------------------------------------------
    patientId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Patient",
      required: true,
      index: true,
    },

    // ---------------------------------------------------
    // Patient's ABHA ID
    // ---------------------------------------------------
    abhaId: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },

    // ---------------------------------------------------
    // Simulated ABDM consent reference
    // ---------------------------------------------------
    consentId: {
      type: String,
      required: true,
      trim: true,
    },

    // ---------------------------------------------------
    // Record ID received from ABDM/HIP
    // For prototype this will be a demo record ID
    // ---------------------------------------------------
    externalRecordId: {
      type: String,
      required: true,
      trim: true,
    },

    // ---------------------------------------------------
    // Type of health record
    // ---------------------------------------------------
    recordType: {
      type: String,
      enum: [
        "Consultation",
        "Laboratory Report",
        "Medical Report",
        "Prescription",
        "Discharge Summary",
        "Other",
      ],
      default: "Other",
    },

    // ---------------------------------------------------
    // Date of original health record
    // ---------------------------------------------------
    recordDate: {
      type: Date,
      default: null,
    },

    // ---------------------------------------------------
    // Healthcare facility
    // ---------------------------------------------------
    facilityName: {
      type: String,
      default: "",
      trim: true,
    },

    // ---------------------------------------------------
    // Department
    // ---------------------------------------------------
    department: {
      type: String,
      default: "",
      trim: true,
    },

    // ---------------------------------------------------
    // General observations
    // ---------------------------------------------------
    observations: {
      type: String,
      default: "",
      trim: true,
    },

    // ---------------------------------------------------
    // Diagnosis information, if present in source record
    // ---------------------------------------------------
    diagnosis: {
      type: String,
      default: "",
      trim: true,
    },

    // ---------------------------------------------------
    // Recommendations from source record
    // ---------------------------------------------------
    recommendations: {
      type: String,
      default: "",
      trim: true,
    },

    // ---------------------------------------------------
    // Laboratory tests
    // ---------------------------------------------------
    tests: [
      {
        name: {
          type: String,
          default: "",
        },

        value: {
          type: String,
          default: "",
        },

        unit: {
          type: String,
          default: "",
        },

        referenceRange: {
          type: String,
          default: "",
        },
      },
    ],

    // ---------------------------------------------------
    // Source of the record
    // ---------------------------------------------------
    source: {
      type: String,
      default: "MOCK_ABDM",
    },

    // ---------------------------------------------------
    // Prototype indicator
    // ---------------------------------------------------
    isDemoRecord: {
      type: Boolean,
      default: true,
    },

    // ---------------------------------------------------
    // When record was imported into our HIS
    // ---------------------------------------------------
    importedAt: {
      type: Date,
      default: Date.now,
    },
  },

  {
    timestamps: true,
  },
);

// Prevent the same external record from being imported
// repeatedly for the same patient.
abdmRecordSchema.index(
  {
    patientId: 1,
    externalRecordId: 1,
  },
  {
    unique: true,
  },
);

export default mongoose.model("ABDMRecord", abdmRecordSchema);
