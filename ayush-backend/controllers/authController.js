import crypto from "crypto";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

import Patient from "../models/Patient.js";
import Doctor from "../models/Doctor.js";
import { INDIAN_LANGUAGES } from "../models/Language.js";
import ABDMRecord from "../models/ABDMRecord.js";
import { linkABHAAndFetchRecords } from "../services/abdmService.js";

// =====================================================
// HELPERS
// =====================================================

const generateSecureOTP = () => {
  return crypto.randomInt(100000, 999999).toString();
};

const normalizeLanguagePreference = (language) => {
  if (!language) {
    return "en";
  }

  if (typeof language === "object" && language.code) {
    return language.code;
  }

  const normalizedInput = String(language).trim();

  const matchedLanguage = INDIAN_LANGUAGES.find(
    (lang) =>
      lang.code.toLowerCase() === normalizedInput.toLowerCase() ||
      lang.name.toLowerCase() === normalizedInput.toLowerCase() ||
      lang.nativeName.toLowerCase() === normalizedInput.toLowerCase(),
  );

  return matchedLanguage?.code || normalizedInput || "en";
};

// =====================================================
// JWT HELPERS
// =====================================================

const generatePatientToken = (patient) => {
  return jwt.sign(
    {
      id: patient._id,
      role: "patient",
      languagePreference: patient.languagePreference,
    },
    process.env.JWT_SECRET,
    {
      expiresIn: "24h",
    },
  );
};

const generateDoctorToken = (doctor) => {
  return jwt.sign(
    {
      id: doctor._id,
      role: "doctor",
    },
    process.env.JWT_SECRET,
    {
      expiresIn: "24h",
    },
  );
};

// =====================================================
// DOCTOR RESPONSE HELPER
// =====================================================

const formatDoctorResponse = (doctor) => {
  return {
    id: doctor._id,

    fullName: doctor.fullName,

    mobile: doctor.mobile,

    email: doctor.email || "",

    specialization: doctor.specialization || doctor.specialty || "Ayurveda",

    degree: doctor.degree || "",

    regNumber: doctor.regNumber || "",

    regAuthority: doctor.regAuthority || doctor.registrationAuthority || "",

    hospitalClinic: doctor.hospitalClinic || "",

    department: doctor.department || "",

    age: doctor.age ?? "",

    gender: doctor.gender || "",
  };
};

// =====================================================
// 1. PATIENT SIGNUP
// =====================================================

