import express from "express";

import {
  getPatientDocuments,
  uploadDocument,
} from "../controllers/documentController.js";

import { verifyToken } from "../middleware/auth.js";
import upload from "../middleware/upload.js";

const router = express.Router();

// Get all documents of logged-in patient
router.get("/my-documents", verifyToken, getPatientDocuments);

// Upload a new document
router.post("/upload", verifyToken, upload.single("document"), uploadDocument);

export default router;
