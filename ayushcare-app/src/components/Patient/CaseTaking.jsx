import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  FileText,
  Building2,
  Stethoscope,
  Hash,
  ShieldCheck,
  CheckCircle,
  AlertCircle,
  Send,
} from "lucide-react";

const API_URL = "http://localhost:5000/api";

export default function CaseTaking() {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    crNumber: "",
    tokenNumber: "",
    hospitalName: "",
    department: "",
    consent: false,
  });

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  // ========================================
  // HANDLE INPUT CHANGE
  // ========================================

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;

    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));

    setError("");
    setMessage("");
  };

  // ========================================
  // SUBMIT CASE
  // ========================================

  const handleSubmit = async (e) => {
    e.preventDefault();

    setError("");
    setMessage("");

    // ----------------------------------------
    // Validation
    // ----------------------------------------

    if (!formData.crNumber.trim()) {
      setError("Please enter your CR number.");
      return;
    }

    if (!formData.tokenNumber.trim()) {
      setError("Please enter your token number.");
      return;
    }

    if (!formData.hospitalName.trim()) {
      setError("Please enter the hospital or clinic name.");
      return;
    }

    if (!formData.department.trim()) {
      setError("Please enter the department.");
      return;
    }

    if (!formData.consent) {
      setError(
        "Please provide data consent before submitting your case."
      );
      return;
    }

    // ----------------------------------------
    // Patient authentication
    // ----------------------------------------

    const token =
      localStorage.getItem("ayush_patient_token") ||
      localStorage.getItem("patientToken") ||
      localStorage.getItem("token") ||
      localStorage.getItem("patient_token");

    if (!token) {
      setError(
        "Your patient session has expired. Please login again."
      );
      return;
    }

    try {
      setLoading(true);

      // ----------------------------------------
      // Create case / appointment request
      // ----------------------------------------

      const response = await fetch(`${API_URL}/appointments`, {
        method: "POST",

        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },

        body: JSON.stringify({
          crNumber: formData.crNumber.trim(),
          tokenNumber: formData.tokenNumber.trim(),
          hospitalName: formData.hospitalName.trim(),
          department: formData.department.trim(),
          consent: formData.consent,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data?.message || "Failed to submit your case."
        );
      }

      // ----------------------------------------
      // Success
      // ----------------------------------------

      setMessage(
        "Your case has been submitted successfully."
      );

      // Clear form
      setFormData({
        crNumber: "",
        tokenNumber: "",
        hospitalName: "",
        department: "",
        consent: false,
      });

      // ----------------------------------------
      // Navigate to AI Chat
      // ----------------------------------------

      setTimeout(() => {
        navigate("/chatbot");
      }, 800);
    } catch (err) {
      console.error("Case submission error:", err);

      setError(
        err.message ||
          "Something went wrong while submitting your case."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 px-4 py-8 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-3xl">

        {/* HEADER */}

        <div className="mb-6">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-100">
              <FileText className="h-6 w-6 text-emerald-700" />
            </div>

            <div>
              <h1 className="text-2xl font-bold text-slate-800">
                Case Taking
              </h1>

              <p className="mt-1 text-sm text-slate-500">
                Submit your case request for doctor consultation.
              </p>
            </div>
          </div>
        </div>

        {/* INFORMATION CARD */}

        <div className="mb-6 rounded-xl border border-emerald-100 bg-emerald-50 p-4">
          <div className="flex items-start gap-3">
            <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-emerald-700" />

            <div>
              <h2 className="text-sm font-bold text-emerald-800">
                How Case Taking Works
              </h2>

              <p className="mt-1 text-xs leading-5 text-emerald-700">
                Enter your CR number, token number, hospital or
                clinic, and department. Your request date and time
                will be recorded automatically when you submit.
              </p>
            </div>
          </div>
        </div>

        {/* SUCCESS MESSAGE */}

        {message && (
          <div className="mb-6 flex items-start gap-3 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3">
            <CheckCircle className="mt-0.5 h-5 w-5 shrink-0 text-emerald-600" />

            <p className="text-sm font-medium text-emerald-700">
              {message}
            </p>
          </div>
        )}

        {/* ERROR MESSAGE */}

        {error && (
          <div className="mb-6 flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3">
            <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-red-600" />

            <p className="text-sm font-medium text-red-700">
              {error}
            </p>
          </div>
        )}

        {/* CASE FORM */}

        <form
          onSubmit={handleSubmit}
          className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8"
        >

          {/* CR NUMBER */}

          <div className="mb-5">
            <label
              htmlFor="crNumber"
              className="mb-2 block text-sm font-semibold text-slate-700"
            >
              CR No. / Case Registration No.
            </label>

            <div className="relative">
              <FileText className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-emerald-600" />

              <input
                id="crNumber"
                name="crNumber"
                type="text"
                value={formData.crNumber}
                onChange={handleChange}
                placeholder="Enter your CR number"
                className="w-full rounded-xl border border-slate-200 bg-white py-3 pl-11 pr-4 text-sm text-slate-700 outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
              />
            </div>
          </div>

          {/* TOKEN NUMBER */}

          <div className="mb-5">
            <label
              htmlFor="tokenNumber"
              className="mb-2 block text-sm font-semibold text-slate-700"
            >
              Token Number
            </label>

            <div className="relative">
              <Hash className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-emerald-600" />

              <input
                id="tokenNumber"
                name="tokenNumber"
                type="text"
                value={formData.tokenNumber}
                onChange={handleChange}
                placeholder="Enter your token number"
                className="w-full rounded-xl border border-slate-200 bg-white py-3 pl-11 pr-4 text-sm text-slate-700 outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
              />
            </div>
          </div>

          {/* HOSPITAL / CLINIC */}

          <div className="mb-5">
            <label
              htmlFor="hospitalName"
              className="mb-2 block text-sm font-semibold text-slate-700"
            >
              Hospital / Clinic
            </label>

            <div className="relative">
              <Building2 className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-emerald-600" />

              <input
                id="hospitalName"
                name="hospitalName"
                type="text"
                value={formData.hospitalName}
                onChange={handleChange}
                placeholder="Enter hospital or clinic name"
                className="w-full rounded-xl border border-slate-200 bg-white py-3 pl-11 pr-4 text-sm text-slate-700 outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
              />
            </div>
          </div>

          {/* DEPARTMENT */}

          <div className="mb-6">
            <label
              htmlFor="department"
              className="mb-2 block text-sm font-semibold text-slate-700"
            >
              Department
            </label>

            <div className="relative">
              <Stethoscope className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-emerald-600" />

              <input
                id="department"
                name="department"
                type="text"
                value={formData.department}
                onChange={handleChange}
                placeholder="Enter department"
                className="w-full rounded-xl border border-slate-200 bg-white py-3 pl-11 pr-4 text-sm text-slate-700 outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
              />
            </div>
          </div>

          {/* DATA CONSENT */}

          <div className="mb-7 rounded-xl border border-slate-200 bg-slate-50 p-4">
            <div className="flex items-start gap-3">

              <input
                id="consent"
                name="consent"
                type="checkbox"
                checked={formData.consent}
                onChange={handleChange}
                className="mt-1 h-4 w-4 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
              />

              <div>
                <label
                  htmlFor="consent"
                  className="cursor-pointer text-sm font-semibold text-slate-800"
                >
                  I provide consent to share my healthcare information
                </label>

                <p className="mt-1 text-xs leading-5 text-slate-500">
                  I understand that the information provided in
                  my case may be shared with the assigned doctor
                  for the purpose of reviewing my case and
                  providing healthcare services.
                </p>

                <p className="mt-2 text-xs font-medium text-emerald-700">
                  Shared information may include patient details,
                  AI-generated case summary, and available medical
                  reports.
                </p>
              </div>

            </div>
          </div>

          {/* SUBMIT BUTTON */}

          <button
            type="submit"
            disabled={loading}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-700 px-5 py-3 text-sm font-bold text-white transition hover:bg-emerald-800 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loading ? (
              <>
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                Submitting Case...
              </>
            ) : (
              <>
                <Send className="h-4 w-4" />
                Submit Case
              </>
            )}
          </button>

        </form>

        {/* REQUEST TIME INFORMATION */}

        <div className="mt-5 flex items-center justify-center gap-2 text-center">
          <ClockIcon />

          <p className="text-xs text-slate-400">
            Request date and time will be recorded automatically.
          </p>
        </div>

      </div>
    </div>
  );
}

// ========================================
// SMALL CLOCK ICON
// ========================================

function ClockIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="15"
      height="15"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="text-slate-400"
    >
      <circle cx="12" cy="12" r="10" />
      <polyline points="12 6 12 12 16 14" />
    </svg>
  );
}