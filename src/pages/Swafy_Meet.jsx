import { useEffect, useState } from "react";
import { FaVideo, FaKeyboard } from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import "./Swafy_Meet.css";

// ✅ onNouvelleReunion  → prop passé par AdminDashboard → setActivePage("live")
// (pas de prop pour jeune — Participer reste identique)
export default function Swafy_Meet({ onNouvelleReunion }) {
  const [dateText,  setDateText]  = useState("");
  const [joinValue, setJoinValue] = useState("");
  const navigate = useNavigate();

  // ── Date & heure ──
  useEffect(() => {
    const update = () => {
      setDateText(
        new Intl.DateTimeFormat("fr-FR", {
          hour: "2-digit", minute: "2-digit",
          weekday: "short", day: "2-digit", month: "short",
        }).format(new Date())
      );
    };
    update();
    const id = setInterval(update, 60000);
    return () => clearInterval(id);
  }, []);

  // ── Nouvelle réunion (HOST) ──
  // Si onNouvelleReunion fourni (admin) → ouvre AdminLiveStream directement
  // Sinon (jeune) → navigue vers /new-live
  const handleCreateMeeting = () => {
    if (onNouvelleReunion) {
      onNouvelleReunion();   // → setActivePage("live") dans AdminDashboard
    } else {
      navigate("/new-live");
    }
  };

  // ── Rejoindre (GUEST) ──
  const handleJoinMeeting = () => {
    const value = joinValue.trim();
    if (!value) return;

    if (value.startsWith("http://") || value.startsWith("https://")) {
      try {
        const url      = new URL(value);
        const roomCode = url.pathname.split("/").pop();
        const token    = url.searchParams.get("vt") || url.searchParams.get("at");
        if (!roomCode || !token) { alert("Lien invalide : token manquant"); return; }
        const paramKey = url.searchParams.get("at") ? "at" : "vt";
        navigate(`/meet/${roomCode}?${paramKey}=${token}`);
      } catch { alert("Lien invalide"); }
      return;
    }

    alert("Entrer un lien complet avec token");
  };

  return (
    <div className="swafy-meet-page">
      <div className="swafy-meet-top-bar">
        <span>{dateText}</span>
      </div>

      <div className="swafy-meet-content">
        <h1>Appels vidéo et visioconférences pour tous</h1>

        <p className="swafy-meet-subtitle">
          Communiquez, collaborez et célébrez les bons moments où que vous
          soyez avec Swafy Meet
        </p>

        <div className="swafy-meet-actions">

          {/* ✅ Bouton unique — label change selon le contexte */}
          <button
            className="swafy-meet-btn-primary"
            onClick={handleCreateMeeting}
          >
            <FaVideo className="swafy-meet-icon" />
            <span>
              {onNouvelleReunion ? "Nouvelle réunion" : "Nouvelle réunion"}
            </span>
          </button>

          {/* Rejoindre */}
          <div className="swafy-meet-join-box">
            <FaKeyboard className="swafy-meet-icon swafy-meet-input-icon" />
            <input
              type="text"
              placeholder="Coller un lien de réunion"
              value={joinValue}
              onChange={(e) => setJoinValue(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleJoinMeeting()}
            />
          </div>

          <button className="swafy-meet-btn-link" onClick={handleJoinMeeting}>
            Participer
          </button>
        </div>

        <hr className="swafy-meet-separator" />
      </div>
    </div>
  );
}