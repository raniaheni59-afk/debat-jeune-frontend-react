// LiveViewer.jsx — Redirige vers MeetRoom avec le bon token
// Route: /live/:roomCode?vt=TOKEN  →  redirige vers /meet/:roomCode?vt=TOKEN
import { useEffect } from "react";
import { useParams, useSearchParams, useNavigate } from "react-router-dom";

export default function LiveViewer() {
  const { roomCode }  = useParams();
  const [params]      = useSearchParams();
  const navigate      = useNavigate();
  const token         = params.get("vt") || params.get("at");

  useEffect(() => {
    if (!roomCode) { navigate("/meet"); return; }
    // ✅ FIX: rediriger vers /meet/{roomCode}?vt={token} ou at= selon le rôle
    const paramKey = params.get("at") ? "at" : "vt";
    navigate(`/meet/${roomCode}?${paramKey}=${token}`, { replace: true });
  }, [roomCode, token]);

  return (
    <div style={{ minHeight: "100vh", background: "#202124", display: "flex", alignItems: "center", justifyContent: "center" }}>
      <div style={{ textAlign: "center", color: "#9aa0a6", fontFamily: "sans-serif" }}>
        <div style={{ width: 44, height: 44, border: "3px solid rgba(255,255,255,.1)", borderTopColor: "#8ab4f8", borderRadius: "50%", animation: "spin .8s linear infinite", margin: "0 auto 16px" }} />
        <p>Redirection vers la salle…</p>
      </div>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}