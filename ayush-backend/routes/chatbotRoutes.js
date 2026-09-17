import express from "express";

import {
  chatbotReply,
  generateCaseSummary,
} from "../controllers/chatbotController.js";

import { uploadChatbotDocument } from "../controllers/chatbotDocumentController.js";

import { verifyToken } from "../middleware/auth.js";

import upload from "../middleware/upload.js";

const router = express.Router();

// =====================================================
// AI CHAT
// =====================================================

router.post("/", verifyToken, chatbotReply);

// =====================================================
// AI CASE SUMMARY
// =====================================================

router.post("/case-summary", verifyToken, generateCaseSummary);

// =====================================================
// AI DOCUMENT UPLOAD + OCR
// =====================================================

router.post(
  "/upload",
  verifyToken,
  upload.single("document"),
  uploadChatbotDocument,
);

export default router;
