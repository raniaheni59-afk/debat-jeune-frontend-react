import { useEffect, useState } from "react";
import API from "../services/api";
import { useLang } from "../i18n/LanguageContext";
export default function ParametrePage() {
  const { setLanguage, t } = useLang();
  const [settings, setSettings] = useState({
    liveEnabled: true,
    enqueteEnabled: true,
    participantsPublic: true,
    language: "fr",
    notifications: true,
    autoArchiveLive: true,
  });

  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);

  // ✅ Load settings from backend
  useEffect(() => {
    const loadSettings = async () => {
      try {
        const res = await API.get("/settings");
        if (res.data) setSettings(res.data);
      } catch (err) {
        console.warn("Settings par défaut utilisés");
      }
    };
    loadSettings();
  }, []);

  // ✅ Save settings to backend
  const saveSettings = async () => {
    setSaving(true);
    setSuccess(false);
    try {
      await API.put("/settings", settings);
      setSuccess(true);
    } catch (err) {
      alert("Erreur sauvegarde paramètres");
    }
    setSaving(false);
  };

  const toggle = (key) =>
    setSettings((p) => ({ ...p, [key]: !p[key] }));

  return (
    <div className="param-page">
      <h1 className="title">⚙️ Paramètres</h1>

      {/* ================= LIVE ================= */}
      <Section title="🔴 Live">
        <Toggle label="Activer les lives" value={settings.liveEnabled} onChange={() => toggle("liveEnabled")} />
        <Toggle label="Archivage automatique des lives" value={settings.autoArchiveLive} onChange={() => toggle("autoArchiveLive")} />
      </Section>

      {/* ================= ENQUETE ================= */}
      <Section title="📝 Enquêtes">
        <Toggle label="Activer les enquêtes" value={settings.enqueteEnabled} onChange={() => toggle("enqueteEnabled")} />
      </Section>

      {/* ================= PARTICIPANTS ================= */}
      <Section title="👥 Participants">
        <Toggle label="Afficher les participants publiquement" value={settings.participantsPublic} onChange={() => toggle("participantsPublic")} />
      </Section>

      {/* ================= LANGUAGE ================= */}
      <Section title="🌍 Langue">
       <select
  value={settings.language}
  onChange={(e) => {
    const lang = e.target.value;
    setSettings({ ...settings, language: lang });
    setLanguage(lang); // ✅ يبدّل لغة الواجهة فورًا
  }}
>
        
          <option value="fr">Français</option>
          <option value="ar">العربية</option>
          <option value="en">English</option>
        </select>
      </Section>

      {/* ================= NOTIFICATIONS ================= */}
      <Section title="🔔 Notifications">
        <Toggle label="Recevoir les notifications admin" value={settings.notifications} onChange={() => toggle("notifications")} />
      </Section>

      {/* ================= SECURITY ================= */}
      <Section title="🔐 Sécurité">
        <button className="danger">Changer mot de passe</button>
        <button className="danger">Déconnexion globale</button>
      </Section>

      {/* ================= SAVE ================= */}
      <div className="save-box">
        <button onClick={saveSettings} disabled={saving}>
          {saving ? "Sauvegarde..." : "💾 Sauvegarder"}
        </button>
        {success && <span className="success">✅ Paramètres sauvegardés</span>}
      </div>

      {/* ================= STYLE ================= */}
      <style>{`
        .param-page {
          min-height: 100vh;
          padding: 40px;
          background: radial-gradient(circle at top, #e9e6ff, #f6f5ff);
          font-family: 'Poppins', sans-serif;
          color: #2d2555;
        }

        .title {
          font-size: 34px;
          font-weight: 800;
          margin-bottom: 40px;
          color: #3b2f7d;
        }

        .section {
          background: linear-gradient(160deg, #ffffff, #f2f0ff);
          border-radius: 22px;
          padding: 24px;
          margin-bottom: 26px;
          box-shadow: 0 20px 45px rgba(124,92,191,.18);
          animation: fadeUp .4s ease;
        }

        .section h2 {
          margin-bottom: 18px;
          font-size: 20px;
          color: #4b3fa6;
        }

        .toggle {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 14px;
        }

        .toggle span {
          font-size: 14px;
        }

        .switch {
          width: 46px;
          height: 24px;
          border-radius: 20px;
          background: #ddd;
          position: relative;
          cursor: pointer;
          transition: background .3s;
        }

        .switch.active {
          background: linear-gradient(135deg, #c7bfff, #a5b4fc);
        }

        .switch::after {
          content: "";
          width: 18px;
          height: 18px;
          background: #fff;
          border-radius: 50%;
          position: absolute;
          top: 3px;
          left: 4px;
          transition: all .3s;
        }

        .switch.active::after {
          left: 24px;
        }

        select {
          padding: 10px;
          border-radius: 14px;
          border: 1px solid #dcd7ff;
          background: #fff;
          font-family: inherit;
        }

        .danger {
          background: linear-gradient(135deg, #fbcfe8, #fecdd3);
          border: none;
          padding: 10px 18px;
          border-radius: 14px;
          margin-right: 10px;
          font-weight: 600;
          cursor: pointer;
        }

        .save-box {
          margin-top: 30px;
          display: flex;
          align-items: center;
          gap: 14px;
        }

        .save-box button {
          background: linear-gradient(135deg, #c7bfff, #a5b4fc);
          border: none;
          padding: 12px 28px;
          border-radius: 22px;
          font-weight: 700;
          cursor: pointer;
          box-shadow: 0 8px 22px rgba(124,92,191,.3);
        }

        .success {
          color: #16a34a;
          font-weight: 600;
        }

        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}

/* ===== COMPONENTS ===== */

function Section({ title, children }) {
  return (
    <div className="section">
      <h2>{title}</h2>
      {children}
    </div>
  );
}

function Toggle({ label, value, onChange }) {
  return (
    <div className="toggle">
      <span>{label}</span>
      <div className={`switch ${value ? "active" : ""}`} onClick={onChange}></div>
    </div>
  );
}