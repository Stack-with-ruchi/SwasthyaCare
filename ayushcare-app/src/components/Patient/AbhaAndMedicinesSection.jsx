import React, { useEffect, useMemo, useState } from "react";
import { useTranslation } from "../../hooks/useTranslation";
import { QRCodeSVG } from "qrcode.react";
import {
  Download,
  QrCode,
  Info,
  FileText,
  Eye,
  Brain,
  ShieldCheck,
  RefreshCw,
  AlertCircle,
} from "lucide-react";

import { API_BASE_URL } from "../../utils/api";

export default function AbhaAndMedicinesSection() {
  // =========================
  // ABHA / HEALTH RECORD STATE
  // =========================

  const [abhaConnected, setAbhaConnected] = useState(false);
  const [consentStatus, setConsentStatus] = useState("NotRequested");
  const [abhaId, setAbhaId] = useState("");
  const [fetchingRecords, setFetchingRecords] = useState(false);
  const [records, setRecords] = useState([]);
  const [error, setError] = useState("");

  // Currently selected record for AI
  const [selectedRecord, setSelectedRecord] = useState(null);

  // =========================
  // TRANSLATIONS
  // =========================

  const texts = useMemo(
    () => ({
      abha: "ABHA Details",

      abhaId: "ABHA ID",
      downloadQr: "Download QR",

      abhaInformation:
        "Your ABHA can be used to securely connect your health records with your consent.",

      connectAbha: "Check ABHA Connection",
      connected: "ABHA Connected",

      consentMessage:
        "Health records are available only when consent has been granted.",

      fetchRecords: "Fetch Health Records",
      fetching: "Fetching Records...",

      healthRecords: "Health Reports & Documents",

      noRecords: "No health records available yet.",

      view: "View",
      useInAI: "Use in AI",

      recordSelected: "Record selected for AI consultation.",

      connectFirst:
        "Connect your ABHA to access available health records.",

      viewRecordMessage:
        "Record details are available in this prototype.",

      aiRecordMessage:
        "This record can be considered for the AI consultation flow.",

      demoNotice:
        "Prototype Demo: These records are simulated ABDM records for the SIH demonstration.",

      consultation: "Consultation",
      laboratory: "Laboratory Report",
      medicalReport: "Medical Report",

      facility: "Facility",
      department: "Department",
      observations: "Observations",
      recommendations: "Recommendations",
      tests: "Tests",

      failed:
        "Unable to fetch health records. Please try again.",
    }),
    []
  );

  const { t } = useTranslation(texts);

  // =========================
  // GET ABDM RECORDS
  // =========================

  const handleFetchRecords = async () => {
    const token = localStorage.getItem("patient_token");

    if (!token) {
      setError("Patient login session not found.");
      return;
    }

    setFetchingRecords(true);
    setError("");

    try {
      const response = await fetch(
        `${API_BASE_URL}/abdm/my-records`,
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message || t.failed
        );
      }

      setAbhaConnected(Boolean(data.linked));
      setConsentStatus(
        data.consentStatus || "NotRequested"
      );

      setAbhaId(data.abhaId || "");

      setRecords(data.records || []);
    } catch (error) {
      console.error("ABDM health records error:", error);

      setError(
        error.message || t.failed
      );

      setRecords([]);
    } finally {
      setFetchingRecords(false);
    }
  };

  // =========================
  // LOAD ABHA STATUS
  // =========================

  useEffect(() => {
    handleFetchRecords();
  }, []);

  // =========================
  // VIEW RECORD
  // =========================

  const handleViewRecord = (record) => {
    const testsText =
      record.tests?.length > 0
        ? record.tests
            .map(
              (test) =>
                `${test.name}: ${test.value}${
                  test.unit ? ` ${test.unit}` : ""
                }`
            )
            .join("\n")
        : "";

    const message = [
      `${record.recordType || "Health Record"}`,
      record.facilityName
        ? `Facility: ${record.facilityName}`
        : "",
      record.department
        ? `Department: ${record.department}`
        : "",
      record.recordDate
        ? `Date: ${new Date(
            record.recordDate
          ).toLocaleDateString()}`
        : "",
      record.observations
        ? `\nObservations:\n${record.observations}`
        : "",
      testsText
        ? `\nTests:\n${testsText}`
        : "",
      record.recommendations
        ? `\nRecommendations:\n${record.recommendations}`
        : "",
    ]
      .filter(Boolean)
      .join("\n");

    alert(message || t.viewRecordMessage);
  };

  // =========================
  // USE RECORD IN AI
  // =========================

  const handleUseInAI = (record) => {
    setSelectedRecord(record);

    alert(
      `${record.recordType || "Health Record"}\n\n${t.aiRecordMessage}`
    );
  };

  // =========================
  // DOWNLOAD ABHA QR
  // =========================

  const handleDownloadQR = () => {
    alert(
      "ABHA QR download will be connected to the backend."
    );
  };

  // =========================
  // RECORD TYPE LABEL
  // =========================

  const getRecordTypeLabel = (recordType) => {
    switch (recordType) {
      case "Laboratory Report":
        return t.laboratory;

      case "Medical Report":
        return t.medicalReport;

      case "Consultation":
        return t.consultation;

      default:
        return recordType || "Health Record";
    }
  };

  return (
    <div className="bg-slate-50 min-h-screen p-6 font-sans">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* ===================================================== */}
        {/* ABHA DETAILS */}
        {/* ===================================================== */}

        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm">

          <h2 className="text-base font-bold text-slate-800 mb-5">
            {t.abha}
          </h2>

          <div className="flex flex-col items-center">

            {/* QR CODE */}

            <div className="flex justify-center my-4">
             <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
                 <QRCodeSVG
                  value={abhaId || "ABHA-ID-NOT-AVAILABLE"}
                  size={180}
                  level="H"
                  includeMargin={true}
                   />
                </div>
                
                 </div>

            {/* ABHA ID */}

            <p className="mt-3 text-xs text-slate-500">
    Scan to verify ABHA ID
  </p>

  <p className="mt-1 text-sm font-semibold text-slate-700">
    {abhaId}
  </p>
            {/* DOWNLOAD QR */}

            <button
              onClick={handleDownloadQR}
              className="w-full flex items-center justify-center gap-2
              bg-emerald-700 hover:bg-emerald-800
              text-white py-2 rounded-lg text-xs font-semibold
              transition-colors mb-3"
            >
              <Download className="w-4 h-4" />
              {t.downloadQr}
            </button>

            {/* ABHA STATUS */}

            {abhaConnected ? (
              <div
                className="w-full flex items-center justify-center gap-2
                bg-emerald-50 border border-emerald-200
                text-emerald-700 py-2.5 rounded-lg
                text-xs font-semibold"
              >
                <ShieldCheck className="w-4 h-4" />
                {t.connected}
              </div>
            ) : (
              <button
                onClick={handleFetchRecords}
                disabled={fetchingRecords}
                className="w-full flex items-center justify-center gap-2
                bg-blue-600 hover:bg-blue-700
                disabled:bg-slate-300
                text-white py-2.5 rounded-lg text-xs font-semibold
                transition-colors"
              >
                <ShieldCheck className="w-4 h-4" />

                {fetchingRecords
                  ? t.fetching
                  : t.connectAbha}
              </button>
            )}

            {/* CONSENT INFORMATION */}

            <div
              className="bg-emerald-50 border border-emerald-200
              rounded-lg p-3 text-left w-full text-xs
              text-emerald-800 flex items-start gap-2 mt-4"
            >
              <Info className="w-4 h-4 text-emerald-700 shrink-0 mt-0.5" />

              <p>
                {t.abhaInformation}

                <br />

                <span className="text-emerald-600 mt-1 block">
                  {t.consentMessage}
                </span>

                <span className="text-emerald-700 mt-1 block font-semibold">
                  Consent status: {consentStatus}
                </span>
              </p>
            </div>

          </div>
        </div>

        {/* ===================================================== */}
        {/* HEALTH RECORDS */}
        {/* ===================================================== */}

        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm">

          <div className="flex items-center justify-between mb-4">

            <h2 className="text-base font-bold text-slate-800">
              {t.healthRecords}
            </h2>

            <FileText className="w-5 h-5 text-emerald-600" />

          </div>

          {/* DEMO NOTICE */}

          <div className="mb-4 flex items-start gap-2 p-3 rounded-xl bg-amber-50 border border-amber-200">

            <Info className="w-4 h-4 text-amber-600 mt-0.5 shrink-0" />

            <p className="text-[11px] leading-5 text-amber-700">
              {t.demoNotice}
            </p>

          </div>

          {/* FETCH RECORDS BUTTON */}

          <button
            onClick={handleFetchRecords}
            disabled={fetchingRecords}
            className="w-full flex items-center justify-center gap-2
            bg-emerald-700 hover:bg-emerald-800
            disabled:bg-slate-300 disabled:cursor-not-allowed
            text-white py-2.5 rounded-lg text-xs font-semibold
            transition-colors mb-4"
          >

            {fetchingRecords ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                {t.fetching}
              </>
            ) : (
              <>
                <RefreshCw className="w-4 h-4" />
                {t.fetchRecords}
              </>
            )}

          </button>

          {/* ERROR */}

          {error && (
            <div className="mb-4 flex items-start gap-2 p-3 rounded-xl bg-red-50 border border-red-200">

              <AlertCircle className="w-4 h-4 text-red-500 mt-0.5 shrink-0" />

              <p className="text-xs text-red-600">
                {error}
              </p>

            </div>
          )}

          {/* ================================================= */}
          {/* RECORD LIST */}
          {/* ================================================= */}

          {records.length > 0 ? (

            <div className="space-y-3">

              {records.map((record) => {

                const recordId =
                  record._id || record.id;

                const isSelected =
                  selectedRecord &&
                  (selectedRecord._id ||
                    selectedRecord.id) === recordId;

                return (
                  <div
                    key={recordId}
                    className={`p-4 rounded-xl border ${
                      isSelected
                        ? "border-emerald-400 bg-emerald-50"
                        : "border-slate-200 bg-slate-50"
                    }`}
                  >

                    {/* RECORD INFORMATION */}

                    <div className="flex items-start gap-3">

                      <div className="p-2 bg-emerald-100 text-emerald-700 rounded-lg">
                        <FileText className="w-5 h-5" />
                      </div>

                      <div className="flex-1">

                        <h4 className="text-sm font-bold text-slate-800">
                          {getRecordTypeLabel(
                            record.recordType
                          )}
                        </h4>

                        <p className="text-xs text-slate-500 mt-1">
                          {record.facilityName ||
                            "Health Facility"}
                        </p>

                        <p className="text-xs text-slate-400 mt-1">
                          {record.recordDate
                            ? new Date(
                                record.recordDate
                              ).toLocaleDateString()
                            : "Date not available"}
                        </p>

                        {record.department && (
                          <p className="text-[11px] text-slate-500 mt-1">
                            Department:{" "}
                            {record.department}
                          </p>
                        )}

                        {record.source && (
                          <p className="text-[10px] text-slate-400 mt-1">
                            Source: {record.source}
                          </p>
                        )}

                      </div>

                    </div>

                    {/* RECORD ACTIONS */}

                    <div className="flex gap-2 mt-3">

                      {/* VIEW */}

                      <button
                        onClick={() =>
                          handleViewRecord(record)
                        }
                        className="flex-1 flex items-center
                        justify-center gap-1 border border-slate-200
                        bg-white rounded-lg py-2 text-xs
                        font-semibold text-slate-600
                        hover:bg-slate-100"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        {t.view}
                      </button>

                      {/* USE IN AI */}

                      <button
                        onClick={() =>
                          handleUseInAI(record)
                        }
                        className="flex-1 flex items-center
                        justify-center gap-1 bg-emerald-600
                        hover:bg-emerald-700 text-white
                        rounded-lg py-2 text-xs font-semibold"
                      >
                        <Brain className="w-3.5 h-3.5" />
                        {t.useInAI}
                      </button>

                    </div>

                    {/* SELECTED MESSAGE */}

                    {isSelected && (
                      <div className="mt-3 px-3 py-2 rounded-lg bg-white border border-emerald-200">

                        <p className="text-xs text-emerald-700 font-medium">
                          ✓ {t.recordSelected}
                        </p>

                      </div>
                    )}

                  </div>
                );
              })}

            </div>

          ) : (

            /* ================================================= */
            /* NO RECORDS */
            /* ================================================= */

            <div className="text-center py-10">

              <FileText className="w-10 h-10 mx-auto text-slate-300 mb-3" />

              <p className="text-sm text-slate-500">
                {t.noRecords}
              </p>

              {!abhaConnected && (
                <p className="text-xs text-slate-400 mt-2">
                  {t.connectFirst}
                </p>
              )}

            </div>

          )}

        </div>


      </div>
    </div>
  );
}