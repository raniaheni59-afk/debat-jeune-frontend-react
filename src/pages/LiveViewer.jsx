// LiveViewer.jsx — Redirige vers MeetRoom avec le bon token
// Route: /live/:roomCode?vt=TOKEN  →  /meet/:roomCode?vt=TOKEN
// ✅ FIX: si non connecté → redirige vers /login?redirect=...
import { useEffect } from "react";
import { useParams, useSearchParams, useNavigate } from "react-router-dom";

export default function LiveViewer() {
  const { roomCode }  = useParams();
  const [params]      = useSearchParams();
  const navigate      = useNavigate();

  useEffect(() => {
    if (!roomCode) { navigate("/meet"); return; }

    // ✅ FIX: vérifier si l'utilisateur est connecté
    const token = localStorage.getItem("token");
    const user  = localStorage.getItem("user");
    const isLoggedIn = !!(token && user);

    const paramKey  = params.get("at") ? "at" : "vt";
    const paramVal  = params.get("at") || params.get("vt");

    if (!paramVal) { navigate("/meet"); return; }

    const destUrl = `/meet/${roomCode}?${paramKey}=${paramVal}`;

    if (!isLoggedIn) {
      // Sauvegarder la destination pour après login
      localStorage.setItem("loginRedirect", destUrl);
      navigate(`/login?redirect=${encodeURIComponent(destUrl)}`, { replace: true });
      return;
    }

    // ✅ Connecté → aller directement à MeetRoom
    navigate(destUrl, { replace: true });
  }, [roomCode]);

  return (
    <div style={{
      minHeight: "100vh", background: "#202124",
      display: "flex", alignItems: "center", justifyContent: "center"
    }}>
      <div style={{ textAlign: "center", color: "#9aa0a6", fontFamily: "sans-serif" }}>
        <div style={{
          width: 44, height: 44,
          border: "3px solid rgba(255,255,255,.1)", borderTopColor: "#8ab4f8",
          borderRadius: "50%", animation: "spin .8s linear infinite",
          margin: "0 auto 16px"
        }} />
        <p>Redirection vers la salle…</p>
      </div>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}