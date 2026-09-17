import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";
import { generateOTP } from "../utils/otpGenerator";
import { apiRequest } from "../utils/api";

export default function DoctorSignup() {
  const navigate = useNavigate();

  const [step, setStep] = useState(1);

  const [contact, setContact] = useState("");
  const [otp, setOtp] = useState("");
  const [generatedOtp, setGeneratedOtp] = useState("");

  const [details, setDetails] = useState({
    fullname: "",
    age: "",
    gender: "Male",
    degree: "",
    specialty: "Ayurveda",
    regNumber: "",
    registrationAuthority: "",
    hospitalClinic: "",
    department: "",
  });

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [consentGiven, setConsentGiven] = useState(false);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");

  // ========================================
  // SEND OTP
  // ========================================

  const handleSendOtp = (e) => {
    e.preventDefault();

    if (!contact.trim()) {
      alert("Please enter your mobile number or email.");
      return;
    }

    const code = generateOTP();

    setGeneratedOtp(code);

    // Demo OTP
    alert(`[DEMO] Doctor Signup OTP: ${code}`);

    setStep(2);
  };

  // ========================================
  // VERIFY OTP
  // ========================================

  const handleVerifyOtp = (e) => {
    e.preventDefault();

    if (otp === generatedOtp) {
      setStep(3);
    } else {
      alert("Invalid OTP code. Please try again.");
    }
  };

  // ========================================
  // DOCTOR DETAILS
  // ========================================

  const handleDetailsSubmit = (e) => {
    e.preventDefault();

    if (!details.hospitalClinic.trim()) {
      alert("Please enter your hospital or clinic.");
      return;
    }

    if (!details.department.trim()) {
      alert("Please enter your department.");
      return;
    }

    setStep(4);
  };

  // ========================================
  // PASSWORD
  // ========================================

  const handlePasswordSubmit = (e) => {
    e.preventDefault();

    if (password.length < 8) {
      alert("Password must be at least 8 characters long.");
      return;
    }

    if (password !== confirmPassword) {
      alert("Passwords do not match.");
      return;
    }

    setStep(5);
  };

  // ========================================
  // FINAL REGISTRATION + CONSENT
  // ========================================

  const handleConsentSubmit = async (e) => {
    e.preventDefault();

    if (!consentGiven) {
      alert(
        "Please agree to the terms and privacy policy."
      );
      return;
    }

    try {
      setIsSubmitting(true);
      setSubmitError("");

      await apiRequest("/auth/doctor/signup", {
        method: "POST",

        body: JSON.stringify({
          // Basic details
          fullName: details.fullname.trim(),
          age: Number(details.age),
          gender: details.gender,

          // Professional details
          degree: details.degree.trim(),
          specialty: details.specialty.trim(),
          regNumber: details.regNumber.trim(),
          registrationAuthority:
            details.registrationAuthority.trim(),

          // Hospital + Department
          hospitalClinic:
            details.hospitalClinic.trim(),
          department:
            details.department.trim(),

          // Login details
          password,

          // Contact
          mobile: contact.trim(),
        }),
      });

      setStep(6);
    } catch (error) {
      console.error("Doctor signup error:", error);

      setSubmitError(
        error.message ||
          "Failed to complete doctor registration."
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  // ========================================
  // INPUT HANDLER
  // ========================================

  const updateDetails = (field, value) => {
    setDetails((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,_#dbeafe,_#f8fafc_35%,_#ecfdf5_100%)] text-slate-800 pt-20 pb-12">

      <Navbar />

      <main className="flex items-center justify-center px-4 py-8">

        <div className="w-full max-w-lg">

          <div className="bg-white/90 backdrop-blur-xl border border-white/80 rounded-[28px] shadow-[0_24px_70px_rgba(15,23,42,0.12)] p-6 md:p-8">
            <div className="mb-4">
              <button
                type="button"
                onClick={() => navigate("/")}
                className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-3 py-2 text-sm font-medium text-slate-700 transition hover:border-emerald-300 hover:bg-emerald-50 hover:text-emerald-700"
              >
                ← Back
              </button>
            </div>

            {/* ========================================
                HEADER
            ======================================== */}

            <div className="text-center mb-6">

              <span className="inline-block text-xs font-semibold uppercase tracking-widest bg-emerald-100 text-emerald-800 px-3 py-1 rounded-full">
                AyushCare (Dr.) Onboarding
              </span>

              <h1 className="mt-3 text-2xl md:text-3xl font-black text-slate-800">
                Doctor Registration
              </h1>

            </div>

            {/* ========================================
                STEP 1 — CONTACT
            ======================================== */}

            {step === 1 && (
              <form
                onSubmit={handleSendOtp}
                className="space-y-4"
              >

                <div>

                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Mobile Number or Email ID
                  </label>

                  <input
                    type="text"
                    required
                    value={contact}
                    onChange={(e) =>
                      setContact(e.target.value)
                    }
                    placeholder="e.g. +91 9876543210 or doctor@ayush.com"
                    className="border border-slate-200 focus:border-emerald-500 p-3 w-full rounded-xl outline-none"
                  />

                </div>

                <button
                  type="submit"
                  className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-semibold py-3 px-4 rounded-xl shadow-md transition"
                >
                  Send Verification OTP
                </button>

              </form>
            )}

            {/* ========================================
                STEP 2 — OTP
            ======================================== */}

            {step === 2 && (
              <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">

                <div className="bg-white rounded-3xl shadow-2xl p-6 md:p-8 w-full max-w-md text-center">

                  <h2 className="text-2xl font-bold text-slate-800 mb-2">
                    Verify OTP
                  </h2>

                  <p className="text-sm text-slate-600 mb-6">
                    Sent to {contact}
                  </p>

                  <form
                    onSubmit={handleVerifyOtp}
                    className="space-y-4"
                  >

                    <input
                      type="text"
                      inputMode="numeric"
                      pattern="[0-9]*"
                      maxLength="6"
                      value={otp}
                      onChange={(e) =>
                        setOtp(
                          e.target.value
                            .replace(/\D/g, "")
                            .slice(0, 6)
                        )
                      }
                      placeholder="Enter OTP"
                      className="border border-slate-200 focus:border-emerald-500 p-3 w-full text-center text-2xl font-mono tracking-widest rounded-xl outline-none"
                      required
                    />

                    <button
                      type="submit"
                      className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-semibold py-3 px-4 rounded-xl shadow-md transition"
                    >
                      Verify & Continue
                    </button>

                  </form>

                </div>

              </div>
            )}

            {/* ========================================
                STEP 3 — DOCTOR DETAILS
            ======================================== */}

            {step === 3 && (
              <form
                onSubmit={handleDetailsSubmit}
                className="space-y-4"
              >

                {/* FULL NAME */}

                <div>

                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Full Name
                  </label>

                  <input
                    type="text"
                    required
                    value={details.fullname}
                    onChange={(e) =>
                      updateDetails(
                        "fullname",
                        e.target.value
                      )
                    }
                    placeholder="Dr. Rajesh Sharma"
                    className="border border-slate-200 p-3 w-full rounded-xl outline-none focus:border-emerald-500"
                  />

                </div>

                {/* AGE + GENDER */}

                <div className="grid grid-cols-2 gap-4">

                  <div>

                    <label className="block text-sm font-medium text-slate-700 mb-1">
                      Age
                    </label>

                    <input
                      type="number"
                      min="18"
                      required
                      value={details.age}
                      onChange={(e) =>
                        updateDetails(
                          "age",
                          e.target.value
                        )
                      }
                      placeholder="38"
                      className="border border-slate-200 p-3 w-full rounded-xl outline-none focus:border-emerald-500"
                    />

                  </div>

                  <div>

                    <label className="block text-sm font-medium text-slate-700 mb-1">
                      Gender
                    </label>

                    <select
                      value={details.gender}
                      onChange={(e) =>
                        updateDetails(
                          "gender",
                          e.target.value
                        )
                      }
                      className="border border-slate-200 p-3 w-full rounded-xl outline-none bg-white focus:border-emerald-500"
                    >

                      <option value="Male">
                        Male
                      </option>

                      <option value="Female">
                        Female
                      </option>

                      <option value="Other">
                        Other
                      </option>

                    </select>

                  </div>

                </div>

                {/* DEGREE */}

                <div>

                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Degree
                  </label>

                  <input
                    type="text"
                    required
                    value={details.degree}
                    onChange={(e) =>
                      updateDetails(
                        "degree",
                        e.target.value
                      )
                    }
                    placeholder="BAMS / BHMS / MBBS / MD"
                    className="border border-slate-200 p-3 w-full rounded-xl outline-none focus:border-emerald-500"
                  />

                </div>

                {/* SPECIALIZATION */}

                <div>

                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Specialization
                  </label>

                  <input
                    type="text"
                    required
                    value={details.specialty}
                    onChange={(e) =>
                      updateDetails(
                        "specialty",
                        e.target.value
                      )
                    }
                    placeholder="Ayurveda"
                    className="border border-slate-200 p-3 w-full rounded-xl outline-none focus:border-emerald-500"
                  />

                </div>

                {/* REGISTRATION NUMBER */}

                <div>

                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Medical Registration No.
                  </label>

                  <input
                    type="text"
                    required
                    value={details.regNumber}
                    onChange={(e) =>
                      updateDetails(
                        "regNumber",
                        e.target.value
                      )
                    }
                    placeholder="AYU-MH-2012-44589"
                    className="border border-slate-200 p-3 w-full rounded-xl outline-none focus:border-emerald-500"
                  />

                </div>

                {/* REGISTRATION AUTHORITY */}

                <div>

                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Registration Authority
                  </label>

                  <input
                    type="text"
                    required
                    value={
                      details.registrationAuthority
                    }
                    onChange={(e) =>
                      updateDetails(
                        "registrationAuthority",
                        e.target.value
                      )
                    }
                    placeholder="State Medical Council / AYUSH Council"
                    className="border border-slate-200 p-3 w-full rounded-xl outline-none focus:border-emerald-500"
                  />

                </div>

                {/* HOSPITAL / CLINIC */}

                <div>

                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Hospital / Clinic
                  </label>

                  <input
                    type="text"
                    required
                    value={
                      details.hospitalClinic
                    }
                    onChange={(e) =>
                      updateDetails(
                        "hospitalClinic",
                        e.target.value
                      )
                    }
                    placeholder="e.g. AIIMS Raipur"
                    className="border border-slate-200 p-3 w-full rounded-xl outline-none focus:border-emerald-500"
                  />

                  <p className="text-xs text-slate-400 mt-1">
                    This will be used to match patient appointment requests.
                  </p>

                </div>

                {/* DEPARTMENT */}

                <div>

                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Department
                  </label>

                  <input
                    type="text"
                    required
                    value={details.department}
                    onChange={(e) =>
                      updateDetails(
                        "department",
                        e.target.value
                      )
                    }
                    placeholder="e.g. Ayurveda"
                    className="border border-slate-200 p-3 w-full rounded-xl outline-none focus:border-emerald-500"
                  />

                  <p className="text-xs text-slate-400 mt-1">
                    Patients will select this department when requesting an appointment.
                  </p>

                </div>

                {/* NEXT */}

                <button
                  type="submit"
                  className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-semibold py-3 px-4 rounded-xl shadow-md transition"
                >
                  Next: Security Credentials
                </button>

              </form>
            )}

            {/* ========================================
                STEP 4 — PASSWORD
            ======================================== */}

            {step === 4 && (
              <form
                onSubmit={handlePasswordSubmit}
                className="space-y-4"
              >

                <div>

                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Create Password
                  </label>

                  <input
                    type="password"
                    required
                    value={password}
                    onChange={(e) =>
                      setPassword(e.target.value)
                    }
                    placeholder="At least 8 characters"
                    className="border border-slate-200 p-3 w-full rounded-xl outline-none focus:border-emerald-500"
                  />

                </div>

                <div>

                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Confirm Password
                  </label>

                  <input
                    type="password"
                    required
                    value={confirmPassword}
                    onChange={(e) =>
                      setConfirmPassword(
                        e.target.value
                      )
                    }
                    placeholder="Re-enter password"
                    className="border border-slate-200 p-3 w-full rounded-xl outline-none focus:border-emerald-500"
                  />

                </div>

                <button
                  type="submit"
                  className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-semibold py-3 px-4 rounded-xl shadow-md transition"
                >
                  Next: Verification Consent
                </button>

              </form>
            )}

            {/* ========================================
                STEP 5 — CONSENT
            ======================================== */}

            {step === 5 && (
              <form
                onSubmit={handleConsentSubmit}
                className="space-y-5"
              >

                {submitError && (
                  <div className="p-3 bg-red-50 border border-red-200 text-red-600 rounded-xl text-xs text-center font-medium">
                    {submitError}
                  </div>
                )}

                <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-600 space-y-2">

                  <p className="font-semibold text-slate-800">
                    Verification Terms & Medical Consent
                  </p>

                  <p>
                    I confirm that the medical credentials,
                    registration details, hospital/clinic,
                    and department information provided belong
                    to me and are valid. I consent to AyushCare
                    platform verification procedures.
                  </p>

                </div>

                <label className="flex items-start gap-3 cursor-pointer">

                  <input
                    type="checkbox"
                    checked={consentGiven}
                    onChange={(e) =>
                      setConsentGiven(
                        e.target.checked
                      )
                    }
                    className="mt-1 h-4 w-4 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
                  />

                  <span className="text-sm text-slate-700">
                    I agree to the Terms of Service and
                    Privacy Guidelines.
                  </span>

                </label>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-semibold py-3 px-4 rounded-xl shadow-md transition"
                >
                  {isSubmitting
                    ? "Registering..."
                    : "Complete Registration"}
                </button>

              </form>
            )}

            {/* ========================================
                STEP 6 — SUCCESS
            ======================================== */}

            {step === 6 && (
              <div className="text-center py-4 space-y-4">

                <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-emerald-100 text-3xl text-emerald-600">
                  ✓
                </div>

                <h2 className="text-2xl font-bold text-slate-800">
                  Registration Complete!
                </h2>

                <p className="text-sm text-slate-600">
                  Your doctor profile has been generated successfully.
                </p>

                <button
                  onClick={() =>
                    navigate("/doctor/login")
                  }
                  className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-semibold py-3 px-4 rounded-xl shadow-md transition"
                >
                  Go to Doctor Login
                </button>

              </div>
            )}

          </div>

        </div>

      </main>

    </div>
  );
}