import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  FileText,
  CheckCircle,
  AlertCircle,
  ShieldCheck,
  Sparkles,
  Paperclip,
  Send,
  X,
  Mic,
  MicOff,
  Volume2,
  Globe,
} from "lucide-react";
import { API_BASE_URL } from "../utils/api";

function Chatbot() {
  const navigate = useNavigate();

  // =====================================================
  // AI MODE
  // =====================================================

  const [mode, setMode] = useState("ayurveda");

  // =====================================================
  // MULTILINGUAL SUPPORT
  // =====================================================

  const LANGUAGE_OPTIONS = [
    {
      code: "en",
      label: "English",
      shortLabel: "English",
      flag: "🇮🇳",
      recognition: "en-IN",
      speech: "en-IN",
    },
    {
      code: "hi",
      label: "Hindi",
      shortLabel: "हिन्दी",
      flag: "🇮🇳",
      recognition: "hi-IN",
      speech: "hi-IN",
    },
    {
      code: "hinglish",
      label: "Hinglish",
      shortLabel: "Hinglish",
      flag: "🔄",
      recognition: "hi-IN",
      speech: "hi-IN",
    },
    {
      code: "hne",
      label: "Chhattisgarhi",
      shortLabel: "छत्तीसगढ़ी",
      flag: "🟠",
      recognition: "hi-IN",
      speech: "hi-IN",
    },
    {
      code: "mr",
      label: "Marathi",
      shortLabel: "मराठी",
      flag: "🇮🇳",
      recognition: "mr-IN",
      speech: "mr-IN",
    },
    {
      code: "bn",
      label: "Bengali",
      shortLabel: "বাংলা",
      flag: "🇮🇳",
      recognition: "bn-IN",
      speech: "bn-IN",
    },
    {
      code: "gu",
      label: "Gujarati",
      shortLabel: "ગુજરાતી",
      flag: "🇮🇳",
      recognition: "gu-IN",
      speech: "gu-IN",
    },
    {
      code: "pa",
      label: "Punjabi",
      shortLabel: "ਪੰਜਾਬੀ",
      flag: "🇮🇳",
      recognition: "pa-IN",
      speech: "pa-IN",
    },
    {
      code: "or",
      label: "Odia",
      shortLabel: "ଓଡ଼ିଆ",
      flag: "🇮🇳",
      recognition: "or-IN",
      speech: "or-IN",
    },
    {
      code: "te",
      label: "Telugu",
      shortLabel: "తెలుగు",
      flag: "🇮🇳",
      recognition: "te-IN",
      speech: "te-IN",
    },
    {
      code: "ta",
      label: "Tamil",
      shortLabel: "தமிழ்",
      flag: "🇮🇳",
      recognition: "ta-IN",
      speech: "ta-IN",
    },
    {
      code: "kn",
      label: "Kannada",
      shortLabel: "ಕನ್ನಡ",
      flag: "🇮🇳",
      recognition: "kn-IN",
      speech: "kn-IN",
    },
    {
      code: "ml",
      label: "Malayalam",
      shortLabel: "മലയാളം",
      flag: "🇮🇳",
      recognition: "ml-IN",
      speech: "ml-IN",
    },
    {
      code: "as",
      label: "Assamese",
      shortLabel: "অসমীয়া",
      flag: "🇮🇳",
      recognition: "as-IN",
      speech: "as-IN",
    },
    {
      code: "ne",
      label: "Nepali",
      shortLabel: "नेपाली",
      flag: "🇳🇵",
      recognition: "ne-NP",
      speech: "ne-NP",
    },
    {
      code: "ur",
      label: "Urdu",
      shortLabel: "اردو",
      flag: "🇮🇳",
      recognition: "ur-IN",
      speech: "ur-IN",
    },
  ];

  const [voiceLanguage, setVoiceLanguage] = useState("hinglish");
  const [showLanguageMenu, setShowLanguageMenu] = useState(false);

  const getSelectedLanguage = () => {
    return (
      LANGUAGE_OPTIONS.find(
        (language) => language.code === voiceLanguage,
      ) || LANGUAGE_OPTIONS[2]
    );
  };

  const selectedLanguage = getSelectedLanguage();

  // =====================================================
  // CHAT STATES
  // =====================================================

  const [messages, setMessages] = useState([
    {
      text:
        "Namaste! 🙏 Main SwasthyaCare AI Assistant hoon. " +
        "Aapki health se related kaise madad kar sakta hoon?",
      sender: "bot",
    },
  ]);

  const [redFlagAlert, setRedFlagAlert] = useState(null);

  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [autoScroll, setAutoScroll] = useState(true);

  const chatContainerRef = useRef(null);

  // =====================================================
  // SPEECH STATES
  // =====================================================

  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);

  // Full voice assistant:
  // listen -> send -> speak -> listen again
  const [voiceAssistantActive, setVoiceAssistantActive] =
    useState(false);

  const voiceAssistantRef = useRef(false);
  const sendMessageRef = useRef(null);

  const recognitionRef = useRef(null);
  const speechSupportedRef = useRef(false);
  const speechUtteranceRef = useRef(null);

  // Prevent duplicate recognition.start()
  const isListeningRef = useRef(false);
  const recognitionStartingRef = useRef(false);

  // Used to restart Voice Assistant after speech
  const recognitionRestartTimerRef = useRef(null);

  // Used to prevent a final speech result from being sent twice
  const lastFinalTranscriptRef = useRef("");

  // =====================================================
  // DOCUMENT / OCR STATES
  // =====================================================

  const [consentAccepted, setConsentAccepted] =
    useState(false);

  const [showConsent, setShowConsent] =
    useState(false);

  const [checkingConsent, setCheckingConsent] =
    useState(false);

  const [savingConsent, setSavingConsent] =
    useState(false);

  const [selectedFile, setSelectedFile] =
    useState(null);

  const [uploadingDocument, setUploadingDocument] =
    useState(false);

  const [uploadedDocuments, setUploadedDocuments] =
    useState([]);

  const [ocrText, setOcrText] = useState("");
  const [uploadError, setUploadError] = useState("");

  const fileInputRef = useRef(null);

  // =====================================================
  // CASE SUMMARY STATES
  // =====================================================

  const [generatingSummary, setGeneratingSummary] =
    useState(false);

  const [caseSummary, setCaseSummary] =
    useState("");

  const [summaryGeneratedAt, setSummaryGeneratedAt] =
    useState(null);

  const [summaryStatus, setSummaryStatus] =
    useState("Not Generated");

  const [summaryError, setSummaryError] =
    useState("");

  const [summaryApproved, setSummaryApproved] =
    useState(false);

  const [sendingSummary, setSendingSummary] =
    useState(false);

  const [tokenCaseId, setTokenCaseId] =
    useState("");

  // =====================================================
  // LANGUAGE HELPERS
  // =====================================================

  const getRecognitionLanguage = () => {
    return selectedLanguage.recognition;
  };

  const getSpeechLanguage = () => {
    return selectedLanguage.speech;
  };

  const getLanguageDisplayName = () => {
    return selectedLanguage.label;
  };

  const getLanguageShortName = () => {
    return selectedLanguage.shortLabel;
  };

  // =====================================================
  // SPEECH-TO-TEXT SETUP
  // =====================================================

  useEffect(() => {
    const SpeechRecognition =
      window.SpeechRecognition ||
      window.webkitSpeechRecognition;

    if (!SpeechRecognition) {
      speechSupportedRef.current = false;
      return;
    }

    speechSupportedRef.current = true;

    const recognition = new SpeechRecognition();

    recognition.continuous = false;
    recognition.interimResults = true;
    recognition.maxAlternatives = 1;

    recognition.lang = getRecognitionLanguage();

    recognition.onstart = () => {
      recognitionStartingRef.current = false;
      isListeningRef.current = true;
      setIsListening(true);
    };

    recognition.onresult = (event) => {
      let interimTranscript = "";
      let finalTranscript = "";

      for (
        let i = event.resultIndex;
        i < event.results.length;
        i++
      ) {
        const transcript =
          event.results[i]?.[0]?.transcript || "";

        if (event.results[i].isFinal) {
          finalTranscript += `${transcript} `;
        } else {
          interimTranscript += `${transcript} `;
        }
      }

      finalTranscript = finalTranscript.trim();
      interimTranscript = interimTranscript.trim();

      const displayTranscript =
        `${finalTranscript} ${interimTranscript}`
          .replace(/\s+/g, " ")
          .trim();

      if (displayTranscript) {
        setInput(displayTranscript);
      }

      // Voice Assistant automatically sends only the FINAL result.
      if (
        finalTranscript &&
        voiceAssistantRef.current &&
        finalTranscript !== lastFinalTranscriptRef.current
      ) {
        lastFinalTranscriptRef.current =
          finalTranscript;

        setTimeout(() => {
          if (!voiceAssistantRef.current) {
            return;
          }

          sendMessageRef.current?.(
            finalTranscript,
          );
        }, 50);
      }
    };

    recognition.onerror = (event) => {
      recognitionStartingRef.current = false;
      isListeningRef.current = false;
      setIsListening(false);

      console.error(
        "Speech Recognition Error:",
        event.error,
      );

      if (event.error === "not-allowed") {
        alert(
          "Microphone permission is blocked. Please allow microphone access for this website and try again.",
        );
      } else if (
        event.error === "audio-capture"
      ) {
        alert(
          "No microphone was detected. Please check your microphone and try again.",
        );
      } else if (
        event.error === "network"
      ) {
        console.warn(
          "Speech recognition network error.",
        );
      } else if (
        event.error === "no-speech"
      ) {
        console.log(
          "No speech detected. Please try speaking again.",
        );
      } else if (
        event.error === "aborted"
      ) {
        console.log(
          "Speech recognition was stopped.",
        );
      }
    };

    recognition.onend = () => {
      recognitionStartingRef.current = false;
      isListeningRef.current = false;
      setIsListening(false);

      // IMPORTANT:
      // We do NOT immediately restart here.
      // Voice Assistant restarts only after AI speech finishes.
    };

    recognitionRef.current = recognition;

    return () => {
      try {
        recognition.stop();
      } catch (error) {
        // Recognition may already be stopped.
      }

      recognitionRef.current = null;
      isListeningRef.current = false;
      recognitionStartingRef.current = false;
    };
  }, []);

  // =====================================================
  // UPDATE RECOGNITION LANGUAGE
  // =====================================================

  useEffect(() => {
    if (!recognitionRef.current) {
      return;
    }

    recognitionRef.current.lang =
      getRecognitionLanguage();
  }, [voiceLanguage]);

  // =====================================================
  // VOICE ASSISTANT LISTENING
  // =====================================================

  const startListening = () => {
    if (
      !speechSupportedRef.current ||
      loading ||
      uploadingDocument ||
      generatingSummary
    ) {
      return;
    }

    const recognition = recognitionRef.current;

    if (!recognition) {
      return;
    }

    if (
      isListeningRef.current ||
      recognitionStartingRef.current
    ) {
      return;
    }

    try {
      if (window.speechSynthesis) {
        window.speechSynthesis.cancel();
        setIsSpeaking(false);
      }

      recognition.lang =
        getRecognitionLanguage();

      lastFinalTranscriptRef.current = "";

      recognitionStartingRef.current = true;

      recognition.start();
    } catch (error) {
      recognitionStartingRef.current = false;

      console.error(
        "Unable to start speech recognition:",
        error,
      );

      if (
        error?.name ===
        "InvalidStateError"
      ) {
        try {
          recognition.stop();
        } catch (stopError) {
          console.error(stopError);
        }

        isListeningRef.current = false;
        setIsListening(false);
      }
    }
  };

  // =====================================================
  // SCHEDULE VOICE ASSISTANT LISTENING
  // =====================================================

  const scheduleVoiceAssistantListening = (
    delay = 700,
  ) => {
    if (
      recognitionRestartTimerRef.current
    ) {
      clearTimeout(
        recognitionRestartTimerRef.current,
      );
    }

    recognitionRestartTimerRef.current =
      setTimeout(() => {
        recognitionRestartTimerRef.current =
          null;

        if (
          voiceAssistantRef.current &&
          !loading &&
          !uploadingDocument &&
          !generatingSummary
        ) {
          startListening();
        }
      }, delay);
  };

  // =====================================================
  // START VOICE ASSISTANT
  // =====================================================

  const startVoiceAssistant = () => {
    if (!speechSupportedRef.current) {
      alert(
        "Voice assistance is not supported in this browser. Please use Google Chrome or Microsoft Edge.",
      );
      return;
    }

    if (
      loading ||
      uploadingDocument ||
      generatingSummary
    ) {
      return;
    }

    voiceAssistantRef.current = true;

    setVoiceAssistantActive(true);

    stopSpeaking();

    if (
      recognitionRestartTimerRef.current
    ) {
      clearTimeout(
        recognitionRestartTimerRef.current,
      );

      recognitionRestartTimerRef.current =
        null;
    }

    setTimeout(() => {
      if (voiceAssistantRef.current) {
        startListening();
      }
    }, 300);
  };

  // =====================================================
  // STOP VOICE ASSISTANT
  // =====================================================

  const stopVoiceAssistant = () => {
    voiceAssistantRef.current = false;

    setVoiceAssistantActive(false);

    if (
      recognitionRestartTimerRef.current
    ) {
      clearTimeout(
        recognitionRestartTimerRef.current,
      );

      recognitionRestartTimerRef.current =
        null;
    }

    try {
      recognitionRef.current?.stop();
    } catch (error) {
      console.error(
        "Unable to stop Voice Assistant:",
        error,
      );
    }

    recognitionStartingRef.current = false;
    isListeningRef.current = false;

    setIsListening(false);

    stopSpeaking();
  };

  const toggleVoiceAssistant = () => {
    if (voiceAssistantRef.current) {
      stopVoiceAssistant();
    } else {
      startVoiceAssistant();
    }
  };

  // =====================================================
  // NORMAL SPEECH-TO-TEXT
  // =====================================================

  const toggleSpeechRecognition = () => {
    // Normal Voice-to-Text is separate from
    // Voice Assistant.
    voiceAssistantRef.current = false;
    setVoiceAssistantActive(false);

    if (
      recognitionRestartTimerRef.current
    ) {
      clearTimeout(
        recognitionRestartTimerRef.current,
      );

      recognitionRestartTimerRef.current =
        null;
    }

    if (!speechSupportedRef.current) {
      alert(
        "Speech recognition is not supported in this browser. Please use Google Chrome or Microsoft Edge.",
      );

      return;
    }

    if (
      loading ||
      uploadingDocument ||
      generatingSummary
    ) {
      return;
    }

    const recognition =
      recognitionRef.current;

    if (!recognition) {
      return;
    }

    if (isListeningRef.current) {
      try {
        recognition.stop();
      } catch (error) {
        console.error(
          "Unable to stop speech recognition:",
          error,
        );
      }

      isListeningRef.current = false;
      recognitionStartingRef.current =
        false;

      setIsListening(false);

      return;
    }

    try {
      if (window.speechSynthesis) {
        window.speechSynthesis.cancel();
        setIsSpeaking(false);
      }

      recognition.lang =
        getRecognitionLanguage();

      lastFinalTranscriptRef.current = "";

      recognitionStartingRef.current = true;

      recognition.start();
    } catch (error) {
      recognitionStartingRef.current = false;

      console.error(
        "Unable to start speech recognition:",
        error,
      );

      if (
        error?.name ===
        "InvalidStateError"
      ) {
        try {
          recognition.stop();
        } catch (stopError) {
          console.error(stopError);
        }
      }
    }
  };

  // =====================================================
  // TEXT-TO-SPEECH
  // =====================================================

  const cleanTextForSpeech = (text) => {
    return String(text || "")
      .replace(/[*_#`]/g, "")
      .replace(/https?:\/\/\S+/g, "")
      .replace(/\s+/g, " ")
      .trim();
  };

  const selectVoice = (language) => {
    if (
      typeof window === "undefined" ||
      !window.speechSynthesis
    ) {
      return null;
    }

    const voices =
      window.speechSynthesis.getVoices();

    if (!voices.length) {
      return null;
    }

    const exactMatches =
      voices.filter(
        (voice) =>
          voice.lang?.toLowerCase() ===
          language.toLowerCase(),
      );

    if (exactMatches.length > 0) {
      return exactMatches[0];
    }

    const languageCode =
      language
        .split("-")[0]
        .toLowerCase();

    const languageMatches =
      voices.filter((voice) =>
        voice.lang
          ?.toLowerCase()
          .startsWith(languageCode),
      );

    if (languageMatches.length > 0) {
      return languageMatches[0];
    }

    // For languages without a browser voice,
    // use a Hindi fallback for Chhattisgarhi/Hinglish.
    if (
      voiceLanguage === "hne" ||
      voiceLanguage === "hinglish"
    ) {
      const hindiVoice =
        voices.find((voice) =>
          voice.lang
            ?.toLowerCase()
            .startsWith("hi"),
        );

      if (hindiVoice) {
        return hindiVoice;
      }
    }

    return voices[0];
  };

  const speakText = (text) => {
    if (
      !text ||
      typeof window === "undefined" ||
      !window.speechSynthesis
    ) {
      return;
    }

    const cleanText =
      cleanTextForSpeech(text);

    if (!cleanText) {
      return;
    }

    window.speechSynthesis.cancel();

    const language =
      getSpeechLanguage();

    const utterance =
      new SpeechSynthesisUtterance(
        cleanText,
      );

    utterance.lang = language;

    if (
      voiceLanguage === "hi" ||
      voiceLanguage === "hne"
    ) {
      utterance.rate = 0.9;
    } else {
      utterance.rate = 0.95;
    }

    utterance.pitch = 1;
    utterance.volume = 1;

    const voice =
      selectVoice(language);

    if (voice) {
      utterance.voice = voice;
    }

    speechUtteranceRef.current =
      utterance;

    utterance.onstart = () => {
      setIsSpeaking(true);
    };

    utterance.onend = () => {
      setIsSpeaking(false);

      speechUtteranceRef.current =
        null;

      // Continue Voice Assistant after AI
      // finishes speaking.
      if (
        voiceAssistantRef.current
      ) {
        scheduleVoiceAssistantListening(
          700,
        );
      }
    };

    utterance.onerror = (event) => {
      console.error(
        "Text-to-Speech Error:",
        event.error,
      );

      setIsSpeaking(false);

      speechUtteranceRef.current =
        null;

      // If TTS fails but Voice Assistant
      // is active, allow it to continue.
      if (
        voiceAssistantRef.current
      ) {
        scheduleVoiceAssistantListening(
          1000,
        );
      }
    };

    window.speechSynthesis.speak(
      utterance,
    );
  };

  // =====================================================
  // STOP AI SPEECH
  // =====================================================

  const stopSpeaking = () => {
    if (
      typeof window !== "undefined" &&
      window.speechSynthesis
    ) {
      window.speechSynthesis.cancel();
    }

    speechUtteranceRef.current =
      null;

    setIsSpeaking(false);
  };

  // =====================================================
  // LOAD AVAILABLE BROWSER VOICES
  // =====================================================

  useEffect(() => {
    if (
      typeof window === "undefined" ||
      !window.speechSynthesis
    ) {
      return;
    }

    const loadVoices = () => {
      window.speechSynthesis
        .getVoices();
    };

    loadVoices();

    window.speechSynthesis.addEventListener(
      "voiceschanged",
      loadVoices,
    );

    return () => {
      window.speechSynthesis.removeEventListener(
        "voiceschanged",
        loadVoices,
      );
    };
  }, []);

  // =====================================================
  // STOP SPEECH WHEN COMPONENT CLOSES
  // =====================================================

  useEffect(() => {
    return () => {
      voiceAssistantRef.current =
        false;

      if (
        recognitionRestartTimerRef.current
      ) {
        clearTimeout(
          recognitionRestartTimerRef.current,
        );
      }

      try {
        recognitionRef.current?.stop();
      } catch (error) {
        // Recognition may already be stopped.
      }

      if (
        typeof window !== "undefined" &&
        window.speechSynthesis
      ) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  // =====================================================
  // AUTO SCROLL
  // =====================================================

  useEffect(() => {
    if (!autoScroll) {
      return;
    }

    const container =
      chatContainerRef.current;

    if (container) {
      container.scrollTo({
        top: container.scrollHeight,
        behavior: "smooth",
      });
    }
  }, [
    messages,
    loading,
    autoScroll,
  ]);

  // =====================================================
  // GET PATIENT TOKEN
  // =====================================================

  const getToken = () => {
    return (
      localStorage.getItem(
        "ayush_patient_token",
      ) ||
      localStorage.getItem(
        "patientToken",
      ) ||
      localStorage.getItem("token") ||
      localStorage.getItem(
        "patient_token",
      )
    );
  };

  // =====================================================
  // BACK TO PATIENT DASHBOARD
  // =====================================================

  const goToPatientDashboard = () => {
    stopVoiceAssistant();
    navigate("/patient/dashboard");
  };

  // =====================================================
  // LANGUAGE CHANGE
  // =====================================================

  const changeLanguage = (languageCode) => {
    if (
      loading ||
      uploadingDocument ||
      generatingSummary
    ) {
      return;
    }

    stopSpeaking();

    try {
      recognitionRef.current?.stop();
    } catch (error) {
      // Recognition may already be stopped.
    }

    isListeningRef.current = false;
    recognitionStartingRef.current =
      false;

    setIsListening(false);

    setVoiceLanguage(languageCode);

    setShowLanguageMenu(false);
  };

  // =====================================================
  // CHECK SAVED AI DOCUMENT CONSENT
  // =====================================================

  const checkDocumentConsent =
    async () => {
      const token = getToken();

      if (!token) {
        setUploadError(
          "Please login as a patient before uploading a document.",
        );

        return false;
      }

      setCheckingConsent(true);
      setUploadError("");

      try {
        const response = await fetch(
          `${API_BASE_URL}/patient/ai-document-consent`,
          {
            method: "GET",
            headers: {
              Authorization: `Bearer ${token}`,
            },
          },
        );

        const data =
          await response.json();

        if (!response.ok) {
          throw new Error(
            data.message ||
              "Unable to check document consent.",
          );
        }

        const validConsent =
          data.consentAccepted ===
          true;

        setConsentAccepted(
          validConsent,
        );

        return validConsent;
      } catch (error) {
        console.error(
          "Consent Check Error:",
          error,
        );

        setUploadError(
          error.message ||
            "Unable to check consent. Please try again.",
        );

        return false;
      } finally {
        setCheckingConsent(false);
      }
    };

  // =====================================================
  // SAVE AI DOCUMENT CONSENT
  // =====================================================

  const saveDocumentConsent =
    async () => {
      const token = getToken();

      if (!token) {
        setUploadError(
          "Please login as a patient before continuing.",
        );

        return false;
      }

      setSavingConsent(true);
      setUploadError("");

      try {
        const response = await fetch(
          `${API_BASE_URL}/patient/ai-document-consent`,
          {
            method: "POST",

            headers: {
              "Content-Type":
                "application/json",
              Authorization: `Bearer ${token}`,
            },

            body: JSON.stringify({
              accepted: true,
            }),
          },
        );

        const data =
          await response.json();

        if (!response.ok) {
          throw new Error(
            data.message ||
              "Unable to save consent.",
          );
        }

        if (
          data.consentAccepted !==
          true
        ) {
          throw new Error(
            "Consent could not be confirmed.",
          );
        }

        setConsentAccepted(true);
        setShowConsent(false);

        return true;
      } catch (error) {
        console.error(
          "Save Consent Error:",
          error,
        );

        setUploadError(
          error.message ||
            "Unable to save consent. Please try again.",
        );

        return false;
      } finally {
        setSavingConsent(false);
      }
    };

  // =====================================================
  // SEND MESSAGE
  // =====================================================

  const sendMessage = async (
    messageOverride = null,
  ) => {
    const userMessage =
      typeof messageOverride ===
      "string"
        ? messageOverride.trim()
        : input.trim();

    if (!userMessage || loading) {
      return;
    }

    // Stop listening when sending.
    if (isListeningRef.current) {
      try {
        recognitionRef.current?.stop();
      } catch (error) {
        console.error(
          "Speech stop error:",
          error,
        );
      }

      isListeningRef.current = false;
      recognitionStartingRef.current =
        false;

      setIsListening(false);
    }

    const updatedMessages = [
      ...messages,
      {
        text: userMessage,
        sender: "user",
      },
    ];

    setMessages(updatedMessages);
    setInput("");
    setLoading(true);

    try {
      const token = getToken();

      if (!token) {
        setMessages((prev) => [
          ...prev,
          {
            text:
              "Please login as a patient before using the AI healthcare assistant.",
            sender: "bot",
          },
        ]);

        return;
      }

      const conversation =
        updatedMessages.map(
          (message) => ({
            sender: message.sender,
            text: message.text,
          }),
        );

      const response = await fetch(
        `${API_BASE_URL}/chatbot`,
        {
          method: "POST",

          headers: {
            "Content-Type":
              "application/json",
            Authorization: `Bearer ${token}`,
          },

          body: JSON.stringify({
            message: userMessage,

            mode,

            // IMPORTANT:
            // Send selected language to backend.
            language: voiceLanguage,

            conversation,
          }),
        },
      );

      const data =
        await response.json();

      if (!response.ok) {
        throw new Error(
          data.message ||
            data.reply ||
            "Chatbot request failed.",
        );
      }

      const botReply =
        data.reply ||
        "Sorry, mujhe response nahi mila.";

      const botOptions =
        Array.isArray(data.options)
          ? data.options
              .filter(
                (option) =>
                  typeof option ===
                    "string" &&
                  option.trim(),
              )
              .map((option) =>
                option.trim(),
              )
              .slice(0, 8)
          : [];

      const questionType =
        data.questionType ===
        "multiple"
          ? "multiple"
          : "single";

      if (data.redFlagDetected) {
        setRedFlagAlert({
          level: data.redFlagLevel || "Moderate",
          reasons: Array.isArray(data.redFlagReasons)
            ? data.redFlagReasons
            : [],
          message: botReply,
        });
      } else {
        setRedFlagAlert(null);
      }

      setMessages((prev) => [
        ...prev,
        {
          text: botReply,
          sender: "bot",
          options: botOptions,
          questionType,
        },
      ]);

      // Only Voice Assistant speaks automatically.
      if (
        voiceAssistantRef.current
      ) {
        speakText(botReply);
      }
    } catch (error) {
      console.error(
        "Chatbot Error:",
        error,
      );

      const errorMessage =
        error.message ||
        "Server se connection nahi ho pa raha. Please try again.";

      setMessages((prev) => [
        ...prev,
        {
          text: errorMessage,
          sender: "bot",
        },
      ]);

      // If voice assistant is active,
      // give it a chance to listen again.
      if (
        voiceAssistantRef.current
      ) {
        scheduleVoiceAssistantListening(
          1200,
        );
      }
    } finally {
      setLoading(false);
    }
  };

  // Keep latest sendMessage available
  // to Speech Recognition.
  sendMessageRef.current =
    sendMessage;

  // =====================================================
  // QUICK MESSAGE
  // =====================================================

  const quickMessage = (text) => {
    setInput(text);
  };

  // =====================================================
  // CLICKABLE AI OPTION
  // =====================================================

  const handleOptionClick = (
    messageIndex,
    option,
  ) => {
    if (loading || !option) {
      return;
    }

    setMessages((prev) =>
      prev.map(
        (message, index) =>
          index === messageIndex
            ? {
                ...message,
                optionsDisabled: true,
              }
            : message,
      ),
    );

    sendMessage(option);
  };

  // =====================================================
  // MODE CHANGE
  // =====================================================

  const changeMode = (newMode) => {
    if (
      loading ||
      uploadingDocument ||
      generatingSummary
    ) {
      return;
    }

    stopVoiceAssistant();

    setMode(newMode);

    setCaseSummary("");
    setTokenCaseId("");
    setSummaryGeneratedAt(null);
    setSummaryStatus(
      "Not Generated",
    );
    setSummaryApproved(false);
    setSummaryError("");

    const modeName =
      newMode === "ayurveda"
        ? "Ayurveda"
        : "Allopathy";

    setMessages((prev) => [
      ...prev,
      {
        text: `You are now using ${modeName} mode.`,
        sender: "bot",
      },
    ]);
  };

  // =====================================================
  // OPEN FILE SELECTOR
  // =====================================================

  const openFileSelector =
    async () => {
      if (
        uploadingDocument ||
        checkingConsent ||
        generatingSummary
      ) {
        return;
      }

      setUploadError("");

      const validConsent =
        await checkDocumentConsent();

      if (!validConsent) {
        setShowConsent(true);
        return;
      }

      fileInputRef.current?.click();
    };

  // =====================================================
  // CONSENT CONTINUE
  // =====================================================

  const handleConsentContinue =
    async () => {
      if (!consentAccepted) {
        setUploadError(
          "Please agree to the consent before uploading a medical document.",
        );

        return;
      }

      const saved =
        await saveDocumentConsent();

      if (!saved) {
        return;
      }

      setTimeout(() => {
        fileInputRef.current?.click();
      }, 0);
    };

  // =====================================================
  // FILE SELECTED
  // =====================================================

  const handleFileChange =
    async (event) => {
      const file =
        event.target.files?.[0];

      if (!file) {
        return;
      }

      setUploadError("");
      setOcrText("");
      setSelectedFile(file);

      await uploadDocument(file);

      event.target.value = "";
    };

  // =====================================================
  // UPLOAD DOCUMENT + OCR
  // =====================================================

  const uploadDocument = async (
    file,
  ) => {
    const validConsent =
      await checkDocumentConsent();

    if (!validConsent) {
      setShowConsent(true);

      setUploadError(
        "Please agree to the consent before processing the document.",
      );

      return;
    }

    const token = getToken();

    if (!token) {
      setUploadError(
        "Please login as a patient before uploading a document.",
      );

      return;
    }

    setUploadingDocument(true);
    setUploadError("");
    setOcrText("");

    try {
      const formData =
        new FormData();

      formData.append(
        "document",
        file,
      );

      formData.append(
        "name",
        file.name,
      );

      formData.append(
        "type",
        "AI Chatbot Medical Document",
      );

      formData.append(
        "consentAccepted",
        "true",
      );

      const response = await fetch(
        `${API_BASE_URL}/chatbot/upload`,
        {
          method: "POST",

          headers: {
            Authorization: `Bearer ${token}`,
          },

          body: formData,
        },
      );

      const data =
        await response.json();

      if (
        response.status === 400 &&
        data.consentRequired
      ) {
        setConsentAccepted(false);
        setShowConsent(true);

        throw new Error(
          "Your document-processing consent is required before uploading this document.",
        );
      }

      if (!response.ok) {
        throw new Error(
          data.message ||
            "Document upload failed.",
        );
      }

      const documentData = {
        id: data.document?.id,
        name:
          data.document?.name ||
          file.name,
        type:
          data.document?.type ||
          "Medical Document",
        ocrStatus:
          data.document?.ocrStatus ||
          "Completed",
        extractedText:
          data.extractedText || "",
      };

      setUploadedDocuments(
        (prev) => [
          ...prev,
          documentData,
        ],
      );

      setOcrText(
        data.extractedText || "",
      );

      setCaseSummary("");
      setTokenCaseId("");
      setSummaryGeneratedAt(null);
      setSummaryStatus(
        "Not Generated",
      );
      setSummaryApproved(false);
      setSummaryError("");

      setMessages((prev) => [
        ...prev,
        {
          text: data.extractedText
            ? `📄 ${file.name} uploaded successfully. I have extracted the readable text from the document.`
            : `📄 ${file.name} was uploaded, but no readable text was detected.`,
          sender: "bot",
        },
      ]);
    } catch (error) {
      console.error(
        "Document Upload Error:",
        error,
      );

      setUploadError(
        error.message ||
          "Unable to upload and process the document.",
      );
    } finally {
      setUploadingDocument(false);
      setSelectedFile(null);
    }
  };

  // =====================================================
  // REMOVE DOCUMENT
  // =====================================================

  const removeDocument = (
    documentId,
  ) => {
    setUploadedDocuments((prev) =>
      prev.filter(
        (document) =>
          document.id !==
          documentId,
      ),
    );

    setCaseSummary("");
    setTokenCaseId("");
    setSummaryGeneratedAt(null);
    setSummaryStatus(
      "Not Generated",
    );
    setSummaryApproved(false);
    setSummaryError("");

    if (
      uploadedDocuments.length ===
      1
    ) {
      setOcrText("");
    }
  };

  // =====================================================
  // GENERATE CASE SUMMARY
  // =====================================================

  const extractSymptomsFromMessages =
    (chatMessages) => {
      if (!Array.isArray(chatMessages)) {
        return "";
      }

      return chatMessages
        .filter(
          (message) =>
            message &&
            message.sender ===
              "user" &&
            typeof message.text ===
              "string" &&
            message.text.trim(),
        )
        .map((message) =>
          message.text.trim(),
        )
        .join("\n");
    };

  const getUserMessageCount = () => {
    return messages.filter(
      (message) =>
        message &&
        message.sender === "user" &&
        typeof message.text ===
          "string" &&
        message.text.trim(),
    ).length;
  };

  const generateCaseSummary =
    async () => {
      if (
        generatingSummary ||
        loading ||
        uploadingDocument
      ) {
        return;
      }

      const token = getToken();

      if (!token) {
        setSummaryError(
          "Please login as a patient before generating your case summary.",
        );

        return;
      }

      const userMessageCount =
        getUserMessageCount();

      if (userMessageCount < 8) {
        setSummaryError(
          "Please continue the chat until you have at least 8 patient messages before generating the summary.",
        );

        return;
      }

      setGeneratingSummary(true);
      setSummaryError("");
      setSummaryApproved(false);
      setSummaryStatus(
        "Generating...",
      );

      try {
        const conversation =
          messages.map(
            (message) => ({
              sender:
                message.sender,
              text: message.text,
            }),
          );

        const extractedSymptoms =
          extractSymptomsFromMessages(
            messages,
          );

        const response = await fetch(
          `${API_BASE_URL}/chatbot/case-summary`,
          {
            method: "POST",

            headers: {
              "Content-Type":
                "application/json",
              Authorization: `Bearer ${token}`,
            },

            body: JSON.stringify({
              mode,
              conversation,
              reports: [],
              symptoms:
                extractedSymptoms,

              // Also send selected language
              // so the backend knows the patient's
              // conversation language.
              language:
                voiceLanguage,
            }),
          },
        );

        const data =
          await response.json();

        if (!response.ok) {
          throw new Error(
            data.message ||
              "Failed to generate case summary.",
          );
        }

        if (!data.summary) {
          throw new Error(
            "The AI did not return a case summary.",
          );
        }

        setCaseSummary(
          data.summary,
        );

        setTokenCaseId(
          data.tokenCaseId || "",
        );

        setSummaryGeneratedAt(
          data.generatedAt ||
            new Date().toISOString(),
        );

        setSummaryStatus(
          "Pending Patient Review",
        );

        setSummaryApproved(false);

        setMessages((prev) => [
          ...prev,
          {
            text:
              "📋 Your AI case summary has been generated. Please review it carefully before approving it for doctor sharing.",
            sender: "bot",
          },
        ]);
      } catch (error) {
        console.error(
          "Case Summary Error:",
          error,
        );

        setSummaryStatus(
          "Not Generated",
        );

        setSummaryError(
          error.message ||
            "Unable to generate the case summary.",
        );
      } finally {
        setGeneratingSummary(false);
      }
    };

  // =====================================================
  // APPROVE SUMMARY
  // =====================================================

  const approveCaseSummary =
    async () => {
      if (!caseSummary) {
        return;
      }

      if (!tokenCaseId) {
        setSummaryError(
          "Summary is not ready to be sent yet. Please generate the summary again.",
        );

        return;
      }

      const token = getToken();

      if (!token) {
        setSummaryError(
          "Please login as a patient before sending your case summary.",
        );

        return;
      }

      const consentConfirmed =
        window.confirm(
          "Do you consent to share this AI-generated summary with your designated doctor?",
        );

      if (!consentConfirmed) {
        setSummaryError(
          "Please confirm your consent before sending the summary to the doctor.",
        );

        return;
      }

      setSendingSummary(true);
      setSummaryError("");

      try {
        const response =
          await fetch(
            `${API_BASE_URL}/patient/ai-summary/${tokenCaseId}/approve`,
            {
              method: "POST",

              headers: {
                "Content-Type":
                  "application/json",
                Authorization: `Bearer ${token}`,
              },

              body: JSON.stringify({
                consent: true,
              }),
            },
          );

        const data =
          await response.json();

        if (!response.ok) {
          throw new Error(
            data.message ||
              "Unable to send the case summary.",
          );
        }

        setSummaryApproved(true);

        setSummaryStatus(
          "Approved by Patient",
        );

        setMessages((prev) => [
          ...prev,
          {
            text:
              "✅ You approved and sent the case summary for the doctor-sharing workflow.",
            sender: "bot",
          },
        ]);
      } catch (error) {
        console.error(
          "Approve Case Summary Error:",
          error,
        );

        setSummaryError(
          error.message ||
            "Unable to send the case summary.",
        );
      } finally {
        setSendingSummary(false);
      }
    };

  // =====================================================
  // TOOLTIP ICON BUTTON
  // =====================================================

  const IconButton = ({
    title,
    onClick,
    disabled = false,
    children,
    className = "",
  }) => {
    return (
      <button
        type="button"
        title={title}
        aria-label={title}
        onClick={onClick}
        disabled={disabled}
        className={`group relative flex h-11 w-11 shrink-0 items-center justify-center rounded-full transition ${className}`}
      >
        {children}

        <span
          className="
            pointer-events-none
            absolute
            bottom-full
            left-1/2
            z-50
            mb-2
            -translate-x-1/2
            translate-y-1
            whitespace-nowrap
            rounded-lg
            bg-slate-800
            px-3
            py-1.5
            text-xs
            font-medium
            text-white
            opacity-0
            shadow-lg
            transition-all
            duration-150
            group-hover:translate-y-0
            group-hover:opacity-100
          "
        >
          {title}

          <span
            className="
              absolute
              left-1/2
              top-full
              -translate-x-1/2
              border-l-4
              border-r-4
              border-t-4
              border-l-transparent
              border-r-transparent
              border-t-slate-800
            "
          />
        </span>
      </button>
    );
  };

  // =====================================================
  // UI
  // =====================================================

  return (
    <div className="flex h-screen w-full flex-col overflow-hidden bg-[radial-gradient(circle_at_top_left,_#ecfdf5,_transparent_38%),radial-gradient(circle_at_bottom_right,_#eff6ff,_transparent_32%)] bg-slate-50">

      {/* =================================================
          HEADER
      ================================================= */}

      <div className="relative shrink-0 overflow-visible border-b border-emerald-900/10 bg-gradient-to-br from-emerald-800 via-emerald-700 to-teal-600 px-4 py-3 text-white shadow-lg shadow-emerald-900/10 sm:px-5 sm:py-4">

        <div className="flex items-center justify-between gap-3">

          {/* BACK BUTTON */}

          <button
            type="button"
            onClick={
              goToPatientDashboard
            }
            className="flex items-center gap-2 rounded-xl border border-white/20 bg-white/10 px-3 py-2 text-sm font-medium text-white/95 transition hover:bg-white/20"
          >
            <ArrowLeft className="h-4 w-4" />

            <span className="hidden sm:inline">
              Back
            </span>

            <span className="sm:hidden">
              Back
            </span>
          </button>

          {/* TITLE */}

          <div className="flex min-w-0 flex-1 m-r-2 border-emerald-800 pr-2 items-center justify-center gap-2 sm:gap-3">

            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white/15 text-xl shadow-lg ring-1 ring-white/30 backdrop-blur-md sm:h-12 sm:w-12 sm:rounded-2xl sm:text-2xl">
              🤖
            </div>

            <div className="min-w-0">

              <h2 className="truncate text-base font-black tracking-tight sm:text-2xl">
                SwasthyaCare AI
              </h2>

              <p className="mt-0.5 flex items-center gap-1.5 text-[11px] text-emerald-50 sm:text-sm">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-200 ring-2 ring-emerald-100 sm:h-2 sm:w-2" />

                Online • Healthcare Assistant
              </p>

            </div>

          </div>

          {/* LANGUAGE / MORE */}

          <div className="relative shrink-0">

            <button
              type="button"
              onClick={() =>
                setShowLanguageMenu(
                  (prev) => !prev,
                )
              }
              className="flex h-10 w-10 items-center justify-center rounded-xl border border-white/20 bg-white/10 text-xl text-white/95 transition hover:bg-white/20"
              title="Language and voice settings"
              aria-label="Language and voice settings"
            >
              ⋮
            </button>

            {showLanguageMenu && (
              <div className="absolute right-0 top-12 z-[100] w-72 overflow-hidden rounded-2xl border border-slate-200 bg-white text-slate-800 shadow-2xl">

                <div className="border-b border-slate-100 bg-slate-50 px-4 py-3">

                  <div className="flex items-center gap-2">

                    <Globe className="h-4 w-4 text-emerald-600" />

                    <div>
                      <p className="text-sm font-bold text-slate-800">
                        Language & Voice
                      </p>

                      <p className="text-[11px] text-slate-500">
                        {getLanguageDisplayName()}
                      </p>
                    </div>

                  </div>

                </div>

                <div className="max-h-80 overflow-y-auto p-2">

                  {LANGUAGE_OPTIONS.map(
                    (language) => (
                      <button
                        key={
                          language.code
                        }
                        type="button"
                        onClick={() =>
                          changeLanguage(
                            language.code,
                          )
                        }
                        className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm transition ${
                          voiceLanguage ===
                          language.code
                            ? "bg-emerald-50 font-bold text-emerald-700 ring-1 ring-emerald-200"
                            : "text-slate-700 hover:bg-slate-50"
                        }`}
                      >
                        <span className="w-7 text-center">
                          {
                            language.flag
                          }
                        </span>

                        <span className="flex-1">
                          {
                            language.label
                          }
                        </span>

                        {voiceLanguage ===
                          language.code && (
                          <CheckCircle className="h-4 w-4 text-emerald-600" />
                        )}
                      </button>
                    ),
                  )}

                </div>

                <div className="border-t border-slate-100 bg-amber-50 px-4 py-2.5">

                  <p className="text-[10px] leading-4 text-amber-700">
                    🎙️ Speech recognition and
                    voice availability depends
                    on your browser. Chhattisgarhi
                    uses Hindi speech recognition
                    as a fallback.
                  </p>

                </div>

              </div>
            )}

          </div>

        </div>

        {/* =================================================
            MODE SELECTOR
        ================================================= */}

        <div className="mt-3 flex flex-wrap items-center justify-between gap-2">

          <div className="flex flex-wrap gap-2">

            <button
              type="button"
              onClick={() =>
                changeMode(
                  "ayurveda",
                )
              }
              disabled={
                loading ||
                uploadingDocument ||
                generatingSummary
              }
              className={`rounded-full px-4 py-2 text-sm font-semibold transition ${
                mode === "ayurveda"
                  ? "bg-white text-emerald-700 shadow-sm ring-2 ring-white/70"
                  : "bg-emerald-500/60 text-white hover:bg-emerald-400/80"
              }`}
            >
              🌿 Ayurveda
            </button>

            <button
              type="button"
              onClick={() =>
                changeMode(
                  "allopathy",
                )
              }
              disabled={
                loading ||
                uploadingDocument ||
                generatingSummary
              }
              className={`rounded-full px-4 py-2 text-sm font-semibold transition ${
                mode === "allopathy"
                  ? "bg-white text-emerald-700 shadow-sm ring-2 ring-white/70"
                  : "bg-emerald-500/60 text-white hover:bg-emerald-400/80"
              }`}
            >
              🩺 Allopathy
            </button>

          </div>

          {/* CURRENT LANGUAGE */}

          <button
            type="button"
            onClick={() =>
              setShowLanguageMenu(
                true,
              )
            }
            className="flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3 py-2 text-xs font-semibold text-white transition hover:bg-white/20"
          >
            <Globe className="h-3.5 w-3.5" />

            <span>
              {getLanguageShortName()}
            </span>
          </button>

        </div>

      </div>

      {/* =================================================
          MODE INFORMATION
      ================================================= */}

      <div className="shrink-0 border-b border-emerald-100 bg-white/90 px-5 py-2 backdrop-blur-sm">

        <div className="flex items-center justify-between gap-3">

          <p className="text-xs font-medium uppercase tracking-[0.18em] text-slate-500">
            Current mode
          </p>

          <div className="flex items-center gap-2">

            <span className="inline-flex items-center gap-2 rounded-full bg-blue-50 px-3 py-1 text-xs font-bold text-blue-700 ring-1 ring-blue-100">
              <Globe className="h-3 w-3" />

              {getLanguageDisplayName()}
            </span>

            <span className="inline-flex items-center gap-2 rounded-full bg-emerald-50 px-3 py-1 text-xs font-bold text-emerald-700 ring-1 ring-emerald-100">
              {mode === "ayurveda"
                ? "🌿 Ayurveda"
                : "🩺 Allopathy"}
            </span>

          </div>

        </div>

      </div>

      {/* =================================================
          LARGE CHAT AREA
      ================================================= */}

      {redFlagAlert && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/45 p-4">
          <div className="w-full max-w-xl rounded-2xl border border-red-200 bg-white p-5 shadow-2xl">
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-start gap-3">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-red-100">
                  <AlertCircle className="h-5 w-5 text-red-600" />
                </div>

                <div>
                  <p className="text-xs font-bold uppercase tracking-[0.18em] text-red-600">
                    Red Flag Alert
                  </p>

                  <h3 className="mt-1 text-lg font-bold text-slate-800">
                    {redFlagAlert.level} concern detected
                  </h3>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setRedFlagAlert(null)}
                className="rounded-full border border-slate-200 bg-slate-50 p-2 text-slate-500 transition hover:bg-slate-100"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="mt-4 rounded-xl border border-red-100 bg-red-50 p-4">
              <p className="text-sm leading-6 text-red-700">
                {redFlagAlert.message}
              </p>
            </div>

            {redFlagAlert.reasons.length > 0 && (
              <div className="mt-4">
                <p className="text-xs font-bold uppercase tracking-[0.12em] text-slate-500">
                  Reasons
                </p>

                <ul className="mt-2 space-y-2 text-sm text-slate-700">
                  {redFlagAlert.reasons.map((reason, index) => (
                    <li key={`${reason}-${index}`} className="flex items-start gap-2">
                      <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-red-500" />
                      <span>{reason}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            <div className="mt-5 flex justify-end">
              <button
                type="button"
                onClick={() => setRedFlagAlert(null)}
                className="rounded-xl bg-red-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-red-700"
              >
                Dismiss
              </button>
            </div>
          </div>
        </div>
      )}

      <div
        ref={
          chatContainerRef
        }
        className="min-h-0 flex-1 overflow-y-auto bg-white/35 px-4 py-5 sm:px-7 sm:py-6"
      >

        <div className="space-y-4">

          {messages.map(
            (message, index) => (

              <div
                key={index}
                className={`flex items-end gap-2 ${
                  message.sender ===
                  "user"
                    ? "justify-end"
                    : "justify-start"
                }`}
              >

                <div className="max-w-[88%] sm:max-w-[78%]">

                  <div
                    className={`rounded-2xl px-4 py-3.5 text-[14px] leading-6 shadow-sm transition-all sm:px-5 ${
                      message.sender ===
                      "user"
                        ? "rounded-br-md bg-gradient-to-br from-emerald-600 to-teal-600 text-white shadow-emerald-600/20"
                        : "rounded-bl-md border border-slate-200/80 bg-white/95 text-slate-700 shadow-slate-200/70 backdrop-blur-sm"
                    }`}
                  >
                    {message.text}
                  </div>

                  {/* DYNAMIC AI OPTIONS */}

                  {message.sender ===
                    "bot" &&
                    index > 0 &&
                    messages
                      .slice(0, index)
                      .some(
                        (
                          previousMessage,
                        ) =>
                          previousMessage.sender ===
                          "user",
                      ) &&
                    Array.isArray(
                      message.options,
                    ) &&
                    message.options
                      .length > 0 && (

                      <div className="mt-3 grid grid-cols-1 gap-2.5 sm:grid-cols-2">

                        {message.options.map(
                          (
                            option,
                            optionIndex,
                          ) => (

                            <button
                              key={`${index}-${optionIndex}-${option}`}
                              type="button"
                              onClick={() =>
                                handleOptionClick(
                                  index,
                                  option,
                                )
                              }
                              disabled={
                                loading ||
                                message.optionsDisabled
                              }
                              className={`rounded-xl border px-4 py-3 text-left text-sm font-medium shadow-sm transition active:scale-[0.98] ${
                                message.optionsDisabled
                                  ? "cursor-not-allowed border-slate-200 bg-slate-50 text-slate-400"
                                  : "border-emerald-200/80 bg-white/95 text-slate-700 hover:-translate-y-0.5 hover:border-emerald-400 hover:bg-emerald-50 hover:shadow-md"
                              } disabled:opacity-70`}
                            >

                              <span className="mr-2 inline-flex h-6 w-6 items-center justify-center rounded-lg bg-emerald-50 text-[11px] font-extrabold text-emerald-700 ring-1 ring-emerald-100">
                                {String.fromCharCode(
                                  65 +
                                    optionIndex,
                                )}
                              </span>

                              {option}

                            </button>

                          ),
                        )}

                      </div>
                    )}

                </div>

                {/* AI RESPONSE SPEAKER */}

                {message.sender ===
                  "bot" && (

                  <button
                    type="button"
                    title={
                      isSpeaking
                        ? "Stop Speaking"
                        : `Listen in ${getLanguageDisplayName()}`
                    }
                    aria-label={
                      isSpeaking
                        ? "Stop Speaking"
                        : `Listen in ${getLanguageDisplayName()}`
                    }
                    onClick={() => {
                      if (isSpeaking) {
                        stopSpeaking();
                      } else {
                        speakText(
                          message.text,
                        );
                      }
                    }}
                    className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-emerald-200 bg-white text-emerald-600 transition hover:bg-emerald-50"
                  >
                    {isSpeaking ? (
                      <MicOff className="h-4 w-4" />
                    ) : (
                      <Volume2 className="h-4 w-4" />
                    )}
                  </button>
                )}

              </div>

            ),
          )}

          {loading && (

            <div className="flex justify-start">

              <div className="rounded-2xl rounded-bl-md border border-slate-200 bg-white/95 px-5 py-3.5 text-sm text-slate-500 shadow-sm">
                SwasthyaCare AI is typing... 🤖
              </div>

            </div>

          )}

        </div>

      </div>

      {/* =================================================
          GENERATED CASE SUMMARY
      ================================================= */}

      {caseSummary && (

  <div className="max-h-[45vh] shrink-0 overflow-y-auto border-t bg-white px-5 py-3">

          <div className="rounded-xl border border-emerald-100 bg-emerald-50 p-4">

            <div className="flex items-start justify-between gap-3">

              <div className="flex items-start gap-3">

                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-emerald-100">

                  <FileText className="h-5 w-5 text-emerald-700" />

                </div>

                <div>

                  <h3 className="text-sm font-bold text-emerald-800">
                    AI Case Summary
                  </h3>

                  <p className="mt-1 text-xs leading-5 text-emerald-700">
                    Your conversation and consented medical documents have been combined into this summary for your review.
                  </p>

                </div>

              </div>

              <div className="flex items-center gap-2">

                <span
                  className={`whitespace-nowrap rounded-full px-3 py-1 text-xs font-semibold ${
                    summaryStatus ===
                    "Approved by Patient"
                      ? "bg-emerald-600 text-white"
                      : "bg-amber-100 text-amber-700"
                  }`}
                >
                  {summaryStatus}
                </span>

                <button
                  type="button"
                  onClick={() => {
                    setCaseSummary(
                      "",
                    );
                    setSummaryGeneratedAt(
                      null,
                    );
                    setSummaryStatus(
                      "Not Generated",
                    );
                    setSummaryApproved(
                      false,
                    );
                    setSummaryError(
                      "",
                    );
                    setTokenCaseId(
                      "",
                    );
                  }}
                  className="flex items-center gap-1 rounded-full border border-slate-300 bg-white px-2.5 py-1.5 text-[11px] font-medium text-slate-600 transition hover:bg-slate-50"
                >
                  <X className="h-3.5 w-3.5" />
                  Close
                </button>

              </div>

            </div>

            {summaryError && (

              <div className="mt-3 flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 p-3">

                <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-red-600" />

                <p className="text-xs text-red-700">
                  {summaryError}
                </p>

              </div>

            )}

            <div className="mt-4 rounded-lg border border-white bg-white p-4">

              <div className="mb-3 flex items-center gap-2">

                <ShieldCheck className="h-5 w-5 text-emerald-600" />

                <div>

                  <h4 className="text-sm font-bold text-slate-800">
                    Review Your Summary
                  </h4>

                  <p className="text-xs text-slate-500">
                    Generated in{" "}
                    {mode ===
                    "ayurveda"
                      ? "Ayurveda"
                      : "Allopathy"}{" "}
                    mode •{" "}
                    {getLanguageDisplayName()}
                  </p>

                </div>

              </div>

              <div className="max-h-72 overflow-y-auto whitespace-pre-wrap rounded-lg bg-slate-50 p-4 text-sm leading-6 text-slate-700">
                {caseSummary}
              </div>

            </div>

            {summaryGeneratedAt && (

              <p className="mb-3 mt-3 text-xs text-slate-400">
                Generated:{" "}
                {new Date(
                  summaryGeneratedAt,
                ).toLocaleString()}
              </p>

            )}

            <button
              type="button"
              onClick={
                goToPatientDashboard
              }
              className="mt-3 flex w-full items-center justify-center gap-2 rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
            >
              <ArrowLeft className="h-4 w-4" />
              Exit AI Chatbot
            </button>

            {!summaryApproved ? (

              <div className="rounded-lg border border-amber-200 bg-amber-50 p-3">

                <p className="text-xs leading-5 text-amber-800">
                  Please review the summary carefully. It is AI-generated and should be corrected if any information is inaccurate or missing.
                </p>

                <button
                  type="button"
                  onClick={
                    approveCaseSummary
                  }
                  disabled={
                    sendingSummary
                  }
                  className="mt-3 flex w-full items-center justify-center gap-2 rounded-lg bg-emerald-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:bg-emerald-400"
                >
                  {sendingSummary ? (
                    <>
                      <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                      Sending Summary...
                    </>
                  ) : (
                    <>
                      <CheckCircle className="h-4 w-4" />
                      Send Summary to Doctor
                    </>
                  )}
                </button>

              </div>

            ) : (

              <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-3">

                <div className="flex items-center gap-2">

                  <CheckCircle className="h-5 w-5 text-emerald-600" />

                  <div>

                    <p className="text-sm font-bold text-emerald-800">
                      Summary Approved
                    </p>

                    <p className="mt-1 text-xs text-emerald-700">
                      Your case summary has been approved and sent for the doctor-sharing workflow.
                    </p>

                  </div>

                </div>

              </div>

            )}

          </div>

        </div>

      )}

      {/* =================================================
          DOCUMENT / CONSENT AREA
      ================================================= */}

      <div className="shrink-0 border-t bg-white px-5">

        <input
          ref={fileInputRef}
          type="file"
          accept=".pdf,.jpg,.jpeg,.png,application/pdf,image/jpeg,image/png"
          onChange={
            handleFileChange
          }
          className="hidden"
        />

        {/* CONSENT */}

        {showConsent &&
          !consentAccepted && (

            <div className="mb-3 mt-3 rounded-xl border border-emerald-100 bg-emerald-50 p-4">

              <div className="mb-3">

                <h3 className="text-sm font-semibold text-emerald-700">
                  Medical Document Consent
                </h3>

                <p className="mt-1 text-xs text-gray-500">
                  Please review and agree before uploading your medical document.
                </p>

              </div>

              <div className="mb-4 text-sm leading-6 text-gray-700">

                <p>
                  I consent to SwasthyaCare collecting and processing my health information and uploaded medical documents to prepare my case summary.
                </p>

                <p className="mt-2">
                  I consent to sharing the approved summary with my designated doctor through applicable ABDM consent mechanisms.
                </p>

              </div>

              <label className="flex cursor-pointer items-center gap-2 text-sm font-medium text-gray-700">

                <input
                  type="checkbox"
                  checked={
                    consentAccepted
                  }
                  onChange={async (
                    e,
                  ) => {
                    const checked =
                      e.target
                        .checked;

                    setConsentAccepted(
                      checked,
                    );

                    setUploadError(
                      "",
                    );

                    if (checked) {
                      const saved =
                        await saveDocumentConsent();

                      if (saved) {
                        setTimeout(
                          () => {
                            fileInputRef.current?.click();
                          },
                          0,
                        );
                      }
                    }
                  }}
                  className="h-4 w-4 accent-emerald-600"
                />

                <span>
                  ☐ I Agree & Continue
                </span>

              </label>

              {consentAccepted && (

                <button
                  type="button"
                  onClick={
                    handleConsentContinue
                  }
                  disabled={
                    savingConsent
                  }
                  className="mt-3 rounded-full bg-emerald-600 px-5 py-2.5 text-sm font-medium text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:bg-gray-400"
                >
                  {savingConsent
                    ? "Saving Consent..."
                    : "Continue & Upload"}
                </button>

              )}

            </div>

          )}

        {/* UPLOAD STATUS */}

        {(uploadingDocument ||
          selectedFile) && (

          <div className="flex items-center gap-2 py-2 text-sm text-gray-500">

            {uploadingDocument ? (
              <>
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-emerald-600 border-t-transparent" />

                Reading document and extracting text...
              </>
            ) : (
              <>
                <FileText className="h-4 w-4" />

                {selectedFile?.name}
              </>
            )}

          </div>

        )}

        {/* UPLOADED DOCUMENTS */}

        {uploadedDocuments.length >
          0 && (

          <div className="flex flex-wrap gap-2 py-2">

            {uploadedDocuments.map(
              (document) => (

                <div
                  key={
                    document.id
                  }
                  className="flex items-center gap-2 rounded-lg bg-emerald-50 px-3 py-2 text-xs text-emerald-700"
                >

                  <FileText className="h-4 w-4" />

                  <span>
                    {
                      document.name
                    }
                  </span>

                  <span className="font-semibold">
                    ✓ OCR
                  </span>

                  <button
                    type="button"
                    title="Remove Document"
                    aria-label="Remove Document"
                    onClick={() =>
                      removeDocument(
                        document.id,
                      )
                    }
                    className="ml-1 text-red-500 transition hover:text-red-700"
                  >
                    <X className="h-4 w-4" />
                  </button>

                </div>

              ),
            )}

          </div>

        )}

        {/* OCR PREVIEW */}

        {ocrText && (

          <details className="pb-2">

            <summary className="cursor-pointer text-xs font-medium text-emerald-700">
              View extracted document text
            </summary>

            <div className="mt-2 max-h-32 overflow-y-auto rounded-lg bg-gray-50 p-3 text-xs leading-5 text-gray-600">
              {ocrText}
            </div>

          </details>

        )}

        {/* UPLOAD ERROR */}

        {uploadError && (

          <p className="pb-2 text-sm text-red-600">
            {uploadError}
          </p>

        )}

      </div>

      {/* =================================================
          QUICK OPTIONS
      ================================================= */}

      <div className="shrink-0 border-t border-emerald-100 bg-white/90 px-5 py-2.5 backdrop-blur-sm">

        <div className="mb-2 flex items-center justify-between gap-3">

          <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-slate-500">
            Quick actions
          </p>

          <button
            type="button"
            aria-label={
              autoScroll
                ? "Turn auto-scroll off"
                : "Turn auto-scroll on"
            }
            title={
              autoScroll
                ? "Turn auto-scroll off"
                : "Turn auto-scroll on"
            }
            onClick={() =>
              setAutoScroll(
                (prev) => !prev,
              )
            }
            className={`rounded-full px-2.5 py-1.5 text-[10px] font-bold transition ${
              autoScroll
                ? "bg-emerald-100 text-emerald-700 ring-1 ring-emerald-200"
                : "bg-slate-100 text-slate-600 ring-1 ring-slate-200"
            }`}
          >
            ↕
          </button>

        </div>

        <div className="flex flex-wrap gap-2">

          <button
            type="button"
            onClick={() =>
              quickMessage(
                "I have a health concern",
              )
            }
            className="rounded-full border border-emerald-200 bg-emerald-50 px-3.5 py-2 text-sm font-medium text-emerald-700 transition hover:border-emerald-300 hover:bg-emerald-100"
          >
            🩺 Health Concern
          </button>

          <button
            type="button"
            onClick={() =>
              quickMessage(
                "Tell me about Ayurveda",
              )
            }
            className="rounded-full border border-emerald-200 bg-emerald-50 px-3.5 py-2 text-sm font-medium text-emerald-700 transition hover:border-emerald-300 hover:bg-emerald-100"
          >
            🌿 Ayurveda
          </button>

          <button
            type="button"
            onClick={() =>
              quickMessage(
                "I want to book an appointment",
              )
            }
            className="rounded-full border border-emerald-200 bg-emerald-50 px-3.5 py-2 text-sm font-medium text-emerald-700 transition hover:border-emerald-300 hover:bg-emerald-100"
          >
            📅 Appointment
          </button>

        </div>

      </div>

      {/* =================================================
          CHAT INPUT BAR
      ================================================= */}

      <div className="shrink-0 border-t border-emerald-100 bg-white p-3">

        <div className="mx-auto max-w-4xl rounded-2xl border border-slate-200/80 bg-white/90 p-2.5 shadow-lg shadow-slate-200/50 ring-1 ring-white backdrop-blur-xl sm:p-3">

          <div className="flex items-center gap-2">

            {/* UPLOAD */}

            <IconButton
              title="Upload Report or Document"
              onClick={
                openFileSelector
              }
              disabled={
                uploadingDocument ||
                checkingConsent ||
                generatingSummary
              }
              className="h-10 w-10 rounded-xl border border-emerald-200 bg-white text-emerald-600 hover:bg-emerald-50 disabled:cursor-not-allowed disabled:opacity-40"
            >
              <Paperclip className="h-4 w-4" />
            </IconButton>

            {/* AI SUMMARY */}

            <div className="group relative">

              <IconButton
                title="AI Case Summary"
                onClick={
                  generateCaseSummary
                }
                disabled={
                  generatingSummary ||
                  loading ||
                  uploadingDocument ||
                  getUserMessageCount() <
                    8
                }
                className="h-10 w-10 rounded-xl border border-purple-200 bg-white text-purple-600 hover:bg-purple-50 disabled:cursor-not-allowed disabled:opacity-40"
              >
                {generatingSummary ? (
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-purple-600 border-t-transparent" />
                ) : (
                  <Sparkles className="h-4 w-4" />
                )}
              </IconButton>

              {/* SUMMARY CARD */}

              <div
                className="
                  pointer-events-none
                  absolute
                  bottom-full
                  left-1/2
                  z-50
                  mb-3
                  w-72
                  -translate-x-1/2
                  translate-y-2
                  rounded-xl
                  border
                  border-purple-100
                  bg-white
                  p-4
                  shadow-xl
                  opacity-0
                  transition-all
                  duration-200
                  group-hover:pointer-events-auto
                  group-hover:translate-y-0
                  group-hover:opacity-100
                "
              >

                <div className="flex items-start gap-3">

                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-purple-50">

                    <Sparkles className="h-5 w-5 text-purple-600" />

                  </div>

                  <div>

                    <h4 className="text-sm font-bold text-slate-800">
                      AI Case Summary
                    </h4>

                    <p className="mt-1 text-xs leading-5 text-slate-500">
                      Combine your AI conversation and uploaded medical documents into a case summary for your review.
                    </p>

                  </div>

                </div>

                <div className="mt-3 rounded-lg bg-slate-50 px-3 py-2">

                  <p className="text-[11px] font-medium text-slate-500">
                    Status
                  </p>

                  <p className="mt-0.5 text-xs font-semibold text-purple-600">
                    {summaryStatus}
                  </p>

                </div>

                <button
                  type="button"
                  onClick={
                    generateCaseSummary
                  }
                  disabled={
                    generatingSummary ||
                    loading ||
                    uploadingDocument ||
                    getUserMessageCount() <
                      8
                  }
                  className="
                    mt-3
                    flex
                    w-full
                    items-center
                    justify-center
                    gap-2
                    rounded-lg
                    bg-purple-600
                    px-3
                    py-2
                    text-xs
                    font-semibold
                    text-white
                    transition
                    hover:bg-purple-700
                    disabled:cursor-not-allowed
                    disabled:bg-gray-300
                  "
                >

                  {generatingSummary ? (
                    <>
                      <div className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white border-t-transparent" />
                      Generating...
                    </>
                  ) : (
                    <>
                      <Sparkles className="h-3.5 w-3.5" />
                      Generate Summary
                    </>
                  )}

                </button>

              </div>

            </div>

           

            {/* NORMAL SPEECH INPUT */}

            <IconButton
              title={
                isListening
                  ? "Stop Listening"
                  : `Speak in ${getLanguageDisplayName()}`
              }
              onClick={
                toggleSpeechRecognition
              }
              disabled={
                loading ||
                uploadingDocument ||
                generatingSummary
              }
              className={`h-11 w-11 rounded-xl border transition ${
                isListening
                  ? "border-red-300 bg-red-50 text-red-600 hover:bg-red-100"
                  : "border-emerald-200 bg-white text-emerald-600 hover:bg-emerald-50"
              } disabled:cursor-not-allowed disabled:opacity-40`}
            >
              {isListening ? (
                <MicOff className="h-4 w-4" />
              ) : (
                <Mic className="h-4 w-4" />
              )}
            </IconButton>

            {/* MESSAGE INPUT */}

            <input
              type="text"
              placeholder={
                isListening
                  ? `Listening in ${getLanguageDisplayName()}...`
                  : `Ask your health question in ${getLanguageDisplayName()}...`
              }
              value={input}
              disabled={loading}
              onChange={(e) =>
                setInput(
                  e.target.value,
                )
              }
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  sendMessage();
                }
              }}
              className="min-w-0 flex-1 rounded-xl border border-slate-200 bg-slate-50/70 px-4 py-3 text-sm font-medium text-slate-700 outline-none transition focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100 disabled:bg-slate-50"
            />

            {/* SEND */}

            <IconButton
              title="Send Message"
              onClick={
                sendMessage
              }
              disabled={
                loading ||
                !input.trim()
              }
              className="h-11 w-11 rounded-xl bg-gradient-to-br from-emerald-600 to-teal-600 text-white shadow-md shadow-emerald-600/20 transition-all hover:-translate-y-0.5 hover:shadow-lg disabled:cursor-not-allowed disabled:from-slate-300 disabled:to-slate-300"
            >
              <Send className="h-4 w-4" />
            </IconButton>

          </div>

          <p className="mt-2 px-2 text-center text-[11px] text-slate-500">

            📎 Upload reports • ✨ case summary • 🖱️ answer AI questions with options • 🎙️ assistant • 🎤 voice-to-text • 🔊 listen •{" "}

            {selectedLanguage.flag}{" "}
            {getLanguageDisplayName()}{" "}

            {voiceAssistantActive && (
              <span className="font-semibold text-emerald-600">
                • Voice Assistant Active
              </span>
            )}

            {" "}• ➤ Send message

          </p>

        </div>

      </div>

    </div>
  );
}

export default Chatbot;