import React from "react";
import { useNavigate } from "react-router-dom";
import { useNotifications } from "../hooks/useNotifications";
import API from "../services/api";

const BACKEND =
  API.defaults.baseURL?.split("/api")[0] ||
  "https://debat-jeune-production.up.railway.app";

const getIcon = (type) => {
  const icons = {
    new_post: "📢",
    publication_comment: "💬",
    publication_reaction: "❤️",
    debat_vote: "⚖️",
    comment_reaction: "👍",
  };
  return icons[type] || "🔔";
};

const timeAgo = (date) => {
  const diff = Date.now() - new Date(date).getTime();
  const mins = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);
  if (mins < 1) return "À l'instant";
  if (mins < 60) return `Il y a ${mins} min`;
  if (hours < 24) return `Il y a ${hours}h`;
  return `Il y a ${days}j`;
};

const Notifications = () => {
  const navigate = useNavigate();
  const { notifications, unreadCount, markRead, markAllRead } =
    useNotifications();

  const handleClick = async (n) => {
    await markRead(n.id_notification);
    const isPubNotif =
      n.entity_id &&
      (n.entity_type === "publication" ||
        [
          "new_post",
          "publication_comment",
          "publication_reaction",
          "debat_vote",
        ].includes(n.type_notification));
    if (isPubNotif) {
      navigate(`/publication/${n.entity_id}`);
    }
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)",
        padding: "20px 16px",
      }}
    >
      <div style={{ maxWidth: 600, margin: "0 auto" }}>
        {/* Header */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            marginBottom: 24,
            gap: 12,
          }}
        >
          <button
            onClick={() => navigate(-1)}
            style={{
              background: "white",
              border: "none",
              borderRadius: "50%",
              width: 40,
              height: 40,
              cursor: "pointer",
              fontSize: 18,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
            }}
          >
            ←
          </button>

          <div style={{ flex: 1 }}>
            <h1
              style={{
                margin: 0,
                fontSize: 22,
                fontWeight: 700,
                color: "#1a1a2e",
              }}
            >
              Notifications
              {unreadCount > 0 && (
                <span
                  style={{
                    background: "#667eea",
                    color: "white",
                    borderRadius: 20,
                    padding: "2px 10px",
                    fontSize: 13,
                    marginLeft: 10,
                    fontWeight: 600,
                  }}
                >
                  {unreadCount}
                </span>
              )}
            </h1>
            <p style={{ margin: 0, fontSize: 13, color: "#888", marginTop: 3 }}>
              {unreadCount > 0
                ? `${unreadCount} non lue(s)`
                : "Tout est à jour ✓"}
            </p>
          </div>

          {unreadCount > 0 && (
            <button
              onClick={markAllRead}
              style={{
                background: "none",
                border: "1px solid #667eea",
                borderRadius: 20,
                padding: "6px 14px",
                color: "#667eea",
                cursor: "pointer",
                fontSize: 13,
                fontWeight: 500,
              }}
            >
              Tout lire
            </button>
          )}
        </div>

        {/* Liste */}
        <div
          style={{
            background: "white",
            borderRadius: 20,
            boxShadow: "0 4px 20px rgba(0,0,0,0.08)",
            overflow: "hidden",
          }}
        >
          {notifications.length === 0 ? (
            <div
              style={{ textAlign: "center", padding: "60px 20px", color: "#999" }}
            >
              <div style={{ fontSize: 50, marginBottom: 10 }}>🔔</div>
              <p style={{ fontSize: 16, fontWeight: 500 }}>
                Aucune notification
              </p>
              <p style={{ fontSize: 14 }}>
                Vous serez notifié des nouvelles activités
              </p>
            </div>
          ) : (
            notifications.map((n, index) => (
              <div
                key={n.id_notification}
                onClick={() => handleClick(n)}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 14,
                  padding: "16px 20px",
                  cursor: "pointer",
                  background: n.is_read ? "white" : "#f0f3ff",
                  borderBottom:
                    index < notifications.length - 1
                      ? "1px solid #f0f0f0"
                      : "none",
                  transition: "background 0.2s",
                }}
                onMouseEnter={(e) =>
                  (e.currentTarget.style.background = "#f8f9ff")
                }
                onMouseLeave={(e) =>
                  (e.currentTarget.style.background = n.is_read
                    ? "white"
                    : "#f0f3ff")
                }
              >
                {/* Avatar + badge icon */}
                <div style={{ position: "relative", flexShrink: 0 }}>
                  <img
                    src={
                      n.photo_user
                        ? `${BACKEND}/${n.photo_user}`
                        : "https://randomuser.me/api/portraits/lego/1.jpg"
                    }
                    alt="user"
                    style={{
                      width: 44,
                      height: 44,
                      borderRadius: "50%",
                      objectFit: "cover",
                      border: "2px solid #e8e8f0",
                    }}
                    onError={(e) =>
                      (e.target.src =
                        "https://randomuser.me/api/portraits/lego/1.jpg")
                    }
                  />
                  <span
                    style={{
                      position: "absolute",
                      bottom: -2,
                      right: -2,
                      background: "white",
                      borderRadius: "50%",
                      width: 20,
                      height: 20,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: 12,
                      boxShadow: "0 1px 4px rgba(0,0,0,0.15)",
                    }}
                  >
                    {getIcon(n.type_notification)}
                  </span>
                </div>

                {/* Texte */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p
                    style={{
                      margin: 0,
                      fontSize: 14,
                      color: "#1a1a2e",
                      lineHeight: 1.4,
                    }}
                  >
                    {n.nom_user && (
                      <strong>
                        {n.nom_user} {n.prenom_user}{" "}
                      </strong>
                    )}
                    <span style={{ color: "#555" }}>{n.message}</span>
                  </p>
                  <span
                    style={{
                      fontSize: 12,
                      color: "#999",
                      marginTop: 4,
                      display: "block",
                    }}
                  >
                    {timeAgo(n.created_at)}
                  </span>
                </div>

                {/* Point non lu */}
                {!n.is_read && (
                  <div
                    style={{
                      width: 10,
                      height: 10,
                      borderRadius: "50%",
                      background: "#667eea",
                      flexShrink: 0,
                    }}
                  />
                )}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default Notifications;