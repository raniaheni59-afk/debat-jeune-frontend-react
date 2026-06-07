import React, { useState, useEffect } from "react";
import API from "../services/api";


// ── ArchiveCard avec AI Summary ───────────────────────────────
function ArchiveCard({ item, badge, color, title, description, dateVal, duration, participants, host }) {
  const [showAI, setShowAI] = React.useState(false);
  const aiSummary = item.ai_summary || item.aiSummary || null;

  return (
    <div className="archive-card">
      <span className={`badge ${color}`}>{badge}</span>
      <h3>{title}</h3>
      {description && <p>{description}</p>}
      {(duration || participants || host) && (
        <div style={{ display:"flex", flexWrap:"wrap", gap:"6px", marginTop:"10px" }}>
          {host        && <span style={{ fontSize:11, background:"#f0ebff", color:"#5a3fa0", padding:"3px 8px", borderRadius:8, fontWeight:600 }}>{host}</span>}
          {duration    && <span style={{ fontSize:11, background:"#f0ebff", color:"#5a3fa0", padding:"3px 8px", borderRadius:8, fontWeight:600 }}>{duration}</span>}
          {participants && <span style={{ fontSize:11, background:"#e0f2fe", color:"#0369a1", padding:"3px 8px", borderRadius:8, fontWeight:600 }}>{participants}</span>}
        </div>
      )}
      <span className="date">
        📅 {dateVal ? new Date(dateVal).toLocaleDateString("fr-FR", { day:"numeric", month:"long", year:"numeric" }) : "—"}
      </span>

      {/* ✅ AI Summary */}
      {aiSummary && (
        <div style={{ marginTop: 12 }}>
          <button
            onClick={() => setShowAI(o => !o)}
            style={{
              display: "flex", alignItems: "center", gap: 6,
              background: showAI ? "linear-gradient(135deg,#ede9fe,#ddd6fe)" : "linear-gradient(135deg,#f5f3ff,#ede9fe)",
              border: "1px solid rgba(124,58,237,.25)", borderRadius: 10,
              padding: "6px 12px", cursor: "pointer", fontSize: 12, fontWeight: 700,
              color: "#5b21b6", transition: "all .2s",
            }}
          >
            <span style={{ fontSize: 14 }}>✨</span>
            {showAI ? "Masquer le résumé IA" : "Voir le résumé IA"}
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"
              style={{ transform: showAI ? "rotate(180deg)" : "none", transition: "transform .2s" }}>
              <path d="m6 9 6 6 6-6"/>
            </svg>
          </button>

          {showAI && (
            <div style={{
              marginTop: 10, padding: "14px 16px",
              background: "linear-gradient(135deg,#faf5ff,#f3e8ff)",
              border: "1px solid rgba(124,58,237,.2)", borderRadius: 14,
              fontSize: 13, color: "#3b1e6e", lineHeight: 1.7,
              animation: "fadeUp .3s ease",
              whiteSpace: "pre-wrap",
            }}>
              <div style={{ display:"flex",alignItems:"center",gap:6,marginBottom:8,paddingBottom:8,borderBottom:"1px solid rgba(124,58,237,.15)" }}>
                <span style={{ fontSize:16 }}>🤖</span>
                <span style={{ fontWeight:800,fontSize:12,color:"#7c3aed",letterSpacing:.5 }}>RÉSUMÉ IA</span>
              </div>
              {aiSummary}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default function ArchivePage() {
  const [showAllLives, setShowAllLives] = useState(false);
  const [showAllEnquetes, setShowAllEnquetes] = useState(false);

  const [lives, setLives] = useState([]);
  const [enquetes, setEnquetes] = useState([]);

  useEffect(() => {
  // ✅ LIVES ARCHIVÉS — depuis la table live_archives (server.js l.786)
  API.get("/live-archives")
    .then(res => {
      const data = Array.isArray(res.data) ? res.data : [];
      setLives(data);
    })
    .catch(() => {
      // Fallback: si /live-archives n'existe pas encore, filtre par status
      API.get("/lives")
        .then(res => {
          const archived = (Array.isArray(res.data) ? res.data : []).filter(item =>
            item.status === "Terminé" || item.is_active === 0
          );
          setLives(archived);
        })
        .catch(err => console.error("lives fallback error:", err));
    });

  // ✅ ENQUÊTES ARCHIVÉES — filtre par date_fin ou date_creation < aujourd'hui
  API.get("/enquetes")
    .then(res => {
      const today = new Date().setHours(0, 0, 0, 0);
      const data = Array.isArray(res.data) ? res.data : [];
      const archived = data.filter(item => {
        // Priorité: date_fin si elle existe
        const dateRef = item.date_fin || item.date_creation;
        if (!dateRef) return false;
        return new Date(dateRef).setHours(0, 0, 0, 0) < today;
      });
      setEnquetes(archived);
    })
    .catch(err => console.error("enquetes error:", err));
}, []);


 const renderCards = (data, badge, color) =>
  data.map((item, idx) => {
    // live_archives fields: title, room_code, host_name, started_at, ended_at, duration_seconds, participants_count
    // lives fields: title_live, date, thematique
    // enquetes fields: titre, description, date_creation, date_fin
    const title = item.title || item.title_live || item.titre || "Sans titre";
    const description = item.description || item.thematique || "";
    const dateVal = item.ended_at || item.started_at || item.date || item.date_fin || item.date_creation;
    const duration = item.duration_seconds ? `⏱ ${Math.floor(item.duration_seconds / 60)} min` : null;
    const participants = item.participants_count != null ? `👥 ${item.participants_count} participants` : null;
    const host = item.host_name ? `🎙 ${item.host_name}` : null;

    const [showAI, setShowAI] = false; // handled per card below
    return (
      <ArchiveCard
        key={item.id || item.id_live || item.id_enquete || idx}
        item={item} badge={badge} color={color}
        title={title} description={description} dateVal={dateVal}
        duration={duration} participants={participants} host={host}
      />
    );
  });

  return (
    <div className="archive-page">

      <h1 className="page-title">📁 Archive</h1>

      {/* ===== LIVES ===== */}
      <section className="section">
        <div className="section-header">
          <h2>🔴 Lives archivés</h2>
          <button onClick={() => setShowAllLives(!showAllLives)}>
            {showAllLives ? "Afficher moins" : "Voir tout"}
          </button>
        </div>

        <div className={showAllLives ? "grid" : "scroll-row"}>
          {renderCards(showAllLives ? lives : lives.slice(0, 3), "LIVE", "live")}
        </div>
      </section>

      {/* ===== ENQUETES ===== */}
      <section className="section">
        <div className="section-header">
          <h2>📝 Enquêtes archivées</h2>
          <button onClick={() => setShowAllEnquetes(!showAllEnquetes)}>
            {showAllEnquetes ? "Afficher moins" : "Voir tout"}
          </button>
        </div>

        <div className={showAllEnquetes ? "grid" : "scroll-row"}>
          {renderCards(showAllEnquetes ? enquetes : enquetes.slice(0, 3), "ENQUÊTE", "enquete")}
        </div>
      </section>

      {/* ⚠️ CSS متاعك خليه كيف ما هو ✅ */}

    

      {/* ===== STYLES ===== */}
      <style>{`
        .archive-page {
          min-height: 100vh;
          padding: 40px;
          background: radial-gradient(circle at top, #e9e6ff, #f6f5ff);
          color: #2d2555;
          font-family: 'Poppins', sans-serif;
        }

        .page-title {
          font-size: 34px;
          font-weight: 800;
          margin-bottom: 40px;
          color: #3b2f7d;
        }

        .section {
          margin-bottom: 60px;
        }

        .section-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 20px;
        }

        .section-header h2 {
          font-size: 22px;
          color: #4b3fa6;
        }

        .section-header button {
          background: linear-gradient(135deg, #c7bfff, #a5b4fc);
          border: none;
          padding: 8px 20px;
          border-radius: 20px;
          color: #2d2555;
          font-weight: 600;
          cursor: pointer;
          box-shadow: 0 6px 20px rgba(124,92,191,.25);
        }

        .scroll-row {
          display: flex;
          gap: 20px;
          overflow-x: auto;
          padding-bottom: 12px;
        }

        .scroll-row::-webkit-scrollbar {
          height: 6px;
        }

        .scroll-row::-webkit-scrollbar-thumb {
          background: rgba(124,92,191,.4);
          border-radius: 10px;
        }

        .grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
          gap: 20px;
        }

        .archive-card {
          min-width: 260px;
          background: linear-gradient(160deg, #ffffff, #f2f0ff);
          border-radius: 22px;
          padding: 22px;
          position: relative;
          box-shadow: 0 20px 45px rgba(124,92,191,.18);
          transition: all .35s ease;
          animation: fadeUp .45s ease;
        }

        .archive-card:hover {
          transform: translateY(-6px) scale(1.03);
          box-shadow: 0 30px 70px rgba(124,92,191,.35);
        }

        .archive-card h3 {
          font-size: 16px;
          margin-bottom: 6px;
          color: #2d2555;
        }

        .archive-card p {
          font-size: 13px;
          color: #5f5a8c;
        }

        .date {
          font-size: 12px;
          margin-top: 12px;
          display: block;
          color: #7c5cbf;
          font-weight: 500;
        }

        .badge {
          position: absolute;
          top: 16px;
          right: 16px;
          font-size: 10px;
          font-weight: 800;
          padding: 6px 14px;
          border-radius: 20px;
        }

        .badge.live {
          background: linear-gradient(135deg, #fbcfe8, #c7bfff);
          color: #4b3fa6;
        }

        .badge.enquete {
          background: linear-gradient(135deg, #dbeafe, #c7d2fe);
          color: #4338ca;
        }

        @keyframes fadeUp {
          from {
            opacity: 0;
            transform: translateY(18px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>

    </div>
  );
}