import { useEffect, useRef, useState, useCallback } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import { io } from "socket.io-client";

const SOCKET_URL = "https://debat-jeune.onrender.com";
const ANTHROPIC_URL = "https://api.anthropic.com/v1/messages";

const STYLE = `
@import url('https://fonts.googleapis.com/css2?family=Google+Sans:wght@400;500;600;700&display=swap');
* { box-sizing: border-box; margin: 0; padding: 0; }
body { overflow: hidden; }
@keyframes spin    { to { transform: rotate(360deg); } }
@keyframes floatUp { 0%{opacity:1;transform:translateY(0) scale(1)} 100%{opacity:0;transform:translateY(-90px) scale(1.5)} }
@keyframes fadeIn  { from{opacity:0;transform:translateY(6px)} to{opacity:1;transform:translateY(0)} }
@keyframes pulse   { 0%,100%{opacity:1} 50%{opacity:.4} }
@keyframes slideIn { from{opacity:0;transform:translateX(24px)} to{opacity:1;transform:translateX(0)} }
@keyframes popIn   { 0%{transform:scale(0.85);opacity:0} 100%{transform:scale(1);opacity:1} }
@keyframes toastIn { from{opacity:0;transform:translateX(-50%) translateY(-12px)} to{opacity:1;transform:translateX(-50%) translateY(0)} }
@keyframes handWave{ 0%,100%{transform:rotate(0)} 25%{transform:rotate(20deg)} 75%{transform:rotate(-10deg)} }
.emoji-btn:hover { transform: scale(1.25); }
.ctrl-btn:hover  { filter: brightness(1.2); }
.msg-bubble { word-break: break-word; }
::-webkit-scrollbar { width: 4px; }
::-webkit-scrollbar-track { background: transparent; }
::-webkit-scrollbar-thumb { background: rgba(255,255,255,.15); border-radius: 4px; }
`;

/* ──────────────────────────────────────────────────────── */
/* Speech Recognition Hook                                  */
/* ──────────────────────────────────────────────────────── */
function useSubtitles(enabled, lang) {
  const [text, setText]       = useState("");
  const [transcript, setTrans] = useState([]);
  const ref = useRef(null);
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
      if (finals.length) setTrans(p => [...p, ...finals]);
    };
    r.onerror = () => {};
    r.start(); ref.current = r;
    return () => { try { r.stop(); } catch {} };
  }, [enabled, lang]);
  return { text, transcript };
}

/* ──────────────────────────────────────────────────────── */
/* AI Translation                                           */
/* ──────────────────────────────────────────────────────── */
async function aiTranslate(text, lang) {
  const names = { fr: "français", ar: "arabe", en: "anglais", es: "espagnol", de: "allemand" };
  const res = await fetch(ANTHROPIC_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      model: "claude-sonnet-4-20250514",
      max_tokens: 300,
      messages: [{ role: "user", content: `Traduis en ${names[lang] || lang}. Réponds UNIQUEMENT avec la traduction:\n"${text}"` }]
    })
  });
  const d = await res.json();
  return d.content?.[0]?.text?.trim() || text;
}

