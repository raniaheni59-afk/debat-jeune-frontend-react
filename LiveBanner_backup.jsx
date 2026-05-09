// LiveBanner.jsx — مكوّن مشترك يُستخدم في JeuneLayout + Accueil + Swafy
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import API from "../services/api";

const BACKEND = API.defaults.baseURL?.split("/api")[0] || "https://debat-jeune-production.up.railway.app";

export default function LiveBanner({ compact = false }) {
  const navigate = useNavigate();
  const [live, setLive]         = useState(null);
  const [loading, setLoading]   = useState(true);
  const [showModal, setModal]   = useState(false);

  const user  = JSON.parse(localStorage.getItem("user") || "{}");
  const token = localStorage.getItem("token");
  const isLoggedIn = !!(user?.id_user && token);

  // Charger live actif
  const fetchLive = async () => {
    try {
      const res = await API.get("/lives");
      const active = Array.isArray(res.data) ? res.data.find(l => l.is_active) : null;
      setLive(active || null);
    } catch { setLive(null); }
    finally { setLoading(false); }
  };

  useEffect(() => {
    fetchLive();
    // Écouter live-started/ended via CustomEvent (émis depuis App.jsx socket)
    const onStart = (e) => {
      const d = e.detail;
      setLive({ room_code: d.roomCode, title_live: "Live en cours", is_active: 1, stream_link: d.viewerLink || "" });
    };
    const onEnd = () => setLive(null);
    window.addEventListener("live-started", onStart);
    window.addEventListener("live-ended",   onEnd);
    return () => {
      window.removeEventListener("live-started", onStart);
      window.removeEventListener("live-ended",   onEnd);
    };
  }, []);

  const joinLive = () => {
    if (!live) return;
    if (!isLoggedIn) { setModal(true); return; }
    // Extraire roomCode et vt depuis stream_link
    try {
      const url = new URL(live.stream_link);
      const code = url.pathname.split("/").pop();
      const vt   = url.searchParams.get("vt");
      if (code && vt) navigate(`/meet/${code}?vt=${vt}`);
      else navigate(url.pathname + url.search);
    } catch {
      navigate("/meet");
    }
  };

  if (loading) return null;
  if (!live)   return null;

  /* ── COMPACT (pour Accueil/Swafy — bandeau en haut) ── */
  if (compact) return (
    <>
      <div style={C.banner}>
        <span style={C.dot}/>
        <span style={C.text}>🔴 Live en cours — <strong>{live.title_live || "Rejoignez maintenant"}</strong></span>
        <button onClick={joinLive} style={C.btn}>Rejoindre →</button>
      </div>
      {showModal && <SignupModal onClose={()=>setModal(false)} navigate={navigate}/>}
    </>
  );

  /* ── FULL (pour JeuneLayout section LIVE) ── */
  return (
    <>
      <div style={F.wrap}>
        {/* Pulse */}
        <div style={F.liveTop}>
          <div style={{display:"flex",alignItems:"center",gap:8}}>
            <span style={F.dot}/>
            <span style={F.liveLbl}>EN DIRECT</span>
          </div>
          <span style={F.viewers}>342 spectateurs</span>
        </div>

        {/* Screen */}
        <div style={F.screen}>
          <div style={{textAlign:"center"}}>
            <div style={{fontSize:52,marginBottom:10}}>🎥</div>
            <p style={{fontSize:14,fontWeight:700,color:"#fff",marginBottom:4}}>{live.title_live || "Live en cours"}</p>
            <p style={{fontSize:12,color:"rgba(255,255,255,.6)"}}>Cliquez pour rejoindre</p>
          </div>
        </div>

        {/* Join */}
        <button onClick={joinLive} style={F.joinBtn}>
          ▶ Rejoindre le Live
        </button>
      </div>
      {showModal && <SignupModal onClose={()=>setModal(false)} navigate={navigate}/>}
    </>
  );
}

