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

// Extraire roomCode et vt depuis n'importe quel format de lien
function extractViewerInfo(streamLink) {
  if (!streamLink) return { roomCode:null, vt:null };
  try {
    const url = new URL(streamLink);
    const parts    = url.pathname.split("/").filter(Boolean);
    const roomCode = parts[parts.length - 1];
    const vt       = url.searchParams.get("vt") || url.searchParams.get("at");
    if (!roomCode || !vt) return { roomCode: null, vt: null };
    return { roomCode, vt };
  } catch {
    return { roomCode: null, vt: null };
  }
}

export default function LiveSection({ activeLiveLink, onLiveLinkReceived }) {
  const navigate = useNavigate();
  const auth     = getAuth();

  const [live,       setLive]      = useState(null);
  const [loading,    setLoading]   = useState(true);
  const [alertShow,  setAlertShow] = useState(false);
  const [joined,     setJoined]    = useState(false);
  const [msgs,       setMsgs]      = useState([]);
  const [input,      setInput]     = useState("");
  const [reactions,  setReactions] = useState({});
  const [floats,     setFloats]    = useState([]);
  const [myReaction, setMyReact]   = useState(null);
  const [nudge,      setNudge]     = useState(false);
  const [copied,     setCopied]    = useState(false);

  // ── Chatbot ─────────────────────────────────────────
  const [cbOpen,    setCbOpen]   = useState(false);
  const [cbInput,   setCbInput]  = useState("");
  const [cbMsgs,    setCbMsgs]   = useState([
    { from:"bot", text:"👋 Salam ! Je suis l'assistant Swafy. Pose-moi tes questions sur ce live !" }
  ]);
  const [cbLoading, setCbLoading]= useState(false);
  const cbEndRef = useRef(null);

  const sockRef   = useRef(null);
  const chatEnd   = useRef(null);
  const joinedRef = useRef(false);

  // ── Fetch live actif ─────────────────────────────────
  const fetchActiveLive = async () => {
    try {
      const headers = {};
      if (auth.token) headers["Authorization"] = `Bearer ${auth.token}`;
      const res  = await fetch(`${SOCKET_URL}/api/lives`, { headers });
      const data = await res.json();
      const list = Array.isArray(data) ? data : [];
      const active = list.find(l => l.is_active === 1 || l.is_active === true);
      if (active) {
        // ✅ FIX: si stream_link null dans DB, essayer activeLiveLink prop ou localStorage
        const fallbackLink = activeLiveLink || localStorage.getItem("currentLiveViewerLink") || "";
        const streamLink = active.stream_link || fallbackLink;

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
        // ✅ FIX: si API dit pas de live actif mais on a un lien en mémoire → garder
        if (!activeLiveLink) setLive(null);
      }
    } catch { /* garder l'état actuel */ }
    finally { setLoading(false); }
  };

  useEffect(() => {
    fetchActiveLive();
    const interval = setInterval(fetchActiveLive, 10000);
    return () => clearInterval(interval);
  }, [activeLiveLink]); // ✅ re-run si activeLiveLink change (reçu depuis JeuneLayout via socket)

  // ✅ FIX: si activeLiveLink arrive depuis JeuneLayout (socket live-started)
  // et qu'on a pas encore de live ou le streamLink est vide → mettre à jour immédiatement
  useEffect(() => {
    if (!activeLiveLink) return;
    setLive(prev => {
      if (!prev) {
        // Extraire roomCode depuis le lien
        try {
          const url = new URL(activeLiveLink);
          const parts = url.pathname.split("/").filter(Boolean);
          const roomCode = parts[parts.length - 1];
          return {
            roomCode,
            title:       "Live en cours",
            description: "",
            hostName:    "Admin",
            thematique:  "",
            streamLink:  activeLiveLink,
            startedAt:   new Date(),
          };
        } catch { return prev; }
      }
      // Si live existe mais streamLink vide → mettre à jour
      if (!prev.streamLink) return { ...prev, streamLink: activeLiveLink };
      return prev;
    });
    setLoading(false);
  }, [activeLiveLink]);

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
      const newLive = {
        roomCode,
        title:       title       || "Live en cours",
        description: description || "",
        hostName:    hostName    || "Admin",
        thematique:  thematique  || "",
        streamLink:  viewerLink  || "",
        startedAt:   new Date(),
      };
      setLive(newLive);
      setAlertShow(true);
      setJoined(false);
      joinedRef.current = false;
      setMsgs([]);
      if (viewerLink) {
        localStorage.setItem("currentLiveViewerLink", viewerLink);
        onLiveLinkReceived?.(viewerLink); // ✅ Notifier JeuneLayout
      }

      // ✅ Sauvegarder notification localement pour la page Notifications
      try {
        const stored = JSON.parse(localStorage.getItem("live_notifications") || "[]");
        stored.unshift({
          id: Date.now(),
          type: "live_started",
          title: title || "Live en cours",
          hostName: hostName || "Admin",
          viewerLink: viewerLink || "",
          roomCode,
          createdAt: new Date().toISOString(),
          read: false,
        });
        // Garder max 20 notifications
        localStorage.setItem("live_notifications", JSON.stringify(stored.slice(0, 20)));
        // Dispatcher un événement pour que JeuneLayout mette à jour le badge
        window.dispatchEvent(new CustomEvent("live_notification", {
          detail: { title, hostName, viewerLink, roomCode }
        }));
      } catch {}

      setTimeout(() => setAlertShow(false), 12000);
    });

    sock.on("live-ended", ({ roomCode }) => {
      setLive(prev => (prev?.roomCode === roomCode || !roomCode) ? null : prev);
      setJoined(false);
      joinedRef.current = false;
      setMsgs([]);
      setReactions({});
      setCbOpen(false);
    });

    sock.on("receive-message", msg => {
      setMsgs(prev => [...prev, { ...msg, id: Date.now()+Math.random() }]);
      setTimeout(() => chatEnd.current?.scrollIntoView({ behavior:"smooth" }), 50);
    });

    sock.on("reaction", ({ emoji }) => {
      setReactions(prev => ({ ...prev, [emoji]: (prev[emoji]||0)+1 }));
      const id = Date.now()+Math.random();
      setFloats(prev => [...prev,{ id,emoji }]);
      setTimeout(() => setFloats(prev=>prev.filter(f=>f.id!==id)), 3000);
    });

    return () => sock.disconnect();
  }, []);

  // ── Join socket room pour le chat ────────────────────
  useEffect(() => {
    if (!live || !sockRef.current || !auth.ok || joinedRef.current) return;

    // ✅ Essayer streamLink du live, puis activeLiveLink, puis localStorage
    const linkToUse = live.streamLink || activeLiveLink || localStorage.getItem("currentLiveViewerLink") || "";
    const { roomCode, vt } = extractViewerInfo(linkToUse);
    if (!roomCode || !vt) return;

    joinedRef.current = true;
    sockRef.current.emit("join-room", {
      roomCode,
      userName:    auth.name,
      role:        "guest",
      accessToken: vt,
      email:       auth.email,
    }, ack => {
      if (ack?.ok) {
        setJoined(true);
      } else {
        joinedRef.current = false;
        console.warn("join-room refusé:", ack?.message);
      }
    });
  }, [live, auth.ok, activeLiveLink]);

  // ── Rejoindre le live en vidéo ───────────────────────
  const joinLive = () => {
    if (!auth.ok) { setNudge(true); return; }

    // Priorité 1 : streamLink du live actuel (doit avoir ?vt=)
    const { roomCode, vt } = extractViewerInfo(live?.streamLink);
    if (roomCode && vt) {
      navigate(`/meet/${roomCode}?vt=${vt}`);
      return;
    }

    // Priorité 2 : activeLiveLink passé depuis JeuneLayout (le plus frais)
    if (activeLiveLink) {
      const { roomCode: rc2, vt: v2 } = extractViewerInfo(activeLiveLink);
      if (rc2 && v2) {
        navigate(`/meet/${rc2}?vt=${v2}`);
        return;
      }
    }

    // Priorité 3 : lien sauvegardé dans localStorage
    const storedLink = localStorage.getItem("currentLiveViewerLink");
    if (storedLink) {
      const { roomCode: rc, vt: v } = extractViewerInfo(storedLink);
      if (rc && v) {
        navigate(`/meet/${rc}?vt=${v}`);
        return;
      }
    }

    // Priorité 4 : si on a le roomCode mais pas le vt → aller quand même
    if (live?.roomCode) {
      navigate(`/meet/${live.roomCode}`);
      return;
    }

    alert("Lien de live indisponible. L'admin n'a pas encore démarré la salle.");
  };

  // ── Chat ─────────────────────────────────────────────
  const sendMsg = () => {
    if (!auth.ok) { setNudge(true); return; }
    if (!input.trim() || !live) return;
    const { roomCode } = extractViewerInfo(live.streamLink);
    if (!roomCode) return;
    sockRef.current?.emit("send-message", { roomCode, message: input });
    setInput("");
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

  // ── Copy link (viewer link uniquement) ───────────────
  const copyLink = async () => {
    const lnk = live?.streamLink || localStorage.getItem("currentLiveViewerLink") || "";
    if (!lnk) return;
    await navigator.clipboard.writeText(lnk).catch(()=>{});
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  // ── Chatbot ──────────────────────────────────────────
  const sendCb = async () => {
    const text = cbInput.trim();
    if (!text || cbLoading) return;
    const userMsg = { from:"user", text };
    setCbMsgs(m => [...m, userMsg]);
    setCbInput("");
    setCbLoading(true);
    try {
      const history = cbMsgs
        .filter(m => m.from === "user" || m.from === "bot")
        .map(m => ({ sender: m.from === "user" ? "user" : "bot", text: m.text }));
      const res = await API.post("/chatbot", {
        message: text,
        history,
        context: live ? `Live actif: "${live.title}" — thématique: ${live.thematique}` : ""
      });
      const reply = res.data?.reply || "Je n'ai pas compris. Pouvez-vous reformuler ?";
      setCbMsgs(m => [...m, { from:"bot", text: reply }]);
    } catch {
      setCbMsgs(m => [...m, { from:"bot", text:"❌ Erreur de connexion. Réessayez." }]);
    } finally {
      setCbLoading(false);
      setTimeout(() => cbEndRef.current?.scrollIntoView({ behavior:"smooth" }), 50);
    }
  };

  const ANIM = `
    @keyframes slideDown{from{opacity:0;transform:translateY(-8px)}to{opacity:1;transform:translateY(0)}}
    @keyframes floatUp{0%{opacity:1;transform:translateY(0)}100%{opacity:0;transform:translateY(-70px) scale(1.3)}}
    @keyframes pulseDot{0%,100%{opacity:1}50%{opacity:.3}}
    @keyframes scaleIn{from{transform:scale(.9);opacity:0}to{transform:scale(1);opacity:1}}
    @keyframes spin{to{transform:rotate(360deg)}}
    @keyframes popIn{from{transform:scale(.88) translateY(10px);opacity:0}to{transform:scale(1) translateY(0);opacity:1}}
    ::-webkit-scrollbar{width:4px}
    ::-webkit-scrollbar-thumb{background:rgba(0,0,0,.12);border-radius:4px}
  `;

  // ── NO LIVE ──────────────────────────────────────────
  if (loading) return (
    <div style={S.center}>
      <style>{ANIM}</style>
      <div style={S.spinner} />
      <p style={{ color:"#6b7280",marginTop:16,fontSize:14 }}>Vérification des lives actifs…</p>
    </div>
  );

  if (!live) return (
    <div style={S.noLive}>
      <style>{ANIM}</style>
      <div style={{ textAlign:"center" }}>
        <div style={{ fontSize:56,marginBottom:12 }}>📡</div>
        <h3 style={{ color:"#1f2937",fontSize:20,fontWeight:800,margin:"0 0 8px" }}>Aucun live en cours</h3>
        <p style={{ color:"#6b7280",fontSize:14,marginBottom:16 }}>Restez connecté — vous serez notifié dès qu'un live commence.</p>
        <button onClick={fetchActiveLive}
          style={{ background:"linear-gradient(135deg,#7c3aed,#3b82f6)",border:"none",borderRadius:10,padding:"9px 20px",color:"#fff",fontWeight:600,fontSize:13,cursor:"pointer" }}>
          🔄 Vérifier maintenant
        </button>
      </div>
    </div>
  );

  // ── LIVE EN COURS ────────────────────────────────────
  return (
    <div style={{ fontFamily:"'Inter',sans-serif",position:"relative" }}>
      <style>{ANIM}</style>

      {/* ALERTE live démarré */}
      {alertShow && (
        <div style={S.alert}>
          <span style={S.alertDot} />
          🎙️ <strong>{live.hostName}</strong> a démarré un live !
          {live.title !== "Live en cours" && <em style={{ opacity:.85,marginLeft:4 }}>"{live.title}"</em>}
          <button onClick={joinLive}
            style={{ marginLeft:"auto",background:"rgba(255,255,255,.25)",border:"1px solid rgba(255,255,255,.4)",borderRadius:8,padding:"5px 14px",color:"#fff",cursor:"pointer",fontWeight:700,fontSize:13,whiteSpace:"nowrap" }}>
            ▶ Rejoindre
          </button>
          <button onClick={()=>setAlertShow(false)} style={S.alertX}>✕</button>
        </div>
      )}

      {/* GRID */}
      <div style={S.grid}>

        {/* LEFT */}
        <div style={{ display:"flex",flexDirection:"column",gap:14 }}>

          {/* Preview */}
          <div style={S.preview}>
            <div style={S.liveBadge}>
              <span style={{ width:8,height:8,borderRadius:"50%",background:"#ef4444",display:"inline-block",animation:"pulseDot 1s infinite" }} />
              🔴 EN DIRECT
            </div>
            <div style={{ textAlign:"center",zIndex:1,padding:"0 20px" }}>
              <div style={{ fontSize:64,marginBottom:10 }}>🎥</div>
              <p style={{ color:"#fff",fontWeight:700,fontSize:16,marginBottom:4 }}>{live.title}</p>
              {live.description && (
                <p style={{ color:"rgba(255,255,255,.65)",fontSize:13,maxWidth:280,margin:"0 auto 6px" }}>{live.description}</p>
              )}
              {live.thematique && (
                <span style={{ background:"rgba(124,58,237,.3)",color:"#c4b5fd",fontSize:11,padding:"3px 10px",borderRadius:20 }}>🎯 {live.thematique}</span>
              )}
              {live.hostName && (
                <p style={{ color:"rgba(255,255,255,.45)",fontSize:11,marginTop:8 }}>Animé par <strong style={{ color:"rgba(255,255,255,.75)" }}>{live.hostName}</strong></p>
              )}
            </div>
            {/* Réactions flottantes */}
            <div style={{ position:"absolute",bottom:20,left:"50%",transform:"translateX(-50%)",display:"flex",gap:8,pointerEvents:"none" }}>
              {floats.map(f=><span key={f.id} style={{ fontSize:30,animation:"floatUp 3s ease-out forwards" }}>{f.emoji}</span>)}
            </div>
          </div>

          {/* Boutons principaux */}
          <div style={{ display:"flex",gap:10 }}>
            <button onClick={joinLive} style={{ ...S.joinBtn, flex:1 }}>
              ▶ Entrer dans le Live
            </button>
            {/* ✅ Chatbot — visible uniquement pendant un live */}
            <button onClick={() => setCbOpen(o => !o)}
              style={{ background: cbOpen ? "linear-gradient(135deg,#7c3aed,#5a1fa0)" : "rgba(124,58,237,.1)", border:"1px solid rgba(124,58,237,.3)", borderRadius:14, padding:"14px 16px", color: cbOpen ? "#fff" : "#7c3aed", cursor:"pointer", fontSize:20, transition:"all .2s", flexShrink:0 }}
              title="Assistant IA">
              🤖
            </button>
          </div>

          {/* Partager le lien viewer */}
          {live.streamLink && (
            <div style={S.linkBox}>
              <span style={{ color:"#6b7280",fontSize:11,flex:1,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap" }}>
                🔗 {live.streamLink.length>70 ? live.streamLink.slice(0,70)+"…" : live.streamLink}
              </span>
              <button onClick={copyLink} style={S.copyBtn}>{copied?"✅":"📋"}</button>
            </div>
          )}

          {/* Réactions */}
          <div style={{ display:"flex",gap:6,flexWrap:"wrap" }}>
            {EMOJIS.map(e=>(
              <button key={e} onClick={()=>sendReaction(e)} style={{
                background: myReaction===e?"rgba(124,58,237,.2)":"rgba(0,0,0,.04)",
                border:     myReaction===e?"2px solid #7c3aed":"2px solid transparent",
                borderRadius:20,padding:"6px 12px",cursor:"pointer",fontSize:16,
                display:"flex",alignItems:"center",gap:4,transition:"all .15s",
              }}>
                {e}
                {reactions[e]>0 && <span style={{ fontSize:11,color:"#6b7280",fontWeight:600 }}>{reactions[e]}</span>}
              </button>
            ))}
          </div>
        </div>

        {/* RIGHT: Chat */}
        <div style={S.chatBox}>
          <div style={S.chatHead}>
            <span style={{ fontWeight:700,fontSize:14,color:"#1f2937" }}>💬 Discussion en direct</span>
            {joined && <span style={{ fontSize:10,color:"#34a853",fontWeight:600,background:"rgba(52,168,83,.1)",padding:"2px 8px",borderRadius:20 }}>● Connecté</span>}
          </div>

          <div style={{ flex:1,overflowY:"auto",padding:"10px 12px",display:"flex",flexDirection:"column",gap:10,maxHeight:360,minHeight:200 }}>
            {msgs.length===0 ? (
              <div style={{ color:"#9ca3af",fontSize:13,textAlign:"center",padding:"20px 0" }}>
                Soyez le premier à écrire…
              </div>
            ) : msgs.map(m=>(
              <div key={m.id} style={{ display:"flex",gap:8,alignItems:"flex-start" }}>
                <div style={{ width:28,height:28,borderRadius:"50%",display:"flex",alignItems:"center",justifyContent:"center",fontWeight:800,fontSize:11,flexShrink:0,marginTop:2,color:"#fff",background:m.role==="host"?"linear-gradient(135deg,#7c3aed,#5a2fa0)":"linear-gradient(135deg,#1a73e8,#0d47a1)" }}>
                  {(m.user||"?")[0].toUpperCase()}
                </div>
                <div style={{ flex:1 }}>
                  <div style={{ display:"flex",alignItems:"center",gap:5,marginBottom:2 }}>
                    {m.role==="host" && <span style={{ background:"#7c3aed",color:"#fff",fontSize:9,fontWeight:800,padding:"1px 6px",borderRadius:10 }}>HOST</span>}
                    <span style={{ color:m.role==="host"?"#7c3aed":"#1a73e8",fontWeight:700,fontSize:12 }}>{m.user}</span>
                  </div>
                  <span style={{ color:"#374151",fontSize:13,lineHeight:1.5 }}>{m.text}</span>
                  <div style={{ color:"#9ca3af",fontSize:10,marginTop:2 }}>{m.time}</div>
                </div>
              </div>
            ))}
            <div ref={chatEnd} />
          </div>

          <div style={S.chatInput}>
            {auth.ok ? (
              <>
                <input value={input} onChange={e=>setInput(e.target.value)}
                  onKeyDown={e=>e.key==="Enter"&&sendMsg()}
                  placeholder="Écrire un commentaire…"
                  style={{ flex:1,background:"#f9fafb",border:"1px solid #e5e7eb",borderRadius:20,padding:"9px 14px",color:"#1f2937",fontSize:13,outline:"none",fontFamily:"inherit" }} />
                <button onClick={sendMsg}
                  style={{ background:"#7c3aed",border:"none",borderRadius:"50%",width:36,height:36,color:"#fff",cursor:"pointer",fontSize:14,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0 }}>➤</button>
              </>
            ) : (
              <button onClick={()=>setNudge(true)}
                style={{ flex:1,background:"#f3f4f6",border:"1px solid #e5e7eb",borderRadius:10,padding:"10px",color:"#6b7280",cursor:"pointer",fontSize:13,textAlign:"center" }}>
                🔒 Connectez-vous pour commenter
              </button>
            )}
          </div>
        </div>
      </div>

      {/* ✅ CHATBOT PANEL — uniquement pendant live */}
      {cbOpen && (
        <div style={{ marginTop:16,background:"#fff",borderRadius:18,border:"1px solid #e5e7eb",boxShadow:"0 4px 24px rgba(124,58,237,.12)",overflow:"hidden",animation:"popIn .25s ease" }}>
          <div style={{ display:"flex",alignItems:"center",justifyContent:"space-between",padding:"12px 16px",background:"linear-gradient(135deg,#7c3aed,#5a1fa0)" }}>
            <span style={{ color:"#fff",fontWeight:700,fontSize:14 }}>🤖 Assistant IA — Live</span>
            <button onClick={()=>setCbOpen(false)} style={{ background:"rgba(255,255,255,.2)",border:"none",color:"#fff",borderRadius:6,padding:"3px 8px",cursor:"pointer",fontSize:13 }}>✕</button>
          </div>
          <div style={{ height:240,overflowY:"auto",padding:"12px 14px",display:"flex",flexDirection:"column",gap:10 }}>
            {cbMsgs.map((m,i)=>(
              <div key={i} style={{ display:"flex",justifyContent:m.from==="user"?"flex-end":"flex-start" }}>
                <div style={{ maxWidth:"80%",background:m.from==="user"?"linear-gradient(135deg,#7c3aed,#5a1fa0)":"#f3f4f6",color:m.from==="user"?"#fff":"#1f2937",borderRadius:12,padding:"8px 12px",fontSize:13,lineHeight:1.5 }}>
                  {m.text}
                </div>
              </div>
            ))}
            {cbLoading && (
              <div style={{ display:"flex",justifyContent:"flex-start" }}>
                <div style={{ background:"#f3f4f6",borderRadius:12,padding:"8px 14px",color:"#9ca3af",fontSize:13 }}>💭 En cours…</div>
              </div>
            )}
            <div ref={cbEndRef} />
          </div>
          <div style={{ display:"flex",gap:6,padding:"8px 12px",borderTop:"1px solid #f3f4f6" }}>
            <input value={cbInput} onChange={e=>setCbInput(e.target.value)}
              onKeyDown={e=>e.key==="Enter"&&sendCb()}
              placeholder="Posez votre question…"
              style={{ flex:1,background:"#f9fafb",border:"1px solid #e5e7eb",borderRadius:20,padding:"8px 14px",color:"#1f2937",fontSize:13,outline:"none",fontFamily:"inherit" }} />
            <button onClick={sendCb} disabled={cbLoading}
              style={{ background:"#7c3aed",border:"none",borderRadius:"50%",width:36,height:36,color:"#fff",cursor:"pointer",fontSize:14,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0,opacity:cbLoading?.6:1 }}>➤</button>
          </div>
        </div>
      )}

      {/* MODAL INSCRIPTION */}
      {nudge && (
        <div style={{ position:"fixed",inset:0,background:"rgba(0,0,0,.6)",backdropFilter:"blur(8px)",display:"flex",alignItems:"center",justifyContent:"center",zIndex:999 }}>
          <div style={{ background:"#fff",borderRadius:22,padding:"44px 36px",maxWidth:400,width:"90%",textAlign:"center",animation:"scaleIn .3s ease",boxShadow:"0 24px 80px rgba(0,0,0,.2)" }}>
            <div style={{ fontSize:44,marginBottom:12 }}>👋</div>
            <h3 style={{ color:"#1f2937",margin:"0 0 8px",fontSize:18,fontWeight:800 }}>Rejoignez la discussion !</h3>
            <p style={{ color:"#6b7280",fontSize:14,margin:"0 0 24px",lineHeight:1.6 }}>
              Créez un compte gratuit pour commenter, réagir et participer aux lives.
            </p>
            <div style={{ display:"flex",gap:10,justifyContent:"center",marginBottom:12 }}>
              <button onClick={()=>navigate("/register")} style={{ background:"linear-gradient(135deg,#7c3aed,#3b82f6)",border:"none",borderRadius:12,padding:"12px 24px",color:"#fff",fontWeight:700,cursor:"pointer" }}>S'inscrire</button>
              <button onClick={()=>navigate("/login")} style={{ background:"#f3f4f6",border:"1px solid #e5e7eb",borderRadius:12,padding:"12px 24px",color:"#374151",fontWeight:600,cursor:"pointer" }}>Se connecter</button>
            </div>
            <button onClick={()=>setNudge(false)} style={{ background:"none",border:"none",color:"#9ca3af",cursor:"pointer",fontSize:13 }}>Continuer en visiteur</button>
          </div>
        </div>
      )}
    </div>
  );
}

const S = {
  center:    { display:"flex",alignItems:"center",justifyContent:"center",flexDirection:"column",minHeight:280,background:"#ffffff",borderRadius:20 },
  spinner:   { width:40,height:40,border:"3px solid #e5e7eb",borderTopColor:"#7c3aed",borderRadius:"50%",animation:"spin .8s linear infinite" },
  noLive:    { display:"flex",alignItems:"center",justifyContent:"center",minHeight:320,background:"#ffffff",borderRadius:20,border:"2px dashed #e5e7eb",boxShadow:"0 2px 12px rgba(90,63,160,.06)" },
  alert:     { display:"flex",alignItems:"center",gap:10,background:"linear-gradient(135deg,#7c3aed,#3b82f6)",color:"#fff",borderRadius:12,padding:"12px 18px",marginBottom:16,animation:"slideDown .4s ease",fontSize:14,fontWeight:500,flexWrap:"wrap" },
  alertDot:  { width:10,height:10,background:"#fca5a5",borderRadius:"50%",animation:"pulseDot 1.2s infinite",flexShrink:0 },
  alertX:    { background:"none",border:"none",color:"rgba(255,255,255,.7)",cursor:"pointer",fontSize:16 },
  grid:      { display:"grid",gridTemplateColumns:"1fr 360px",gap:16 },
  preview:   { background:"linear-gradient(160deg,#0f0c29,#1a1a3e)",borderRadius:18,minHeight:280,position:"relative",overflow:"hidden",display:"flex",alignItems:"center",justifyContent:"center",border:"1px solid rgba(255,255,255,.06)" },
  liveBadge: { position:"absolute",top:12,left:12,display:"flex",alignItems:"center",gap:6,background:"rgba(239,68,68,.15)",border:"1px solid rgba(239,68,68,.4)",borderRadius:20,padding:"4px 12px",color:"#fca5a5",fontSize:11,fontWeight:800,letterSpacing:1 },
  joinBtn:   { background:"linear-gradient(135deg,#7c3aed,#3b82f6)",border:"none",borderRadius:14,padding:"14px 0",color:"#fff",fontSize:15,fontWeight:800,cursor:"pointer",boxShadow:"0 8px 24px rgba(124,58,237,.35)",transition:"transform .15s" },
  linkBox:   { display:"flex",alignItems:"center",gap:8,background:"#f3f4f6",borderRadius:10,padding:"8px 12px",border:"1px solid #e5e7eb" },
  copyBtn:   { background:"none",border:"none",cursor:"pointer",fontSize:16,flexShrink:0 },
  chatBox:   { background:"#fff",borderRadius:18,border:"1px solid #e5e7eb",display:"flex",flexDirection:"column",overflow:"hidden",boxShadow:"0 2px 12px rgba(0,0,0,.06)" },
  chatHead:  { display:"flex",alignItems:"center",justifyContent:"space-between",padding:"14px 16px",borderBottom:"1px solid #f3f4f6" },
  chatInput: { display:"flex",gap:6,padding:"10px 12px",borderTop:"1px solid #f3f4f6" },
};