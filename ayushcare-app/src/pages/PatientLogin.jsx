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
  abhaPlaceholder: "e.g. 91-2222-4444-888824",
  sendingOtp: "SENDING OTP...",
  getOtp: "GET OTP",
  otpSentForAbhaId: "OTP sent for ABHA ID",
  enterOtp: "Enter OTP",
  otpPlaceholder: "6-Digit OTP",
  verifying: "VERIFYING...",
  continue: "CONTINUE",
  invalidIdentifier: "Please enter your ABHA ID.",
  failedToLoadLanguages: "Failed to load languages.",
};

export default function PatientLogin() {
  const navigate = useNavigate();
  const { language, setLanguage } = useLanguage();

  // =====================================================
  // GET SAVED LANGUAGE
  // =====================================================

  const getSavedLanguageCode = () => {
    try {
      const savedLanguage =
        localStorage.getItem("preferred_language");

      if (!savedLanguage) {
        return "en";
      }

      const parsedLanguage =
        JSON.parse(savedLanguage);

      if (parsedLanguage?.code) {
        return parsedLanguage.code;
      }
    } catch {
      // preferred_language may already be a simple string
    }

    return (
      localStorage.getItem("preferred_language") ||
      "en"
    );
  };

  // =====================================================
  // STATES
  // =====================================================

  const [step, setStep] = useState(1);

  const [identifier, setIdentifier] =
    useState("");

  const [otp, setOtp] =
    useState("");

  const [languages, setLanguages] =
    useState([]);

  const [
    selectedLanguageCode,
    setSelectedLanguageCode,
  ] = useState(
    language?.code ||
      getSavedLanguageCode()
  );

  const [loading, setLoading] =
    useState(false);

  const [errorMessage, setErrorMessage] =
    useState("");

  // =====================================================
  // TRANSLATION
  // =====================================================

  const { t } = useTranslation(
    ENGLISH_LOGIN_TEXT
  );

  // =====================================================
  // FETCH SUPPORTED LANGUAGES
  // =====================================================

  useEffect(() => {
    apiRequest("/languages/list")
      .then((data) => {
        const availableLanguages =
          data.languages?.length > 0
            ? data.languages
            : ALL_INDIAN_LANGUAGES;

        setLanguages(
          availableLanguages
        );

        const savedCode =
          language?.code ||
          getSavedLanguageCode();

        const savedLanguageData =
          availableLanguages.find(
            (lang) =>
              lang.code === savedCode
          ) ||
          ALL_INDIAN_LANGUAGES.find(
            (lang) =>
              lang.code === savedCode
          ) ||
          availableLanguages.find(
            (lang) =>
              lang.code === "en"
          ) || {
            code: "en",
            name: "English",
            nativeName: "English",
          };

        setSelectedLanguageCode(
          savedLanguageData.code
        );

        setLanguage(
          savedLanguageData
        );

        localStorage.setItem(
          "preferred_language",
          savedLanguageData.code
        );

        localStorage.setItem(
          "selectedLanguage",
          JSON.stringify(
            savedLanguageData
          )
        );
      })
      .catch((error) => {
        console.error(
          "Failed to load languages:",
          error
        );

        const fallbackLanguages =
          ALL_INDIAN_LANGUAGES;

        setLanguages(
          fallbackLanguages
        );

        const savedCode =
          getSavedLanguageCode();

        const savedLanguageData =
          fallbackLanguages.find(
            (lang) =>
              lang.code === savedCode
          ) ||
          fallbackLanguages.find(
            (lang) =>
              lang.code === "en"
          ) || {
            code: "en",
            name: "English",
            nativeName: "English",
          };

        setSelectedLanguageCode(
          savedLanguageData.code
        );

        setLanguage(
          savedLanguageData
        );

        localStorage.setItem(
          "preferred_language",
          savedLanguageData.code
        );

        localStorage.setItem(
          "selectedLanguage",
          JSON.stringify(
            savedLanguageData
          )
        );
      });
  }, []);

  // =====================================================
  // HANDLE LANGUAGE CHANGE
  // =====================================================

  const handleLanguageChange = (
    languageCode
  ) => {
    const selectedLanguageData =
      languages.find(
        (lang) =>
          lang.code === languageCode
      ) ||
      ALL_INDIAN_LANGUAGES.find(
        (lang) =>
          lang.code === languageCode
      ) || {
        code: "en",
        name: "English",
        nativeName: "English",
      };

    setSelectedLanguageCode(
      selectedLanguageData.code
    );

    setLanguage(
      selectedLanguageData
    );

    localStorage.setItem(
      "preferred_language",
      selectedLanguageData.code
    );

    localStorage.setItem(
      "selectedLanguage",
      JSON.stringify(
        selectedLanguageData
      )
    );
  };

  // =====================================================
  // GET SELECTED LANGUAGE DETAILS
  // =====================================================

  const selectedLanguageData =
    useMemo(() => {
      return (
        languages.find(
          (lang) =>
            lang.code ===
            selectedLanguageCode
        ) ||
        ALL_INDIAN_LANGUAGES.find(
          (lang) =>
            lang.code ===
            selectedLanguageCode
        ) || {
          code: "en",
          name: "English",
          nativeName: "English",
        }
      );
    }, [
      languages,
      selectedLanguageCode,
    ]);

  // =====================================================
  // NORMALIZE ABHA ID
  //
  // IMPORTANT:
  // We keep hyphens because your MongoDB currently
  // stores the ABHA like:
  //
  // 91-2222-4444-888824
  //
  // We only remove extra spaces from the beginning
  // and end.
  // =====================================================

  const normalizePatientIdentifier = (
    value
  ) => {
    const trimmedValue =
      String(value || "").trim();

    if (!trimmedValue) {
      return "";
    }

    // Remove accidental spaces around the ABHA,
    // but keep the hyphens.
    return trimmedValue.replace(
      /\s+/g,
      ""
    );
  };

  // =====================================================
  // STEP 1: REQUEST OTP
  // =====================================================

  const handleGetOtp = async (e) => {
    e.preventDefault();

    setErrorMessage("");

    const normalizedIdentifier =
      normalizePatientIdentifier(
        identifier
      );

    if (!normalizedIdentifier) {
      setErrorMessage(
        t.invalidIdentifier
      );
      return;
    }

    try {
      setLoading(true);

      const data =
        await apiRequest(
          "/auth/patient/send-otp",
          {
            method: "POST",

            body: JSON.stringify({
              identifier:
                normalizedIdentifier,
            }),
          }
        );

      // =================================================
      // DEMO OTP
      // =================================================

      if (data?.demoOtp) {
        alert(
          "DEMO OTP: " +
            data.demoOtp
        );
      }

      setStep(2);
    } catch (err) {
      console.error(
        "Send OTP failed:",
        err
      );

      setErrorMessage(
        err.message ||
          "Failed to send OTP."
      );
    } finally {
      setLoading(false);
    }
  };

  // =====================================================
  // STEP 2: VERIFY OTP
  // =====================================================

  const handleVerifyOtp = async (
    e
  ) => {
    e.preventDefault();

    setErrorMessage("");

    const normalizedOtp =
      otp
        .trim()
        .replace(/\D/g, "");

    if (!normalizedOtp) {
      setErrorMessage(
        "Please enter the 6-digit OTP."
      );
      return;
    }

    if (
      normalizedOtp.length !== 6
    ) {
      setErrorMessage(
        "Please enter a valid 6-digit OTP."
      );
      return;
    }

    try {
      setLoading(true);

      // =================================================
      // NORMALIZE ABHA
      // =================================================

      const normalizedIdentifier =
        normalizePatientIdentifier(
          identifier
        );

      if (!normalizedIdentifier) {
        throw new Error(
          t.invalidIdentifier
        );
      }

      // =================================================
      // VERIFY OTP
      // =================================================

      const data =
        await apiRequest(
          "/auth/patient/verify-otp",
          {
            method: "POST",

            body: JSON.stringify({
              identifier:
                normalizedIdentifier,

              otp: normalizedOtp,
            }),
          }
        );

      // =================================================
      // CHECK LOGIN RESPONSE
      // =================================================

      if (
        !data?.token ||
        !data?.patient
      ) {
        throw new Error(
          "Login successful, but patient session data was not received."
        );
      }

      // =================================================
      // SAVE PATIENT AUTHENTICATION
      // =================================================

      localStorage.setItem(
        "patient_token",
        data.token
      );

      localStorage.setItem(
        "patient_user",
        JSON.stringify(
          data.patient
        )
      );

      // =================================================
      // SAVE PATIENT ID
      // =================================================

      const patientId =
        data.patient._id ||
        data.patient.id ||
        data.patient.patientId ||
        "";

      if (patientId) {
        localStorage.setItem(
          "patient_id",
          patientId.toString()
        );
      }

      // =================================================
      // SAVE SELECTED LANGUAGE
      // =================================================

      localStorage.setItem(
        "preferred_language",
        selectedLanguageData.code
      );

      localStorage.setItem(
        "selectedLanguage",
        JSON.stringify(
          selectedLanguageData
        )
      );

      // =================================================
      // UPDATE GLOBAL LANGUAGE
      // =================================================

      setLanguage(
        selectedLanguageData
      );

      // =================================================
      // SYNC LANGUAGE WITH BACKEND
      //
      // Language sync failure will NOT
      // stop patient login.
      // =================================================

      try {
        await apiRequest(
          "/auth/patient/language",
          {
            method: "PUT",

            headers: {
              Authorization:
                `Bearer ${data.token}`,
            },

            body: JSON.stringify({
              languageCode:
                selectedLanguageData.code,

              languageName:
                selectedLanguageData.name,
            }),
          }
        );
      } catch (
        languageError
      ) {
        console.warn(
          "Patient language sync failed. Continuing login.",
          languageError
        );
      }

      // =================================================
      // LOGIN COMPLETE
      // OPEN PATIENT DASHBOARD
      // =================================================

      navigate(
        "/patient/dashboard",
        {
          replace: true,
        }
      );
    } catch (err) {
      console.error(
        "Patient login failed:",
        err
      );

      setErrorMessage(
        err.message ||
          "Login verification failed."
      );
    } finally {
      setLoading(false);
    }
  };

  // =====================================================
  // UI
  // =====================================================

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,_#e0f2fe,_#f8fafc_35%,_#ecfdf5_100%)] text-slate-800 pt-20 pb-12">

      <Navbar />

      <main className="flex items-center justify-center px-4 py-10">

        <div className="w-full max-w-md">

          <div className="bg-white/90 backdrop-blur-xl border border-white/80 rounded-[28px] shadow-[0_24px_70px_rgba(15,23,42,0.12)] p-6 md:p-8">

            {/* =================================================
                BACK BUTTON
            ================================================= */}

            <div className="mb-4">

              <button
                type="button"
                onClick={() =>
                  navigate("/")
                }
                className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-3 py-2 text-sm font-medium text-slate-700 transition hover:border-emerald-300 hover:bg-emerald-50 hover:text-emerald-700"
              >
                ← Back
              </button>

            </div>

            {/* =================================================
                HEADER
            ================================================= */}

            <div className="text-center mb-6">

              <span className="inline-block text-xs font-semibold uppercase tracking-widest bg-emerald-100 text-emerald-800 px-3 py-1 rounded-full">
                {t.patientPortal}
              </span>

              <h1 className="mt-3 text-2xl md:text-3xl font-black text-slate-800">
                {t.abhaLogin}
              </h1>

            </div>

            {/* =================================================
                ERROR MESSAGE
            ================================================= */}

            {errorMessage && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-600 rounded-xl text-xs text-center font-medium">
                {errorMessage}
              </div>
            )}

            {/* =================================================
                STEP 1: LANGUAGE + ABHA ID
            ================================================= */}

            {step === 1 && (
              <form
                onSubmit={
                  handleGetOtp
                }
                className="space-y-4"
              >

                {/* LANGUAGE */}

                <div>

                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    {
                      t.selectPreferredLanguage
                    }
                  </label>

                  <select
                    value={
                      selectedLanguageCode
                    }
                    onChange={(e) =>
                      handleLanguageChange(
                        e.target.value
                      )
                    }
                    className="border border-slate-200 focus:border-emerald-500 p-3 w-full rounded-xl outline-none bg-white font-medium"
                  >

                    {languages.map(
                      (lang) => (
                        <option
                          key={
                            lang.code
                          }
                          value={
                            lang.code
                          }
                        >
                          {
                            lang.nativeName
                          }{" "}
                          (
                          {
                            lang.name
                          }
                          )
                        </option>
                      )
                    )}

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
                    value={
                      identifier
                    }
                    onChange={(
                      e
                    ) =>
                      setIdentifier(
                        e.target.value
                      )
                    }
                    placeholder={
                      t.abhaPlaceholder
                    }
                    className="border border-slate-200 focus:border-emerald-500 p-3 w-full rounded-xl outline-none transition"
                  />

                </div>

                {/* GET OTP */}

                <button
                  type="submit"
                  disabled={
                    loading
                  }
                  className="w-full bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-semibold py-3 px-4 rounded-xl shadow-md transition"
                >
                  {loading
                    ? t.sendingOtp
                    : t.getOtp}
                </button>

              </form>
            )}

            {/* =================================================
                STEP 2: OTP
            ================================================= */}

            {step === 2 && (
              <form
                onSubmit={
                  handleVerifyOtp
                }
                className="space-y-4"
              >

                <div className="text-center mb-2">

                  <p className="text-xs text-slate-500">

                    {
                      t.otpSentForAbhaId
                    }{" "}

                    <strong>
                      {identifier}
                    </strong>

                  </p>

                </div>

                {/* OTP INPUT */}

                <div>

                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    {t.enterOtp}
                  </label>

                  <input
                    type="text"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    maxLength="6"
                    value={
                      otp
                    }
                    onChange={(
                      e
                    ) =>
                      setOtp(
                        e.target.value
                          .replace(
                            /\D/g,
                            ""
                          )
                          .slice(
                            0,
                            6
                          )
                      )
                    }
                    placeholder={
                      t.otpPlaceholder
                    }
                    className="border border-slate-200 focus:border-emerald-500 p-3 w-full text-center text-2xl font-mono tracking-widest rounded-xl outline-none"
                    required
                  />

                </div>

                {/* CONTINUE */}

                <button
                  type="submit"
                  disabled={
                    loading
                  }
                  className="w-full bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-semibold py-3 px-4 rounded-xl shadow-md transition"
                >
                  {loading
                    ? t.verifying
                    : t.continue}
                </button>

              </form>
            )}

          </div>

        </div>

      </main>

    </div>
  );
}