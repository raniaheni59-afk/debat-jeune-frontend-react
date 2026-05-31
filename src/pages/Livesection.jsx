import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { io } from "socket.io-client";
import API from "../services/api";

const SOCKET_URL = import.meta.env.VITE_BACKEND_URL || "https://debat-jeune.onrender.com";
const EMOJIS = ["👍","❤️","😂","🎉","🔥","👏","🙌","💯","😮","🤔"];

function getAuth() {
  try {
    const user  = JSON.parse(localStorage.getItem("user") || "null");
    const token = localStorage.getItem("token");
    const name  = user?.prenom_user
      ? `${user.prenom_user} ${user.nom_user || ""}`.trim()
      : user?.name || "Participant";
    const email = user?.email_user || user?.email || "";
    return { user, token, name, email, ok: !!(user && token) };
  } catch { return { user:null, token:null, name:"Participant", email:"", ok:false }; }
}

function extractViewerInfo(streamLink) {
  if (!streamLink) return { roomCode:null, vt:null };
  try {
    const url = new URL(streamLink);
    const parts    = url.pathname.split("/").filter(Boolean);
    const roomCode = parts[parts.length - 1];
    const vt       = url.searchParams.get("vt") || url.searchParams.get("at");
    if (!roomCode || !vt) return { roomCode: null, vt: null };
    return { roomCode, vt };
  } catch { return { roomCode: null, vt: null }; }
}

