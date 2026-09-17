import express from "express";
import {
  createTokenDetails,
  submitAiSummary,
  getDoctorAppointments,
  respondToToken,
  updateCaseNotes,
  assignTokenToDoctor,
  getDoctorCase,
} from "../controllers/tokenController.js";
import { verifyToken } from "../middleware/auth.js";
import { requireDoctor } from "../middleware/requireDoctor.js";

const router = express.Router();

// Patient Flow
router.post("/patient/create-token", verifyToken, createTokenDetails);
router.post("/patient/submit-summary", verifyToken, submitAiSummary);

// Doctor Flow
router.get("/doctor/today-appointments", verifyToken, getDoctorAppointments);
router.post("/doctor/respond-token", verifyToken, respondToToken);
router.put("/doctor/save-notes", verifyToken, updateCaseNotes);
router.post(
  "/doctor/assign-token",
  verifyToken,
  requireDoctor,
  assignTokenToDoctor,
);

router.get("/doctor/case/:caseId", verifyToken, requireDoctor, getDoctorCase);

export default router;
