import crypto from "crypto";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import Patient from "../models/Patient.js";
import Doctor from "../models/Doctor.js";
import { INDIAN_LANGUAGES } from "../models/Language.js";
import ABDMRecord from "../models/ABDMRecord.js";
import { linkABHAAndFetchRecords } from "../services/abdmService.js";

const generateSecureOTP = () => crypto.randomInt(100000, 999999).toString();

const generateDoctorCode = () => {
  return `DOC-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
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
    // STEP 1: CREATE PATIENT FIRST
    // =================================================

    const patient = new Patient({
      fullName: fullName.trim(),

      dob,

      gender,

      mobile: normalizedMobile,

      abhaId: normalizedAbhaNumber || undefined,

      languagePreference: normalizeLanguagePreference(language),

      // Default values before ABDM prototype flow
      abdmLinked: false,

      abdmConsentStatus: normalizedAbhaNumber ? "Pending" : "NotRequested",

      abdmConsentAt: normalizedAbhaNumber && hasAbdmConsent ? new Date() : null,

      abdmLinkedAt: null,
    });

    await patient.save();

    console.log(`[Patient Signup] Patient created: ${patient._id}`);

    // =================================================
    // STEP 2: ABDM PROTOTYPE FLOW
    // =================================================

    let importedRecords = [];
    let consentId = null;

    if (normalizedAbhaNumber && hasAbdmConsent) {
      console.log(`[ABDM Prototype] Starting flow for patient ${patient._id}`);

      const abdmResult = await linkABHAAndFetchRecords({
        patientId: patient._id.toString(),
        abhaId: normalizedAbhaNumber,
      });

      // -----------------------------------------------
      // ABDM flow failed
      // -----------------------------------------------
      if (!abdmResult.success) {
        console.error("[ABDM Prototype] Flow failed:", abdmResult.message);

        // Keep patient account but mark ABDM flow as pending
        patient.abdmConsentStatus = "Pending";
        patient.abdmLinked = false;
        patient.abdmLinkedAt = null;

        await patient.save();

        return res.status(201).json({
          message:
            "Patient registered successfully, but ABDM record linking is pending.",

          patientId: patient._id,

          patient: {
            id: patient._id,
            fullName: patient.fullName,
            mobile: patient.mobile,
            abhaId: patient.abhaId || null,
            languagePreference: patient.languagePreference,
            abdmConsentStatus: patient.abdmConsentStatus,
            abdmLinked: patient.abdmLinked,
            importedRecordCount: 0,
          },
        });
      }

      // -----------------------------------------------
      // ABDM flow successful
      // -----------------------------------------------
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
    // STEP 3: SAVE HEALTH RECORDS INTO HIS
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

        // Patient remains linked even if record storage fails.
        // The record-storage problem can be retried separately.
      }
    }

    // =================================================
    // STEP 4: FINAL RESPONSE
    // =================================================

    return res.status(201).json({
      message: "Patient registered successfully.",

      patientId: patient._id,

      patient: {
        id: patient._id,

        fullName: patient.fullName,

        mobile: patient.mobile,

        abhaId: patient.abhaId || null,

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

    const patient = await Patient.findOne({
      $or: [{ mobile: identifier }, { abhaId: identifier }],
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

    console.log(`[Patient OTP] Sent to ${identifier}: ${otpCode}`);

    res.status(200).json({
      message: "OTP sent to registered patient.",
      demoOtp: otpCode,
    });
  } catch (error) {
    res.status(500).json({
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

    const patient = await Patient.findOne({
      $or: [{ mobile: identifier }, { abhaId: identifier }],
    });

    if (!patient || !patient.otp || patient.otp.code !== otp) {
      return res.status(400).json({
        message: "Invalid OTP provided.",
      });
    }

    if (new Date() > patient.otp.expiresAt) {
      return res.status(400).json({
        message: "OTP has expired.",
      });
    }

    // Clear OTP after successful login
    patient.otp = undefined;

    await patient.save();

    const token = jwt.sign(
      {
        id: patient._id,
        role: "patient",
        languagePreference: patient.languagePreference,
      },
      process.env.JWT_SECRET || "ayushcare_jwt_secret_key_2026",
      {
        expiresIn: "24h",
      },
    );

    res.status(200).json({
      message: "Login successful.",
      token,

      patient: {
        id: patient._id,
        fullName: patient.fullName,
        mobile: patient.mobile,
        abhaId: patient.abhaId,
        dob: patient.dob,
        gender: patient.gender,
        languagePreference: patient.languagePreference,
      },
    });
  } catch (error) {
    res.status(500).json({
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

      // Frontend currently sends "specialty"
      specialty,

      // Also support "specialization"
      specialization,

      regNumber,

      // Frontend sends registrationAuthority
      registrationAuthority,

      // Also support existing backend name
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
    // Check duplicate registration number
    // -----------------------------------------------
    const existingDoctor = await Doctor.findOne({
      regNumber: regNumber.trim(),
    });

    if (existingDoctor) {
      return res.status(400).json({
        success: false,
        message: "Doctor with this registration number already exists.",
      });
    }

    // -----------------------------------------------
    // Check duplicate mobile
    // -----------------------------------------------
    const existingMobile = await Doctor.findOne({
      mobile: mobile.trim(),
    });

    if (existingMobile) {
      return res.status(400).json({
        success: false,
        message: "Doctor with this mobile number already exists.",
      });
    }

    // -----------------------------------------------
    // Hash password
    // -----------------------------------------------
    const salt = await bcrypt.genSalt(10);

    const passwordHash = await bcrypt.hash(password, salt);

    // -----------------------------------------------
    // Support both frontend/backend field names
    // -----------------------------------------------
    const finalSpecialization =
      specialization?.trim() || specialty?.trim() || "Ayurveda";

    const finalRegistrationAuthority =
      registrationAuthority?.trim() || regAuthority?.trim() || "";

    // -----------------------------------------------
    // Create doctor
    // -----------------------------------------------
    const doctor = new Doctor({
      fullName: fullName.trim(),

      mobile: mobile.trim(),

      email: email?.trim() || undefined,

      age: age ? Number(age) : undefined,

      gender,

      degree: degree?.trim() || "",

      specialization: finalSpecialization,

      regNumber: regNumber.trim(),

      regAuthority: finalRegistrationAuthority,

      // NEW FIELDS
      hospitalClinic: hospitalClinic.trim(),

      department: department.trim(),

      passwordHash,

      abdmConsent: !!abdmConsent,
    });

    await doctor.save();

    return res.status(201).json({
      success: true,
      message: "Doctor registered successfully.",
      doctorId: doctor._id,
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
// 5. DOCTOR LOGIN - PASSWORD
// =====================================================
export const loginDoctor = async (req, res) => {
  try {
    const { identifier, password } = req.body;

    // -----------------------------------------------
    // Validate login fields
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
    // Find doctor using:
    // 1. Medical Registration Number
    // 2. Mobile Number
    // 3. Email
    // -----------------------------------------------
    const doctor = await Doctor.findOne({
      $or: [
        { regNumber: normalizedIdentifier },
        { mobile: normalizedIdentifier },
        { email: normalizedIdentifier },
      ],
    });

    // -----------------------------------------------
    // Doctor not found
    // -----------------------------------------------
    if (!doctor) {
      return res.status(401).json({
        success: false,
        message: "Invalid login credentials.",
      });
    }

    // -----------------------------------------------
    // Verify password
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
    const token = jwt.sign(
      {
        id: doctor._id,
        role: "doctor",
      },
      process.env.JWT_SECRET || "ayushcare_jwt_secret_key_2026",
      {
        expiresIn: "24h",
      },
    );

    // -----------------------------------------------
    // Successful login
    // -----------------------------------------------
    return res.status(200).json({
      success: true,
      message: "Doctor login successful.",

      token,

      doctor: {
        id: doctor._id,

        fullName: doctor.fullName,

        mobile: doctor.mobile,

        email: doctor.email || "",

        specialization: doctor.specialization || "Ayurveda",

        degree: doctor.degree || "",

        regNumber: doctor.regNumber,

        regAuthority: doctor.regAuthority || "",

        hospitalClinic: doctor.hospitalClinic || "",

        department: doctor.department || "",

        age: doctor.age || "",

        gender: doctor.gender || "",
      },
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
        returnDocument: "after",
        runValidators: true,
      },
    ).select("_id languagePreference");

    if (!patient) {
      return res.status(404).json({
        message: "Patient account not found.",
      });
    }

    res.status(200).json({
      message: "Language preference updated successfully.",
      languageCode: patient.languagePreference,
    });
  } catch (error) {
    res.status(500).json({
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

      // Support both names
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
    // Check duplicate registration number
    // -----------------------------------------------
    const existingDoctor = await Doctor.findOne({
      regNumber: regNumber.trim(),
    });

    if (existingDoctor) {
      return res.status(400).json({
        success: false,
        message: "Doctor with this registration number already exists.",
      });
    }

    // -----------------------------------------------
    // Check duplicate mobile
    // -----------------------------------------------
    const existingMobile = await Doctor.findOne({
      mobile: mobile.trim(),
    });

    if (existingMobile) {
      return res.status(400).json({
        success: false,
        message: "Doctor with this mobile number already exists.",
      });
    }

    // -----------------------------------------------
    // Hash password
    // -----------------------------------------------
    const salt = await bcrypt.genSalt(10);

    const passwordHash = await bcrypt.hash(password, salt);

    // -----------------------------------------------
    // Normalize field names
    // -----------------------------------------------
    const finalSpecialization =
      specialization?.trim() || specialty?.trim() || "Ayurveda";

    const finalRegistrationAuthority =
      registrationAuthority?.trim() || regAuthority?.trim() || "";

    // -----------------------------------------------
    // Create doctor
    // -----------------------------------------------
    const doctor = new Doctor({
      fullName: fullName.trim(),

      mobile: mobile.trim(),

      email: email?.trim() || undefined,

      age: age ? Number(age) : undefined,

      gender,

      degree: degree?.trim() || "",

      specialization: finalSpecialization,

      regNumber: regNumber.trim(),

      regAuthority: finalRegistrationAuthority,

      hospitalClinic: hospitalClinic.trim(),

      department: department.trim(),

      passwordHash,

      abdmConsent: !!abdmConsent,
    });

    await doctor.save();

    return res.status(201).json({
      success: true,
      message: "Doctor registered successfully with ABDM consent.",
      doctorId: doctor._id,
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
