import React, { useState, useEffect } from "react";
import { useNavigate, Outlet } from "react-router-dom";
import { io } from "socket.io-client";
import API from "../services/api";
import PublicationCard from "../components/PublicationCard";
import Chatbot from "../components/Chatbot";
import "./JeuneLayout.css";

// On récupère l'URL de base depuis l'instance API pour plus de flexibilité
const BACKEND = API.defaults.baseURL?.split("/api")[0] || "https://debat-jeune-production.up.railway.app";

const getAvatar = (photo, sexe) => {
  if (photo) return photo.startsWith("http") ? photo : `${BACKEND}/${photo}`;
  return sexe === "femme"
    ? "https://randomuser.me/api/portraits/women/44.jpg"
    : "https://randomuser.me/api/portraits/men/44.jpg";
};

const NAV_ITEMS = [
  { icon: "⌂", label: "Accueil", path: "/jeune", active: true },
  { icon: "✉", label: "Messages", path: "/messenger", badge: "2" },
  { icon: "+", label: "Publier", path: "/publier" },
  { icon: "📅", label: "Calendrier" },
  { icon: "◉", label: "Live & Archive", badge: "2", badgeGreen: true },
  { icon: "🔔", label: "Notifications", path: "/notifications" },
  { icon: "⚙", label: "Paramètres", path: "/settings" },
];

