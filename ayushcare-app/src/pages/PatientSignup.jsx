import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";
import { apiRequest } from "../utils/api";
import { useTranslation } from "../hooks/useTranslation";
import { useLanguage } from "../context/LanguageContext";

const ENGLISH_SIGNUP_TEXT = {
  portal: "SwasthyaCare Patient Portal",
  title: "Patient Signup",
  chooseLanguage: "Choose Language",
  continue: "Continue",

  mobile: "Enter Mobile Number",
  mobilePlaceholder: "9876543210",
  sendOtp: "Send OTP",
  sendingOtp: "SENDING OTP...",

  verifyOtp: "Verify OTP",
  sentTo: "Sent to",
  enterOtp: "Enter OTP",
  verifyContinue: "Verify & Continue",

  basicDetails: "Basic Details",
  fullName: "Full Name",
  namePlaceholder: "Ram Kumar",
  dateOfBirth: "Date of Birth",
  gender: "Gender",
  male: "Male",
  female: "Female",
  other: "Other",

  abhaInfo: "ABHA Information",
  abhaId: "ABHA ID / Number",
  abhaPlaceholder: "91-4452-8819-2041 (Optional)",
  abhaHint:
    "Enter your ABHA ID if you want to link your health records through ABDM.",

  abdmConsent:
    "I consent to linking my ABHA with SwasthyaCare and to the consent-based exchange of my health information through ABDM.",

  abdmConsentRequired:
    "Please provide consent to link your ABHA and access permitted health records.",

  createAccount: "Create Account",
  creatingAccount: "CREATING ACCOUNT...",

  invalidMobile:
    "Please enter a valid 10-digit mobile number.",

  invalidOtp:
    "Invalid OTP code. Please try again.",

  failedOtp:
    "Failed to send OTP.",
};

