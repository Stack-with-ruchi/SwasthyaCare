import { apiRequest } from "./api";

function createHash(text) {
  let hash = 0;

  for (let i = 0; i < text.length; i++) {
    hash = (hash << 5) - hash + text.charCodeAt(i);
    hash |= 0;
  }

  return Math.abs(hash);
}

export async function translateUi(textObject, targetLanguage) {
  // English does not need translation
  if (!targetLanguage || targetLanguage === "en") {
    return textObject;
  }

  // Create a unique cache key for this language and page text
  const textSignature = JSON.stringify(textObject);

  // Version the cache so older English fallbacks are not reused.
  const cacheKey = `translation_v3_${targetLanguage}_${createHash(textSignature)}`;

  try {
    // Check localStorage first
    const cachedTranslation = localStorage.getItem(cacheKey);

    if (cachedTranslation) {
      console.log(`Using cached translation for ${targetLanguage}`);

      return JSON.parse(cachedTranslation);
    }

    // Call translation API
    console.log(`Requesting translation for ${targetLanguage}`);

    const data = await apiRequest("/languages/translate-json", {
      method: "POST",
      body: JSON.stringify({
        texts: textObject,
        targetLanguage,
      }),
    });

    if (!data.success) {
      return textObject;
    }

    const translatedText =
      data.translations || data.translatedPayload || data.translatedText;

    if (!translatedText) {
      return textObject;
    }

    // Save translation in localStorage
    localStorage.setItem(cacheKey, JSON.stringify(translatedText));

    return translatedText;
  } catch (error) {
    console.error("Translation API failed:", error);

    return textObject;
  }
}
