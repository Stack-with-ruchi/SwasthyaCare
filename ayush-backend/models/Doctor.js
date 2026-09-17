import mongoose from "mongoose";

const doctorSchema = new mongoose.Schema(
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

    age: {
      type: Number,
    },

    gender: {
      type: String,
      enum: ["Male", "Female", "Other"],
    },

    degree: {
      type: String,
      trim: true,
    },

    specialization: {
      type: String,
      default: "Ayurveda",
      trim: true,
    },

    regNumber: {
      type: String,
      required: true,
      unique: true,
      index: true,
      trim: true,
    },

    regAuthority: {
      type: String,
      trim: true,
    },

    hospitalClinic: {
      type: String,
      required: true,
      trim: true,
    },

    department: {
      type: String,
      required: true,
      trim: true,
    },

    passwordHash: {
      type: String,
      required: true,
    },

    abdmConsent: {
      type: Boolean,
      default: false,
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

export default mongoose.model("Doctor", doctorSchema);
