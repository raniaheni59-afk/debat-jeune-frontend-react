import { useState } from "react";

export default function ArchivePage() {
  const [showAllLives, setShowAllLives] = useState(false);
  const [showAllEnquetes, setShowAllEnquetes] = useState(false);

  const lives = [
    { id: 1, title: "Live Innovation", description: "Startup & Tech", date: "12 Mars 2026" },
    { id: 2, title: "Live Orientation", description: "Choix universitaire", date: "05 Février 2026" },
    { id: 3, title: "Live Jeunesse", description: "Engagement citoyen", date: "20 Janvier 2026" },
    { id: 4, title: "Live Digital", description: "Transformation digitale", date: "10 Janvier 2026" },
  ];

  const enquetes = [
    { id: 1, title: "Enquête Satisfaction", description: "Avis global", date: "20 Février 2026" },
    { id: 2, title: "Enquête Étudiants", description: "Vie universitaire", date: "10 Janvier 2026" },
    { id: 3, title: "Enquête Plateforme", description: "UX & Performance", date: "02 Janvier 2026" },
  ];

  const renderCards = (data, badge, color) =>
    data.map((item) => (
      <div key={item.id} className="archive-card">
        <span className={`badge ${color}`}>{badge}</span>
        <h3>{item.title}</h3>
        <p>{item.description}</p>
        <span className="date">📅 {item.date}</span>
      </div>
    ));

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