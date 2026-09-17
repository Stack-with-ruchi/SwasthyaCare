import React, {
  createContext,
  useContext,
  useEffect,
  useState,
} from "react";

const LanguageContext = createContext();

export function LanguageProvider({ children }) {
  // Default language
  const [language, setLanguageState] = useState(() => {
    try {
      const savedLanguage = localStorage.getItem("selectedLanguage");

      if (savedLanguage) {
        return JSON.parse(savedLanguage);
      }
    } catch (error) {
      console.error("Failed to load saved language:", error);
    }

    return {
      code: "en",
      name: "English",
      nativeName: "English",
    };
  });

  // Update language globally
  const setLanguage = (newLanguage) => {
    setLanguageState(newLanguage);

    try {
      localStorage.setItem(
        "selectedLanguage",
        JSON.stringify(newLanguage)
      );
    } catch (error) {
      console.error("Failed to save language:", error);
    }
  };

  // Keep localStorage synchronized
  useEffect(() => {
    if (language) {
      localStorage.setItem(
        "selectedLanguage",
        JSON.stringify(language)
      );
    }
  }, [language]);

  return (
    <LanguageContext.Provider
      value={{
        language,
        setLanguage,
      }}
    >
      {children}
    </LanguageContext.Provider>
  );
}

// Custom hook to access selected language
export function useLanguage() {
  const context = useContext(LanguageContext);

  if (!context) {
    throw new Error(
      "useLanguage must be used inside LanguageProvider"
    );
  }

  return context;
}