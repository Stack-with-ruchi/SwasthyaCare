import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  ArrowLeft,
  UserRound,
  FileText,
  Calendar,
  Sparkles,
  Loader2,
  AlertCircle,
  Eye,
} from "lucide-react";

const API_URL = "http://localhost:5000/api";

export default function DoctorPatientDetails() {
  const { patientId } = useParams();
  const navigate = useNavigate();

  const [patient, setPatient] = useState(null);
  const [cases, setCases] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const getDoctorSession = () => {
    try {
      return JSON.parse(
        localStorage.getItem("ayush_doctor_session") || "null"
      );
    } catch (error) {
      console.error("Invalid doctor session:", error);
      return null;
    }
  };

  useEffect(() => {
    fetchPatientDetails();
  }, [patientId]);

  const fetchPatientDetails = async () => {
    try {
      setLoading(true);
      setError("");

      const session = getDoctorSession();
      const doctorIdentifier = session?.id;

      if (!doctorIdentifier) {
        navigate("/doctor/login");
        return;
      }

      const response = await fetch(
        `${API_URL}/doctor/patients/${patientId}?identifier=${encodeURIComponent(
          doctorIdentifier
        )}`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
          },
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message || "Failed to load patient details."
        );
      }

      setPatient(data.patient);
      setCases(data.cases || []);
    } catch (error) {
      console.error("Patient Details Error:", error);

      setError(
        error.message || "Unable to load patient details."
      );
    } finally {
      setLoading(false);
    }
  };

  const handleOpenCase = (caseId) => {
    navigate(`/doctor/case/${caseId}`);
  };

  if (loading) {
    return (
      <div className="flex min-h-[500px] items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="h-8 w-8 animate-spin text-emerald-600" />

          <p className="text-sm text-slate-500">
            Loading patient details...
          </p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-2xl border border-red-100 bg-white p-8">
        <div className="flex items-start gap-3">
          <AlertCircle className="h-5 w-5 text-red-500" />

          <div>
            <h2 className="font-bold text-red-700">
              Unable to load patient
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              {error}
            </p>

            <button
              onClick={() => navigate("/doctor/dashboard")}
              className="mt-4 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700"
            >
              Back to Dashboard
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!patient) {
    return null;
  }

  return (
    <div className="space-y-6">

      {/* Back */}
      <button
        onClick={() => navigate("/doctor/dashboard")}
        className="flex items-center gap-2 text-sm font-semibold text-emerald-600 hover:text-emerald-700"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Dashboard
      </button>

      {/* Patient Header */}
      <div className="rounded-2xl border border-emerald-100 bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-5 sm:flex-row sm:items-center">

          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-emerald-50">
            <UserRound className="h-8 w-8 text-emerald-600" />
          </div>

          <div>
            <h1 className="text-2xl font-bold text-slate-800">
              {patient.fullName || "Unknown Patient"}
            </h1>

            <p className="mt-1 text-sm text-slate-500">
              {patient.gender || "Gender not available"}
            </p>
          </div>

        </div>
      </div>

      {/* Patient Information */}
      <div className="rounded-2xl border border-emerald-100 bg-white p-6 shadow-sm">

        <h2 className="text-base font-bold text-slate-800">
          Patient Information
        </h2>

        <div className="mt-5 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">

          <InfoItem
            label="ABHA ID"
            value={patient.abhaId || "Not available"}
          />

          <InfoItem
            label="Mobile"
            value={patient.mobile || "Not available"}
          />

          <InfoItem
            label="Email"
            value={patient.email || "Not available"}
          />

          <InfoItem
            label="Date of Birth"
            value={
              patient.dob
                ? new Date(patient.dob).toLocaleDateString()
                : "Not available"
            }
          />

          <InfoItem
            label="Gender"
            value={patient.gender || "Not available"}
          />

          <InfoItem
            label="Language"
            value={patient.languagePreference || "English"}
          />

        </div>
      </div>

      {/* Assigned Cases */}
      <div className="rounded-2xl border border-emerald-100 bg-white shadow-sm">

        <div className="border-b border-emerald-50 p-6">

          <div className="flex items-center gap-3">

            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50">
              <Calendar className="h-5 w-5 text-emerald-600" />
            </div>

            <div>
              <h2 className="text-base font-bold text-slate-800">
                Assigned Cases
              </h2>

              <p className="mt-1 text-xs text-slate-400">
                Cases assigned to this doctor
              </p>
            </div>

          </div>

        </div>

        <div className="p-6">

          {cases.length === 0 ? (
            <div className="rounded-xl bg-slate-50 p-6 text-center">

              <FileText className="mx-auto h-7 w-7 text-slate-300" />

              <p className="mt-2 text-sm font-semibold text-slate-600">
                No cases available
              </p>

              <p className="mt-1 text-xs text-slate-400">
                No cases have been assigned to this patient.
              </p>

            </div>
          ) : (
            <div className="space-y-4">

              {cases.map((patientCase) => (
                <CaseCard
                  key={patientCase._id}
                  patientCase={patientCase}
                  onOpenCase={handleOpenCase}
                />
              ))}

            </div>
          )}

        </div>
      </div>

    </div>
  );
}

