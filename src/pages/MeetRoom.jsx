import { useEffect, useRef, useState, useCallback } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import { io } from "socket.io-client";

const SOCKET_URL = "https://debat-jeune.onrender.com";
const ANTHROPIC_URL = "https://api.anthropic.com/v1/messages";

/* ── Global CSS ── */
const STYLE = `
@import url('https://fonts.googleapis.com/css2?family=Google+Sans:wght@400;500;600;700&display=swap');
* { box-sizing: border-box; }
@keyframes spin    { to { transform: rotate(360deg); } }
@keyframes floatUp { 0%{opacity:1;transform:translateY(0) scale(1)} 100%{opacity:0;transform:translateY(-90px) scale(1.5)} }
@keyframes fadeIn  { from{opacity:0;transform:translateY(6px)} to{opacity:1;transform:translateY(0)} }
@keyframes pulse   { 0%,100%{opacity:1} 50%{opacity:.4} }
@keyframes slideIn { from{opacity:0;transform:translateX(24px)} to{opacity:1;transform:translateX(0)} }
@keyframes popIn   { 0%{transform:scale(0.85);opacity:0} 100%{transform:scale(1);opacity:1} }
@keyframes toastIn { from{opacity:0;transform:translateX(-50%) translateY(-12px)} to{opacity:1;transform:translateX(-50%) translateY(0)} }
@keyframes handWave{ 0%,100%{transform:rotate(0deg)} 25%{transform:rotate(20deg)} 75%{transform:rotate(-10deg)} }
@keyframes ripple  { 0%{transform:scale(1);opacity:.6} 100%{transform:scale(2.2);opacity:0} }
@keyframes notifSlide { from{opacity:0;transform:translateY(-10px)} to{opacity:1;transform:translateY(0)} }
`;

/* ── Speech recognition ── */
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
    r.onerror = () => {};
    r.start(); recRef.current = r;
    return () => { try { r.stop(); } catch {} };
  }, [enabled, lang]);
  return { text, fullTranscript };
}

/* ── Translation helper via Anthropic ── */
async function translateMessage(text, targetLang) {
  const langNames = { fr: "français", ar: "arabe", en: "anglais", es: "espagnol", de: "allemand" };
  const res = await fetch(ANTHROPIC_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      model: "claude-sonnet-4-20250514",
      max_tokens: 300,
      messages: [{
        role: "user",
        content: `Traduis ce texte en ${langNames[targetLang] || targetLang}. Réponds UNIQUEMENT avec la traduction, sans explication:\n"${text}"`
      }]
    })
  });
  const data = await res.json();
  return data.content?.[0]?.text?.trim() || text;
}

/* ── Video Tile ── */
function Tile({ stream, muted = false, name = "?", role = "guest", videoOff = false, hand = false, isLocal = false, localRef, screenSharing = false, speaking = false }) {
  const ref = useRef(null);
  const vRef = isLocal ? localRef : ref;
  useEffect(() => { if (vRef?.current && stream) vRef.current.srcObject = stream; }, [stream]);
  const init = (name || "?").split(" ").map(w => w[0]).join("").slice(0, 2).toUpperCase();
  const isHost = role === "host";
  return (
    <div style={{
      ...T.wrap,
      boxShadow: speaking ? "0 0 0 3px #1a73e8, 0 4px 20px rgba(26,115,232,.3)" :
                 hand ? "0 0 0 3px #fbbc04, 0 4px 20px rgba(251,188,4,.2)" :
                 "0 2px 12px rgba(0,0,0,.35)",
      transition: "box-shadow .3s"
    }}>
      <video ref={vRef} autoPlay playsInline muted={muted}
        style={{ ...T.vid, display: (!videoOff && (stream || isLocal)) ? "block" : "none" }} />
      {(videoOff || (!stream && !isLocal)) && (
        <div style={T.avatarBox}>
          <div style={{ ...T.avatar, background: isHost ? "linear-gradient(135deg,#1a73e8,#0d47a1)" : "linear-gradient(135deg,#34a853,#1e8449)" }}>
            {init}
          </div>
        </div>
      )}
      <div style={T.foot}>
        {isHost && <span style={T.hostBadge}>👑 Host</span>}
        {screenSharing && <span style={T.screenBadge}>🖥️ Partage</span>}
        <span style={T.name}>{isLocal ? `${name} (Vous)` : name}</span>
      </div>
      {hand && (
        <div style={T.handBadge}>
          <span style={{ animation: "handWave 0.6s infinite" }}>✋</span>
        </div>
      )}
      {videoOff && <div style={T.camOff}>📷</div>}
      {muted && !isLocal && <div style={T.micOff}>🔇</div>}
    </div>
  );
}

