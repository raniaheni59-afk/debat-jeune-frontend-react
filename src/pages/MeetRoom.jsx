import { useEffect, useRef, useState, useCallback } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import { io } from "socket.io-client";

const SOCKET_URL  = import.meta.env.VITE_BACKEND_URL || "https://debat-jeune.onrender.com";
const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || "https://debat-jeune.onrender.com";

const ICE = [
  { urls: "stun:stun.l.google.com:19302" },
  { urls: "stun:stun1.l.google.com:19302" },
  { urls: "stun:stun2.l.google.com:19302" },
  { urls: "turn:openrelay.metered.ca:80",                username: "openrelayproject", credential: "openrelayproject" },
  { urls: "turn:openrelay.metered.ca:443",               username: "openrelayproject", credential: "openrelayproject" },
  { urls: "turn:openrelay.metered.ca:443?transport=tcp", username: "openrelayproject", credential: "openrelayproject" },
];

const CSS = `
@import url('https://fonts.googleapis.com/css2?family=Google+Sans:wght@400;500;600;700&display=swap');
*,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
html,body{overflow:hidden;height:100%}
@keyframes spin{to{transform:rotate(360deg)}}
@keyframes fadeIn{from{opacity:0;transform:translateY(6px)}to{opacity:1;transform:translateY(0)}}
@keyframes slideIn{from{opacity:0;transform:translateX(20px)}to{opacity:1;transform:translateX(0)}}
@keyframes popIn{from{transform:scale(.88);opacity:0}to{transform:scale(1);opacity:1}}
@keyframes toast{from{opacity:0;transform:translateX(-50%)translateY(-8px)}to{opacity:1;transform:translateX(-50%)translateY(0)}}
@keyframes floatUp{0%{opacity:1;transform:translateY(0)}100%{opacity:0;transform:translateY(-80px)}}
@keyframes blink{0%,100%{opacity:1}50%{opacity:.3}}
@keyframes wave{0%,100%{transform:rotate(0)}25%{transform:rotate(20deg)}75%{transform:rotate(-10deg)}}
.cbtn{transition:all .15s;cursor:pointer}
.cbtn:hover{filter:brightness(1.18);transform:scale(1.05)}
::-webkit-scrollbar{width:4px}
::-webkit-scrollbar-thumb{background:rgba(255,255,255,.15);border-radius:4px}
video{background:#000;display:block}
`;

function useSubtitles(on) {
  const [live, setLive]   = useState("");
  const [saved, setSaved] = useState([]);
  useEffect(() => {
    if (!on) { setLive(""); return; }
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) return;
    const r = new SR();
    r.continuous = true; r.interimResults = true; r.lang = "fr-FR";
    r.onresult = e => {
      setLive(Array.from(e.results).map(x => x[0].transcript).join(" "));
      setSaved(p => [...p, ...Array.from(e.results).filter(r => r.isFinal).map(r => r[0].transcript)]);
    };
    r.onerror = () => {};
    r.start();
    return () => { try { r.stop(); } catch {} };
  }, [on]);
  return { live, saved };
}

// ══ TILE ══════════════════════════════════════════════
function Tile({ stream, muted=false, name="?", role="guest", camOff=false,
                hand=false, isLocal=false, localRef, screenShare=false, micOn=true }) {
  const ref  = useRef(null);
  const vRef = isLocal ? localRef : ref;

  useEffect(() => {
    const el = vRef?.current;
    if (!el) return;
    if (stream && el.srcObject !== stream) {
      el.srcObject = stream;
      el.play().catch(() => {});
    }
  }, [stream]);

  const init  = (name||"?").split(" ").map(w=>w[0]).join("").slice(0,2).toUpperCase();
  const isH   = role === "host";
  const showV = isLocal ? !camOff : (!camOff && !!stream);

  return (
    <div style={{ position:"relative", background:"#111", borderRadius:14, overflow:"hidden",
      aspectRatio:"16/9", minHeight:110,
      boxShadow: hand?"0 0 0 3px #fbbc04":isH?"0 0 0 2px rgba(26,115,232,.5)":"0 2px 12px rgba(0,0,0,.4)" }}>
      <video ref={vRef} autoPlay playsInline muted={muted}
        style={{ width:"100%", height:"100%", objectFit:"cover", display: showV?"block":"none" }} />
      {!showV && (
        <div style={{ position:"absolute",inset:0,display:"flex",alignItems:"center",justifyContent:"center",
          background:"radial-gradient(circle at 35% 30%,#1c1c2e,#0d0d1a)" }}>
          <div style={{ width:68,height:68,borderRadius:"50%",fontSize:24,fontWeight:800,color:"#fff",
            display:"flex",alignItems:"center",justifyContent:"center",
            background:isH?"linear-gradient(135deg,#1a73e8,#0d47a1)":"linear-gradient(135deg,#34a853,#1a6e38)",
            boxShadow:"0 6px 24px rgba(0,0,0,.5)" }}>{init}</div>
        </div>
      )}
      <div style={{ position:"absolute",bottom:8,left:8,display:"flex",gap:5,alignItems:"center",flexWrap:"wrap" }}>
        {isH     && <span style={{ background:"rgba(26,115,232,.9)",color:"#fff",fontSize:9,fontWeight:800,padding:"2px 8px",borderRadius:20 }}>👑 ADMIN</span>}
        {screenShare && <span style={{ background:"rgba(52,168,83,.9)",color:"#fff",fontSize:9,padding:"2px 8px",borderRadius:8 }}>🖥️ Écran</span>}
        <span style={{ background:"rgba(0,0,0,.75)",backdropFilter:"blur(4px)",color:"#fff",fontSize:12,padding:"3px 9px",borderRadius:7 }}>
          {isLocal?`${name} (Vous)`:name}
        </span>
        {!micOn && <span style={{ background:"rgba(234,67,53,.85)",color:"#fff",fontSize:9,padding:"2px 6px",borderRadius:6 }}>🔇</span>}
      </div>
      {hand && <div style={{ position:"absolute",top:8,left:8,fontSize:22,animation:"wave .7s infinite" }}>✋</div>}
    </div>
  );
}

function Btn({ icon, label, onClick, active=true, danger=false, badge=0, pulse=false, disabled=false }) {
  return (
    <button className="cbtn" onClick={onClick} title={label} disabled={disabled} style={{
      border:"none",borderRadius:13,padding:"10px 15px",color:"#fff",
      display:"flex",flexDirection:"column",alignItems:"center",gap:3,minWidth:62,
      background:danger?"#ea4335":!active?"#ea4335":"rgba(255,255,255,.1)",
      animation:pulse?"blink 1.4s infinite":"none",position:"relative",opacity:disabled?.5:1 }}>
      <span style={{ fontSize:20 }}>{icon}</span>
      <span style={{ fontSize:10,fontWeight:600,opacity:.9,whiteSpace:"nowrap" }}>{label}</span>
      {badge>0 && <span style={{ position:"absolute",top:-5,right:-5,background:"#ea4335",color:"#fff",
        borderRadius:"50%",width:18,height:18,display:"flex",alignItems:"center",justifyContent:"center",fontSize:10,fontWeight:800 }}>{badge>99?"99+":badge}</span>}
    </button>
  );
}

