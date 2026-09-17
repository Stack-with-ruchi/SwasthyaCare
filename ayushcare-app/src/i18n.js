import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import LanguageDetector from "i18next-browser-languagedetector";
import HttpBackend from "i18next-http-backend";

i18n
  .use(HttpBackend)
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    fallbackLng: "en",
    supportedLngs: [
      "en",
      "hi",
      "bn",
      "mr",
      "ta",
      "te",
      "kn",
      "gu",
      "ml",
      "pa",
      "or",
      "as",
      "ks",
      "ur",
      "sd",
      "ne",
      "kok",
      "mai",
      "mni",
      "brx",
      "sat",
      "doi",
      "cjg", // cjg = Chhattisgarhi custom code
    ],
    interpolation: { escapeValue: false },
    backend: { loadPath: "/locales/{{lng}}/{{ns}}.json" },
  });

export default i18n;
