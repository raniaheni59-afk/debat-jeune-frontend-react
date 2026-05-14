import React, { useState, useEffect, useCallback, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { io } from "socket.io-client";
import API from "../services/api";
import PublicationCard from "../components/PublicationCard";
import Chatbot from "../components/Chatbot";
import JeuneContact from "./JeuneContact";
import "./JeuneLayout.css";
import LiveBanner from "../components/LiveBanner";


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
  HOME     : "home",
  MESSAGES : "messages",
  NOTIFS   : "notifications",
  SETTINGS : "settings",
  PUBLIER  : "publier",
  CALENDAR : "calendar",
  LIVE     : "live",
};

/* ═══════════════════════════════════════════════════════════
   SVG ICONS — professionnels (Heroicons style)
═══════════════════════════════════════════════════════════ */
const Icon = ({ name, size = 20 }) => {
  const paths = {
    home     : "M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6",
    message  : "M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z",
    pencil   : "M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z",
    calendar : "M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z",
    radio    : "M8.111 16.404a5.5 5.5 0 017.778 0M12 20h.01m-7.08-7.071c3.904-3.905 10.236-3.905 14.141 0M1.394 9.393c5.857-5.857 15.355-5.857 21.213 0",
    bell     : "M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9",
    settings : "M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z M15 12a3 3 0 11-6 0 3 3 0 016 0z",
    logout   : "M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1",
    menu     : "M4 6h16M4 12h16M4 18h16",
    send     : "M12 19l9 2-9-18-9 18 9-2zm0 0v-8",
    heart    : "M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z",
    "heart-filled": "M11.645 20.91l-.007-.003-.022-.012a15.247 15.247 0 01-.383-.218 25.18 25.18 0 01-4.244-3.17C4.688 15.36 2.25 12.174 2.25 8.25 2.25 5.322 4.714 3 7.688 3A5.5 5.5 0 0112 5.052 5.5 5.5 0 0116.313 3c2.973 0 5.437 2.322 5.437 5.25 0 3.925-2.438 7.111-4.739 9.256a25.175 25.175 0 01-4.244 3.17 15.247 15.247 0 01-.383.219l-.022.012-.007.004-.003.001a.752.752 0 01-.704 0l-.003-.001z",
    comment  : "M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z",
    share    : "M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z",
    clock    : "M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z",
    play     : "M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z M21 12a9 9 0 11-18 0 9 9 0 0118 0z",
    mic      : "M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 016 0v6a3 3 0 01-3 3z",
    check    : "M5 13l4 4L19 7",
    close    : "M6 18L18 6M6 6l12 12",
    chevron  : "M9 5l7 7-7 7",
    user     : "M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z",
    photo    : "M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z",
    video    : "M15 10l4.553-2.069A1 1 0 0121 8.868v6.264a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z",
    link     : "M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1",
    shield   : "M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z",
    lock     : "M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z",
    palette  : "M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01",
    robot    : "M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17H3a2 2 0 01-2-2V5a2 2 0 012-2h3.5a2 2 0 012 2V7h3V5a2 2 0 012-2H19a2 2 0 012 2v10a2 2 0 01-2 2h-2M9 9h6m-6 4h6m-3-8v3",
    star     : "M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z",
    sparkles : "M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z",
    dots     : "M5 12h.01M12 12h.01M19 12h.01M6 12a1 1 0 11-2 0 1 1 0 012 0zm7 0a1 1 0 11-2 0 1 1 0 012 0zm7 0a1 1 0 11-2 0 1 1 0 012 0z",
  };
  const d = paths[name] || paths.dots;
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
      aria-hidden="true">
      {name === "heart-filled"
        ? <path d={d} fill="currentColor" stroke="none" />
        : <path d={d} />}
    </svg>
  );
};

/* ═══════════════════════════════════════════════════════════
   MODAL COMPONENT
═══════════════════════════════════════════════════════════ */
const Toggle = ({ on, onToggle }) => (
  <div
    className={`jl-sw ${on ? "on" : "off"}`}
    onClick={onToggle}
    role="switch"
    aria-checked={on}
    tabIndex={0}
    onKeyDown={(e) => e.key === " " && onToggle()}
  >
    <div className="jl-sw-thumb" />
  </div>
);

