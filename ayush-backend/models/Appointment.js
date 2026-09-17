import mongoose from "mongoose";

const appointmentSchema = new mongoose.Schema(
  {
    // ========================================
    // PATIENT
    // ========================================
    patientId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Patient",
      required: true,
    },

    // ========================================
    // DOCTOR
    // ========================================
    doctorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Doctor",
      default: null,
    },

    // ========================================
    // LINKED CASE
    // ========================================
    tokenCaseId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "TokenCase",
      default: null,
    },

    // ========================================
    // CASE INFORMATION
    // ========================================
    tokenNumber: {
      type: String,
      required: true,
      trim: true,
    },

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

    // ========================================
    // REQUEST DATE & TIME
    // Automatically created when patient
    // submits the case
    // ========================================
    requestDate: {
      type: Date,
      default: Date.now,
    },

    requestTime: {
      type: String,
      default: null,
    },

    // ========================================
    // CONSULTATION DATE & TIME
    // Selected/set when doctor accepts
    // ========================================
    appointmentDate: {
      type: Date,
      default: null,
    },

    appointmentTime: {
      type: String,
      default: null,
    },

    // ========================================
    // APPOINTMENT STATUS
    // ========================================
    status: {
      type: String,
      enum: ["Pending", "Accepted", "Rejected", "Completed", "Cancelled"],
      default: "Pending",
    },

    // ========================================
    // OPTIONAL REASON
    // ========================================
    reason: {
      type: String,
      default: "",
      trim: true,
    },

    // ========================================
    // DOCTOR NOTES
    // ========================================
    doctorNotes: {
      type: String,
      default: "",
    },
  },
  {
    timestamps: true,
  },
);

export default mongoose.model("Appointment", appointmentSchema);