export const registerPatient = async (req, res) => {
  try {
    const { fullName, dob, gender, abhaNumber, mobile, language, abdmConsent } =
      req.body;

    const normalizedMobile = String(mobile || "").replace(/\D/g, "");

    const normalizedAbhaNumber = String(abhaNumber || "").trim();

    const hasAbdmConsent =
      abdmConsent === true ||
      abdmConsent === "true" ||
      abdmConsent === 1 ||
      abdmConsent === "1";

    // -----------------------------------------------
    // Validate required fields
    // -----------------------------------------------

    if (
      !fullName?.trim() ||
      !dob ||
      !gender ||
      normalizedMobile.length !== 10
    ) {
      return res.status(400).json({
        message:
          "Full name, date of birth, gender, and a valid 10-digit mobile number are required.",
      });
    }

    // -----------------------------------------------
    // ABHA + consent validation
    // -----------------------------------------------

    if (normalizedAbhaNumber && !hasAbdmConsent) {
      return res.status(400).json({
        message: "ABDM consent is required when an ABHA ID is provided.",
      });
    }

    // -----------------------------------------------
    // Check duplicate mobile
    // -----------------------------------------------

    const existingPatient = await Patient.findOne({
      mobile: normalizedMobile,
    });

    if (existingPatient) {
      return res.status(400).json({
        message: "Patient with this mobile number already exists.",
      });
    }

    // -----------------------------------------------
    // Check duplicate ABHA
    // -----------------------------------------------

    if (normalizedAbhaNumber) {
      const existingAbha = await Patient.findOne({
        abhaId: normalizedAbhaNumber,
      });

      if (existingAbha) {
        return res.status(400).json({
          message: "This ABHA ID is already linked to a patient account.",
        });
      }
    }

    // =================================================
    // CREATE PATIENT
    // =================================================

    const patient = new Patient({
      fullName: fullName.trim(),

      dob,

      gender,

      mobile: normalizedMobile,

      abhaId: normalizedAbhaNumber || undefined,

      languagePreference: normalizeLanguagePreference(language),

      abdmLinked: false,

      abdmConsentStatus: normalizedAbhaNumber ? "Pending" : "NotRequested",

      abdmConsentAt: normalizedAbhaNumber && hasAbdmConsent ? new Date() : null,

      abdmLinkedAt: null,
    });

    await patient.save();

    console.log(`[Patient Signup] Patient created: ${patient._id}`);

    // =================================================
    // ABDM PROTOTYPE FLOW
    // =================================================

    let importedRecords = [];

    let consentId = null;

    if (normalizedAbhaNumber && hasAbdmConsent) {
      console.log(`[ABDM Prototype] Starting flow for patient ${patient._id}`);

      const abdmResult = await linkABHAAndFetchRecords({
        patientId: patient._id.toString(),

        abhaId: normalizedAbhaNumber,
      });

      // ---------------------------------------------
      // ABDM FLOW FAILED
      // ---------------------------------------------

      if (!abdmResult.success) {
        console.error("[ABDM Prototype] Flow failed:", abdmResult.message);

        patient.abdmConsentStatus = "Pending";

        patient.abdmLinked = false;

        patient.abdmLinkedAt = null;

        await patient.save();

        const token = generatePatientToken(patient);

        return res.status(201).json({
          message:
            "Patient registered successfully, but ABDM record linking is pending.",

          token,

          patientId: patient._id,

          patient: {
            id: patient._id,

            fullName: patient.fullName,

            mobile: patient.mobile,

            abhaId: patient.abhaId || null,

            dob: patient.dob,

            gender: patient.gender,

            languagePreference: patient.languagePreference,

            abdmConsentStatus: patient.abdmConsentStatus,

            abdmLinked: patient.abdmLinked,

            importedRecordCount: 0,
          },
        });
      }

      // ---------------------------------------------
      // ABDM FLOW SUCCESSFUL
      // ---------------------------------------------

      consentId = abdmResult.consent?.consentId || null;

      importedRecords = abdmResult.records || [];

      patient.abdmConsentStatus = "Granted";

      patient.abdmLinked = true;

      patient.abdmLinkedAt = new Date();

      await patient.save();

      console.log(
        `[ABDM Prototype] Patient ${patient._id} linked successfully.`,
      );
    }

    // =================================================
    // SAVE HEALTH RECORDS
    // =================================================

    if (consentId && importedRecords.length > 0) {
      const recordsToSave = importedRecords.map((record) => ({
        patientId: patient._id,

        abhaId: normalizedAbhaNumber,

        consentId,

        externalRecordId: record.recordId,

        recordType: record.recordType || "Other",

        recordDate: record.date || null,

        facilityName: record.facilityName || "",

        department: record.department || "",

        observations: record.observations || "",

        diagnosis: record.diagnosis || "",

        recommendations: record.recommendations || "",

        tests: Array.isArray(record.tests) ? record.tests : [],

        source: record.source || "MOCK_ABDM",

        isDemoRecord: true,

        importedAt: new Date(),
      }));

      try {
        await ABDMRecord.insertMany(recordsToSave);

        console.log(
          `[HIS] ${recordsToSave.length} ABDM prototype records stored for patient ${patient._id}.`,
        );
      } catch (recordError) {
        console.error("[HIS] Failed to save ABDM records:", recordError);
      }
    }

    // =================================================
    // GENERATE PATIENT TOKEN
    // =================================================

    const token = generatePatientToken(patient);

    // =================================================
    // FINAL RESPONSE
    // =================================================

    return res.status(201).json({
      message: "Patient registered successfully.",

      token,

      patientId: patient._id,

      patient: {
        id: patient._id,

        fullName: patient.fullName,

        mobile: patient.mobile,

        abhaId: patient.abhaId || null,

        dob: patient.dob,

        gender: patient.gender,

        languagePreference: patient.languagePreference,

        abdmConsentStatus: patient.abdmConsentStatus,

        abdmLinked: patient.abdmLinked,

        importedRecordCount: importedRecords.length,
      },
    });
  } catch (error) {
    console.error("Patient registration error:", error);

    return res.status(500).json({
      message: "Patient registration failed.",

      error: error.message,
    });
  }
};

