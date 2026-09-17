import { useEffect, useState } from "react";
import { useLanguage } from "../context/LanguageContext";
import { translateUi } from "../utils/translateUi";

export function useTranslation(texts) {
  const { language } = useLanguage();

  // Store translated text
  const [t, setT] = useState(texts);

  // Translation loading state
  const [isTranslating, setIsTranslating] = useState(false);

  useEffect(() => {
    let isMounted = true;

    const translateTexts = async () => {
      // If English is selected, use original text
      if (!language || language.code === "en") {
        if (isMounted) {
          setT(texts);
          setIsTranslating(false);
        }
        return;
      }

      try {
        if (isMounted) {
          setIsTranslating(true);
        }

        // Send all component text for translation
        const translatedTexts = await translateUi(
          texts,
          language.code
        );

        if (isMounted) {
          setT(translatedTexts);
        }
      } catch (error) {
        console.error("UI translation failed:", error);

        // If translation fails, keep English text
        if (isMounted) {
          setT(texts);
        }
      } finally {
        if (isMounted) {
          setIsTranslating(false);
        }
      }
    };

    translateTexts();

    return () => {
      isMounted = false;
    };
  }, [language?.code, texts]);

  return {
    t,
    isTranslating,
    language,
  };
}