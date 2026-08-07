import { useState } from "react";
import { PropTypes } from "../../shared/utils/propTypes";
import { translations } from "../../shared/locales/translations";
import { LanguageContext } from "./LanguageContext";

const STORAGE_KEY = "nailify_language";

export function LanguageProvider({ children }) {
  const [language, setLanguageState] = useState(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored === "vi" || stored === "en") {
        return stored;
      }
    } catch (e) {
      console.warn("Failed to read language from localStorage:", e);
    }
    // Default to 'vi' (Vietnamese) as the app is primary in Vietnamese, 
    // or try browser language check.
    const navLang = navigator.language || "";
    return navLang.toLowerCase().startsWith("vi") ? "vi" : "en";
  });

  const setLanguage = (lang) => {
    if (lang === "vi" || lang === "en") {
      setLanguageState(lang);
      try {
        localStorage.setItem(STORAGE_KEY, lang);
      } catch (e) {
        console.warn("Failed to write language to localStorage:", e);
      }
    }
  };

  const t = (key) => {
    if (!key) return "";
    const keys = key.split(".");
    
    // 1. Try selected language
    let val = translations[language];
    for (const k of keys) {
      if (val && typeof val === "object") {
        val = val[k];
      } else {
        val = undefined;
        break;
      }
    }
    if (val !== undefined && typeof val === "string") return val;

    // 2. Try English fallback
    let fallbackVal = translations["en"];
    for (const k of keys) {
      if (fallbackVal && typeof fallbackVal === "object") {
        fallbackVal = fallbackVal[k];
      } else {
        fallbackVal = undefined;
        break;
      }
    }
    if (fallbackVal !== undefined && typeof fallbackVal === "string") return fallbackVal;

    // 3. Try Vietnamese fallback
    let fallbackViVal = translations["vi"];
    for (const k of keys) {
      if (fallbackViVal && typeof fallbackViVal === "object") {
        fallbackViVal = fallbackViVal[k];
      } else {
        fallbackViVal = undefined;
        break;
      }
    }
    if (fallbackViVal !== undefined && typeof fallbackViVal === "string") return fallbackViVal;

    // Return key itself as last resort
    return key;
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

LanguageProvider.propTypes = {
  children: PropTypes.node.isRequired,
};
