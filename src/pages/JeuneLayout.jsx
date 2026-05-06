import React, { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { io } from "socket.io-client";
import API from "../services/api";
import PublicationCard from "../components/PublicationCard";
import Chatbot from "../components/Chatbot";
import JeuneContact from "./JeuneContact";
import "./JeuneLayout.css";

const BACKEND = API.defaults.baseURL?.split("/api")[0] || "https://debat-jeune-production.up.railway.app";

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
  SETTINGS: "settings",
  PUBLIER: "publier",
};

const JeuneLayout = () => {
  const [user, setUser] = useState(() => {
    try { return JSON.parse(localStorage.getItem("user")) || null; }
    catch { return null; }
  });

  const navigate = useNavigate();
  const [activePage, setActivePage] = useState(PAGES.HOME);
  const [publications, setPublications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [highlightedPub, setHighlightedPub] = useState(null);
  const [unreadMessages, setUnreadMessages] = useState(0);
  const [unreadNotifs, setUnreadNotifs] = useState(0);
  const [notifications, setNotifications] = useState([]);

  // ── Socket ──
  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) return;
    const socket = io(BACKEND, { auth: { token }, transports: ["websocket"] });
    socket.on("connect_error", (err) => console.error("Socket error:", err.message));
    return () => socket.disconnect();
  }, []);

  // ── Fetch publications ──
  const fetchPublications = useCallback(async () => {
    try {
      setLoading(true);
      const res = await API.get("/publications");
      setPublications(Array.isArray(res.data) ? res.data : []);
    } catch { setPublications([]); }
    finally { setLoading(false); }
  }, []);

  // ── Fetch notifications ──
  const fetchNotifications = useCallback(async () => {
    try {
      const res = await API.get("/notifications");
      const notifs = Array.isArray(res.data) ? res.data : [];
      setNotifications(notifs);
      setUnreadNotifs(notifs.filter(n => !n.is_read).length);
    } catch {}
  }, []);

  useEffect(() => {
    fetchPublications();
    fetchNotifications();
    const params = new URLSearchParams(window.location.search);
    const pubId = params.get("publication");
    if (pubId) {
      setHighlightedPub(parseInt(pubId));
      setTimeout(() => {
        const el = document.getElementById(`pub-${pubId}`);
        if (el) el.scrollIntoView({ behavior: "smooth", block: "center" });
      }, 1000);
    }
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    window.location.href = "/login";
  };

  const NAV_ITEMS = [
    { icon: "⌂", label: "Accueil", page: PAGES.HOME },
    { icon: "✉", label: "Messages", page: PAGES.MESSAGES, badge: unreadMessages || null },
    { icon: "📅", label: "Calendrier", path: "/calendar" },
    { icon: "◉", label: "Live", badgeGreen: true },
    { icon: "🔔", label: "Notifications", page: PAGES.NOTIFICATIONS, badge: unreadNotifs || null },
    { icon: "⚙", label: "Paramètres", path: "/settings" },
  ];

  const handleNav = (item) => {
    setSidebarOpen(false);
    if (item.page) { setActivePage(item.page); return; }
    if (item.path) navigate(item.path);
  };

  const markNotifRead = async (id) => {
    try {
      await API.put(`/notifications/${id}/read`);
      fetchNotifications();
    } catch {}
  };

  // ── Render page content ──
  const renderContent = () => {
    if (activePage === PAGES.MESSAGES) return <JeuneContact />;

    if (activePage === PAGES.NOTIFICATIONS) return (
      <div style={{ padding: "0 4px" }}>
        <h2 style={{ fontFamily: "var(--font-h)", fontSize: 22, marginBottom: 20, color: "var(--text)" }}>
          🔔 Notifications
        </h2>
        {notifications.length === 0 ? (
          <div className="jl-empty"><p>Aucune notification</p></div>
        ) : notifications.map(n => (
          <div key={n.id_notification} onClick={() => markNotifRead(n.id_notification)}
            style={{
              background: n.is_read ? "rgba(255,255,255,0.05)" : "rgba(124,92,252,0.15)",
              border: `1px solid ${n.is_read ? "var(--border)" : "var(--purple)"}`,
              borderRadius: 14, padding: "14px 18px", marginBottom: 10,
              cursor: "pointer", transition: "all 0.2s",
              display: "flex", alignItems: "center", gap: 14,
            }}>
            <div style={{ fontSize: 22 }}>
              {n.type_notification === "new_post" ? "📝" :
               n.type_notification === "publication_comment" ? "💬" : "🔔"}
            </div>
            <div style={{ flex: 1 }}>
              <p style={{ color: "var(--text)", fontSize: 14, fontWeight: n.is_read ? 400 : 700 }}>
                {n.message}
              </p>
              <p style={{ color: "var(--muted)", fontSize: 12, marginTop: 4 }}>
                {new Date(n.created_at).toLocaleString("fr-FR")}
              </p>
            </div>
            {!n.is_read && (
              <div style={{ width: 10, height: 10, borderRadius: "50%", background: "var(--purple)", flexShrink: 0 }} />
            )}
          </div>
        ))}
      </div>
    );

    // HOME
    return (
      <>
        {/* Welcome */}
        <section className="jl-welcome">
          <div className="jl-welcome-text">
            <p className="jl-welcome-tag">Tableau de bord</p>
            <h1 className="jl-welcome-h1">
              Bonjour, <span>{user?.prenom_user || "Jeune"}</span> 👋
            </h1>
            <p className="jl-welcome-sub">
              Bienvenue dans votre espace — explorez, publiez, débattez.
            </p>
          </div>
          <div className="jl-welcome-art">
            <div className="jl-welcome-ring r1" />
            <div className="jl-welcome-ring r2" />
            <div className="jl-welcome-ring r3" />
          </div>
        </section>

        {/* Stats */}
        <div className="jl-stats">
          {[
            { label: "Profil", sub: "Compte actif", icon: "👤", color: "#a78bfa", action: () => navigate("/profile") },
            { label: "Publications", sub: `${publications?.length || 0} posts`, icon: "✦", color: "#60a5fa", action: () => navigate("/publier") },
            { label: "Live", sub: "Débats en direct", icon: "◉", color: "#f472b6" },
            { label: "Messages", sub: unreadMessages ? `${unreadMessages} non lus` : "Aucun message", icon: "✉", color: "#34d399", action: () => setActivePage(PAGES.MESSAGES) },
          ].map((card, i) => (
            <div key={i} className="jl-stat-card" onClick={card.action}
              style={{ "--accent": card.color, animationDelay: `${i * 0.08}s`, cursor: card.action ? "pointer" : "default" }}>
              <div className="jl-stat-icon">{card.icon}</div>
              <div>
                <p className="jl-stat-label">{card.label}</p>
                <p className="jl-stat-sub">{card.sub}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Banners */}
        <div className="jl-banners">
          <div className="jl-banner jl-banner-live">
            <div className="jl-banner-body">
              <span className="jl-banner-tag">EN DIRECT</span>
              <h2>Sessions Live<br />Interactives</h2>
              <button className="jl-banner-btn">Rejoindre →</button>
            </div>
            <img src="https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=300&q=80" alt="live" className="jl-banner-img" />
          </div>
          <div className="jl-banner jl-banner-enquete">
            <div className="jl-banner-body">
              <span className="jl-banner-tag">NOUVEAU</span>
              <h2>Participez aux<br />Enquêtes</h2>
              <button className="jl-banner-btn">Participer →</button>
            </div>
            <img src="https://images.unsplash.com/photo-1606326608606-aa0b62935f2b?w=300&q=80" alt="enquete" className="jl-banner-img" />
          </div>
        </div>

        {/* Feed */}
        <section className="jl-feed">
          <div className="jl-feed-header">
            <h2 className="jl-feed-title">Fil d'actualité</h2>
          </div>
          {loading ? (
            <div className="jl-loading"><div className="jl-spinner" /><p>Chargement…</p></div>
          ) : publications.length === 0 ? (
            <div className="jl-empty">
              <span style={{ fontSize: 40 }}>✦</span>
              <p>Aucune publication pour le moment</p>
            </div>
          ) : (
            publications.map(pub => (
              <div key={pub.id_publication} id={`pub-${pub.id_publication}`}
                className={highlightedPub === pub.id_publication ? "jl-highlighted" : ""}>
                <PublicationCard publication={pub} onUpdate={fetchPublications} />
              </div>
            ))
          )}
        </section>
      </>
    );
  };

  return (
    <div className={`jl-container jl-root ${!sidebarOpen ? "sidebar-closed" : ""}`}>
      <div className="jl-orb jl-orb1" />
      <div className="jl-orb jl-orb2" />
      <div className="jl-orb jl-orb3" />

      {sidebarOpen && <div className="jl-overlay" onClick={() => setSidebarOpen(false)} />}

      {/* SIDEBAR */}
      <aside className={`jl-sidebar ${sidebarOpen ? "open" : "closed"}`}>
        <div className="jl-sidebar-logo" onClick={() => setSidebarOpen(!sidebarOpen)} style={{ cursor: "pointer" }}>
          <div className="jl-logo-icon">S</div>
          <span className="jl-logo-text">Swafy</span>
        </div>

        <nav className="jl-nav">
          {NAV_ITEMS.map((item, idx) => (
            <button key={idx}
              className={`jl-nav-item ${activePage === item.page ? "active" : ""}`}
              onClick={() => handleNav(item)}>
              <span className="jl-nav-icon">{item.icon}</span>
              <span className="jl-nav-label">{item.label}</span>
              {item.badge ? (
                <span className={`jl-badge ${item.badgeGreen ? "green" : ""}`}>{item.badge}</span>
              ) : null}
            </button>
          ))}
        </nav>

        <button className="jl-logout" onClick={handleLogout}>
          <span>↩</span><span>Déconnexion</span>
        </button>
      </aside>

      {/* MAIN */}
      <main className="jl-main">
        <div className="jl-topbar">
          <button className="jl-burger" onClick={() => setSidebarOpen(!sidebarOpen)}>☰</button>
          <span className="jl-topbar-title">Swafy</span>
          <div className="jl-topbar-avatar" onClick={() => navigate("/profile")}>
            <img src={getAvatar(user?.photo_user, user?.sexe)} alt="avatar"
              onError={e => e.target.src = "https://randomuser.me/api/portraits/men/44.jpg"} />
          </div>
        </div>

        {/* Messages page full height */}
        {activePage === PAGES.MESSAGES ? (
          <div style={{ flex: 1, overflow: "hidden" }}>
            <JeuneContact />
          </div>
        ) : (
          <div className="jl-scroll">
            <div className="jl-content-area">
              {renderContent()}
            </div>
          </div>
        )}
      </main>

      {/* RIGHT SIDEBAR */}
      {activePage !== PAGES.MESSAGES && (
        <aside className="jl-right">

          {/* Profile Card */}
          <div className="jl-profile-card" onClick={() => navigate("/profile")}>
            <div className="jl-profile-avatar-wrap">
              <img src={getAvatar(user?.photo_user, user?.sexe)} alt="avatar"
                className="jl-profile-avatar"
                onError={e => e.target.src = "https://randomuser.me/api/portraits/men/44.jpg"} />
              <span className="jl-profile-online" />
            </div>
            <div className="jl-profile-info">
              <p className="jl-profile-name">{user?.prenom_user} {user?.nom_user}</p>
              <p className="jl-profile-email">{user?.email_user}</p>
              <span className="jl-profile-role">
                <span className="jl-role-dot" />
                Jeune membre · Swafy
              </span>
            </div>
            <span className="jl-profile-arrow">→</span>
          </div>

          {/* Stats rapides */}
          <div className="jl-right-stats">
            <div className="jl-right-stat">
              <span className="jl-right-stat-num">{publications?.length || 0}</span>
              <span className="jl-right-stat-label">Posts</span>
            </div>
            <div className="jl-right-stat-divider" />
            <div className="jl-right-stat">
              <span className="jl-right-stat-num">{unreadNotifs || 0}</span>
              <span className="jl-right-stat-label">Notifs</span>
            </div>
            <div className="jl-right-stat-divider" />
            <div className="jl-right-stat">
              <span className="jl-right-stat-num">{unreadMessages || 0}</span>
              <span className="jl-right-stat-label">Messages</span>
            </div>
          </div>

          {/* Chatbot */}
          <div className="jl-chatbot-wrap">
            <div className="jl-chatbot-header">
              <span className="jl-chatbot-icon">🤖</span>
              <div>
                <p className="jl-chatbot-title">Assistant IA</p>
                <p className="jl-chatbot-sub">Disponible 24h/24</p>
              </div>
              <span className="jl-chatbot-live">● Live</span>
            </div>
            <Chatbot />
          </div>

        </aside>
      )}
    </div>
  );
};
export default JeuneLayout;