/* ── Modal inscription visiteur ── */
function SignupModal({ onClose, navigate }) {
  return (
    <div style={M.overlay} onClick={e=>e.target===e.currentTarget&&onClose()}>
      <div style={M.card}>
        <div style={{fontSize:48,marginBottom:14}}>👋</div>
        <h3 style={{color:"#f1f5f9",margin:"0 0 8px",fontSize:18,fontWeight:800}}>Rejoignez la discussion !</h3>
        <p style={{color:"#94a3b8",fontSize:13,margin:"0 0 24px",lineHeight:1.7}}>
          Créez un compte gratuit pour commenter, réagir et participer aux lives en direct.
        </p>
        <div style={{display:"flex",gap:10,justifyContent:"center",marginBottom:12}}>
          <button onClick={()=>navigate("/register")} style={M.primary}>S'inscrire gratuitement</button>
          <button onClick={()=>navigate("/login")} style={M.secondary}>Se connecter</button>
        </div>
        <button onClick={onClose} style={M.ghost}>Continuer en visiteur (lecture seule)</button>
      </div>
    </div>
  );
}

const C = {
  banner: { display:"flex", alignItems:"center", gap:12, background:"linear-gradient(135deg,#7c3aed,#4f46e5)", padding:"12px 20px", borderRadius:14, marginBottom:16, animation:"fadeIn .4s ease" },
  dot:    { width:10, height:10, background:"#f87171", borderRadius:"50%", animation:"pulse 1s infinite", flexShrink:0 },
  text:   { flex:1, color:"#fff", fontSize:14 },
  btn:    { background:"rgba(255,255,255,.2)", border:"1px solid rgba(255,255,255,.3)", borderRadius:8, padding:"7px 16px", color:"#fff", cursor:"pointer", fontWeight:700, fontSize:13, whiteSpace:"nowrap" },
};

const F = {
  wrap:    { background:"linear-gradient(160deg,#0f0c29,#1e1060)", borderRadius:18, overflow:"hidden", border:"1px solid rgba(124,58,237,.3)", boxShadow:"0 16px 48px rgba(124,58,237,.25)" },
  liveTop: { display:"flex", justifyContent:"space-between", alignItems:"center", padding:"14px 16px 0" },
  dot:     { width:9, height:9, background:"#ef4444", borderRadius:"50%", animation:"pulse 1s infinite" },
  liveLbl: { color:"#f87171", fontSize:11, fontWeight:800, letterSpacing:2 },
  viewers: { color:"rgba(255,255,255,.5)", fontSize:12 },
  screen:  { margin:12, borderRadius:12, background:"rgba(0,0,0,.4)", minHeight:200, display:"flex", alignItems:"center", justifyContent:"center", border:"1px solid rgba(255,255,255,.06)" },
  joinBtn: { display:"block", width:"calc(100% - 24px)", margin:"0 12px 14px", background:"linear-gradient(135deg,#7c3aed,#3b82f6)", border:"none", borderRadius:12, padding:"13px", color:"#fff", fontSize:15, fontWeight:800, cursor:"pointer", boxShadow:"0 8px 24px rgba(124,58,237,.35)" },
};

const M = {
  overlay: { position:"fixed", inset:0, background:"rgba(0,0,0,.8)", backdropFilter:"blur(10px)", display:"flex", alignItems:"center", justifyContent:"center", zIndex:1000 },
  card:    { background:"linear-gradient(145deg,#0f0c29,#1a1040)", border:"1px solid rgba(255,255,255,.1)", borderRadius:22, padding:"44px 36px", maxWidth:420, width:"90%", textAlign:"center", animation:"popIn .3s ease" },
  primary: { background:"linear-gradient(135deg,#7c3aed,#3b82f6)", border:"none", borderRadius:12, padding:"12px 24px", color:"#fff", fontWeight:800, cursor:"pointer", fontSize:14 },
  secondary:{ background:"rgba(255,255,255,.08)", border:"1px solid rgba(255,255,255,.15)", borderRadius:12, padding:"12px 24px", color:"#fff", fontWeight:600, cursor:"pointer", fontSize:14 },
  ghost:   { background:"none", border:"none", color:"#64748b", cursor:"pointer", fontSize:13, display:"block", width:"100%", textAlign:"center", marginTop:4 },
};