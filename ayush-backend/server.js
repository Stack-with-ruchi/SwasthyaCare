import express from "express";
import mongoose from "mongoose";
import cors from "cors";
import dotenv from "dotenv";
import fetch from "node-fetch";
import "dotenv/config";

import authRoutes from "./routes/authRoutes.js";
import documentRoutes from "./routes/documentRoutes.js";
import tokenRoutes from "./routes/tokenRoutes.js";
import patientRoutes from "./routes/patientRoutes.js";
import appointmentRoutes from "./routes/appointmentRoutes.js";
import chatbotRoutes from "./routes/chatbotRoutes.js";
import doctorRoutes from "./routes/doctorRoutes.js";
import abdmRoutes from "./routes/abdmRoutes.js";

dotenv.config();

const app = express();

const PORT = process.env.PORT || 5000;

const MONGO_URI =
  process.env.MONGO_URI || "mongodb://127.0.0.1:27017/ayushcare";

/*
  Translation API URL

  You can change this in your .env file:

  LIBRETRANSLATE_URL=http://localhost:5001/translate
*/

const LIBRETRANSLATE_URL =
  process.env.LIBRETRANSLATE_URL || "http://localhost:5001/translate";

const translationCache = new Map();
const translationInFlight = new Map();
let fallbackUnavailableUntil = 0;
let lastFallbackRequestAt = 0;

const PROVIDER_LANGUAGE_CODES = {
  hne: "hi",
  gom: "kok",
};

const LOCAL_TRANSLATIONS = {
  hi: {
    "Patient Portal": "रोगी पोर्टल",
    "ABHA Login": "आभा लॉगिन",
    "Select Preferred Language": "पसंदीदा भाषा चुनें",
    "Enter ABHA ID": "आभा आईडी दर्ज करें",
    "SENDING OTP...": "ओटीपी भेजा जा रहा है...",
    "GET OTP": "ओटीपी प्राप्त करें",
    "OTP sent for ABHA ID": "आभा आईडी के लिए ओटीपी भेजा गया",
    "Enter OTP": "ओटीपी दर्ज करें",
    "VERIFYING...": "सत्यापन हो रहा है...",
    CONTINUE: "जारी रखें",
    "Login Successful": "लॉगिन सफल रहा",
    "Language preference set successfully.":
      "भाषा प्राथमिकता सफलतापूर्वक निर्धारित की गई।",
    "Access Health Dashboard": "स्वास्थ्य डैशबोर्ड खोलें",
    "Please enter your ABHA ID.": "कृपया अपनी आभा आईडी दर्ज करें।",
    "Welcome Back": "वापसी पर स्वागत है",
    "Your health and well-being are our priority.":
      "आपका स्वास्थ्य और कल्याण हमारी प्राथमिकता है।",
    "Consult Doctor (AI Case Taking)":
      "डॉक्टर से परामर्श करें (एआई केस जानकारी)",
    "Get Started": "शुरू करें",
    "My Services": "मेरी सेवाएं",
    "My Appointments": "मेरी नियुक्तियां",
    "View All": "सभी देखें",
    "My Reports": "मेरी रिपोर्ट",
    "My ABHA QR": "मेरा आभा क्यूआर",
    "My Medicines": "मेरी दवाएं",
    "Health History": "स्वास्थ्य इतिहास",
    Profile: "प्रोफ़ाइल",
    Home: "होम",
    "Select Language": "भाषा चुनें",
    "Reports & Documents": "रिपोर्ट और दस्तावेज़",
    "Upload Document": "दस्तावेज़ अपलोड करें",
    "Search documents...": "दस्तावेज़ खोजें...",
    "Need Help?": "सहायता चाहिए?",
    "AI Assistant Active": "एआई सहायक सक्रिय है",
    "View Details": "विवरण देखें",
    "View Profile": "प्रोफ़ाइल देखें",
    View: "देखें",
    Download: "डाउनलोड करें",
    "No documents found.": "कोई दस्तावेज़ नहीं मिला।",
    Patient: "रोगी",
    "ABHA User": "आभा उपयोगकर्ता",
    Name: "नाम",
    Mobile: "मोबाइल",
    Email: "ईमेल",
    "Not available": "उपलब्ध नहीं",
    "Not linked": "लिंक नहीं है",
  },
};

/* =========================
   EXPRESS MIDDLEWARES
========================= */

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin || /^https?:\/\/localhost:\d+$/.test(origin)) {
        return callback(null, true);
      }

      return callback(new Error("Frontend origin is not allowed by CORS."));
    },

    methods: ["GET", "POST", "PUT", "DELETE"],
    credentials: true,
  }),
);

app.use(express.json());

app.use("/uploads", express.static("uploads"));

/* =========================
   LANGUAGES
========================= */

