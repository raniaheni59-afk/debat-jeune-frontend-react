import { useEffect, useRef, useState, useCallback } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import { io } from "socket.io-client";

const SOCKET_URL = "https://debat-jeune-production.up.railway.app";
const ANTHROPIC_URL = "https://api.anthropic.com/v1/messages";

/* ── CSS animations ── */
const STYLE = `
@keyframes spin    { to { transform: rotate(360deg); } }
@keyframes floatUp { 0%{opacity:1;transform:translateY(0) scale(1)} 100%{opacity:0;transform:translateY(-80px) scale(1.4)} }
@keyframes fadeIn  { from{opacity:0;transform:translateY(8px)} to{opacity:1;transform:translateY(0)} }
@keyframes pulse   { 0%,100%{opacity:1} 50%{opacity:.5} }
@keyframes slideIn { from{opacity:0;transform:translateX(20px)} to{opacity:1;transform:translateX(0)} }
@keyframes popIn   { 0%{transform:scale(0.8);opacity:0} 100%{transform:scale(1);opacity:1} }
`;

/* ── Speech recognition hook ── */
function useSubtitles(enabled, lang) {
  const [text, setText] = useState("");
  const [fullTranscript, setFull] = useState([]);
  const recRef = useRef(null);
  useEffect(() => {
    if (!enabled) { setText(""); return; }
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) return;
    const r = new SR();
    r.continuous = true; r.interimResults = true;
    r.lang = lang === "ar" ? "ar-TN" : lang === "en" ? "en-US" : "fr-FR";
    r.onresult = (e) => {
      const interim = Array.from(e.results).map(x => x[0].transcript).join(" ");
      setText(interim);
      const finals = Array.from(e.results).filter(r => r.isFinal).map(r => r[0].transcript);
      if (finals.length) setFull(prev => [...prev, ...finals]);
    };
    r.start(); recRef.current = r;
    return () => { try { r.stop(); } catch {} };
  }, [enabled, lang]);
  return { text, fullTranscript };
}

/* ── Video Tile ── */
function Tile({ stream, muted=false, name="?", role="guest", videoOff=false, hand=false, isLocal=false, localRef, screenSharing=false }) {
  const ref = useRef(null);
  const vRef = isLocal ? localRef : ref;
  useEffect(() => { if (vRef?.current && stream) vRef.current.srcObject = stream; }, [stream]);
  const init = (name||"?").split(" ").map(w=>w[0]).join("").slice(0,2).toUpperCase();
  const colors = { host:"linear-gradient(135deg,#7c3aed,#4f46e5)", guest:"linear-gradient(135deg,#1e40af,#0284c7)" };
  return (
    <div style={{ ...T.wrap, boxShadow: hand ? "0 0 0 3px #f59e0b" : "0 4px 24px rgba(0,0,0,.4)" }}>
      <video ref={vRef} autoPlay playsInline muted={muted}
        style={{ ...T.vid, display: (!videoOff && (stream||isLocal)) ? "block" : "none" }} />
      {(videoOff || (!stream && !isLocal)) && (
        <div style={T.avatarBox}>
          <div style={{ ...T.avatar, background: colors[role]||colors.guest }}>{init}</div>
        </div>
      )}
      <div style={T.foot}>
        {role==="host" && <span style={T.hostBadge}>HOST</span>}
        {screenSharing && <span style={T.screenBadge}>🖥️ Écran</span>}
        <span style={T.name}>{isLocal ? `${name} (Vous)` : name}</span>
        {hand && <span style={{ fontSize:16, animation:"pulse 1s infinite" }}>✋</span>}
        {!muted && <span style={T.micOn}>🎤</span>}
      </div>
      {videoOff && <div style={T.videoOffBadge}>📷 Off</div>}
    </div>
  );
}
const T = {
  wrap: { position:"relative", background:"#0d1117", borderRadius:16, overflow:"hidden", aspectRatio:"16/9", minHeight:160, transition:"box-shadow .3s" },
  vid:  { width:"100%", height:"100%", objectFit:"cover" },
  avatarBox: { position:"absolute", inset:0, display:"flex", alignItems:"center", justifyContent:"center", background:"radial-gradient(circle at 30% 30%, #1a1f2e, #0d1117)" },
  avatar: { width:64, height:64, borderRadius:"50%", display:"flex", alignItems:"center", justifyContent:"center", fontSize:22, fontWeight:800, color:"#fff", boxShadow:"0 8px 32px rgba(0,0,0,.4)" },
  foot: { position:"absolute", bottom:8, left:8, display:"flex", gap:6, alignItems:"center", flexWrap:"wrap" },
  hostBadge: { background:"linear-gradient(135deg,#7c3aed,#4f46e5)", color:"#fff", fontSize:9, fontWeight:800, padding:"2px 8px", borderRadius:20, letterSpacing:1, textTransform:"uppercase" },
  screenBadge: { background:"rgba(0,0,0,.7)", color:"#60a5fa", fontSize:10, padding:"2px 8px", borderRadius:8 },
  name: { background:"rgba(0,0,0,.65)", backdropFilter:"blur(4px)", color:"#fff", fontSize:12, padding:"3px 9px", borderRadius:8 },
  micOn: { fontSize:11, opacity:.7 },
  videoOffBadge: { position:"absolute", top:8, right:8, background:"rgba(0,0,0,.7)", color:"#f87171", fontSize:10, padding:"3px 8px", borderRadius:8 },
};

