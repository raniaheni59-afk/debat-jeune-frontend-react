import { createContext, useContext, useEffect, useState } from "react";
import API from "../services/api";
import { translations } from "./translations";

const LanguageContext = createContext();

export function LanguageProvider({ children }) {
  const [language, setLanguage] = useState("fr");

  useEffect(() => {
    const loadLang = async () => {
      try {
        const res = await axios.get("https://debat-jeune-production.up.railway.app/settings");
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
