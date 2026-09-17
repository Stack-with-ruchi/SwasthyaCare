import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  ArrowLeft,
  FileText,
  Download,
  Eye,
  Sparkles,
  CheckCircle,
  XCircle,
  Save,
  Loader2,
  AlertCircle,
  User,
  Stethoscope,
  Pencil,
  RotateCcw,
  X,
} from "lucide-react";

const API_URL = "http://localhost:5000/api";

// =====================================================
// GET DOCTOR SESSION
// =====================================================

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

// =====================================================
// COMPONENT
// =====================================================

const DoctorCaseDetails = () => {
  const { caseId } = useParams();
  const navigate = useNavigate();

  const [caseData, setCaseData] = useState(null);
  const [documents, setDocuments] = useState([]);

  const [loading, setLoading] = useState(true);
  const [documentsLoading, setDocumentsLoading] = useState(true);

  const [error, setError] = useState("");
  const [documentsError, setDocumentsError] = useState("");

  // ===================================================
  // DOCTOR NOTES
  // ===================================================

  const [doctorNotes, setDoctorNotes] = useState("");
  const [savingNotes, setSavingNotes] = useState(false);

  // ===================================================
  // DOCTOR ACTION
  // ===================================================

  const [updatingAction, setUpdatingAction] = useState(false);

  // ===================================================
  // AI SUMMARY
  // ===================================================

  const [generatingSummary, setGeneratingSummary] = useState(false);
  const [summaryError, setSummaryError] = useState("");

  // ===================================================
  // DOCTOR-EDITED SUMMARY
  // ===================================================

  const [isEditingSummary, setIsEditingSummary] = useState(false);
  const [editedSummary, setEditedSummary] = useState("");
  const [savingEditedSummary, setSavingEditedSummary] = useState(false);
  const [editedSummaryError, setEditedSummaryError] = useState("");

  // =====================================================
  // LOAD CASE
  // =====================================================

  const fetchCase = async () => {
    try {
      setLoading(true);
      setError("");

      const session = getDoctorSession();

      if (!session?.id) {
        window.location.href = "/doctor/login";
        return;
      }

      const response = await fetch(
        `${API_URL}/doctor/cases/${caseId}?identifier=${encodeURIComponent(
          session.id
        )}`
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message || "Failed to load case details."
        );
      }

      const loadedCase = data.case || {};

      setCaseData(loadedCase);

      setDoctorNotes(loadedCase.doctorNotes || "");
    } catch (error) {
      console.error("Fetch Case Error:", error);

      setError(error.message || "Failed to load case.");
    } finally {
      setLoading(false);
    }
  };

  // =====================================================
  // LOAD DOCUMENTS
  // =====================================================

  const fetchDocuments = async () => {
    try {
      setDocumentsLoading(true);
      setDocumentsError("");

      const session = getDoctorSession();

      if (!session?.id) {
        window.location.href = "/doctor/login";
        return;
      }

      const response = await fetch(
        `${API_URL}/doctor/cases/${caseId}/documents?identifier=${encodeURIComponent(
          session.id
        )}`
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message || "Failed to load documents."
        );
      }

      setDocuments(data.documents || []);
    } catch (error) {
      console.error("Fetch Documents Error:", error);

      setDocumentsError(
        error.message || "Failed to load documents."
      );
    } finally {
      setDocumentsLoading(false);
    }
  };

  // =====================================================
  // INITIAL LOAD
  // =====================================================

  useEffect(() => {
    if (caseId) {
      fetchCase();
      fetchDocuments();
    }
  }, [caseId]);

  // =====================================================
  // GENERATE AI SUMMARY
  // =====================================================

  const handleGenerateAISummary = async () => {
    try {
      setGeneratingSummary(true);
      setSummaryError("");

      const session = getDoctorSession();

      if (!session?.id) {
        window.location.href = "/doctor/login";
        return;
      }

      const response = await fetch(
        `${API_URL}/doctor/cases/${caseId}/ai-summary`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            identifier: session.id,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message || "Failed to generate AI summary."
        );
      }

      setCaseData((previous) => ({
        ...previous,
        ...(data.case || {}),

        aiSummary:
          data.case?.aiSummary ||
          previous?.aiSummary || {
            overview: data.summary || "",
            fullSummary: data.summary || "",
            generatedAt: data.generatedAt,
          },

        summaryStatus:
          data.summaryStatus || "AI summary Available",
      }));
    } catch (error) {
      console.error("Generate AI Summary Error:", error);

      setSummaryError(
        error.message || "Failed to generate AI summary."
      );
    } finally {
      setGeneratingSummary(false);
    }
  };

  // =====================================================
  // START EDITING SUMMARY
  // =====================================================

  const handleStartEditingSummary = () => {
    setEditedSummaryError("");

    /*
     * If doctor has already edited the summary,
     * open that version.
     *
     * Otherwise open the original AI summary.
     */

    const existingDoctorSummary =
      caseData?.doctorEditedSummary || "";

    const originalAISummary =
      caseData?.aiSummary?.fullSummary ||
      caseData?.aiSummary?.overview ||
      caseData?.aiSummary?.summary ||
      "";

    setEditedSummary(
      existingDoctorSummary || originalAISummary
    );

    setIsEditingSummary(true);
  };

  // =====================================================
  // RESET EDITOR TO ORIGINAL AI SUMMARY
  // =====================================================

  const handleResetToAISummary = () => {
    const originalAISummary =
      caseData?.aiSummary?.fullSummary ||
      caseData?.aiSummary?.overview ||
      caseData?.aiSummary?.summary ||
      "";

    setEditedSummary(originalAISummary);
    setEditedSummaryError("");
  };

  // =====================================================
  // CANCEL EDITING
  // =====================================================

  const handleCancelEditingSummary = () => {
    setIsEditingSummary(false);
    setEditedSummaryError("");
    setEditedSummary("");
  };

  // =====================================================
  // SAVE DOCTOR-EDITED SUMMARY
  // =====================================================

  const handleSaveEditedSummary = async () => {
    try {
      setSavingEditedSummary(true);
      setEditedSummaryError("");

      const session = getDoctorSession();

      if (!session?.id) {
        window.location.href = "/doctor/login";
        return;
      }

      if (!editedSummary.trim()) {
        setEditedSummaryError("Summary cannot be empty.");
        return;
      }

      /*
       * CASE ID IS USED HERE
       *
       * caseId = TokenCase._id
       */

      const response = await fetch(
        `${API_URL}/doctor/cases/${caseId}/edited-summary`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            identifier: session.id,
            doctorEditedSummary: editedSummary.trim(),
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message || "Failed to save edited summary."
        );
      }

      /*
       * IMPORTANT:
       *
       * We DO NOT change:
       *
       * caseData.aiSummary.fullSummary
       *
       * The original AI summary remains untouched.
       */

      setCaseData((previous) => ({
        ...previous,
        ...(data.case || {}),

        doctorEditedSummary:
          data.case?.doctorEditedSummary ||
          editedSummary.trim(),

        doctorEditedAt:
          data.case?.doctorEditedAt ||
          new Date().toISOString(),

        doctorEditedBy:
          data.case?.doctorEditedBy || null,

        summarySource:
          data.case?.summarySource || "DoctorEdited",
      }));

      setIsEditingSummary(false);
      setEditedSummary("");

      alert("Doctor-edited summary saved successfully.");
    } catch (error) {
      console.error("Save Edited Summary Error:", error);

      setEditedSummaryError(
        error.message || "Failed to save edited summary."
      );
    } finally {
      setSavingEditedSummary(false);
    }
  };

  // =====================================================
  // UPDATE DOCTOR ACTION
  // =====================================================

  const handleDoctorAction = async (action) => {
    try {
      setUpdatingAction(true);

      const session = getDoctorSession();

      if (!session?.id) {
        window.location.href = "/doctor/login";
        return;
      }

      const response = await fetch(
        `${API_URL}/doctor/cases/${caseId}/action`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            action,
            identifier: session.id,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message || "Failed to update case action."
        );
      }

      setCaseData((previous) => ({
        ...previous,
        ...(data.case || {}),

        doctorAction:
          data.case?.doctorAction || action,
      }));
    } catch (error) {
      console.error("Update Action Error:", error);

      alert(
        error.message || "Failed to update case action."
      );
    } finally {
      setUpdatingAction(false);
    }
  };

  // =====================================================
  // SAVE DOCTOR NOTES
  // =====================================================

  const handleSaveNotes = async () => {
    try {
      setSavingNotes(true);

      const session = getDoctorSession();

      if (!session?.id) {
        window.location.href = "/doctor/login";
        return;
      }

      const response = await fetch(
        `${API_URL}/doctor/cases/${caseId}/notes`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            notes: doctorNotes,
            identifier: session.id,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message || "Failed to save notes."
        );
      }

      setCaseData((previous) => ({
        ...previous,
        ...(data.case || {}),

        doctorNotes:
          data.case?.doctorNotes ?? doctorNotes,
      }));

      alert("Doctor notes saved successfully.");
    } catch (error) {
      console.error("Save Notes Error:", error);

      alert(
        error.message || "Failed to save doctor notes."
      );
    } finally {
      setSavingNotes(false);
    }
  };

  // =====================================================
  // LOADING
  // =====================================================

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="flex items-center gap-3 text-emerald-700">
          <Loader2 className="w-6 h-6 animate-spin" />

          <span>Loading case details...</span>
        </div>
      </div>
    );
  }

  // =====================================================
  // ERROR
  // =====================================================

  if (error || !caseData) {
    return (
      <div className="min-h-screen bg-slate-50 p-6">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-emerald-700 mb-6"
        >
          <ArrowLeft className="w-5 h-5" />
          Back
        </button>

        <div className="max-w-3xl mx-auto bg-white rounded-2xl p-8 shadow-sm border border-red-100">
          <div className="flex items-center gap-3 text-red-600">
            <AlertCircle className="w-6 h-6" />

            <h2 className="text-lg font-semibold">
              Unable to load case
            </h2>
          </div>

          <p className="text-slate-600 mt-3">
            {error || "Case not found."}
          </p>

          <button
            onClick={fetchCase}
            className="mt-5 px-5 py-2.5 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  // =====================================================
  // DATA
  // =====================================================

  const patient = caseData.patientId || {};

  // Original AI summary
  const aiSummary =
    caseData.aiSummary?.fullSummary ||
    caseData.aiSummary?.overview ||
    caseData.aiSummary?.summary ||
    "";

  // Complete doctor-edited/final summary
  const doctorEditedSummary =
    caseData.doctorEditedSummary || "";

  // Doctor-edited version takes priority
  const displayedSummary =
    doctorEditedSummary || aiSummary;

  const aiGeneratedAt =
    caseData.aiSummary?.generatedAt;

  const aiStatus =
    caseData.summaryStatus ||
    "AI summary Not available";

  const isDoctorEdited =
    caseData.summarySource === "DoctorEdited" &&
    Boolean(doctorEditedSummary);

  // =====================================================
  // RENDER
  // =====================================================

  return (
    <div className="min-h-screen bg-slate-50 p-4 md:p-6">
      <div className="max-w-7xl mx-auto">

        {/* BACK BUTTON */}

        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-emerald-700 hover:text-emerald-800 mb-6 font-medium"
        >
          <ArrowLeft className="w-5 h-5" />
          Back
        </button>

        {/* HEADER */}

        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 mb-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">

            <div>
              <div className="flex items-center gap-3">

                <div className="p-3 bg-emerald-100 rounded-xl">
                  <FileText className="w-6 h-6 text-emerald-700" />
                </div>

                <div>
                  <h1 className="text-2xl font-bold text-slate-800">
                    Case Details
                  </h1>

                  <p className="text-sm text-slate-500 mt-1">
                    Case ID: {caseData._id}
                  </p>
                </div>

              </div>
            </div>

            {/* AI BUTTON */}

            <button
              onClick={handleGenerateAISummary}
              disabled={generatingSummary}
              className="flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-emerald-600 text-white font-medium hover:bg-emerald-700 disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {generatingSummary ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <Sparkles className="w-5 h-5" />

                  {aiSummary
                    ? "Regenerate AI Summary"
                    : "Generate AI Summary"}
                </>
              )}
            </button>

          </div>

          {/* AI ERROR */}

          {summaryError && (
            <div className="mt-4 flex items-start gap-3 p-4 rounded-xl bg-red-50 border border-red-200 text-red-700">

              <AlertCircle className="w-5 h-5 mt-0.5" />

              <div>
                <p className="font-medium">
                  AI Summary Error
                </p>

                <p className="text-sm mt-1">
                  {summaryError}
                </p>
              </div>

            </div>
          )}
        </div>

        {/* PATIENT INFORMATION */}

        <section className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 mb-6">

          <div className="flex items-center gap-2 mb-5">

            <User className="w-5 h-5 text-emerald-600" />

            <h2 className="text-lg font-semibold text-slate-800">
              Patient Information
            </h2>

          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">

            <InfoItem
              label="Name"
              value={patient.fullName}
            />

            <InfoItem
              label="Mobile"
              value={patient.mobile}
            />

            <InfoItem
              label="Email"
              value={patient.email}
            />

            <InfoItem
              label="Gender"
              value={patient.gender}
            />

            <InfoItem
              label="Date of Birth"
              value={patient.dob}
            />

            <InfoItem
              label="ABHA ID"
              value={patient.abhaId}
            />

          </div>

        </section>

        {/* CASE INFORMATION */}

        <section className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 mb-6">

          <div className="flex items-center gap-2 mb-5">

            <Stethoscope className="w-5 h-5 text-emerald-600" />

            <h2 className="text-lg font-semibold text-slate-800">
              Case Information
            </h2>

          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">

            <InfoItem
              label="Token Number"
              value={caseData.tokenNumber}
            />

            <InfoItem
              label="CR Number"
              value={caseData.crNumber}
            />

            <InfoItem
              label="Hospital / Clinic"
              value={caseData.hospitalName}
            />

            <InfoItem
              label="Department"
              value={caseData.department}
            />

            <InfoItem
              label="Created"
              value={
                caseData.createdAt
                  ? new Date(
                      caseData.createdAt
                    ).toLocaleString()
                  : "Not available"
              }
            />

            <InfoItem
              label="AI Summary Status"
              value={aiStatus}
            />

          </div>

        </section>

        {/* CASE ENQUIRY */}

        <section className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 mb-6">

          <h2 className="text-lg font-semibold text-slate-800 mb-5">
            Case Enquiry
          </h2>

          <div className="space-y-5">

            <DetailBox
              label="Prakriti"
              value={caseData.aiCaseEnquiry?.prakriti}
            />

            <DetailBox
              label="Symptoms"
              value={caseData.aiCaseEnquiry?.symptoms}
            />

            <DetailBox
              label="Duration"
              value={caseData.aiCaseEnquiry?.duration}
            />

            <DetailBox
              label="Notes"
              value={caseData.aiCaseEnquiry?.notes}
            />

          </div>

        </section>

        {/* DOCUMENTS */}

        <section className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 mb-6">

          <div className="flex items-center justify-between mb-5">

            <div className="flex items-center gap-2">

              <FileText className="w-5 h-5 text-emerald-600" />

              <h2 className="text-lg font-semibold text-slate-800">
                Reports & Documents
              </h2>

            </div>

          </div>

          {documentsLoading ? (
            <div className="flex items-center gap-2 text-slate-500">

              <Loader2 className="w-5 h-5 animate-spin" />

              Loading documents...

            </div>
          ) : documentsError ? (
            <div className="p-4 rounded-xl bg-red-50 text-red-700">
              {documentsError}
            </div>
          ) : documents.length === 0 ? (
            <div className="p-6 text-center border border-dashed border-slate-300 rounded-xl">

              <FileText className="w-8 h-8 mx-auto text-slate-400" />

              <p className="mt-2 text-slate-500">
                No documents uploaded for this case.
              </p>

            </div>
          ) : (
            <div className="space-y-3">

              {documents.map((document) => (
                <div
                  key={document._id}
                  className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 p-4 rounded-xl border border-slate-200"
                >

                  <div>

                    <h3 className="font-medium text-slate-800">
                      {document.name}
                    </h3>

                    <div className="text-sm text-slate-500 mt-1 space-y-1">

                      <p>
                        Type:{" "}
                        {document.type || "Not available"}
                      </p>

                      <p>
                        Doctor:{" "}
                        {document.doctorName || "Self"}
                      </p>

                      <p>
                        Uploaded:{" "}
                        {document.uploadDate
                          ? new Date(
                              document.uploadDate
                            ).toLocaleDateString()
                          : "Not available"}
                      </p>

                    </div>

                  </div>

                  <div className="flex gap-2">

                    {document.fileUrl && (
                      <>
                        <a
                          href={document.fileUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-2 px-4 py-2 border border-slate-300 rounded-lg text-slate-700 hover:bg-slate-50"
                        >
                          <Eye className="w-4 h-4" />
                          View
                        </a>

                        <a
                          href={document.fileUrl}
                          download
                          className="flex items-center gap-2 px-4 py-2 bg-slate-100 rounded-lg text-slate-700 hover:bg-slate-200"
                        >
                          <Download className="w-4 h-4" />
                          Download
                        </a>
                      </>
                    )}

                  </div>

                </div>
              ))}

            </div>
          )}

        </section>

        {/* SUMMARY */}

        <section className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 mb-6">

          {/* SUMMARY HEADER */}

          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-5">

            <div className="flex items-center gap-2">

              <Sparkles className="w-5 h-5 text-emerald-600" />

              <h2 className="text-lg font-semibold text-slate-800">
                Case Summary
              </h2>

            </div>

            {!isEditingSummary && displayedSummary && (
              <button
                onClick={handleStartEditingSummary}
                className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border border-emerald-600 text-emerald-700 hover:bg-emerald-50 font-medium"
              >
                <Pencil className="w-4 h-4" />
                Edit Summary
              </button>
            )}

          </div>

          {/* EDIT MODE */}

          {isEditingSummary ? (
            <div className="space-y-4">

              <div className="p-4 rounded-xl bg-blue-50 border border-blue-200">

                <div className="flex items-start gap-3">

                  <Pencil className="w-5 h-5 text-blue-600 mt-0.5" />

                  <div>

                    <p className="font-semibold text-blue-800">
                      Doctor Editing Mode
                    </p>

                    <p className="text-sm text-blue-700 mt-1">
                      Edit or add information based on
                      your offline consultation. The
                      original AI summary will remain
                      preserved.
                    </p>

                  </div>

                </div>

              </div>

              <textarea
                value={editedSummary}
                onChange={(e) =>
                  setEditedSummary(e.target.value)
                }
                rows={18}
                className="w-full border border-slate-300 rounded-xl p-5 outline-none focus:ring-2 focus:ring-emerald-500 resize-y text-slate-700 leading-7"
                placeholder="Edit the case summary here..."
              />

              {editedSummaryError && (
                <div className="flex items-start gap-3 p-4 rounded-xl bg-red-50 border border-red-200 text-red-700">

                  <AlertCircle className="w-5 h-5 mt-0.5" />

                  <p className="text-sm">
                    {editedSummaryError}
                  </p>

                </div>
              )}

              <div className="flex flex-col sm:flex-row justify-between gap-3">

                <button
                  type="button"
                  onClick={handleResetToAISummary}
                  disabled={savingEditedSummary}
                  className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border border-slate-300 text-slate-700 hover:bg-slate-50 disabled:opacity-60"
                >
                  <RotateCcw className="w-4 h-4" />
                  Reset to AI Summary
                </button>

                <div className="flex gap-3">

                  <button
                    type="button"
                    onClick={handleCancelEditingSummary}
                    disabled={savingEditedSummary}
                    className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border border-slate-300 text-slate-700 hover:bg-slate-50 disabled:opacity-60"
                  >
                    <X className="w-4 h-4" />
                    Cancel
                  </button>

                  <button
                    type="button"
                    onClick={handleSaveEditedSummary}
                    disabled={
                      savingEditedSummary ||
                      !editedSummary.trim()
                    }
                    className="flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-600 text-white hover:bg-emerald-700 disabled:opacity-60 disabled:cursor-not-allowed"
                  >
                    {savingEditedSummary ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Saving...
                      </>
                    ) : (
                      <>
                        <Save className="w-4 h-4" />
                        Save Final Summary
                      </>
                    )}
                  </button>

                </div>

              </div>

            </div>
          ) : displayedSummary ? (
            <>
              {/* SUMMARY SOURCE */}

              <div className="flex flex-wrap items-center gap-2 mb-4">

                <span
                  className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${
                    isDoctorEdited
                      ? "bg-blue-100 text-blue-700"
                      : "bg-emerald-100 text-emerald-700"
                  }`}
                >
                  {isDoctorEdited
                    ? "Doctor Edited"
                    : "AI Generated"}
                </span>

                {isDoctorEdited &&
                  caseData.doctorEditedAt && (
                    <span className="text-xs text-slate-500">
                      Edited:{" "}
                      {new Date(
                        caseData.doctorEditedAt
                      ).toLocaleString()}
                    </span>
                  )}

              </div>

              {/* DISPLAYED FINAL SUMMARY */}

              <div className="rounded-xl bg-slate-50 border border-slate-200 p-5">

                <div className="whitespace-pre-wrap text-slate-700 leading-7">
                  {displayedSummary}
                </div>

              </div>

              {/* NOTICE */}

              <div className="mt-4 flex items-start gap-3 p-4 rounded-xl bg-amber-50 border border-amber-200 text-amber-800">

                <AlertCircle className="w-5 h-5 mt-0.5 flex-shrink-0" />

                <div>

                  <p className="font-semibold">
                    Summary for clinical review
                  </p>

                  <p className="text-sm mt-1">
                    This summary supports the doctor's
                    review. The doctor should verify the
                    information with the patient and use
                    independent clinical judgment.
                  </p>

                </div>

              </div>

              {/* ORIGINAL AI SUMMARY */}

              {isDoctorEdited && (
                <details className="mt-5">

                  <summary className="cursor-pointer text-sm font-medium text-emerald-700 hover:text-emerald-800">
                    View Original AI Summary
                  </summary>

                  <div className="mt-3 rounded-xl bg-slate-50 border border-slate-200 p-5">

                    <div className="whitespace-pre-wrap text-slate-600 leading-7">
                      {aiSummary}
                    </div>

                  </div>

                </details>
              )}

            </>
          ) : (
            <div className="text-center py-10 border border-dashed border-slate-300 rounded-xl">

              <Sparkles className="w-10 h-10 mx-auto text-slate-400" />

              <p className="mt-3 font-medium text-slate-700">
                No AI summary available
              </p>

              <p className="text-sm text-slate-500 mt-1">
                Click "Generate AI Summary" to create a
                doctor-reviewable case summary.
              </p>

            </div>
          )}

        </section>

        {/* DOCTOR ACTION */}

        <section className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 mb-6">

          <h2 className="text-lg font-semibold text-slate-800 mb-5">
            Doctor Action
          </h2>

          <div className="flex flex-col sm:flex-row gap-3">

            <button
              onClick={() => handleDoctorAction("Accepted")}
              disabled={updatingAction}
              className="flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-emerald-600 text-white hover:bg-emerald-700 disabled:opacity-60"
            >
              <CheckCircle className="w-5 h-5" />

              {updatingAction
                ? "Updating..."
                : "Accept Case"}
            </button>

            <button
              onClick={() => handleDoctorAction("Rejected")}
              disabled={updatingAction}
              className="flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-red-600 text-white hover:bg-red-700 disabled:opacity-60"
            >
              <XCircle className="w-5 h-5" />

              {updatingAction
                ? "Updating..."
                : "Reject Case"}
            </button>

          </div>

          <div className="mt-4">

            <span className="text-sm text-slate-500">
              Current Status:
            </span>

            <span className="ml-2 font-medium text-slate-800">
              {caseData.doctorAction || "Pending"}
            </span>

          </div>

        </section>

        {/* DOCTOR NOTES */}

        <section className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">

          <h2 className="text-lg font-semibold text-slate-800 mb-5">
            Doctor Notes
          </h2>

          <textarea
            value={doctorNotes}
            onChange={(e) => setDoctorNotes(e.target.value)}
            placeholder="Add your clinical notes here..."
            rows={6}
            className="w-full border border-slate-300 rounded-xl p-4 outline-none focus:ring-2 focus:ring-emerald-500 resize-y"
          />

          <div className="flex justify-end mt-4">

            <button
              onClick={handleSaveNotes}
              disabled={savingNotes}
              className="flex items-center gap-2 px-5 py-3 bg-emerald-600 text-white rounded-xl hover:bg-emerald-700 disabled:opacity-60"
            >
              {savingNotes ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <Save className="w-5 h-5" />
              )}

              {savingNotes
                ? "Saving..."
                : "Save Notes"}
            </button>

          </div>

        </section>

      </div>
    </div>
  );
};

// =====================================================
// REUSABLE COMPONENTS
// =====================================================

const InfoItem = ({ label, value }) => {
  return (
    <div>
      <p className="text-sm text-slate-500">
        {label}
      </p>

      <p className="font-medium text-slate-800 mt-1 break-words">
        {value || "Not provided"}
      </p>
    </div>
  );
};

const DetailBox = ({ label, value }) => {
  return (
    <div>
      <p className="text-sm font-medium text-slate-500 mb-2">
        {label}
      </p>

      <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 text-slate-700 whitespace-pre-wrap">
        {Array.isArray(value)
          ? value.join(", ")
          : value || "Not provided"}
      </div>
    </div>
  );
};

export default DoctorCaseDetails;