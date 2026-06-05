import { useEffect, useState } from "react";
import { FaVideo, FaKeyboard } from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import API from "../services/api";
import "./Swafy_Meet.css";

export default function Swafy_Meet({ onDemarrerLive }) {
  const [dateText, setDateText] = useState("");
  const [joinValue, setJoinValue] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  // ======================
  // Date & heure
  // ======================
  useEffect(() => {
    const updateDate = () => {
      const now = new Date();
      const formatted = new Intl.DateTimeFormat("fr-FR", {
        hour: "2-digit",
        minute: "2-digit",
        weekday: "short",
        day: "2-digit",
        month: "short",
      }).format(now);

      setDateText(formatted);
    };

    updateDate();
    const interval = setInterval(updateDate, 60000);
    return () => clearInterval(interval);
  }, []);

  // ======================
  // Create meeting (HOST) ✅ يحول للصفحة NewLive
  // ======================
  const handleCreateMeeting = () => {
    navigate("/new-live");
  };

  // ======================
  // Join meeting (GUEST)
  // ======================
  const handleJoinMeeting = () => {
    const value = joinValue.trim();
    if (!value) return;

    // ✅ إذا حط lien كامل
    if (value.startsWith("http://") || value.startsWith("https://")) {
      const url = new URL(value);
      const roomCode = url.pathname.split("/").pop();
      const token = url.searchParams.get("vt");

      if (!roomCode || !token) {
        alert("Lien invalide : token manquant");
        return;
      }

      navigate(`/meet/${roomCode}?vt=${token}`);
      return;
    }

    // ❌ code وحدو ما يكفيش (token لازم)
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
          {/* DÉMARRER LIVE ✅ bouton admin uniquement si onDemarrerLive fourni */}
          {onDemarrerLive && (
            <button
              style={{
                display: "flex", alignItems: "center", gap: 8,
                padding: "14px 24px", borderRadius: 12,
                background: "linear-gradient(135deg,#ea4335,#b31412)",
                color: "#fff", border: "none", fontSize: 14, fontWeight: 700,
                cursor: "pointer", boxShadow: "0 4px 18px rgba(234,67,53,.35)",
                fontFamily: "inherit",
              }}
              onClick={onDemarrerLive}
            >
              <span style={{ fontSize: 13 }}>🔴</span>
              <span>Démarrer un live</span>
            </button>
          )}

          {/* CREATE ✅ يحول للصفحة NewLive */}
          <button
            className="swafy-meet-btn-primary"
            onClick={handleCreateMeeting}
            disabled={loading}
          >
            <FaVideo className="swafy-meet-icon" />
            <span>{loading ? "Création..." : "Nouvelle réunion"}</span>
          </button>

          {/* JOIN */}
          <div className="swafy-meet-join-box">
            <FaKeyboard className="swafy-meet-icon swafy-meet-input-icon" />
            <input
              type="text"
              placeholder="Coller un lien de réunion"
              value={joinValue}
              onChange={(e) => setJoinValue(e.target.value)}
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