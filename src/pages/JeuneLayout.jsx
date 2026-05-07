import React, { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { io } from "socket.io-client";
import API from "../services/api";
import PublicationCard from "../components/PublicationCard";
import Chatbot from "../components/Chatbot";
import JeuneContact from "./JeuneContact";
import Profile from "./Profile";
import PublierPage from "./PublierPage";
import Notifications from "./Notifications";
import "./JeuneLayout.css";

const BACKEND =
  API.defaults.baseURL?.split("/api")[0] ||
  "https://debat-jeune-production.up.railway.app";

const getAvatar = (photo, sexe) => {
  if (photo) return photo.startsWith("http") ? photo : `${BACKEND}/${photo}`;
  return sexe === "femme"
    ? "https://randomuser.me/api/portraits/women/44.jpg"
    : "https://randomuser.me/api/portraits/men/44.jpg";
};

const PAGES = {
  HOME: "home",
  MESSAGES: "messages",
  NOTIFICATIONS: "notifications",
  PUBLIER: "publier",
  PROFILE: "profile",
  CHATBOT: "chatbot",
};

const NAV_ITEMS = [
  { icon: "⌂",  label: "Accueil",       page: PAGES.HOME },
  { icon: "✉",  label: "Messages",      page: PAGES.MESSAGES },
  { icon: "📅", label: "Calendrier",    path: "/calendar" },
  { icon: "🎥", label: "Swafy Meet",    path: "/meet" },
  { icon: "◉",  label: "Live",          path: "/lives", live: true },
  { icon: "🔔", label: "Notifications", page: PAGES.NOTIFICATIONS },
  { icon: "📁", label: "Archive",       path: "/archive" },
  { icon: "⚙",  label: "Paramètres",   path: "/settings" },
];

export default function JeuneLayout() {
  const navigate = useNavigate();
  const [user] = useState(() => {
    try { return JSON.parse(localStorage.getItem("user")) || null; }
    catch { return null; }
  });

  const [activePage, setActivePage]     = useState(PAGES.HOME);
  const [sidebarOpen, setSidebarOpen]   = useState(true);
  const [publications, setPublications] = useState([]);
  const [loading, setLoading]           = useState(true);
  const [unreadNotifs, setUnreadNotifs] = useState(0);
  const [unreadMsgs, setUnreadMsgs]     = useState(0);
  const [highlightedPub, setHighlightedPub] = useState(null);
  const [rightTab, setRightTab]         = useState("profile"); // "profile" | "chatbot"

  /* ── Socket ── */
  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) return;
    const socket = io(BACKEND, { auth: { token }, transports: ["websocket"] });
    socket.on("new_notification", () => setUnreadNotifs(p => p + 1));
    socket.on("connect_error", err => console.error("Socket:", err.message));
    return () => socket.disconnect();
  }, []);

  /* ── Publications ── */
  const fetchPublications = useCallback(async () => {
    try {
      setLoading(true);
      const res = await API.get("/publications");
      setPublications(Array.isArray(res.data) ? res.data : []);
    } catch { setPublications([]); }
    finally { setLoading(false); }
  }, []);

  /* ── Notifications count ── */
  const fetchNotifCount = useCallback(async () => {
    try {
      const res = await API.get("/notifications");
      const notifs = Array.isArray(res.data) ? res.data : [];
      setUnreadNotifs(notifs.filter(n => !n.is_read).length);
    } catch {}
  }, []);

  useEffect(() => {
    fetchPublications();
    fetchNotifCount();
    const params = new URLSearchParams(window.location.search);
    const pubId = params.get("publication");
    if (pubId) {
      setHighlightedPub(parseInt(pubId));
      setTimeout(() => {
        const el = document.getElementById(`pub-${pubId}`);
        if (el) el.scrollIntoView({ behavior: "smooth", block: "center" });
      }, 800);
    }
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    window.location.href = "/login";
  };

  const handleNav = (item) => {
    if (item.page) { setActivePage(item.page); if (item.page === PAGES.NOTIFICATIONS) setUnreadNotifs(0); return; }
    if (item.path) navigate(item.path);
  };

  /* ── Page content ── */
  const renderContent = () => {
    switch (activePage) {
      case PAGES.MESSAGES:      return <JeuneContact />;
      case PAGES.NOTIFICATIONS: return <Notifications />;
      case PAGES.PUBLIER:       return <PublierPage onBack={() => setActivePage(PAGES.HOME)} />;
      case PAGES.PROFILE:       return <Profile />;
      default:                  return renderHome();
    }
  };

  const renderHome = () => (
    <>
      {/* Welcome banner */}
      <div className="jl-welcome">
        <div className="jl-welcome-text">
          <p className="jl-welcome-tag">Tableau de bord</p>
          <h1 className="jl-welcome-h1">
            Bonjour, <span>{user?.prenom_user || "Jeune"}</span> 👋
          </h1>
          <p className="jl-welcome-sub">
            Explorez, publiez et débattez avec la communauté Swafy.
          </p>
          <button className="jl-welcome-btn" onClick={() => setActivePage(PAGES.PUBLIER)}>
            ✦ Nouvelle publication
          </button>
        </div>
        <div className="jl-welcome-art">
          <div className="jl-ring r1" /><div className="jl-ring r2" /><div className="jl-ring r3" />
        </div>
      </div>

      {/* Feed */}
      <div className="jl-feed-header">
        <h2 className="jl-feed-title">Fil d'actualité</h2>
        <span className="jl-feed-count">{publications.length} publications</span>
      </div>

      {loading ? (
        <div className="jl-loading">
          <div className="jl-spinner" />
          <p>Chargement…</p>
        </div>
      ) : publications.length === 0 ? (
        <div className="jl-empty">
          <span style={{ fontSize: 48 }}>✦</span>
          <p>Aucune publication pour le moment</p>
          <button className="jl-empty-btn" onClick={() => setActivePage(PAGES.PUBLIER)}>
            Publier maintenant
          </button>
        </div>
      ) : (
        publications.map(pub => (
          <div
            key={pub.id_publication}
            id={`pub-${pub.id_publication}`}
            className={highlightedPub === pub.id_publication ? "jl-highlighted" : ""}
          >
            <PublicationCard publication={pub} onUpdate={fetchPublications} />
          </div>
        ))
      )}
    </>
  );

  const isFullPage = activePage === PAGES.MESSAGES;

  return (
    <div className={`jl-root ${sidebarOpen ? "sidebar-open" : "sidebar-closed"}`}>

      {/* ── SIDEBAR ── */}
      <aside className="jl-sidebar">
        {/* Logo / toggle */}
        <div className="jl-sidebar-top">
          <button className="jl-toggle" onClick={() => setSidebarOpen(s => !s)}>
            <span className="jl-hamburger">
              <span /><span /><span />
            </span>
            {sidebarOpen && <span className="jl-logo-text">Menu</span>}
          </button>
        </div>

        {/* Nav items */}
        <nav className="jl-nav">
          {NAV_ITEMS.map((item, idx) => (
            <button
              key={idx}
              className={`jl-nav-item ${activePage === item.page ? "active" : ""}`}
              onClick={() => handleNav(item)}
              title={!sidebarOpen ? item.label : ""}
            >
              <span className="jl-nav-icon">{item.icon}</span>
              {sidebarOpen && (
                <>
                  <span className="jl-nav-label">{item.label}</span>
                  {item.live && <span className="jl-live-badge">LIVE</span>}
                  {item.page === PAGES.NOTIFICATIONS && unreadNotifs > 0 && (
                    <span className="jl-badge-count">{unreadNotifs}</span>
                  )}
                  {item.page === PAGES.MESSAGES && unreadMsgs > 0 && (
                    <span className="jl-badge-count">{unreadMsgs}</span>
                  )}
                </>
              )}
              {!sidebarOpen && item.page === PAGES.NOTIFICATIONS && unreadNotifs > 0 && (
                <span className="jl-badge-dot" />
              )}
            </button>
          ))}
        </nav>

        {/* Logout */}
        <button className="jl-logout" onClick={handleLogout} title={!sidebarOpen ? "Déconnexion" : ""}>
          <span className="jl-nav-icon">↩</span>
          {sidebarOpen && <span>Déconnexion</span>}
        </button>
      </aside>

      {/* ── MAIN ── */}
      <main className="jl-main">
        {/* Topbar */}
        <div className="jl-topbar">
          <button className="jl-burger-mobile" onClick={() => setSidebarOpen(s => !s)}>☰</button>
          <span className="jl-topbar-brand">Swafy</span>
          <div className="jl-topbar-search">
            <span>🔍</span>
            <input placeholder="Rechercher…" />
          </div>
          <div className="jl-topbar-avatar" onClick={() => setActivePage(PAGES.PROFILE)}>
            <img
              src={getAvatar(user?.photo_user, user?.sexe)}
              alt="avatar"
              onError={e => e.target.src = "https://randomuser.me/api/portraits/men/44.jpg"}
            />
          </div>
        </div>

        {/* Content */}
        {isFullPage ? (
          <div className="jl-full-page"><JeuneContact /></div>
        ) : (
          <div className="jl-scroll">
            <div className="jl-content">{renderContent()}</div>
          </div>
        )}
      </main>

      {/* ── RIGHT PANEL ── */}
      {!isFullPage && (
        <aside className="jl-right">
          {/* Tab switcher */}
          <div className="jl-right-tabs">
            <button
              className={`jl-right-tab ${rightTab === "profile" ? "active" : ""}`}
              onClick={() => setRightTab("profile")}
            >
              👤 Profil
            </button>
            <button
              className={`jl-right-tab ${rightTab === "chatbot" ? "active" : ""}`}
              onClick={() => setRightTab("chatbot")}
            >
              🤖 Assistant
            </button>
          </div>

          {rightTab === "profile" ? (
            <div className="jl-profile-panel">
              {/* Avatar */}
              <div className="jl-rp-avatar-wrap" onClick={() => setActivePage(PAGES.PROFILE)}>
                <img
                  src={getAvatar(user?.photo_user, user?.sexe)}
                  alt="avatar"
                  className="jl-rp-avatar"
                  onError={e => e.target.src = "https://randomuser.me/api/portraits/men/44.jpg"}
                />
                <span className="jl-rp-online" />
              </div>
              <p className="jl-rp-name">{user?.prenom_user} {user?.nom_user}</p>
              <p className="jl-rp-email">{user?.email_user}</p>
              <span className="jl-rp-role">● Jeune membre · Swafy</span>

              {/* Stats */}
              <div className="jl-rp-stats">
                <div className="jl-rp-stat">
                  <span className="jl-rp-num">{publications.length}</span>
                  <span className="jl-rp-lbl">Posts</span>
                </div>
                <div className="jl-rp-divider" />
                <div className="jl-rp-stat">
                  <span className="jl-rp-num">{unreadNotifs}</span>
                  <span className="jl-rp-lbl">Notifs</span>
                </div>
                <div className="jl-rp-divider" />
                <div className="jl-rp-stat">
                  <span className="jl-rp-num">{unreadMsgs}</span>
                  <span className="jl-rp-lbl">Messages</span>
                </div>
              </div>

              <button className="jl-rp-btn" onClick={() => setActivePage(PAGES.PROFILE)}>
                Voir mon profil →
              </button>
            </div>
          ) : (
            <div className="jl-chatbot-panel">
              <div className="jl-chatbot-header">
                <span>🤖</span>
                <div>
                  <p className="jl-chatbot-title">Assistant IA</p>
                  <p className="jl-chatbot-sub">Disponible 24h/24</p>
                </div>
                <span className="jl-chatbot-live-dot">● Live</span>
              </div>
              <div className="jl-chatbot-body">
                <Chatbot />
              </div>
            </div>
          )}
        </aside>
      )}
    </div>
  );
}