// =====================================================
// 2. PATIENT LOGIN - SEND OTP
// =====================================================

export const sendPatientOTP = async (req, res) => {
  try {
    const { identifier } = req.body;

    const normalizedIdentifier = String(identifier || "").trim();

    if (!normalizedIdentifier) {
      return res.status(400).json({
        message: "Mobile number or ABHA ID is required.",
      });
    }

    const patient = await Patient.findOne({
      $or: [
        {
          mobile: normalizedIdentifier,
        },
        {
          abhaId: normalizedIdentifier,
        },
      ],
    });

    if (!patient) {
      return res.status(404).json({
        message: "Patient account not found. Please sign up first.",
      });
    }

    const otpCode = generateSecureOTP();

    patient.otp = {
      code: otpCode,

      expiresAt: new Date(Date.now() + 10 * 60 * 1000),
    };

    await patient.save();

    console.log(`[Patient OTP] Sent to ${normalizedIdentifier}: ${otpCode}`);

    return res.status(200).json({
      message: "OTP sent to registered patient.",

      // Demo only
      demoOtp: otpCode,
    });
  } catch (error) {
    console.error("Send patient OTP error:", error);

    return res.status(500).json({
      message: "Failed to send OTP.",

      error: error.message,
    });
  }
};

// =====================================================
// 3. PATIENT LOGIN - VERIFY OTP
// =====================================================

export const verifyPatientOTP = async (req, res) => {
  try {
    const { identifier, otp } = req.body;

    const normalizedIdentifier = String(identifier || "").trim();

    const normalizedOtp = String(otp || "").trim();

    const patient = await Patient.findOne({
      $or: [
        {
          mobile: normalizedIdentifier,
        },
        {
          abhaId: normalizedIdentifier,
        },
      ],
    });

    if (!patient || !patient.otp || patient.otp.code !== normalizedOtp) {
      return res.status(400).json({
        message: "Invalid OTP provided.",
      });
    }

    if (new Date() > patient.otp.expiresAt) {
      return res.status(400).json({
        message: "OTP has expired.",
      });
    }

    // Clear OTP after login
    patient.otp = undefined;

    await patient.save();

    const token = generatePatientToken(patient);

    return res.status(200).json({
      message: "Login successful.",

      token,

      patient: {
        id: patient._id,

        fullName: patient.fullName,

        mobile: patient.mobile,

        abhaId: patient.abhaId || null,

        dob: patient.dob,

        gender: patient.gender,

        languagePreference: patient.languagePreference,
      },
    });
  } catch (error) {
    console.error("Patient login error:", error);

    return res.status(500).json({
      message: "Login failed.",

      error: error.message,
    });
  }
};

// =====================================================
// 4. DOCTOR SIGNUP
// =====================================================

