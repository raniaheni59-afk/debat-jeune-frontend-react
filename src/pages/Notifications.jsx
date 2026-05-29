import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useNotifications } from "../hooks/useNotifications";
import API from "../services/api";

const BACKEND =
  API.defaults.baseURL?.split("/api")[0] ||
  "https://debat-jeune.onrender.com";

const getIcon = (type) => {
  const icons = {
    new_post:             "📢",
    publication_comment:  "💬",
    publication_reaction: "❤️",
    debat_vote:           "⚖️",
    comment_reaction:     "👍",
    live_started:         "🔴",
  };
  return icons[type] || "🔔";
};

const getBg = (type, isRead) => {
  if (type === "live_started") return isRead ? "#fff9f0" : "#fff3e0";
  return isRead ? "white" : "#f0f3ff";
};

const timeAgo = (date) => {
  const diff  = Date.now() - new Date(date).getTime();
  const mins  = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days  = Math.floor(diff / 86400000);
  if (mins < 1)  return "À l'instant";
  if (mins < 60) return `Il y a ${mins} min`;
  if (hours < 24) return `Il y a ${hours}h`;
  return `Il y a ${days}j`;
};

const Notifications = () => {
  const navigate = useNavigate();
  const { notifications, unreadCount, markRead, markAllRead } = useNotifications();

  // Live notifications en temps réel (depuis socket via CustomEvent)
  const [liveNotifs, setLiveNotifs] = useState([]);

  useEffect(() => {
    // Écouter les live notifications via "live-started" (émis par App.jsx depuis socket)
    const handleLiveStarted = (e) => {
      const d = e.detail;
      setLiveNotifs(prev => [{
        id_notification:   `live-${Date.now()}`,
        type_notification: "live_started",
        message:    d.message || `🔴 Un live a démarré — rejoignez maintenant !`,
        created_at: d.created_at || new Date().toISOString(),
        is_read:    false,
        roomCode:   d.roomCode,
        _isLive:    true,
      }, ...prev]);
    };

    // Écouter aussi "new_notification" pour les live_started qui arrivent via socket direct
    const handleNewNotif = (e) => {
      const d = e.detail;
      if (d?.type_notification === "live_started" || d?.roomCode) {
        setLiveNotifs(prev => [{
          id_notification:   `live-${Date.now()}`,
          type_notification: "live_started",
          message:    d.message || `🔴 Un live a démarré — rejoignez maintenant !`,
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

  const handleClick = async (n) => {
    // 1. Live notification → aller au live
    if (n.type_notification === "live_started" || n._isLive) {
      const roomCode = n.roomCode || n.entity_id;
      if (roomCode) {
        try {
          const res = await API.get("/lives");
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

    // Marquer comme lu avant navigation
    if (n.id_notification && !String(n.id_notification).startsWith("live-")) {
      await markRead(n.id_notification);
    }

    // 2. Publications : new_post, publication_comment, publication_reaction, debat_vote
    const isPubNotif =
      n.entity_id &&
      (n.entity_type === "publication" ||
        ["new_post", "publication_comment", "publication_reaction", "debat_vote"].includes(n.type_notification));
    if (isPubNotif) {
      navigate(`/jeune/publication/${n.entity_id}`);
      return;
    }

    // 3. Enquête (admin reçoit quand jeune répond)
    if (n.type_notification === "enquete_response" && n.entity_id) {
      navigate(`/admin/dashboard`); // ou /enquetes/${n.entity_id} si la route existe
      return;
    }

    // 4. Commentaire reaction
    if (n.type_notification === "comment_reaction" && n.entity_id) {
      navigate(`/jeune/publication/${n.entity_id}`);
      return;
    }
  };

  return (
    <div style={{ minHeight:"100vh", background:"linear-gradient(135deg,#f5f7fa,#c3cfe2)", padding:"20px 16px", fontFamily:"'DM Sans',system-ui,sans-serif" }}>
      <div style={{ maxWidth:600, margin:"0 auto" }}>

        {/* Header */}
        <div style={{ display:"flex", alignItems:"center", marginBottom:24, gap:12 }}>
          <button onClick={()=>navigate(-1)}
            style={{ background:"white", border:"none", borderRadius:"50%", width:40, height:40, cursor:"pointer", fontSize:18, display:"flex", alignItems:"center", justifyContent:"center", boxShadow:"0 2px 8px rgba(0,0,0,.1)" }}>
            ←
          </button>
          <div style={{ flex:1 }}>
            <h1 style={{ margin:0, fontSize:22, fontWeight:800, color:"#1a1a2e" }}>
              Notifications
              {unreadCount > 0 && (
                <span style={{ background:"#7c3aed", color:"white", borderRadius:20, padding:"2px 10px", fontSize:13, marginLeft:10, fontWeight:600 }}>
                  {unreadCount}
                </span>
              )}
            </h1>
            <p style={{ margin:0, fontSize:13, color:"#888", marginTop:3 }}>
              {unreadCount > 0 ? `${unreadCount} non lue(s)` : "Tout est à jour ✓"}
            </p>
          </div>
          {unreadCount > 0 && (
            <button onClick={markAllRead}
              style={{ background:"none", border:"1px solid #7c3aed", borderRadius:20, padding:"6px 14px", color:"#7c3aed", cursor:"pointer", fontSize:13, fontWeight:500 }}>
              Tout lire
            </button>
          )}
        </div>

        {/* Liste */}
        <div style={{ background:"white", borderRadius:20, boxShadow:"0 4px 20px rgba(0,0,0,.08)", overflow:"hidden" }}>
          {allNotifs.length === 0 ? (
            <div style={{ textAlign:"center", padding:"60px 20px", color:"#999" }}>
              <div style={{ fontSize:50, marginBottom:10 }}>🔔</div>
              <p style={{ fontSize:16, fontWeight:500 }}>Aucune notification</p>
              <p style={{ fontSize:14 }}>Vous serez notifié des nouvelles activités</p>
            </div>
          ) : (
            allNotifs.map((n, index) => (
              <div key={n.id_notification}
                onClick={() => handleClick(n)}
                style={{
                  display:"flex", alignItems:"center", gap:14, padding:"16px 20px",
                  cursor:"pointer",
                  background: getBg(n.type_notification, n.is_read),
                  borderBottom: index < allNotifs.length-1 ? "1px solid #f0f0f0" : "none",
                  transition:"background .2s",
                  borderLeft: n.type_notification==="live_started" ? "3px solid #ef4444" : "3px solid transparent",
                }}
                onMouseEnter={e => e.currentTarget.style.background="#f8f9ff"}
                onMouseLeave={e => e.currentTarget.style.background=getBg(n.type_notification, n.is_read)}
              >
                {/* Avatar */}
                <div style={{ position:"relative", flexShrink:0 }}>
                  {n.type_notification === "live_started" ? (
                    <div style={{ width:44, height:44, borderRadius:"50%", background:"linear-gradient(135deg,#7c3aed,#ef4444)", display:"flex", alignItems:"center", justifyContent:"center", fontSize:20 }}>
                      🔴
                    </div>
                  ) : (
                    <img
                      src={n.photo_user ? `${BACKEND}/${n.photo_user}` : "https://randomuser.me/api/portraits/lego/1.jpg"}
                      alt="user"
                      style={{ width:44, height:44, borderRadius:"50%", objectFit:"cover", border:"2px solid #e8e8f0" }}
                      onError={e => e.target.src="https://randomuser.me/api/portraits/lego/1.jpg"}
                    />
                  )}
                  <span style={{ position:"absolute", bottom:-2, right:-2, background:"white", borderRadius:"50%", width:20, height:20, display:"flex", alignItems:"center", justifyContent:"center", fontSize:12, boxShadow:"0 1px 4px rgba(0,0,0,.15)" }}>
                    {getIcon(n.type_notification)}
                  </span>
                </div>

                {/* Texte */}
                <div style={{ flex:1, minWidth:0 }}>
                  <p style={{ margin:0, fontSize:14, color:"#1a1a2e", lineHeight:1.4 }}>
                    {n.nom_user && <strong>{n.nom_user} {n.prenom_user} </strong>}
                    <span style={{ color:"#555" }}>{n.message}</span>
                  </p>
                  <div style={{ display:"flex", alignItems:"center", gap:8, marginTop:4 }}>
                    <span style={{ fontSize:12, color:"#999" }}>{timeAgo(n.created_at)}</span>
                    {n.type_notification==="live_started" && (
                      <span style={{ fontSize:11, background:"#fef2f2", color:"#ef4444", padding:"2px 8px", borderRadius:20, fontWeight:700 }}>
                        🔴 LIVE
                      </span>
                    )}
                  </div>
                </div>

                {/* Dot non lu */}
                {!n.is_read && (
                  <div style={{ width:10, height:10, borderRadius:"50%", background:"#7c3aed", flexShrink:0 }}/>
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