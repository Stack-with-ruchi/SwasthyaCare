import express from "express";

import {
  getPatientDashboardOverview,
  createPatientToken,
  processAiCaseEnquiry,
  getPatientCaseHistory,
  getPatientProfile,
  getPatientAbha,
  getAIDocumentConsent,
  acceptAIDocumentConsent,
  getAISummaryForReview,
  approveAISummary,
} from "../controllers/patientDashboardController.js";

import { verifyToken } from "../middleware/auth.js";

const router = express.Router();

// ============================================
// PATIENT DASHBOARD
// ============================================

router.get("/dashboard", verifyToken, getPatientDashboardOverview);

// ============================================
// PATIENT PROFILE
// ============================================

router.get("/profile", verifyToken, getPatientProfile);

// ============================================
// PATIENT ABHA DETAILS
// ============================================

router.get("/abha", verifyToken, getPatientAbha);

// ============================================
// CREATE PATIENT TOKEN / CASE
// ============================================

router.post("/token/create", verifyToken, createPatientToken);

// ============================================
// AI CASE ENQUIRY
// ============================================

router.post("/ai-case-enquiry", verifyToken, processAiCaseEnquiry);

// ============================================
// PATIENT CASE HISTORY
// ============================================

router.get("/cases", verifyToken, getPatientCaseHistory);

// =====================================================
// AI CHAT DOCUMENT CONSENT
// =====================================================

// Check whether patient has already given
// valid consent for AI document processing.

router.get("/ai-document-consent", verifyToken, getAIDocumentConsent);

// Save patient's consent when they click
// "I Agree & Continue".

router.post("/ai-document-consent", verifyToken, acceptAIDocumentConsent);

// =====================================================
// AI SUMMARY REVIEW
// =====================================================

// Get the generated AI case summary
// for patient review before sharing with doctor.

router.get("/ai-summary/:tokenCaseId", verifyToken, getAISummaryForReview);

// =====================================================
// APPROVE AI SUMMARY
// =====================================================

// Patient approves the AI-generated summary.
// Only after approval can it be marked
// as approved for doctor sharing.

router.post("/ai-summary/:tokenCaseId/approve", verifyToken, approveAISummary);

export default router;