export const registerDoctor = async (req, res) => {
  try {
    const {
      fullName,
      age,
      gender,
      degree,

      specialty,
      specialization,

      regNumber,

      registrationAuthority,
      regAuthority,

      hospitalClinic,
      department,

      password,
      mobile,
      email,

      abdmConsent,
    } = req.body;

    // -----------------------------------------------
    // Validate required fields
    // -----------------------------------------------

    if (
      !fullName?.trim() ||
      !mobile?.trim() ||
      !regNumber?.trim() ||
      !password ||
      !hospitalClinic?.trim() ||
      !department?.trim()
    ) {
      return res.status(400).json({
        success: false,

        message:
          "Full name, mobile, registration number, password, hospital/clinic, and department are required.",
      });
    }

    // -----------------------------------------------
    // Normalize values
    // -----------------------------------------------

    const normalizedMobile = mobile.trim();

    const normalizedRegNumber = regNumber.trim();

    const normalizedEmail = email?.trim() || "";

    const finalSpecialization =
      specialization?.trim() || specialty?.trim() || "Ayurveda";

    const finalRegistrationAuthority =
      registrationAuthority?.trim() || regAuthority?.trim() || "";

    // -----------------------------------------------
    // Duplicate registration number
    // -----------------------------------------------

    const existingDoctor = await Doctor.findOne({
      regNumber: normalizedRegNumber,
    });

    if (existingDoctor) {
      return res.status(400).json({
        success: false,

        message: "Doctor with this registration number already exists.",
      });
    }

    // -----------------------------------------------
    // Duplicate mobile
    // -----------------------------------------------

    const existingMobile = await Doctor.findOne({
      mobile: normalizedMobile,
    });

    if (existingMobile) {
      return res.status(400).json({
        success: false,

        message: "Doctor with this mobile number already exists.",
      });
    }

    // -----------------------------------------------
    // Duplicate email
    // -----------------------------------------------

    if (normalizedEmail) {
      const existingEmail = await Doctor.findOne({
        email: normalizedEmail,
      });

      if (existingEmail) {
        return res.status(400).json({
          success: false,

          message: "Doctor with this email already exists.",
        });
      }
    }

    // -----------------------------------------------
    // Hash password
    // -----------------------------------------------

    const passwordHash = await bcrypt.hash(password, 10);

    // =================================================
    // CREATE DOCTOR
    // =================================================

    const doctor = new Doctor({
      fullName: fullName.trim(),

      mobile: normalizedMobile,

      email: normalizedEmail || undefined,

      age:
        age !== undefined && age !== null && age !== ""
          ? Number(age)
          : undefined,

      gender: gender || "",

      degree: degree?.trim() || "",

      specialization: finalSpecialization,

      regNumber: normalizedRegNumber,

      regAuthority: finalRegistrationAuthority,

      hospitalClinic: hospitalClinic.trim(),

      department: department.trim(),

      passwordHash,

      abdmConsent: !!abdmConsent,
    });

    await doctor.save();

    console.log(`[Doctor Signup] Doctor created: ${doctor._id}`);

    // -----------------------------------------------
    // IMPORTANT:
    // We return doctor details so the frontend can
    // immediately create ayush_doctor_session.
    // -----------------------------------------------

    const doctorData = formatDoctorResponse(doctor);

    return res.status(201).json({
      success: true,

      message: "Doctor registered successfully.",

      doctorId: doctor._id,

      doctor: doctorData,
    });
  } catch (error) {
    console.error("Doctor registration error:", error);

    return res.status(500).json({
      success: false,

      message: "Doctor registration failed.",

      error: error.message,
    });
  }
};

// =====================================================
// 5. DOCTOR LOGIN
// =====================================================

export const loginDoctor = async (req, res) => {
  try {
    const { identifier, password } = req.body;

    // -----------------------------------------------
    // Validate
    // -----------------------------------------------

    if (!identifier?.trim() || !password) {
      return res.status(400).json({
        success: false,

        message:
          "Medical Registration Number, Mobile Number or Email and password are required.",
      });
    }

    const normalizedIdentifier = identifier.trim();

    // -----------------------------------------------
    // Find doctor
    // -----------------------------------------------

    const doctor = await Doctor.findOne({
      $or: [
        {
          regNumber: normalizedIdentifier,
        },

        {
          mobile: normalizedIdentifier,
        },

        {
          email: normalizedIdentifier,
        },
      ],
    });

    if (!doctor) {
      return res.status(401).json({
        success: false,

        message: "Invalid login credentials.",
      });
    }

    // -----------------------------------------------
    // Check password
    // -----------------------------------------------

    if (!doctor.passwordHash) {
      return res.status(401).json({
        success: false,

        message: "Password is not configured for this doctor account.",
      });
    }

    const isPasswordValid = await bcrypt.compare(password, doctor.passwordHash);

    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,

        message: "Invalid login credentials.",
      });
    }

    // -----------------------------------------------
    // Generate JWT
    // -----------------------------------------------

    const token = generateDoctorToken(doctor);

    const doctorData = formatDoctorResponse(doctor);

    console.log(`[Doctor Login] Doctor logged in: ${doctor._id}`);

    return res.status(200).json({
      success: true,

      message: "Doctor login successful.",

      token,

      doctor: doctorData,
    });
  } catch (error) {
    console.error("Doctor login error:", error);

    return res.status(500).json({
      success: false,

      message: "Doctor login failed.",

      error: error.message,
    });
  }
};

// =====================================================
// 6. UPDATE PATIENT LANGUAGE
// =====================================================

