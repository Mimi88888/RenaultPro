import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { Translation, enTranslations, frTranslations, arTranslations } from "./translations";

type LanguageContextType = {
  language: string;
  setLanguage: (language: string) => void;
  t: Translation;
};

export const LanguageContext = createContext<LanguageContextType | null>(null);

type LanguageProviderProps = {
  children: ReactNode;
};

export function LanguageProvider({ children }: LanguageProviderProps) {
  // Initialize language from localStorage or default to English
  const [language, setLanguage] = useState<string>(() => {
    const savedLanguage = localStorage.getItem("language");
    return savedLanguage || "english";
  });

  // Get translations based on selected language
  const getTranslations = (): Translation => {
    switch (language) {
      case "french":
        return frTranslations;
      case "arabic":
        return arTranslations;
      case "english":
      default:
        return enTranslations;
    }
  };

  // Save language to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem("language", language);
    
    // Set the dir attribute for RTL languages
    if (language === "arabic") {
      document.documentElement.dir = "rtl";
      document.documentElement.lang = "ar";
    } else {
      document.documentElement.dir = "ltr";
      document.documentElement.lang = language === "french" ? "fr" : "en";
    }
  }, [language]);

  return (
    <LanguageContext.Provider
      value={{
        language,
        setLanguage,
        t: getTranslations(),
      }}
    >
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error("useLanguage must be used within a LanguageProvider");
  }
  return context;
}