import { createContext, useContext, useEffect, useState } from "react";
import API from "../services/api";
import { translations } from "./translations";

const LanguageContext = createContext();

export function LanguageProvider({ children }) {
  const [language, setLanguage] = useState("fr");

  useEffect(() => {
    const loadLang = async () => {
      try {
        // ✅ Utilise API (avec token + bonne baseURL) au lieu de axios direct
        const res = await API.get("/settings");
        if (res.data?.language) setLanguage(res.data.language);
      } catch {}
    };
    loadLang();
  }, []);

  const t = (key) => translations[language]?.[key] || key;

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export const useLang = () => useContext(LanguageContext);
