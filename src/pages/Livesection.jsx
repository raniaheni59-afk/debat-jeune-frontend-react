// Livesection.jsx — Espace jeune: live actif avec chat, réactions, notification
import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { io } from "socket.io-client";
import API from "../services/api";

const SOCKET_URL = "https://debat-jeune.onrender.com"; // ✅ FIX: bon backend
const REACTIONS  = ["👍","❤️","😂","🎉","🔥","💬","👏","🌟"];

function useAuth() {
  const raw   = localStorage.getItem("user");
  const user  = raw ? JSON.parse(raw) : null;
  const token = localStorage.getItem("token");
  return { user, token, isLoggedIn: !!(user && token) };
}

export default function LiveSection() {
  const navigate = useNavigate();
  const { user, token, isLoggedIn } = useAuth();
  const userName = user?.prenom_user
    ? `${user.prenom_user} ${user.nom_user || ""}`.trim()
    : user?.name || "Invité";

  const [activeLive,  setActiveLive]  = useState(null);
  const [liveAlert,   setLiveAlert]   = useState(false);
  const [comments,    setComments]    = useState([]);
  const [input,       setInput]       = useState("");
  const [reactions,   setReactions]   = useState({});
  const [userRxn,     setUserRxn]     = useState(null);
  const [signupNudge, setSignupNudge] = useState(false);
  const [floats,      setFloats]      = useState([]);
  const [joined,      setJoined]      = useState(false); // joined the socket room

  const sockRef = useRef(null);
  const chatEnd = useRef(null);

  /* ── Socket global pour écouter live-started/ended ──────────── */
  useEffect(() => {
    const sock = io(SOCKET_URL, { transports: ["websocket"] });
    sockRef.current = sock;

    sock.on("live-started", ({ roomCode, hostName, viewerLink }) => {
      setActiveLive({ roomCode, hostName, viewerLink });
      setLiveAlert(true);
      setJoined(false);
      setTimeout(() => setLiveAlert(false), 8000);
    });

    sock.on("live-ended", ({ roomCode }) => {
      setActiveLive(prev => prev?.roomCode === roomCode ? null : prev);
      setJoined(false);
      setComments([]);
    });

    // Messages reçus dans la section live (même sans entrer dans /meet)
    sock.on("receive-message", (msg) => {
      setComments(prev => [...prev, { ...msg, id: Date.now() + Math.random() }]);
      setTimeout(() => chatEnd.current?.scrollIntoView({ behavior: "smooth" }), 50);
    });

    // Réactions flottantes
    sock.on("reaction", ({ emoji }) => {
      setReactions(prev => ({ ...prev, [emoji]: (prev[emoji] || 0) + 1 }));
      const id = Date.now() + Math.random();
      setFloats(prev => [...prev, { id, emoji }]);
      setTimeout(() => setFloats(prev => prev.filter(f => f.id !== id)), 3000);
    });

    return () => sock.disconnect();
  }, []);

  /* ── Charger live actif depuis API ──────────────────────────── */
  useEffect(() => {
    API.get("/lives").then(res => {
      const live = Array.isArray(res.data) ? res.data.find(l => l.is_active) : null;
      if (live) {
        setActiveLive({
          roomCode:    live.room_code,
          hostName:    live.admin_name || "Admin",
          viewerLink:  live.stream_link || "",   // ✅ stream_link contient vt=token
          title:       live.title_live,
          description: live.description,
        });
      }
    }).catch(() => {});
  }, []);

  /* ── Rejoindre le room socket pour le chat (sans entrer /meet) ── */
  useEffect(() => {
    if (!activeLive || !sockRef.current || !isLoggedIn || joined) return;

    // Extraire le vt depuis viewerLink
    let viewerToken = null;
    try {
      const url = new URL(activeLive.viewerLink);
      viewerToken = url.searchParams.get("vt");
    } catch {}

    if (!viewerToken) return;

    sockRef.current.emit("join-room", {
      roomCode:    activeLive.roomCode,
      userName,
      role:        "guest",
      accessToken: viewerToken,
    }, (ack) => {
      if (ack?.ok) setJoined(true);
    });
  }, [activeLive, isLoggedIn, joined]);

  /* ── Envoyer commentaire ─────────────────────────────────────── */
  const sendComment = () => {
    if (!isLoggedIn) { setSignupNudge(true); return; }
    if (!input.trim() || !activeLive) return;
    sockRef.current?.emit("send-message", { roomCode: activeLive.roomCode, message: input });
    setInput("");
  };

  /* ── Réaction ────────────────────────────────────────────────── */
  const sendReaction = (emoji) => {
    if (!isLoggedIn) { setSignupNudge(true); return; }
    if (!activeLive) return;
    setUserRxn(emoji);
    sockRef.current?.emit("send-reaction", { roomCode: activeLive.roomCode, emoji });
  };

  /* ── Rejoindre le live (entrer dans /meet) ────────────────────── */
  const joinLive = () => {
    if (!isLoggedIn) { setSignupNudge(true); return; }
    if (!activeLive) return;

    // ✅ FIX: extraire roomCode + vt depuis stream_link correctement
    try {
      const url      = new URL(activeLive.viewerLink);
      const segments = url.pathname.split("/").filter(Boolean);
      const roomCode = segments[segments.length - 1];
      const vt       = url.searchParams.get("vt");
      if (roomCode && vt) {
        navigate(`/meet/${roomCode}?vt=${vt}`);
        return;
      }
    } catch {}

    // Fallback: utiliser roomCode depuis activeLive directement
    if (activeLive.roomCode) {
      // Pas de vt disponible — afficher erreur
      alert("Lien de live invalide. Contactez l'organisateur.");
    }
  };

  /* ── NO LIVE ─────────────────────────────────────────────────── */
  if (!activeLive) return (
    <div style={S.noLive}>
      <div style={S.noLiveInner}>
        <div style={{ fontSize: 56, marginBottom: 12 }}>📡</div>
        <h3 style={{ color: "#f1f5f9", fontSize: 20, fontWeight: 800, margin: "0 0 8px" }}>Aucun live en cours</h3>
        <p style={{ color: "#64748b", fontSize: 14 }}>Restez connecté — vous serez notifié dès qu'un live commence.</p>
      </div>
    </div>
  );

  /* ════════════════════════════════════════════════════════════ */
  /* LIVE ACTIF                                                   */
  /* ════════════════════════════════════════════════════════════ */
  return (
    <div style={{ fontFamily: "'DM Sans',sans-serif", position: "relative" }}>
      {/* CSS animations */}
      <style>{`
        @keyframes slideDown { from{opacity:0;transform:translateY(-10px)} to{opacity:1;transform:translateY(0)} }
        @keyframes floatUp   { 0%{opacity:1;transform:translateY(0)} 100%{opacity:0;transform:translateY(-70px) scale(1.3)} }
        @keyframes pulse     { 0%,100%{opacity:1} 50%{opacity:.4} }
        @keyframes scaleIn   { from{transform:scale(.88);opacity:0} to{transform:scale(1);opacity:1} }
        ::-webkit-scrollbar { width: 4px; }
        ::-webkit-scrollbar-thumb { background: rgba(255,255,255,.15); border-radius: 4px; }
      `}</style>

      {/* ── NOTIFICATION BANNER ── */}
      {liveAlert && (
        <div style={S.alert}>
          <span style={S.alertDot} />
          🎙️ <strong>{activeLive.hostName}</strong> a démarré un live !
          <button onClick={() => setLiveAlert(false)} style={S.alertClose}>✕</button>
        </div>
      )}

      {/* ── MAIN CARD ── */}
      <div style={S.card}>

        {/* LEFT — Vidéo preview + info + join */}
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>

          {/* Preview */}
          <div style={S.preview}>
            <div style={S.livePulse}><span style={S.liveDot} /> 🔴 EN DIRECT</div>
            <div style={{ textAlign: "center" }}>
              <div style={{ fontSize: 64 }}>🎥</div>
              <p style={{ color: "#94a3b8", marginTop: 8, fontSize: 14, fontWeight: 600 }}>
                {activeLive.title || "Live en cours"}
              </p>
              {activeLive.description && (
                <p style={{ color: "#64748b", fontSize: 12, marginTop: 4, maxWidth: 280 }}>{activeLive.description}</p>
              )}
            </div>
            {/* Floating reactions */}
            <div style={{ position: "absolute", bottom: 16, left: "50%", transform: "translateX(-50%)", display: "flex", gap: 8, pointerEvents: "none" }}>
              {floats.map(f => <span key={f.id} style={{ fontSize: 28, animation: "floatUp 3s ease-out forwards" }}>{f.emoji}</span>)}
            </div>
          </div>

          {/* JOIN BUTTON */}
          <button onClick={joinLive} style={S.joinBtn}>
            ▶ Entrer dans le Live
          </button>

          {/* Reactions */}
          <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
            {REACTIONS.map(e => (
              <button key={e} onClick={() => sendReaction(e)} style={{
                background:  userRxn === e ? "rgba(124,58,237,.35)" : "rgba(255,255,255,.06)",
                border:      userRxn === e ? "1px solid #7c3aed" : "1px solid rgba(255,255,255,.08)",
                borderRadius: 20, padding: "6px 12px", cursor: "pointer", fontSize: 16,
                display: "flex", alignItems: "center", gap: 4, transition: "all .15s",
              }}>
                {e}
                {reactions[e] > 0 && <span style={{ fontSize: 11, color: "#94a3b8" }}>{reactions[e]}</span>}
              </button>
            ))}
          </div>
        </div>

        {/* RIGHT — CHAT */}
        <div style={S.chatBox}>
          <div style={{ padding: "14px 16px", borderBottom: "1px solid rgba(255,255,255,.06)", fontWeight: 700, fontSize: 14, color: "#f1f5f9" }}>
            💬 Discussion en direct
          </div>

          <div style={{ flex: 1, overflowY: "auto", padding: "10px 12px", display: "flex", flexDirection: "column", gap: 10, minHeight: 0, maxHeight: 360 }}>
            {comments.length === 0 && (
              <div style={{ color: "#475569", fontSize: 13, textAlign: "center", padding: 20 }}>
                Soyez le premier à écrire…
              </div>
            )}
            {comments.map(m => (
              <div key={m.id} style={{ display: "flex", gap: 8, alignItems: "flex-start" }}>
                <div style={{ width: 28, height: 28, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 800, fontSize: 11, flexShrink: 0, marginTop: 2, background: m.role === "host" ? "#7c3aed" : "#1e3a5f" }}>
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

          {/* Input — tous peuvent commenter si connectés */}
          <div style={{ display: "flex", gap: 6, padding: 10, borderTop: "1px solid rgba(255,255,255,.06)" }}>
            {isLoggedIn ? (
              <>
                <input
                  value={input}
                  onChange={e => setInput(e.target.value)}
                  onKeyDown={e => e.key === "Enter" && sendComment()}
                  placeholder="Écrire un commentaire…"
                  style={{ flex: 1, background: "rgba(255,255,255,.06)", border: "none", borderRadius: 20, padding: "9px 14px", color: "#fff", fontSize: 13, outline: "none" }}
                />
                <button onClick={sendComment} style={{ background: "#7c3aed", border: "none", borderRadius: "50%", width: 36, height: 36, color: "#fff", cursor: "pointer", fontSize: 14, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>➤</button>
              </>
            ) : (
              <button onClick={() => setSignupNudge(true)} style={{ flex: 1, background: "rgba(255,255,255,.05)", border: "1px solid rgba(255,255,255,.1)", borderRadius: 10, padding: 10, color: "#94a3b8", cursor: "pointer", fontSize: 13, textAlign: "center" }}>
                🔒 Connectez-vous pour commenter
              </button>
            )}
          </div>
        </div>
      </div>

      {/* ── SIGNUP MODAL ── */}
      {signupNudge && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,.75)", backdropFilter: "blur(8px)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 999 }}>
          <div style={{ background: "linear-gradient(145deg,#0f0c29,#1a1040)", border: "1px solid rgba(255,255,255,.1)", borderRadius: 22, padding: "44px 36px", maxWidth: 400, width: "90%", textAlign: "center", animation: "scaleIn .3s ease" }}>
            <div style={{ fontSize: 44, marginBottom: 12 }}>👋</div>
            <h3 style={{ color: "#f1f5f9", margin: "0 0 8px" }}>Rejoignez la discussion !</h3>
            <p style={{ color: "#94a3b8", fontSize: 14, margin: "0 0 24px", lineHeight: 1.6 }}>
              Créez un compte gratuit pour commenter, réagir et participer aux lives.
            </p>
            <div style={{ display: "flex", gap: 10, justifyContent: "center", marginBottom: 12 }}>
              <button onClick={() => navigate("/register")} style={{ background: "linear-gradient(135deg,#7c3aed,#3b82f6)", border: "none", borderRadius: 12, padding: "12px 24px", color: "#fff", fontWeight: 700, cursor: "pointer", fontSize: 14 }}>S'inscrire</button>
              <button onClick={() => navigate("/login")}    style={{ background: "rgba(255,255,255,.08)", border: "1px solid rgba(255,255,255,.15)", borderRadius: 12, padding: "12px 24px", color: "#fff", fontWeight: 600, cursor: "pointer", fontSize: 14 }}>Se connecter</button>
            </div>
            <button onClick={() => setSignupNudge(false)} style={{ background: "none", border: "none", color: "#64748b", cursor: "pointer", fontSize: 13, display: "block", width: "100%", textAlign: "center" }}>
              Continuer en visiteur
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

const S = {
  noLive:   { display: "flex", alignItems: "center", justifyContent: "center", minHeight: 300, background: "rgba(255,255,255,.02)", borderRadius: 20, border: "1px dashed rgba(255,255,255,.1)" },
  noLiveInner: { textAlign: "center", padding: 40 },
  alert:    { display: "flex", alignItems: "center", gap: 10, background: "linear-gradient(135deg,#7c3aed,#3b82f6)", borderRadius: 12, padding: "12px 18px", marginBottom: 16, animation: "slideDown .4s ease", color: "#fff", fontSize: 14, fontWeight: 500 },
  alertDot: { width: 10, height: 10, background: "#f87171", borderRadius: "50%", animation: "pulse 1.2s infinite", flexShrink: 0 },
  alertClose:{ marginLeft: "auto", background: "none", border: "none", color: "rgba(255,255,255,.6)", cursor: "pointer", fontSize: 16 },
  card:     { display: "grid", gridTemplateColumns: "1fr 360px", gap: 16, minHeight: 480 },
  preview:  { background: "linear-gradient(160deg,#0f0c29,#1a1a3e)", borderRadius: 16, minHeight: 260, position: "relative", overflow: "hidden", display: "flex", alignItems: "center", justifyContent: "center", border: "1px solid rgba(255,255,255,.07)" },
  livePulse:{ position: "absolute", top: 12, left: 12, display: "flex", alignItems: "center", gap: 6, background: "rgba(239,68,68,.15)", border: "1px solid #ef4444", borderRadius: 20, padding: "4px 12px", color: "#f87171", fontSize: 11, fontWeight: 800, letterSpacing: 1 },
  liveDot:  { width: 8, height: 8, background: "#ef4444", borderRadius: "50%", display: "inline-block", animation: "pulse 1s infinite" },
  joinBtn:  { background: "linear-gradient(135deg,#7c3aed,#3b82f6)", border: "none", borderRadius: 14, padding: "13px 0", color: "#fff", fontSize: 15, fontWeight: 800, cursor: "pointer", width: "100%", boxShadow: "0 8px 24px rgba(124,58,237,.35)" },
  chatBox:  { background: "rgba(0,0,0,.4)", backdropFilter: "blur(16px)", borderRadius: 16, border: "1px solid rgba(255,255,255,.07)", display: "flex", flexDirection: "column", overflow: "hidden" },
};