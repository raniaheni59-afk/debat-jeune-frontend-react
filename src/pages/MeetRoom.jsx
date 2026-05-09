import { useEffect, useRef, useState, useCallback } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import { io } from "socket.io-client";

const SOCKET_URL = "https://debat-jeune-production.up.railway.app";

/* ── Subtitles via Web Speech API ── */
function useSubtitles(enabled, lang) {
  const [text, setText] = useState("");
  const recRef = useRef(null);
  useEffect(() => {
    if (!enabled) { setText(""); return; }
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) return;
    const r = new SR();
    r.continuous = true; r.interimResults = true;
    r.lang = lang === "ar" ? "ar-TN" : lang === "en" ? "en-US" : "fr-FR";
    r.onresult = (e) => setText(Array.from(e.results).map(x => x[0].transcript).join(" "));
    r.start(); recRef.current = r;
    return () => { try { r.stop(); } catch {} };
  }, [enabled, lang]);
  return text;
}

/* ── Video tile ── */
function Tile({ stream, muted = false, name = "?", role = "guest", videoOff = false, hand = false, isLocal = false, localRef }) {
  const ref = useRef(null);
  const vRef = isLocal ? localRef : ref;
  useEffect(() => { if (vRef?.current && stream) vRef.current.srcObject = stream; }, [stream]);
  const init = (name || "?").split(" ").map(w => w[0]).join("").slice(0, 2).toUpperCase();
  return (
    <div style={T.wrap}>
      <video ref={vRef} autoPlay playsInline muted={muted}
        style={{ ...T.vid, display: (!videoOff && (stream || isLocal)) ? "block" : "none" }} />
      {(videoOff || (!stream && !isLocal)) && (
        <div style={T.avatarBox}>
          <div style={{ ...T.avatar, background: role === "host" ? "#7c3aed" : "#1e40af" }}>{init}</div>
        </div>
      )}
      <div style={T.foot}>
        {role === "host" && <span style={T.badge}>HOST</span>}
        <span style={T.name}>{isLocal ? `${name} (Vous)` : name}</span>
        {hand && <span>✋</span>}
      </div>
    </div>
  );
}
const T = {
  wrap: { position: "relative", background: "#0d1117", borderRadius: 14, overflow: "hidden", aspectRatio: "16/9", minHeight: 160 },
  vid:  { width: "100%", height: "100%", objectFit: "cover" },
  avatarBox: { position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", background: "#161b22" },
  avatar: { width: 60, height: 60, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20, fontWeight: 800, color: "#fff" },
  foot: { position: "absolute", bottom: 8, left: 8, display: "flex", gap: 6, alignItems: "center" },
  badge: { background: "#7c3aed", color: "#fff", fontSize: 9, fontWeight: 800, padding: "2px 8px", borderRadius: 20, letterSpacing: 1 },
  name: { background: "rgba(0,0,0,.65)", color: "#fff", fontSize: 12, padding: "3px 9px", borderRadius: 8 },
};

/* ── Control button ── */
function Btn({ icon, label, onClick, danger, active = true, badge }) {
  return (
    <button onClick={onClick} style={{ ...B.btn, background: !active ? "#ef4444" : danger ? "#ef4444" : "rgba(255,255,255,.1)" }}>
      <span style={{ fontSize: 20 }}>{icon}</span>
      <span style={B.lbl}>{label}</span>
      {badge > 0 && <span style={B.badge}>{badge}</span>}
    </button>
  );
}
const B = {
  btn: { border: "none", borderRadius: 14, padding: "10px 14px", color: "#fff", cursor: "pointer", display: "flex", flexDirection: "column", alignItems: "center", gap: 3, minWidth: 60, transition: "background .2s", position: "relative" },
  lbl: { fontSize: 10, fontWeight: 600, whiteSpace: "nowrap" },
  badge: { position: "absolute", top: -4, right: -4, background: "#ef4444", color: "#fff", borderRadius: "50%", width: 18, height: 18, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 10, fontWeight: 800 },
};

/* ══════════════════════════════════════════════════════════════════════════════
   MAIN
══════════════════════════════════════════════════════════════════════════════ */
export default function MeetRoom() {
  const { roomCode }  = useParams();
  const [sp]          = useSearchParams();
  const navigate      = useNavigate();

  const token  = sp.get("at") || sp.get("vt") || "";
  const myRole = sp.get("at") ? "host" : "guest";
  const user   = JSON.parse(localStorage.getItem("user") || "{}");
  const myName = user?.nom_user || user?.name || "Invité";

  /* state */
  const [status,     setStatus]    = useState("loading");   // loading | ok | error
  const [errorMsg,   setErrorMsg]  = useState("");
  const [audioOn,    setAudioOn]   = useState(true);
  const [videoOn,    setVideoOn]   = useState(true);
  const [hand,       setHand]      = useState(false);
  const [screen,     setScreen]    = useState(false);
  const [subs,       setSubs]      = useState(false);
  const [subLang,    setSubLang]   = useState("fr");
  const [chatOpen,   setChatOpen]  = useState(false);
  const [panelOpen,  setPanelOpen] = useState(false);
  const [msgs,       setMsgs]      = useState([]);
  const [input,      setInput]     = useState("");
  const [unread,     setUnread]    = useState(0);
  const [peers,      setPeers]     = useState([]);
  const [pMedia,     setPMedia]    = useState({});
  const [ptcps,      setPtcps]     = useState([]);
  const [floats,     setFloats]    = useState([]);
  const [copied,     setCopied]    = useState(false);

  /* refs */
  const sockRef    = useRef(null);
  const localVid   = useRef(null);
  const localStr   = useRef(null);
  const screenStr  = useRef(null);
  const peerMap    = useRef({});
  const nameMap    = useRef({});
  const chatEnd    = useRef(null);

  const subtitle = useSubtitles(subs, subLang);

  /* ── createPeer ── */
  const createPeer = useCallback((tid) => {
    const pc = new RTCPeerConnection({ iceServers: [{ urls: "stun:stun.l.google.com:19302" }] });
    pc.onicecandidate = e => e.candidate && sockRef.current?.emit("ice-candidate", { target: tid, candidate: e.candidate });
    pc.ontrack = e => {
      const st = e.streams[0];
      setPeers(prev => {
        const ex = prev.find(p => p.id === tid);
        return ex ? prev.map(p => p.id === tid ? { ...p, stream: st } : p)
                  : [...prev, { id: tid, stream: st, name: nameMap.current[tid] || "Invité" }];
      });
    };
    localStr.current?.getTracks().forEach(t => pc.addTrack(t, localStr.current));
    return pc;
  }, []);

  /* ── init ── */
  useEffect(() => {
    if (!token) { setErrorMsg("Token manquant"); setStatus("error"); return; }
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
          const pc = createPeer(u.socketId); peerMap.current[u.socketId] = pc;
          const offer = await pc.createOffer();
          await pc.setLocalDescription(offer);
          sock.emit("offer", { target: u.socketId, sdp: offer });
        }
      });

      sock.on("user-joined", ({ socketId, userName: n }) => { nameMap.current[socketId] = n; });

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
        peerMap.current[socketId]?.close(); delete peerMap.current[socketId];
        setPeers(prev => prev.filter(p => p.id !== socketId));
      });

      sock.on("user-media-toggled", ({ socketId, type, enabled }) => {
        setPMedia(prev => ({ ...prev, [socketId]: { ...prev[socketId], [type]: enabled } }));
      });

      sock.on("participants-update", setPtcps);

      sock.on("receive-message", msg => {
        setMsgs(prev => [...prev, msg]);
        setChatOpen(o => { if (!o) setUnread(n => n + 1); return o; });
      });

      sock.on("reaction", ({ userName: n, emoji }) => {
        const id = Date.now() + Math.random();
        setFloats(prev => [...prev, { id, n, emoji }]);
        setTimeout(() => setFloats(prev => prev.filter(f => f.id !== id)), 3000);
      });

      sock.on("hand-raised", ({ socketId, raised }) => {
        setPMedia(prev => ({ ...prev, [socketId]: { ...prev[socketId], hand: raised } }));
      });

      sock.on("force-mute", ({ type }) => {
        const trk = type === "audio" ? localStr.current?.getAudioTracks()[0] : localStr.current?.getVideoTracks()[0];
        if (trk) { trk.enabled = false; type === "audio" ? setAudioOn(false) : setVideoOn(false); }
      });

      sock.on("force-kicked", () => { alert("Vous avez été retiré."); cleanup(); navigate(-1); });
      sock.on("live-ended",   () => { alert("Le live est terminé."); cleanup(); navigate(-1); });
    })();

    return () => { alive = false; cleanup(); };
  }, [roomCode, token, myRole, myName, createPeer]);

  useEffect(() => { chatEnd.current?.scrollIntoView({ behavior: "smooth" }); }, [msgs]);

  /* ── helpers ── */
  const cleanup = () => {
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
  };

  const toggleScreen = async () => {
    if (screen) {
      screenStr.current?.getTracks().forEach(t => t.stop()); screenStr.current = null; setScreen(false);
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
          const s = pc.getSenders().find(s => s.track?.kind === "video"); if (s) s.replaceTrack(trk);
        });
        trk.onended = toggleScreen;
        setScreen(true); emit("screen-share-started", { roomCode });
      } catch {}
    }
  };

  const sendReaction = (e) => {
    emit("send-reaction", { roomCode, emoji: e });
    const id = Date.now(); setFloats(prev => [...prev, { id, n: "Vous", emoji: e }]);
    setTimeout(() => setFloats(prev => prev.filter(f => f.id !== id)), 3000);
  };

  const sendMsg = () => {
    if (!input.trim()) return;
    emit("send-message", { roomCode, message: input }); setInput("");
  };

  const copyLink = async () => {
    const lnk = localStorage.getItem("currentLiveViewerLink") || window.location.href;
    await navigator.clipboard.writeText(lnk).catch(() => {});
    setCopied(true); setTimeout(() => setCopied(false), 2000);
  };

  /* ── grid calc ── */
  const total = 1 + peers.length;
  const cols  = total <= 1 ? 1 : total <= 4 ? 2 : total <= 9 ? 3 : 4;

  /* ── render states ── */
  if (status === "loading") return (
    <div style={S.center}>
      <div style={{ textAlign: "center" }}>
        <div style={S.spin} />
        <p style={{ color: "#94a3b8", marginTop: 16 }}>Connexion…</p>
      </div>
    </div>
  );

  if (status === "error") return (
    <div style={S.center}>
      <div style={S.errCard}>
        <div style={{ fontSize: 48 }}>🚫</div>
        <p style={{ color: "#f1f5f9", fontWeight: 700, margin: "12px 0" }}>{errorMsg}</p>
        <button onClick={() => navigate(-1)} style={S.backBtn}>← Retour</button>
      </div>
    </div>
  );

  /* ─────────────────────────────────────────────────────────────── */
  return (
    <div style={S.page}>
      {/* HEADER */}
      <div style={S.hdr}>
        <span style={S.hdrTitle}>🎥 Swafy Meet</span>
        <span style={S.hdrSub}>{roomCode} · {myRole === "host" ? "👑 Hôte" : "Participant"}</span>
        <div style={{ flex: 1 }} />
        <button onClick={copyLink} style={S.ghost}>{copied ? "✅ Copié" : "🔗 Partager"}</button>
      </div>

      {/* BODY */}
      <div style={S.body}>
        {/* VIDEO GRID */}
        <div style={{ ...S.grid, gridTemplateColumns: `repeat(${cols},1fr)` }}>
          <Tile localRef={localVid} isLocal muted name={myName} role={myRole} videoOff={!videoOn} hand={hand} />
          {peers.map(p => (
            <Tile key={p.id} stream={p.stream} name={p.name}
              role={ptcps.find(x => x.socketId === p.id)?.role || "guest"}
              videoOff={pMedia[p.id]?.video === false}
              hand={pMedia[p.id]?.hand} />
          ))}
        </div>

        {/* CHAT */}
        {chatOpen && (
          <div style={S.panel}>
            <div style={S.panHdr}>
              <b>💬 Chat</b>
              <button onClick={() => setChatOpen(false)} style={S.closeX}>✕</button>
            </div>
            <div style={S.msgList}>
              {msgs.map((m, i) => (
                <div key={i} style={{ alignSelf: m.user === myName ? "flex-end" : "flex-start", maxWidth: "80%" }}>
                  {m.user !== myName && <div style={S.msgUser}>{m.role === "host" ? "👑 " : ""}{m.user}</div>}
                  <div style={{ ...S.bubble, background: m.user === myName ? "#7c3aed" : "rgba(255,255,255,.1)" }}>{m.text}</div>
                  <div style={S.msgTime}>{m.time}</div>
                </div>
              ))}
              <div ref={chatEnd} />
            </div>
            <div style={S.chatRow}>
              <input value={input} onChange={e => setInput(e.target.value)}
                onKeyDown={e => e.key === "Enter" && sendMsg()}
                placeholder="Message…" style={S.chatIn} />
              <button onClick={sendMsg} style={S.sendBtn}>➤</button>
            </div>
          </div>
        )}

        {/* PARTICIPANTS */}
        {panelOpen && (
          <div style={S.panel}>
            <div style={S.panHdr}>
              <b>👥 Participants ({ptcps.length})</b>
              <button onClick={() => setPanelOpen(false)} style={S.closeX}>✕</button>
            </div>
            <div style={{ flex: 1, overflowY: "auto", padding: 10 }}>
              {ptcps.map(p => (
                <div key={p.socketId} style={S.pRow}>
                  <div style={{ ...S.pAv, background: p.role === "host" ? "#7c3aed" : "#1e40af" }}>
                    {(p.userName || "?")[0].toUpperCase()}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ color: "#f1f5f9", fontSize: 13, fontWeight: 600, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {p.userName} {p.role === "host" && "👑"}
                    </div>
                    <div style={{ color: "#64748b", fontSize: 11 }}>
                      {p.audioOn === false && "🔇 "}{p.videoOn === false && "📷 "}{p.handRaised && "✋"}
                    </div>
                  </div>
                  {myRole === "host" && p.socketId !== sockRef.current?.id && (
                    <div style={{ display: "flex", gap: 4 }}>
                      <button title="Couper micro" onClick={() => emit("admin-mute", { roomCode, targetSocketId: p.socketId, type: "audio" })} style={S.adminBtn}>🔇</button>
                      <button title="Couper caméra" onClick={() => emit("admin-mute", { roomCode, targetSocketId: p.socketId, type: "video" })} style={S.adminBtn}>📷</button>
                      <button title="Exclure" onClick={() => emit("admin-kick", { roomCode, targetSocketId: p.socketId })} style={{ ...S.adminBtn, color: "#f87171" }}>✕</button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* FLOATING REACTIONS */}
      <div style={S.floatZone}>
        {floats.map(f => <span key={f.id} style={S.float}>{f.emoji}</span>)}
      </div>

      {/* SUBTITLES */}
      {subs && subtitle && <div style={S.subBar}>{subtitle}</div>}

      {/* CONTROLS */}
      <div style={S.ctrl}>
        {/* Left group */}
        <div style={S.ctrlGrp}>
          <Btn icon={audioOn ? "🎤" : "🔇"} label={audioOn ? "Micro" : "Muet"} onClick={toggleAudio} active={audioOn} />
          <Btn icon={videoOn ? "📷" : "🚫"} label={videoOn ? "Caméra" : "Off"} onClick={toggleVideo} active={videoOn} />
          <Btn icon="🖥️" label={screen ? "Stop" : "Écran"} onClick={toggleScreen} active={!screen} />
          <Btn icon="✋" label={hand ? "Baisser" : "Main"} onClick={toggleHand} active={!hand} />
        </div>

        {/* Reactions */}
        <div style={S.emojiRow}>
          {["👍","❤️","😂","🎉","🔥","👏"].map(e => (
            <button key={e} onClick={() => sendReaction(e)} style={S.emojiBt}>{e}</button>
          ))}
        </div>

        {/* Right group */}
        <div style={S.ctrlGrp}>
          <Btn icon="💬" label="Chat" onClick={() => { setChatOpen(o => !o); setUnread(0); }} active badge={unread} />
          <Btn icon="👥" label="Membres" onClick={() => setPanelOpen(o => !o)} active />
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 2 }}>
            <button onClick={() => setSubs(o => !o)} style={{ ...B.btn, background: subs ? "#7c3aed" : "rgba(255,255,255,.1)", padding: "8px 12px" }}>
              <span style={{ fontSize: 14, fontWeight: 800 }}>CC</span>
              <span style={B.lbl}>Sous-titres</span>
            </button>
            {subs && (
              <select value={subLang} onChange={e => setSubLang(e.target.value)} style={S.langSel}>
                <option value="fr">🇫🇷 FR</option>
                <option value="ar">🇹🇳 AR</option>
                <option value="en">🇬🇧 EN</option>
              </select>
            )}
          </div>
          <Btn icon="🚪" label="Quitter" onClick={() => { cleanup(); navigate(-1); }} danger />
        </div>
      </div>
    </div>
  );
}

const S = {
  page:    { minHeight: "100vh", background: "linear-gradient(160deg,#0a0a1a,#111827)", display: "flex", flexDirection: "column", fontFamily: "'DM Sans',sans-serif", color: "#fff", overflow: "hidden" },
  center:  { minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "#0a0a1a" },
  spin:    { width: 44, height: 44, border: "3px solid rgba(255,255,255,.15)", borderTopColor: "#a78bfa", borderRadius: "50%", animation: "spin 0.8s linear infinite", margin: "0 auto" },
  errCard: { background: "rgba(255,255,255,.05)", border: "1px solid rgba(255,255,255,.1)", borderRadius: 20, padding: 40, textAlign: "center" },
  backBtn: { marginTop: 12, background: "#7c3aed", color: "#fff", border: "none", padding: "10px 24px", borderRadius: 10, cursor: "pointer", fontWeight: 700 },
  hdr:     { display: "flex", alignItems: "center", gap: 12, padding: "10px 20px", background: "rgba(0,0,0,.45)", backdropFilter: "blur(12px)", flexShrink: 0 },
  hdrTitle:{ fontWeight: 800, fontSize: 15 },
  hdrSub:  { color: "#94a3b8", fontSize: 12 },
  ghost:   { background: "rgba(255,255,255,.08)", border: "1px solid rgba(255,255,255,.12)", color: "#fff", padding: "6px 14px", borderRadius: 8, cursor: "pointer", fontSize: 12 },
  body:    { flex: 1, display: "flex", overflow: "hidden", gap: 8, padding: 8 },
  grid:    { flex: 1, display: "grid", gap: 8, alignContent: "center", overflow: "hidden" },
  panel:   { width: 310, background: "rgba(0,0,0,.55)", backdropFilter: "blur(16px)", borderRadius: 14, border: "1px solid rgba(255,255,255,.07)", display: "flex", flexDirection: "column", overflow: "hidden", flexShrink: 0 },
  panHdr:  { padding: "12px 14px", borderBottom: "1px solid rgba(255,255,255,.07)", display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: 13 },
  closeX:  { background: "none", border: "none", color: "#64748b", cursor: "pointer", fontSize: 16 },
  msgList: { flex: 1, overflowY: "auto", padding: 10, display: "flex", flexDirection: "column", gap: 8 },
  msgUser: { fontSize: 10, color: "#64748b", marginBottom: 2 },
  bubble:  { padding: "8px 11px", borderRadius: 11, fontSize: 13, lineHeight: 1.5 },
  msgTime: { fontSize: 10, color: "#475569", marginTop: 2, textAlign: "right" },
  chatRow: { display: "flex", gap: 6, padding: 8, borderTop: "1px solid rgba(255,255,255,.07)" },
  chatIn:  { flex: 1, background: "rgba(255,255,255,.07)", border: "none", borderRadius: 20, padding: "8px 13px", color: "#fff", fontSize: 13, outline: "none" },
  sendBtn: { background: "#7c3aed", border: "none", borderRadius: "50%", width: 34, height: 34, color: "#fff", cursor: "pointer", fontSize: 14, flexShrink: 0 },
  pRow:    { display: "flex", alignItems: "center", gap: 8, padding: "7px 2px", borderBottom: "1px solid rgba(255,255,255,.04)" },
  pAv:     { width: 34, height: 34, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 800, fontSize: 13, flexShrink: 0 },
  adminBtn:{ background: "rgba(255,255,255,.07)", border: "none", borderRadius: 6, color: "#fff", padding: "4px 6px", cursor: "pointer", fontSize: 13 },
  floatZone:{ position: "fixed", bottom: 90, left: "50%", transform: "translateX(-50%)", display: "flex", gap: 10, pointerEvents: "none", zIndex: 60 },
  float:   { fontSize: 34, animation: "floatUp 3s ease-out forwards" },
  subBar:  { position: "fixed", bottom: 78, left: "50%", transform: "translateX(-50%)", background: "rgba(0,0,0,.85)", color: "#fff", padding: "7px 18px", borderRadius: 8, maxWidth: "65%", textAlign: "center", fontSize: 14, zIndex: 50 },
  ctrl:    { background: "rgba(0,0,0,.55)", backdropFilter: "blur(16px)", padding: "8px 16px", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8, flexShrink: 0, flexWrap: "wrap" },
  ctrlGrp: { display: "flex", gap: 4, alignItems: "flex-end" },
  emojiRow:{ display: "flex", gap: 4 },
  emojiBt: { background: "rgba(255,255,255,.07)", border: "none", borderRadius: 8, padding: "7px 10px", cursor: "pointer", fontSize: 20, transition: "transform .1s" },
  langSel: { background: "rgba(255,255,255,.08)", border: "none", color: "#fff", padding: "3px 6px", borderRadius: 6, fontSize: 11, cursor: "pointer" },
};