
import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { io } from "socket.io-client";
import API from "../services/api";

const SOCKET_URL = "https://swafy-backend.onrender.com";

// ── هل المستخدم مسجل؟ ──────────────────────────────────────────────────────
function useAuth() {
  const raw  = localStorage.getItem("user");
  const user = raw ? JSON.parse(raw) : null;
  const token = localStorage.getItem("token");
  return { user, token, isLoggedIn: !!(user && token) };
}

// ── Reaction badge ──────────────────────────────────────────────────────────
const REACTIONS = ["👍","❤️","😂","🎉","🔥","💬"];

export default function LiveSection() {
  const navigate = useNavigate();
  const { user, token, isLoggedIn } = useAuth();

  const [activeLive, setActiveLive]   = useState(null);   // { roomCode, hostName, viewerLink }
  const [liveAlert,  setLiveAlert]    = useState(false);  // notification banner
  const [comments,   setComments]     = useState([]);
  const [input,      setInput]        = useState("");
  const [reactions,  setReactions]    = useState({});     // { emoji: count }
  const [userRxn,    setUserRxn]      = useState(null);   // reaction choisie par user
  const [signupNudge,setSignupNudge]  = useState(false);  // modal inscription
  const [floats,     setFloats]       = useState([]);     // floating reactions

  const sockRef  = useRef(null);
  const chatEnd  = useRef(null);

  // ── Socket global (sans room) pour écouter "live-started" ────────────────
  useEffect(() => {
    const sock = io(SOCKET_URL, { transports: ["websocket"] });
    sockRef.current = sock;

    sock.on("live-started", ({ roomCode, hostName, viewerLink, startedAt }) => {
      setActiveLive({ roomCode, hostName, viewerLink, startedAt });
      setLiveAlert(true);
      setTimeout(() => setLiveAlert(false), 8000);
    });

    sock.on("live-ended", ({ roomCode }) => {
      setActiveLive(prev => prev?.roomCode === roomCode ? null : prev);
    });

    // Charger les messages live en cours si déjà actif
    sock.on("receive-message", (msg) => {
      setComments(prev => [...prev, msg]);
      setTimeout(() => chatEnd.current?.scrollIntoView({ behavior: "smooth" }), 50);
    });

    sock.on("reaction", ({ emoji }) => {
      setReactions(prev => ({ ...prev, [emoji]: (prev[emoji] || 0) + 1 }));
      const id = Date.now() + Math.random();
      setFloats(prev => [...prev, { id, emoji }]);
      setTimeout(() => setFloats(prev => prev.filter(f => f.id !== id)), 3000);
    });

    return () => sock.disconnect();
  }, []);

  // ── Rejoindre le room de chat si live actif + user connecté ─────────────
  useEffect(() => {
    if (!activeLive || !sockRef.current) return;
    if (!isLoggedIn) return;

    const viewerToken = new URL(activeLive.viewerLink || window.location.href).searchParams.get("vt");
    if (!viewerToken) return;

    sockRef.current.emit("join-room", {
      roomCode: activeLive.roomCode,
      userName: user?.nom_user || "Invité",
      role: "guest",
      accessToken: viewerToken,
    });
  }, [activeLive, isLoggedIn]);

  // ── Charger live actif depuis API au démarrage ────────────────────────────
  useEffect(() => {
    API.get("/api/lives?active=1").then(res => {
      const live = res.data?.find?.(l => l.is_active);
      if (live) {
        setActiveLive({
          roomCode: live.room_code,
          hostName: live.host_name || "Admin",
          viewerLink: live.link,
          title: live.title,
          description: live.description,
        });
      }
    }).catch(() => {});
  }, []);

  // ── Envoyer commentaire ─────────────────────────────────────────────────
  const sendComment = () => {
    if (!isLoggedIn) { setSignupNudge(true); return; }
    if (!input.trim() || !activeLive) return;
    sockRef.current?.emit("send-message", { roomCode: activeLive.roomCode, message: input });
    setInput("");
  };

  // ── Reaction ────────────────────────────────────────────────────────────
  const sendReaction = (emoji) => {
    if (!isLoggedIn) { setSignupNudge(true); return; }
    if (!activeLive) return;
    setUserRxn(emoji);
    sockRef.current?.emit("send-reaction", { roomCode: activeLive.roomCode, emoji });
  };

  // ── Rejoindre le live (viewer) ──────────────────────────────────────────
  const joinLive = () => {
    if (!activeLive?.viewerLink) return;
    const url = new URL(activeLive.viewerLink);
    const code = url.pathname.split("/").pop();
    const vt   = url.searchParams.get("vt");
    if (code && vt) navigate(`/meet/${code}?vt=${vt}`);
    else navigate(url.pathname + url.search);
  };

  // ── NO LIVE ─────────────────────────────────────────────────────────────
  if (!activeLive) return (
    <div style={C.noLive}>
      <div style={C.noLiveInner}>
        <div style={C.noLiveIcon}>📡</div>
        <h3 style={C.noLiveTitle}>Aucun live en cours</h3>
        <p style={C.noLiveSub}>Restez connecté — vous serez notifié dès qu'un live commence.</p>
      </div>
    </div>
  );

  /* ────────────────────────────────────────────────────────────────────────
     LIVE ACTIF
  ──────────────────────────────────────────────────────────────────────── */
  return (
    <div style={C.wrap}>

      {/* ── NOTIFICATION BANNER ── */}
      {liveAlert && (
        <div style={C.alertBanner}>
          <span style={C.alertDot} />
          🎙️ <strong>{activeLive.hostName}</strong> a démarré un live !
          <button onClick={() => setLiveAlert(false)} style={C.alertClose}>✕</button>
        </div>
      )}

      {/* ── LIVE CARD ── */}
      <div style={C.card}>

        {/* LEFT — preview + info */}
        <div style={C.left}>
          {/* Video preview placeholder */}
          <div style={C.preview}>
            <div style={C.livePulse}><span style={C.liveDot} />🔴 EN DIRECT</div>
            <div style={C.previewCenter}>
              <div style={C.bigIcon}>🎥</div>
              <p style={{ color: "#94a3b8", marginTop: 8, fontSize: 14 }}>{activeLive.title || "Live en cours"}</p>
            </div>
            {/* Floating reactions */}
            <div style={C.floatZone}>
              {floats.map(f => <span key={f.id} style={C.float}>{f.emoji}</span>)}
            </div>
          </div>

          {/* Description */}
          {activeLive.description && (
            <p style={C.desc}>{activeLive.description}</p>
          )}

          {/* JOIN BUTTON */}
          <button onClick={joinLive} style={C.joinBtn}>
            ▶ Rejoindre le live
          </button>

          {/* Reactions bar */}
          <div style={C.rxnBar}>
            {REACTIONS.map(e => (
              <button key={e} onClick={() => sendReaction(e)}
                style={{ ...C.rxnBtn, background: userRxn === e ? "rgba(124,58,237,.4)" : "rgba(255,255,255,.06)", border: userRxn === e ? "1px solid #7c3aed" : "1px solid rgba(255,255,255,.08)" }}>
                {e} <span style={{ fontSize: 11, color: "#94a3b8" }}>{reactions[e] || ""}</span>
              </button>
            ))}
          </div>
        </div>

        {/* RIGHT — CHAT */}
        <div style={C.chatBox}>
          <div style={C.chatHead}>💬 Discussion en direct</div>

          <div style={C.msgList}>
            {comments.length === 0 && (
              <div style={{ color: "#475569", fontSize: 13, textAlign: "center", padding: 20 }}>
                Soyez le premier à écrire un message…
              </div>
            )}
            {comments.map((m, i) => (
              <div key={i} style={C.msgRow}>
                <div style={{ ...C.msgAv, background: m.role === "host" ? "#7c3aed" : "#1e3a5f" }}>
                  {(m.user || "?")[0].toUpperCase()}
                </div>
                <div style={{ flex: 1 }}>
                  <span style={{ color: m.role === "host" ? "#a78bfa" : "#60a5fa", fontWeight: 700, fontSize: 12 }}>
                    {m.role === "host" ? "👑 " : ""}{m.user}
                  </span>
                  <span style={{ color: "#e2e8f0", fontSize: 13, marginLeft: 6 }}>{m.text}</span>
                  <div style={{ color: "#475569", fontSize: 10, marginTop: 2 }}>{m.time}</div>
                </div>
              </div>
            ))}
            <div ref={chatEnd} />
          </div>

          {/* Input */}
          <div style={C.inputRow}>
            {isLoggedIn ? (
              <>
                <input value={input} onChange={e => setInput(e.target.value)}
                  onKeyDown={e => e.key === "Enter" && sendComment()}
                  placeholder="Écrire un commentaire…" style={C.inp} />
                <button onClick={sendComment} style={C.sendBtn}>➤</button>
              </>
            ) : (
              <button onClick={() => setSignupNudge(true)} style={C.loginPrompt}>
                🔒 Connectez-vous pour commenter
              </button>
            )}
          </div>
        </div>
      </div>

      {/* ── SIGNUP NUDGE MODAL ── */}
      {signupNudge && (
        <div style={C.overlay}>
          <div style={C.modal}>
            <div style={{ fontSize: 44, marginBottom: 12 }}>👋</div>
            <h3 style={{ color: "#f1f5f9", margin: "0 0 8px" }}>Rejoignez la discussion !</h3>
            <p style={{ color: "#94a3b8", fontSize: 14, margin: "0 0 24px", lineHeight: 1.6 }}>
              Créez un compte gratuit pour commenter, réagir et participer aux lives.
            </p>
            <div style={{ display: "flex", gap: 10 }}>
              <button onClick={() => navigate("/register")} style={C.modalPrimary}>S'inscrire</button>
              <button onClick={() => { navigate("/register"); setSignupNudge(false); }} style={C.modalPrimary}>Se connecter</button>
            </div>
            <button onClick={() => setSignupNudge(false)} style={C.modalGhost}>
              Continuer en visiteur (lecture seule)
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Styles ───────────────────────────────────────────────────────────────────
const C = {
  wrap:        { fontFamily: "'DM Sans',sans-serif", position: "relative" },
  noLive:      { display: "flex", alignItems: "center", justifyContent: "center", minHeight: 300, background: "rgba(255,255,255,.02)", borderRadius: 20, border: "1px dashed rgba(255,255,255,.1)" },
  noLiveInner: { textAlign: "center", padding: 40 },
  noLiveIcon:  { fontSize: 56, marginBottom: 12 },
  noLiveTitle: { color: "#f1f5f9", fontSize: 20, fontWeight: 800, margin: "0 0 8px" },
  noLiveSub:   { color: "#64748b", fontSize: 14 },

  alertBanner: { display: "flex", alignItems: "center", gap: 10, background: "linear-gradient(135deg,#7c3aed,#3b82f6)", borderRadius: 12, padding: "12px 18px", marginBottom: 16, animation: "slideDown .4s ease", color: "#fff", fontSize: 14, fontWeight: 500 },
  alertDot:    { width: 10, height: 10, background: "#f87171", borderRadius: "50%", animation: "pulse 1.2s infinite", flexShrink: 0 },
  alertClose:  { marginLeft: "auto", background: "none", border: "none", color: "rgba(255,255,255,.6)", cursor: "pointer", fontSize: 16 },

  card:        { display: "grid", gridTemplateColumns: "1fr 360px", gap: 16, minHeight: 520 },
  left:        { display: "flex", flexDirection: "column", gap: 14 },

  preview:     { background: "linear-gradient(160deg,#0f0c29,#1a1a3e)", borderRadius: 16, minHeight: 260, position: "relative", overflow: "hidden", display: "flex", alignItems: "center", justifyContent: "center", border: "1px solid rgba(255,255,255,.07)" },
  livePulse:   { position: "absolute", top: 12, left: 12, display: "flex", alignItems: "center", gap: 6, background: "rgba(239,68,68,.15)", border: "1px solid #ef4444", borderRadius: 20, padding: "4px 12px", color: "#f87171", fontSize: 11, fontWeight: 800, letterSpacing: 1 },
  liveDot:     { width: 8, height: 8, background: "#ef4444", borderRadius: "50%", display: "inline-block", animation: "pulse 1s infinite" },
  previewCenter:{ textAlign: "center" },
  bigIcon:     { fontSize: 64 },
  floatZone:   { position: "absolute", bottom: 16, left: "50%", transform: "translateX(-50%)", display: "flex", gap: 8, pointerEvents: "none" },
  float:       { fontSize: 28, animation: "floatUp 3s ease-out forwards" },

  desc:        { color: "#94a3b8", fontSize: 13, lineHeight: 1.7, padding: "0 4px" },

  joinBtn:     { background: "linear-gradient(135deg,#7c3aed,#3b82f6)", border: "none", borderRadius: 14, padding: "13px 0", color: "#fff", fontSize: 15, fontWeight: 800, cursor: "pointer", width: "100%", letterSpacing: .5, boxShadow: "0 8px 24px rgba(124,58,237,.35)", transition: "transform .2s" },

  rxnBar:      { display: "flex", gap: 6, flexWrap: "wrap" },
  rxnBtn:      { borderRadius: 20, padding: "6px 12px", cursor: "pointer", fontSize: 16, display: "flex", alignItems: "center", gap: 4, transition: "all .15s" },

  chatBox:     { background: "rgba(0,0,0,.4)", backdropFilter: "blur(16px)", borderRadius: 16, border: "1px solid rgba(255,255,255,.07)", display: "flex", flexDirection: "column", overflow: "hidden" },
  chatHead:    { padding: "14px 16px", borderBottom: "1px solid rgba(255,255,255,.06)", fontWeight: 700, fontSize: 14, color: "#f1f5f9" },
  msgList:     { flex: 1, overflowY: "auto", padding: "10px 12px", display: "flex", flexDirection: "column", gap: 10, minHeight: 0, maxHeight: 360 },
  msgRow:      { display: "flex", gap: 8, alignItems: "flex-start" },
  msgAv:       { width: 28, height: 28, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 800, fontSize: 11, flexShrink: 0, marginTop: 2 },
  inputRow:    { display: "flex", gap: 6, padding: 10, borderTop: "1px solid rgba(255,255,255,.06)" },
  inp:         { flex: 1, background: "rgba(255,255,255,.06)", border: "none", borderRadius: 20, padding: "9px 14px", color: "#fff", fontSize: 13, outline: "none" },
  sendBtn:     { background: "#7c3aed", border: "none", borderRadius: "50%", width: 36, height: 36, color: "#fff", cursor: "pointer", flexShrink: 0, fontSize: 14, display: "flex", alignItems: "center", justifyContent: "center" },
  loginPrompt: { flex: 1, background: "rgba(255,255,255,.05)", border: "1px solid rgba(255,255,255,.1)", borderRadius: 10, padding: "10px", color: "#94a3b8", cursor: "pointer", fontSize: 13, textAlign: "center" },

  overlay:     { position: "fixed", inset: 0, background: "rgba(0,0,0,.75)", backdropFilter: "blur(8px)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 999 },
  modal:       { background: "linear-gradient(145deg,#0f0c29,#1a1040)", border: "1px solid rgba(255,255,255,.1)", borderRadius: 22, padding: "44px 36px", maxWidth: 400, width: "90%", textAlign: "center", animation: "scaleIn .3s ease" },
  modalPrimary:{ background: "linear-gradient(135deg,#7c3aed,#3b82f6)", border: "none", borderRadius: 12, padding: "12px 28px", color: "#fff", fontWeight: 700, cursor: "pointer", fontSize: 14 },
  modalGhost:  { marginTop: 14, background: "none", border: "none", color: "#64748b", cursor: "pointer", fontSize: 13, display: "block", width: "100%", textAlign: "center" },
};