export default function LiveSection({ activeLiveLink, activeLiveInfo, onLiveLinkReceived }) {
  const navigate = useNavigate();
  const auth     = getAuth();

  const [live,      setLive]     = useState(null);
  const [loading,   setLoading]  = useState(true);
  const [reactions, setReactions]= useState({});
  const [floats,    setFloats]   = useState([]);
  const [myReact,   setMyReact]  = useState(null);
  const [nudge,     setNudge]    = useState(false);
  const [copied,    setCopied]   = useState(false);

  const sockRef   = useRef(null);
  const joinedRef = useRef(false);

  // ── Obtenir un token frais ───────────────────────────
  const fetchFreshViewerToken = async (roomCode) => {
    try {
      const headers = {};
      if (auth.token) headers["Authorization"] = `Bearer ${auth.token}`;
      const res = await fetch(`${SOCKET_URL}/api/lives/viewer-token/${roomCode}`, { headers });
      if (!res.ok) return null;
      const data = await res.json();
      if (data.success && data.viewerLink) {
        localStorage.setItem("currentLiveViewerLink", data.viewerLink);
        onLiveLinkReceived?.(data.viewerLink);
        return data.viewerLink;
      }
    } catch {}
    return null;
  };

  // ── Fetch live actif ─────────────────────────────────
  const fetchActiveLive = async () => {
    try {
      const headers = {};
      if (auth.token) headers["Authorization"] = `Bearer ${auth.token}`;
      const res  = await fetch(`${SOCKET_URL}/api/lives`, { headers });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      const list = Array.isArray(data) ? data : [];
      const active = list.find(l => l.is_active === 1 || l.is_active === true);
      if (active) {
        const fallbackLink = activeLiveLink || localStorage.getItem("currentLiveViewerLink") || "";
        let streamLink = active.stream_link || fallbackLink;
        if (streamLink) {
          try {
            const url = new URL(streamLink);
            const vt = url.searchParams.get("vt");
            if (vt) {
              const parts = vt.split(".");
              if (parts.length === 3) {
                const payload = JSON.parse(atob(parts[1]));
                const isExpired = payload.exp && (payload.exp * 1000) < Date.now();
                if (isExpired) {
                  const freshLink = await fetchFreshViewerToken(active.room_code);
                  if (freshLink) streamLink = freshLink;
                }
              }
            }
          } catch {}
        } else if (active.room_code) {
          const freshLink = await fetchFreshViewerToken(active.room_code);
          if (freshLink) streamLink = freshLink;
        }
        const liveData = {
          id:          active.id_live || active.id,
          roomCode:    active.room_code,
          title:       active.title_live   || "Live en cours",
          description: active.description  || "",
          hostName:    active.admin_name   || active.host_name || "Admin",
          thematique:  active.thematique   || "",
          streamLink,
          startedAt:   active.created_at,
        };
        setLive(liveData);
        if (streamLink) {
          localStorage.setItem("currentLiveViewerLink", streamLink);
          onLiveLinkReceived?.(streamLink);
        }
      } else {
        if (!activeLiveLink) setLive(null);
      }
    } catch (err) {
      console.warn("fetchActiveLive error:", err.message);
    } finally { setLoading(false); }
  };

  useEffect(() => {
    fetchActiveLive();
    const interval = setInterval(fetchActiveLive, 10000);
    return () => clearInterval(interval);
  }, [activeLiveLink]);

  useEffect(() => {
    if (!activeLiveLink) return;
    setLive(prev => {
      if (!prev) {
        try {
          const url = new URL(activeLiveLink);
          const parts = url.pathname.split("/").filter(Boolean);
          const roomCode = parts[parts.length - 1];
          return {
            roomCode,
            title:       activeLiveInfo?.title_live || "Live en cours",
            description: activeLiveInfo?.description || "",
            hostName:    "Admin",
            thematique:  activeLiveInfo?.thematique || "",
            streamLink:  activeLiveLink,
            startedAt:   new Date(),
          };
        } catch { return prev; }
      }
      if (!prev.streamLink) return { ...prev, streamLink: activeLiveLink };
      return prev;
    });
    setLoading(false);
  }, [activeLiveLink, activeLiveInfo]);

  // ── Socket ──────────────────────────────────────────
  useEffect(() => {
    const sock = io(SOCKET_URL, {
      transports: ["websocket"],
      reconnection: true,
      reconnectionAttempts: 10,
    });
    sockRef.current = sock;

    sock.on("live-started", (data) => {
      const { roomCode, viewerLink, hostName, title, description, thematique } = data;
      setLive({
        roomCode, title: title || "Live en cours",
        description: description || "", hostName: hostName || "Admin",
        thematique: thematique || "", streamLink: viewerLink || "",
        startedAt: new Date(),
      });
      joinedRef.current = false;
      if (viewerLink) {
        localStorage.setItem("currentLiveViewerLink", viewerLink);
        onLiveLinkReceived?.(viewerLink);
      }
    });

    sock.on("live-ended", ({ roomCode }) => {
      setLive(prev => (prev?.roomCode === roomCode || !roomCode) ? null : prev);
      joinedRef.current = false;
      setReactions({});
      localStorage.removeItem("currentLiveViewerLink");
    });

    sock.on("reaction", ({ emoji }) => {
      setReactions(prev => ({ ...prev, [emoji]: (prev[emoji]||0)+1 }));
      const id = Date.now()+Math.random();
      setFloats(prev => [...prev,{ id,emoji }]);
      setTimeout(() => setFloats(prev=>prev.filter(f=>f.id!==id)), 3000);
    });

    return () => sock.disconnect();
  }, []);

  // ── Join socket room (pour les réactions) ───────────
  useEffect(() => {
    if (!live || !sockRef.current || !auth.ok || joinedRef.current) return;
    const linkToUse = live.streamLink || activeLiveLink || localStorage.getItem("currentLiveViewerLink") || "";
    const { roomCode, vt } = extractViewerInfo(linkToUse);
    if (!roomCode || !vt) return;
    joinedRef.current = true;
    sockRef.current.emit("join-room", {
      roomCode, userName: auth.name, role: "guest", accessToken: vt, email: auth.email,
    }, async ack => {
      if (!ack?.ok) {
        joinedRef.current = false;
        if (ack?.message?.includes("expiré") || ack?.message?.includes("invalide")) {
          const freshLink = await fetchFreshViewerToken(roomCode);
          if (freshLink) {
            setLive(prev => prev ? { ...prev, streamLink: freshLink } : prev);
            setTimeout(() => {
              const { roomCode: rc2, vt: vt2 } = extractViewerInfo(freshLink);
              if (!rc2 || !vt2) return;
              sockRef.current?.emit("join-room", {
                roomCode: rc2, userName: auth.name, role: "guest", accessToken: vt2, email: auth.email,
              }, ack2 => { if (ack2?.ok) joinedRef.current = true; });
            }, 500);
          }
        }
      }
    });
  }, [live, auth.ok, activeLiveLink]);

  // ── Rejoindre le live ────────────────────────────────
  const joinLive = async () => {
    if (!auth.ok) { setNudge(true); return; }
    const isExpired = (vt) => {
      try {
        const payload = JSON.parse(atob(vt.split(".")[1]));
        return payload.exp && (payload.exp * 1000) < Date.now();
      } catch { return true; }
    };
    const candidates = [live?.streamLink, activeLiveLink, localStorage.getItem("currentLiveViewerLink")].filter(Boolean);
    for (const link of candidates) {
      const { roomCode, vt } = extractViewerInfo(link);
      if (!roomCode || !vt) continue;
      if (!isExpired(vt)) { navigate(`/meet/${roomCode}?vt=${vt}`); return; }
      const freshLink = await fetchFreshViewerToken(roomCode);
      if (freshLink) {
        const { roomCode: rc2, vt: vt2 } = extractViewerInfo(freshLink);
        if (rc2 && vt2) { navigate(`/meet/${rc2}?vt=${vt2}`); return; }
      }
    }
    if (live?.roomCode) {
      const freshLink = await fetchFreshViewerToken(live.roomCode);
      if (freshLink) {
        const { roomCode: rc, vt } = extractViewerInfo(freshLink);
        if (rc && vt) { navigate(`/meet/${rc}?vt=${vt}`); return; }
      }
      navigate(`/meet/${live.roomCode}`);
    }
  };

  // ── Réaction ─────────────────────────────────────────
  const sendReaction = emoji => {
    if (!auth.ok) { setNudge(true); return; }
    if (!live) return;
    const { roomCode } = extractViewerInfo(live.streamLink);
    if (!roomCode) return;
    setMyReact(emoji);
    sockRef.current?.emit("send-reaction", { roomCode, emoji });
  };

  const copyLink = async () => {
    const lnk = live?.streamLink || localStorage.getItem("currentLiveViewerLink") || "";
    if (!lnk) return;
    await navigator.clipboard.writeText(lnk).catch(()=>{});
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const ANIM = `
    @keyframes floatUp{0%{opacity:1;transform:translateY(0) scale(1)}100%{opacity:0;transform:translateY(-80px) scale(1.4)}}
    @keyframes pulseDot{0%,100%{opacity:1;transform:scale(1)}50%{opacity:.4;transform:scale(.8)}}
    @keyframes scaleIn{from{transform:scale(.9);opacity:0}to{transform:scale(1);opacity:1}}
    @keyframes spin{to{transform:rotate(360deg)}}
    @keyframes shimmer{0%{background-position:-200% 0}100%{background-position:200% 0}}
    @keyframes fadeSlide{from{opacity:0;transform:translateY(16px)}to{opacity:1;transform:translateY(0)}}
    ::-webkit-scrollbar{width:4px}
    ::-webkit-scrollbar-thumb{background:rgba(0,0,0,.12);border-radius:4px}
  `;

  // ── LOADING ──────────────────────────────────────────
  if (loading) return (
    <div style={{ display:"flex",alignItems:"center",justifyContent:"center",minHeight:300,flexDirection:"column",gap:16 }}>
      <style>{ANIM}</style>
      <div style={{ width:40,height:40,border:"3px solid rgba(90,63,160,.15)",borderTopColor:"#7c3aed",borderRadius:"50%",animation:"spin .8s linear infinite" }} />
      <p style={{ color:"#9080b8",fontSize:13,fontWeight:500 }}>Vérification des lives…</p>
    </div>
  );

  // ── NO LIVE — géré par JeuneLayout, LiveSection ne s'affiche pas ──
  if (!live) return null;

  // ── LIVE EN COURS ────────────────────────────────────
  return (
    <div style={{ fontFamily:"'Inter','DM Sans',sans-serif", animation:"fadeSlide .4s ease", padding:"0 0 24px" }}>
      <style>{ANIM}</style>

      {/* ── PREVIEW CARD ── */}
      <div style={{
        background:"linear-gradient(160deg,#0d0621,#1a0a3a,#0f0c29)",
        borderRadius:20, minHeight:320, position:"relative", overflow:"hidden",
        display:"flex", alignItems:"center", justifyContent:"center",
        border:"1px solid rgba(124,58,237,.2)",
        boxShadow:"0 20px 60px rgba(124,58,237,.15)",
        marginBottom:16,
      }}>
        {/* Grid overlay bg */}
        <div style={{ position:"absolute",inset:0,backgroundImage:"linear-gradient(rgba(124,58,237,.05) 1px,transparent 1px),linear-gradient(90deg,rgba(124,58,237,.05) 1px,transparent 1px)",backgroundSize:"32px 32px",pointerEvents:"none" }} />

        {/* LIVE badge */}
        <div style={{ position:"absolute",top:14,left:14,display:"flex",alignItems:"center",gap:7,background:"rgba(239,68,68,.18)",backdropFilter:"blur(8px)",border:"1px solid rgba(239,68,68,.35)",borderRadius:30,padding:"5px 14px" }}>
          <span style={{ width:8,height:8,borderRadius:"50%",background:"#ef4444",display:"inline-block",animation:"pulseDot 1.2s infinite",flexShrink:0 }}/>
          <span style={{ color:"#fca5a5",fontSize:11,fontWeight:800,letterSpacing:1.5,textTransform:"uppercase" }}>En Direct</span>
        </div>

        {/* Floating reactions */}
        <div style={{ position:"absolute",bottom:24,left:"50%",transform:"translateX(-50%)",display:"flex",gap:10,pointerEvents:"none",zIndex:10 }}>
          {floats.map(f=><span key={f.id} style={{ fontSize:28,animation:"floatUp 3s ease-out forwards",display:"inline-block" }}>{f.emoji}</span>)}
        </div>

        {/* Center content */}
        <div style={{ textAlign:"center",zIndex:1,padding:"40px 28px",position:"relative" }}>
          {/* Icon */}
          <div style={{ width:72,height:72,borderRadius:"50%",background:"rgba(124,58,237,.2)",border:"1.5px solid rgba(124,58,237,.35)",display:"flex",alignItems:"center",justifyContent:"center",margin:"0 auto 18px",backdropFilter:"blur(12px)" }}>
            <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="#c4b5fd" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <path d="m22 8-6 4 6 4V8z"/><rect x="2" y="6" width="14" height="12" rx="2"/>
            </svg>
          </div>

          {/* Title */}
          <h2 style={{ color:"#fff",fontSize:20,fontWeight:800,margin:"0 0 6px",fontFamily:"'Poppins',sans-serif",textShadow:"0 2px 12px rgba(0,0,0,.4)" }}>
            {live.title}
          </h2>

          {live.description && (
            <p style={{ color:"rgba(255,255,255,.55)",fontSize:13,maxWidth:280,margin:"0 auto 10px",lineHeight:1.6 }}>{live.description}</p>
          )}

          {live.thematique && (
            <span style={{ display:"inline-flex",alignItems:"center",gap:5,background:"rgba(124,58,237,.25)",border:"1px solid rgba(124,58,237,.35)",color:"#c4b5fd",fontSize:11,padding:"4px 12px",borderRadius:20,marginBottom:10,backdropFilter:"blur(8px)" }}>
              <svg width="10" height="10" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>
              {live.thematique}
            </span>
          )}

          {live.hostName && (
            <p style={{ color:"rgba(255,255,255,.35)",fontSize:11,margin:"8px 0 0" }}>
              Animé par <strong style={{ color:"rgba(255,255,255,.65)",fontWeight:700 }}>{live.hostName}</strong>
            </p>
          )}
        </div>
      </div>

      {/* ── JOIN BUTTON ── */}
      <button
        onClick={joinLive}
        style={{
          width:"100%",
          background:"linear-gradient(135deg,#7c3aed,#3b82f6)",
          border:"none", borderRadius:14, padding:"15px",
          color:"#fff", fontSize:15, fontWeight:800, cursor:"pointer",
          display:"flex", alignItems:"center", justifyContent:"center", gap:10,
          boxShadow:"0 8px 28px rgba(124,58,237,.4)",
          marginBottom:14,
          transition:"transform .15s,box-shadow .15s",
        }}
        onMouseEnter={e=>{e.currentTarget.style.transform="translateY(-2px)";e.currentTarget.style.boxShadow="0 12px 36px rgba(124,58,237,.5)";}}
        onMouseLeave={e=>{e.currentTarget.style.transform="";e.currentTarget.style.boxShadow="0 8px 28px rgba(124,58,237,.4)";}}
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z"/></svg>
        Entrer dans le Live
      </button>

      {/* ── RÉACTIONS ── */}
      <div style={{
        background:"#fff", borderRadius:16,
        border:"1px solid rgba(90,63,160,.1)",
        padding:"14px 16px", marginBottom:14,
        boxShadow:"0 2px 12px rgba(90,63,160,.06)",
      }}>
        <p style={{ fontSize:11,fontWeight:700,color:"#9080b8",textTransform:"uppercase",letterSpacing:1,margin:"0 0 10px",display:"flex",alignItems:"center",gap:5 }}>
          <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor" style={{ color:"#ec4899" }}><path d="M11.645 20.91l-.007-.003-.022-.012a15.247 15.247 0 01-.383-.218 25.18 25.18 0 01-4.244-3.17C4.688 15.36 2.25 12.174 2.25 8.25 2.25 5.322 4.714 3 7.688 3A5.5 5.5 0 0112 5.052 5.5 5.5 0 0116.313 3c2.973 0 5.437 2.322 5.437 5.25 0 3.925-2.438 7.111-4.739 9.256a25.175 25.175 0 01-4.244 3.17 15.247 15.247 0 01-.383.219l-.022.012-.007.004-.003.001a.752.752 0 01-.704 0l-.003-.001z"/></svg>
          Réactions
        </p>
        <div style={{ display:"flex",gap:6,flexWrap:"wrap" }}>
          {EMOJIS.map(e=>(
            <button key={e} onClick={()=>sendReaction(e)} style={{
              background: myReact===e ? "rgba(124,58,237,.12)" : "rgba(0,0,0,.03)",
              border: myReact===e ? "1.5px solid #7c3aed" : "1.5px solid rgba(0,0,0,.06)",
              borderRadius:24, padding:"6px 12px", cursor:"pointer", fontSize:16,
              display:"flex", alignItems:"center", gap:4, transition:"all .15s",
              transform: myReact===e ? "scale(1.08)" : "scale(1)",
            }}>
              {e}
              {reactions[e]>0 && <span style={{ fontSize:11,color:"#6b7280",fontWeight:700 }}>{reactions[e]}</span>}
            </button>
          ))}
        </div>
      </div>

      {/* ── LIEN PARTAGE ── */}
      {live.streamLink && (
        <div style={{ display:"flex",alignItems:"center",gap:8,background:"rgba(90,63,160,.05)",border:"1px solid rgba(90,63,160,.12)",borderRadius:12,padding:"10px 14px" }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#9080b8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/></svg>
          <span style={{ color:"#9080b8",fontSize:11,flex:1,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap" }}>
            {live.streamLink.length>55 ? live.streamLink.slice(0,55)+"…" : live.streamLink}
          </span>
          <button onClick={copyLink} style={{ background:copied?"rgba(52,211,153,.15)":"rgba(90,63,160,.12)",border:"none",borderRadius:8,padding:"5px 10px",color:copied?"#059669":"#7c3aed",cursor:"pointer",fontSize:12,fontWeight:700,flexShrink:0,transition:"all .2s",display:"flex",alignItems:"center",gap:4 }}>
            {copied ? (
              <><svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M20 6 9 17l-5-5"/></svg>Copié</>
            ) : (
              <><svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>Copier</>
            )}
          </button>
        </div>
      )}

      {/* MODAL INSCRIPTION */}
      {nudge && (
        <div style={{ position:"fixed",inset:0,background:"rgba(0,0,0,.6)",backdropFilter:"blur(8px)",display:"flex",alignItems:"center",justifyContent:"center",zIndex:999 }}>
          <div style={{ background:"#fff",borderRadius:22,padding:"44px 36px",maxWidth:400,width:"90%",textAlign:"center",animation:"scaleIn .3s ease",boxShadow:"0 24px 80px rgba(0,0,0,.2)" }}>
            <div style={{ width:64,height:64,borderRadius:"50%",background:"linear-gradient(135deg,#5a3fa0,#7c5cbf)",display:"flex",alignItems:"center",justifyContent:"center",margin:"0 auto 16px" }}>
              <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
            </div>
            <h3 style={{ color:"#1f2937",margin:"0 0 8px",fontSize:18,fontWeight:800 }}>Rejoignez la communauté !</h3>
            <p style={{ color:"#6b7280",fontSize:14,margin:"0 0 24px",lineHeight:1.6 }}>Créez un compte gratuit pour réagir et participer aux lives.</p>
            <div style={{ display:"flex",gap:10,justifyContent:"center",marginBottom:12 }}>
              <button onClick={()=>navigate("/register")} style={{ background:"linear-gradient(135deg,#5a3fa0,#7c5cbf)",border:"none",borderRadius:12,padding:"12px 24px",color:"#fff",fontWeight:700,cursor:"pointer" }}>S'inscrire</button>
              <button onClick={()=>navigate("/login")} style={{ background:"#f3f4f6",border:"1px solid #e5e7eb",borderRadius:12,padding:"12px 24px",color:"#374151",fontWeight:600,cursor:"pointer" }}>Se connecter</button>
            </div>
            <button onClick={()=>setNudge(false)} style={{ background:"none",border:"none",color:"#9ca3af",cursor:"pointer",fontSize:13 }}>Continuer en visiteur</button>
          </div>
        </div>
      )}
    </div>
  );
}