const INDIAN_LANGUAGES = [
  { code: "en", name: "English", nativeName: "English" },
  { code: "hi", name: "Hindi", nativeName: "हिन्दी" },
  { code: "hne", name: "Chhattisgarhi", nativeName: "छत्तीसगढ़ी" },
  { code: "as", name: "Assamese", nativeName: "অসমীয়া" },
  { code: "bn", name: "Bengali", nativeName: "বাংলা" },
  { code: "brx", name: "Bodo", nativeName: "बड़ो" },
  { code: "doi", name: "Dogri", nativeName: "डोगरी" },
  { code: "gu", name: "Gujarati", nativeName: "ગુજરાતી" },
  { code: "kn", name: "Kannada", nativeName: "ಕನ್ನಡ" },
  { code: "ks", name: "Kashmiri", nativeName: "कश्मीरी / कॉशुर" },
  { code: "gom", name: "Konkani", nativeName: "कोंकणी" },
  { code: "mai", name: "Maithili", nativeName: "मैथिली" },
  { code: "ml", name: "Malayalam", nativeName: "മലയാളം" },
  { code: "mni", name: "Manipuri (Meitei)", nativeName: "মৈতৈলোন্" },
  { code: "mr", name: "Marathi", nativeName: "मराठी" },
  { code: "ne", name: "Nepali", nativeName: "नेपाली" },
  { code: "or", name: "Odia", nativeName: "ଓଡ଼ିଆ" },
  { code: "pa", name: "Punjabi", nativeName: "ਪੰਜਾਬੀ" },
  { code: "sa", name: "Sanskrit", nativeName: "संस्कृतम्" },
  { code: "sat", name: "Santali", nativeName: "ᱥᱟᱱᱛᱟᱲᱤ" },
  { code: "sd", name: "Sindhi", nativeName: "सिन्धी" },
  { code: "ta", name: "Tamil", nativeName: "தமிழ்" },
  { code: "te", name: "Telugu", nativeName: "తెలుగు" },
  { code: "ur", name: "Urdu", nativeName: "اُردُو" },
];

/* =========================
   GET AVAILABLE LANGUAGES
========================= */

app.get("/api/languages/list", (req, res) => {
  res.status(200).json({
    languages: INDIAN_LANGUAGES,
  });
});

/* =========================
   TRANSLATE SINGLE TEXT
========================= */

async function translateText(text, sourceLanguage, targetLanguage) {
  if (!text || typeof text !== "string") {
    return text;
  }

  const cacheKey = `${sourceLanguage}:${targetLanguage}:${text}`;
  if (translationCache.has(cacheKey)) {
    return translationCache.get(cacheKey);
  }

  if (translationInFlight.has(cacheKey)) {
    return translationInFlight.get(cacheKey);
  }

  const translationRequest = translateTextFromProvider(
    text,
    sourceLanguage,
    targetLanguage,
  );

  translationInFlight.set(cacheKey, translationRequest);

  try {
    const translatedText = await translationRequest;
    if (translatedText !== text) {
      translationCache.set(cacheKey, translatedText);
    }
    return translatedText;
  } finally {
    translationInFlight.delete(cacheKey);
  }
}

async function translateTextFromProvider(text, sourceLanguage, targetLanguage) {
  const localTranslation = LOCAL_TRANSLATIONS[targetLanguage]?.[text];
  if (localTranslation) {
    return localTranslation;
  }

  if (!process.env.LIBRETRANSLATE_API_KEY) {
    if (Date.now() < fallbackUnavailableUntil) {
      return text;
    }

    const providerTargetLanguage =
      PROVIDER_LANGUAGE_CODES[targetLanguage] || targetLanguage;
    const providerSourceLanguage =
      PROVIDER_LANGUAGE_CODES[sourceLanguage] || sourceLanguage;

    const minimumInterval = 250;
    const elapsed = Date.now() - lastFallbackRequestAt;
    if (elapsed < minimumInterval) {
      await new Promise((resolve) =>
        setTimeout(resolve, minimumInterval - elapsed),
      );
    }
    lastFallbackRequestAt = Date.now();

    const params = new URLSearchParams({
      q: text,
      langpair: `${providerSourceLanguage}|${providerTargetLanguage}`,
    });

    const response = await fetch(
      `https://api.mymemory.translated.net/get?${params}`,
    );

    if (!response.ok) {
      if (response.status === 429) {
        fallbackUnavailableUntil = Date.now() + 60_000;
      }
      return text;
    }

    const data = await response.json();
    const translatedText = data?.responseData?.translatedText;

    if (data.responseStatus === 429 || data.quotaFinished === true) {
      fallbackUnavailableUntil = Date.now() + 60 * 60 * 1000;
      console.warn(
        "Translation provider quota exhausted; configure LIBRETRANSLATE_API_KEY for all languages.",
      );
      return text;
    }

    if (!translatedText || data.responseStatus !== 200) {
      console.warn(
        "Fallback translation returned no usable text; keeping original text.",
      );
      return text;
    }

    return translatedText;
  }

  const response = await fetch(LIBRETRANSLATE_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify({
      q: text,
      source: sourceLanguage,
      target: targetLanguage,
      format: "text",

      ...(process.env.LIBRETRANSLATE_API_KEY
        ? {
            api_key: process.env.LIBRETRANSLATE_API_KEY,
          }
        : {}),
    }),
  });

  const responseText = await response.text();

  console.log("Translation API Status:", response.status);

  if (!response.ok) {
    console.error("Translation API Error:", response.status, responseText);

    throw new Error(`Translation API returned ${response.status}`);
  }

  let data;

  try {
    data = JSON.parse(responseText);
  } catch (error) {
    console.error(
      "Translation API returned HTML instead of JSON:",
      responseText.substring(0, 500),
    );

    throw new Error("Translation API returned invalid JSON.");
  }

  if (!data.translatedText) {
    console.warn(
      "Translation returned no translated text; keeping original text.",
    );
    return text;
  }

  return data.translatedText;
}

