import { useEffect, useRef, useState, useCallback } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import { io } from "socket.io-client";

const SOCKET_URL = import.meta.env.VITE_BACKEND_URL || "https://debat-jeune.onrender.com";
// ✅ FIX CORS: Ne JAMAIS appeler api.anthropic.com directement depuis le browser
// Toutes les requêtes IA passent par le backend
const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || "https://debat-jeune.onrender.com";

/* ─── CSS ─── */
const CSS = `
@import url('https://fonts.googleapis.com/css2?family=Google+Sans:wght@400;500;600;700&display=swap');
*,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
html,body{overflow:hidden}
:root{--font:'Google Sans',system-ui,sans-serif}
@keyframes spin{to{transform:rotate(360deg)}}
@keyframes floatUp{0%{opacity:1;transform:translateY(0)scale(1)}100%{opacity:0;transform:translateY(-80px)scale(1.5)}}
@keyframes fadeIn{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:translateY(0)}}
@keyframes slideIn{from{opacity:0;transform:translateX(20px)}to{opacity:1;transform:translateX(0)}}
@keyframes popIn{from{transform:scale(.85);opacity:0}to{transform:scale(1);opacity:1}}
@keyframes toastIn{from{opacity:0;transform:translateX(-50%)translateY(-10px)}to{opacity:1;transform:translateX(-50%)translateY(0)}}
@keyframes handWave{0%,100%{transform:rotate(0)}25%{transform:rotate(20deg)}75%{transform:rotate(-10deg)}}
@keyframes blink{0%,100%{opacity:1}50%{opacity:.3}}
@keyframes pulse{0%,100%{transform:scale(1)}50%{transform:scale(1.05)}}
.cbtn{transition:all .15s;cursor:pointer}
.cbtn:hover{filter:brightness(1.15);transform:scale(1.04)}
.ebtn:hover{transform:scale(1.25)}
::-webkit-scrollbar{width:4px}
::-webkit-scrollbar-thumb{background:rgba(255,255,255,.18);border-radius:4px}
video{background:#000}
`;

/* ─── ICE Servers ─── */
const ICE_SERVERS = [
  { urls: "stun:stun.l.google.com:19302" },
  { urls: "stun:stun1.l.google.com:19302" },
  { urls: "stun:stun2.l.google.com:19302" },
  {
    urls: "turn:openrelay.metered.ca:80",
    username: "openrelayproject",
    credential: "openrelayproject",
  },
  {
    urls: "turn:openrelay.metered.ca:443",
    username: "openrelayproject",
    credential: "openrelayproject",
  },
];

/* ══ SUBTITLES HOOK ══ */
function useSubtitles(on) {
  const [live, setLive] = useState("");
  const [saved, setSaved] = useState([]);
  useEffect(() => {
    if (!on) { setLive(""); return; }
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) return;
    const r = new SR();
    r.continuous = true; r.interimResults = true;
    r.lang = "fr-FR";
    r.onresult = e => {
      setLive(Array.from(e.results).map(x => x[0].transcript).join(" "));
      const finals = Array.from(e.results).filter(r => r.isFinal).map(r => r[0].transcript);
      if (finals.length) setSaved(p => [...p, ...finals]);
    };
    r.onerror = () => {};
    r.start();
    return () => { try { r.stop(); } catch {} };
  }, [on]);
  return { live, saved };
}

/* ══ VIDEO TILE ══ */
function Tile({ stream, muted = false, name = "?", role = "guest", camOff = false,
  hand = false, isLocal = false, localRef, screenShare = false, micOn = true }) {

  const ownRef = useRef(null);
  const vRef = isLocal ? localRef : ownRef;

  useEffect(() => {
    const el = vRef?.current;
    if (!el || !stream) return;
    if (el.srcObject !== stream) {
      el.srcObject = stream;
      el.play().catch(() => {});
    }
  }, [stream]);

  const init = (name || "?").split(" ").map(w => w[0]).join("").slice(0, 2).toUpperCase();
  const isHost = role === "host";
  const showCam = isLocal ? !camOff : (!camOff && !!stream);

  return (
    <div style={{
      position: "relative", background: "#111", borderRadius: 14, overflow: "hidden",
      aspectRatio: "16/9", minHeight: 110,
      boxShadow: hand ? "0 0 0 3px #fbbc04,0 4px 20px rgba(251,188,4,.2)"
        : isHost ? "0 0 0 2px rgba(26,115,232,.5)"
          : "0 2px 12px rgba(0,0,0,.4)"
    }}>
      <video ref={vRef} autoPlay playsInline muted={muted}
        style={{
          width: "100%", height: "100%", objectFit: "cover",
          display: (isLocal && !camOff) || showCam ? "block" : "none"
        }} />

      {((isLocal && camOff) || (!isLocal && !showCam)) && (
        <div style={{
          position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center",
          background: "radial-gradient(circle at 35% 30%,#222,#0d0d0d)"
        }}>
          <div style={{
            width: 68, height: 68, borderRadius: "50%", fontSize: 24, fontWeight: 800, color: "#fff",
            display: "flex", alignItems: "center", justifyContent: "center",
            background: isHost ? "linear-gradient(135deg,#1a73e8,#0d47a1)" : "linear-gradient(135deg,#34a853,#1a6e38)",
            boxShadow: "0 6px 24px rgba(0,0,0,.5)"
          }}>{init}</div>
        </div>
      )}

      <div style={{ position: "absolute", bottom: 8, left: 8, display: "flex", gap: 5, alignItems: "center", flexWrap: "wrap" }}>
        {isHost && <span style={{ background: "rgba(26,115,232,.9)", color: "#fff", fontSize: 9, fontWeight: 800, padding: "2px 8px", borderRadius: 20 }}>👑 HOST</span>}
        {screenShare && <span style={{ background: "rgba(52,168,83,.9)", color: "#fff", fontSize: 9, padding: "2px 8px", borderRadius: 8 }}>🖥️ Écran</span>}
        <span style={{ background: "rgba(0,0,0,.75)", backdropFilter: "blur(4px)", color: "#fff", fontSize: 12, padding: "3px 9px", borderRadius: 7 }}>
          {isLocal ? `${name} (Vous)` : name}
        </span>
        {!micOn && <span style={{ background: "rgba(234,67,53,.85)", color: "#fff", fontSize: 9, padding: "2px 6px", borderRadius: 6 }}>🔇</span>}
      </div>

      {hand && <div style={{ position: "absolute", top: 8, left: 8, fontSize: 22, animation: "handWave .7s infinite" }}>✋</div>}
    </div>
  );
}

