import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useNotifications } from "../hooks/useNotifications";
import API from "../services/api";
import "./Notifications.css";

const BACKEND =
  API.defaults.baseURL?.split("/api")[0] ||
  "https://debat-jeune.onrender.com";

/* ── helpers ── */
const ICONS = {
  new_post:             "📢",
  publication_comment:  "💬",
  publication_reaction: "❤️",
  debat_vote:           "⚖️",
  comment_reaction:     "👍",
  live_started:         "🔴",
};

const ACCENT_COLORS = {
  new_post:             "#6366f1",
  publication_comment:  "#3b82f6",
  publication_reaction: "#ef4444",
  debat_vote:           "#8b5cf6",
  comment_reaction:     "#f59e0b",
  live_started:         "#ef4444",
};

const timeAgo = (date) => {
  const diff  = Date.now() - new Date(date).getTime();
  const mins  = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days  = Math.floor(diff / 86400000);
  if (mins  < 1)  return "À l'instant";
  if (mins  < 60) return `Il y a ${mins} min`;
  if (hours < 24) return `Il y a ${hours}h`;
  return `Il y a ${days}j`;
};

/* ══════════════════════════════════════════
   COMPOSANT
══════════════════════════════════════════ */
export default function Notifications() {
  const navigate = useNavigate();
  const { notifications, unreadCount, markRead, markAllRead } = useNotifications();

  /* live notifications en temps réel via socket CustomEvent */
  const [liveNotifs, setLiveNotifs] = useState([]);

  useEffect(() => {
    const handleLiveStarted = (e) => {
      const d = e.detail;
      setLiveNotifs(prev => [{
        id_notification:   `live-${Date.now()}`,
        type_notification: "live_started",
        message:    d.message || "Un live a démarré — rejoignez maintenant !",
        created_at: d.created_at || new Date().toISOString(),
        is_read:    false,
        roomCode:   d.roomCode,
        _isLive:    true,
      }, ...prev]);
    };

    const handleNewNotif = (e) => {
      const d = e.detail;
      if (d?.type_notification === "live_started" || d?.roomCode) {
        setLiveNotifs(prev => [{
          id_notification:   `live-${Date.now()}`,
          type_notification: "live_started",
          message:    d.message || "Un live a démarré — rejoignez maintenant !",
          created_at: d.created_at || new Date().toISOString(),
          is_read:    false,
          roomCode:   d.roomCode,
          _isLive:    true,
        }, ...prev]);
      }
    };

    window.addEventListener("live-started",    handleLiveStarted);
    window.addEventListener("new_notification", handleNewNotif);
    return () => {
      window.removeEventListener("live-started",    handleLiveStarted);
      window.removeEventListener("new_notification", handleNewNotif);
    };
  }, []);

  const allNotifs = [...liveNotifs, ...notifications];

  /* ── handleClick — ta logique complète ── */
  const handleClick = async (n) => {
    /* 1. Live → aller au live */
    if (n.type_notification === "live_started" || n._isLive) {
      const roomCode = n.roomCode || n.entity_id;
      if (roomCode) {
        try {
          const res  = await API.get("/lives");
          const live = Array.isArray(res.data)
            ? res.data.find(l => l.room_code === roomCode && l.is_active)
            : null;
          if (live?.stream_link) {
            const url  = new URL(live.stream_link);
            const code = url.pathname.split("/").pop();
            const vt   = url.searchParams.get("vt");
            if (code && vt) { navigate(`/meet/${code}?vt=${vt}`); return; }
          }
          if (live?.room_code) { navigate(`/meet/${live.room_code}`); return; }
        } catch {}
      }
      navigate("/jeune");
      return;
    }

    /* 2. Marquer comme lu */
    if (n.id_notification && !String(n.id_notification).startsWith("live-")) {
      await markRead(n.id_notification);
    }

    /* 3. Publications */
    const isPubNotif =
      n.entity_id &&
      (n.entity_type === "publication" ||
        ["new_post", "publication_comment", "publication_reaction", "debat_vote"].includes(n.type_notification));
    if (isPubNotif) { navigate(`/jeune/publication/${n.entity_id}`); return; }

    /* 4. Enquête */
    if (n.type_notification === "enquete_response" && n.entity_id) {
      navigate("/admin/dashboard"); return;
    }

    /* 5. Comment reaction */
    if (n.type_notification === "comment_reaction" && n.entity_id) {
      navigate(`/jeune/publication/${n.entity_id}`); return;
    }
  };

  /* ══════════════════════════════════════
     RENDER
  ══════════════════════════════════════ */
  return (
    <div className="notif-page-container">

      {/* glows */}
      <div className="notif-glow notif-glow--v" />
      <div className="notif-glow notif-glow--o" />

      <div className="notif-card">

        {/* ── HEADER ── */}
        <div className="notif-header">
          <div className="notif-header-left">
            <button
              className="notif-back-btn"
              onClick={() => navigate(-1)}
              aria-label="Retour"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                <path d="M20 11H7.83l5.59-5.59L12 4l-8 8 8 8 1.41-1.41L7.83 13H20v-2z"/>
              </svg>
            </button>
            <div className="notif-header-titles">
              <h2 className="notif-title">Notifications</h2>
              {unreadCount > 0 && (
                <span className="notif-badge">{unreadCount} non lue(s)</span>
              )}
            </div>
          </div>

          {unreadCount > 0 && (
            <button className="notif-mark-all" onClick={markAllRead}>
              Tout marquer lu
            </button>
          )}
        </div>

        {/* ── EMPTY ── */}
        {allNotifs.length === 0 && (
          <div className="notif-empty">
            <div className="notif-empty-ring">🔔</div>
            <p className="notif-empty-title">Aucune notification</p>
            <p className="notif-empty-sub">Vous serez notifié des nouvelles activités</p>
          </div>
        )}

        {/* ── LIST ── */}
        {allNotifs.length > 0 && (
          <div className="notif-list">
            {allNotifs.map((n, idx) => {
              const type    = n.type_notification || "";
              const isLive  = type === "live_started" || n._isLive;
              const isUnread = !n.is_read;
              const icon    = ICONS[type]         || "🔔";
              const color   = ACCENT_COLORS[type] || "#6366f1";
              const isLast  = idx === allNotifs.length - 1;

              /* avatar */
              const avatarUrl = n.photo_user ? `${BACKEND}/${n.photo_user}` : null;
              const initials  = ((n.nom_user || n.prenom_user || "?")[0]).toUpperCase();

              return (
                <div
                  key={n.id_notification}
                  className={[
                    "notif-item",
                    isUnread ? "unread" : "",
                    isLive   ? "live"   : "",
                    isLast   ? "notif-item-last" : "",
                  ].filter(Boolean).join(" ")}
                  style={{ animationDelay: `${idx * 40}ms` }}
                  onClick={() => handleClick(n)}
                >
                  {/* accent gauche */}
                  {isUnread && (
                    <div className="notif-item__accent" style={{ background: color }} />
                  )}

                  {/* avatar */}
                  <div className="notif-avatar-wrap">
                    {isLive ? (
                      <div className="notif-live-avatar">🔴</div>
                    ) : avatarUrl ? (
                      <img
                        src={avatarUrl}
                        alt="user"
                        className="notif-img"
                        onError={e => {
                          e.target.style.display = "none";
                          e.target.nextSibling.style.display = "flex";
                        }}
                      />
                    ) : null}

                    {/* initiales — cachées si photo chargée */}
                    {!isLive && (
                      <div
                        className="notif-initials"
                        style={{
                          background: color,
                          display: avatarUrl ? "none" : "flex",
                        }}
                      >
                        {initials}
                      </div>
                    )}

                    {/* badge type */}
                    <span className="notif-type-badge">
                      {icon}
                    </span>
                  </div>

                  {/* texte */}
                  <div className="notif-text">
                    <p className="notif-message">
                      {n.nom_user && (
                        <strong>{n.nom_user} {n.prenom_user} </strong>
                      )}
                      <span>{n.message}</span>
                    </p>
                    <div className="notif-meta">
                      <span className="notif-date">
                        {timeAgo(n.created_at || n.date_creation)}
                      </span>
                      {isLive && (
                        <span className="notif-live-badge">🔴 LIVE</span>
                      )}
                    </div>
                  </div>

                  {/* dot non lu */}
                  {isUnread && (
                    <div
                      className="notif-dot"
                      style={{ background: color, color }}
                    />
                  )}
                </div>
              );
            })}
          </div>
        )}

      </div>
    </div>
  );
}