import React, { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";
import { apiRequest } from "../utils/api";
import { useTranslation } from "../hooks/useTranslation";
import { useLanguage } from "../context/LanguageContext";
import { ALL_INDIAN_LANGUAGES } from "../constants/languages";

const ENGLISH_LOGIN_TEXT = {
  patientPortal: "Patient Portal",
  abhaLogin: "ABHA Login",
  selectPreferredLanguage: "Select Preferred Language",
  enterAbhaId: "Enter ABHA ID",
  abhaPlaceholder: "e.g. 91-4452-8819-2041",
  sendingOtp: "SENDING OTP...",
  getOtp: "GET OTP",
  otpSentForAbhaId: "OTP sent for ABHA ID",
  enterOtp: "Enter OTP",
  otpPlaceholder: "6-Digit OTP",
  verifying: "VERIFYING...",
  continue: "CONTINUE",
  successful: "Login Successful",
  languagePreferenceSuccess: "Language preference set successfully.",
  accessHealthDashboard: "Access Health Dashboard",
  invalidIdentifier: "Please enter your ABHA ID.",
  failedToLoadLanguages: "Failed to load languages.",
};

export default function PatientLogin() {
  const navigate = useNavigate();
  const { language, setLanguage } = useLanguage();

  // Get the saved language from Signup/Login
  const getSavedLanguageCode = () => {
    try {
      const savedLanguage = localStorage.getItem("preferred_language");

      if (!savedLanguage) return "en";

      // If somehow an object was stored
      const parsedLanguage = JSON.parse(savedLanguage);

      if (parsedLanguage?.code) {
        return parsedLanguage.code;
      }
    } catch {
      // Normal case: preferred_language is simply "en", "hi", etc.
    }

    return localStorage.getItem("preferred_language") || "en";
  };

  const [step, setStep] = useState(1);
  const [identifier, setIdentifier] = useState("");
  const [otp, setOtp] = useState("");

  const [languages, setLanguages] = useState([]);

  const [selectedLanguageCode, setSelectedLanguageCode] = useState(
    language?.code || getSavedLanguageCode()
  );

  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  // Translation uses the global language state
  const { t } = useTranslation(ENGLISH_LOGIN_TEXT);

  // Fetch supported languages
  useEffect(() => {
    apiRequest("/languages/list")
      .then((data) => {
        const availableLanguages =
          data.languages?.length > 0
            ? data.languages
            : ALL_INDIAN_LANGUAGES;

        setLanguages(availableLanguages);

        // Find the language saved during Signup
        const savedCode =
          language?.code || getSavedLanguageCode();

        const savedLanguageData =
          availableLanguages.find(
            (lang) => lang.code === savedCode
          ) ||
          ALL_INDIAN_LANGUAGES.find(
            (lang) => lang.code === savedCode
          ) ||
          availableLanguages.find(
            (lang) => lang.code === "en"
          ) || {
            code: "en",
            name: "English",
            nativeName: "English",
          };

        setSelectedLanguageCode(savedLanguageData.code);

        // Set global language so Login UI translates immediately
        setLanguage(savedLanguageData);

        // Keep language saved
        localStorage.setItem(
          "preferred_language",
          savedLanguageData.code
        );
      })
      .catch(() => {
        const fallbackLanguages = ALL_INDIAN_LANGUAGES;

        setLanguages(fallbackLanguages);

        const savedCode = getSavedLanguageCode();

        const savedLanguageData =
          fallbackLanguages.find(
            (lang) => lang.code === savedCode
          ) ||
          fallbackLanguages.find(
            (lang) => lang.code === "en"
          ) || {
            code: "en",
            name: "English",
            nativeName: "English",
          };

        setSelectedLanguageCode(savedLanguageData.code);
        setLanguage(savedLanguageData);

        localStorage.setItem(
          "preferred_language",
          savedLanguageData.code
        );
      });
  }, []);

  // Handle manual language change on Login page
  const handleLanguageChange = (languageCode) => {
    const selectedLanguageData =
      languages.find(
        (lang) => lang.code === languageCode
      ) ||
      ALL_INDIAN_LANGUAGES.find(
        (lang) => lang.code === languageCode
      ) || {
        code: "en",
        name: "English",
        nativeName: "English",
      };

    setSelectedLanguageCode(selectedLanguageData.code);

    // Update global language
    setLanguage(selectedLanguageData);

    // Save only the language code everywhere
    localStorage.setItem(
      "preferred_language",
      selectedLanguageData.code
    );
  };

  // Get selected language details
  const selectedLanguageData = useMemo(() => {
    return (
      languages.find(
        (lang) => lang.code === selectedLanguageCode
      ) ||
      ALL_INDIAN_LANGUAGES.find(
        (lang) => lang.code === selectedLanguageCode
      ) || {
        code: "en",
        name: "English",
        nativeName: "English",
      }
    );
  }, [languages, selectedLanguageCode]);

  // STEP 1: Request OTP
  const normalizePatientIdentifier = (value) => {
    const trimmedValue = value.trim();

    if (!trimmedValue) {
      return "";
    }

    const digitsOnly = trimmedValue.replace(/\D/g, "");

    if (/^\+?\d{10}$/.test(trimmedValue) || /^\d{10}$/.test(digitsOnly)) {
      return digitsOnly;
    }

    return trimmedValue;
  };

  const handleGetOtp = async (e) => {
    e.preventDefault();

    setErrorMessage("");

    const normalizedIdentifier = normalizePatientIdentifier(identifier);

    if (!normalizedIdentifier) {
      setErrorMessage(t.invalidIdentifier);
      return;
    }

    try {
      setLoading(true);

      const data = await apiRequest(
        "/auth/patient/send-otp",
        {
          method: "POST",
          body: JSON.stringify({
            identifier: normalizedIdentifier,
          }),
        }
      );

      if (data.demoOtp) {
        alert("DEMO OTP: " + data.demoOtp);
      }

      setStep(2);
    } catch (err) {
      setErrorMessage(
        err.message || "Failed to send OTP."
      );
    } finally {
      setLoading(false);
    }
  };

  // STEP 2: Verify OTP
  const handleVerifyOtp = async (e) => {
    e.preventDefault();

    setErrorMessage("");

    const normalizedOtp = otp.trim().replace(/\D/g, "");

    if (!normalizedOtp) {
      setErrorMessage("Please enter the 6-digit OTP.");
      return;
    }

    try {
      setLoading(true);

      const data = await apiRequest(
        "/auth/patient/verify-otp",
        {
          method: "POST",
          body: JSON.stringify({
            identifier: normalizePatientIdentifier(identifier),
            otp: normalizedOtp,
          }),
        }
      );

      // Save patient login details
      localStorage.setItem(
        "patient_token",
        data.token
      );

      localStorage.setItem(
        "patient_user",
        JSON.stringify(data.patient)
      );

      // Save selected language locally
      localStorage.setItem(
        "preferred_language",
        selectedLanguageData.code
      );

      localStorage.setItem(
        "selectedLanguage",
        JSON.stringify(selectedLanguageData)
      );

      // Update global language
      setLanguage(selectedLanguageData);

      // Sync language with backend
      await apiRequest(
        "/auth/patient/language",
        {
          method: "PUT",

          headers: {
            Authorization: `Bearer ${data.token}`,
          },

          body: JSON.stringify({
            languageCode: selectedLanguageData.code,
            languageName: selectedLanguageData.name,
          }),
        }
      );

      setStep(3);
    } catch (err) {
      console.error("Login failed:", err);

      setErrorMessage(
        err.message || "Login verification failed."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,_#e0f2fe,_#f8fafc_35%,_#ecfdf5_100%)] text-slate-800 pt-20 pb-12">
      <Navbar />

      <main className="flex items-center justify-center px-4 py-10">
        <div className="w-full max-w-md">
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

            {/* HEADER */}
            <div className="text-center mb-6">
              <span className="inline-block text-xs font-semibold uppercase tracking-widest bg-emerald-100 text-emerald-800 px-3 py-1 rounded-full">
                {t.patientPortal}
              </span>

              <h1 className="mt-3 text-2xl md:text-3xl font-black text-slate-800">
                {t.abhaLogin}
              </h1>
            </div>

            {/* ERROR */}
            {errorMessage && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-600 rounded-xl text-xs text-center font-medium">
                {errorMessage}
              </div>
            )}

            {/* STEP 1: LANGUAGE + ABHA */}
            {step === 1 && (
              <form
                onSubmit={handleGetOtp}
                className="space-y-4"
              >
                {/* LANGUAGE */}
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    {t.selectPreferredLanguage}
                  </label>

                  <select
                    value={selectedLanguageCode}
                    onChange={(e) =>
                      handleLanguageChange(
                        e.target.value
                      )
                    }
                    className="border border-slate-200 focus:border-emerald-500 p-3 w-full rounded-xl outline-none bg-white font-medium"
                  >
                    {languages.map((lang) => (
                      <option
                        key={lang.code}
                        value={lang.code}
                      >
                        {lang.nativeName} ({lang.name})
                      </option>
                    ))}
                  </select>
                </div>

                {/* ABHA ID */}
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    {t.enterAbhaId}
                  </label>

                  <input
                    type="text"
                    required
                    value={identifier}
                    onChange={(e) =>
                      setIdentifier(
                        e.target.value
                      )
                    }
                    placeholder={t.abhaPlaceholder}
                    className="border border-slate-200 focus:border-emerald-500 p-3 w-full rounded-xl outline-none transition"
                  />
                </div>

                {/* GET OTP */}
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-semibold py-3 px-4 rounded-xl shadow-md transition"
                >
                  {loading
                    ? t.sendingOtp
                    : t.getOtp}
                </button>
              </form>
            )}

            {/* STEP 2: OTP */}
            {step === 2 && (
              <form
                onSubmit={handleVerifyOtp}
                className="space-y-4"
              >
                <div className="text-center mb-2">
                  <p className="text-xs text-slate-500">
                    {t.otpSentForAbhaId}{" "}
                    <strong>
                      {identifier}
                    </strong>
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    {t.enterOtp}
                  </label>

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
                    placeholder={t.otpPlaceholder}
                    className="border border-slate-200 focus:border-emerald-500 p-3 w-full text-center text-2xl font-mono tracking-widest rounded-xl outline-none"
                    required
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-semibold py-3 px-4 rounded-xl shadow-md transition"
                >
                  {loading
                    ? t.verifying
                    : t.continue}
                </button>
              </form>
            )}

            {/* STEP 3: SUCCESS */}
            {step === 3 && (
              <div className="text-center py-4 space-y-4">
                <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-emerald-100 text-3xl text-emerald-600">
                  ✓
                </div>

                <h2 className="text-2xl font-bold text-slate-800">
                  {t.successful}
                </h2>

                <p className="text-sm text-slate-600">
                  {t.languagePreferenceSuccess}
                </p>

                <button
                  onClick={() =>
                    navigate("/patient/dashboard")
                  }
                  className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-semibold py-3 px-4 rounded-xl shadow-md transition"
                >
                  {t.accessHealthDashboard}
                </button>
              </div>
            )}

          </div>
        </div>
      </main>
    </div>
  );
}