const ModalProfile = () => (
  <>
    <div style={{ display:"flex", alignItems:"center", gap:14, marginBottom:20 }}>
      <img src="https://randomuser.me/api/portraits/men/44.jpg"
        style={{ width:58, height:58, borderRadius:"50%", border:"3px solid rgba(90,63,160,0.22)" }} alt="avatar"/>
      <button style={{ padding:"8px 16px", borderRadius:10, background:"#f4f0ff", color:"#5a3fa0", border:"1.5px solid rgba(90,63,160,0.2)", fontSize:12, fontWeight:700, cursor:"pointer", display:"flex", alignItems:"center", gap:6 }}>
        <Icon name="photo" size={14}/> Changer la photo
      </button>
    </div>
    <div className="jl-m-row">
      <div className="jl-m-fg">
        <label className="jl-m-fl">Prénom</label>
        <input className="jl-m-fi" defaultValue="Ahmed"/>
      </div>
      <div className="jl-m-fg">
        <label className="jl-m-fl">Nom</label>
        <input className="jl-m-fi" defaultValue="Ben Ali"/>
      </div>
    </div>
    <div className="jl-m-fg">
      <label className="jl-m-fl">Email</label>
      <input className="jl-m-fi" defaultValue="ahmed.benali@swafy.tn"/>
    </div>
    <div className="jl-m-fg">
      <label className="jl-m-fl">Bio</label>
      <textarea className="jl-m-fi" placeholder="Parlez de vous…"
        style={{ resize:"vertical", minHeight:72, lineHeight:1.55 }}/>
    </div>
  </>
);

const ModalToggles = ({ items, initState }) => {
  const [states, setStates] = useState(initState || items.map(() => true));
  return (
    <>
      {items.map((item, i) => (
        <div key={i} className="jl-m-toggle-row">
          <div style={{ flex:1 }}>
            <p style={{ fontSize:13, fontWeight:600, color:"#261a52", marginBottom:2 }}>{item.label}</p>
            {item.sub && <p style={{ fontSize:11.5, color:"#9080b8" }}>{item.sub}</p>}
          </div>
          <Toggle on={states[i]} onToggle={() => setStates(s => { const n=[...s]; n[i]=!n[i]; return n; })} />
        </div>
      ))}
    </>
  );
};

const ModalAppearance = () => {
  const [theme, setTheme] = useState(0);
  return (
    <>
      <p className="jl-m-fl" style={{ marginBottom:10 }}>Thème</p>
      <div style={{ display:"flex", gap:10, marginBottom:20 }}>
        {[["☀️","Clair"],["🌙","Sombre"],["✨","Auto"]].map(([ic,l],i) => (
          <div key={i} onClick={() => setTheme(i)}
            style={{ flex:1, padding:"14px 8px", borderRadius:13, border:`2px solid ${theme===i?"#5a3fa0":"#e0d8f0"}`, background:theme===i?"#f0ebff":"#faf8ff", textAlign:"center", cursor:"pointer", transition:"all .22s" }}>
            <div style={{ fontSize:24, marginBottom:6 }}>{ic}</div>
            <p style={{ fontSize:12, fontWeight:600, color:"#261a52" }}>{l}</p>
          </div>
        ))}
      </div>
      <p className="jl-m-fl" style={{ marginBottom:8 }}>Langue</p>
      <select className="jl-m-fi">
        <option>Français</option><option>العربية</option><option>English</option>
      </select>
    </>
  );
};