/* ──────────────────────────────────────────────────────── */
/* Video Tile                                               */
/* ──────────────────────────────────────────────────────── */
function VideoTile({ stream, muted = false, name = "?", role = "guest", videoOff = false, hand = false, isLocal = false, localRef, screenSharing = false }) {
  const vRef = isLocal ? localRef : useRef(null);
  useEffect(() => { if (vRef?.current && stream) vRef.current.srcObject = stream; }, [stream]);
  const initials = (name || "?").split(" ").map(w => w[0]).join("").slice(0, 2).toUpperCase();
  const isHost = role === "host";
  return (
    <div style={{
      position: "relative", background: "#1a1a1a", borderRadius: 12, overflow: "hidden",
      aspectRatio: "16/9", minHeight: 120,
      boxShadow: hand ? "0 0 0 3px #fbbc04" : isHost ? "0 0 0 2px rgba(26,115,232,.5)" : "none"
    }}>
      {/* Video element — always rendered for local */}
      <video
        ref={vRef}
        autoPlay playsInline muted={muted}
        style={{ width: "100%", height: "100%", objectFit: "cover", background: "#000", display: (videoOff || (!stream && !isLocal)) ? "none" : "block" }}
      />
      {/* Avatar when cam off or no stream */}
      {(videoOff || (!stream && !isLocal)) && (
        <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", background: "radial-gradient(circle at 35% 30%, #2a2a2a, #111)" }}>
          <div style={{
            width: 64, height: 64, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 24, fontWeight: 700, color: "#fff",
            background: isHost ? "linear-gradient(135deg,#1a73e8,#0d47a1)" : "linear-gradient(135deg,#34a853,#1a6e38)",
            boxShadow: "0 4px 16px rgba(0,0,0,.6)"
          }}>{initials}</div>
        </div>
      )}
      {/* Footer: name + badges */}
      <div style={{ position: "absolute", bottom: 8, left: 8, display: "flex", gap: 5, alignItems: "center", flexWrap: "wrap" }}>
        {isHost && <span style={{ background: "rgba(26,115,232,.9)", color: "#fff", fontSize: 9, fontWeight: 800, padding: "2px 7px", borderRadius: 20, letterSpacing: .5 }}>👑 HOST</span>}
        {screenSharing && <span style={{ background: "rgba(52,168,83,.9)", color: "#fff", fontSize: 9, padding: "2px 7px", borderRadius: 8 }}>🖥️ Écran</span>}
        <span style={{ background: "rgba(0,0,0,.72)", backdropFilter: "blur(4px)", color: "#fff", fontSize: 12, padding: "3px 8px", borderRadius: 6 }}>
          {isLocal ? `${name} (Vous)` : name}
        </span>
        {videoOff && <span style={{ background: "rgba(234,67,53,.8)", color: "#fff", fontSize: 10, padding: "2px 6px", borderRadius: 6 }}>📷 Off</span>}
      </div>
      {hand && <div style={{ position: "absolute", top: 8, left: 8, fontSize: 20, animation: "handWave .6s infinite" }}>✋</div>}
    </div>
  );
}

/* ──────────────────────────────────────────────────────── */
/* Control Button                                           */
/* ──────────────────────────────────────────────────────── */
function Btn({ icon, label, onClick, active = true, danger = false, badge = 0, pulse = false }) {
  return (
    <button className="ctrl-btn" onClick={onClick} title={label} style={{
      border: "none", borderRadius: 12, padding: "10px 14px", color: "#fff", cursor: "pointer",
      display: "flex", flexDirection: "column", alignItems: "center", gap: 3, minWidth: 60,
      transition: "all .15s", position: "relative",
      background: danger ? "#ea4335" : !active ? "#ea4335" : "rgba(255,255,255,.1)",
      animation: pulse ? "pulse 1.5s infinite" : "none",
    }}>
      <span style={{ fontSize: 20 }}>{icon}</span>
      <span style={{ fontSize: 10, fontWeight: 600, opacity: .9, whiteSpace: "nowrap" }}>{label}</span>
      {badge > 0 && (
        <span style={{ position: "absolute", top: -5, right: -5, background: "#ea4335", color: "#fff", borderRadius: "50%", width: 18, height: 18, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 10, fontWeight: 800 }}>
          {badge > 99 ? "99+" : badge}
        </span>
      )}
    </button>
  );
}

/* ══════════════════════════════════════════════════════════ */
/* MAIN COMPONENT                                             */
/* ══════════════════════════════════════════════════════════ */
export default function MeetRoom() {
  const { roomCode } = useParams();
  const [sp]         = useSearchParams();
  const navigate     = useNavigate();

  // ── Token & role ──────────────────────────────────────
  const token  = sp.get("at") || sp.get("vt") || "";
  const myRole = sp.get("at") ? "host" : "guest";
  const user   = JSON.parse(localStorage.getItem("user") || "{}");
  const myName = user?.prenom_user
    ? `${user.prenom_user} ${user.nom_user || ""}`.trim()
    : user?.name || (myRole === "host" ? "Admin" : "Invité");

  // ── State ─────────────────────────────────────────────
  const [status,       setStatus]      = useState("loading");
  const [errorMsg,     setErrorMsg]    = useState("");
  const [audioOn,      setAudioOn]     = useState(true);
  const [videoOn,      setVideoOn]     = useState(true);
  const [hand,         setHand]        = useState(false);
  const [screen,       setScreen]      = useState(false);
  const [subs,         setSubs]        = useState(false);
  const [subLang,      setSubLang]     = useState("fr");
  const [transLang,    setTransLang]   = useState("fr");
  const [chatOpen,     setChatOpen]    = useState(false);
  const [panelOpen,    setPanelOpen]   = useState(false);
  const [aiOpen,       setAiOpen]      = useState(false);
  const [emojiOpen,    setEmojiOpen]   = useState(false);
  const [msgs,         setMsgs]        = useState([]);
  const [input,        setInput]       = useState("");
  const [unread,       setUnread]      = useState(0);
  const [peers,        setPeers]       = useState([]);       // { id, stream, name, role }
  const [pMedia,       setPMedia]      = useState({});       // { [socketId]: { audio, video, hand, screenSharing } }
  const [ptcps,        setPtcps]       = useState([]);       // participants-update list
  const [floats,       setFloats]      = useState([]);
  const [copied,       setCopied]      = useState(false);
  const [aiLoading,    setAiLoading]   = useState(false);
  const [aiResult,     setAiResult]    = useState("");
  const [showLink,     setShowLink]    = useState(false);
  const [kickTarget,   setKickTarget]  = useState(null);
  const [toast,        setToast]       = useState(null);
  const [duration,     setDuration]    = useState(0);
  const [translations, setTranslations]= useState({});
  const [translating,  setTranslating] = useState({});
  const [showSettings, setShowSettings]= useState(false);

  // ── Refs ──────────────────────────────────────────────
  const sockRef   = useRef(null);
  const localVid  = useRef(null);
  const localStr  = useRef(null);
  const screenStr = useRef(null);
  const peerMap   = useRef({});   // { [socketId]: RTCPeerConnection }
  const nameMap   = useRef({});
  const roleMap   = useRef({});
  const chatEnd   = useRef(null);
  const timerRef  = useRef(null);

  const { text: subtitle, transcript: fullTranscript } = useSubtitles(subs, subLang);

  // Viewer link stored by NewLive.jsx when admin creates live
  const viewerLink = localStorage.getItem("currentLiveViewerLink") || "";

  // ── Helpers ───────────────────────────────────────────
  const showToast = useCallback((msg, color = "#1a73e8", icon = "") => {
    setToast({ msg, color, icon });
    setTimeout(() => setToast(null), 3500);
  }, []);

  const fmtTime = (s) => {
    const h = Math.floor(s / 3600), m = Math.floor((s % 3600) / 60), sec = s % 60;
    return h > 0
      ? `${h}:${String(m).padStart(2,"0")}:${String(sec).padStart(2,"0")}`
      : `${String(m).padStart(2,"0")}:${String(sec).padStart(2,"0")}`;
  };

  // ── Timer ─────────────────────────────────────────────
  useEffect(() => {
    timerRef.current = setInterval(() => setDuration(d => d + 1), 1000);
    return () => clearInterval(timerRef.current);
  }, []);

  // ── createPeer (WebRTC) ───────────────────────────────
  const createPeer = useCallback((tid) => {
    const pc = new RTCPeerConnection({
      iceServers: [
        { urls: "stun:stun.l.google.com:19302" },
        { urls: "stun:stun1.l.google.com:19302" },
      ]
    });
    pc.onicecandidate = e => {
      if (e.candidate) sockRef.current?.emit("ice-candidate", { target: tid, candidate: e.candidate });
    };
    pc.ontrack = e => {
      const stream = e.streams[0];
      setPeers(prev => {
        const exists = prev.find(p => p.id === tid);
        if (exists) return prev.map(p => p.id === tid ? { ...p, stream } : p);
        return [...prev, { id: tid, stream, name: nameMap.current[tid] || "Invité", role: roleMap.current[tid] || "guest" }];
      });
    };
    // Add local tracks to peer
    if (localStr.current) {
      localStr.current.getTracks().forEach(t => pc.addTrack(t, localStr.current));
    }
    return pc;
  }, []);

  // ── Main Init ─────────────────────────────────────────
  useEffect(() => {
    if (!token) { setErrorMsg("Token manquant. Vérifiez votre lien."); setStatus("error"); return; }
    let alive = true;

    (async () => {
      // Get camera/mic — only admin needs camera by default
      // Guests (jeunes) can open mic when granted
      try {
        const constraints = myRole === "host"
          ? { video: true, audio: true }
          : { video: false, audio: true };   // jeunes: audio only by default, no camera
        const st = await navigator.mediaDevices.getUserMedia(constraints);
        if (!alive) { st.getTracks().forEach(t => t.stop()); return; }
        localStr.current = st;
        if (localVid.current) localVid.current.srcObject = st;
        // Guests: mute by default, they only speak when they want
        if (myRole === "guest") {
          st.getAudioTracks().forEach(t => { t.enabled = false; });
          setAudioOn(false);
        }
      } catch {
        setAudioOn(false);
        setVideoOn(false);
      }

      setStatus("ok");

      const sock = io(SOCKET_URL, { transports: ["websocket"] });
      sockRef.current = sock;

      sock.on("connect", () => {
        sock.emit("join-room", { roomCode, userName: myName, role: myRole, accessToken: token }, ack => {
          if (!ack?.ok) { setErrorMsg(ack?.message || "Accès refusé"); setStatus("error"); }
        });
      });

      sock.on("all-users", async (users) => {
        for (const u of users) {
          nameMap.current[u.socketId] = u.userName;
          roleMap.current[u.socketId] = u.role;
          const pc = createPeer(u.socketId);
          peerMap.current[u.socketId] = pc;
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
        const n = nameMap.current[socketId];
        if (n) showToast(`${n} a quitté`, "#5f6368");
        peerMap.current[socketId]?.close();
        delete peerMap.current[socketId];
        setPeers(prev => prev.filter(p => p.id !== socketId));
      });

      sock.on("user-media-toggled", ({ socketId, type, enabled }) => {
        setPMedia(prev => ({ ...prev, [socketId]: { ...prev[socketId], [type]: enabled } }));
      });

      sock.on("participants-update", setPtcps);

      // Messages — received by EVERYONE in the room
      sock.on("receive-message", msg => {
        setMsgs(prev => [...prev, { ...msg, id: Date.now() + Math.random() }]);
        setChatOpen(open => {
          if (!open) setUnread(n => n + 1);
          return open;
        });
      });

      // Reactions — float for everyone
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
        const trk = type === "audio"
          ? localStr.current?.getAudioTracks()[0]
          : localStr.current?.getVideoTracks()[0];
        if (trk) { trk.enabled = false; type === "audio" ? setAudioOn(false) : setVideoOn(false); }
        showToast(`L'hôte a coupé votre ${type === "audio" ? "micro" : "caméra"}`, "#ea4335", "🔇");
      });

      sock.on("force-kicked", () => { alert("Vous avez été retiré de la réunion."); cleanup(); navigate(-1); });
      sock.on("live-ended",   () => { alert("Le live est terminé."); cleanup(); navigate(-1); });

      sock.on("screen-share-started", ({ socketId }) => {
        setPMedia(prev => ({ ...prev, [socketId]: { ...prev[socketId], screenSharing: true } }));
      });
      sock.on("screen-share-stopped", ({ socketId }) => {
        setPMedia(prev => ({ ...prev, [socketId]: { ...prev[socketId], screenSharing: false } }));
      });
    })();

    return () => { alive = false; cleanup(); };
  }, [roomCode, token, myRole, myName, createPeer]);

  // Auto-scroll chat
  useEffect(() => { chatEnd.current?.scrollIntoView({ behavior: "smooth" }); }, [msgs]);

  // ── Actions ───────────────────────────────────────────
  const cleanup = () => {
    clearInterval(timerRef.current);
    sockRef.current?.emit("leave-room");
    sockRef.current?.disconnect();
    Object.values(peerMap.current).forEach(pc => pc.close());
    peerMap.current = {};
    localStr.current?.getTracks().forEach(t => t.stop());
    screenStr.current?.getTracks().forEach(t => t.stop());
  };

  const emit = (ev, data) => sockRef.current?.emit(ev, data);

  const toggleAudio = () => {
    const t = localStr.current?.getAudioTracks()[0];
    if (!t) return;
    t.enabled = !t.enabled;
    setAudioOn(t.enabled);
    emit("toggle-media", { roomCode, type: "audio", enabled: t.enabled });
  };

  // Only admin has camera — guest has no camera
  const toggleVideo = () => {
    if (myRole !== "host") {
      showToast("Seul l'hôte peut activer la caméra", "#fbbc04", "ℹ️");
      return;
    }
    const t = localStr.current?.getVideoTracks()[0];
    if (!t) return;
    t.enabled = !t.enabled;
    setVideoOn(t.enabled);
    emit("toggle-media", { roomCode, type: "video", enabled: t.enabled });
  };

  const toggleHand = () => {
    if (myRole === "host") return; // hosts don't raise hands
    const r = !hand;
    setHand(r);
    emit("raise-hand", { roomCode, raised: r });
    if (r) showToast("Main levée — l'hôte a été notifié", "#fbbc04", "✋");
    else showToast("Main baissée", "#5f6368");
  };

  const toggleScreen = async () => {
    if (myRole !== "host") { showToast("Seul l'hôte peut partager l'écran", "#fbbc04", "ℹ️"); return; }
    if (screen) {
      screenStr.current?.getTracks().forEach(t => t.stop());
      screenStr.current = null;
      setScreen(false);
      emit("screen-share-stopped", { roomCode });
      const cam = localStr.current?.getVideoTracks()[0];
      Object.values(peerMap.current).forEach(pc => {
        const s = pc.getSenders().find(s => s.track?.kind === "video");
        if (s && cam) s.replaceTrack(cam);
      });
    } else {
      try {
        const ss = await navigator.mediaDevices.getDisplayMedia({ video: true, audio: true });
        screenStr.current = ss;
        const trk = ss.getVideoTracks()[0];
        Object.values(peerMap.current).forEach(pc => {
          const s = pc.getSenders().find(s => s.track?.kind === "video");
          if (s) s.replaceTrack(trk);
        });
        trk.onended = toggleScreen;
        setScreen(true);
        emit("screen-share-started", { roomCode });
        showToast("Partage d'écran actif — visible par tous", "#34a853", "🖥️");
      } catch { showToast("Partage annulé", "#5f6368"); }
    }
  };

  const sendReaction = (emoji) => {
    emit("send-reaction", { roomCode, emoji });
    const id = Date.now();
    setFloats(prev => [...prev, { id, n: "Vous", emoji }]);
    setTimeout(() => setFloats(prev => prev.filter(f => f.id !== id)), 3200);
    setEmojiOpen(false);
  };

  const sendMsg = () => {
    if (!input.trim()) return;
    emit("send-message", { roomCode, message: input });
    setInput("");
  };

  const copyLink = async () => {
    const lnk = viewerLink || window.location.href;
    await navigator.clipboard.writeText(lnk).catch(() => {});
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
    showToast("✅ Lien copié !", "#34a853");
  };

  const adminMute = (targetSocketId, type) => {
    if (myRole !== "host") return;
    emit("admin-mute", { roomCode, targetSocketId, type });
    showToast(`Micro/caméra coupé`, "#fbbc04", "🔇");
  };

  const adminKick = (targetSocketId) => {
    if (myRole !== "host") return;
    setKickTarget(targetSocketId);
  };

  const confirmKick = () => {
    if (!kickTarget) return;
    emit("admin-kick", { roomCode, targetSocketId: kickTarget });
    setKickTarget(null);
    showToast("Participant retiré", "#ea4335", "🚪");
  };

  // Admin mutes all guests
  const muteAll = () => {
    ptcps
      .filter(p => p.socketId !== sockRef.current?.id && p.role !== "host")
      .forEach(p => adminMute(p.socketId, "audio"));
    showToast("Tous les micros coupés", "#fbbc04", "🔇");
  };

  // ── AI Conclusion ──────────────────────────────────────
  const generateConclusion = async () => {
    setAiLoading(true);
    try {
      const chatContent = msgs.map(m => `${m.user}: ${m.text}`).join("\n");
      const prompt = `Tu es un assistant expert en résumé de réunions.

Contenu de la réunion "${roomCode}":

TRANSCRIPTION VOCALE:
${fullTranscript.join(" ") || "(aucune — sous-titres non activés)"}

MESSAGES CHAT:
${chatContent || "(aucun message)"}

STATISTIQUES:
- Participants: ${ptcps.length}
- Durée: ${fmtTime(duration)}
- Date: ${new Date().toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}

Génère une conclusion structurée professionnelle avec:
1. 📋 Résumé des points principaux
2. 💡 Idées clés et propositions  
3. ✅ Points de consensus
4. 🎯 Actions recommandées
5. 📊 Statistiques de la session

Sois concis et professionnel. Langue: français.`;

      const res = await fetch(ANTHROPIC_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "claude-sonnet-4-20250514",
          max_tokens: 1000,
          messages: [{ role: "user", content: prompt }]
        })
      });
      const data = await res.json();
      setAiResult(data.content?.[0]?.text || "Erreur lors de la génération.");
    } catch { setAiResult("Erreur de connexion à l'IA."); }
    finally { setAiLoading(false); }
  };

  // ── Translate a message ────────────────────────────────
  const handleTranslate = async (msgId, text) => {
    setTranslating(p => ({ ...p, [msgId]: true }));
    try {
      const translated = await aiTranslate(text, transLang);
      setTranslations(p => ({ ...p, [msgId]: translated }));
    } catch {}
    setTranslating(p => ({ ...p, [msgId]: false }));
  };

  // ── Grid ──────────────────────────────────────────────
  // For guests: only show admin video (the host)
  // For host: show everyone
  const tilesForGuest = peers.filter(p =>
    roleMap.current[p.id] === "host" || ptcps.find(x => x.socketId === p.id)?.role === "host"
  );
  const tilesToShow = myRole === "host" ? peers : tilesForGuest;
  const total = 1 + tilesToShow.length;
  const cols  = total <= 1 ? 1 : total <= 4 ? 2 : total <= 9 ? 3 : 4;

  // ── Loading / Error states ────────────────────────────
  if (status === "loading") return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "#202124" }}>
      <style>{STYLE}</style>
      <div style={{ textAlign: "center" }}>
        <div style={{ width: 48, height: 48, border: "3px solid rgba(255,255,255,.1)", borderTopColor: "#8ab4f8", borderRadius: "50%", animation: "spin .8s linear infinite", margin: "0 auto 16px" }} />
        <p style={{ color: "#9aa0a6", fontSize: 14, fontFamily: "'Google Sans',sans-serif" }}>Connexion en cours…</p>
      </div>
    </div>
  );

  if (status === "error") return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "#202124" }}>
      <style>{STYLE}</style>
      <div style={{ background: "#2d2f31", border: "1px solid rgba(255,255,255,.08)", borderRadius: 20, padding: 48, textAlign: "center", maxWidth: 400, fontFamily: "'Google Sans',sans-serif" }}>
        <div style={{ fontSize: 52, marginBottom: 16 }}>🔒</div>
        <p style={{ color: "#e8eaed", fontWeight: 700, fontSize: 18, marginBottom: 8 }}>Accès refusé</p>
        <p style={{ color: "#9aa0a6", fontSize: 14, marginBottom: 24, lineHeight: 1.6 }}>{errorMsg}</p>
        <button onClick={() => navigate(-1)} style={{ background: "#1a73e8", color: "#fff", border: "none", padding: "11px 24px", borderRadius: 10, cursor: "pointer", fontWeight: 700, fontSize: 13 }}>← Retour</button>
      </div>
    </div>
  );

  /* ════════════════════════════════════════════════════ */
  /* MAIN RENDER                                          */
  /* ════════════════════════════════════════════════════ */
  return (
    <div style={{ minHeight: "100vh", height: "100vh", background: "#202124", display: "flex", flexDirection: "column", fontFamily: "'Google Sans',system-ui,sans-serif", color: "#fff", overflow: "hidden" }}>
      <style>{STYLE}</style>

      {/* ── TOAST ── */}
      {toast && (
        <div style={{ position: "fixed", top: 18, left: "50%", transform: "translateX(-50%)", color: "#fff", padding: "10px 20px", borderRadius: 24, fontSize: 13, fontWeight: 600, zIndex: 9999, boxShadow: "0 4px 24px rgba(0,0,0,.5)", display: "flex", alignItems: "center", gap: 6, whiteSpace: "nowrap", background: toast.color, animation: "toastIn .3s ease" }}>
          {toast.icon}<span>{toast.msg}</span>
        </div>
      )}

      {/* ── KICK CONFIRM MODAL ── */}
      {kickTarget && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,.75)", backdropFilter: "blur(8px)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000 }}>
          <div style={{ background: "#2d2f31", border: "1px solid rgba(255,255,255,.08)", borderRadius: 20, padding: 40, textAlign: "center", animation: "popIn .3s ease", maxWidth: 360, width: "90%" }}>
            <div style={{ fontSize: 44, marginBottom: 14 }}>⚠️</div>
            <p style={{ color: "#e8eaed", fontWeight: 700, fontSize: 16, marginBottom: 8 }}>Retirer ce participant ?</p>
            <p style={{ color: "#9aa0a6", fontSize: 13, marginBottom: 24 }}>Il sera exclu immédiatement.</p>
            <div style={{ display: "flex", gap: 10, justifyContent: "center" }}>
              <button onClick={() => setKickTarget(null)} style={{ background: "rgba(255,255,255,.08)", border: "1px solid rgba(255,255,255,.12)", borderRadius: 10, padding: "10px 22px", color: "#e8eaed", cursor: "pointer", fontWeight: 600, fontSize: 13 }}>Annuler</button>
              <button onClick={confirmKick} style={{ background: "#ea4335", border: "none", borderRadius: 10, padding: "10px 22px", color: "#fff", cursor: "pointer", fontWeight: 700, fontSize: 13 }}>🚪 Retirer</button>
            </div>
          </div>
        </div>
      )}

      {/* ── HEADER ── */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "10px 20px", background: "#2d2f31", flexShrink: 0, borderBottom: "1px solid rgba(255,255,255,.06)" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div style={{ width: 34, height: 34, borderRadius: 10, background: "linear-gradient(135deg,#1a73e8,#0d47a1)", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 900, fontSize: 16 }}>S</div>
          <div>
            <div style={{ color: "#e8eaed", fontWeight: 700, fontSize: 14 }}>Swafy Meet</div>
            <div style={{ color: "#9aa0a6", fontSize: 11, display: "flex", gap: 6, alignItems: "center" }}>
              <span style={{ width: 8, height: 8, borderRadius: "50%", background: myRole === "host" ? "#ea4335" : "#34a853", display: "inline-block", animation: "pulse 2s infinite" }} />
              {roomCode} · {myRole === "host" ? "👑 Hôte" : "👤 Participant"} · {fmtTime(duration)}
            </div>
          </div>
        </div>
        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          <span style={{ background: "rgba(255,255,255,.08)", color: "#9aa0a6", padding: "4px 10px", borderRadius: 20, fontSize: 12 }}>{ptcps.length} 👥</span>
          <button onClick={() => setShowLink(o => !o)} style={{ background: "rgba(255,255,255,.06)", border: "1px solid rgba(255,255,255,.1)", color: "#e8eaed", padding: "6px 14px", borderRadius: 8, cursor: "pointer", fontSize: 12 }}>
            🔗 {copied ? "Copié !" : "Inviter"}
          </button>
          <button onClick={() => setShowSettings(o => !o)} style={{ background: "rgba(255,255,255,.06)", border: "1px solid rgba(255,255,255,.1)", color: "#e8eaed", padding: "6px 12px", borderRadius: 8, cursor: "pointer", fontSize: 12 }}>⚙️</button>
        </div>
      </div>

      {/* ── SHARE LINK BAR ── */}
      {showLink && (
        <div style={{ background: "#2d2f31", borderBottom: "1px solid rgba(255,255,255,.06)", padding: "10px 18px", flexShrink: 0 }}>
          <div style={{ color: "#9aa0a6", fontSize: 11, marginBottom: 6 }}>🔗 Lien pour les participants (partagez ce lien aux jeunes)</div>
          <div style={{ display: "flex", gap: 8 }}>
            <span style={{ flex: 1, color: "#8ab4f8", fontSize: 12, wordBreak: "break-all", background: "rgba(138,180,248,.08)", padding: "6px 10px", borderRadius: 6, fontFamily: "monospace" }}>
              {viewerLink || window.location.href.replace("at=", "vt=")}
            </span>
            <button onClick={copyLink} style={{ background: "#1a73e8", border: "none", borderRadius: 8, padding: "6px 14px", color: "#fff", cursor: "pointer", fontSize: 12, fontWeight: 600, whiteSpace: "nowrap" }}>
              {copied ? "✅ Copié" : "📋 Copier"}
            </button>
            <button onClick={() => setShowLink(false)} style={{ background: "rgba(255,255,255,.06)", border: "none", borderRadius: 8, padding: "6px 12px", color: "#9aa0a6", cursor: "pointer", fontSize: 12 }}>✕</button>
          </div>
        </div>
      )}

      {/* ── SETTINGS BAR ── */}
      {showSettings && (
        <div style={{ background: "#2d2f31", borderBottom: "1px solid rgba(255,255,255,.06)", padding: "10px 18px", flexShrink: 0 }}>
          <div style={{ display: "flex", gap: 20, alignItems: "center", flexWrap: "wrap" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <span style={{ color: "#9aa0a6", fontSize: 12 }}>🌍 Langue traduction:</span>
              <select value={transLang} onChange={e => setTransLang(e.target.value)}
                style={{ background: "rgba(255,255,255,.08)", border: "1px solid rgba(255,255,255,.12)", color: "#e8eaed", padding: "5px 8px", borderRadius: 8, fontSize: 12, cursor: "pointer", outline: "none" }}>
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
                <select value={subLang} onChange={e => setSubLang(e.target.value)}
                  style={{ background: "rgba(255,255,255,.08)", border: "1px solid rgba(255,255,255,.12)", color: "#e8eaed", padding: "5px 8px", borderRadius: 8, fontSize: 12, cursor: "pointer", outline: "none" }}>
                  <option value="fr">🇫🇷 FR</option>
                  <option value="ar">🇹🇳 AR</option>
                  <option value="en">🇬🇧 EN</option>
                </select>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── BODY (videos + panels) ── */}
      <div style={{ flex: 1, display: "flex", overflow: "hidden", gap: 8, padding: 8, minHeight: 0 }}>

        {/* VIDEO GRID */}
        <div style={{ flex: 1, display: "grid", gap: 8, alignContent: "center", overflow: "hidden", minWidth: 0, gridTemplateColumns: `repeat(${cols},1fr)` }}>

          {/* LOCAL TILE — always show */}
          {/* For guest: show avatar with mic indicator (no camera) */}
          {myRole === "host" ? (
            <VideoTile localRef={localVid} isLocal muted name={myName} role="host" videoOff={!videoOn} hand={false} />
          ) : (
            // Guest — show avatar, no camera
            <div style={{ position: "relative", background: "#1a1a1a", borderRadius: 12, overflow: "hidden", aspectRatio: "16/9", minHeight: 120 }}>
              <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", background: "radial-gradient(circle at 35% 30%, #2a2a2a, #111)", flexDirection: "column", gap: 8 }}>
                <div style={{ width: 64, height: 64, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 24, fontWeight: 700, color: "#fff", background: "linear-gradient(135deg,#34a853,#1a6e38)" }}>
                  {myName.split(" ").map(w => w[0]).join("").slice(0,2).toUpperCase()}
                </div>
                <span style={{ color: "#9aa0a6", fontSize: 11 }}>{audioOn ? "🎤 Micro actif" : "🔇 Micro coupé"}</span>
              </div>
              <div style={{ position: "absolute", bottom: 8, left: 8, display: "flex", gap: 5 }}>
                <span style={{ background: "rgba(0,0,0,.72)", color: "#fff", fontSize: 12, padding: "3px 8px", borderRadius: 6 }}>{myName} (Vous)</span>
              </div>
              {hand && <div style={{ position: "absolute", top: 8, left: 8, fontSize: 20, animation: "handWave .6s infinite" }}>✋</div>}
            </div>
          )}

          {/* REMOTE TILES */}
          {tilesToShow.map(p => (
            <VideoTile
              key={p.id}
              stream={p.stream}
              name={nameMap.current[p.id] || p.name || "Invité"}
              role={ptcps.find(x => x.socketId === p.id)?.role || roleMap.current[p.id] || "guest"}
              videoOff={pMedia[p.id]?.video === false}
              hand={pMedia[p.id]?.hand}
              screenSharing={pMedia[p.id]?.screenSharing}
              muted={false}
            />
          ))}
        </div>

        {/* ── CHAT PANEL ── */}
        {chatOpen && (
          <div style={{ width: 320, background: "#2d2f31", borderRadius: 12, border: "1px solid rgba(255,255,255,.06)", display: "flex", flexDirection: "column", overflow: "hidden", flexShrink: 0, animation: "slideIn .25s ease" }}>
            <div style={{ padding: "12px 14px", borderBottom: "1px solid rgba(255,255,255,.06)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span style={{ color: "#e8eaed", fontWeight: 700, fontSize: 13 }}>💬 Chat en direct</span>
              <button onClick={() => setChatOpen(false)} style={{ background: "none", border: "none", color: "#5f6368", cursor: "pointer", fontSize: 16 }}>✕</button>
            </div>
            <div style={{ flex: 1, overflowY: "auto", padding: 10, display: "flex", flexDirection: "column", gap: 8 }}>
              {msgs.length === 0 && (
                <div style={{ color: "#5f6368", textAlign: "center", padding: "32px 16px", fontSize: 13 }}>
                  <div style={{ fontSize: 36, marginBottom: 8 }}>💬</div>
                  Pas encore de messages…
                </div>
              )}
              {msgs.map(m => {
                const isMe = m.user === myName;
                return (
                  <div key={m.id} className="msg-bubble" style={{ alignSelf: isMe ? "flex-end" : "flex-start", maxWidth: "85%", animation: "fadeIn .2s ease" }}>
                    {!isMe && (
                      <div style={{ fontSize: 10, color: "#9aa0a6", marginBottom: 3, display: "flex", alignItems: "center", gap: 4 }}>
                        {m.role === "host" && <span style={{ background: "#1a73e8", color: "#fff", padding: "1px 5px", borderRadius: 4, fontSize: 9 }}>HOST</span>}
                        {m.user}
                      </div>
                    )}
                    <div style={{ padding: "8px 12px", borderRadius: 12, fontSize: 13, lineHeight: 1.6, wordBreak: "break-word", background: isMe ? "linear-gradient(135deg,#1a73e8,#0d47a1)" : "rgba(255,255,255,.08)" }}>
                      {m.text}
                    </div>
                    {translations[m.id] && (
                      <div style={{ padding: "6px 10px", borderRadius: 10, fontSize: 12, background: "rgba(52,168,83,.12)", border: "1px solid rgba(52,168,83,.2)", color: "#81c995", marginTop: 3, wordBreak: "break-word" }}>
                        🌍 {translations[m.id]}
                      </div>
                    )}
                    <div style={{ fontSize: 10, color: "#5f6368", marginTop: 2, display: "flex", gap: 8, alignItems: "center" }}>
                      <span>{m.time}</span>
                      {!isMe && (
                        <button onClick={() => handleTranslate(m.id, m.text)} disabled={translating[m.id]}
                          style={{ background: "none", border: "none", color: translating[m.id] ? "#5f6368" : "#8ab4f8", cursor: "pointer", fontSize: 10, padding: 0 }}>
                          {translating[m.id] ? "⏳ Traduction…" : "🌍 Traduire"}
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
              <div ref={chatEnd} />
            </div>
            {/* Input — ALL users can send messages */}
            <div style={{ display: "flex", gap: 6, padding: "8px 10px", borderTop: "1px solid rgba(255,255,255,.06)" }}>
              <input
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={e => e.key === "Enter" && !e.shiftKey && sendMsg()}
                placeholder="Écrire un message…"
                style={{ flex: 1, background: "rgba(255,255,255,.06)", border: "1px solid rgba(255,255,255,.1)", borderRadius: 20, padding: "8px 13px", color: "#e8eaed", fontSize: 13, outline: "none", fontFamily: "'Google Sans',sans-serif" }}
              />
              <button onClick={sendMsg} style={{ background: "#1a73e8", border: "none", borderRadius: "50%", width: 36, height: 36, color: "#fff", cursor: "pointer", fontSize: 14, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>➤</button>
            </div>
          </div>
        )}

        {/* ── PARTICIPANTS PANEL (admin only) ── */}
        {panelOpen && (
          <div style={{ width: 300, background: "#2d2f31", borderRadius: 12, border: "1px solid rgba(255,255,255,.06)", display: "flex", flexDirection: "column", overflow: "hidden", flexShrink: 0, animation: "slideIn .25s ease" }}>
            <div style={{ padding: "12px 14px", borderBottom: "1px solid rgba(255,255,255,.06)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span style={{ color: "#e8eaed", fontWeight: 700, fontSize: 13 }}>👥 Participants ({ptcps.length})</span>
              <button onClick={() => setPanelOpen(false)} style={{ background: "none", border: "none", color: "#5f6368", cursor: "pointer", fontSize: 16 }}>✕</button>
            </div>
            <div style={{ flex: 1, overflowY: "auto", padding: 8 }}>
              {ptcps.map(p => (
                <div key={p.socketId} style={{ display: "flex", alignItems: "center", gap: 8, padding: "8px 4px", borderBottom: "1px solid rgba(255,255,255,.04)" }}>
                  <div style={{ width: 34, height: 34, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 800, fontSize: 13, flexShrink: 0, background: p.role === "host" ? "linear-gradient(135deg,#1a73e8,#0d47a1)" : "linear-gradient(135deg,#34a853,#1a6e38)" }}>
                    {(p.userName || "?")[0].toUpperCase()}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ color: "#e8eaed", fontSize: 13, fontWeight: 600, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {p.userName} {p.role === "host" && "👑"}
                    </div>
                    <div style={{ color: "#9aa0a6", fontSize: 11, display: "flex", gap: 4, marginTop: 1 }}>
                      {p.audioOn === false && <span>🔇</span>}
                      {p.videoOn === false && <span>📷</span>}
                      {p.handRaised && <span title="Main levée">✋</span>}
                    </div>
                  </div>
                  {/* Admin controls — only visible to host */}
                  {myRole === "host" && p.socketId !== sockRef.current?.id && (
                    <div style={{ display: "flex", gap: 3 }}>
                      <button title="Couper micro" onClick={() => adminMute(p.socketId, "audio")}
                        style={{ background: "rgba(255,255,255,.06)", border: "1px solid rgba(255,255,255,.08)", borderRadius: 6, color: "#fbbc04", padding: "4px 7px", cursor: "pointer", fontSize: 12 }}>🔇</button>
                      <button title="Retirer" onClick={() => adminKick(p.socketId)}
                        style={{ background: "rgba(255,255,255,.06)", border: "1px solid rgba(255,255,255,.08)", borderRadius: 6, color: "#ea4335", padding: "4px 7px", cursor: "pointer", fontSize: 12 }}>✕</button>
                    </div>
                  )}
                </div>
              ))}
            </div>
            {myRole === "host" && (
              <div style={{ padding: 10, borderTop: "1px solid rgba(255,255,255,.06)" }}>
                <button onClick={muteAll} style={{ background: "rgba(234,67,53,.15)", border: "1px solid rgba(234,67,53,.3)", borderRadius: 8, color: "#ea4335", padding: "8px 12px", cursor: "pointer", fontWeight: 600, fontSize: 12, width: "100%" }}>
                  🔇 Couper tous les micros
                </button>
              </div>
            )}
          </div>
        )}

        {/* ── AI CONCLUSION PANEL ── */}
        {aiOpen && (
          <div style={{ width: 320, background: "#2d2f31", borderRadius: 12, border: "1px solid rgba(255,255,255,.06)", display: "flex", flexDirection: "column", overflow: "hidden", flexShrink: 0, animation: "slideIn .25s ease" }}>
            <div style={{ padding: "12px 14px", borderBottom: "1px solid rgba(255,255,255,.06)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span style={{ color: "#a8c7fa", fontWeight: 700, fontSize: 13 }}>✨ Conclusion IA</span>
              <button onClick={() => setAiOpen(false)} style={{ background: "none", border: "none", color: "#5f6368", cursor: "pointer", fontSize: 16 }}>✕</button>
            </div>
            <div style={{ flex: 1, overflowY: "auto", padding: 14 }}>
              {aiLoading ? (
                <div style={{ textAlign: "center", padding: "40px 20px" }}>
                  <div style={{ width: 44, height: 44, border: "3px solid rgba(255,255,255,.1)", borderTopColor: "#8ab4f8", borderRadius: "50%", animation: "spin .8s linear infinite", margin: "0 auto 16px" }} />
                  <p style={{ color: "#9aa0a6", fontSize: 13 }}>Analyse en cours…</p>
                </div>
              ) : aiResult ? (
                <div>
                  <div style={{ color: "#e8eaed", fontSize: 13, lineHeight: 1.8, whiteSpace: "pre-wrap" }}>{aiResult}</div>
                  <button onClick={() => { navigator.clipboard.writeText(aiResult); showToast("Conclusion copiée !", "#34a853", "📋"); }}
                    style={{ background: "#1a73e8", color: "#fff", border: "none", padding: "10px 16px", borderRadius: 10, cursor: "pointer", fontWeight: 700, fontSize: 12, width: "100%", marginTop: 12 }}>📋 Copier</button>
                  <button onClick={generateConclusion}
                    style={{ background: "rgba(255,255,255,.06)", border: "1px solid rgba(255,255,255,.12)", color: "#e8eaed", padding: "10px 16px", borderRadius: 10, cursor: "pointer", fontWeight: 600, fontSize: 12, width: "100%", marginTop: 6 }}>🔄 Regénérer</button>
                </div>
              ) : (
                <div style={{ textAlign: "center", padding: "20px 10px" }}>
                  <div style={{ fontSize: 52, marginBottom: 14 }}>🤖</div>
                  <p style={{ color: "#9aa0a6", fontSize: 13, marginBottom: 20, lineHeight: 1.7 }}>
                    L'IA va analyser la transcription vocale et le chat pour générer une conclusion professionnelle archivable.
                  </p>
                  <button onClick={generateConclusion}
                    style={{ background: "linear-gradient(135deg,#1a73e8,#0d47a1)", color: "#fff", border: "none", padding: "12px 20px", borderRadius: 12, cursor: "pointer", fontWeight: 700, fontSize: 13, width: "100%" }}>✨ Générer la conclusion</button>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* ── FLOATING REACTIONS ── */}
      <div style={{ position: "fixed", bottom: 100, left: "50%", transform: "translateX(-50%)", display: "flex", gap: 16, pointerEvents: "none", zIndex: 60 }}>
        {floats.map(f => (
          <div key={f.id} style={{ display: "flex", flexDirection: "column", alignItems: "center", animation: "floatUp 3s ease-out forwards" }}>
            <span style={{ fontSize: 36 }}>{f.emoji}</span>
            <span style={{ color: "#9aa0a6", fontSize: 10 }}>{f.n}</span>
          </div>
        ))}
      </div>

      {/* ── SUBTITLES ── */}
      {subs && subtitle && (
        <div style={{ position: "fixed", bottom: 88, left: "50%", transform: "translateX(-50%)", background: "rgba(0,0,0,.88)", color: "#fff", padding: "8px 20px", borderRadius: 10, maxWidth: "65%", textAlign: "center", fontSize: 14, zIndex: 50, border: "1px solid rgba(255,255,255,.08)", backdropFilter: "blur(8px)" }}>
          {subtitle}
        </div>
      )}

      {/* ── EMOJI BAR POPUP ── */}
      {emojiOpen && (
        <div style={{ position: "fixed", bottom: 90, left: "50%", transform: "translateX(-50%)", background: "#2d2f31", border: "1px solid rgba(255,255,255,.1)", borderRadius: 16, padding: "10px 14px", display: "flex", gap: 6, flexWrap: "wrap", zIndex: 70, boxShadow: "0 8px 32px rgba(0,0,0,.6)", animation: "popIn .2s ease", maxWidth: 280, justifyContent: "center" }}>
          {["👍", "❤️", "😂", "🎉", "🔥", "👏", "🙌", "💯", "😮", "🤔", "👎", "🌟"].map(e => (
            <button key={e} className="emoji-btn" onClick={() => sendReaction(e)}
              style={{ background: "none", border: "none", fontSize: 26, cursor: "pointer", borderRadius: 8, padding: "4px 6px", transition: "transform .15s" }}>{e}</button>
          ))}
        </div>
      )}

      {/* ── CONTROLS BAR ── */}
      <div style={{ background: "#2d2f31", padding: "10px 16px", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8, flexShrink: 0, flexWrap: "wrap", borderTop: "1px solid rgba(255,255,255,.05)" }}>

        {/* Left: mic + cam (cam only for host) */}
        <div style={{ display: "flex", gap: 6 }}>
          <Btn icon={audioOn ? "🎤" : "🔇"} label={audioOn ? "Micro" : "Muet"} onClick={toggleAudio} active={audioOn} />
          {myRole === "host" && (
            <Btn icon={videoOn ? "📷" : "🚫"} label={videoOn ? "Caméra" : "Off"} onClick={toggleVideo} active={videoOn} />
          )}
        </div>

        {/* Center: shared actions */}
        <div style={{ display: "flex", gap: 6 }}>
          {myRole === "host" && (
            <Btn icon="🖥️" label={screen ? "Arrêter" : "Partager"} onClick={toggleScreen} active={!screen} />
          )}
          {myRole === "guest" && (
            <Btn icon="✋" label={hand ? "Baisser" : "Main"} onClick={toggleHand} active={!hand} pulse={hand} />
          )}
          <Btn icon="😄" label="Réactions" onClick={() => setEmojiOpen(o => !o)} active />
          <Btn
            icon="💬" label="Chat"
            onClick={() => { setChatOpen(o => !o); setUnread(0); setPanelOpen(false); setAiOpen(false); }}
            active badge={unread}
          />
          {myRole === "host" && (
            <Btn icon="👥" label="Membres" onClick={() => { setPanelOpen(o => !o); setChatOpen(false); setAiOpen(false); }} active />
          )}
        </div>

        {/* Right: subtitles, AI conclusion, quit */}
        <div style={{ display: "flex", gap: 6 }}>
          <button onClick={() => setSubs(o => !o)} title="Sous-titres"
            style={{ border: "none", borderRadius: 12, padding: "10px 14px", color: "#fff", cursor: "pointer", display: "flex", flexDirection: "column", alignItems: "center", gap: 3, minWidth: 60, background: subs ? "#1a73e8" : "rgba(255,255,255,.1)", transition: "all .15s" }}>
            <span style={{ fontSize: 14, fontWeight: 800, fontFamily: "monospace" }}>CC</span>
            <span style={{ fontSize: 10, fontWeight: 600, opacity: .9 }}>Sous-titres</span>
          </button>
          {myRole === "host" && (
            <Btn icon="✨" label="Conclusion" onClick={() => { setAiOpen(o => !o); setChatOpen(false); setPanelOpen(false); }} active />
          )}
          <Btn icon="🚪" label="Quitter" onClick={() => { cleanup(); navigate(-1); }} danger />
        </div>
      </div>
    </div>
  );
}