/* ---------------------------------- */
/* INFO ITEM */
/* ---------------------------------- */

function InfoItem({ label, value }) {
  return (
    <div>
      <p className="text-xs font-medium text-slate-400">
        {label}
      </p>

      <p className="mt-1 break-words text-sm font-semibold text-slate-700">
        {value}
      </p>
    </div>
  );
}

/* ---------------------------------- */
/* CASE CARD */
/* ---------------------------------- */

function CaseCard({ patientCase, onOpenCase }) {
  return (
    <div className="rounded-xl border border-slate-100 bg-slate-50 p-5">

      {/* Case Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">

        <div>
          <p className="text-xs text-slate-400">
            Case ID
          </p>

          <p className="mt-1 break-all text-sm font-bold text-slate-700">
            {patientCase._id}
          </p>
        </div>

        <span
          className={`w-fit rounded-full px-3 py-1 text-[10px] font-bold ${
            patientCase.doctorAction === "Accepted"
              ? "bg-emerald-50 text-emerald-700"
              : patientCase.doctorAction === "Rejected"
              ? "bg-red-50 text-red-700"
              : "bg-amber-50 text-amber-700"
          }`}
        >
          {patientCase.doctorAction || "Pending"}
        </span>

      </div>

      {/* Case Information */}
      <div className="mt-4 grid gap-4 sm:grid-cols-3">

        <InfoItem
          label="Token Number"
          value={patientCase.tokenNumber || "—"}
        />

        <InfoItem
          label="Department"
          value={patientCase.department || "—"}
        />

        <InfoItem
          label="Case Date"
          value={
            patientCase.createdAt
              ? new Date(
                  patientCase.createdAt
                ).toLocaleDateString()
              : "—"
          }
        />

      </div>

      {/* AI Summary Preview */}
      {patientCase.aiSummary?.overview ||
      patientCase.aiSummary?.fullSummary ||
      patientCase.aiSummary?.summary ||
      patientCase.doctorEditedSummary ? (
        <div className="mt-5 rounded-xl border border-emerald-100 bg-white p-4">

          <div className="flex items-center gap-2">

            <Sparkles className="h-4 w-4 text-emerald-600" />

            <h3 className="text-xs font-bold text-slate-700">
              {patientCase.doctorEditedSummary ? "Case Summary" : "AI Summary Available"}
            </h3>

          </div>

          <p className="mt-3 text-xs leading-5 text-slate-600">
            {patientCase.doctorEditedSummary ||
              patientCase.aiSummary?.fullSummary ||
              patientCase.aiSummary?.overview ||
              patientCase.aiSummary?.summary}
          </p>

          <p className="mt-3 text-[10px] text-slate-400">
            AI-generated information is for doctor review.
          </p>

        </div>
      ) : null}

      {/* Documents Preview */}
      <div className="mt-5">

        <div className="flex items-center gap-2">

          <FileText className="h-4 w-4 text-slate-500" />

          <h3 className="text-xs font-bold text-slate-700">
            Documents
          </h3>

        </div>

        {patientCase.uploadedDocuments?.length === 0 ||
        !patientCase.uploadedDocuments ? (
          <p className="mt-2 text-xs text-slate-400">
            No documents uploaded.
          </p>
        ) : (
          <div className="mt-3 space-y-2">

            {patientCase.uploadedDocuments
              .slice(0, 3)
              .map((document) => (
                <div
                  key={document._id}
                  className="flex items-center gap-3 rounded-lg bg-white p-3"
                >
                  <FileText className="h-4 w-4 shrink-0 text-emerald-600" />

                  <span className="truncate text-xs font-medium text-slate-600">
                    {document.fileName ||
                      document.name ||
                      "Medical Document"}
                  </span>
                </div>
              ))}

            {patientCase.uploadedDocuments.length > 3 && (
              <p className="text-[10px] text-slate-400">
                +{" "}
                {patientCase.uploadedDocuments.length - 3}{" "}
                more document(s)
              </p>
            )}

          </div>
        )}

      </div>

      {/* Open Case Button */}
      <div className="mt-5 border-t border-slate-100 pt-4">

        <button
          onClick={() => onOpenCase(patientCase._id)}
          className="flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 py-2.5 text-xs font-bold text-white transition hover:bg-emerald-700 sm:w-auto"
        >
          <Eye className="h-4 w-4" />
          Open Case Details
        </button>

      </div>

    </div>
  );
}