/* ── Control Button ── */
function Btn({ icon, label, onClick, active=true, danger=false, badge=0, pulse=false }) {
  return (
    <button onClick={onClick} style={{ ...B.btn, background: !active||danger ? "linear-gradient(135deg,#dc2626,#b91c1c)" : "rgba(255,255,255,.1)", animation: pulse ? "pulse 1.5s infinite" : "none" }}>
      <span style={{ fontSize:20 }}>{icon}</span>
      <span style={B.lbl}>{label}</span>
      {badge>0 && <span style={B.badge}>{badge}</span>}
    </button>
  );
}
const B = {
  btn: { border:"none", borderRadius:14, padding:"10px 14px", color:"#fff", cursor:"pointer", display:"flex", flexDirection:"column", alignItems:"center", gap:3, minWidth:60, transition:"all .2s", position:"relative", backdropFilter:"blur(8px)" },
  lbl: { fontSize:10, fontWeight:600, whiteSpace:"nowrap", opacity:.85 },
  badge: { position:"absolute", top:-4, right:-4, background:"#ef4444", color:"#fff", borderRadius:"50%", width:18, height:18, display:"flex", alignItems:"center", justifyContent:"center", fontSize:10, fontWeight:800 },
};

/* ══════════════════════════════════════════════════════════════════
   MAIN COMPONENT
══════════════════════════════════════════════════════════════════ */
export default function MeetRoom() {
  const { roomCode } = useParams();
  const [sp] = useSearchParams();
  const navigate = useNavigate();

  const token  = sp.get("at") || sp.get("vt") || "";
  const myRole = sp.get("at") ? "host" : "guest";
  const user   = JSON.parse(localStorage.getItem("user") || "{}");
  const myName = user?.prenom_user ? `${user.prenom_user} ${user.nom_user||""}`.trim() : user?.name || "Invité";

  /* ── State ── */
  const [status,       setStatus]      = useState("loading");
  const [errorMsg,     setErrorMsg]    = useState("");
  const [audioOn,      setAudioOn]     = useState(true);
  const [videoOn,      setVideoOn]     = useState(true);
  const [hand,         setHand]        = useState(false);
  const [screen,       setScreen]      = useState(false);
  const [subs,         setSubs]        = useState(false);
  const [subLang,      setSubLang]     = useState("fr");
  const [chatOpen,     setChatOpen]    = useState(false);
  const [panelOpen,    setPanelOpen]   = useState(false);
  const [aiOpen,       setAiOpen]      = useState(false);
  const [msgs,         setMsgs]        = useState([]);
  const [input,        setInput]       = useState("");
  const [unread,       setUnread]      = useState(0);
  const [peers,        setPeers]       = useState([]);
  const [pMedia,       setPMedia]      = useState({});
  const [ptcps,        setPtcps]       = useState([]);
  const [floats,       setFloats]      = useState([]);
  const [copied,       setCopied]      = useState(false);
  const [aiLoading,    setAiLoading]   = useState(false);
  const [aiResult,     setAiResult]    = useState("");
  const [showLinkBox,  setShowLinkBox] = useState(false);
  const [kickConfirm,  setKickConfirm] = useState(null); // socketId
  const [toast,        setToast]       = useState(null);

  /* ── Refs ── */
  const sockRef   = useRef(null);
  const localVid  = useRef(null);
  const localStr  = useRef(null);
  const screenStr = useRef(null);
  const peerMap   = useRef({});
  const nameMap   = useRef({});
  const chatEnd   = useRef(null);

  const { text: subtitle, fullTranscript } = useSubtitles(subs, subLang);

  /* ── Viewer link ── */
  const viewerLink = localStorage.getItem("currentLiveViewerLink") || "";

  const showToast = (msg, color="#7c3aed") => {
    setToast({ msg, color });
    setTimeout(() => setToast(null), 3000);
  };

  /* ── createPeer ── */
  const createPeer = useCallback((tid) => {
    const pc = new RTCPeerConnection({ iceServers: [
      { urls:"stun:stun.l.google.com:19302" },
      { urls:"stun:stun1.l.google.com:19302" },
    ]});
    pc.onicecandidate = e => e.candidate && sockRef.current?.emit("ice-candidate", { target:tid, candidate:e.candidate });
    pc.ontrack = e => {
      const st = e.streams[0];
      setPeers(prev => {
        const ex = prev.find(p=>p.id===tid);
        return ex ? prev.map(p=>p.id===tid ? {...p,stream:st} : p)
                  : [...prev, {id:tid, stream:st, name:nameMap.current[tid]||"Invité"}];
      });
    };
    localStr.current?.getTracks().forEach(t => pc.addTrack(t, localStr.current));
    return pc;
  }, []);

  /* ── Init ── */
  useEffect(() => {
    if (!token) { setErrorMsg("Token manquant"); setStatus("error"); return; }
    let alive = true;
    (async () => {
      try {
        const st = await navigator.mediaDevices.getUserMedia({ video:true, audio:true });
        if (!alive) { st.getTracks().forEach(t=>t.stop()); return; }
        localStr.current = st;
        if (localVid.current) localVid.current.srcObject = st;
      } catch { setAudioOn(false); setVideoOn(false); }

      setStatus("ok");
      const sock = io(SOCKET_URL, { transports:["websocket"] });
      sockRef.current = sock;

      sock.on("connect", () => {
        sock.emit("join-room", { roomCode, userName:myName, role:myRole, accessToken:token }, ack => {
          if (!ack?.ok) { setErrorMsg(ack?.message||"Accès refusé"); setStatus("error"); }
        });
      });

      sock.on("all-users", async users => {
        for (const u of users) {
          nameMap.current[u.socketId] = u.userName;
          const pc = createPeer(u.socketId); peerMap.current[u.socketId] = pc;
          const offer = await pc.createOffer();
          await pc.setLocalDescription(offer);
          sock.emit("offer", { target:u.socketId, sdp:offer });
        }
      });

      sock.on("user-joined", ({ socketId, userName:n, role }) => {
        nameMap.current[socketId] = n;
        showToast(`👋 ${n} a rejoint`);
      });

      sock.on("offer", async ({ caller, sdp }) => {
        let pc = peerMap.current[caller];
        if (!pc) { pc = createPeer(caller); peerMap.current[caller] = pc; }
        await pc.setRemoteDescription(new RTCSessionDescription(sdp));
        const ans = await pc.createAnswer();
        await pc.setLocalDescription(ans);
        sock.emit("answer", { target:caller, sdp:ans });
      });

      sock.on("answer", async ({ responder, sdp }) => {
        await peerMap.current[responder]?.setRemoteDescription(new RTCSessionDescription(sdp));
      });

      sock.on("ice-candidate", async ({ from, candidate }) => {
        try { await peerMap.current[from]?.addIceCandidate(new RTCIceCandidate(candidate)); } catch {}
      });

      sock.on("user-left", ({ socketId }) => {
        const name = nameMap.current[socketId];
        if (name) showToast(`👋 ${name} a quitté`, "#64748b");
        peerMap.current[socketId]?.close(); delete peerMap.current[socketId];
        setPeers(prev => prev.filter(p=>p.id!==socketId));
      });

      sock.on("user-media-toggled", ({ socketId, type, enabled }) => {
        setPMedia(prev => ({...prev, [socketId]: {...prev[socketId], [type]:enabled}}));
      });

      sock.on("participants-update", setPtcps);

      sock.on("receive-message", msg => {
        setMsgs(prev => [...prev, msg]);
        setChatOpen(o => { if (!o) setUnread(n=>n+1); return o; });
      });

      sock.on("reaction", ({ userName:n, emoji }) => {
        const id = Date.now()+Math.random();
        setFloats(prev => [...prev, {id,n,emoji}]);
        setTimeout(() => setFloats(prev=>prev.filter(f=>f.id!==id)), 3000);
      });

      sock.on("hand-raised", ({ socketId, userName:n, raised }) => {
        setPMedia(prev => ({...prev, [socketId]: {...prev[socketId], hand:raised}}));
        if (raised && myRole==="host") showToast(`✋ ${n} lève la main`,"#f59e0b");
      });

      sock.on("force-mute", ({ type }) => {
        const trk = type==="audio" ? localStr.current?.getAudioTracks()[0] : localStr.current?.getVideoTracks()[0];
        if (trk) { trk.enabled=false; type==="audio" ? setAudioOn(false) : setVideoOn(false); }
        showToast(`🔇 L'hôte a coupé votre ${type==="audio"?"micro":"caméra"}`, "#ef4444");
      });

      sock.on("force-kicked", () => { alert("Vous avez été retiré de la réunion."); cleanup(); navigate(-1); });
      sock.on("live-ended",   () => { alert("Le live est terminé."); cleanup(); navigate(-1); });

      sock.on("screen-share-started", ({ socketId }) => {
        setPMedia(prev => ({...prev, [socketId]: {...prev[socketId], screenSharing:true}}));
      });
      sock.on("screen-share-stopped", ({ socketId }) => {
        setPMedia(prev => ({...prev, [socketId]: {...prev[socketId], screenSharing:false}}));
      });
    })();
    return () => { alive=false; cleanup(); };
  }, [roomCode, token, myRole, myName, createPeer]);

  useEffect(() => { chatEnd.current?.scrollIntoView({behavior:"smooth"}); }, [msgs]);

  /* ── Actions ── */
  const cleanup = () => {
    sockRef.current?.emit("leave-room"); sockRef.current?.disconnect();
    Object.values(peerMap.current).forEach(pc=>pc.close()); peerMap.current={};
    localStr.current?.getTracks().forEach(t=>t.stop());
    screenStr.current?.getTracks().forEach(t=>t.stop());
  };

  const emit = (ev,data) => sockRef.current?.emit(ev,data);

  const toggleAudio = () => {
    const t = localStr.current?.getAudioTracks()[0]; if (!t) return;
    t.enabled=!t.enabled; setAudioOn(t.enabled);
    emit("toggle-media", {roomCode, type:"audio", enabled:t.enabled});
  };

  const toggleVideo = () => {
    const t = localStr.current?.getVideoTracks()[0]; if (!t) return;
    t.enabled=!t.enabled; setVideoOn(t.enabled);
    emit("toggle-media", {roomCode, type:"video", enabled:t.enabled});
  };

  const toggleHand = () => {
    const r=!hand; setHand(r); emit("raise-hand", {roomCode, raised:r});
  };

  const toggleScreen = async () => {
    if (screen) {
      screenStr.current?.getTracks().forEach(t=>t.stop()); screenStr.current=null; setScreen(false);
      emit("screen-share-stopped", {roomCode});
      const cam = localStr.current?.getVideoTracks()[0];
      Object.values(peerMap.current).forEach(pc => {
        const s=pc.getSenders().find(s=>s.track?.kind==="video"); if (s&&cam) s.replaceTrack(cam);
      });
    } else {
      try {
        const ss = await navigator.mediaDevices.getDisplayMedia({video:true, audio:true});
        screenStr.current=ss;
        const trk=ss.getVideoTracks()[0];
        Object.values(peerMap.current).forEach(pc => {
          const s=pc.getSenders().find(s=>s.track?.kind==="video"); if (s) s.replaceTrack(trk);
        });
        trk.onended=toggleScreen;
        setScreen(true); emit("screen-share-started", {roomCode});
      } catch {}
    }
  };

  const sendReaction = (e) => {
    emit("send-reaction", {roomCode, emoji:e});
    const id=Date.now(); setFloats(prev=>[...prev,{id,n:"Vous",emoji:e}]);
    setTimeout(()=>setFloats(prev=>prev.filter(f=>f.id!==id)),3000);
  };

  const sendMsg = () => {
    if (!input.trim()) return;
    emit("send-message", {roomCode, message:input}); setInput("");
  };

  const copyLink = async () => {
    const lnk = viewerLink || window.location.href;
    await navigator.clipboard.writeText(lnk).catch(()=>{});
    setCopied(true); setTimeout(()=>setCopied(false),2500);
    showToast("✅ Lien copié !");
  };

  const adminMute = (targetSocketId, type) => {
    if (myRole!=="host") return;
    emit("admin-mute", {roomCode, targetSocketId, type});
    showToast(`🔇 Micro/caméra coupé`, "#f59e0b");
  };

  const adminKick = (targetSocketId) => {
    if (myRole!=="host") return;
    setKickConfirm(targetSocketId);
  };

  const confirmKick = () => {
    if (!kickConfirm) return;
    emit("admin-kick", {roomCode, targetSocketId:kickConfirm});
    setKickConfirm(null);
    showToast("✅ Participant retiré", "#ef4444");
  };

  /* ── AI Conclusion ── */
  const generateConclusion = async () => {
    if (!fullTranscript.length && msgs.length===0) {
      setAiResult("Pas assez de contenu pour générer une conclusion. Activez les sous-titres et discutez d'abord.");
      return;
    }
    setAiLoading(true); setAiOpen(true);
    try {
      const chatContent = msgs.map(m=>`${m.user}: ${m.text}`).join("\n");
      const speechContent = fullTranscript.join(" ");
      const prompt = `Tu es un assistant expert en résumé de réunions et débats.

Voici le contenu d'une réunion live :

TRANSCRIPTION VOCALE:
${speechContent || "(aucune)"}

MESSAGES CHAT:
${chatContent || "(aucun)"}

Génère une conclusion structurée et professionnelle avec:
1. 📋 Résumé des points principaux discutés
2. 💡 Idées clés et propositions
3. ✅ Points de consensus
4. 🎯 Actions recommandées
5. 📅 Date et contexte: ${new Date().toLocaleDateString("fr-FR", {weekday:"long",day:"numeric",month:"long",year:"numeric"})}

Sois concis, clair et professionnel.`;

      const res = await fetch(ANTHROPIC_URL, {
        method:"POST",
        headers: { "Content-Type":"application/json" },
        body: JSON.stringify({
          model:"claude-sonnet-4-20250514",
          max_tokens:1000,
          messages:[{role:"user", content:prompt}]
        })
      });
      const data = await res.json();
      setAiResult(data.content?.[0]?.text || "Erreur lors de la génération.");
    } catch {
      setAiResult("Erreur de connexion à l'IA. Réessayez.");
    } finally { setAiLoading(false); }
  };

  /* ── Grid ── */
  const total = 1 + peers.length;
  const cols  = total<=1 ? 1 : total<=4 ? 2 : total<=9 ? 3 : 4;

  /* ── Render states ── */
  if (status==="loading") return (
    <div style={S.center}>
      <style>{STYLE}</style>
      <div style={{textAlign:"center"}}>
        <div style={S.spin}/>
        <p style={{color:"#94a3b8",marginTop:16,fontSize:14}}>Connexion en cours…</p>
      </div>
    </div>
  );

  if (status==="error") return (
    <div style={S.center}>
      <style>{STYLE}</style>
      <div style={S.errCard}>
        <div style={{fontSize:48,marginBottom:12}}>🚫</div>
        <p style={{color:"#f1f5f9",fontWeight:700,fontSize:16,margin:"0 0 8px"}}>{errorMsg}</p>
        <p style={{color:"#64748b",fontSize:13,marginBottom:20}}>Vérifiez votre lien ou contactez l'organisateur.</p>
        <button onClick={()=>navigate(-1)} style={S.backBtn}>← Retour</button>
      </div>
    </div>
  );

  /* ─────────────────────────────────────────────────────────── */
  return (
    <div style={S.page}>
      <style>{STYLE}</style>

      {/* TOAST */}
      {toast && (
        <div style={{...S.toast, background:toast.color, animation:"slideIn .3s ease"}}>
          {toast.msg}
        </div>
      )}

      {/* KICK CONFIRM */}
      {kickConfirm && (
        <div style={S.overlay}>
          <div style={S.confirmCard}>
            <div style={{fontSize:40,marginBottom:12}}>⚠️</div>
            <p style={{color:"#f1f5f9",fontWeight:700,marginBottom:8}}>Retirer ce participant ?</p>
            <p style={{color:"#94a3b8",fontSize:13,marginBottom:20}}>Il sera exclu de la réunion.</p>
            <div style={{display:"flex",gap:10,justifyContent:"center"}}>
              <button onClick={()=>setKickConfirm(null)} style={S.cancelBtn}>Annuler</button>
              <button onClick={confirmKick} style={S.dangerBtn}>Retirer</button>
            </div>
          </div>
        </div>
      )}

      {/* HEADER */}
      <div style={S.hdr}>
        <div style={{display:"flex",alignItems:"center",gap:10}}>
          <div style={S.logo}>S</div>
          <div>
            <div style={{color:"#fff",fontWeight:800,fontSize:14}}>Swafy Meet</div>
            <div style={{color:"#64748b",fontSize:11}}>{roomCode} · {myRole==="host" ? "👑 Hôte" : "👤 Participant"}</div>
          </div>
        </div>
        <div style={{display:"flex",gap:8,alignItems:"center"}}>
          <div style={S.timer}>{new Date().toLocaleTimeString("fr-FR",{hour:"2-digit",minute:"2-digit"})}</div>
          <button onClick={()=>setShowLinkBox(o=>!o)} style={S.ghost}>
            🔗 {copied ? "Copié !" : "Partager"}
          </button>
        </div>
      </div>

      {/* LINK BOX */}
      {showLinkBox && (
        <div style={S.linkBar}>
          <span style={{color:"#94a3b8",fontSize:12,flex:1,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>
            {viewerLink || window.location.href}
          </span>
          <button onClick={copyLink} style={S.copyBtn}>{copied?"✅":"📋"} Copier</button>
          <button onClick={()=>setShowLinkBox(false)} style={{...S.copyBtn,background:"rgba(255,255,255,.05)"}}>✕</button>
        </div>
      )}

      {/* BODY */}
      <div style={S.body}>

        {/* VIDEO GRID */}
        <div style={{...S.grid, gridTemplateColumns:`repeat(${cols},1fr)`}}>
          <Tile localRef={localVid} isLocal muted name={myName} role={myRole} videoOff={!videoOn} hand={hand} />
          {peers.map(p => (
            <Tile key={p.id} stream={p.stream} name={p.name}
              role={ptcps.find(x=>x.socketId===p.id)?.role||"guest"}
              videoOff={pMedia[p.id]?.video===false}
              hand={pMedia[p.id]?.hand}
              screenSharing={pMedia[p.id]?.screenSharing} />
          ))}
        </div>

        {/* CHAT PANEL */}
        {chatOpen && (
          <div style={{...S.panel, animation:"slideIn .25s ease"}}>
            <div style={S.panHdr}>
              <b style={{color:"#f1f5f9"}}>💬 Chat</b>
              <button onClick={()=>setChatOpen(false)} style={S.closeX}>✕</button>
            </div>
            <div style={S.msgList}>
              {msgs.length===0 && <div style={{color:"#475569",textAlign:"center",padding:20,fontSize:13}}>Pas encore de messages…</div>}
              {msgs.map((m,i) => (
                <div key={i} style={{alignSelf:m.user===myName?"flex-end":"flex-start",maxWidth:"82%",animation:"fadeIn .2s ease"}}>
                  {m.user!==myName && <div style={S.msgUser}>{m.role==="host"?"👑 ":""}{m.user}</div>}
                  <div style={{...S.bubble, background:m.user===myName?"linear-gradient(135deg,#7c3aed,#4f46e5)":"rgba(255,255,255,.08)"}}>{m.text}</div>
                  <div style={S.msgTime}>{m.time}</div>
                </div>
              ))}
              <div ref={chatEnd}/>
            </div>
            <div style={S.chatRow}>
              <input value={input} onChange={e=>setInput(e.target.value)}
                onKeyDown={e=>e.key==="Enter"&&sendMsg()}
                placeholder="Message…" style={S.chatIn}/>
              <button onClick={sendMsg} style={S.sendBtn}>➤</button>
            </div>
          </div>
        )}

        {/* PARTICIPANTS PANEL */}
        {panelOpen && (
          <div style={{...S.panel, animation:"slideIn .25s ease"}}>
            <div style={S.panHdr}>
              <b style={{color:"#f1f5f9"}}>👥 Participants ({ptcps.length})</b>
              <button onClick={()=>setPanelOpen(false)} style={S.closeX}>✕</button>
            </div>
            <div style={{flex:1,overflowY:"auto",padding:10}}>
              {ptcps.map(p => (
                <div key={p.socketId} style={S.pRow}>
                  <div style={{...S.pAv, background:p.role==="host"?"linear-gradient(135deg,#7c3aed,#4f46e5)":"linear-gradient(135deg,#1e40af,#0284c7)"}}>
                    {(p.userName||"?")[0].toUpperCase()}
                  </div>
                  <div style={{flex:1,minWidth:0}}>
                    <div style={{color:"#f1f5f9",fontSize:13,fontWeight:600,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>
                      {p.userName} {p.role==="host"&&"👑"}
                    </div>
                    <div style={{color:"#64748b",fontSize:11,display:"flex",gap:4}}>
                      {p.audioOn===false&&<span>🔇</span>}
                      {p.videoOn===false&&<span>📷</span>}
                      {p.handRaised&&<span>✋</span>}
                    </div>
                  </div>
                  {myRole==="host" && p.socketId!==sockRef.current?.id && (
                    <div style={{display:"flex",gap:3}}>
                      <button title="Couper micro" onClick={()=>adminMute(p.socketId,"audio")} style={S.adminBtn}>🔇</button>
                      <button title="Couper caméra" onClick={()=>adminMute(p.socketId,"video")} style={S.adminBtn}>📷</button>
                      <button title="Retirer" onClick={()=>adminKick(p.socketId)} style={{...S.adminBtn,color:"#f87171"}}>✕</button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* AI PANEL */}
        {aiOpen && (
          <div style={{...S.panel,animation:"slideIn .25s ease"}}>
            <div style={S.panHdr}>
              <b style={{color:"#a78bfa"}}>✨ Conclusion IA</b>
              <button onClick={()=>setAiOpen(false)} style={S.closeX}>✕</button>
            </div>
            <div style={{flex:1,overflowY:"auto",padding:14}}>
              {aiLoading ? (
                <div style={{textAlign:"center",padding:30}}>
                  <div style={{...S.spin,margin:"0 auto 12px"}}/>
                  <p style={{color:"#94a3b8",fontSize:13}}>Génération en cours…</p>
                </div>
              ) : aiResult ? (
                <div style={{color:"#e2e8f0",fontSize:13,lineHeight:1.8,whiteSpace:"pre-wrap"}}>{aiResult}</div>
              ) : (
                <div style={{textAlign:"center",padding:20}}>
                  <div style={{fontSize:48,marginBottom:12}}>🤖</div>
                  <p style={{color:"#94a3b8",fontSize:13,marginBottom:16}}>L'IA analysera la transcription et le chat pour générer une conclusion professionnelle.</p>
                  <button onClick={generateConclusion} style={{...S.backBtn,width:"100%"}}>✨ Générer la conclusion</button>
                </div>
              )}
              {aiResult && !aiLoading && (
                <button onClick={generateConclusion} style={{...S.backBtn,width:"100%",marginTop:12}}>🔄 Regénérer</button>
              )}
            </div>
          </div>
        )}
      </div>

      {/* FLOATING REACTIONS */}
      <div style={S.floatZone}>
        {floats.map(f=><span key={f.id} style={{fontSize:34,animation:"floatUp 3s ease-out forwards"}}>{f.emoji}</span>)}
      </div>

      {/* SUBTITLES */}
      {subs && subtitle && (
        <div style={S.subBar}>{subtitle}</div>
      )}

      {/* CONTROLS */}
      <div style={S.ctrl}>
        <div style={S.ctrlGrp}>
          <Btn icon={audioOn?"🎤":"🔇"} label={audioOn?"Micro":"Muet"} onClick={toggleAudio} active={audioOn}/>
          <Btn icon={videoOn?"📷":"🚫"} label={videoOn?"Caméra":"Off"} onClick={toggleVideo} active={videoOn}/>
          <Btn icon="🖥️" label={screen?"Arrêter":"Partager"} onClick={toggleScreen} active={!screen}/>
          <Btn icon="✋" label={hand?"Baisser":"Main"} onClick={toggleHand} active={!hand} pulse={hand}/>
        </div>

        <div style={S.emojiRow}>
          {["👍","❤️","😂","🎉","🔥","👏","🙌","💯"].map(e=>(
            <button key={e} onClick={()=>sendReaction(e)} style={S.emojiBt} title={e}>{e}</button>
          ))}
        </div>

        <div style={S.ctrlGrp}>
          <Btn icon="💬" label="Chat" onClick={()=>{setChatOpen(o=>!o);setUnread(0);}} active badge={unread}/>
          <Btn icon="👥" label="Membres" onClick={()=>setPanelOpen(o=>!o)} active/>
          <div style={{display:"flex",flexDirection:"column",alignItems:"center",gap:2}}>
            <button onClick={()=>setSubs(o=>!o)} style={{...B.btn, background:subs?"linear-gradient(135deg,#7c3aed,#4f46e5)":"rgba(255,255,255,.1)"}}>
              <span style={{fontSize:14,fontWeight:800}}>CC</span>
              <span style={B.lbl}>Sous-titres</span>
            </button>
            {subs && (
              <select value={subLang} onChange={e=>setSubLang(e.target.value)} style={S.langSel}>
                <option value="fr">🇫🇷 FR</option>
                <option value="ar">🇹🇳 AR</option>
                <option value="en">🇬🇧 EN</option>
              </select>
            )}
          </div>
          <Btn icon="✨" label="Conclusion" onClick={()=>setAiOpen(o=>!o)} active/>
          <Btn icon="🚪" label="Quitter" onClick={()=>{cleanup();navigate(-1);}} danger/>
        </div>
      </div>
    </div>
  );
}

const S = {
  page:    {minHeight:"100vh",background:"linear-gradient(160deg,#060611,#0f172a)",display:"flex",flexDirection:"column",fontFamily:"'DM Sans',system-ui,sans-serif",color:"#fff",overflow:"hidden"},
  center:  {minHeight:"100vh",display:"flex",alignItems:"center",justifyContent:"center",background:"#060611"},
  spin:    {width:44,height:44,border:"3px solid rgba(255,255,255,.1)",borderTopColor:"#a78bfa",borderRadius:"50%",animation:"spin 0.8s linear infinite",margin:"0 auto"},
  errCard: {background:"rgba(255,255,255,.04)",border:"1px solid rgba(255,255,255,.08)",borderRadius:20,padding:40,textAlign:"center",maxWidth:400},
  backBtn: {background:"linear-gradient(135deg,#7c3aed,#4f46e5)",color:"#fff",border:"none",padding:"11px 24px",borderRadius:10,cursor:"pointer",fontWeight:700,fontSize:13},
  toast:   {position:"fixed",top:16,left:"50%",transform:"translateX(-50%)",color:"#fff",padding:"10px 20px",borderRadius:12,fontSize:13,fontWeight:600,zIndex:999,boxShadow:"0 8px 32px rgba(0,0,0,.4)"},
  overlay: {position:"fixed",inset:0,background:"rgba(0,0,0,.7)",backdropFilter:"blur(8px)",display:"flex",alignItems:"center",justifyContent:"center",zIndex:1000},
  confirmCard:{background:"linear-gradient(145deg,#0f0c29,#1a1040)",border:"1px solid rgba(255,255,255,.1)",borderRadius:20,padding:40,textAlign:"center",animation:"popIn .3s ease"},
  cancelBtn:{background:"rgba(255,255,255,.08)",border:"1px solid rgba(255,255,255,.15)",borderRadius:10,padding:"10px 20px",color:"#fff",cursor:"pointer",fontWeight:600,fontSize:13},
  dangerBtn:{background:"linear-gradient(135deg,#dc2626,#b91c1c)",border:"none",borderRadius:10,padding:"10px 20px",color:"#fff",cursor:"pointer",fontWeight:700,fontSize:13},
  hdr:     {display:"flex",alignItems:"center",justifyContent:"space-between",padding:"10px 20px",background:"rgba(0,0,0,.5)",backdropFilter:"blur(16px)",flexShrink:0,borderBottom:"1px solid rgba(255,255,255,.05)"},
  logo:    {width:32,height:32,borderRadius:10,background:"linear-gradient(135deg,#7c3aed,#4f46e5)",display:"flex",alignItems:"center",justifyContent:"center",fontWeight:900,fontSize:16,color:"#fff"},
  timer:   {color:"#475569",fontSize:12,fontFamily:"monospace"},
  ghost:   {background:"rgba(255,255,255,.06)",border:"1px solid rgba(255,255,255,.1)",color:"#fff",padding:"6px 14px",borderRadius:8,cursor:"pointer",fontSize:12,fontWeight:500},
  linkBar: {background:"rgba(0,0,0,.4)",borderBottom:"1px solid rgba(255,255,255,.06)",padding:"8px 16px",display:"flex",alignItems:"center",gap:8,flexShrink:0},
  copyBtn: {background:"linear-gradient(135deg,#7c3aed,#4f46e5)",border:"none",borderRadius:8,padding:"6px 14px",color:"#fff",cursor:"pointer",fontSize:12,fontWeight:600,whiteSpace:"nowrap"},
  body:    {flex:1,display:"flex",overflow:"hidden",gap:8,padding:8},
  grid:    {flex:1,display:"grid",gap:8,alignContent:"center",overflow:"hidden"},
  panel:   {width:310,background:"rgba(0,0,0,.6)",backdropFilter:"blur(20px)",borderRadius:14,border:"1px solid rgba(255,255,255,.06)",display:"flex",flexDirection:"column",overflow:"hidden",flexShrink:0},
  panHdr:  {padding:"12px 14px",borderBottom:"1px solid rgba(255,255,255,.06)",display:"flex",justifyContent:"space-between",alignItems:"center",fontSize:13},
  closeX:  {background:"none",border:"none",color:"#475569",cursor:"pointer",fontSize:16,transition:"color .2s"},
  msgList: {flex:1,overflowY:"auto",padding:10,display:"flex",flexDirection:"column",gap:8},
  msgUser: {fontSize:10,color:"#64748b",marginBottom:2},
  bubble:  {padding:"8px 12px",borderRadius:12,fontSize:13,lineHeight:1.6},
  msgTime: {fontSize:10,color:"#475569",marginTop:2,textAlign:"right"},
  chatRow: {display:"flex",gap:6,padding:8,borderTop:"1px solid rgba(255,255,255,.06)"},
  chatIn:  {flex:1,background:"rgba(255,255,255,.06)",border:"1px solid rgba(255,255,255,.08)",borderRadius:20,padding:"8px 13px",color:"#fff",fontSize:13,outline:"none"},
  sendBtn: {background:"linear-gradient(135deg,#7c3aed,#4f46e5)",border:"none",borderRadius:"50%",width:36,height:36,color:"#fff",cursor:"pointer",fontSize:14,flexShrink:0,display:"flex",alignItems:"center",justifyContent:"center"},
  pRow:    {display:"flex",alignItems:"center",gap:8,padding:"8px 2px",borderBottom:"1px solid rgba(255,255,255,.04)"},
  pAv:     {width:34,height:34,borderRadius:"50%",display:"flex",alignItems:"center",justifyContent:"center",fontWeight:800,fontSize:13,flexShrink:0},
  adminBtn:{background:"rgba(255,255,255,.06)",border:"1px solid rgba(255,255,255,.08)",borderRadius:6,color:"#fff",padding:"4px 7px",cursor:"pointer",fontSize:12,transition:"all .2s"},
  floatZone:{position:"fixed",bottom:90,left:"50%",transform:"translateX(-50%)",display:"flex",gap:10,pointerEvents:"none",zIndex:60},
  subBar:  {position:"fixed",bottom:80,left:"50%",transform:"translateX(-50%)",background:"rgba(0,0,0,.88)",backdropFilter:"blur(8px)",color:"#fff",padding:"8px 20px",borderRadius:10,maxWidth:"60%",textAlign:"center",fontSize:14,zIndex:50,border:"1px solid rgba(255,255,255,.08)"},
  ctrl:    {background:"rgba(0,0,0,.6)",backdropFilter:"blur(20px)",padding:"10px 16px",display:"flex",alignItems:"center",justifyContent:"space-between",gap:8,flexShrink:0,flexWrap:"wrap",borderTop:"1px solid rgba(255,255,255,.05)"},
  ctrlGrp: {display:"flex",gap:4,alignItems:"flex-end"},
  emojiRow:{display:"flex",gap:3},
  emojiBt: {background:"rgba(255,255,255,.06)",border:"1px solid rgba(255,255,255,.08)",borderRadius:8,padding:"6px 9px",cursor:"pointer",fontSize:18,transition:"transform .1s,background .2s"},
  langSel: {background:"rgba(255,255,255,.08)",border:"none",color:"#fff",padding:"3px 6px",borderRadius:6,fontSize:11,cursor:"pointer"},
};