export const updatePatientLanguage = async (req, res) => {
  try {
    const { languageCode } = req.body;

    if (!languageCode) {
      return res.status(400).json({
        message: "Language code is required.",
      });
    }

    const patient = await Patient.findByIdAndUpdate(
      req.user.id,

      {
        languagePreference: languageCode,
      },

      {
        new: true,
        runValidators: true,
      },
    ).select("_id languagePreference");

    if (!patient) {
      return res.status(404).json({
        message: "Patient account not found.",
      });
    }

    return res.status(200).json({
      message: "Language preference updated successfully.",

      languageCode: patient.languagePreference,
    });
  } catch (error) {
    console.error("Update patient language error:", error);

    return res.status(500).json({
      message: "Failed to update language preference.",

      error: error.message,
    });
  }
};

// =====================================================
// 7. COMPLETE DOCTOR REGISTRATION
// =====================================================

export const registerDoctorComplete = async (req, res) => {
  try {
    const {
      fullName,
      mobile,
      email,
      age,
      gender,
      degree,

      specialization,
      specialty,

      regNumber,

      regAuthority,
      registrationAuthority,

      hospitalClinic,
      department,

      password,
      abdmConsent,
    } = req.body;

    // -----------------------------------------------
    // Validate required fields
    // -----------------------------------------------

    if (
      !fullName?.trim() ||
      !mobile?.trim() ||
      !regNumber?.trim() ||
      !password ||
      !hospitalClinic?.trim() ||
      !department?.trim()
    ) {
      return res.status(400).json({
        success: false,

        message:
          "Full name, mobile, registration number, password, hospital/clinic, and department are required.",
      });
    }

    // -----------------------------------------------
    // Normalize
    // -----------------------------------------------

    const normalizedMobile = mobile.trim();

    const normalizedRegNumber = regNumber.trim();

    const normalizedEmail = email?.trim() || "";

    const finalSpecialization =
      specialization?.trim() || specialty?.trim() || "Ayurveda";

    const finalRegistrationAuthority =
      registrationAuthority?.trim() || regAuthority?.trim() || "";

    // -----------------------------------------------
    // Duplicate registration number
    // -----------------------------------------------

    const existingDoctor = await Doctor.findOne({
      regNumber: normalizedRegNumber,
    });

    if (existingDoctor) {
      return res.status(400).json({
        success: false,

        message: "Doctor with this registration number already exists.",
      });
    }

    // -----------------------------------------------
    // Duplicate mobile
    // -----------------------------------------------

    const existingMobile = await Doctor.findOne({
      mobile: normalizedMobile,
    });

    if (existingMobile) {
      return res.status(400).json({
        success: false,

        message: "Doctor with this mobile number already exists.",
      });
    }

    // -----------------------------------------------
    // Duplicate email
    // -----------------------------------------------

    if (normalizedEmail) {
      const existingEmail = await Doctor.findOne({
        email: normalizedEmail,
      });

      if (existingEmail) {
        return res.status(400).json({
          success: false,

          message: "Doctor with this email already exists.",
        });
      }
    }

    // -----------------------------------------------
    // Hash password
    // -----------------------------------------------

    const passwordHash = await bcrypt.hash(password, 10);

    // -----------------------------------------------
    // Create doctor
    // -----------------------------------------------

    const doctor = new Doctor({
      fullName: fullName.trim(),

      mobile: normalizedMobile,

      email: normalizedEmail || undefined,

      age:
        age !== undefined && age !== null && age !== ""
          ? Number(age)
          : undefined,

      gender: gender || "",

      degree: degree?.trim() || "",

      specialization: finalSpecialization,

      regNumber: normalizedRegNumber,

      regAuthority: finalRegistrationAuthority,

      hospitalClinic: hospitalClinic.trim(),

      department: department.trim(),

      passwordHash,

      abdmConsent: !!abdmConsent,
    });

    await doctor.save();

    console.log(`[Doctor Complete Signup] Doctor created: ${doctor._id}`);

    const doctorData = formatDoctorResponse(doctor);

    return res.status(201).json({
      success: true,

      message: "Doctor registered successfully with ABDM consent.",

      doctorId: doctor._id,

      doctor: doctorData,
    });
  } catch (error) {
    console.error("Complete doctor registration error:", error);

    return res.status(500).json({
      success: false,

      message: "Doctor registration failed.",

      error: error.message,
    });
  }
};