const T = {
  wrap: { position: "relative", background: "#1c1c1c", borderRadius: 12, overflow: "hidden", aspectRatio: "16/9", minHeight: 140 },
  vid: { width: "100%", height: "100%", objectFit: "cover", background: "#000" },
  avatarBox: { position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", background: "radial-gradient(circle at 35% 30%, #2d2d2d, #1a1a1a)" },
  avatar: { width: 60, height: 60, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22, fontWeight: 700, color: "#fff", boxShadow: "0 4px 20px rgba(0,0,0,.5)" },
  foot: { position: "absolute", bottom: 8, left: 8, display: "flex", gap: 5, alignItems: "center", flexWrap: "wrap" },
  hostBadge: { background: "rgba(26,115,232,.85)", backdropFilter: "blur(4px)", color: "#fff", fontSize: 10, fontWeight: 700, padding: "2px 8px", borderRadius: 20 },
  screenBadge: { background: "rgba(52,168,83,.85)", color: "#fff", fontSize: 10, padding: "2px 8px", borderRadius: 8 },
  name: { background: "rgba(0,0,0,.72)", backdropFilter: "blur(4px)", color: "#fff", fontSize: 12, padding: "3px 8px", borderRadius: 6 },
  handBadge: { position: "absolute", top: 8, left: 8, fontSize: 18 },
  camOff: { position: "absolute", top: 8, right: 8, background: "rgba(0,0,0,.7)", borderRadius: 6, padding: "2px 6px", fontSize: 12 },
  micOff: { position: "absolute", bottom: 8, right: 8, background: "rgba(234,67,53,.8)", borderRadius: 6, padding: "2px 6px", fontSize: 11 },
};

/* ── Control Button ── */
function Btn({ icon, label, onClick, active = true, danger = false, badge = 0, pulse = false, disabled = false }) {
  const [hover, setHover] = useState(false);
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      title={label}
      style={{
        ...B.btn,
        background: danger ? (hover ? "#c62828" : "#ea4335") :
                    !active ? (hover ? "#b71c1c" : "#ea4335") :
                    hover ? "rgba(255,255,255,.2)" : "rgba(255,255,255,.1)",
        animation: pulse ? "pulse 1.5s infinite" : "none",
        transform: hover ? "scale(1.05)" : "scale(1)",
        opacity: disabled ? 0.5 : 1,
      }}>
      <span style={{ fontSize: 20 }}>{icon}</span>
      <span style={B.lbl}>{label}</span>
      {badge > 0 && <span style={B.badge}>{badge > 99 ? "99+" : badge}</span>}
    </button>
  );
}
const B = {
  btn: { border: "none", borderRadius: 12, padding: "10px 14px", color: "#fff", cursor: "pointer", display: "flex", flexDirection: "column", alignItems: "center", gap: 3, minWidth: 58, transition: "all .15s", position: "relative" },
  lbl: { fontSize: 10, fontWeight: 600, whiteSpace: "nowrap", opacity: .9 },
  badge: { position: "absolute", top: -5, right: -5, background: "#ea4335", color: "#fff", borderRadius: "50%", width: 18, height: 18, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 10, fontWeight: 800 },
};

/* ══ MAIN COMPONENT ══ */
export default function MeetRoom() {
  const { roomCode } = useParams();
  const [sp] = useSearchParams();
  const navigate = useNavigate();

  const token  = sp.get("at") || sp.get("vt") || "";
  const myRole = sp.get("at") ? "host" : "guest";
  const user   = JSON.parse(localStorage.getItem("user") || "{}");
  const myName = user?.prenom_user ? `${user.prenom_user} ${user.nom_user || ""}`.trim() : user?.name || "Invité";

  /* ── State ── */
  const [status,      setStatus]     = useState("loading");
  const [errorMsg,    setErrorMsg]   = useState("");
  const [audioOn,     setAudioOn]    = useState(true);
  const [videoOn,     setVideoOn]    = useState(true);
  const [hand,        setHand]       = useState(false);
  const [screen,      setScreen]     = useState(false);
  const [subs,        setSubs]       = useState(false);
  const [subLang,     setSubLang]    = useState("fr");
  const [chatOpen,    setChatOpen]   = useState(false);
  const [panelOpen,   setPanelOpen]  = useState(false);
  const [aiOpen,      setAiOpen]     = useState(false);
  const [msgs,        setMsgs]       = useState([]);
  const [input,       setInput]      = useState("");
  const [unread,      setUnread]     = useState(0);
  const [peers,       setPeers]      = useState([]);
  const [pMedia,      setPMedia]     = useState({});
  const [ptcps,       setPtcps]      = useState([]);
  const [floats,      setFloats]     = useState([]);
  const [copied,      setCopied]     = useState(false);
  const [aiLoading,   setAiLoading]  = useState(false);
  const [aiResult,    setAiResult]   = useState("");
  const [showLink,    setShowLink]   = useState(false);
  const [kickTarget,  setKickTarget] = useState(null);
  const [toast,       setToast]      = useState(null);
  const [duration,    setDuration]   = useState(0);
  const [emojiBar,    setEmojiBar]   = useState(false);
  const [grantTarget, setGrantTarget]= useState(null); // host grants mic/cam to jeune
  const [translating, setTranslating]= useState({});
  const [translations,setTranslations]= useState({});
  const [transLang,   setTransLang]  = useState("fr");
  const [showSettings,setShowSettings]= useState(false);
  const [mutedPeers,  setMutedPeers] = useState(new Set());

  /* ── Refs ── */
  const sockRef    = useRef(null);
  const localVid   = useRef(null);
  const localStr   = useRef(null);
  const screenStr  = useRef(null);
  const peerMap    = useRef({});
  const nameMap    = useRef({});
  const roleMap    = useRef({});
  const chatEnd    = useRef(null);
  const timerRef   = useRef(null);

  const { text: subtitle, fullTranscript } = useSubtitles(subs, subLang);

  const viewerLink = localStorage.getItem("currentLiveViewerLink") || "";

  /* ── Toast ── */
  const showToast = useCallback((msg, color = "#1a73e8", icon = "") => {
    setToast({ msg, color, icon });
    setTimeout(() => setToast(null), 3500);
  }, []);

  /* ── Duration timer ── */
  useEffect(() => {
    timerRef.current = setInterval(() => setDuration(d => d + 1), 1000);
    return () => clearInterval(timerRef.current);
  }, []);

  const fmtTime = (s) => {
    const h = Math.floor(s / 3600), m = Math.floor((s % 3600) / 60), sec = s % 60;
    return h > 0 ? `${h}:${String(m).padStart(2,"0")}:${String(sec).padStart(2,"0")}` : `${String(m).padStart(2,"0")}:${String(sec).padStart(2,"0")}`;
  };

  /* ── WebRTC createPeer ── */
  const createPeer = useCallback((tid) => {
    const pc = new RTCPeerConnection({ iceServers: [
      { urls: "stun:stun.l.google.com:19302" },
      { urls: "stun:stun1.l.google.com:19302" },
    ]});
    pc.onicecandidate = e => e.candidate && sockRef.current?.emit("ice-candidate", { target: tid, candidate: e.candidate });
    pc.ontrack = e => {
      const st = e.streams[0];
      setPeers(prev => {
        const ex = prev.find(p => p.id === tid);
        return ex ? prev.map(p => p.id === tid ? { ...p, stream: st } : p)
                  : [...prev, { id: tid, stream: st, name: nameMap.current[tid] || "Invité", role: roleMap.current[tid] || "guest" }];
      });
    };
    localStr.current?.getTracks().forEach(t => pc.addTrack(t, localStr.current));
    return pc;
  }, []);

  /* ── Init ── */
  useEffect(() => {
    if (!token) { setErrorMsg("Token d'accès manquant. Vérifiez votre lien."); setStatus("error"); return; }
    let alive = true;
    (async () => {
      try {
        const st = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
        if (!alive) { st.getTracks().forEach(t => t.stop()); return; }
        localStr.current = st;
        if (localVid.current) localVid.current.srcObject = st;
      } catch { setAudioOn(false); setVideoOn(false); }

      setStatus("ok");
      const sock = io(SOCKET_URL, { transports: ["websocket"] });
      sockRef.current = sock;

      sock.on("connect", () => {
        sock.emit("join-room", { roomCode, userName: myName, role: myRole, accessToken: token }, ack => {
          if (!ack?.ok) { setErrorMsg(ack?.message || "Accès refusé"); setStatus("error"); }
        });
      });

      sock.on("all-users", async users => {
        for (const u of users) {
          nameMap.current[u.socketId] = u.userName;
          roleMap.current[u.socketId] = u.role;
          const pc = createPeer(u.socketId); peerMap.current[u.socketId] = pc;
          const offer = await pc.createOffer();
          await pc.setLocalDescription(offer);
          sock.emit("offer", { target: u.socketId, sdp: offer });
        }
      });

      sock.on("user-joined", ({ socketId, userName: n, role }) => {
        nameMap.current[socketId] = n;
        roleMap.current[socketId] = role;
        showToast(`👋 ${n} a rejoint`, "#34a853");
      });

      sock.on("offer", async ({ caller, sdp }) => {
        let pc = peerMap.current[caller];
        if (!pc) { pc = createPeer(caller); peerMap.current[caller] = pc; }
        await pc.setRemoteDescription(new RTCSessionDescription(sdp));
        const ans = await pc.createAnswer();
        await pc.setLocalDescription(ans);
        sock.emit("answer", { target: caller, sdp: ans });
      });

      sock.on("answer", async ({ responder, sdp }) => {
        await peerMap.current[responder]?.setRemoteDescription(new RTCSessionDescription(sdp));
      });

      sock.on("ice-candidate", async ({ from, candidate }) => {
        try { await peerMap.current[from]?.addIceCandidate(new RTCIceCandidate(candidate)); } catch {}
      });

      sock.on("user-left", ({ socketId }) => {
        const name = nameMap.current[socketId];
        if (name) showToast(`${name} a quitté`, "#5f6368");
        peerMap.current[socketId]?.close(); delete peerMap.current[socketId];
        setPeers(prev => prev.filter(p => p.id !== socketId));
      });

      sock.on("user-media-toggled", ({ socketId, type, enabled }) =>
        setPMedia(prev => ({ ...prev, [socketId]: { ...prev[socketId], [type]: enabled } })));

      sock.on("participants-update", setPtcps);

      sock.on("receive-message", msg => {
        setMsgs(prev => [...prev, { ...msg, id: Date.now() + Math.random() }]);
        setChatOpen(o => { if (!o) setUnread(n => n + 1); return o; });
      });

      sock.on("reaction", ({ userName: n, emoji }) => {
        const id = Date.now() + Math.random();
        setFloats(prev => [...prev, { id, n, emoji }]);
        setTimeout(() => setFloats(prev => prev.filter(f => f.id !== id)), 3200);
      });

      sock.on("hand-raised", ({ socketId, userName: n, raised }) => {
        setPMedia(prev => ({ ...prev, [socketId]: { ...prev[socketId], hand: raised } }));
        if (raised && myRole === "host") showToast(`✋ ${n} lève la main`, "#fbbc04");
      });

      sock.on("force-mute", ({ type }) => {
        const trk = type === "audio" ? localStr.current?.getAudioTracks()[0] : localStr.current?.getVideoTracks()[0];
        if (trk) { trk.enabled = false; type === "audio" ? setAudioOn(false) : setVideoOn(false); }
        showToast(`L'hôte a coupé votre ${type === "audio" ? "micro" : "caméra"}`, "#ea4335", "🔇");
      });

      // Host grants access to jeune (mic/cam)
      sock.on("access-granted", ({ type }) => {
        showToast(`L'hôte vous a donné accès : ${type === "audio" ? "🎤 Micro" : "📷 Caméra"}`, "#34a853");
      });

      sock.on("force-kicked", () => { alert("Vous avez été retiré de la réunion."); cleanup(); navigate(-1); });
      sock.on("live-ended",   () => { alert("Le live est terminé."); cleanup(); navigate(-1); });

      sock.on("screen-share-started", ({ socketId }) =>
        setPMedia(prev => ({ ...prev, [socketId]: { ...prev[socketId], screenSharing: true } })));
      sock.on("screen-share-stopped", ({ socketId }) =>
        setPMedia(prev => ({ ...prev, [socketId]: { ...prev[socketId], screenSharing: false } })));

      sock.on("disconnect", () => showToast("Connexion perdue, reconnexion…", "#ea4335", "🔴"));
      sock.on("reconnect",  () => showToast("Reconnecté !", "#34a853", "✅"));
    })();
    return () => { alive = false; cleanup(); };
  }, [roomCode, token, myRole, myName, createPeer]);

  useEffect(() => { chatEnd.current?.scrollIntoView({ behavior: "smooth" }); }, [msgs]);

  /* ── Actions ── */
  const cleanup = () => {
    clearInterval(timerRef.current);
    sockRef.current?.emit("leave-room"); sockRef.current?.disconnect();
    Object.values(peerMap.current).forEach(pc => pc.close()); peerMap.current = {};
    localStr.current?.getTracks().forEach(t => t.stop());
    screenStr.current?.getTracks().forEach(t => t.stop());
  };

  const emit = (ev, data) => sockRef.current?.emit(ev, data);

  const toggleAudio = () => {
    const t = localStr.current?.getAudioTracks()[0]; if (!t) return;
    t.enabled = !t.enabled; setAudioOn(t.enabled);
    emit("toggle-media", { roomCode, type: "audio", enabled: t.enabled });
  };

  const toggleVideo = () => {
    const t = localStr.current?.getVideoTracks()[0]; if (!t) return;
    t.enabled = !t.enabled; setVideoOn(t.enabled);
    emit("toggle-media", { roomCode, type: "video", enabled: t.enabled });
  };

  const toggleHand = () => {
    const r = !hand; setHand(r); emit("raise-hand", { roomCode, raised: r });
    if (r) showToast("Main levée — l'hôte a été notifié", "#fbbc04", "✋");
  };

  const toggleScreen = async () => {
    if (screen) {
      screenStr.current?.getTracks().forEach(t => t.stop()); screenStr.current = null; setScreen(false);
      emit("screen-share-stopped", { roomCode });
      const cam = localStr.current?.getVideoTracks()[0];
      Object.values(peerMap.current).forEach(pc => {
        const s = pc.getSenders().find(s => s.track?.kind === "video"); if (s && cam) s.replaceTrack(cam);
      });
    } else {
      try {
        const ss = await navigator.mediaDevices.getDisplayMedia({ video: true, audio: true });
        screenStr.current = ss;
        const trk = ss.getVideoTracks()[0];
        Object.values(peerMap.current).forEach(pc => {
          const s = pc.getSenders().find(s => s.track?.kind === "video"); if (s) s.replaceTrack(trk);
        });
        trk.onended = toggleScreen;
        setScreen(true); emit("screen-share-started", { roomCode });
        showToast("Partage d'écran actif", "#34a853", "🖥️");
      } catch { showToast("Partage annulé", "#5f6368"); }
    }
  };

  const sendReaction = (e) => {
    emit("send-reaction", { roomCode, emoji: e });
    const id = Date.now(); setFloats(prev => [...prev, { id, n: "Vous", emoji: e }]);
    setTimeout(() => setFloats(prev => prev.filter(f => f.id !== id)), 3200);
    setEmojiBar(false);
  };

  const sendMsg = () => {
    if (!input.trim()) return;
    emit("send-message", { roomCode, message: input }); setInput("");
  };

  const copyLink = async () => {
    const lnk = viewerLink || window.location.href;
    await navigator.clipboard.writeText(lnk).catch(() => {});
    setCopied(true); setTimeout(() => setCopied(false), 2500);
    showToast("Lien copié !", "#1a73e8", "✅");
  };

  const adminMute = (sid, type) => {
    if (myRole !== "host") return;
    emit("admin-mute", { roomCode, targetSocketId: sid, type });
    showToast(`Micro/caméra coupé`, "#fbbc04", "🔇");
  };

  const adminKick = (sid) => { if (myRole !== "host") return; setKickTarget(sid); };

  const confirmKick = () => {
    if (!kickTarget) return;
    emit("admin-kick", { roomCode, targetSocketId: kickTarget });
    setKickTarget(null);
    showToast("Participant retiré", "#ea4335", "🚪");
  };

  // Grant mic/cam access to a jeune
  const grantAccess = (sid, type) => {
    if (myRole !== "host") return;
    emit("grant-access", { roomCode, targetSocketId: sid, type });
    showToast(`Accès accordé`, "#34a853", "✅");
    setGrantTarget(null);
  };

  // Toggle mute a peer locally
  const togglePeerMute = (sid) => {
    setMutedPeers(prev => {
      const next = new Set(prev);
      next.has(sid) ? next.delete(sid) : next.add(sid);
      return next;
    });
  };

  /* ── AI Conclusion ── */
  const generateConclusion = async () => {
    if (!fullTranscript.length && msgs.length === 0) {
      setAiResult("⚠️ Pas assez de contenu. Activez les sous-titres et discutez d'abord.");
      return;
    }
    setAiLoading(true); setAiOpen(true);
    try {
      const chatContent = msgs.map(m => `${m.user}: ${m.text}`).join("\n");
      const prompt = `Tu es un assistant expert en résumé de réunions et débats.\n\nContenu de la réunion:\n\nTRANSCRIPTION:\n${fullTranscript.join(" ") || "(aucune)"}\n\nCHAT:\n${chatContent || "(aucun)"}\n\nGénère une conclusion structurée :\n1. 📋 Résumé des points principaux\n2. 💡 Idées clés et propositions\n3. ✅ Points de consensus\n4. 🎯 Actions recommandées\n5. 📊 Statistiques: ${ptcps.length} participants, durée: ${fmtTime(duration)}\n\nDate: ${new Date().toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}\n\nSois concis et professionnel.`;
      const res = await fetch(ANTHROPIC_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ model: "claude-sonnet-4-20250514", max_tokens: 1000, messages: [{ role: "user", content: prompt }] })
      });
      const data = await res.json();
      setAiResult(data.content?.[0]?.text || "Erreur lors de la génération.");
    } catch { setAiResult("Erreur de connexion à l'IA."); }
    finally { setAiLoading(false); }
  };

  /* ── Translate a message ── */
  const handleTranslate = async (msgId, text) => {
    setTranslating(prev => ({ ...prev, [msgId]: true }));
    try {
      const translated = await translateMessage(text, transLang);
      setTranslations(prev => ({ ...prev, [msgId]: translated }));
    } catch {}
    setTranslating(prev => ({ ...prev, [msgId]: false }));
  };

  /* ── Grid layout ── */
  const total = 1 + peers.length;
  const cols  = total <= 1 ? 1 : total <= 4 ? 2 : total <= 9 ? 3 : 4;

  /* ── Admin sidebar participant row ── */
  const ParticipantRow = ({ p }) => (
    <div style={S.pRow}>
      <div style={{ ...S.pAv, background: p.role === "host" ? "linear-gradient(135deg,#1a73e8,#0d47a1)" : "linear-gradient(135deg,#34a853,#1e8449)" }}>
        {(p.userName || "?")[0].toUpperCase()}
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ color: "#e8eaed", fontSize: 13, fontWeight: 600, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
          {p.userName} {p.role === "host" && "👑"}
        </div>
        <div style={{ color: "#9aa0a6", fontSize: 11, display: "flex", gap: 4, marginTop: 2 }}>
          {p.audioOn === false && <span title="Micro coupé">🔇</span>}
          {p.videoOn === false && <span title="Caméra off">📷</span>}
          {p.handRaised && <span title="Main levée">✋</span>}
        </div>
      </div>
      {myRole === "host" && p.socketId !== sockRef.current?.id && (
        <div style={{ display: "flex", gap: 3 }}>
          {/* Grant mic */}
          <button title="Donner micro" onClick={() => grantAccess(p.socketId, "audio")} style={{ ...S.adminBtn, color: "#34a853" }}>🎤</button>
          {/* Grant cam */}
          <button title="Donner caméra" onClick={() => grantAccess(p.socketId, "video")} style={{ ...S.adminBtn, color: "#1a73e8" }}>📷</button>
          {/* Mute */}
          <button title="Couper micro" onClick={() => adminMute(p.socketId, "audio")} style={S.adminBtn}>🔇</button>
          {/* Kick */}
          <button title="Retirer" onClick={() => adminKick(p.socketId)} style={{ ...S.adminBtn, color: "#ea4335" }}>✕</button>
        </div>
      )}
      {/* Jeune can mute peers locally */}
      {myRole !== "host" && p.socketId !== sockRef.current?.id && (
        <button title={mutedPeers.has(p.socketId) ? "Réactiver" : "Couper localement"} onClick={() => togglePeerMute(p.socketId)}
          style={{ ...S.adminBtn, color: mutedPeers.has(p.socketId) ? "#fbbc04" : "#9aa0a6" }}>
          {mutedPeers.has(p.socketId) ? "🔈" : "🔇"}
        </button>
      )}
    </div>
  );

  /* ── Render states ── */
  if (status === "loading") return (
    <div style={S.center}>
      <style>{STYLE}</style>
      <div style={{ textAlign: "center" }}>
        <div style={S.spin} />
        <p style={{ color: "#9aa0a6", marginTop: 16, fontSize: 14, fontFamily: "'Google Sans',sans-serif" }}>Connexion en cours…</p>
      </div>
    </div>
  );

  if (status === "error") return (
    <div style={S.center}>
      <style>{STYLE}</style>
      <div style={S.errCard}>
        <div style={{ fontSize: 52, marginBottom: 16 }}>🔒</div>
        <p style={{ color: "#e8eaed", fontWeight: 700, fontSize: 18, margin: "0 0 8px" }}>Accès refusé</p>
        <p style={{ color: "#9aa0a6", fontSize: 14, marginBottom: 24, lineHeight: 1.6 }}>{errorMsg}</p>
        <button onClick={() => navigate(-1)} style={S.backBtn}>← Retour</button>
      </div>
    </div>
  );

  /* ═══════════════════ MAIN RENDER ═══════════════════ */
  return (
    <div style={S.page}>
      <style>{STYLE}</style>

      {/* TOAST */}
      {toast && (
        <div style={{ ...S.toast, background: toast.color, animation: "toastIn .3s ease" }}>
          {toast.icon && <span style={{ marginRight: 6 }}>{toast.icon}</span>}
          {toast.msg}
        </div>
      )}

      {/* KICK MODAL */}
      {kickTarget && (
        <div style={S.overlay}>
          <div style={S.modal}>
            <div style={{ fontSize: 44, marginBottom: 14 }}>👋</div>
            <p style={{ color: "#e8eaed", fontWeight: 700, fontSize: 16, marginBottom: 8 }}>Retirer ce participant ?</p>
            <p style={{ color: "#9aa0a6", fontSize: 13, marginBottom: 24 }}>Il sera exclu de la réunion immédiatement.</p>
            <div style={{ display: "flex", gap: 10, justifyContent: "center" }}>
              <button onClick={() => setKickTarget(null)} style={S.cancelBtn}>Annuler</button>
              <button onClick={confirmKick} style={S.dangerBtn}>🚪 Retirer</button>
            </div>
          </div>
        </div>
      )}

      {/* HEADER */}
      <div style={S.hdr}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div style={S.logo}>S</div>
          <div>
            <div style={{ color: "#e8eaed", fontWeight: 700, fontSize: 14, fontFamily: "'Google Sans',sans-serif" }}>Swafy Meet</div>
            <div style={{ color: "#9aa0a6", fontSize: 11, display: "flex", gap: 6, alignItems: "center" }}>
              <span style={{ ...S.recDot, background: myRole === "host" ? "#ea4335" : "#34a853" }} />
              {roomCode} · {myRole === "host" ? "👑 Hôte" : "👤 Participant"} · {fmtTime(duration)}
            </div>
          </div>
        </div>
        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          <div style={S.countBadge}>{ptcps.length} 👥</div>
          <button onClick={() => { setShowLink(o => !o); }} style={S.ghost}>
            🔗 {copied ? "Copié !" : "Inviter"}
          </button>
          <button onClick={() => setShowSettings(o => !o)} style={S.ghost}>⚙️</button>
        </div>
      </div>

      {/* SHARE LINK BAR */}
      {showLink && (
        <div style={S.linkBar}>
          <div style={{ color: "#9aa0a6", fontSize: 11, marginBottom: 4 }}>🔗 Lien pour les participants (viewer)</div>
          <div style={{ display: "flex", gap: 8 }}>
            <span style={{ flex: 1, color: "#8ab4f8", fontSize: 12, wordBreak: "break-all", background: "rgba(138,180,248,.08)", padding: "6px 10px", borderRadius: 6 }}>
              {viewerLink || window.location.href}
            </span>
            <button onClick={copyLink} style={S.copyBtn}>{copied ? "✅" : "📋"} Copier</button>
            <button onClick={() => setShowLink(false)} style={{ ...S.copyBtn, background: "rgba(255,255,255,.08)" }}>✕</button>
          </div>
        </div>
      )}

      {/* SETTINGS BAR */}
      {showSettings && (
        <div style={S.linkBar}>
          <div style={{ display: "flex", gap: 16, alignItems: "center", flexWrap: "wrap" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <span style={{ color: "#9aa0a6", fontSize: 12 }}>🌍 Langue traduction:</span>
              <select value={transLang} onChange={e => setTransLang(e.target.value)} style={S.sel}>
                <option value="fr">🇫🇷 Français</option>
                <option value="ar">🇹🇳 Arabe</option>
                <option value="en">🇬🇧 Anglais</option>
                <option value="es">🇪🇸 Espagnol</option>
                <option value="de">🇩🇪 Allemand</option>
              </select>
            </div>
            {subs && (
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <span style={{ color: "#9aa0a6", fontSize: 12 }}>🎤 Langue sous-titres:</span>
                <select value={subLang} onChange={e => setSubLang(e.target.value)} style={S.sel}>
                  <option value="fr">🇫🇷 FR</option>
                  <option value="ar">🇹🇳 AR</option>
                  <option value="en">🇬🇧 EN</option>
                </select>
              </div>
            )}
          </div>
        </div>
      )}

      {/* BODY */}
      <div style={S.body}>

        {/* VIDEO GRID */}
        <div style={{ ...S.grid, gridTemplateColumns: `repeat(${cols},1fr)` }}>
          <Tile localRef={localVid} isLocal muted name={myName} role={myRole} videoOff={!videoOn} hand={hand} />
          {peers.map(p => (
            <Tile key={p.id} stream={p.stream} name={p.name || nameMap.current[p.id] || "Invité"}
              muted={mutedPeers.has(p.id)}
              role={ptcps.find(x => x.socketId === p.id)?.role || "guest"}
              videoOff={pMedia[p.id]?.video === false}
              hand={pMedia[p.id]?.hand}
              screenSharing={pMedia[p.id]?.screenSharing} />
          ))}
        </div>

        {/* CHAT PANEL */}
        {chatOpen && (
          <div style={{ ...S.panel, animation: "slideIn .25s ease" }}>
            <div style={S.panHdr}>
              <span style={{ color: "#e8eaed", fontWeight: 700, fontSize: 13 }}>💬 Chat en direct</span>
              <button onClick={() => setChatOpen(false)} style={S.closeX}>✕</button>
            </div>
            <div style={S.msgList}>
              {msgs.length === 0 && (
                <div style={{ color: "#5f6368", textAlign: "center", padding: "32px 16px", fontSize: 13 }}>
                  <div style={{ fontSize: 36, marginBottom: 8 }}>💬</div>
                  Pas encore de messages…
                </div>
              )}
              {msgs.map((m) => {
                const isMe = m.user === myName;
                return (
                  <div key={m.id} style={{ alignSelf: isMe ? "flex-end" : "flex-start", maxWidth: "84%", animation: "fadeIn .2s ease" }}>
                    {!isMe && (
                      <div style={{ fontSize: 10, color: "#9aa0a6", marginBottom: 3, display: "flex", alignItems: "center", gap: 4 }}>
                        {m.role === "host" && <span style={{ background: "#1a73e8", color: "#fff", padding: "1px 5px", borderRadius: 4, fontSize: 9 }}>HOST</span>}
                        {m.user}
                      </div>
                    )}
                    <div style={{ ...S.bubble, background: isMe ? "linear-gradient(135deg,#1a73e8,#0d47a1)" : "rgba(255,255,255,.08)" }}>
                      {m.text}
                    </div>
                    {/* Translation */}
                    {translations[m.id] && (
                      <div style={{ ...S.bubble, background: "rgba(52,168,83,.12)", border: "1px solid rgba(52,168,83,.2)", marginTop: 3, fontSize: 12, color: "#81c995" }}>
                        🌍 {translations[m.id]}
                      </div>
                    )}
                    <div style={{ fontSize: 10, color: "#5f6368", marginTop: 2, display: "flex", gap: 8, alignItems: "center" }}>
                      <span>{m.time}</span>
                      {!isMe && (
                        <button onClick={() => handleTranslate(m.id, m.text)} disabled={translating[m.id]}
                          style={{ background: "none", border: "none", color: "#8ab4f8", cursor: "pointer", fontSize: 10, padding: 0 }}>
                          {translating[m.id] ? "..." : "🌍 Traduire"}
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
              <div ref={chatEnd} />
            </div>
            <div style={S.chatRow}>
              <input value={input} onChange={e => setInput(e.target.value)}
                onKeyDown={e => e.key === "Enter" && !e.shiftKey && sendMsg()}
                placeholder="Écrire un message…" style={S.chatIn} />
              <button onClick={sendMsg} style={S.sendBtn}>➤</button>
            </div>
          </div>
        )}

        {/* PARTICIPANTS PANEL */}
        {panelOpen && (
          <div style={{ ...S.panel, animation: "slideIn .25s ease" }}>
            <div style={S.panHdr}>
              <span style={{ color: "#e8eaed", fontWeight: 700, fontSize: 13 }}>👥 Participants ({ptcps.length})</span>
              <button onClick={() => setPanelOpen(false)} style={S.closeX}>✕</button>
            </div>
            <div style={{ flex: 1, overflowY: "auto", padding: 8 }}>
              {ptcps.length === 0 && (
                <div style={{ color: "#5f6368", textAlign: "center", padding: "24px 16px", fontSize: 13 }}>Aucun participant</div>
              )}
              {ptcps.map(p => <ParticipantRow key={p.socketId} p={p} />)}
            </div>
            {myRole === "host" && (
              <div style={{ padding: 10, borderTop: "1px solid rgba(255,255,255,.06)" }}>
                <div style={{ color: "#9aa0a6", fontSize: 11, marginBottom: 6 }}>⚠️ Contrôles hôte uniquement</div>
                <button onClick={() => { ptcps.filter(p => p.socketId !== sockRef.current?.id && p.role !== "host").forEach(p => adminMute(p.socketId, "audio")); }}
                  style={{ ...S.dangerBtn, width: "100%", fontSize: 12, padding: "8px 12px" }}>
                  🔇 Couper tous les micros
                </button>
              </div>
            )}
          </div>
        )}

        {/* AI CONCLUSION PANEL */}
        {aiOpen && (
          <div style={{ ...S.panel, animation: "slideIn .25s ease" }}>
            <div style={S.panHdr}>
              <span style={{ color: "#a8c7fa", fontWeight: 700, fontSize: 13 }}>✨ Conclusion IA</span>
              <button onClick={() => setAiOpen(false)} style={S.closeX}>✕</button>
            </div>
            <div style={{ flex: 1, overflowY: "auto", padding: 14 }}>
              {aiLoading ? (
                <div style={{ textAlign: "center", padding: "40px 20px" }}>
                  <div style={{ ...S.spin, margin: "0 auto 16px" }} />
                  <p style={{ color: "#9aa0a6", fontSize: 13 }}>Analyse en cours…</p>
                </div>
              ) : aiResult ? (
                <div>
                  <div style={{ color: "#e8eaed", fontSize: 13, lineHeight: 1.8, whiteSpace: "pre-wrap" }}>{aiResult}</div>
                  <button onClick={() => { navigator.clipboard.writeText(aiResult); showToast("Conclusion copiée !", "#34a853", "📋"); }}
                    style={{ ...S.backBtn, width: "100%", marginTop: 12, fontSize: 12 }}>📋 Copier la conclusion</button>
                  <button onClick={generateConclusion} style={{ ...S.cancelBtn, width: "100%", marginTop: 6, fontSize: 12 }}>🔄 Regénérer</button>
                </div>
              ) : (
                <div style={{ textAlign: "center", padding: "20px 10px" }}>
                  <div style={{ fontSize: 52, marginBottom: 14 }}>🤖</div>
                  <p style={{ color: "#9aa0a6", fontSize: 13, marginBottom: 20, lineHeight: 1.7 }}>
                    L'IA analysera la transcription et le chat pour générer une conclusion et un résumé professionnel sauvegardé dans l'archive.
                  </p>
                  <button onClick={generateConclusion} style={{ ...S.backBtn, width: "100%" }}>✨ Générer la conclusion</button>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* FLOATING REACTIONS */}
      <div style={S.floatZone}>
        {floats.map(f => (
          <div key={f.id} style={{ display: "flex", flexDirection: "column", alignItems: "center", animation: "floatUp 3s ease-out forwards" }}>
            <span style={{ fontSize: 36 }}>{f.emoji}</span>
            <span style={{ color: "#9aa0a6", fontSize: 10 }}>{f.n}</span>
          </div>
        ))}
      </div>

      {/* SUBTITLES */}
      {subs && subtitle && (
        <div style={S.subBar}>{subtitle}</div>
      )}

      {/* EMOJI BAR POPUP */}
      {emojiBar && (
        <div style={S.emojiPopup}>
          {["👍", "❤️", "😂", "🎉", "🔥", "👏", "🙌", "💯", "😮", "🤔", "👎", "🙄"].map(e => (
            <button key={e} onClick={() => sendReaction(e)} style={S.emojiBig} title={e}>{e}</button>
          ))}
        </div>
      )}

      {/* CONTROLS BAR */}
      <div style={S.ctrl}>
        {/* Left group */}
        <div style={S.ctrlGrp}>
          <Btn icon={audioOn ? "🎤" : "🔇"} label={audioOn ? "Micro" : "Muet"} onClick={toggleAudio} active={audioOn} />
          <Btn icon={videoOn ? "📷" : "🚫"} label={videoOn ? "Caméra" : "Off"} onClick={toggleVideo} active={videoOn} />
        </div>

        {/* Center group */}
        <div style={S.ctrlGrp}>
          <Btn icon="🖥️" label={screen ? "Arrêter" : "Partager"} onClick={toggleScreen} active={!screen} />
          <Btn icon="✋" label={hand ? "Baisser" : "Main"} onClick={toggleHand} active={!hand} pulse={hand} />
          <Btn icon="😄" label="Réactions" onClick={() => setEmojiBar(o => !o)} active />
          <Btn icon="💬" label="Chat" onClick={() => { setChatOpen(o => !o); setUnread(0); setPanelOpen(false); setAiOpen(false); }} active badge={unread} />
          <Btn icon="👥" label="Membres" onClick={() => { setPanelOpen(o => !o); setChatOpen(false); setAiOpen(false); }} active />
        </div>

        {/* Right group */}
        <div style={S.ctrlGrp}>
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 2 }}>
            <button onClick={() => setSubs(o => !o)}
              style={{ ...B.btn, background: subs ? "linear-gradient(135deg,#1a73e8,#0d47a1)" : "rgba(255,255,255,.1)" }}>
              <span style={{ fontSize: 14, fontWeight: 800, fontFamily: "monospace" }}>CC</span>
              <span style={B.lbl}>Sous-titres</span>
            </button>
          </div>
          <Btn icon="✨" label="Conclusion" onClick={() => { setAiOpen(o => !o); setChatOpen(false); setPanelOpen(false); }} active />
          <Btn icon="🚪" label="Quitter" onClick={() => { cleanup(); navigate(-1); }} danger />
        </div>
      </div>
    </div>
  );
}

const S = {
  page:       { minHeight: "100vh", background: "#202124", display: "flex", flexDirection: "column", fontFamily: "'Google Sans',system-ui,sans-serif", color: "#fff", overflow: "hidden" },
  center:     { minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "#202124" },
  spin:       { width: 44, height: 44, border: "3px solid rgba(255,255,255,.1)", borderTopColor: "#8ab4f8", borderRadius: "50%", animation: "spin 0.8s linear infinite" },
  errCard:    { background: "#2d2f31", border: "1px solid rgba(255,255,255,.1)", borderRadius: 20, padding: 48, textAlign: "center", maxWidth: 400 },
  backBtn:    { background: "linear-gradient(135deg,#1a73e8,#0d47a1)", color: "#fff", border: "none", padding: "11px 24px", borderRadius: 10, cursor: "pointer", fontWeight: 700, fontSize: 13 },
  toast:      { position: "fixed", top: 18, left: "50%", transform: "translateX(-50%)", color: "#fff", padding: "10px 20px", borderRadius: 24, fontSize: 13, fontWeight: 600, zIndex: 999, boxShadow: "0 4px 24px rgba(0,0,0,.5)", display: "flex", alignItems: "center", gap: 6, whiteSpace: "nowrap" },
  overlay:    { position: "fixed", inset: 0, background: "rgba(0,0,0,.75)", backdropFilter: "blur(8px)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000 },
  modal:      { background: "#2d2f31", border: "1px solid rgba(255,255,255,.08)", borderRadius: 20, padding: 40, textAlign: "center", animation: "popIn .3s ease", maxWidth: 380, width: "90%" },
  cancelBtn:  { background: "rgba(255,255,255,.08)", border: "1px solid rgba(255,255,255,.12)", borderRadius: 10, padding: "10px 22px", color: "#e8eaed", cursor: "pointer", fontWeight: 600, fontSize: 13 },
  dangerBtn:  { background: "linear-gradient(135deg,#ea4335,#c62828)", border: "none", borderRadius: 10, padding: "10px 22px", color: "#fff", cursor: "pointer", fontWeight: 700, fontSize: 13 },
  hdr:        { display: "flex", alignItems: "center", justifyContent: "space-between", padding: "10px 20px", background: "#2d2f31", flexShrink: 0, borderBottom: "1px solid rgba(255,255,255,.06)" },
  logo:       { width: 34, height: 34, borderRadius: 10, background: "linear-gradient(135deg,#1a73e8,#0d47a1)", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 900, fontSize: 16, color: "#fff", boxShadow: "0 2px 12px rgba(26,115,232,.4)" },
  recDot:     { width: 8, height: 8, borderRadius: "50%", display: "inline-block", animation: "pulse 2s infinite" },
  countBadge: { background: "rgba(255,255,255,.08)", color: "#9aa0a6", padding: "4px 10px", borderRadius: 20, fontSize: 12, fontWeight: 600 },
  ghost:      { background: "rgba(255,255,255,.06)", border: "1px solid rgba(255,255,255,.1)", color: "#e8eaed", padding: "6px 14px", borderRadius: 8, cursor: "pointer", fontSize: 12, fontWeight: 500 },
  linkBar:    { background: "#2d2f31", borderBottom: "1px solid rgba(255,255,255,.06)", padding: "10px 18px", flexShrink: 0 },
  copyBtn:    { background: "linear-gradient(135deg,#1a73e8,#0d47a1)", border: "none", borderRadius: 8, padding: "6px 14px", color: "#fff", cursor: "pointer", fontSize: 12, fontWeight: 600, whiteSpace: "nowrap" },
  body:       { flex: 1, display: "flex", overflow: "hidden", gap: 8, padding: 8, minHeight: 0 },
  grid:       { flex: 1, display: "grid", gap: 8, alignContent: "center", overflow: "hidden", minWidth: 0 },
  panel:      { width: 320, background: "#2d2f31", borderRadius: 12, border: "1px solid rgba(255,255,255,.06)", display: "flex", flexDirection: "column", overflow: "hidden", flexShrink: 0 },
  panHdr:     { padding: "12px 14px", borderBottom: "1px solid rgba(255,255,255,.06)", display: "flex", justifyContent: "space-between", alignItems: "center" },
  closeX:     { background: "none", border: "none", color: "#5f6368", cursor: "pointer", fontSize: 16, transition: "color .2s", lineHeight: 1 },
  msgList:    { flex: 1, overflowY: "auto", padding: 10, display: "flex", flexDirection: "column", gap: 8 },
  bubble:     { padding: "8px 12px", borderRadius: 12, fontSize: 13, lineHeight: 1.6, wordBreak: "break-word" },
  chatRow:    { display: "flex", gap: 6, padding: "8px 10px", borderTop: "1px solid rgba(255,255,255,.06)" },
  chatIn:     { flex: 1, background: "rgba(255,255,255,.06)", border: "1px solid rgba(255,255,255,.1)", borderRadius: 20, padding: "8px 13px", color: "#e8eaed", fontSize: 13, outline: "none", fontFamily: "'Google Sans',sans-serif" },
  sendBtn:    { background: "linear-gradient(135deg,#1a73e8,#0d47a1)", border: "none", borderRadius: "50%", width: 36, height: 36, color: "#fff", cursor: "pointer", fontSize: 14, flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center" },
  pRow:       { display: "flex", alignItems: "center", gap: 8, padding: "8px 4px", borderBottom: "1px solid rgba(255,255,255,.04)" },
  pAv:        { width: 34, height: 34, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 800, fontSize: 13, flexShrink: 0 },
  adminBtn:   { background: "rgba(255,255,255,.06)", border: "1px solid rgba(255,255,255,.08)", borderRadius: 6, color: "#e8eaed", padding: "4px 7px", cursor: "pointer", fontSize: 12 },
  floatZone:  { position: "fixed", bottom: 100, left: "50%", transform: "translateX(-50%)", display: "flex", gap: 16, pointerEvents: "none", zIndex: 60 },
  subBar:     { position: "fixed", bottom: 88, left: "50%", transform: "translateX(-50%)", background: "rgba(0,0,0,.88)", color: "#fff", padding: "8px 20px", borderRadius: 10, maxWidth: "65%", textAlign: "center", fontSize: 14, zIndex: 50, border: "1px solid rgba(255,255,255,.08)", backdropFilter: "blur(8px)" },
  emojiPopup: { position: "fixed", bottom: 82, left: "50%", transform: "translateX(-50%)", background: "#2d2f31", border: "1px solid rgba(255,255,255,.1)", borderRadius: 16, padding: "10px 14px", display: "flex", gap: 6, flexWrap: "wrap", zIndex: 70, boxShadow: "0 8px 32px rgba(0,0,0,.6)", animation: "popIn .2s ease", maxWidth: 280 },
  emojiBig:   { background: "none", border: "none", fontSize: 26, cursor: "pointer", borderRadius: 8, padding: "4px 6px", transition: "transform .1s" },
  ctrl:       { background: "#2d2f31", padding: "10px 16px", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8, flexShrink: 0, flexWrap: "wrap", borderTop: "1px solid rgba(255,255,255,.05)" },
  ctrlGrp:    { display: "flex", gap: 4, alignItems: "flex-end" },
  sel:        { background: "rgba(255,255,255,.08)", border: "1px solid rgba(255,255,255,.12)", color: "#e8eaed", padding: "5px 8px", borderRadius: 8, fontSize: 12, cursor: "pointer", outline: "none" },
};