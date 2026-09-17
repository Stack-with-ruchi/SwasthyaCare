// services/abdmService.js

/**
 * ============================================================
 * SWASTHYACARE - ABDM PROTOTYPE SERVICE
 * ============================================================
 *
 * IMPORTANT:
 * This file is a MOCK/PROTOTYPE ABDM service for the SIH demo.
 *
 * It does NOT connect to the real ABDM network.
 * It simulates:
 *
 * 1. ABHA-based consent request
 * 2. Consent approval
 * 3. Fetching consented health records
 *
 * For the SIH prototype, mock health records are returned
 * instead of real patient records.
 *
 * Later, this service can be replaced with actual ABDM
 * Sandbox API integration without changing the rest of
 * the application architecture.
 * ============================================================
 */

// ============================================================
// 1. CREATE ABDM CONSENT
// ============================================================

export const createABDMConsent = async ({
  patientId,
  abhaId,
  purpose = "Healthcare service and medical record access",
}) => {
  try {
    if (!patientId) {
      throw new Error("Patient ID is required.");
    }

    if (!abhaId) {
      throw new Error("ABHA ID is required.");
    }

    // Simulated consent ID
    const consentId = `CONSENT-${Date.now()}-${Math.random()
      .toString(36)
      .substring(2, 8)
      .toUpperCase()}`;

    const consentCreatedAt = new Date();

    return {
      success: true,

      simulated: true,

      consentId,

      patientId,

      abhaId,

      purpose,

      status: "Granted",

      consentCreatedAt,

      message: "Prototype ABDM consent granted successfully.",
    };
  } catch (error) {
    console.error("ABDM consent creation error:", error);

    return {
      success: false,

      simulated: true,

      status: "Failed",

      message: error.message,
    };
  }
};

// ============================================================
// 2. FETCH ABDM HEALTH RECORDS
// ============================================================

export const getABDMHealthRecords = async ({
  patientId,
  abhaId,
  consentId,
}) => {
  try {
    if (!patientId) {
      throw new Error("Patient ID is required.");
    }

    if (!abhaId) {
      throw new Error("ABHA ID is required.");
    }

    if (!consentId) {
      throw new Error("Valid ABDM consent is required.");
    }

    // --------------------------------------------------------
    // MOCK HEALTH RECORDS
    // --------------------------------------------------------
    //
    // These are demo records only.
    // They are NOT fetched from ABDM.
    //
    // Keep these generic for the SIH prototype.
    // --------------------------------------------------------

    const healthRecords = [
      {
        recordId: `DEMO-REC-${Date.now()}-001`,

        recordType: "Consultation",

        date: new Date("2026-08-20"),

        facilityName: "Demo Health Clinic",

        department: "General Medicine",

        diagnosis: "Demo record - not a real diagnosis",

        observations: "Patient reported occasional fatigue and mild weakness.",

        medications: [],

        source: "MOCK_ABDM",

        isDemoRecord: true,
      },

      {
        recordId: `DEMO-REC-${Date.now()}-002`,

        recordType: "Laboratory Report",

        date: new Date("2026-08-22"),

        facilityName: "Demo Diagnostic Centre",

        department: "Laboratory",

        tests: [
          {
            name: "Hemoglobin",
            value: "12.8",
            unit: "g/dL",
            referenceRange: "12-16 g/dL",
          },
          {
            name: "Blood Glucose",
            value: "94",
            unit: "mg/dL",
            referenceRange: "70-100 mg/dL",
          },
        ],

        source: "MOCK_ABDM",

        isDemoRecord: true,
      },

      {
        recordId: `DEMO-REC-${Date.now()}-003`,

        recordType: "Medical Report",

        date: new Date("2026-08-25"),

        facilityName: "Demo Hospital",

        department: "Outpatient Department",

        observations:
          "General health assessment recorded for demonstration purposes.",

        recommendations:
          "Follow-up as advised by the treating healthcare professional.",

        source: "MOCK_ABDM",

        isDemoRecord: true,
      },
    ];

    return {
      success: true,

      simulated: true,

      patientId,

      abhaId,

      consentId,

      fetchedAt: new Date(),

      recordCount: healthRecords.length,

      records: healthRecords,

      message: "Prototype health records fetched successfully.",
    };
  } catch (error) {
    console.error("ABDM health record fetch error:", error);

    return {
      success: false,

      simulated: true,

      recordCount: 0,

      records: [],

      message: error.message,
    };
  }
};

// ============================================================
// 3. COMPLETE ABDM PROTOTYPE FLOW
// ============================================================

export const linkABHAAndFetchRecords = async ({ patientId, abhaId }) => {
  try {
    if (!patientId) {
      throw new Error("Patient ID is required.");
    }

    if (!abhaId) {
      throw new Error("ABHA ID is required.");
    }

    // --------------------------------------------------------
    // STEP 1: Create consent
    // --------------------------------------------------------

    const consentResult = await createABDMConsent({
      patientId,
      abhaId,
    });

    if (!consentResult.success) {
      return {
        success: false,

        consent: consentResult,

        records: [],

        message: "Unable to create ABDM consent.",
      };
    }

    // --------------------------------------------------------
    // STEP 2: Fetch records using consent
    // --------------------------------------------------------

    const recordsResult = await getABDMHealthRecords({
      patientId,
      abhaId,
      consentId: consentResult.consentId,
    });

    if (!recordsResult.success) {
      return {
        success: false,

        consent: consentResult,

        records: [],

        message: "Consent created, but records could not be fetched.",
      };
    }

    // --------------------------------------------------------
    // COMPLETE RESULT
    // --------------------------------------------------------

    return {
      success: true,

      simulated: true,

      abdmLinked: true,

      consent: consentResult,

      records: recordsResult.records,

      recordCount: recordsResult.recordCount,

      fetchedAt: recordsResult.fetchedAt,

      message: "ABHA linked and demo health records fetched successfully.",
    };
  } catch (error) {
    console.error("ABDM prototype flow error:", error);

    return {
      success: false,

      simulated: true,

      abdmLinked: false,

      records: [],

      message: error.message,
    };
  }
};

// ============================================================
// 4. FORMAT RECORDS FOR HIS
// ============================================================

export const formatABDMRecordsForHIS = (records = []) => {
  if (!Array.isArray(records)) {
    return [];
  }

  return records.map((record) => ({
    externalRecordId: record.recordId,

    recordType: record.recordType,

    recordDate: record.date,

    facilityName: record.facilityName,

    department: record.department,

    observations: record.observations || "",

    diagnosis: record.diagnosis || "",

    recommendations: record.recommendations || "",

    tests: record.tests || [],

    source: record.source || "MOCK_ABDM",

    isDemoRecord: true,

    importedAt: new Date(),
  }));
};

// ============================================================
// 5. CHECK ABDM CONSENT
// ============================================================

export const isABDMConsentValid = (consent) => {
  if (!consent) {
    return false;
  }

  return consent.status === "Granted" && !!consent.consentId;
};

// ============================================================
// DEFAULT EXPORT
// ============================================================

export default {
  createABDMConsent,
  getABDMHealthRecords,
  linkABHAAndFetchRecords,
  formatABDMRecordsForHIS,
  isABDMConsentValid,
};