/* ══ CONTROL BUTTON ══ */
function Btn({ icon, label, onClick, active = true, danger = false, badge = 0, pulse = false, disabled = false }) {
  return (
    <button className="cbtn" onClick={onClick} title={label} disabled={disabled} style={{
      border: "none", borderRadius: 13, padding: "10px 15px", color: "#fff",
      display: "flex", flexDirection: "column", alignItems: "center", gap: 3, minWidth: 62,
      background: danger ? "#ea4335" : !active ? "#ea4335" : "rgba(255,255,255,.1)",
      animation: pulse ? "blink 1.4s infinite" : "none",
      position: "relative", opacity: disabled ? .5 : 1
    }}>
      <span style={{ fontSize: 20 }}>{icon}</span>
      <span style={{ fontSize: 10, fontWeight: 600, opacity: .9, whiteSpace: "nowrap" }}>{label}</span>
      {badge > 0 && <span style={{
        position: "absolute", top: -5, right: -5, background: "#ea4335", color: "#fff",
        borderRadius: "50%", width: 18, height: 18, display: "flex", alignItems: "center",
        justifyContent: "center", fontSize: 10, fontWeight: 800
      }}>{badge > 99 ? "99+" : badge}</span>}
    </button>
  );
}

/* ══════════════════════════════════════════
   MAIN COMPONENT
══════════════════════════════════════════ */
export default function MeetRoom() {
  const { roomCode } = useParams();
  const [sp] = useSearchParams();
  const navigate = useNavigate();

  const atToken = sp.get("at");
  const vtToken = sp.get("vt");
  const token = atToken || vtToken || "";
  const myRole = atToken ? "host" : "guest";

  const stored = (() => { try { return JSON.parse(localStorage.getItem("user") || "{}"); } catch { return {}; } })();
  const myName = stored?.prenom_user
    ? `${stored.prenom_user} ${stored.nom_user || ""}`.trim()
    : stored?.name || (myRole === "host" ? "Admin" : "Participant");

  /* ─── State ─── */
  const [status, setStatus] = useState("loading");
  const [errMsg, setErrMsg] = useState("");
  // ✅ FIX: host a mic et cam ON par défaut, guest a mic OFF
  const [micOn, setMicOn] = useState(myRole === "host");
  const [camOn, setCamOn] = useState(myRole === "host");
  const [hand, setHand] = useState(false);
  const [screenOn, setScreenOn] = useState(false);
  const [subsOn, setSubsOn] = useState(false);
  const [chatOpen, setChatOpen] = useState(false);
  const [partOpen, setPartOpen] = useState(false);
  const [aiOpen, setAiOpen] = useState(false);
  const [emojiOpen, setEmojiOpen] = useState(false);
  const [linkOpen, setLinkOpen] = useState(false);
  const [msgs, setMsgs] = useState([]);
  const [chatInput, setChatInput] = useState("");
  const [unread, setUnread] = useState(0);
  const [peers, setPeers] = useState([]);
  const [pState, setPState] = useState({});
  const [ptcps, setPtcps] = useState([]);
  const [floats, setFloats] = useState([]);
  const [toast, setToast] = useState(null);
  const [duration, setDuration] = useState(0);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiText, setAiText] = useState("");
  const [kickTarget, setKickTarget] = useState(null);
  const [copied, setCopied] = useState(false);
  const [mediaError, setMediaError] = useState("");
  const [permissionDenied, setPermissionDenied] = useState(false);

  /* ─── Refs ─── */
  const sockRef = useRef(null);
  const localVid = useRef(null);
  const localStr = useRef(null);
  const screenStr = useRef(null);
  const pcMap = useRef({});
  const nameMap = useRef({});
  const roleMap = useRef({});
  const chatEnd = useRef(null);
  const timerRef = useRef(null);
  const localStreamRef = useRef(null);

  const { live: subtitle, saved: transcript } = useSubtitles(subsOn);

  const viewerLink = myRole === "host"
    ? (localStorage.getItem("currentLiveViewerLink") || "")
    : window.location.href;

  /* ─── Toast ─── */
  const showToast = useCallback((msg, color = "#1a73e8", icon = "") => {
    setToast({ msg, color, icon });
    setTimeout(() => setToast(null), 3600);
  }, []);

  const fmt = s => {
    const h = Math.floor(s / 3600), m = Math.floor((s % 3600) / 60), x = s % 60;
    return h ? `${h}:${String(m).padStart(2, "0")}:${String(x).padStart(2, "0")}`
      : `${String(m).padStart(2, "0")}:${String(x).padStart(2, "0")}`;
  };

  useEffect(() => {
    timerRef.current = setInterval(() => setDuration(d => d + 1), 1000);
    return () => clearInterval(timerRef.current);
  }, []);

  /* ✅ FIX: assigner le stream local à la vidéo */
  const assignLocalVideo = useCallback((stream) => {
    localStr.current = stream;
    localStreamRef.current = stream;
    const tryAssign = () => {
      if (localVid.current) {
        localVid.current.srcObject = stream;
        localVid.current.play().catch(() => {});
        return true;
      }
      return false;
    };
    if (!tryAssign()) {
      const timer = setInterval(() => { if (tryAssign()) clearInterval(timer); }, 50);
      setTimeout(() => clearInterval(timer), 5000);
    }
  }, []);

  /* ─── WebRTC createPeer ─── */
  const createPeer = useCallback((sid) => {
    const pc = new RTCPeerConnection({ iceServers: ICE_SERVERS });

    pc.onicecandidate = e => {
      if (e.candidate) sockRef.current?.emit("ice-candidate", { target: sid, candidate: e.candidate });
    };

    pc.oniceconnectionstatechange = () => {
      if (pc.iceConnectionState === "failed") pc.restartIce();
    };

    pc.ontrack = e => {
      const stream = e.streams[0];
      if (!stream) return;
      setPeers(prev => {
        const existing = prev.find(p => p.id === sid);
        if (existing) return prev.map(p => p.id === sid ? { ...p, stream } : p);
        return [...prev, { id: sid, stream, name: nameMap.current[sid] || "Invité", role: roleMap.current[sid] || "guest" }];
      });
    };

    const stream = localStreamRef.current;
    if (stream) stream.getTracks().forEach(t => { try { pc.addTrack(t, stream); } catch {} });

    return pc;
  }, []);

  /* ═══════════════════════════════════════════════
     INIT: Media + Socket
  ═══════════════════════════════════════════════ */
  useEffect(() => {
    if (!token) { setErrMsg("Token d'accès manquant."); setStatus("error"); return; }
    let alive = true;

    (async () => {
      /* ── 1. Accès média ── */
      if (myRole === "host") {
        // ✅ FIX CRITIQUE: demander explicitement les permissions camera+mic
        // Le navigateur doit avoir accordé les permissions sur ce domaine
        let mediaStream = null;

        // Tentative 1: vidéo HD + audio
        try {
          mediaStream = await navigator.mediaDevices.getUserMedia({
            video: {
              width: { ideal: 1280, min: 320 },
              height: { ideal: 720, min: 240 },
              facingMode: "user",
              frameRate: { ideal: 30 }
            },
            audio: {
              echoCancellation: true,
              noiseSuppression: true,
              autoGainControl: true,
              sampleRate: 48000
            }
          });
        } catch (err1) {
          console.warn("HD getUserMedia failed:", err1.name);

          // Tentative 2: contraintes minimales
          try {
            mediaStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
          } catch (err2) {
            console.warn("Basic getUserMedia failed:", err2.name);

            // Tentative 3: audio seulement
            try {
              mediaStream = await navigator.mediaDevices.getUserMedia({ video: false, audio: true });
              setCamOn(false);
              setMediaError("Caméra non disponible — micro seulement");
            } catch (err3) {
              console.error("All media failed:", err3.name, err3.message);
              setPermissionDenied(true);
              setMediaError(`Permissions refusées (${err3.name}). Cliquez sur l'icône 🔒 dans la barre d'adresse et autorisez Caméra + Micro.`);
              setMicOn(false);
              setCamOn(false);
            }
          }
        }

        if (!alive) { mediaStream?.getTracks().forEach(t => t.stop()); return; }

        if (mediaStream) {
          assignLocalVideo(mediaStream);
          // S'assurer que les tracks sont activés
          mediaStream.getAudioTracks().forEach(t => { t.enabled = true; });
          mediaStream.getVideoTracks().forEach(t => { t.enabled = true; });
        }
      } else {
        /* Jeune: seulement audio muet par défaut */
        try {
          const s = await navigator.mediaDevices.getUserMedia({
            video: false,
            audio: { echoCancellation: true, noiseSuppression: true }
          });
          if (!alive) { s.getTracks().forEach(t => t.stop()); return; }
          s.getAudioTracks().forEach(t => { t.enabled = false; }); // muet par défaut
          localStr.current = s;
          localStreamRef.current = s;
        } catch {
          setMicOn(false);
        }
      }

      setStatus("ok");

      /* ── 2. Socket.IO ── */
      const sock = io(SOCKET_URL, {
        transports: ["websocket"],
        reconnection: true,
        reconnectionAttempts: 10,
        reconnectionDelay: 2000,
      });
      sockRef.current = sock;

      sock.on("connect", () => {
        sock.emit("join-room", { roomCode, userName: myName, role: myRole, accessToken: token }, (ack) => {
          if (ack && !ack.ok) { setErrMsg(ack.message || "Accès refusé."); setStatus("error"); }
        });
      });

      sock.on("connect_error", (err) => console.error("Socket error:", err.message));

      /* ── Signaling WebRTC ── */
      sock.on("all-users", async users => {
        for (const u of users) {
          if (u.socketId === sock.id) continue;
          nameMap.current[u.socketId] = u.userName;
          roleMap.current[u.socketId] = u.role;
          const pc = createPeer(u.socketId);
          pcMap.current[u.socketId] = pc;
          try {
            const offer = await pc.createOffer();
            await pc.setLocalDescription(offer);
            sock.emit("offer", { target: u.socketId, sdp: offer });
          } catch {}
        }
      });

      sock.on("user-joined", ({ socketId, userName: n, role }) => {
        nameMap.current[socketId] = n;
        roleMap.current[socketId] = role;
        showToast(`👋 ${n} a rejoint`, "#34a853");
      });

      sock.on("offer", async ({ caller, sdp }) => {
        let pc = pcMap.current[caller];
        if (!pc) { pc = createPeer(caller); pcMap.current[caller] = pc; }
        try {
          await pc.setRemoteDescription(new RTCSessionDescription(sdp));
          const ans = await pc.createAnswer();
          await pc.setLocalDescription(ans);
          sock.emit("answer", { target: caller, sdp: ans });
        } catch {}
      });

      sock.on("answer", async ({ responder, sdp }) => {
        try { await pcMap.current[responder]?.setRemoteDescription(new RTCSessionDescription(sdp)); } catch {}
      });

      sock.on("ice-candidate", async ({ from, candidate }) => {
        try { await pcMap.current[from]?.addIceCandidate(new RTCIceCandidate(candidate)); } catch {}
      });

      sock.on("user-left", ({ socketId }) => {
        const n = nameMap.current[socketId];
        if (n) showToast(`${n} a quitté`, "#5f6368");
        pcMap.current[socketId]?.close();
        delete pcMap.current[socketId];
        setPeers(prev => prev.filter(p => p.id !== socketId));
      });

      sock.on("user-media-toggled", ({ socketId, type, enabled }) => {
        setPState(prev => ({ ...prev, [socketId]: { ...prev[socketId], [type]: enabled } }));
      });

      sock.on("participants-update", list => setPtcps(list || []));

      sock.on("receive-message", msg => {
        setMsgs(prev => [...prev, { ...msg, id: Date.now() + Math.random() }]);
        setChatOpen(o => { if (!o) setUnread(n => n + 1); return o; });
      });

      sock.on("reaction", ({ userName: n, emoji }) => {
        const id = Date.now() + Math.random();
        setFloats(prev => [...prev, { id, n, emoji }]);
        setTimeout(() => setFloats(prev => prev.filter(f => f.id !== id)), 3000);
      });

      sock.on("hand-raised", ({ socketId, userName: n, raised }) => {
        setPState(prev => ({ ...prev, [socketId]: { ...prev[socketId], hand: raised } }));
        if (raised && myRole === "host") showToast(`✋ ${n} lève la main`, "#fbbc04");
      });

      sock.on("force-mute", ({ type }) => {
        const trk = type === "audio"
          ? localStr.current?.getAudioTracks()[0]
          : localStr.current?.getVideoTracks()[0];
        if (trk) trk.enabled = false;
        if (type === "audio") setMicOn(false);
        else setCamOn(false);
        showToast(`Hôte a coupé votre ${type === "audio" ? "micro" : "caméra"}`, "#ea4335", "🔇");
      });

      sock.on("force-kicked", () => {
        alert("Vous avez été retiré de la session.");
        cleanup(); navigate(-1);
      });

      sock.on("live-ended", () => {
        alert("Le live est terminé.");
        cleanup(); navigate(-1);
      });

      sock.on("screen-share-started", ({ socketId }) =>
        setPState(prev => ({ ...prev, [socketId]: { ...prev[socketId], screen: true } })));
      sock.on("screen-share-stopped", ({ socketId }) =>
        setPState(prev => ({ ...prev, [socketId]: { ...prev[socketId], screen: false } })));

      sock.on("mic-allowed", ({ targetSocketId }) => {
        if (targetSocketId === sock.id) showToast("L'hôte vous autorise à parler", "#34a853", "🎤");
      });

      // ✅ FIX: allow-mic event
      sock.on("allow-mic", ({ targetSocketId }) => {
        if (targetSocketId === sock.id) {
          const audioTrack = localStr.current?.getAudioTracks()[0];
          if (audioTrack) { audioTrack.enabled = true; setMicOn(true); }
          showToast("L'hôte vous autorise à parler", "#34a853", "🎤");
        }
      });
    })();

    return () => { alive = false; cleanup(); };
  }, [roomCode, token]);

  useEffect(() => { chatEnd.current?.scrollIntoView({ behavior: "smooth" }); }, [msgs]);

  /* ── Actions ── */
  const cleanup = () => {
    clearInterval(timerRef.current);
    sockRef.current?.emit("leave-room");
    sockRef.current?.disconnect();
    Object.values(pcMap.current).forEach(pc => pc.close());
    pcMap.current = {};
    localStr.current?.getTracks().forEach(t => t.stop());
    screenStr.current?.getTracks().forEach(t => t.stop());
  };

  const emit = (ev, d) => sockRef.current?.emit(ev, d);

  /* ✅ FIX: toggleMic */
  const toggleMic = () => {
    const tracks = localStr.current?.getAudioTracks();
    if (!tracks?.length) {
      showToast("Micro non disponible — vérifiez les permissions", "#ea4335", "🔇");
      return;
    }
    const newState = !micOn;
    tracks.forEach(t => { t.enabled = newState; });
    setMicOn(newState);
    emit("toggle-media", { roomCode, type: "audio", enabled: newState });
  };

  /* ✅ FIX: toggleCam réassigne srcObject */
  const toggleCam = () => {
    if (myRole !== "host") return;
    const tracks = localStr.current?.getVideoTracks();
    if (!tracks?.length) {
      showToast("Caméra non disponible", "#ea4335", "📷");
      return;
    }
    const newState = !camOn;
    tracks.forEach(t => { t.enabled = newState; });
    setCamOn(newState);
    emit("toggle-media", { roomCode, type: "video", enabled: newState });
    if (newState && localVid.current && localStr.current) {
      setTimeout(() => {
        if (localVid.current) {
          localVid.current.srcObject = localStr.current;
          localVid.current.play().catch(() => {});
        }
      }, 100);
    }
  };

  const toggleHand = () => {
    if (myRole === "host") return;
    const r = !hand; setHand(r);
    emit("raise-hand", { roomCode, raised: r });
    r ? showToast("Main levée — hôte notifié", "#fbbc04", "✋") : showToast("Main baissée", "#5f6368");
  };

  const toggleScreen = async () => {
    if (myRole !== "host") { showToast("Seul l'hôte peut partager l'écran", "#fbbc04"); return; }
    if (screenOn) {
      screenStr.current?.getTracks().forEach(t => t.stop());
      screenStr.current = null;
      setScreenOn(false);
      emit("screen-share-stopped", { roomCode });
      const cam = localStr.current?.getVideoTracks()[0];
      Object.values(pcMap.current).forEach(pc => {
        const s = pc.getSenders().find(s => s.track?.kind === "video");
        if (s && cam) s.replaceTrack(cam);
      });
    } else {
      try {
        const ss = await navigator.mediaDevices.getDisplayMedia({ video: true, audio: true });
        screenStr.current = ss;
        const trk = ss.getVideoTracks()[0];
        Object.values(pcMap.current).forEach(pc => {
          const s = pc.getSenders().find(s => s.track?.kind === "video");
          if (s) s.replaceTrack(trk);
        });
        trk.onended = toggleScreen;
        setScreenOn(true);
        emit("screen-share-started", { roomCode });
        showToast("Écran partagé — visible par tous", "#34a853", "🖥️");
      } catch { showToast("Partage annulé", "#5f6368"); }
    }
  };

  const sendReaction = emoji => {
    emit("send-reaction", { roomCode, emoji });
    const id = Date.now();
    setFloats(prev => [...prev, { id, n: "Vous", emoji }]);
    setTimeout(() => setFloats(prev => prev.filter(f => f.id !== id)), 3000);
    setEmojiOpen(false);
  };

  const sendMsg = () => {
    if (!chatInput.trim()) return;
    emit("send-message", { roomCode, message: chatInput });
    setChatInput("");
  };

  const copyViewerLink = async () => {
    const link = myRole === "host"
      ? (localStorage.getItem("currentLiveViewerLink") || "")
      : window.location.href;
    if (!link) { showToast("Aucun lien disponible", "#ea4335", "❌"); return; }
    await navigator.clipboard.writeText(link).catch(() => {});
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
    showToast("✅ Lien copié !", "#34a853");
  };

  const adminMute = (sid, type) => {
    if (myRole !== "host") return;
    emit("admin-mute", { roomCode, targetSocketId: sid, type });
    showToast("Micro coupé", "#fbbc04", "🔇");
  };

  const adminAllowMic = (sid) => {
    if (myRole !== "host") return;
    emit("allow-mic", { roomCode, targetSocketId: sid });
    showToast("Micro autorisé", "#34a853", "🎤");
  };

  const adminKick = sid => { if (myRole !== "host") return; setKickTarget(sid); };

  const confirmKick = () => {
    if (!kickTarget) return;
    emit("admin-kick", { roomCode, targetSocketId: kickTarget });
    setKickTarget(null);
    showToast("Participant retiré", "#ea4335", "🚪");
  };

  const muteAll = () => {
    ptcps.filter(p => p.socketId !== sockRef.current?.id && p.role !== "host")
      .forEach(p => adminMute(p.socketId, "audio"));
    showToast("Tous les micros coupés", "#fbbc04", "🔇");
  };

  /* ✅ FIX CORS: Appeler l'IA via le backend, PAS directement api.anthropic.com */
  const genConclusion = async () => {
    setAiLoading(true);
    try {
      const chat = msgs.map(m => `${m.user}: ${m.text}`).join("\n");
      const res = await fetch(`${BACKEND_URL}/api/chatbot`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${localStorage.getItem("token") || ""}`
        },
        body: JSON.stringify({
          message: `Résume cette réunion "${roomCode}":\nTranscription: ${transcript.join(" ") || "(aucune)"}\nChat:\n${chat || "(aucun)"}\nParticipants: ${ptcps.length}, Durée: ${fmt(duration)}\n\nConclusion professionnelle avec: 📋 Points principaux, 💡 Idées clés, ✅ Consensus, 🎯 Actions.`
        })
      });
      const d = await res.json();
      setAiText(d.reply || d.message || d.content || "Erreur de génération.");
    } catch (e) {
      setAiText("Erreur connexion — vérifiez votre connexion.");
      console.error("Chatbot error:", e);
    }
    setAiLoading(false);
  };

  /* ─── Grid layout ─── */
  // ✅ Jeune voit UNIQUEMENT le tile host (flux vidéo de l'admin)
  const hostPeer = peers.find(p =>
    (ptcps.find(x => x.socketId === p.id)?.role || roleMap.current[p.id]) === "host"
  );
  const visiblePeers = myRole === "host" ? peers : (hostPeer ? [hostPeer] : []);
  const gridCount = 1 + visiblePeers.length;
  const cols = gridCount <= 1 ? 1 : gridCount <= 4 ? 2 : gridCount <= 9 ? 3 : 4;

  /* ─── Loading / Error states ─── */
  if (status === "loading") return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "#202124", fontFamily: "var(--font)" }}>
      <style>{CSS}</style>
      <div style={{ textAlign: "center" }}>
        <div style={{ width: 48, height: 48, border: "3px solid rgba(255,255,255,.1)", borderTopColor: "#8ab4f8", borderRadius: "50%", animation: "spin .8s linear infinite", margin: "0 auto 16px" }} />
        <p style={{ color: "#9aa0a6", fontSize: 14 }}>Connexion à la salle…</p>
        <p style={{ color: "#5f6368", fontSize: 11, marginTop: 8 }}>Autoriser Caméra + Micro dans la fenêtre du navigateur</p>
      </div>
    </div>
  );

  if (status === "error") return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "#202124", fontFamily: "var(--font)" }}>
      <style>{CSS}</style>
      <div style={{ background: "#2d2f31", border: "1px solid rgba(255,255,255,.08)", borderRadius: 20, padding: 48, textAlign: "center", maxWidth: 420 }}>
        <div style={{ fontSize: 54, marginBottom: 16 }}>🔒</div>
        <p style={{ color: "#e8eaed", fontWeight: 700, fontSize: 18, marginBottom: 8 }}>Accès refusé</p>
        <p style={{ color: "#9aa0a6", fontSize: 14, marginBottom: 24, lineHeight: 1.6 }}>{errMsg}</p>
        <button onClick={() => navigate(-1)} style={{ background: "#1a73e8", color: "#fff", border: "none", padding: "11px 28px", borderRadius: 10, cursor: "pointer", fontWeight: 700 }}>← Retour</button>
      </div>
    </div>
  );

  /* ════════════════════════ MAIN UI ════════════════════════ */
  return (
    <div style={{ height: "100vh", display: "flex", flexDirection: "column", background: "#202124", fontFamily: "var(--font)", color: "#fff", overflow: "hidden" }}>
      <style>{CSS}</style>

      {/* TOAST */}
      {toast && (
        <div style={{ position: "fixed", top: 18, left: "50%", transform: "translateX(-50%)", background: toast.color, color: "#fff", padding: "10px 22px", borderRadius: 24, fontSize: 13, fontWeight: 600, zIndex: 9999, boxShadow: "0 4px 24px rgba(0,0,0,.5)", display: "flex", alignItems: "center", gap: 6, whiteSpace: "nowrap", animation: "toastIn .3s ease" }}>
          {toast.icon && <span>{toast.icon}</span>}{toast.msg}
        </div>
      )}

      {/* ✅ PERMISSION DENIED BANNER */}
      {permissionDenied && (
        <div style={{ background: "rgba(234,67,53,.2)", borderBottom: "2px solid rgba(234,67,53,.5)", padding: "12px 20px", color: "#ea4335", fontSize: 13, textAlign: "center", lineHeight: 1.5 }}>
          🔒 <strong>Accès Caméra/Micro refusé</strong> — Cliquez sur l'icône 🔒 dans la barre d'adresse → Autorisez Caméra et Microphone → Rechargez la page
        </div>
      )}

      {/* MEDIA ERROR Banner */}
      {mediaError && !permissionDenied && (
        <div style={{ background: "rgba(234,67,53,.15)", borderBottom: "1px solid rgba(234,67,53,.3)", padding: "8px 20px", color: "#ea4335", fontSize: 12, textAlign: "center" }}>
          ⚠️ {mediaError}
        </div>
      )}

      {/* KICK MODAL */}
      {kickTarget && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,.75)", backdropFilter: "blur(8px)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000 }}>
          <div style={{ background: "#2d2f31", border: "1px solid rgba(255,255,255,.08)", borderRadius: 20, padding: 44, textAlign: "center", animation: "popIn .3s ease", maxWidth: 360, width: "90%" }}>
            <div style={{ fontSize: 46, marginBottom: 14 }}>⚠️</div>
            <p style={{ color: "#e8eaed", fontWeight: 700, fontSize: 16, marginBottom: 8 }}>Retirer ce participant ?</p>
            <p style={{ color: "#9aa0a6", fontSize: 13, marginBottom: 26 }}>Il sera exclu immédiatement de la session.</p>
            <div style={{ display: "flex", gap: 10, justifyContent: "center" }}>
              <button onClick={() => setKickTarget(null)} style={{ background: "rgba(255,255,255,.08)", border: "1px solid rgba(255,255,255,.12)", borderRadius: 10, padding: "10px 24px", color: "#e8eaed", cursor: "pointer", fontWeight: 600 }}>Annuler</button>
              <button onClick={confirmKick} style={{ background: "#ea4335", border: "none", borderRadius: 10, padding: "10px 24px", color: "#fff", cursor: "pointer", fontWeight: 700 }}>🚪 Retirer</button>
            </div>
          </div>
        </div>
      )}

      {/* ═══ HEADER ═══ */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "10px 20px", background: "#2d2f31", flexShrink: 0, borderBottom: "1px solid rgba(255,255,255,.06)" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div style={{ width: 34, height: 34, borderRadius: 10, background: "linear-gradient(135deg,#1a73e8,#0d47a1)", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 900, fontSize: 16 }}>S</div>
          <div>
            <div style={{ color: "#e8eaed", fontWeight: 700, fontSize: 14 }}>Swafy Meet</div>
            <div style={{ color: "#9aa0a6", fontSize: 11, display: "flex", gap: 6, alignItems: "center" }}>
              <span style={{ width: 7, height: 7, borderRadius: "50%", background: "#ea4335", display: "inline-block", animation: "blink 2s infinite" }} />
              {roomCode} · {myRole === "host" ? "👑 Hôte" : "👤 Participant"} · ⏱ {fmt(duration)}
            </div>
          </div>
        </div>
        <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
          <span style={{ background: "rgba(255,255,255,.07)", color: "#9aa0a6", padding: "4px 10px", borderRadius: 20, fontSize: 12 }}>{ptcps.length} 👥</span>
          {myRole === "host" && (
            <button className="cbtn" onClick={() => setLinkOpen(o => !o)}
              style={{ background: "rgba(255,255,255,.06)", border: "1px solid rgba(255,255,255,.1)", color: "#e8eaed", padding: "6px 14px", borderRadius: 8, fontSize: 12, fontWeight: 500 }}>
              🔗 Inviter les jeunes
            </button>
          )}
        </div>
      </div>

      {/* ═══ LINK BAR (host) ═══ */}
      {linkOpen && myRole === "host" && (
        <div style={{ background: "#2d2f31", borderBottom: "1px solid rgba(255,255,255,.06)", padding: "10px 18px", flexShrink: 0, animation: "fadeIn .2s ease" }}>
          <p style={{ color: "#9aa0a6", fontSize: 11, marginBottom: 6 }}>🔗 Lien à envoyer aux jeunes pour rejoindre le live :</p>
          <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
            <span style={{ flex: 1, color: "#8ab4f8", fontSize: 12, wordBreak: "break-all", background: "rgba(138,180,248,.08)", padding: "7px 12px", borderRadius: 8, fontFamily: "monospace" }}>
              {localStorage.getItem("currentLiveViewerLink") || "Aucun lien — créez d'abord un live"}
            </span>
            {localStorage.getItem("currentLiveViewerLink") && (
              <button onClick={copyViewerLink}
                style={{ background: "#1a73e8", border: "none", borderRadius: 8, padding: "7px 16px", color: "#fff", cursor: "pointer", fontSize: 12, fontWeight: 700, whiteSpace: "nowrap", flexShrink: 0 }}>
                {copied ? "✅ Copié !" : "📋 Copier"}
              </button>
            )}
            <button onClick={() => setLinkOpen(false)}
              style={{ background: "rgba(255,255,255,.06)", border: "none", borderRadius: 8, padding: "7px 11px", color: "#9aa0a6", cursor: "pointer", flexShrink: 0 }}>✕</button>
          </div>
        </div>
      )}

      {/* ═══ BODY ═══ */}
      <div style={{ flex: 1, display: "flex", overflow: "hidden", gap: 8, padding: 8, minHeight: 0 }}>

        {/* VIDEO GRID */}
        <div style={{ flex: 1, display: "grid", gap: 8, alignContent: "center", overflow: "hidden", minWidth: 0, gridTemplateColumns: `repeat(${cols},1fr)` }}>

          {/* LOCAL TILE - Admin */}
          {myRole === "host" ? (
            <Tile localRef={localVid} isLocal muted name={myName} role="host" camOff={!camOn} micOn={micOn} />
          ) : (
            /* Jeune local: avatar */
            <div style={{ position: "relative", background: "#111", borderRadius: 14, overflow: "hidden", aspectRatio: "16/9", minHeight: 110 }}>
              <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", flexDirection: "column", gap: 10, background: "radial-gradient(circle at 35% 30%,#1e1e1e,#0d0d0d)" }}>
                <div style={{ width: 68, height: 68, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 24, fontWeight: 800, color: "#fff", background: "linear-gradient(135deg,#34a853,#1a6e38)" }}>
                  {myName.split(" ").map(w => w[0]).join("").slice(0, 2).toUpperCase()}
                </div>
                <span style={{ color: "#9aa0a6", fontSize: 11, background: "rgba(0,0,0,.5)", padding: "4px 12px", borderRadius: 20 }}>
                  {micOn ? "🎤 Micro actif" : "🔇 Micro coupé"}
                </span>
              </div>
              <div style={{ position: "absolute", bottom: 8, left: 8 }}>
                <span style={{ background: "rgba(0,0,0,.75)", color: "#fff", fontSize: 12, padding: "3px 9px", borderRadius: 7 }}>{myName} (Vous)</span>
              </div>
              {hand && <div style={{ position: "absolute", top: 8, left: 8, fontSize: 22, animation: "handWave .7s infinite" }}>✋</div>}
            </div>
          )}

          {/* REMOTE TILES */}
          {visiblePeers.map(p => (
            <Tile
              key={p.id}
              stream={p.stream}
              name={nameMap.current[p.id] || p.name || "Invité"}
              role={ptcps.find(x => x.socketId === p.id)?.role || roleMap.current[p.id] || "guest"}
              camOff={pState[p.id]?.video === false}
              hand={pState[p.id]?.hand}
              screenShare={pState[p.id]?.screen}
              micOn={pState[p.id]?.audio !== false}
              muted={false}
            />
          ))}

          {/* Message d'attente pour jeune si admin pas encore là */}
          {myRole === "guest" && visiblePeers.length === 0 && (
            <div style={{ gridColumn: "1/-1", display: "flex", alignItems: "center", justifyContent: "center", flexDirection: "column", gap: 12, opacity: .6 }}>
              <div style={{ width: 40, height: 40, border: "3px solid rgba(255,255,255,.1)", borderTopColor: "#8ab4f8", borderRadius: "50%", animation: "spin .8s linear infinite" }} />
              <p style={{ color: "#9aa0a6", fontSize: 13 }}>En attente de l'hôte…</p>
              <p style={{ color: "#5f6368", fontSize: 11 }}>Le live démarrera quand l'admin active sa caméra</p>
            </div>
          )}
        </div>

        {/* ══ CHAT PANEL ══ */}
        {chatOpen && (
          <div style={{ width: 320, background: "#2d2f31", borderRadius: 14, border: "1px solid rgba(255,255,255,.06)", display: "flex", flexDirection: "column", overflow: "hidden", flexShrink: 0, animation: "slideIn .25s ease" }}>
            <div style={{ padding: "12px 14px", borderBottom: "1px solid rgba(255,255,255,.06)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span style={{ color: "#e8eaed", fontWeight: 700, fontSize: 13 }}>💬 Chat en direct</span>
              <button onClick={() => setChatOpen(false)} style={{ background: "none", border: "none", color: "#5f6368", cursor: "pointer", fontSize: 16 }}>✕</button>
            </div>
            <div style={{ flex: 1, overflowY: "auto", padding: 10, display: "flex", flexDirection: "column", gap: 8 }}>
              {msgs.length === 0 && (
                <div style={{ color: "#5f6368", textAlign: "center", padding: "30px 16px", fontSize: 13 }}>
                  <div style={{ fontSize: 38, marginBottom: 8 }}>💬</div>Pas encore de messages…
                </div>
              )}
              {msgs.map(m => {
                const isMe = m.user === myName;
                return (
                  <div key={m.id} style={{ alignSelf: isMe ? "flex-end" : "flex-start", maxWidth: "86%", animation: "fadeIn .2s ease" }}>
                    {!isMe && (
                      <div style={{ fontSize: 10, color: "#9aa0a6", marginBottom: 3, display: "flex", alignItems: "center", gap: 4 }}>
                        {m.role === "host" && <span style={{ background: "#1a73e8", color: "#fff", padding: "1px 5px", borderRadius: 4, fontSize: 9 }}>HOST</span>}
                        {m.user}
                      </div>
                    )}
                    <div style={{ padding: "8px 12px", borderRadius: 12, fontSize: 13, lineHeight: 1.6, wordBreak: "break-word", background: isMe ? "linear-gradient(135deg,#1a73e8,#0d47a1)" : "rgba(255,255,255,.09)" }}>
                      {m.text}
                    </div>
                    <div style={{ fontSize: 10, color: "#5f6368", marginTop: 2 }}>{m.time}</div>
                  </div>
                );
              })}
              <div ref={chatEnd} />
            </div>
            <div style={{ display: "flex", gap: 6, padding: "8px 10px", borderTop: "1px solid rgba(255,255,255,.06)" }}>
              <input value={chatInput} onChange={e => setChatInput(e.target.value)}
                onKeyDown={e => e.key === "Enter" && !e.shiftKey && sendMsg()}
                placeholder="Écrire un message…"
                style={{ flex: 1, background: "rgba(255,255,255,.06)", border: "1px solid rgba(255,255,255,.1)", borderRadius: 20, padding: "8px 13px", color: "#e8eaed", fontSize: 13, outline: "none" }} />
              <button onClick={sendMsg}
                style={{ background: "#1a73e8", border: "none", borderRadius: "50%", width: 36, height: 36, color: "#fff", cursor: "pointer", fontSize: 14, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>➤</button>
            </div>
          </div>
        )}

        {/* ══ PARTICIPANTS PANEL ══ */}
        {partOpen && (
          <div style={{ width: 300, background: "#2d2f31", borderRadius: 14, border: "1px solid rgba(255,255,255,.06)", display: "flex", flexDirection: "column", overflow: "hidden", flexShrink: 0, animation: "slideIn .25s ease" }}>
            <div style={{ padding: "12px 14px", borderBottom: "1px solid rgba(255,255,255,.06)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span style={{ color: "#e8eaed", fontWeight: 700, fontSize: 13 }}>👥 Participants ({ptcps.length})</span>
              <button onClick={() => setPartOpen(false)} style={{ background: "none", border: "none", color: "#5f6368", cursor: "pointer", fontSize: 16 }}>✕</button>
            </div>
            <div style={{ flex: 1, overflowY: "auto", padding: 8 }}>
              {ptcps.map(p => (
                <div key={p.socketId} style={{ display: "flex", alignItems: "center", gap: 8, padding: "8px 4px", borderBottom: "1px solid rgba(255,255,255,.04)" }}>
                  <div style={{ width: 34, height: 34, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 800, fontSize: 12, flexShrink: 0, color: "#fff", background: p.role === "host" ? "linear-gradient(135deg,#1a73e8,#0d47a1)" : "linear-gradient(135deg,#34a853,#1a6e38)" }}>
                    {(p.userName || "?")[0].toUpperCase()}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ color: "#e8eaed", fontSize: 13, fontWeight: 600, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {p.userName}{p.role === "host" && " 👑"}
                    </div>
                    <div style={{ color: "#9aa0a6", fontSize: 10, display: "flex", gap: 3, marginTop: 1 }}>
                      {p.audioOn === false && <span>🔇</span>}
                      {p.videoOn === false && <span>📷</span>}
                      {p.handRaised && <span>✋</span>}
                    </div>
                  </div>
                  {myRole === "host" && p.socketId !== sockRef.current?.id && (
                    <div style={{ display: "flex", gap: 3 }}>
                      <button title="Autoriser micro" onClick={() => adminAllowMic(p.socketId)}
                        style={{ background: "rgba(255,255,255,.06)", border: "1px solid rgba(255,255,255,.07)", borderRadius: 6, color: "#34a853", padding: "4px 7px", cursor: "pointer", fontSize: 12 }}>🎤</button>
                      <button title="Couper micro" onClick={() => adminMute(p.socketId, "audio")}
                        style={{ background: "rgba(255,255,255,.06)", border: "1px solid rgba(255,255,255,.07)", borderRadius: 6, color: "#fbbc04", padding: "4px 7px", cursor: "pointer", fontSize: 12 }}>🔇</button>
                      <button title="Retirer" onClick={() => adminKick(p.socketId)}
                        style={{ background: "rgba(255,255,255,.06)", border: "1px solid rgba(255,255,255,.07)", borderRadius: 6, color: "#ea4335", padding: "4px 7px", cursor: "pointer", fontSize: 12 }}>✕</button>
                    </div>
                  )}
                </div>
              ))}
            </div>
            {myRole === "host" && (
              <div style={{ padding: 10, borderTop: "1px solid rgba(255,255,255,.06)" }}>
                <button onClick={muteAll}
                  style={{ background: "rgba(234,67,53,.1)", border: "1px solid rgba(234,67,53,.25)", borderRadius: 8, color: "#ea4335", padding: "8px 12px", cursor: "pointer", fontWeight: 600, fontSize: 12, width: "100%" }}>
                  🔇 Couper tous les micros
                </button>
              </div>
            )}
          </div>
        )}

        {/* ══ AI PANEL ══ */}
        {aiOpen && (
          <div style={{ width: 320, background: "#2d2f31", borderRadius: 14, border: "1px solid rgba(255,255,255,.06)", display: "flex", flexDirection: "column", overflow: "hidden", flexShrink: 0, animation: "slideIn .25s ease" }}>
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
              ) : aiText ? (
                <div>
                  <div style={{ color: "#e8eaed", fontSize: 13, lineHeight: 1.8, whiteSpace: "pre-wrap" }}>{aiText}</div>
                  <button onClick={() => { navigator.clipboard.writeText(aiText); showToast("Copié !", "#34a853", "📋"); }}
                    style={{ background: "#1a73e8", color: "#fff", border: "none", padding: "10px 16px", borderRadius: 10, cursor: "pointer", fontWeight: 700, fontSize: 12, width: "100%", marginTop: 12 }}>📋 Copier</button>
                  <button onClick={genConclusion}
                    style={{ background: "rgba(255,255,255,.06)", border: "1px solid rgba(255,255,255,.1)", color: "#e8eaed", padding: "10px 16px", borderRadius: 10, cursor: "pointer", fontWeight: 600, fontSize: 12, width: "100%", marginTop: 6 }}>🔄 Regénérer</button>
                </div>
              ) : (
                <div style={{ textAlign: "center", padding: "20px 10px" }}>
                  <div style={{ fontSize: 52, marginBottom: 14 }}>🤖</div>
                  <p style={{ color: "#9aa0a6", fontSize: 13, marginBottom: 20, lineHeight: 1.7 }}>L'IA analysera la transcription et le chat pour générer une conclusion.</p>
                  <button onClick={genConclusion}
                    style={{ background: "linear-gradient(135deg,#1a73e8,#0d47a1)", color: "#fff", border: "none", padding: "12px 20px", borderRadius: 12, cursor: "pointer", fontWeight: 700, fontSize: 13, width: "100%" }}>✨ Générer</button>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* ══ FLOATING REACTIONS ══ */}
      <div style={{ position: "fixed", bottom: 100, left: "50%", transform: "translateX(-50%)", display: "flex", gap: 16, pointerEvents: "none", zIndex: 60 }}>
        {floats.map(f => (
          <div key={f.id} style={{ display: "flex", flexDirection: "column", alignItems: "center", animation: "floatUp 3s ease-out forwards" }}>
            <span style={{ fontSize: 36 }}>{f.emoji}</span>
            <span style={{ color: "#9aa0a6", fontSize: 10 }}>{f.n}</span>
          </div>
        ))}
      </div>

      {/* ══ SUBTITLES ══ */}
      {subsOn && subtitle && (
        <div style={{ position: "fixed", bottom: 90, left: "50%", transform: "translateX(-50%)", background: "rgba(0,0,0,.9)", color: "#fff", padding: "8px 22px", borderRadius: 10, maxWidth: "62%", textAlign: "center", fontSize: 14, zIndex: 50 }}>
          {subtitle}
        </div>
      )}

      {/* ══ EMOJI PICKER ══ */}
      {emojiOpen && (
        <div style={{ position: "fixed", bottom: 92, left: "50%", transform: "translateX(-50%)", background: "#2d2f31", border: "1px solid rgba(255,255,255,.1)", borderRadius: 16, padding: "10px 14px", display: "flex", gap: 6, flexWrap: "wrap", zIndex: 70, boxShadow: "0 8px 32px rgba(0,0,0,.6)", animation: "popIn .2s ease", maxWidth: 280, justifyContent: "center" }}>
          {["👍", "❤️", "😂", "🎉", "🔥", "👏", "🙌", "💯", "😮", "🤔", "👎", "🌟"].map(e => (
            <button key={e} className="ebtn" onClick={() => sendReaction(e)}
              style={{ background: "none", border: "none", fontSize: 26, cursor: "pointer", borderRadius: 8, padding: "4px 6px", transition: "transform .15s" }}>{e}</button>
          ))}
        </div>
      )}

      {/* ══ CONTROLS BAR ══ */}
      <div style={{ background: "#2d2f31", padding: "10px 16px", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8, flexShrink: 0, flexWrap: "wrap", borderTop: "1px solid rgba(255,255,255,.05)" }}>

        {/* Left: mic + cam */}
        <div style={{ display: "flex", gap: 5 }}>
          <Btn icon={micOn ? "🎤" : "🔇"} label={micOn ? "Micro" : "Muet"} onClick={toggleMic} active={micOn} />
          {myRole === "host" && (
            <Btn icon={camOn ? "📷" : "🚫"} label={camOn ? "Caméra" : "Off"} onClick={toggleCam} active={camOn} />
          )}
        </div>

        {/* Center */}
        <div style={{ display: "flex", gap: 5 }}>
          {myRole === "host" && <Btn icon="🖥️" label={screenOn ? "Arrêter" : "Partager"} onClick={toggleScreen} active={!screenOn} />}
          {myRole === "guest" && <Btn icon="✋" label={hand ? "Baisser" : "Main"} onClick={toggleHand} active={!hand} pulse={hand} />}
          <Btn icon="😄" label="Réactions" onClick={() => setEmojiOpen(o => !o)} active />
          <Btn icon="💬" label="Chat" onClick={() => { setChatOpen(o => !o); setUnread(0); setPartOpen(false); setAiOpen(false); }} active badge={unread} />
          {myRole === "host" && <Btn icon="👥" label="Membres" onClick={() => { setPartOpen(o => !o); setChatOpen(false); setAiOpen(false); }} active />}
        </div>

        {/* Right */}
        <div style={{ display: "flex", gap: 5 }}>
          <button className="cbtn" onClick={() => setSubsOn(o => !o)}
            style={{ border: "none", borderRadius: 13, padding: "10px 15px", color: "#fff", cursor: "pointer", display: "flex", flexDirection: "column", alignItems: "center", gap: 3, minWidth: 62, background: subsOn ? "#1a73e8" : "rgba(255,255,255,.1)" }}>
            <span style={{ fontSize: 13, fontWeight: 900, fontFamily: "monospace" }}>CC</span>
            <span style={{ fontSize: 10, fontWeight: 600 }}>Sous-titres</span>
          </button>
          {myRole === "host" && <Btn icon="✨" label="Conclusion" onClick={() => { setAiOpen(o => !o); setChatOpen(false); setPartOpen(false); }} active />}
          <Btn icon="🚪" label="Quitter" onClick={() => { cleanup(); navigate(-1); }} danger />
        </div>
      </div>
    </div>
  );
}