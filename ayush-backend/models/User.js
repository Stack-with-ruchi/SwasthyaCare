import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    role: {
      type: String,
      enum: ["doctor", "patient"],
      required: true,
    },

    // Shared Personal Information
    fullName: { type: String, trim: true },
    mobile: { type: String, unique: true, sparse: true, trim: true },
    email: {
      type: String,
      unique: true,
      sparse: true,
      lowercase: true,
      trim: true,
    },
    gender: { type: String, enum: ["Male", "Female", "Other"] },

    // Doctor-Specific Fields
    regNumber: { type: String, unique: true, sparse: true, trim: true },
    specialty: { type: String, default: "Ayurveda" },
    passwordHash: { type: String },

    // Patient-Specific Fields
    dob: { type: Date },
    abhaId: { type: String, unique: true, sparse: true, trim: true },
    languagePreference: { type: String, default: "English" },

    // One-Time Password (OTP) Details
    otp: {
      code: { type: String },
      expiresAt: { type: Date },
    },
  },
  { timestamps: true },
);

export default mongoose.model("User", userSchema);