export default function PatientSignup() {
  const navigate = useNavigate();

  // =====================================================
  // LANGUAGE
  // =====================================================

  const { language, setLanguage } = useLanguage();
  const { t } = useTranslation(ENGLISH_SIGNUP_TEXT);

  // =====================================================
  // STEPS
  //
  // 1 = Language Selection
  // 2 = Mobile Number
  // 3 = OTP Verification
  // 4 = Patient Details
  // =====================================================

  const [step, setStep] = useState(1);

  // =====================================================
  // STATE
  // =====================================================

  const [languages, setLanguages] = useState([]);

  const [mobile, setMobile] = useState("");

  const [otp, setOtp] = useState("");

  const [demoOtpCode, setDemoOtpCode] = useState("");

  const [loading, setLoading] = useState(false);

  const [errorMessage, setErrorMessage] = useState("");

  const [abdmConsent, setAbdmConsent] = useState(false);

  const [formData, setFormData] = useState({
    fullName: "",
    dob: "",
    gender: "Male",
    abhaNumber: "",
  });

  // =====================================================
  // FETCH SUPPORTED LANGUAGES
  // =====================================================

  useEffect(() => {
    const loadLanguages = async () => {
      try {
        const data = await apiRequest("/languages/list");

        const availableLanguages =
          data.languages?.length > 0
            ? data.languages
            : [
                {
                  code: "en",
                  name: "English",
                  nativeName: "English",
                },
              ];

        setLanguages(availableLanguages);

        // If no language is already selected,
        // use English.
        if (!language?.code) {
          const english =
            availableLanguages.find(
              (lang) => lang.code === "en"
            ) || availableLanguages[0];

          if (english) {
            setLanguage(english);

            localStorage.setItem(
              "preferred_language",
              english.code
            );

            localStorage.setItem(
              "selectedLanguage",
              JSON.stringify(english)
            );
          }
        }
      } catch (error) {
        console.error(
          "Failed to load languages:",
          error
        );

        const fallbackLanguages = [
          {
            code: "en",
            name: "English",
            nativeName: "English",
          },
        ];

        setLanguages(fallbackLanguages);

        if (!language?.code) {
          setLanguage(fallbackLanguages[0]);

          localStorage.setItem(
            "preferred_language",
            "en"
          );

          localStorage.setItem(
            "selectedLanguage",
            JSON.stringify(fallbackLanguages[0])
          );
        }
      }
    };

    loadLanguages();
  }, []);

  // =====================================================
  // LANGUAGE CHANGE
  // =====================================================

  const handleLanguageChange = (languageCode) => {
    const selectedLanguageData =
      languages.find(
        (lang) => lang.code === languageCode
      ) || {
        code: "en",
        name: "English",
        nativeName: "English",
      };

    setLanguage(selectedLanguageData);

    localStorage.setItem(
      "preferred_language",
      selectedLanguageData.code
    );

    localStorage.setItem(
      "selectedLanguage",
      JSON.stringify(selectedLanguageData)
    );
  };

  // =====================================================
  // CONTINUE AFTER LANGUAGE SELECTION
  // =====================================================

  const handleContinue = () => {
    const selectedLanguageData =
      languages.find(
        (lang) => lang.code === language?.code
      ) || {
        code: "en",
        name: "English",
        nativeName: "English",
      };

    setLanguage(selectedLanguageData);

    localStorage.setItem(
      "preferred_language",
      selectedLanguageData.code
    );

    localStorage.setItem(
      "selectedLanguage",
      JSON.stringify(selectedLanguageData)
    );

    setErrorMessage("");

    setStep(2);
  };

  // =====================================================
  // STEP 2: SEND OTP
  // =====================================================

  const handleSendOtp = async (e) => {
    e.preventDefault();

    setErrorMessage("");

    const normalizedMobile = mobile
      .trim()
      .replace(/\D/g, "");

    if (!/^\d{10}$/.test(normalizedMobile)) {
      setErrorMessage(t.invalidMobile);
      return;
    }

    try {
      setLoading(true);

      // -----------------------------------------------
      // DEMO OTP
      // -----------------------------------------------

      const simulatedOtp = Math.floor(
        100000 + Math.random() * 900000
      ).toString();

      setDemoOtpCode(simulatedOtp);

      alert(
        "DEMO SIGNUP OTP: " + simulatedOtp
      );

      setStep(3);
    } catch (err) {
      console.error(
        "Send signup OTP error:",
        err
      );

      setErrorMessage(
        err.message || t.failedOtp
      );
    } finally {
      setLoading(false);
    }
  };

  // =====================================================
  // STEP 3: VERIFY OTP
  // =====================================================

  const handleVerifyOtp = (e) => {
    e.preventDefault();

    setErrorMessage("");

    const normalizedOtp = otp
      .trim()
      .replace(/\D/g, "");

    if (!demoOtpCode) {
      setErrorMessage(
        "Please request OTP again."
      );
      return;
    }

    if (normalizedOtp.length !== 6) {
      setErrorMessage(t.invalidOtp);
      return;
    }

    if (normalizedOtp === demoOtpCode) {
      setErrorMessage("");
      setStep(4);
    } else {
      setErrorMessage(t.invalidOtp);
    }
  };

  // =====================================================
  // STEP 4: CREATE PATIENT ACCOUNT
  // =====================================================

  const handleUnifiedSubmit = async (e) => {
    e.preventDefault();

    setErrorMessage("");

    const normalizedMobile = mobile
      .trim()
      .replace(/\D/g, "");

    const normalizedAbhaNumber =
      formData.abhaNumber.trim();

    // ---------------------------------------------------
    // MOBILE VALIDATION
    // ---------------------------------------------------

    if (!/^\d{10}$/.test(normalizedMobile)) {
      setErrorMessage(t.invalidMobile);
      return;
    }

    // ---------------------------------------------------
    // ABHA CONSENT VALIDATION
    // ---------------------------------------------------

    if (
      normalizedAbhaNumber &&
      !abdmConsent
    ) {
      setErrorMessage(
        t.abdmConsentRequired
      );
      return;
    }

    // ---------------------------------------------------
    // SELECTED LANGUAGE
    // ---------------------------------------------------

    const selectedLanguageData =
      languages.find(
        (lang) =>
          lang.code === language?.code
      ) || {
        code: "en",
        name: "English",
        nativeName: "English",
      };

    // ---------------------------------------------------
    // SIGNUP PAYLOAD
    // ---------------------------------------------------

    const signupPayload = {
      fullName:
        formData.fullName.trim(),

      mobile: normalizedMobile,

      dob: formData.dob,

      gender: formData.gender,

      abhaNumber:
        normalizedAbhaNumber ||
        undefined,

      abdmConsent:
        normalizedAbhaNumber
          ? abdmConsent
          : false,

      language:
        selectedLanguageData.code,
    };

    try {
      setLoading(true);

      // =================================================
      // REMOVE OLD PATIENT SESSION
      //
      // This prevents an old patient account from
      // interfering with the newly created account.
      // =================================================

      localStorage.removeItem(
        "patient_token"
      );

      localStorage.removeItem(
        "patient_user"
      );

      // =================================================
      // CALL PATIENT SIGNUP API
      // =================================================

      const signupResponse =
        await apiRequest(
          "/auth/patient/signup",
          {
            method: "POST",

            body: JSON.stringify(
              signupPayload
            ),
          }
        );

      // =================================================
      // CHECK TOKEN
      // =================================================

      if (!signupResponse?.token) {
        throw new Error(
          "Account was created, but automatic login could not be completed. Please try logging in."
        );
      }

      // =================================================
      // CHECK PATIENT DATA
      // =================================================

      if (!signupResponse?.patient) {
        throw new Error(
          "Patient account information was not returned by the server."
        );
      }

      // =================================================
      // GET PATIENT DATA
      // =================================================

      const patient =
        signupResponse.patient;

      // =================================================
      // SAVE PATIENT AUTHENTICATION TOKEN
      // =================================================

      localStorage.setItem(
        "patient_token",
        signupResponse.token
      );

      // =================================================
      // SAVE PATIENT INFORMATION
      // =================================================

      localStorage.setItem(
        "patient_user",
        JSON.stringify(patient)
      );

      // =================================================
      // SAVE PATIENT ID SEPARATELY
      //
      // This is useful if dashboard components need
      // the MongoDB patient ID.
      // =================================================

      const patientId =
        patient._id ||
        patient.id ||
        patient.patientId ||
        "";

      if (patientId) {
        localStorage.setItem(
          "patient_id",
          patientId.toString()
        );
      }

      // =================================================
      // SAVE LANGUAGE
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
      // CLEAR FORM DATA
      // =================================================

      setOtp("");
      setDemoOtpCode("");

      // =================================================
      // AUTOMATIC LOGIN COMPLETE
      // DIRECTLY OPEN PATIENT DASHBOARD
      // =================================================

      navigate(
        "/patient/dashboard",
        {
          replace: true,
        }
      );
    } catch (err) {
      console.error(
        "Patient signup error:",
        err
      );

      setErrorMessage(
        err.message ||
          "Failed to create patient account."
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

      <main className="flex items-center justify-center px-4 py-8">

        <div className="w-full max-w-lg">

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
                HEADING
            ================================================= */}

            <div className="text-center mb-6">

              <span className="inline-block text-xs font-semibold uppercase tracking-widest bg-emerald-100 text-emerald-800 px-3 py-1 rounded-full">
                {t.portal}
              </span>

              <h1 className="mt-3 text-2xl md:text-3xl font-black text-slate-800">
                {t.title}
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
                STEP 1: LANGUAGE
            ================================================= */}

            {step === 1 && (
              <div className="space-y-4">

                <label className="block text-sm font-medium text-slate-700">
                  {t.chooseLanguage}
                </label>

                <select
                  value={
                    language?.code ||
                    "en"
                  }
                  onChange={(e) =>
                    handleLanguageChange(
                      e.target.value
                    )
                  }
                  className="w-full border border-slate-200 p-3 rounded-xl outline-none bg-white text-base font-medium"
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

                <button
                  type="button"
                  onClick={
                    handleContinue
                  }
                  className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-semibold py-3 px-4 rounded-xl shadow-md transition"
                >
                  {t.continue}
                </button>

              </div>
            )}

            {/* =================================================
                STEP 2: MOBILE
            ================================================= */}

            {step === 2 && (
              <form
                onSubmit={
                  handleSendOtp
                }
                className="space-y-4"
              >

                <div>

                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    {t.mobile}
                  </label>

                  <div className="flex gap-2">

                    <span className="p-3 bg-slate-100 border border-slate-200 rounded-xl text-slate-600 font-medium">
                      +91
                    </span>

                    <input
                      type="tel"
                      required
                      inputMode="numeric"
                      pattern="[0-9]*"
                      maxLength="10"
                      value={
                        mobile
                      }
                      onChange={(
                        e
                      ) =>
                        setMobile(
                          e.target.value
                            .replace(
                              /\D/g,
                              ""
                            )
                            .slice(
                              0,
                              10
                            )
                        )
                      }
                      placeholder={
                        t.mobilePlaceholder
                      }
                      className="border border-slate-200 focus:border-emerald-500 p-3 w-full rounded-xl outline-none"
                    />

                  </div>

                </div>

                <button
                  type="submit"
                  disabled={
                    loading
                  }
                  className="w-full bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-semibold py-3 px-4 rounded-xl shadow-md transition"
                >
                  {loading
                    ? t.sendingOtp
                    : t.sendOtp}
                </button>

              </form>
            )}

            {/* =================================================
                STEP 3: OTP
            ================================================= */}

            {step === 3 && (
              <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">

                <div className="bg-white rounded-3xl shadow-2xl p-6 md:p-8 w-full max-w-md text-center">

                  <h2 className="text-2xl font-bold text-slate-800 mb-2">
                    {t.verifyOtp}
                  </h2>

                  <p className="text-sm text-slate-600 mb-6">
                    {t.sentTo} +91{" "}
                    {mobile}
                  </p>

                  <form
                    onSubmit={
                      handleVerifyOtp
                    }
                    className="space-y-4"
                  >

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
                        t.enterOtp
                      }
                      className="border border-slate-200 focus:border-emerald-500 p-3 w-full text-center text-2xl font-mono tracking-widest rounded-xl outline-none"
                      required
                    />

                    <button
                      type="submit"
                      disabled={
                        loading
                      }
                      className="w-full bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-semibold py-3 px-4 rounded-xl shadow-md transition"
                    >
                      {
                        t.verifyContinue
                      }
                    </button>

                  </form>

                </div>

              </div>
            )}

            {/* =================================================
                STEP 4: PATIENT DETAILS
            ================================================= */}

            {step === 4 && (
              <form
                onSubmit={
                  handleUnifiedSubmit
                }
                className="space-y-5"
              >

                <div className="border-b border-slate-100 pb-3">

                  <h3 className="text-base font-bold text-slate-800">
                    {t.basicDetails}
                  </h3>

                </div>

                {/* FULL NAME */}

                <div>

                  <label className="block text-xs font-semibold uppercase text-slate-500 mb-1">
                    {t.fullName}
                  </label>

                  <input
                    type="text"
                    required
                    value={
                      formData.fullName
                    }
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        fullName:
                          e.target.value,
                      })
                    }
                    placeholder={
                      t.namePlaceholder
                    }
                    className="border border-slate-200 p-3 w-full rounded-xl outline-none"
                  />

                </div>

                <div className="grid grid-cols-2 gap-4">

                  {/* DATE OF BIRTH */}

                  <div>

                    <label className="block text-xs font-semibold uppercase text-slate-500 mb-1">
                      {
                        t.dateOfBirth
                      }
                    </label>

                    <input
                      type="date"
                      required
                      value={
                        formData.dob
                      }
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          dob:
                            e.target.value,
                        })
                      }
                      className="border border-slate-200 p-3 w-full rounded-xl outline-none"
                    />

                  </div>

                  {/* GENDER */}

                  <div>

                    <label className="block text-xs font-semibold uppercase text-slate-500 mb-1">
                      {t.gender}
                    </label>

                    <select
                      value={
                        formData.gender
                      }
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          gender:
                            e.target.value,
                        })
                      }
                      className="border border-slate-200 p-3 w-full rounded-xl outline-none bg-white"
                    >

                      <option value="Male">
                        {t.male}
                      </option>

                      <option value="Female">
                        {t.female}
                      </option>

                      <option value="Other">
                        {t.other}
                      </option>

                    </select>

                  </div>

                </div>

                {/* ABHA INFORMATION */}

                <div className="border-b border-slate-100 pt-3 pb-2">

                  <h3 className="text-base font-bold text-slate-800">
                    {t.abhaInfo}
                  </h3>

                </div>

                <div>

                  <label className="block text-xs font-semibold uppercase text-slate-500 mb-1">
                    {t.abhaId}
                  </label>

                  <input
                    type="text"
                    value={
                      formData.abhaNumber
                    }
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        abhaNumber:
                          e.target.value,
                      })
                    }
                    placeholder={
                      t.abhaPlaceholder
                    }
                    className="border border-slate-200 p-3 w-full rounded-xl outline-none"
                  />

                  <p className="text-xs text-slate-400 mt-1">
                    {t.abhaHint}
                  </p>

                </div>

                {/* ABDM CONSENT */}

                {formData.abhaNumber.trim() && (
                  <div className="bg-emerald-50 border border-emerald-100 rounded-2xl p-4">

                    <label className="flex items-start gap-3 cursor-pointer">

                      <input
                        type="checkbox"
                        checked={
                          abdmConsent
                        }
                        onChange={(
                          e
                        ) =>
                          setAbdmConsent(
                            e.target.checked
                          )
                        }
                        className="mt-1 h-4 w-4 accent-emerald-600 cursor-pointer"
                      />

                      <span className="text-xs leading-5 text-slate-700">
                        {
                          t.abdmConsent
                        }
                      </span>

                    </label>

                  </div>
                )}

                {/* CREATE ACCOUNT */}

                <button
                  type="submit"
                  disabled={
                    loading
                  }
                  className="w-full bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-semibold py-3 px-4 rounded-xl shadow-md transition"
                >
                  {loading
                    ? t.creatingAccount
                    : t.createAccount}
                </button>

              </form>
            )}

          </div>

        </div>

      </main>

    </div>
  );
}