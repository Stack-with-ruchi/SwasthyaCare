import express from "express";
import { getPatientABDMRecords } from "../controllers/abdmController.js";
import { verifyToken } from "../middleware/auth.js";

const router = express.Router();

// Get records belonging to the logged-in patient
router.get("/my-records", verifyToken, getPatientABDMRecords);

export default router;
