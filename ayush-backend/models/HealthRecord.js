import mongoose from "mongoose";

const healthRecordSchema = new mongoose.Schema(
  {
    patientId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Patient",
      required: true,
    },

    // ABHA identifier associated with this record
    abhaId: {
      type: String,
      required: true,
      trim: true,
    },

    // ID received from the source/HIP
    recordId: {
      type: String,
      required: true,
      trim: true,
    },

    title: {
      type: String,
      required: true,
      trim: true,
    },

    recordType: {
      type: String,
      default: "Medical Record",
      trim: true,
    },

    recordDate: {
      type: Date,
      default: null,
    },

    // Example: ABDM, hospital HIS, etc.
    source: {
      type: String,
      default: "ABDM",
      trim: true,
    },

    // URL/reference to the document if available
    documentUrl: {
      type: String,
      default: null,
    },

    // Whether this record can be used during AI consultation
    aiUsable: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  },
);

const HealthRecord = mongoose.model("HealthRecord", healthRecordSchema);

export default HealthRecord;