function Modal({ emoji, title, desc, onCancel, confirmLabel, onConfirm, confirmColor="#ea4335", children }) {
  return (
    <div style={{ position:"fixed",inset:0,background:"rgba(0,0,0,.75)",backdropFilter:"blur(8px)",display:"flex",alignItems:"center",justifyContent:"center",zIndex:1000 }}>
      <div style={{ background:"#2d2f31",border:"1px solid rgba(255,255,255,.08)",borderRadius:20,padding:44,textAlign:"center",animation:"popIn .3s ease",maxWidth:400,width:"90%" }}>
        <div style={{ fontSize:46,marginBottom:14 }}>{emoji}</div>
        <p style={{ color:"#e8eaed",fontWeight:700,fontSize:16,marginBottom:8 }}>{title}</p>
        {desc && <p style={{ color:"#9aa0a6",fontSize:13,marginBottom:20,lineHeight:1.6 }}>{desc}</p>}
        {children || (
          <div style={{ display:"flex",gap:10,justifyContent:"center",marginTop:10 }}>
            <button onClick={onCancel} style={{ background:"rgba(255,255,255,.08)",border:"1px solid rgba(255,255,255,.12)",borderRadius:10,padding:"10px 24px",color:"#e8eaed",cursor:"pointer",fontWeight:600 }}>Annuler</button>
            <button onClick={onConfirm} style={{ background:confirmColor,border:"none",borderRadius:10,padding:"10px 24px",color:"#fff",cursor:"pointer",fontWeight:700 }}>{confirmLabel}</button>
          </div>
        )}
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════
// MAIN COMPONENT
// ══════════════════════════════════════════════════════
export default function MeetRoom() {
  const { roomCode } = useParams();
  const [sp]         = useSearchParams();
  const navigate     = useNavigate();

  const atToken = sp.get("at");
  const vtToken = sp.get("vt");
  const token   = atToken || vtToken || "";
  const myRole  = atToken ? "host" : "guest";

  const stored  = (() => { try { return JSON.parse(localStorage.getItem("user")||"{}"); } catch { return {}; } })();
  const myName  = stored?.prenom_user ? `${stored.prenom_user} ${stored.nom_user||""}`.trim() : stored?.name || (myRole==="host"?"Admin":"Participant");
  const myEmail = stored?.email_user || stored?.email || "";

  // ── State ──
  const [status,      setStatus]    = useState("loading");
  const [errMsg,      setErrMsg]    = useState("");
  const [micOn,       setMicOn]     = useState(myRole==="host");
  const [camOn,       setCamOn]     = useState(myRole==="host");
  const [hand,        setHand]      = useState(false);
  const [screenOn,    setScreenOn]  = useState(false);
  const [subsOn,      setSubsOn]    = useState(false);
  const [chatOpen,    setChatOpen]  = useState(true);
  const [partOpen,    setPartOpen]  = useState(false);
  const [emojiOpen,   setEmojiOpen] = useState(false);
  const [linkOpen,    setLinkOpen]  = useState(false);
  const [msgs,        setMsgs]      = useState([]);
  const [chatInput,   setChatInput] = useState("");
  const [unread,      setUnread]    = useState(0);
  const [peers,       setPeers]     = useState([]);
  const [pState,      setPState]    = useState({});
  const [ptcps,       setPtcps]     = useState([]);
  const [floats,      setFloats]    = useState([]);
  const [toast,       setToast]     = useState(null);
  const [duration,    setDuration]  = useState(0);
  const [aiLoading,   setAiLoading] = useState(false);
  const [aiText,      setAiText]    = useState("");
  const [aiOpen,      setAiOpen]    = useState(false);
  const [kickTarget,  setKickTarget]= useState(null);
  const [blockTarget, setBlockTarget]=useState(null);
  const [copied,      setCopied]    = useState(false);
  const [mediaError,  setMediaError]= useState("");
  const [permDenied,  setPermDenied]= useState(false);
  const [endModal,    setEndModal]  = useState(false);
  const [liveInfo,    setLiveInfo]  = useState(null);

  // ── Refs ──
  const sockRef   = useRef(null);
  const localVid  = useRef(null);
  const localStr  = useRef(null);
  const screenStr = useRef(null);
  const pcMap     = useRef({});
  const nameMap   = useRef({});
  const roleMap   = useRef({});
  const emailMap  = useRef({});
  const chatEnd   = useRef(null);
  const timerRef  = useRef(null);
  const lsRef     = useRef(null);
  const msgsRef   = useRef([]);

  const { live: subtitle, saved: transcript } = useSubtitles(subsOn);

  const showToast = useCallback((msg, color="#1a73e8", icon="") => {
    setToast({ msg, color, icon });
    setTimeout(() => setToast(null), 4000);
  }, []);

  const fmt = s => {
    const h=Math.floor(s/3600), m=Math.floor((s%3600)/60), x=s%60;
    return h?`${h}:${String(m).padStart(2,"0")}:${String(x).padStart(2,"0")}`:`${String(m).padStart(2,"0")}:${String(x).padStart(2,"0")}`;
  };

  useEffect(() => {
    timerRef.current = setInterval(() => setDuration(d=>d+1), 1000);
    return () => clearInterval(timerRef.current);
  }, []);

  // Récupérer infos live
  useEffect(() => {
    if (!roomCode) return;
    fetch(`${BACKEND_URL}/api/lives`, {
      headers: { Authorization: `Bearer ${localStorage.getItem("token")||""}` }
    }).then(r=>r.json()).then(data => {
      const list = Array.isArray(data) ? data : [];
      const live = list.find(l => l.room_code===roomCode);
      if (live) setLiveInfo(live);
    }).catch(()=>{});
  }, [roomCode]);

  // Assign local video
  const assignLocalVideo = useCallback((stream) => {
    localStr.current = stream;
    lsRef.current    = stream;
    const try_ = () => {
      if (localVid.current) {
        if (localVid.current.srcObject !== stream) {
          localVid.current.srcObject = stream;
          localVid.current.play().catch(() => {});
        }
        return true;
      }
      return false;
    };
    if (!try_()) {
      const t = setInterval(() => { if(try_()) clearInterval(t); }, 50);
      setTimeout(() => clearInterval(t), 8000);
    }
  }, []);

  // ── createPeer ──
  const createPeer = useCallback((sid) => {
    // Fermer peer existant
    if (pcMap.current[sid]) { try { pcMap.current[sid].close(); } catch {} }

    const pc = new RTCPeerConnection({ iceServers: ICE });

    pc.onicecandidate = e => {
      if (e.candidate) sockRef.current?.emit("ice-candidate", { target:sid, candidate:e.candidate });
    };
    pc.oniceconnectionstatechange = () => {
      if (pc.iceConnectionState === "failed") pc.restartIce();
    };
    pc.ontrack = e => {
      const stream = e.streams[0];
      if (!stream) return;
      setPeers(prev => {
        const ex = prev.find(p=>p.id===sid);
        if (ex) return prev.map(p=>p.id===sid?{...p,stream}:p);
        return [...prev, { id:sid, stream, name:nameMap.current[sid]||"Invité", role:roleMap.current[sid]||"guest" }];
      });
    };

    // ✅ Ajouter les tracks locaux au peer
    // Si partage d'écran actif → envoyer screen track pour la vidéo
    const s = lsRef.current;
    if (s) {
      s.getAudioTracks().forEach(t => { try { pc.addTrack(t, s); } catch {} });
      const videoTrack = screenStr.current?.getVideoTracks()[0] || s.getVideoTracks()[0];
      if (videoTrack) { try { pc.addTrack(videoTrack, s); } catch {} }
    }

    return pc;
  }, []);

  // ── ✅ createOfferForPeer: créer et envoyer offre à un peer ──
  const createOfferForPeer = useCallback(async (sid) => {
    const pc = createPeer(sid);
    pcMap.current[sid] = pc;
    try {
      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);
      sockRef.current?.emit("offer", { target: sid, sdp: offer });
    } catch (err) {
      console.error("createOffer error:", err);
    }
  }, [createPeer]);

  // ══ INIT ══════════════════════════════════════════════
  useEffect(() => {
    if (!token) { setErrMsg("Token d'accès manquant dans l'URL."); setStatus("error"); return; }
    let alive = true;

    (async () => {
      // ── Media ──
      if (myRole === "host") {
        let s = null;
        // Tentative 1: HD
        try {
          s = await navigator.mediaDevices.getUserMedia({
            video: { width:{ideal:1280}, height:{ideal:720}, facingMode:"user", frameRate:{ideal:30} },
            audio: { echoCancellation:true, noiseSuppression:true, autoGainControl:true }
          });
        } catch {
          // Tentative 2: basique
          try { s = await navigator.mediaDevices.getUserMedia({ video:true, audio:true }); }
          catch {
            // Tentative 3: audio seulement
            try {
              s = await navigator.mediaDevices.getUserMedia({ video:false, audio:true });
              setCamOn(false);
              setMediaError("Caméra refusée — audio seulement");
            } catch (err) {
              setPermDenied(true);
              setMediaError(`Permissions refusées (${err.name}). Cliquez 🔒 → Autorisez Caméra+Micro → Rechargez.`);
              setMicOn(false); setCamOn(false);
            }
          }
        }
        if (!alive) { s?.getTracks().forEach(t=>t.stop()); return; }
        if (s) {
          assignLocalVideo(s);
          s.getAudioTracks().forEach(t => { t.enabled = true; });
          s.getVideoTracks().forEach(t => { t.enabled = true; });
        }
      } else {
        // Guest: audio seulement, muet par défaut
        try {
          const s = await navigator.mediaDevices.getUserMedia({
            video: false,
            audio: { echoCancellation:true, noiseSuppression:true }
          });
          if (!alive) { s.getTracks().forEach(t=>t.stop()); return; }
          s.getAudioTracks().forEach(t => { t.enabled = false; });
          localStr.current = s;
          lsRef.current    = s;
        } catch { setMicOn(false); }
      }

      setStatus("ok");

      // ── Socket ──
      const sock = io(SOCKET_URL, {
        transports: ["websocket"],
        reconnection: true,
        reconnectionAttempts: 10,
        reconnectionDelay: 2000,
      });
      sockRef.current = sock;

      sock.on("connect", () => {
        sock.emit("join-room", {
          roomCode, userName: myName, role: myRole,
          accessToken: token, email: myEmail,
        }, ack => {
          if (ack && !ack.ok) { setErrMsg(ack.message||"Accès refusé."); setStatus("error"); }
        });
      });

      sock.on("connect_error", err => console.error("Socket error:", err.message));

      // ✅ FIX CRITIQUE: quand on rejoint, envoyer offres aux peers déjà présents
      // L'admin attend que le stream local soit prêt avant d'envoyer les offres
      sock.on("all-users", users => {
        for (const u of users) {
          if (u.socketId === sock.id) continue;
          nameMap.current[u.socketId]  = u.userName;
          roleMap.current[u.socketId]  = u.role;
          emailMap.current[u.socketId] = u.email || "";
        }
        // ✅ Admin envoie offres après 800ms — laisse getUserMedia finir
        if (myRole === "host") {
          const targets = users.filter(u => u.socketId !== sock.id);
          targets.forEach((u, i) => {
            setTimeout(() => createOfferForPeer(u.socketId), 800 + i * 200);
          });
        }
        // ✅ Guest ne crée PAS de peer ici — attend l'offre de l'admin
      });

      sock.on("user-joined", ({ socketId, userName:n, role, email }) => {
        nameMap.current[socketId]  = n;
        roleMap.current[socketId]  = role;
        emailMap.current[socketId] = email || "";
        showToast(`👋 ${n} a rejoint`, "#34a853");
        // ✅ Admin envoie offre avec délai — stream doit être initialisé côté guest
        if (myRole === "host") {
          setTimeout(() => createOfferForPeer(socketId), 600);
        }
      });

      // ✅ FIX: host-joined — mettre à jour les maps, NE PAS créer de peer
      // L'admin enverra une offre via user-joined qu'il reçoit simultanément
      sock.on("host-joined", ({ socketId, userName:n }) => {
        nameMap.current[socketId] = n;
        roleMap.current[socketId] = "host";
        showToast(`👑 ${n} (Admin) a rejoint`, "#1a73e8");
        // ✅ NE PAS créer de peer ici — l'admin envoie l'offre, pas le guest
      });

      sock.on("offer", async ({ caller, sdp }) => {
        let pc = pcMap.current[caller];
        if (!pc) { pc = createPeer(caller); pcMap.current[caller] = pc; }
        try {
          await pc.setRemoteDescription(new RTCSessionDescription(sdp));
          const ans = await pc.createAnswer();
          await pc.setLocalDescription(ans);
          sock.emit("answer", { target:caller, sdp:ans });
        } catch (err) { console.error("offer handle error:", err); }
      });

      sock.on("answer", async ({ responder, sdp }) => {
        try { await pcMap.current[responder]?.setRemoteDescription(new RTCSessionDescription(sdp)); }
        catch (err) { console.error("answer error:", err); }
      });

      sock.on("ice-candidate", async ({ from, candidate }) => {
        try { await pcMap.current[from]?.addIceCandidate(new RTCIceCandidate(candidate)); }
        catch {}
      });

      sock.on("user-left", ({ socketId }) => {
        const n = nameMap.current[socketId];
        if (n) showToast(`${n} a quitté`, "#5f6368");
        try { pcMap.current[socketId]?.close(); } catch {}
        delete pcMap.current[socketId];
        setPeers(prev => prev.filter(p=>p.id!==socketId));
      });

      sock.on("user-media-toggled", ({ socketId, type, enabled }) =>
        setPState(prev => ({ ...prev, [socketId]: { ...prev[socketId], [type]:enabled } })));

      sock.on("participants-update", list => setPtcps(list||[]));

      sock.on("receive-message", msg => {
        const m = { ...msg, id:Date.now()+Math.random() };
        setMsgs(prev => { const n=[...prev,m]; msgsRef.current=n; return n; });
        setChatOpen(o => { if(!o) setUnread(n=>n+1); return o; });
        setTimeout(() => chatEnd.current?.scrollIntoView({ behavior:"smooth" }), 50);
      });

      sock.on("reaction", ({ userName:n, emoji }) => {
        const id=Date.now()+Math.random();
        setFloats(prev=>[...prev,{id,n,emoji}]);
        setTimeout(()=>setFloats(prev=>prev.filter(f=>f.id!==id)),3000);
      });

      sock.on("hand-raised", ({ socketId, userName:n, raised }) => {
        setPState(prev=>({ ...prev,[socketId]:{ ...prev[socketId],hand:raised } }));
        if (raised && myRole==="host") showToast(`✋ ${n} lève la main`, "#fbbc04");
      });

      sock.on("force-mute", ({ type }) => {
        const trk = type==="audio"?localStr.current?.getAudioTracks()[0]:localStr.current?.getVideoTracks()[0];
        if (trk) trk.enabled = false;
        if (type==="audio") setMicOn(false); else setCamOn(false);
        showToast(`Admin a coupé votre ${type==="audio"?"micro":"caméra"}`, "#ea4335", "🔇");
      });

      sock.on("mic-allowed", ({ targetSocketId }) => {
        if (targetSocketId === sock.id) {
          const trk = localStr.current?.getAudioTracks()[0];
          if (trk) { trk.enabled=true; setMicOn(true); }
          showToast("L'admin vous autorise à parler 🎤", "#34a853");
        }
      });

      sock.on("force-kicked", () => {
        cleanup();
        alert("Vous avez été retiré de cette session par l'administrateur.");
        window.location.href = "/jeune";
      });

      sock.on("force-blocked", ({ message }) => {
        cleanup();
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        alert(message || "Votre accès a été révoqué par l'administrateur.");
        window.location.href = "/login";
      });

      sock.on("live-ended", () => {
        if (myRole !== "host") {
          showToast("Le live est terminé.", "#5f6368");
          setTimeout(()=>{ cleanup(); navigate("/jeune"); }, 2500);
        }
      });

      // ✅ FIX Partage d'écran: mettre à jour le stream dans le tile existant
      sock.on("screen-share-started", ({ socketId }) => {
        setPState(prev=>({ ...prev,[socketId]:{ ...prev[socketId],screen:true } }));
        showToast("L'admin partage son écran 🖥️", "#34a853");
      });
      sock.on("screen-share-stopped", ({ socketId }) => {
        setPState(prev=>({ ...prev,[socketId]:{ ...prev[socketId],screen:false } }));
      });

    })();

    return () => { alive=false; cleanup(); };
  }, [roomCode, token]);

  const cleanup = () => {
    clearInterval(timerRef.current);
    sockRef.current?.emit("leave-room");
    sockRef.current?.disconnect();
    Object.values(pcMap.current).forEach(pc=>{ try{pc.close();}catch{} });
    pcMap.current = {};
    localStr.current?.getTracks().forEach(t=>t.stop());
    screenStr.current?.getTracks().forEach(t=>t.stop());
  };

  const emit = (ev, d) => sockRef.current?.emit(ev, d);

  // ── Controls ──
  const toggleMic = () => {
    const tracks = localStr.current?.getAudioTracks();
    if (!tracks?.length) { showToast("Micro non disponible","#ea4335","🔇"); return; }
    const nxt = !micOn;
    tracks.forEach(t => { t.enabled = nxt; });
    setMicOn(nxt);
    emit("toggle-media", { roomCode, type:"audio", enabled:nxt });
  };

  const toggleCam = () => {
    if (myRole!=="host") { showToast("Seul l'admin peut activer la caméra","#fbbc04"); return; }
    const tracks = localStr.current?.getVideoTracks();
    if (!tracks?.length) { showToast("Caméra non disponible","#ea4335","📷"); return; }
    const nxt = !camOn;
    tracks.forEach(t => { t.enabled = nxt; });
    setCamOn(nxt);
    emit("toggle-media", { roomCode, type:"video", enabled:nxt });
    if (nxt && localVid.current && localStr.current) {
      setTimeout(() => {
        if (localVid.current) {
          localVid.current.srcObject = localStr.current;
          localVid.current.play().catch(()=>{});
        }
      }, 100);
    }
  };

  const toggleHand = () => {
    if (myRole==="host") return;
    const r = !hand; setHand(r);
    emit("raise-hand", { roomCode, raised:r });
    r ? showToast("Main levée ✋ — admin notifié","#fbbc04") : showToast("Main baissée","#5f6368");
  };

  // ✅ FIX Partage d'écran: remplacer track vidéo dans tous les peer connections
  const toggleScreen = async () => {
    if (myRole!=="host") { showToast("Seul l'admin peut partager l'écran","#fbbc04"); return; }
    if (screenOn) {
      screenStr.current?.getTracks().forEach(t=>t.stop());
      screenStr.current = null;
      setScreenOn(false);
      emit("screen-share-stopped", { roomCode });

      // Remettre la caméra dans tous les peers
      const camTrack = localStr.current?.getVideoTracks()[0];
      Object.values(pcMap.current).forEach(pc => {
        const sender = pc.getSenders().find(s => s.track?.kind==="video");
        if (sender && camTrack) sender.replaceTrack(camTrack).catch(()=>{});
      });
      // Réassigner vidéo locale
      if (localVid.current && localStr.current) {
        localVid.current.srcObject = localStr.current;
        localVid.current.play().catch(()=>{});
      }
    } else {
      try {
        const ss = await navigator.mediaDevices.getDisplayMedia({ video:true, audio:true });
        screenStr.current = ss;
        const scrTrack = ss.getVideoTracks()[0];

        // ✅ Remplacer OU ajouter track vidéo dans TOUS les peer connections actifs
        const replacePromises = Object.values(pcMap.current).map(pc => {
          const sender = pc.getSenders().find(s => s.track?.kind==="video");
          if (sender) return sender.replaceTrack(scrTrack).catch(()=>{});
          // Pas de sender vidéo → ajouter directement
          try { pc.addTrack(scrTrack, ss); } catch {}
          return Promise.resolve();
        });
        await Promise.all(replacePromises);

        scrTrack.onended = async () => {
          // Arrêt automatique quand l'user ferme le partage
          screenStr.current = null;
          setScreenOn(false);
          emit("screen-share-stopped", { roomCode });
          const camTrack = localStr.current?.getVideoTracks()[0];
          Object.values(pcMap.current).forEach(pc => {
            const sender = pc.getSenders().find(s => s.track?.kind==="video");
            if (sender && camTrack) sender.replaceTrack(camTrack).catch(()=>{});
          });
          if (localVid.current && localStr.current) {
            localVid.current.srcObject = localStr.current;
            localVid.current.play().catch(()=>{});
          }
        };
        setScreenOn(true);
        emit("screen-share-started", { roomCode });
        showToast("Écran partagé — visible par tous ✅","#34a853","🖥️");
      } catch { showToast("Partage d'écran annulé","#5f6368"); }
    }
  };

  const sendReaction = emoji => {
    emit("send-reaction", { roomCode, emoji });
    const id=Date.now(); setFloats(prev=>[...prev,{id,n:"Vous",emoji}]);
    setTimeout(()=>setFloats(prev=>prev.filter(f=>f.id!==id)),3000); setEmojiOpen(false);
  };

  const sendMsg = () => {
    if (!chatInput.trim()) return;
    emit("send-message", { roomCode, message:chatInput });
    setChatInput("");
  };

  const copyLink = async () => {
    const link = myRole==="host"?(localStorage.getItem("currentLiveViewerLink")||""):window.location.href;
    if (!link) { showToast("Aucun lien","#ea4335","❌"); return; }
    await navigator.clipboard.writeText(link).catch(()=>{});
    setCopied(true); setTimeout(()=>setCopied(false),2500);
    showToast("✅ Lien copié !","#34a853");
  };

  const adminMute     = (sid,type) => { if(myRole!=="host") return; emit("admin-mute",{ roomCode,targetSocketId:sid,type }); };
  const adminAllowMic = sid => { if(myRole!=="host") return; emit("allow-mic",{ roomCode,targetSocketId:sid }); showToast("Micro autorisé 🎤","#34a853"); };
  const adminKick     = sid => { if(myRole!=="host") return; setKickTarget(sid); };
  const adminBlock    = sid => { if(myRole!=="host") return; setBlockTarget(sid); };
  const confirmKick   = () => { if(!kickTarget) return; emit("admin-kick",{roomCode,targetSocketId:kickTarget}); setKickTarget(null); showToast("Retiré","#ea4335","🚪"); };
  const confirmBlock  = () => { if(!blockTarget) return; emit("admin-block",{roomCode,targetSocketId:blockTarget,targetEmail:emailMap.current[blockTarget]||""}); setBlockTarget(null); showToast("Bloqué 🚫","#ea4335"); };
  const muteAll       = () => { ptcps.filter(p=>p.socketId!==sockRef.current?.id&&p.role!=="host").forEach(p=>adminMute(p.socketId,"audio")); showToast("Tous les micros coupés","#fbbc04","🔇"); };

  const endLive = async (withAI) => {
    setEndModal(false);
    let aiSummary = null;
    if (withAI) {
      setAiLoading(true);
      try {
        const chat = msgsRef.current.map(m=>`${m.user}: ${m.text}`).join("\n");
        const res  = await fetch(`${BACKEND_URL}/api/chatbot`, {
          method:"POST",
          headers:{ "Content-Type":"application/json", Authorization:`Bearer ${localStorage.getItem("token")||""}` },
          body: JSON.stringify({ message: `Résume ce live "${liveInfo?.title_live||roomCode}":\nParticipants: ${ptcps.length}, Durée: ${fmt(duration)}\nChat:\n${chat||"(aucun)"}\n\nConclusion avec: 📋 Points principaux, 💡 Idées clés, ✅ Consensus, 🎯 Actions.` })
        });
        const d = await res.json();
        aiSummary = d.reply || d.message || d.content || null;
        setAiText(aiSummary||"");
      } catch {} 
      setAiLoading(false);
    }

    emit("end-live", { roomCode, liveId:liveInfo?.id_live||liveInfo?.id, liveInfo:{ title:liveInfo?.title_live||roomCode, description:liveInfo?.description||"", thematique:liveInfo?.thematique||"" } });

    // Archive backup
    try {
      await fetch(`${BACKEND_URL}/api/lives/archive`, {
        method:"POST",
        headers:{ "Content-Type":"application/json", Authorization:`Bearer ${localStorage.getItem("token")||""}` },
        body: JSON.stringify({ liveId:liveInfo?.id_live||liveInfo?.id, roomCode, title:liveInfo?.title_live||roomCode, description:liveInfo?.description||"", thematique:liveInfo?.thematique||"", hostName:myName, durationSeconds:duration, participantsCount:ptcps.length, messagesCount:msgsRef.current.length, aiSummary, chatLog:msgsRef.current })
      });
    } catch {}

    cleanup();
    navigate("/admin/dashboard", { state:{ archived:true, aiSummary, liveTitle:liveInfo?.title_live } });
  };

  // ── Grid ──
  // Jeune voit UNIQUEMENT le stream de l'admin
  const hostPeer    = peers.find(p => (ptcps.find(x=>x.socketId===p.id)?.role||roleMap.current[p.id])==="host");
  const visiblePeers= myRole==="host" ? peers : (hostPeer?[hostPeer]:[]);
  const total       = 1 + visiblePeers.length;
  const cols        = total<=1?1:total<=4?2:3;

  // ── Loading / Error ──
  if (status==="loading") return (
    <div style={{ minHeight:"100vh",display:"flex",alignItems:"center",justifyContent:"center",background:"#202124",fontFamily:"'Google Sans',system-ui" }}>
      <style>{CSS}</style>
      <div style={{ textAlign:"center" }}>
        <div style={{ width:48,height:48,border:"3px solid rgba(255,255,255,.1)",borderTopColor:"#8ab4f8",borderRadius:"50%",animation:"spin .8s linear infinite",margin:"0 auto 16px" }} />
        <p style={{ color:"#9aa0a6",fontSize:14 }}>Connexion…</p>
        {myRole==="host" && <p style={{ color:"#5f6368",fontSize:11,marginTop:8 }}>Autorisez Caméra + Micro dans le navigateur</p>}
      </div>
    </div>
  );

  if (status==="error") return (
    <div style={{ minHeight:"100vh",display:"flex",alignItems:"center",justifyContent:"center",background:"#202124",fontFamily:"'Google Sans',system-ui" }}>
      <style>{CSS}</style>
      <div style={{ background:"#2d2f31",border:"1px solid rgba(255,255,255,.08)",borderRadius:20,padding:48,textAlign:"center",maxWidth:440 }}>
        <div style={{ fontSize:54,marginBottom:16 }}>🔒</div>
        <p style={{ color:"#e8eaed",fontWeight:700,fontSize:18,marginBottom:8 }}>Accès refusé</p>
        <p style={{ color:"#9aa0a6",fontSize:14,marginBottom:24,lineHeight:1.7 }}>{errMsg}</p>
        <button onClick={()=>navigate(-1)} style={{ background:"#1a73e8",color:"#fff",border:"none",padding:"11px 28px",borderRadius:10,cursor:"pointer",fontWeight:700 }}>← Retour</button>
      </div>
    </div>
  );

  // ══ MAIN UI ══════════════════════════════════════════
  return (
    <div style={{ height:"100vh",display:"flex",flexDirection:"column",background:"#202124",fontFamily:"'Google Sans',system-ui,sans-serif",color:"#fff",overflow:"hidden" }}>
      <style>{CSS}</style>

      {/* TOAST */}
      {toast && <div style={{ position:"fixed",top:18,left:"50%",transform:"translateX(-50%)",background:toast.color,color:"#fff",padding:"10px 22px",borderRadius:24,fontSize:13,fontWeight:600,zIndex:9999,boxShadow:"0 4px 24px rgba(0,0,0,.5)",display:"flex",alignItems:"center",gap:6,whiteSpace:"nowrap",animation:"toast .3s ease" }}>{toast.icon&&<span>{toast.icon}</span>}{toast.msg}</div>}

      {/* PERM DENIED */}
      {permDenied && <div style={{ background:"rgba(234,67,53,.18)",borderBottom:"2px solid rgba(234,67,53,.45)",padding:"10px 20px",color:"#ea4335",fontSize:13,textAlign:"center" }}>🔒 <strong>Accès Caméra/Micro refusé</strong> — Cliquez 🔒 dans la barre → Autorisez → Rechargez</div>}
      {mediaError && !permDenied && <div style={{ background:"rgba(234,67,53,.1)",borderBottom:"1px solid rgba(234,67,53,.25)",padding:"7px 20px",color:"#ea4335",fontSize:12,textAlign:"center" }}>⚠️ {mediaError}</div>}

      {/* MODALS */}
      {kickTarget  && <Modal emoji="🚪" title="Retirer ce participant ?" desc="Il sera exclu (peut revenir avec le lien)." onCancel={()=>setKickTarget(null)} onConfirm={confirmKick} confirmLabel="Retirer" />}
      {blockTarget && <Modal emoji="🚫" title="Bloquer définitivement ?" desc="Son compte sera supprimé. Il ne pourra plus rejoindre." onCancel={()=>setBlockTarget(null)} onConfirm={confirmBlock} confirmLabel="🚫 Bloquer" />}

      {endModal && (
        <Modal emoji="🎙️" title="Terminer le live ?" desc="Le live sera archivé automatiquement." onCancel={()=>setEndModal(false)} onConfirm={null} confirmLabel="">
          <div style={{ display:"flex",flexDirection:"column",gap:10,marginTop:16 }}>
            <button onClick={()=>endLive(true)} style={{ background:"linear-gradient(135deg,#1a73e8,#0d47a1)",border:"none",borderRadius:12,padding:"12px 20px",color:"#fff",cursor:"pointer",fontWeight:700,fontSize:14 }}>✨ Terminer + Résumé IA</button>
            <button onClick={()=>endLive(false)} style={{ background:"rgba(255,255,255,.08)",border:"1px solid rgba(255,255,255,.12)",borderRadius:12,padding:"12px 20px",color:"#e8eaed",cursor:"pointer",fontWeight:600,fontSize:14 }}>Terminer sans résumé</button>
            <button onClick={()=>setEndModal(false)} style={{ background:"none",border:"none",color:"#9aa0a6",cursor:"pointer",fontSize:13 }}>Annuler</button>
          </div>
        </Modal>
      )}

      {/* HEADER */}
      <div style={{ display:"flex",alignItems:"center",justifyContent:"space-between",padding:"10px 20px",background:"#2d2f31",flexShrink:0,borderBottom:"1px solid rgba(255,255,255,.06)" }}>
        <div style={{ display:"flex",alignItems:"center",gap:12 }}>
          <div style={{ width:34,height:34,borderRadius:10,background:"linear-gradient(135deg,#1a73e8,#0d47a1)",display:"flex",alignItems:"center",justifyContent:"center",fontWeight:900,fontSize:16 }}>S</div>
          <div>
            <div style={{ color:"#e8eaed",fontWeight:700,fontSize:14 }}>Swafy Meet {liveInfo&&`— ${liveInfo.title_live}`}</div>
            <div style={{ color:"#9aa0a6",fontSize:11,display:"flex",gap:6,alignItems:"center" }}>
              <span style={{ width:7,height:7,borderRadius:"50%",background:"#ea4335",display:"inline-block",animation:"blink 2s infinite" }} />
              {roomCode} · {myRole==="host"?"👑 Admin":"👤 Participant"} · ⏱ {fmt(duration)}
            </div>
          </div>
        </div>
        <div style={{ display:"flex",gap:8,alignItems:"center" }}>
          <span style={{ background:"rgba(255,255,255,.07)",color:"#9aa0a6",padding:"4px 10px",borderRadius:20,fontSize:12 }}>{ptcps.length} 👥</span>
          {myRole==="host" && (
            <button className="cbtn" onClick={()=>setLinkOpen(o=>!o)} style={{ background:"rgba(255,255,255,.06)",border:"1px solid rgba(255,255,255,.1)",color:"#e8eaed",padding:"6px 14px",borderRadius:8,fontSize:12,fontWeight:500 }}>🔗 Partager ce live</button>
          )}
        </div>
      </div>

      {/* LINK BAR */}
      {linkOpen && myRole==="host" && (
        <div style={{ background:"#2d2f31",borderBottom:"1px solid rgba(255,255,255,.06)",padding:"10px 18px",flexShrink:0,animation:"fadeIn .2s ease" }}>
          <p style={{ color:"#9aa0a6",fontSize:11,marginBottom:6 }}>🔗 Lien public pour les jeunes (copier et partager) :</p>
          <div style={{ display:"flex",gap:8,alignItems:"center" }}>
            <span style={{ flex:1,color:"#8ab4f8",fontSize:12,wordBreak:"break-all",background:"rgba(138,180,248,.08)",padding:"7px 12px",borderRadius:8,fontFamily:"monospace" }}>{localStorage.getItem("currentLiveViewerLink")||"Aucun lien — créez d'abord un live"}</span>
            {localStorage.getItem("currentLiveViewerLink") && <button onClick={copyLink} style={{ background:"#1a73e8",border:"none",borderRadius:8,padding:"7px 16px",color:"#fff",cursor:"pointer",fontSize:12,fontWeight:700,whiteSpace:"nowrap",flexShrink:0 }}>{copied?"✅ Copié !":"📋 Copier"}</button>}
            <button onClick={()=>setLinkOpen(false)} style={{ background:"rgba(255,255,255,.06)",border:"none",borderRadius:8,padding:"7px 11px",color:"#9aa0a6",cursor:"pointer",flexShrink:0 }}>✕</button>
          </div>
        </div>
      )}

      {/* BODY */}
      <div style={{ flex:1,display:"flex",overflow:"hidden",gap:8,padding:8,minHeight:0 }}>

        {/* VIDEO GRID */}
        <div style={{ flex:1,display:"grid",gap:8,alignContent:"center",overflow:"hidden",minWidth:0,gridTemplateColumns:`repeat(${cols},1fr)` }}>

          {/* Tile local admin */}
          {myRole==="host" ? (
            <Tile localRef={localVid} isLocal muted name={myName} role="host" camOff={!camOn} micOn={micOn} screenShare={screenOn} />
          ) : (
            // Tile local guest (avatar)
            <div style={{ position:"relative",background:"#111",borderRadius:14,overflow:"hidden",aspectRatio:"16/9",minHeight:90 }}>
              <div style={{ position:"absolute",inset:0,display:"flex",alignItems:"center",justifyContent:"center",flexDirection:"column",gap:10,background:"radial-gradient(circle at 35% 30%,#1a1a2e,#0d0d1a)" }}>
                <div style={{ width:64,height:64,borderRadius:"50%",display:"flex",alignItems:"center",justifyContent:"center",fontSize:22,fontWeight:800,color:"#fff",background:"linear-gradient(135deg,#34a853,#1a6e38)" }}>
                  {myName.split(" ").map(w=>w[0]).join("").slice(0,2).toUpperCase()}
                </div>
                <span style={{ color:"#9aa0a6",fontSize:11,background:"rgba(0,0,0,.5)",padding:"4px 12px",borderRadius:20 }}>{micOn?"🎤 Micro actif":"🔇 Muet"}</span>
              </div>
              <div style={{ position:"absolute",bottom:8,left:8 }}>
                <span style={{ background:"rgba(0,0,0,.75)",color:"#fff",fontSize:11,padding:"3px 9px",borderRadius:7 }}>{myName} (Vous)</span>
              </div>
              {hand && <div style={{ position:"absolute",top:8,left:8,fontSize:20,animation:"wave .7s infinite" }}>✋</div>}
            </div>
          )}

          {/* Tiles des autres */}
          {visiblePeers.map(p => (
            <Tile key={p.id} stream={p.stream}
              name={nameMap.current[p.id]||p.name||"Invité"}
              role={ptcps.find(x=>x.socketId===p.id)?.role||roleMap.current[p.id]||"guest"}
              camOff={pState[p.id]?.video===false}
              hand={pState[p.id]?.hand}
              screenShare={pState[p.id]?.screen}
              micOn={pState[p.id]?.audio!==false}
              muted={false} />
          ))}

          {/* Attente admin pour les jeunes */}
          {myRole==="guest" && visiblePeers.length===0 && (
            <div style={{ display:"flex",alignItems:"center",justifyContent:"center",flexDirection:"column",gap:14,minHeight:300,background:"rgba(255,255,255,.02)",borderRadius:14,border:"1px dashed rgba(255,255,255,.1)" }}>
              <div style={{ width:44,height:44,border:"3px solid rgba(255,255,255,.1)",borderTopColor:"#8ab4f8",borderRadius:"50%",animation:"spin .8s linear infinite" }} />
              <p style={{ color:"#9aa0a6",fontSize:14 }}>En attente du flux vidéo de l'admin…</p>
              <p style={{ color:"#5f6368",fontSize:12 }}>La vidéo apparaîtra automatiquement</p>
            </div>
          )}
        </div>

        {/* CHAT */}
        {chatOpen && (
          <div style={{ width:320,background:"#2d2f31",borderRadius:14,border:"1px solid rgba(255,255,255,.06)",display:"flex",flexDirection:"column",overflow:"hidden",flexShrink:0,animation:"slideIn .25s ease" }}>
            <div style={{ padding:"12px 14px",borderBottom:"1px solid rgba(255,255,255,.06)",display:"flex",justifyContent:"space-between",alignItems:"center" }}>
              <span style={{ color:"#e8eaed",fontWeight:700,fontSize:13 }}>💬 Chat en direct</span>
              <button onClick={()=>setChatOpen(false)} style={{ background:"none",border:"none",color:"#5f6368",cursor:"pointer",fontSize:16 }}>✕</button>
            </div>
            <div style={{ flex:1,overflowY:"auto",padding:10,display:"flex",flexDirection:"column",gap:8,minHeight:0 }}>
              {msgs.length===0 && <div style={{ color:"#5f6368",textAlign:"center",padding:"30px 16px",fontSize:13 }}><div style={{ fontSize:36,marginBottom:8 }}>💬</div>Pas encore de messages…</div>}
              {msgs.map(m => {
                const isMe = m.user===myName;
                return (
                  <div key={m.id} style={{ alignSelf:isMe?"flex-end":"flex-start",maxWidth:"88%",animation:"fadeIn .2s ease" }}>
                    {!isMe && <div style={{ fontSize:10,color:"#9aa0a6",marginBottom:3,display:"flex",alignItems:"center",gap:4 }}>{m.role==="host"&&<span style={{ background:"#1a73e8",color:"#fff",padding:"1px 5px",borderRadius:4,fontSize:9 }}>ADMIN</span>}{m.user}</div>}
                    <div style={{ padding:"8px 12px",borderRadius:12,fontSize:13,lineHeight:1.6,wordBreak:"break-word",background:isMe?"linear-gradient(135deg,#7c3aed,#5b21b6)":"rgba(255,255,255,.09)" }}>{m.text}</div>
                    <div style={{ fontSize:10,color:"#5f6368",marginTop:2,textAlign:isMe?"right":"left" }}>{m.time}</div>
                  </div>
                );
              })}
              <div ref={chatEnd} />
            </div>
            <div style={{ display:"flex",gap:6,padding:"8px 10px",borderTop:"1px solid rgba(255,255,255,.06)" }}>
              <input value={chatInput} onChange={e=>setChatInput(e.target.value)} onKeyDown={e=>e.key==="Enter"&&!e.shiftKey&&sendMsg()}
                placeholder="Message à tous…" style={{ flex:1,background:"rgba(255,255,255,.06)",border:"1px solid rgba(255,255,255,.1)",borderRadius:20,padding:"8px 13px",color:"#e8eaed",fontSize:13,outline:"none",fontFamily:"inherit" }} />
              <button onClick={sendMsg} style={{ background:"#7c3aed",border:"none",borderRadius:"50%",width:36,height:36,color:"#fff",cursor:"pointer",fontSize:14,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0 }}>➤</button>
            </div>
          </div>
        )}

        {/* PARTICIPANTS */}
        {partOpen && (
          <div style={{ width:300,background:"#2d2f31",borderRadius:14,border:"1px solid rgba(255,255,255,.06)",display:"flex",flexDirection:"column",overflow:"hidden",flexShrink:0,animation:"slideIn .25s ease" }}>
            <div style={{ padding:"12px 14px",borderBottom:"1px solid rgba(255,255,255,.06)",display:"flex",justifyContent:"space-between",alignItems:"center" }}>
              <span style={{ color:"#e8eaed",fontWeight:700,fontSize:13 }}>👥 Participants ({ptcps.length})</span>
              <button onClick={()=>setPartOpen(false)} style={{ background:"none",border:"none",color:"#5f6368",cursor:"pointer",fontSize:16 }}>✕</button>
            </div>
            <div style={{ flex:1,overflowY:"auto",padding:8 }}>
              {ptcps.map(p => (
                <div key={p.socketId} style={{ display:"flex",alignItems:"center",gap:8,padding:"8px 4px",borderBottom:"1px solid rgba(255,255,255,.04)" }}>
                  <div style={{ width:34,height:34,borderRadius:"50%",display:"flex",alignItems:"center",justifyContent:"center",fontWeight:800,fontSize:12,flexShrink:0,color:"#fff",background:p.role==="host"?"linear-gradient(135deg,#1a73e8,#0d47a1)":"linear-gradient(135deg,#34a853,#1a6e38)" }}>
                    {(p.userName||"?")[0].toUpperCase()}
                  </div>
                  <div style={{ flex:1,minWidth:0 }}>
                    <div style={{ color:"#e8eaed",fontSize:13,fontWeight:600,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap" }}>{p.userName}{p.role==="host"&&" 👑"}</div>
                    <div style={{ color:"#9aa0a6",fontSize:10,display:"flex",gap:4 }}>{p.audioOn===false&&<span>🔇</span>}{p.videoOn===false&&<span>📷</span>}{p.handRaised&&<span>✋</span>}</div>
                  </div>
                  {myRole==="host" && p.socketId!==sockRef.current?.id && (
                    <div style={{ display:"flex",gap:3 }}>
                      <button title="Autoriser micro" onClick={()=>adminAllowMic(p.socketId)} style={{ background:"rgba(52,168,83,.15)",border:"1px solid rgba(52,168,83,.3)",borderRadius:6,color:"#34a853",padding:"4px 7px",cursor:"pointer",fontSize:11 }}>🎤</button>
                      <button title="Couper micro"    onClick={()=>adminMute(p.socketId,"audio")} style={{ background:"rgba(251,188,4,.1)",border:"1px solid rgba(251,188,4,.3)",borderRadius:6,color:"#fbbc04",padding:"4px 7px",cursor:"pointer",fontSize:11 }}>🔇</button>
                      <button title="Retirer"         onClick={()=>adminKick(p.socketId)}          style={{ background:"rgba(234,67,53,.1)",border:"1px solid rgba(234,67,53,.3)",borderRadius:6,color:"#ea4335",padding:"4px 7px",cursor:"pointer",fontSize:11 }}>🚪</button>
                      <button title="Bloquer"         onClick={()=>adminBlock(p.socketId)}         style={{ background:"rgba(234,67,53,.2)",border:"1px solid rgba(234,67,53,.5)",borderRadius:6,color:"#ea4335",padding:"4px 7px",cursor:"pointer",fontSize:11,fontWeight:700 }}>🚫</button>
                    </div>
                  )}
                </div>
              ))}
            </div>
            {myRole==="host" && (
              <div style={{ padding:10,borderTop:"1px solid rgba(255,255,255,.06)" }}>
                <button onClick={muteAll} style={{ background:"rgba(234,67,53,.1)",border:"1px solid rgba(234,67,53,.25)",borderRadius:8,color:"#ea4335",padding:"8px 12px",cursor:"pointer",fontWeight:600,fontSize:12,width:"100%" }}>🔇 Couper tous les micros</button>
              </div>
            )}
          </div>
        )}

        {/* AI PANEL */}
        {aiOpen && (
          <div style={{ width:320,background:"#2d2f31",borderRadius:14,border:"1px solid rgba(255,255,255,.06)",display:"flex",flexDirection:"column",overflow:"hidden",flexShrink:0,animation:"slideIn .25s ease" }}>
            <div style={{ padding:"12px 14px",borderBottom:"1px solid rgba(255,255,255,.06)",display:"flex",justifyContent:"space-between",alignItems:"center" }}>
              <span style={{ color:"#a8c7fa",fontWeight:700,fontSize:13 }}>✨ Résumé IA</span>
              <button onClick={()=>setAiOpen(false)} style={{ background:"none",border:"none",color:"#5f6368",cursor:"pointer",fontSize:16 }}>✕</button>
            </div>
            <div style={{ flex:1,overflowY:"auto",padding:14 }}>
              {aiLoading ? (
                <div style={{ textAlign:"center",padding:"40px 20px" }}><div style={{ width:44,height:44,border:"3px solid rgba(255,255,255,.1)",borderTopColor:"#8ab4f8",borderRadius:"50%",animation:"spin .8s linear infinite",margin:"0 auto 16px" }} /><p style={{ color:"#9aa0a6",fontSize:13 }}>Génération en cours…</p></div>
              ) : aiText ? (
                <div>
                  <div style={{ color:"#e8eaed",fontSize:13,lineHeight:1.8,whiteSpace:"pre-wrap" }}>{aiText}</div>
                  <button onClick={()=>{navigator.clipboard.writeText(aiText);showToast("Copié !","#34a853","📋");}} style={{ background:"#1a73e8",color:"#fff",border:"none",padding:"10px 16px",borderRadius:10,cursor:"pointer",fontWeight:700,fontSize:12,width:"100%",marginTop:12 }}>📋 Copier</button>
                </div>
              ) : (
                <div style={{ textAlign:"center",padding:"20px 10px" }}>
                  <div style={{ fontSize:52,marginBottom:14 }}>🤖</div>
                  <p style={{ color:"#9aa0a6",fontSize:13,marginBottom:20,lineHeight:1.7 }}>L'IA générera un résumé complet du live.</p>
                  {myRole==="host" && <button onClick={()=>setEndModal(true)} style={{ background:"linear-gradient(135deg,#1a73e8,#0d47a1)",color:"#fff",border:"none",padding:"12px 20px",borderRadius:12,cursor:"pointer",fontWeight:700,fontSize:13,width:"100%" }}>✨ Terminer + Résumé</button>}
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* FLOATS */}
      {floats.length>0 && <div style={{ position:"fixed",bottom:100,left:"50%",transform:"translateX(-50%)",display:"flex",gap:16,pointerEvents:"none",zIndex:60 }}>{floats.map(f=><div key={f.id} style={{ display:"flex",flexDirection:"column",alignItems:"center",animation:"floatUp 3s ease-out forwards" }}><span style={{ fontSize:36 }}>{f.emoji}</span><span style={{ color:"#9aa0a6",fontSize:10 }}>{f.n}</span></div>)}</div>}

      {/* SUBTITLES */}
      {subsOn && subtitle && <div style={{ position:"fixed",bottom:90,left:"50%",transform:"translateX(-50%)",background:"rgba(0,0,0,.9)",color:"#fff",padding:"8px 22px",borderRadius:10,maxWidth:"62%",textAlign:"center",fontSize:14,zIndex:50 }}>{subtitle}</div>}

      {/* EMOJI */}
      {emojiOpen && <div style={{ position:"fixed",bottom:92,left:"50%",transform:"translateX(-50%)",background:"#2d2f31",border:"1px solid rgba(255,255,255,.1)",borderRadius:16,padding:"10px 14px",display:"flex",gap:6,flexWrap:"wrap",zIndex:70,boxShadow:"0 8px 32px rgba(0,0,0,.6)",animation:"popIn .2s ease",maxWidth:280,justifyContent:"center" }}>{["👍","❤️","😂","🎉","🔥","👏","🙌","💯","😮","🤔","👎","🌟"].map(e=><button key={e} onClick={()=>sendReaction(e)} style={{ background:"none",border:"none",fontSize:26,cursor:"pointer",borderRadius:8,padding:"4px 6px" }}>{e}</button>)}</div>}

      {/* CONTROLS */}
      <div style={{ background:"#2d2f31",padding:"10px 16px",display:"flex",alignItems:"center",justifyContent:"space-between",gap:8,flexShrink:0,flexWrap:"wrap",borderTop:"1px solid rgba(255,255,255,.05)" }}>
        <div style={{ display:"flex",gap:5 }}>
          <Btn icon={micOn?"🎤":"🔇"} label={micOn?"Micro":"Muet"} onClick={toggleMic} active={micOn} />
          {myRole==="host" && <Btn icon={camOn?"📷":"🚫"} label={camOn?"Caméra":"Off"} onClick={toggleCam} active={camOn} />}
        </div>
        <div style={{ display:"flex",gap:5 }}>
          {myRole==="host" && <Btn icon="🖥️" label={screenOn?"Arrêter":"Partager"} onClick={toggleScreen} active={!screenOn} />}
          {myRole==="guest" && <Btn icon="✋" label={hand?"Baisser":"Main"} onClick={toggleHand} active={!hand} pulse={hand} />}
          <Btn icon="😄" label="Réactions" onClick={()=>setEmojiOpen(o=>!o)} active />
          <Btn icon="💬" label="Chat" onClick={()=>{setChatOpen(o=>!o);setUnread(0);setPartOpen(false);setAiOpen(false);}} active badge={unread} />
          {myRole==="host" && <Btn icon="👥" label="Membres" onClick={()=>{setPartOpen(o=>!o);setChatOpen(false);setAiOpen(false);}} active />}
        </div>
        <div style={{ display:"flex",gap:5 }}>
          <button className="cbtn" onClick={()=>setSubsOn(o=>!o)} style={{ border:"none",borderRadius:13,padding:"10px 15px",color:"#fff",cursor:"pointer",display:"flex",flexDirection:"column",alignItems:"center",gap:3,minWidth:62,background:subsOn?"#1a73e8":"rgba(255,255,255,.1)" }}>
            <span style={{ fontSize:13,fontWeight:900,fontFamily:"monospace" }}>CC</span>
            <span style={{ fontSize:10,fontWeight:600 }}>Sous-titres</span>
          </button>
          {myRole==="host" && <Btn icon="✨" label="Résumé IA" onClick={()=>{setAiOpen(o=>!o);setChatOpen(false);setPartOpen(false);}} active />}
          {myRole==="host"
            ? <Btn icon="⏹️" label="Terminer" onClick={()=>setEndModal(true)} danger />
            : <Btn icon="🚪" label="Quitter"  onClick={()=>{cleanup();navigate("/jeune");}} danger />
          }
        </div>
      </div>
    </div>
  );
}