/* =========================
   TRANSLATE JSON OBJECT
========================= */

async function translatePayload(payload, sourceLanguage, targetLanguage) {
  // Translate a single string
  if (typeof payload === "string") {
    try {
      return await translateText(payload, sourceLanguage, targetLanguage);
    } catch (error) {
      console.warn(`Translation skipped: ${error.message}`);

      return payload;
    }
  }

  // Translate arrays in parallel
  if (Array.isArray(payload)) {
    const translatedArray = [];
    for (const item of payload) {
      translatedArray.push(
        await translatePayload(item, sourceLanguage, targetLanguage),
      );
    }
    return translatedArray;
  }

  // Translate object values in parallel
  if (typeof payload === "object" && payload !== null) {
    const translatedObject = {};
    for (const [key, value] of Object.entries(payload)) {
      translatedObject[key] = await translatePayload(
        value,
        sourceLanguage,
        targetLanguage,
      );
    }
    return translatedObject;
  }

  // Numbers, booleans, null, etc.
  return payload;
}

/* =========================
   TRANSLATE JSON API
========================= */

app.post("/api/languages/translate-json", async (req, res) => {
  const {
    targetLanguage,
    sourceLanguage = "en",

    // Accept both names
    payload,
    texts,
  } = req.body;

  // Support frontend sending either
  // "payload" or "texts"
  const contentToTranslate = payload ?? texts;

  if (contentToTranslate === undefined || contentToTranslate === null) {
    return res.status(400).json({
      success: false,
      message: "Payload or texts is required.",
    });
  }

  // English does not need translation
  if (
    !targetLanguage ||
    targetLanguage === "en" ||
    targetLanguage === "English"
  ) {
    return res.status(200).json({
      success: true,

      // Support frontend format
      translations: contentToTranslate,

      // Keep backend compatibility
      translatedPayload: contentToTranslate,
    });
  }

  const language = INDIAN_LANGUAGES.find(
    (item) => item.code === targetLanguage || item.name === targetLanguage,
  );

  if (!language) {
    return res.status(400).json({
      success: false,
      message: "Selected language is not supported.",

      translations: contentToTranslate,
    });
  }

  try {
    console.log(`Translating ${sourceLanguage} → ${language.code}`);

    const translatedPayload = await translatePayload(
      contentToTranslate,
      sourceLanguage,
      language.code,
    );

    return res.status(200).json({
      success: true,

      targetLanguage: language.code,

      // This is what your frontend expects
      translations: translatedPayload,

      // Keep old compatibility
      translatedPayload,
    });
  } catch (error) {
    console.error("Translation Error:", error.message);

    return res.status(200).json({
      success: false,

      targetLanguage: language.code,

      translations: contentToTranslate,

      translatedPayload: contentToTranslate,

      message: "Translation service is currently unavailable.",
    });
  }
});

/* =========================
   HEALTH CHECK
========================= */

app.get("/health", (req, res) => {
  res.status(200).json({
    status: "Active",
    application: "AyushCare Backend Server",
  });
});

/* =========================
   API ROUTES
========================= */
app.use("/api/appointments", appointmentRoutes);

app.use("/api/auth", authRoutes);

app.use("/api/documents", documentRoutes);

app.use("/api/token-flow", tokenRoutes);

app.use("/api/patient", patientRoutes);

app.use("/api/chatbot", chatbotRoutes);

app.use("/api/doctor", doctorRoutes);

app.use("/api/abdm", abdmRoutes);

/* =========================
   DATABASE + SERVER
========================= */

app.listen(PORT, () => {
  console.log(`AyushCare Backend Server running on http://localhost:${PORT}`);
});

mongoose
  .connect(MONGO_URI)
  .then(() => {
    console.log("Successfully connected to MongoDB Database.");
  })
  .catch((err) => {
    console.error("MongoDB Connection Error:", err.message);
    console.warn("The translation and health endpoints remain available.");
  });