const JeuneLayout = () => {
  const [user, setUser] = useState(() => {
    try {
      const saved = localStorage.getItem("user");
      return saved ? JSON.parse(saved) : null;
    } catch (error) {
      return null;
    }
  });
  const navigate = useNavigate();
  const token = localStorage.getItem("token");

 
  const [publications, setPublications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [highlightedPub, setHighlightedPub] = useState(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [activeNav, setActiveNav] = useState(0);

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

useEffect(() => {
  const token = localStorage.getItem("token"); // 💡 Thabet esmou "token" walla "token_user"

  if (!token) {
    console.error("No token found in localStorage");
    return;
  }

  const newSocket = io("https://debat-jeune-production.up.railway.app", {
    auth: { token }, // 💡 Hna lezem ykoun el token maktoub s7i7
    transports: ["websocket"]
  });

  newSocket.on("connect_error", (err) => {
    console.error("Socket connection error:", err.message);
  });

  return () => newSocket.disconnect();
}, []);

  useEffect(() => {
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

  useEffect(() => { fetchPublications(); }, []);

  const fetchPublications = async () => {
    try {
      setLoading(true);
      const res = await API.get("/publications");
      // On s'assure que res.data est bien un tableau pour éviter le crash .length
      setPublications(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      console.error(err);
      // En cas d'erreur, on initialise à un tableau vide
      setPublications([]);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    window.location.href = "/login";
  };

  const handleNav = (item, idx) => {
    setActiveNav(idx);
    if (item.path) navigate(item.path);
    setSidebarOpen(false);
  };

  return (
    <div className={`jl-container jl-root ${!sidebarOpen ? "sidebar-closed" : ""}`}>
      {/* Animated background orbs */}
      <div className="jl-orb jl-orb1" />
      <div className="jl-orb jl-orb2" />
      <div className="jl-orb jl-orb3" />

      {/* Mobile overlay */}
      {sidebarOpen && (
        <div className="jl-overlay" onClick={() => setSidebarOpen(false)} />
      )}

      {/* ── SIDEBAR ── */}
      <aside className={`jl-sidebar ${sidebarOpen ? "open" : "closed"}`}>
        <div className="jl-sidebar-logo" onClick={toggleSidebar} style={{ cursor: "pointer" }}>
          <div className="jl-logo-icon">S</div>
          <span className="jl-logo-text">Swafy</span>
        </div>

        <nav className="jl-nav">
          {NAV_ITEMS.map((item, idx) => (
            <button
              key={idx}
              className={`jl-nav-item ${activeNav === idx ? "active" : ""}`}
              onClick={() => handleNav(item, idx)}
            >
              <span className="jl-nav-icon">{item.icon}</span>
              <span className="jl-nav-label">{item.label}</span>
              {item.badge && (
                <span className={`jl-badge ${item.badgeGreen ? "green" : ""}`}>
                  {item.badge}
                </span>
              )}
            </button>
          ))}
        </nav>

        <button className="jl-logout" onClick={handleLogout}>
          <span>↩</span>
          <span>Déconnexion</span>
        </button>
      </aside>

      {/* ── MAIN ── */}
      <main className="jl-main">

        {/* Top bar (mobile) */}
        <div className="jl-topbar">
          <button className="jl-burger" onClick={() => setSidebarOpen(!sidebarOpen)}>
            ☰
          </button>
          <span className="jl-topbar-title">Swafy</span>
          <div
            className="jl-topbar-avatar"
            onClick={() => navigate("/profile")}
          >
            <img
              src={getAvatar(user?.photo_user, user?.sexe)}
              alt="avatar"
              onError={e => e.target.src = "https://randomuser.me/api/portraits/men/44.jpg"}
            />
          </div>
        </div>

        <div className="jl-scroll">

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

          {/* Stat cards */}
          <div className="jl-stats">
            {[
              { label: "Profil", sub: "Compte actif", icon: "👤", color: "#a78bfa", path: "/profile" },
              { label: "Publications", sub: `${publications?.length || 0} posts`, icon: "✦", color: "#60a5fa", path: "/publier" },
              { label: "Live", sub: "Débats en direct", icon: "◉", color: "#f472b6" },
              { label: "Messages", sub: "2 non lus", icon: "✉", color: "#34d399" },
            ].map((card, i) => (
              <div
                key={i}
                className="jl-stat-card"
                onClick={() => card.path && navigate(card.path)}
                style={{ "--accent": card.color, animationDelay: `${i * 0.08}s` }}
              >
                <div className="jl-stat-icon">{card.icon}</div>
                <div>
                  <p className="jl-stat-label">{card.label}</p>
                  <p className="jl-stat-sub">{card.sub}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Action banners */}
          <div className="jl-banners">
            <div className="jl-banner jl-banner-live">
              <div className="jl-banner-body">
                <span className="jl-banner-tag">EN DIRECT</span>
                <h2>Sessions Live<br />Interactives</h2>
                <button className="jl-banner-btn">Rejoindre →</button>
              </div>
              <img
                src="https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=300&q=80"
                alt="live"
                className="jl-banner-img"
              />
            </div>
            <div className="jl-banner jl-banner-enquete">
              <div className="jl-banner-body">
                <span className="jl-banner-tag">NOUVEAU</span>
                <h2>Participez aux<br />Enquêtes</h2>
                <button className="jl-banner-btn">Participer →</button>
              </div>
              <img
                src="https://images.unsplash.com/photo-1606326608606-aa0b62935f2b?w=300&q=80"
                alt="enquete"
                className="jl-banner-img"
              />
            </div>
          </div>

          {/* Feed */}
          <div className="jl-content-area">
            <Outlet /> {/* C'est ici que s'afficheront les pages enfants */}
            
            <section className="jl-feed">
            <div className="jl-feed-header">
              <h2 className="jl-feed-title">Fil d'actualité</h2>
              <button
                className="jl-publish-btn"
                onClick={() => navigate("/publier")}
              >
                + Publier
              </button>
            </div>

            {loading ? (
              <div className="jl-loading">
                <div className="jl-spinner" />
                <p>Chargement…</p>
              </div>
            ) : publications.length === 0 ? (
              <div className="jl-empty">
                <span style={{ fontSize: 40 }}>✦</span>
                <p>Aucune publication pour le moment</p>
                <button onClick={() => navigate("/publier")} className="jl-empty-btn">
                  Créer la première publication
                </button>
              </div>
            ) : (
              publications.map(pub => (
                <div
                  key={pub.id_publication}
                  id={`pub-${pub.id_publication}`}
                  className={highlightedPub === pub.id_publication ? "jl-highlighted" : ""}
                >
                  <PublicationCard
                    publication={pub}
                    onUpdate={fetchPublications}
                  />
                </div>
              ))
            )}
          </section>
          </div>
        </div>
      </main>

      {/* ── RIGHT SIDEBAR ── */}
      <aside className="jl-right">

        {/* Profile card */}
        <div
          className="jl-profile-card"
          onClick={() => navigate("/profile")}
        >
          <img
            src={getAvatar(user?.photo_user, user?.sexe)}
            alt="avatar"
            className="jl-profile-avatar"
            onError={e => e.target.src = "https://randomuser.me/api/portraits/men/44.jpg"}
          />
          <div className="jl-profile-info">
            <p className="jl-profile-name">
              {user?.prenom_user} {user?.nom_user}
            </p>
            <p className="jl-profile-email">{user?.email_user}</p>
            <span className="jl-profile-role">Jeune membre · Swafy</span>
          </div>
          <span className="jl-profile-arrow">→</span>
        </div>

        {/* Chatbot */}
        <div className="jl-chatbot-wrap">
          <Chatbot />
        </div>
      </aside>
    </div>
  );
};

export default JeuneLayout;