const ModalSecurity = () => (
  <>
    <div className="jl-m-fg"><label className="jl-m-fl">Mot de passe actuel</label><input className="jl-m-fi" type="password" placeholder="••••••••"/></div>
    <div className="jl-m-fg"><label className="jl-m-fl">Nouveau mot de passe</label><input className="jl-m-fi" type="password" placeholder="••••••••"/></div>
    <div style={{ background:"linear-gradient(135deg,rgba(90,63,160,0.07),rgba(124,92,191,0.05))", borderRadius:14, padding:16, border:"1px solid rgba(90,63,160,0.16)", display:"flex", alignItems:"center", gap:12 }}>
      <div style={{ width:44, height:44, borderRadius:13, background:"linear-gradient(135deg,#5a3fa0,#7c5cbf)", display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}>
        <Icon name="shield" size={20}/><span style={{ color:"#fff", marginLeft:-20 }}/>
      </div>
      <div style={{ flex:1 }}>
        <p style={{ fontSize:13, fontWeight:700, color:"#261a52", marginBottom:2 }}>Authentification 2 facteurs</p>
        <p style={{ fontSize:11.5, color:"#9080b8" }}>Renforcez la sécurité de votre compte</p>
      </div>
      <button style={{ padding:"8px 16px", borderRadius:10, background:"linear-gradient(135deg,#5a3fa0,#7c5cbf)", color:"#fff", fontSize:12, fontWeight:700, border:"none", cursor:"pointer", boxShadow:"0 4px 14px rgba(90,63,160,0.3)" }}>Activer</button>
    </div>
  </>
);

const MODAL_MAP = {
  profile : { title:"Mon profil",      Body: ModalProfile,    hasFoot: true },
  notif   : { title:"Notifications",   Body: () => <ModalToggles items={[{label:"Nouvelles publications",sub:"Quand un membre publie"},{label:"Commentaires",sub:"Sur vos publications"},{label:"Messages",sub:"Nouveaux messages"},{label:"Live",sub:"Alertes avant les sessions"}]} initState={[true,true,false,true]}/>, hasFoot:true },
  priv    : { title:"Confidentialité", Body: () => <ModalToggles items={[{label:"Profil public"},{label:"Afficher mes publications"},{label:"Autoriser les messages"},{label:"Indexation dans la recherche"}]} initState={[true,true,true,false]}/>, hasFoot:true },
  app     : { title:"Apparence",       Body: ModalAppearance, hasFoot: true },
  sec     : { title:"Sécurité",        Body: ModalSecurity,   hasFoot: true },
};

/* ═══════════════════════════════════════════════════════════
   MAIN COMPONENT
═══════════════════════════════════════════════════════════ */
const JeuneLayout = () => {
  const [user] = useState(() => {
    try { return JSON.parse(localStorage.getItem("user")) || null; }
    catch { return null; }
  });
  const navigate = useNavigate();

  /* UI */
  const [activePage,    setActivePage]    = useState(PAGES.HOME);
  const [sidebarOpen,   setSidebarOpen]   = useState(true);
  const [mobileOpen,    setMobileOpen]    = useState(false);
  const [modalKey,      setModalKey]      = useState(null);

  /* data */
  const [publications,  setPublications]  = useState([]);
  const [loading,       setLoading]       = useState(true);
  const [highlightedPub,setHighlightedPub]= useState(null);
  const [unreadMessages,setUnreadMessages]= useState(0);
  const [unreadNotifs,  setUnreadNotifs]  = useState(0);
  const [notifications, setNotifications] = useState([]);

  /* publish form */
  const [pubTitle, setPubTitle] = useState("");
  const [pubBody,  setPubBody]  = useState("");
  const [pubCat,   setPubCat]   = useState("");
  const [pubVis,   setPubVis]   = useState("public");
  const [pubBusy,  setPubBusy]  = useState(false);

  /* chatbot */
  const [cbInput, setCbInput] = useState("");
  const [cbMsgs,  setCbMsgs]  = useState([
    { from:"bot", text:"Bonjour ! Comment puis-je vous aider ?" },
    { from:"user",text:"Les lives cette semaine ?" },
    { from:"bot", text:"3 débats live sont programmés cette semaine !" },
  ]);
  const cbEndRef = useRef(null);

  /* ── SOCKET ── */
  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) return;
    const socket = io(BACKEND, { auth:{ token }, transports:["websocket"] });
    socket.on("connect_error", (e) => console.error("Socket:", e.message));
    socket.on("new_message", () => setUnreadMessages((n) => n + 1));
    return () => socket.disconnect();
  }, []);

  /* ── FETCH ── */
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
      const res  = await API.get("/notifications");
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
          ?.scrollIntoView({ behavior:"smooth", block:"center" });
      }, 900);
    }
  }, []);

  useEffect(() => { cbEndRef.current?.scrollIntoView({ behavior:"smooth" }); }, [cbMsgs]);

  /* ── ACTIONS ── */
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
    try { await API.put(`/notifications/${id}/read`); fetchNotifications(); } catch {}
  };

  const handlePublier = async (e) => {
    e.preventDefault();
    if (!pubTitle.trim() || !pubBody.trim()) return;
    try {
      setPubBusy(true);
      await API.post("/publications", {
        titre_publication   : pubTitle,
        contenu_publication : pubBody,
        categorie           : pubCat,
        visibilite          : pubVis,
      });
      setPubTitle(""); setPubBody(""); setPubCat(""); setPubVis("public");
      await fetchPublications();
      goTo(PAGES.HOME);
    } catch (err) { console.error(err); }
    finally { setPubBusy(false); }
  };

  const sendCb = () => {
    if (!cbInput.trim()) return;
    const userMsg = { from:"user", text:cbInput.trim() };
    setCbMsgs((m) => [...m, userMsg]);
    setCbInput("");
    setTimeout(() => {
      setCbMsgs((m) => [...m, { from:"bot", text:"Je traite votre demande, un instant…" }]);
    }, 700);
  };

  /* ── NAV ── */
  const NAV = [
    { icon:"home",     label:"Accueil",        page:PAGES.HOME },
    { icon:"message",  label:"Messages",        page:PAGES.MESSAGES,  badge:unreadMessages||null },
    { icon:"calendar", label:"Calendrier",      page:PAGES.CALENDAR },
    { icon:"radio",    label:"Live",            page:PAGES.LIVE,      live:true },
    { icon:"bell",     label:"Notifications",   page:PAGES.NOTIFS,    badge:unreadNotifs||null },
    { icon:"settings", label:"Paramètres",      page:PAGES.SETTINGS },
  ];

  /* ── MODAL ── */
  const openModal = (key) => setModalKey(key);
  const closeModal = () => setModalKey(null);
  const modalDef  = modalKey ? MODAL_MAP[modalKey] : null;

  /* ═══════════════════════════════════════════════════════
     PAGE CONTENT
  ═══════════════════════════════════════════════════════ */
  const renderContent = () => {
    switch (activePage) {

      /* ── MESSAGES ── */
      case PAGES.MESSAGES:
        return (
          <div className="jl-page">
            <JeuneContact />
          </div>
        );

      /* ── NOTIFICATIONS ── */
      case PAGES.NOTIFS:
        return (
          <div className="jl-page">
            <h2 className="jl-section-title"><Icon name="bell" size={18}/> Notifications</h2>
            {notifications.length === 0 ? (
              <div className="jl-empty">
                <span className="jl-empty-icon">🔔</span>
                <p>Aucune notification pour le moment</p>
              </div>
            ) : notifications.map((n, i) => (
              <div key={n.id_notification}
                className={`jl-notif-item${n.is_read ? "" : " unread"}`}
                style={{ animationDelay:`${i * 0.06}s` }}
                onClick={() => markNotifRead(n.id_notification)}>
                <div className="jl-notif-icon">
                  {n.type_notification==="new_post" ? "📝"
                  :n.type_notification==="publication_comment" ? "💬" : "🔔"}
                </div>
                <div style={{ flex:1 }}>
                  <p className="jl-notif-msg">{n.message}</p>
                  <p className="jl-notif-time">{new Date(n.created_at).toLocaleString("fr-FR")}</p>
                </div>
                {!n.is_read && <span className="jl-notif-dot"/>}
              </div>
            ))}
          </div>
        );

      /* ── PUBLIER ── */
      case PAGES.PUBLIER:
        return (
          <div className="jl-page">
            <h2 className="jl-section-title"><Icon name="pencil" size={18}/> Nouvelle publication</h2>
            <div className="jl-form-card">
              <form onSubmit={handlePublier}>
                <div className="jl-fg">
                  <label className="jl-fl">Titre</label>
                  <input className="jl-fi" placeholder="Un titre accrocheur…"
                    value={pubTitle} onChange={(e) => setPubTitle(e.target.value)} required/>
                </div>
                <div className="jl-fg">
                  <label className="jl-fl">Contenu</label>
                  <textarea className="jl-fi jl-fi-ta" placeholder="Partagez vos idées, opinions ou expériences…"
                    value={pubBody} onChange={(e) => setPubBody(e.target.value)} required/>
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
                  <button type="button" className="jl-media-btn"><Icon name="photo" size={14}/>Photo</button>
                  <button type="button" className="jl-media-btn"><Icon name="video" size={14}/>Vidéo</button>
                  <button type="button" className="jl-media-btn"><Icon name="link"  size={14}/>Lien</button>
                </div>
                <button type="submit" className="jl-submit-btn" disabled={pubBusy}>
                  <Icon name="send" size={16}/>
                  {pubBusy ? "Publication en cours…" : "Publier maintenant"}
                </button>
              </form>
            </div>
            <h2 className="jl-section-title" style={{ marginTop:6 }}>Publications récentes</h2>
            {publications.slice(0,2).map((pub) => (
              <PublicationCard key={pub.id_publication} publication={pub} onUpdate={fetchPublications}/>
            ))}
          </div>
        );

      /* ── CALENDAR ── */
      case PAGES.CALENDAR:
        return (
          <div className="jl-page">
            <h2 className="jl-section-title"><Icon name="calendar" size={18}/> Calendrier</h2>
            {[
              { ico:"📚", title:"Débat : Réforme éducative",      date:"Lun 12 Mai · 18h00" },
              { ico:"🌱", title:"Live : Environnement & Jeunesse", date:"Mer 14 Mai · 20h00" },
              { ico:"📊", title:"Enquête nationale : Emploi",      date:"Ven 16 Mai · Toute la journée" },
              { ico:"🎤", title:"Atelier : Prise de parole",       date:"Sam 17 Mai · 10h00" },
            ].map((ev, i) => (
              <div key={i} className="jl-event-item" style={{ animationDelay:`${i*0.08}s` }}>
                <div className="jl-event-dot">{ev.ico}</div>
                <div>
                  <p className="jl-event-title">{ev.title}</p>
                  <p className="jl-event-meta"><Icon name="clock" size={12}/>{ev.date}</p>
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
            <h2 className="jl-section-title"><Icon name="radio" size={18}/> Sessions Live</h2>
      <LiveBanner />
            <div className="jl-live-banner">
              <div className="jl-live-top">
                <span className="jl-live-badge">● LIVE</span>
                <span className="jl-live-desc">Débat : L'avenir de la jeunesse tunisienne</span>
              </div>
              <div className="jl-live-screen">
                <div style={{ textAlign:"center" }}>
                  <div style={{ fontSize:44, marginBottom:8 }}>🎙️</div>
                  <p style={{ fontSize:12, color:"rgba(255,255,255,0.72)" }}>342 spectateurs en direct</p>
                </div>
              </div>
              <button className="jl-submit-btn"><Icon name="play" size={16}/>Rejoindre le Live</button>
            </div>
            <h2 className="jl-section-title" style={{ marginTop:8 }}>Prochains lives</h2>
            {[
              { title:"Santé mentale des jeunes",    date:"Demain · 19h00" },
              { title:"Entrepreneuriat & Innovation", date:"Jeudi · 20h00" },
            ].map((l, i) => (
              <div key={i} className="jl-event-item" style={{ animationDelay:`${i*0.08}s` }}>
                <div className="jl-event-dot"><Icon name="mic" size={22}/></div>
                <div>
                  <p className="jl-event-title">{l.title}</p>
                  <p className="jl-event-meta"><Icon name="clock" size={12}/>{l.date}</p>
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
            <h2 className="jl-section-title"><Icon name="settings" size={18}/> Paramètres</h2>
            {[
              { ico:"👤", label:"Informations personnelles", sub:"Nom, photo, bio",       bg:"rgba(90,63,160,0.1)", key:"profile" },
              { ico:"🔔", label:"Notifications",            sub:"Email, push, SMS",       bg:"rgba(59,130,246,0.1)", key:"notif" },
              { ico:"🔒", label:"Confidentialité",          sub:"Visibilité du profil",   bg:"rgba(16,185,129,0.1)", key:"priv" },
              { ico:"🎨", label:"Apparence",                sub:"Thème, langue",          bg:"rgba(236,72,153,0.1)", key:"app" },
              { ico:"🛡️", label:"Sécurité",                 sub:"Mot de passe, 2FA",      bg:"rgba(245,158,11,0.1)", key:"sec" },
            ].map((s, i) => (
              <div key={i} className="jl-settings-item"
                style={{ animationDelay:`${i*0.07}s` }}
                onClick={() => openModal(s.key)}>
                <div className="jl-settings-ico" style={{ background:s.bg, border:"1px solid rgba(0,0,0,0.06)" }}>
                  {s.ico}
                </div>
                <div>
                  <p className="jl-settings-label">{s.label}</p>
                  <p className="jl-settings-sub">{s.sub}</p>
                </div>
                <span className="jl-settings-arr"><Icon name="chevron" size={18}/></span>
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
                <p className="jl-welcome-sub">Explorez, publiez, débattez avec la communauté.</p>
              </div>
              <div className="jl-welcome-art">
                <div className="jl-ring"/><div className="jl-ring"/><div className="jl-ring"/>
                <div className="jl-ring-center">
                  <Icon name="sparkles" size={28}/>
                </div>
              </div>
            </section>

            {/* Stats */}
            <div className="jl-stats">
              {[
                { label:"Mon profil",    sub:"Compte actif",                               icon:"user",    color:"#5a3fa0", action:() => openModal("profile") },
                { label:"Publications",  sub:`${publications?.length||0} posts`,           icon:"pencil",  color:"#3b82f6", action:() => goTo(PAGES.PUBLIER) },
                { label:"Live",          sub:"Débats en direct",                           icon:"radio",   color:"#ec4899", action:() => goTo(PAGES.LIVE) },
                { label:"Messages",      sub:unreadMessages ? `${unreadMessages} non lus` : "Aucun message",
                                                                                           icon:"message", color:"#10b981", action:() => goTo(PAGES.MESSAGES) },
              ].map((c, i) => (
                <div key={i} className="jl-stat" style={{ "--ac":c.color, animationDelay:`${i*0.08}s` }} onClick={c.action}>
                  <div className="jl-stat-icon"><Icon name={c.icon} size={22}/></div>
                  <p className="jl-stat-label">{c.label}</p>
                  <p className="jl-stat-sub">{c.sub}</p>
                </div>
              ))}
            </div>

            {/* Banners */}
            <div className="jl-banners">
              <div className="jl-banner jl-ban-live">
                <div className="jl-banner-body">
                  <span className="jl-banner-tag">En Direct</span>
                  <h2>Sessions Live<br/>Interactives</h2>
                  <button className="jl-banner-btn" onClick={() => goTo(PAGES.LIVE)}>
                    <Icon name="play" size={12}/>Rejoindre
                  </button>
                </div>
                <img src="https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=300&q=80"
                  alt="live" className="jl-banner-img"
                  onError={(e) => { e.target.style.display="none"; }}/>
              </div>
              <div className="jl-banner jl-ban-enquete">
                <div className="jl-banner-body">
                  <span className="jl-banner-tag">Nouveau</span>
                  <h2>Participez aux<br/>Enquêtes</h2>
                  <button className="jl-banner-btn">
                    <Icon name="chevron" size={12}/>Participer
                  </button>
                </div>
                <img src="https://images.unsplash.com/photo-1606326608606-aa0b62935f2b?w=300&q=80"
                  alt="enquete" className="jl-banner-img"
                  onError={(e) => { e.target.style.display="none"; }}/>
              </div>
            </div>

            {/* Feed */}
            <h2 className="jl-section-title"><Icon name="dots" size={18}/> Fil d'actualité</h2>
            {loading ? (
              <div className="jl-spinner-wrap"><div className="jl-spinner"/></div>
            ) : publications.length === 0 ? (
              <div className="jl-empty">
                <span className="jl-empty-icon">✦</span>
                <p>Aucune publication pour le moment</p>
              </div>
            ) : publications.map((pub) => (
              <div key={pub.id_publication}
                id={`pub-${pub.id_publication}`}
                className={highlightedPub===pub.id_publication ? "jl-highlighted" : ""}>
                <PublicationCard publication={pub} onUpdate={fetchPublications}/>
              </div>
            ))}
          </div>
        );
    }
  };

  /* ═══════════════════════════════════════════════════════
     RENDER
  ═══════════════════════════════════════════════════════ */
  return (
    <div className="jl-root">
      {/* orbs */}
      <div className="jl-orb jl-orb1" aria-hidden="true"/>
      <div className="jl-orb jl-orb2" aria-hidden="true"/>
      <div className="jl-orb jl-orb3" aria-hidden="true"/>

      {/* mobile overlay */}
      {mobileOpen && <div className="jl-overlay" onClick={() => setMobileOpen(false)}/>}

      {/* ══ SIDEBAR ══ */}
      <aside className={[
        "jl-sidebar",
        sidebarOpen ? "" : "collapsed",
        mobileOpen  ? "mobile-open" : "",
      ].join(" ")}>

        {/* Logo */}
        <div className="jl-logo" onClick={() => {
          if (window.innerWidth < 860) setMobileOpen((o) => !o);
          else setSidebarOpen((o) => !o);
        }}>
          <div className="jl-logo-icon">S</div>
          <span className="jl-logo-text">Swafy</span>
        </div>

        {/* Menu btn */}
        <button className="jl-menu-btn" onClick={() => {
          if (window.innerWidth < 860) setMobileOpen((o) => !o);
          else setSidebarOpen((o) => !o);
        }}>
          <Icon name="menu" size={18}/>
          <span className="jl-menu-label">Menu</span>
        </button>

        {/* Nav */}
        <nav className="jl-nav">
          {NAV.map((item, idx) => (
            <button key={idx}
              className={`jl-nav-item${activePage===item.page ? " active" : ""}`}
              onClick={() => goTo(item.page)}>
              <span className="jl-nav-icon"><Icon name={item.icon} size={20}/></span>
              <span className="jl-nav-label">{item.label}</span>
              {item.badge && <span className="jl-badge">{item.badge}</span>}
              {item.live  && <span className="jl-badge-live">LIVE</span>}
            </button>
          ))}
        </nav>

        {/* Exit */}
        <button className="jl-exit-btn" onClick={handleLogout}>
          <span className="jl-nav-icon"><Icon name="logout" size={20}/></span>
          <span className="jl-exit-label">Déconnexion</span>
        </button>
      </aside>

      {/* ══ MAIN ══ */}
      <main className={`jl-main ${sidebarOpen ? "ml-open" : "ml-col"}`}>

        {/* Topbar */}
        <div className="jl-topbar">
          <button className="jl-burger" aria-label="Menu" onClick={() => {
            if (window.innerWidth < 860) setMobileOpen((o) => !o);
            else setSidebarOpen((o) => !o);
          }}>
            <Icon name="menu" size={20}/>
          </button>
          <span className="jl-topbar-title">Swafy</span>
          <div className="jl-topbar-avatar" onClick={() => openModal("profile")}>
            <img src={getAvatar(user?.photo_user, user?.sexe)} alt="avatar"
              onError={(e) => { e.target.src="https://randomuser.me/api/portraits/men/44.jpg"; }}/>
          </div>
        </div>

        {/* Content */}
        {activePage === PAGES.MESSAGES ? (
          <div className="jl-messages-full"><JeuneContact/></div>
        ) : (
          <div className="jl-scroll">{renderContent()}</div>
        )}
      </main>

      {/* ══ RIGHT SIDEBAR — sticky ══ */}
      {activePage !== PAGES.MESSAGES && (
        <aside className="jl-right">
          <div className="jl-right-scroll">

            {/* Profile card */}
            <div className="jl-profile-card" onClick={() => openModal("profile")}>
              <div className="jl-p-row">
                <img className="jl-p-ava"
                  src={getAvatar(user?.photo_user, user?.sexe)} alt="avatar"
                  onError={(e) => { e.target.src="https://randomuser.me/api/portraits/men/44.jpg"; }}/>
                <div style={{ flex:1, minWidth:0 }}>
                  <p className="jl-p-name">{user?.prenom_user} {user?.nom_user}</p>
                  <p className="jl-p-email">{user?.email_user}</p>
                </div>
                <span className="jl-p-arr"><Icon name="chevron" size={16}/></span>
              </div>
              <span className="jl-p-role">
                <Icon name="star" size={11}/> Jeune membre · Swafy
              </span>
            </div>

            {/* Quick stats */}
            <div className="jl-q-stats">
              <div className="jl-q-sc"><p className="jl-q-num">24</p><p className="jl-q-lbl">Posts</p></div>
              <div className="jl-q-sc"><p className="jl-q-num">142</p><p className="jl-q-lbl">Amis</p></div>
              <div className="jl-q-sc"><p className="jl-q-num">8</p><p className="jl-q-lbl">Événements</p></div>
            </div>

            {/* Upcoming event */}
            <div className="jl-ev-widget">
              <p className="jl-ev-tag">Prochain événement</p>
              <p className="jl-ev-name">Débat : Réforme éducative</p>
              <p className="jl-ev-time"><Icon name="clock" size={12}/>Lundi 12 Mai · 18h00</p>
              <button className="jl-ev-join" onClick={() => goTo(PAGES.LIVE)}>
                <Icon name="play" size={13}/>Rejoindre le live
              </button>
            </div>

            {/* Trending */}
            <p className="jl-sec-label">Tendances</p>
            {[
              { num:1, txt:"Éducation",    cnt:"342 posts" },
              { num:2, txt:"Environnement",cnt:"218 posts" },
              { num:3, txt:"Santé mentale",cnt:"195 posts" },
            ].map((t, i) => (
              <div key={i} className="jl-tr-item">
                <span className="jl-tr-num">{t.num}</span>
                <span className="jl-tr-txt">{t.txt}</span>
                <span className="jl-tr-cnt">{t.cnt}</span>
              </div>
            ))}

            {/* Chatbot */}
            <div className="jl-cb">
              <div className="jl-cb-head">
                <div className="jl-cb-icon"><Icon name="robot" size={14}/></div>
                <div>
                  <p className="jl-cb-title">Assistant Swafy</p>
                  <p className="jl-cb-sub">Toujours disponible</p>
                </div>
                <span className="jl-cb-online">● En ligne</span>
              </div>
              <div className="jl-cb-msgs">
                {cbMsgs.map((m, i) => (
                  <div key={i} className={`jl-cb-msg ${m.from==="bot" ? "jl-cb-bot" : "jl-cb-user"}`}>
                    {m.text}
                  </div>
                ))}
                <div ref={cbEndRef}/>
              </div>
              <div className="jl-cb-bar">
                <input className="jl-cb-input" placeholder="Écrire…"
                  value={cbInput} onChange={(e) => setCbInput(e.target.value)}
                  onKeyDown={(e) => e.key==="Enter" && sendCb()}/>
                <button className="jl-cb-send" onClick={sendCb} aria-label="Envoyer">
                  <Icon name="send" size={13}/>
                </button>
              </div>
            </div>

          </div>
        </aside>
      )}

      {/* ══ MODAL ══ */}
      {modalDef && (
        <div className="jl-modal-bg" onClick={(e) => e.target===e.currentTarget && closeModal()}>
          <div className="jl-modal">
            <div className="jl-modal-head">
              <span className="jl-modal-title">{modalDef.title}</span>
              <button className="jl-modal-close" onClick={closeModal} aria-label="Fermer">
                <Icon name="close" size={15}/>
              </button>
            </div>
            <div className="jl-modal-body">
              <modalDef.Body/>
            </div>
            {modalDef.hasFoot && (
              <div className="jl-modal-foot">
                <button className="jl-m-cancel" onClick={closeModal}>Annuler</button>
                <button className="jl-m-save" onClick={closeModal}>
                  <Icon name="check" size={14}/>Enregistrer
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default JeuneLayout;