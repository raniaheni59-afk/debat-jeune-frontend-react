import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import API from "../services/api";
import PublicationCard from "../components/PublicationCard";
import Chatbot from "../components/Chatbot";
import DebateBlock from "../components/DebateBlock";
import "./JeuneLayout.css";

const JeuneLayout = () => {
  const user = JSON.parse(localStorage.getItem("user"));
  const navigate = useNavigate();

  const [publications, setPublications] = useState([]);
  const [loading, setLoading] = useState(true);

  // ✅ Charger publications au démarrage
  const fetchPublications = async () => {
    try {
      setLoading(true);
      const res = await API.get("/publications");
      setPublications(res.data);
    } catch (error) {
      console.error("Erreur chargement publications:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPublications();
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    window.location.href = "/login";
  };

  return (
    <div className="jeune-page">

      {/* ===== SIDEBAR ===== */}
      <aside className="sidebar">
        <div className="sidebar-header">
          <span className="sidebar-menu-icon">☰</span>
          <span className="sidebar-menu-text">Menu</span>
        </div>

        <nav className="sidebar-nav">
          <div className="nav-item active" onClick={() => navigate("/jeune")}>
            <span className="nav-icon">⌂</span>
            <span>Accueil</span>
          </div>

          <div className="nav-item">
            <span className="nav-icon">✉</span>
            <span>Messages</span>
            <span className="nav-badge">2</span>
          </div>

          {/* ✅ BOUTON PUBLIER */}
          <div className="nav-item" onClick={() => navigate("/publier")}>
            <span className="nav-icon">＋</span>
            <span>Publier</span>
          </div>

          <div className="nav-item">
            <span className="nav-icon">📅</span>
            <span>Calendrier</span>
          </div>

          <div className="nav-item">
            <span className="nav-icon live-icon">LIVE</span>
            <span>Live & Archive</span>
            <span className="nav-badge green">2</span>
          </div>

          <div className="nav-item" onClick={() => navigate("/notifications")}>
            <span className="nav-icon">🔔</span>
            <span>Notification</span>
          </div>

          <div className="nav-item" onClick={() => navigate("/settings")}>
            <span className="nav-icon">⚙</span>
            <span>Parametre</span>
          </div>
        </nav>

        <div className="sidebar-exit" onClick={handleLogout}>
          <span>⍈</span>
          <span>Exit</span>
        </div>
      </aside>

      {/* ===== MAIN CONTENT ===== */}
      <main className="main-content">

        {/* Welcome Banner */}
        <section className="welcome-banner">
          <h1>Bienvenue 👋</h1>
          <p>Votre inscription est validée et vous êtes connecté à votre espace jeune.</p>
        </section>

        {/* Cards Row */}
        <div className="cards-row">
          <div className="info-card-box" onClick={() => navigate("/profile")}>
            <h3>Profil</h3>
            <p>Compte actif</p>
          </div>
          <div className="info-card-box" onClick={() => navigate("/publier")}>
            <h3>Publications</h3>
            <p>Créer une publication</p>
          </div>
          <div className="info-card-box">
            <h3>Live</h3>
            <p>Suivez les débats en direct</p>
          </div>
          <div className="info-card-box">
            <h3>Messages</h3>
            <p>Consultez vos échanges</p>
          </div>
        </div>

        {/* Action Banners */}
        <div className="action-banners">
          <div className="action-banner live-banner">
            <div className="banner-text">
              <span className="banner-tag">EN DIRECT</span>
              <h2>Join Us in Online<br />Live Sessions</h2>
              <button className="banner-btn">Join Now</button>
            </div>
            <div className="banner-image">
              <img
                src="https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=400"
                alt="live"
              />
            </div>
          </div>

          <div className="action-banner enquete-banner">
            <div className="banner-text">
              <span className="banner-tag">NOUVEAU</span>
              <h2>Participez à<br />nos Enquêtes</h2>
              <button className="banner-btn">Participer</button>
            </div>
            <div className="banner-image">
              <img
                src="https://images.unsplash.com/photo-1606326608606-aa0b62935f2b?w=400"
                alt="enquete"
              />
            </div>
          </div>
        </div>

        {/* ✅ FEED PUBLICATIONS */}
        <section className="publications-feed">
          <h2 style={{ marginBottom: '20px', color: '#333' }}>
            📰 Fil d'actualité
          </h2>

          {loading ? (
            <div style={{ textAlign: 'center', padding: '40px' }}>
              <div className="spinner"></div>
              <p>Chargement des publications...</p>
            </div>
          ) : publications.length === 0 ? (
            <div style={{ 
              textAlign: 'center', 
              padding: '60px 20px',
              background: 'white',
              borderRadius: '12px',
              boxShadow: '0 2px 8px rgba(0,0,0,0.05)'
            }}>
              <h3 style={{ color: '#888', marginBottom: '15px' }}>
                Aucune publication pour le moment
              </h3>
              <button 
                onClick={() => navigate("/publier")}
                style={{
                  background: '#6f5ccf',
                  color: 'white',
                  border: 'none',
                  padding: '12px 30px',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  fontSize: '14px'
                }}
              >
                Créer la première publication
              </button>
            </div>
          ) : (
            publications.map(pub => (
              <PublicationCard 
                key={pub.id_publication} 
                publication={pub} 
                onUpdate={fetchPublications}
              />
            ))
          )}
        </section>

      </main>

      {/* ===== RIGHT SIDEBAR ===== */}
      <aside className="right-sidebar">
        <div
          className="profile-card clickable-profile"
          onClick={() => navigate("/profile")}
        >
          <div className="profile-info">
            <img
              src={user?.photo_user 
                ? `http://localhost:5000/${user.photo_user}` 
                : "https://randomuser.me/api/portraits/women/44.jpg"
              }
              alt="profile"
            />
            <div>
              <h4>{user?.nom_user || "Your name"} {user?.prenom_user || ""}</h4>
              <p>{user?.email_user || "yourname@gmail.com"}</p>
              <span className="profile-mini-role">Jeune membre • Swafy</span>
            </div>
          </div>
        </div>

        <Chatbot />
      </aside>

    </div>
  );
};

export default JeuneLayout;