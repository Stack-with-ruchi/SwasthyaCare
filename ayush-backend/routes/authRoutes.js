import express from "express";
import {
  registerPatient,
  sendPatientOTP,
  verifyPatientOTP,
  registerDoctor,
  loginDoctor,
  updatePatientLanguage,
} from "../controllers/authController.js";
import { verifyToken } from "../middleware/auth.js";

const router = express.Router();

// Patient Auth Routes
router.post("/patient/signup", registerPatient);
router.post("/patient/send-otp", sendPatientOTP);
router.post("/patient/verify-otp", verifyPatientOTP);
router.put("/patient/language", verifyToken, updatePatientLanguage);

// Doctor Auth Routes
router.post("/doctor/signup", registerDoctor);
router.post("/doctor/login", loginDoctor);

export default router;
