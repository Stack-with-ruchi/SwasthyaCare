import express from "express";

import {
  getDoctorDashboard,
  getDoctorPatients,
  getDoctorPatientDetails,
  getDoctorCaseDetails,
  getDoctorPatientDocuments,
  updateCaseAction,
  updateDoctorNotes,
  generateDoctorCaseSummary,
  getDoctorEditableSummary,
  updateDoctorEditedSummary,
} from "../controllers/doctorController.js";

const router = express.Router();

router.get("/dashboard", getDoctorDashboard);

router.get("/patients", getDoctorPatients);

router.get("/patients/:patientId", getDoctorPatientDetails);

router.get("/cases/:caseId", getDoctorCaseDetails);

router.get("/cases/:caseId/documents", getDoctorPatientDocuments);

router.post("/cases/:caseId/ai-summary", generateDoctorCaseSummary);

router.get("/cases/:caseId/edit-summary", getDoctorEditableSummary);

router.put("/cases/:caseId/edited-summary", updateDoctorEditedSummary);

router.patch("/cases/:caseId/action", updateCaseAction);

router.patch("/cases/:caseId/notes", updateDoctorNotes);

export default router;
