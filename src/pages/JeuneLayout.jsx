import React, { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { io } from "socket.io-client";
import API from "../services/api";
import PublicationCard from "../components/PublicationCard";
import Chatbot from "../components/Chatbot";
import JeuneContact from "./JeuneContact";
import "./JeuneLayout.css";

/* ─── helpers ─── */
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
  HOME:          "home",
  MESSAGES:      "messages",
  NOTIFICATIONS: "notifications",
  SETTINGS:      "settings",
  PUBLIER:       "publier",
  CALENDAR:      "calendar",
  LIVE:          "live",
};

/* ════════════════════════════════════════════════════
   JEUNE LAYOUT
════════════════════════════════════════════════════ */
const JeuneLayout = () => {

  /* ── user ── */
  const [user] = useState(() => {
    try { return JSON.parse(localStorage.getItem("user")) || null; }
    catch { return null; }
  });

  const navigate = useNavigate();

  /* ── UI ── */
  const [activePage,     setActivePage]     = useState(PAGES.HOME);
  const [sidebarOpen,    setSidebarOpen]    = useState(true);   // desktop expand
  const [mobileOpen,     setMobileOpen]     = useState(false);  // mobile overlay

  /* ── data ── */
  const [publications,   setPublications]   = useState([]);
  const [loading,        setLoading]        = useState(true);
  const [highlightedPub, setHighlightedPub] = useState(null);
  const [unreadMessages, setUnreadMessages] = useState(0);
  const [unreadNotifs,   setUnreadNotifs]   = useState(0);
  const [notifications,  setNotifications]  = useState([]);

  /* ── publish form ── */
  const [pubTitle,  setPubTitle]  = useState("");
  const [pubBody,   setPubBody]   = useState("");
  const [pubCat,    setPubCat]    = useState("");
  const [pubVis,    setPubVis]    = useState("public");
  const [pubBusy,   setPubBusy]   = useState(false);

  /* ════ socket ════ */
  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) return;
    const socket = io(BACKEND, { auth: { token }, transports: ["websocket"] });
    socket.on("connect_error", (e) => console.error("Socket:", e.message));
    socket.on("new_message", () => setUnreadMessages((n) => n + 1));
    return () => socket.disconnect();
  }, []);

  /* ════ fetch ════ */
  const fetchPublications = useCallback(async () => {
    try {
      setLoading(true);
      const res = await API.get("/publications");
      setPublications(Array.isArray(res.data) ? res.data : []);
    } catch { setPublications([]); }
    finally   { setLoading(false); }
  }, []);

  const fetchNotifications = useCallback(async () => {
    try {
      const res = await API.get("/notifications");
      const list = Array.isArray(res.data) ? res.data : [];
      setNotifications(list);
      setUnreadNotifs(list.filter((n) => !n.is_read).length);
    } catch {}
  }, []);

  useEffect(() => {
    fetchPublications();
    fetchNotifications();
    const params = new URLSearchParams(window.location.search);
    const pubId  = params.get("publication");
    if (pubId) {
      setHighlightedPub(parseInt(pubId));
      setTimeout(() => {
        document.getElementById(`pub-${pubId}`)
          ?.scrollIntoView({ behavior: "smooth", block: "center" });
      }, 900);
    }
  }, []);

  /* ════ actions ════ */
  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    window.location.href = "/login";
  };

  const goTo = (page) => {
    setActivePage(page);
    setMobileOpen(false);
  };

  const markNotifRead = async (id) => {
    try {
      await API.put(`/notifications/${id}/read`);
      fetchNotifications();
    } catch {}
  };

  const handlePublierSubmit = async (e) => {
    e.preventDefault();
    if (!pubTitle.trim() || !pubBody.trim()) return;
    try {
      setPubBusy(true);
      await API.post("/publications", {
        titre_publication:   pubTitle,
        contenu_publication: pubBody,
        categorie:           pubCat,
        visibilite:          pubVis,
      });
      setPubTitle(""); setPubBody(""); setPubCat(""); setPubVis("public");
      await fetchPublications();
      setActivePage(PAGES.HOME);
    } catch (err) { console.error(err); }
    finally { setPubBusy(false); }
  };

  /* ════ nav items ════ */
  const NAV = [
    { icon: "⌂",  label: "Accueil",       page: PAGES.HOME },
    { icon: "✉",  label: "Messages",      page: PAGES.MESSAGES,      badge: unreadMessages || null },
    { icon: "+",  label: "Publier",        page: PAGES.PUBLIER },
    { icon: "📅", label: "Calendrier",    page: PAGES.CALENDAR },
    { icon: "◉",  label: "Live",          page: PAGES.LIVE,          live: true },
    { icon: "🔔", label: "Notifications", page: PAGES.NOTIFICATIONS, badge: unreadNotifs || null },
    { icon: "⚙",  label: "Paramètres",   page: PAGES.SETTINGS },
  ];

  /* ════ page content ════ */
  const renderContent = () => {
    switch (activePage) {

      /* ── MESSAGES ── */
      case PAGES.MESSAGES:
        return <JeuneContact />;

      /* ── NOTIFICATIONS ── */
      case PAGES.NOTIFICATIONS:
        return (
          <div className="jl-page">
            <h2 className="jl-sec-title">🔔 Notifications</h2>
            {notifications.length === 0 ? (
              <div className="jl-empty">
                <span className="jl-empty-ico">🔔</span>
                <p>Aucune notification pour le moment</p>
              </div>
            ) : notifications.map((n, i) => (
              <div
                key={n.id_notification}
                className={`jl-notif-item${n.is_read ? "" : " unread"}`}
                style={{ animationDelay: `${i * 0.06}s` }}
                onClick={() => markNotifRead(n.id_notification)}
              >
                <div className="jl-notif-ico">
                  {n.type_notification === "new_post" ? "📝"
                 : n.type_notification === "publication_comment" ? "💬" : "🔔"}
                </div>
                <div style={{ flex: 1 }}>
                  <p className="jl-notif-msg">{n.message}</p>
                  <p className="jl-notif-time">
                    {new Date(n.created_at).toLocaleString("fr-FR")}
                  </p>
                </div>
                {!n.is_read && <span className="jl-notif-dot" />}
              </div>
            ))}
          </div>
        );

      /* ── PUBLIER ── */
      case PAGES.PUBLIER:
        return (
          <div className="jl-page">
            <h2 className="jl-sec-title">✦ Nouvelle publication</h2>
            <div className="jl-card jl-form-card">
              <form onSubmit={handlePublierSubmit}>
                <div className="jl-fg">
                  <label className="jl-fl">Titre</label>
                  <input className="jl-fi" placeholder="Un titre accrocheur…"
                    value={pubTitle} onChange={(e) => setPubTitle(e.target.value)} required />
                </div>
                <div className="jl-fg">
                  <label className="jl-fl">Contenu</label>
                  <textarea className="jl-fi jl-fi-ta"
                    placeholder="Partagez vos idées, opinions ou expériences…"
                    value={pubBody} onChange={(e) => setPubBody(e.target.value)} required />
                </div>
                <div className="jl-form-row">
                  <div className="jl-fg">
                    <label className="jl-fl">Catégorie</label>
                    <select className="jl-fi" value={pubCat} onChange={(e) => setPubCat(e.target.value)}>
                      <option value="">Sélectionner…</option>
                      <option value="education">Éducation</option>
                      <option value="environnement">Environnement</option>
                      <option value="culture">Culture</option>
                      <option value="politique">Politique</option>
                      <option value="sante">Santé</option>
                      <option value="technologie">Technologie</option>
                    </select>
                  </div>
                  <div className="jl-fg">
                    <label className="jl-fl">Visibilité</label>
                    <select className="jl-fi" value={pubVis} onChange={(e) => setPubVis(e.target.value)}>
                      <option value="public">Public</option>
                      <option value="membres">Membres seulement</option>
                    </select>
                  </div>
                </div>
                <div className="jl-media-row">
                  <button type="button" className="jl-media-btn">📷 Photo</button>
                  <button type="button" className="jl-media-btn">🎬 Vidéo</button>
                  <button type="button" className="jl-media-btn">🔗 Lien</button>
                </div>
                <button type="submit" className="jl-submit-btn" disabled={pubBusy}>
                  {pubBusy ? "Publication en cours…" : "✦ Publier maintenant"}
                </button>
              </form>
            </div>

            <h2 className="jl-sec-title" style={{ marginTop: 12 }}>Mes publications récentes</h2>
            {publications.slice(0, 2).map((pub) => (
              <PublicationCard key={pub.id_publication} publication={pub} onUpdate={fetchPublications} />
            ))}
          </div>
        );

      /* ── CALENDAR ── */
      case PAGES.CALENDAR:
        return (
          <div className="jl-page">
            <h2 className="jl-sec-title">📅 Calendrier des événements</h2>
            {[
              { ico: "📚", title: "Débat : Réforme éducative",       date: "Lun 12 Mai · 18h00" },
              { ico: "🌱", title: "Live : Environnement & Jeunesse", date: "Mer 14 Mai · 20h00" },
              { ico: "📊", title: "Enquête nationale : Emploi",      date: "Ven 16 Mai · Toute la journée" },
              { ico: "🎤", title: "Atelier : Prise de parole",       date: "Sam 17 Mai · 10h00" },
            ].map((ev, i) => (
              <div className="jl-event-item" key={i} style={{ animationDelay: `${i * 0.08}s` }}>
                <div className="jl-event-dot">{ev.ico}</div>
                <div>
                  <p className="jl-event-title">{ev.title}</p>
                  <p className="jl-event-meta">{ev.date}</p>
                </div>
                <button className="jl-event-btn">S'inscrire</button>
              </div>
            ))}
          </div>
        );

      /* ── LIVE ── */
      case PAGES.LIVE:
        return (
          <div className="jl-page">
            <h2 className="jl-sec-title">◉ Sessions Live</h2>
            <div className="jl-live-banner">
              <div className="jl-live-top">
                <span className="jl-live-badge">● LIVE</span>
                <span className="jl-live-desc">Débat : L'avenir de la jeunesse tunisienne</span>
              </div>
              <div className="jl-live-screen">
                <div style={{ textAlign: "center" }}>
                  <div style={{ fontSize: 40, marginBottom: 8 }}>🎙️</div>
                  <p style={{ color: "rgba(255,255,255,0.75)", fontSize: 13 }}>342 spectateurs en direct</p>
                </div>
              </div>
              <button className="jl-submit-btn">Rejoindre le Live →</button>
            </div>
            <h2 className="jl-sec-title" style={{ marginTop: 10 }}>Prochains lives</h2>
            {[
              { title: "Santé mentale des jeunes",     date: "Demain · 19h00" },
              { title: "Entrepreneuriat & Innovation",  date: "Jeudi · 20h00" },
            ].map((l, i) => (
              <div className="jl-event-item" key={i} style={{ animationDelay: `${i * 0.08}s` }}>
                <div className="jl-event-dot">🎙️</div>
                <div>
                  <p className="jl-event-title">{l.title}</p>
                  <p className="jl-event-meta">{l.date}</p>
                </div>
                <button className="jl-event-btn">Rappel</button>
              </div>
            ))}
          </div>
        );

      /* ── SETTINGS ── */
      case PAGES.SETTINGS:
        return (
          <div className="jl-page">
            <h2 className="jl-sec-title">⚙ Paramètres</h2>
            {[
              { ico: "👤", label: "Informations personnelles", sub: "Nom, photo, bio",      path: "/profile" },
              { ico: "🔔", label: "Notifications",             sub: "Email, push, SMS" },
              { ico: "🔒", label: "Confidentialité",           sub: "Visibilité du profil" },
              { ico: "🎨", label: "Apparence",                 sub: "Thème, langue" },
              { ico: "🛡️", label: "Sécurité",                  sub: "Mot de passe, 2FA" },
            ].map((s, i) => (
              <div
                key={i}
                className="jl-settings-item"
                style={{ animationDelay: `${i * 0.07}s`, cursor: s.path ? "pointer" : "default" }}
                onClick={() => s.path && navigate(s.path)}
              >
                <div className="jl-settings-ico">{s.ico}</div>
                <div>
                  <p className="jl-settings-label">{s.label}</p>
                  <p className="jl-settings-sub">{s.sub}</p>
                </div>
                <span className="jl-settings-arr">›</span>
              </div>
            ))}
          </div>
        );

      /* ── HOME ── */
      default:
        return (
          <div className="jl-page">

            {/* Welcome */}
            <section className="jl-welcome">
              <div>
                <p className="jl-welcome-tag">Tableau de bord</p>
                <h1 className="jl-welcome-h1">
                  Bonjour, <span className="jl-welcome-name">{user?.prenom_user || "Jeune"}</span> 👋
                </h1>
                <p className="jl-welcome-sub">
                  Bienvenue dans votre espace — explorez, publiez, débattez.
                </p>
              </div>
              <div className="jl-welcome-art">
                <div className="jl-ring" /><div className="jl-ring" /><div className="jl-ring" />
                <div className="jl-ring-center">✦</div>
              </div>
            </section>

            {/* Stats */}
            <div className="jl-stats">
              {[
                { label: "Profil",       sub: "Compte actif",                          icon: "👤", color: "#5a3fa0", action: () => navigate("/profile") },
                { label: "Publications", sub: `${publications?.length || 0} posts`,    icon: "✦",  color: "#3b82f6", action: () => setActivePage(PAGES.PUBLIER) },
                { label: "Live",         sub: "Débats en direct",                      icon: "◉",  color: "#ec4899" },
                { label: "Messages",     sub: unreadMessages ? `${unreadMessages} non lus` : "Aucun message",
                                                                                       icon: "✉",  color: "#10b981", action: () => setActivePage(PAGES.MESSAGES) },
              ].map((c, i) => (
                <div
                  key={i}
                  className="jl-stat-card"
                  style={{ "--accent": c.color, animationDelay: `${i * 0.08}s`, cursor: c.action ? "pointer" : "default" }}
                  onClick={c.action}
                >
                  <div className="jl-stat-ico">{c.icon}</div>
                  <div>
                    <p className="jl-stat-label">{c.label}</p>
                    <p className="jl-stat-sub">{c.sub}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* Banners */}
            <div className="jl-banners">
              <div className="jl-banner jl-ban-live">
                <div className="jl-banner-body">
                  <span className="jl-banner-tag">EN DIRECT</span>
                  <h2>Sessions Live<br />Interactives</h2>
                  <button className="jl-banner-btn" onClick={() => goTo(PAGES.LIVE)}>Rejoindre →</button>
                </div>
                <img
                  src="https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=300&q=80"
                  alt="live" className="jl-banner-img"
                  onError={(e) => { e.target.style.display = "none"; }}
                />
              </div>
              <div className="jl-banner jl-ban-enquete">
                <div className="jl-banner-body">
                  <span className="jl-banner-tag">NOUVEAU</span>
                  <h2>Participez aux<br />Enquêtes</h2>
                  <button className="jl-banner-btn">Participer →</button>
                </div>
                <img
                  src="https://images.unsplash.com/photo-1606326608606-aa0b62935f2b?w=300&q=80"
                  alt="enquete" className="jl-banner-img"
                  onError={(e) => { e.target.style.display = "none"; }}
                />
              </div>
            </div>

            {/* Feed */}
            <h2 className="jl-sec-title">Fil d'actualité</h2>
            {loading ? (
              <div className="jl-spinner-wrap"><div className="jl-spinner" /></div>
            ) : publications.length === 0 ? (
              <div className="jl-empty">
                <span className="jl-empty-ico">✦</span>
                <p>Aucune publication pour le moment</p>
              </div>
            ) : (
              publications.map((pub) => (
                <div
                  key={pub.id_publication}
                  id={`pub-${pub.id_publication}`}
                  className={highlightedPub === pub.id_publication ? "jl-highlighted" : ""}
                >
                  <PublicationCard publication={pub} onUpdate={fetchPublications} />
                </div>
              ))
            )}
          </div>
        );
    }
  };

  /* ════════════════════════════════════════════════════
     JSX
  ════════════════════════════════════════════════════ */
  return (
    <div className="jl-root">
      {/* bg orbs */}
      <div className="jl-orb jl-orb1" aria-hidden="true" />
      <div className="jl-orb jl-orb2" aria-hidden="true" />
      <div className="jl-orb jl-orb3" aria-hidden="true" />

      {/* mobile overlay */}
      {mobileOpen && (
        <div className="jl-overlay" onClick={() => setMobileOpen(false)} />
      )}

      {/* ══ SIDEBAR ══ */}
      <aside
        className={[
          "jl-sidebar",
          sidebarOpen ? "sb-open" : "sb-col",
          mobileOpen  ? "sb-mobile" : "",
        ].join(" ")}
      >
        {/* Logo */}
        <div className="jl-sb-logo" onClick={() => setSidebarOpen((o) => !o)}>
          <div className="jl-logo-ico">S</div>
          <span className="jl-logo-txt">Swafy</span>
        </div>

        {/* Menu toggle btn — same as AdminDashboard */}
        <button className="jl-menu-btn" onClick={() => setSidebarOpen((o) => !o)}>
          <span>☰</span>
          <span className="jl-menu-label">Menu</span>
        </button>

        {/* Nav */}
        <nav className="jl-nav">
          {NAV.map((item, idx) => (
            <button
              key={idx}
              className={`jl-nav-item${activePage === item.page ? " active" : ""}`}
              onClick={() => goTo(item.page)}
            >
              <span className="jl-nav-ico">{item.icon}</span>
              <span className="jl-nav-lbl">{item.label}</span>
              {item.badge && <span className="jl-badge">{item.badge}</span>}
              {item.live  && <span className="jl-badge-live">LIVE</span>}
            </button>
          ))}
        </nav>

        {/* Logout */}
        <button className="jl-exit-btn" onClick={handleLogout}>
          <span className="jl-nav-ico">↩</span>
          <span className="jl-nav-lbl">Déconnexion</span>
        </button>
      </aside>

      {/* ══ MAIN ══ */}
      <main className={`jl-main${sidebarOpen ? " ml-open" : " ml-col"}`}>

        {/* Topbar */}
        <div className="jl-topbar">
          <button
            className="jl-burger"
            onClick={() => {
              if (window.innerWidth < 860) setMobileOpen((o) => !o);
              else setSidebarOpen((o) => !o);
            }}
          >
            ☰
          </button>
          <span className="jl-topbar-title">Swafy</span>
          <div className="jl-topbar-ava" onClick={() => navigate("/profile")}>
            <img
              src={getAvatar(user?.photo_user, user?.sexe)}
              alt="avatar"
              onError={(e) => { e.target.src = "https://randomuser.me/api/portraits/men/44.jpg"; }}
            />
          </div>
        </div>

        {/* Content */}
        {activePage === PAGES.MESSAGES ? (
          <div className="jl-messages-full">
            <JeuneContact />
          </div>
        ) : (
          <div className="jl-scroll">
            {renderContent()}
          </div>
        )}
      </main>

      {/* ══ RIGHT SIDEBAR ══ */}
      {activePage !== PAGES.MESSAGES && (
        <aside className="jl-right">
          {/* Profile card */}
          <div className="jl-profile-card" onClick={() => navigate("/profile")}>
            <div className="jl-prow">
              <img
                className="jl-pava"
                src={getAvatar(user?.photo_user, user?.sexe)}
                alt="avatar"
                onError={(e) => { e.target.src = "https://randomuser.me/api/portraits/men/44.jpg"; }}
              />
              <div className="jl-pinfo">
                <p className="jl-pname">{user?.prenom_user} {user?.nom_user}</p>
                <p className="jl-pemail">{user?.email_user}</p>
              </div>
              <span className="jl-parr">→</span>
            </div>
            <span className="jl-prole">● Jeune membre · Swafy</span>
          </div>

          {/* Chatbot */}
          <div className="jl-chatbot-wrap">
            <Chatbot />
          </div>
        </aside>
      )}
    </div>
  );
};

export default JeuneLayout;