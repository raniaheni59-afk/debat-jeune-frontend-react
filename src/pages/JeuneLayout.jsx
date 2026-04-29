import React, { useState, useEffect } from "react";
import { useNavigate, Outlet } from "react-router-dom";
import API from "../services/api";
import PublicationCard from "../components/PublicationCard";
import Chatbot from "../components/Chatbot";
import "./JeuneLayout.css";

const BACKEND = "https://debat-jeune-production.up.railway.app";

const getAvatar = (photo, sexe) => {
  if (photo) return photo.startsWith("http") ? photo : `${BACKEND}/${photo}`;
  return sexe === "femme"
    ? "https://randomuser.me/api/portraits/women/44.jpg"
    : "https://randomuser.me/api/portraits/men/44.jpg";
};

const NAV_ITEMS = [
  { icon: "⌂", label: "Accueil", path: "/jeune" },
  { icon: "✉", label: "Messages", path: "/messenger", badge: "2" },
  { icon: "+", label: "Publier", path: "/publier" },
  { icon: "📅", label: "Calendrier" },
  { icon: "◉", label: "Live & Archive", badge: "2", badgeGreen: true },
  { icon: "🔔", label: "Notifications", path: "/notifications" },
  { icon: "⚙", label: "Paramètres", path: "/settings" },
];

const JeuneLayout = () => {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [activeNav, setActiveNav] = useState(0);
  const [publications, setPublications] = useState([]);
  const [loading, setLoading] = useState(true);

  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem("user"));

  useEffect(() => {
    const fetchPublications = async () => {
      try {
        const res = await API.get("/publications");
        setPublications(res.data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchPublications();
  }, []);

  const toggleSidebar = () => setSidebarOpen(!sidebarOpen);

  const handleLogout = () => {
    localStorage.clear();
    navigate("/login");
  };

  return (
    <div className={`jl-root ${!sidebarOpen ? "sidebar-closed" : ""}`}>
      {/* Background orbs */}
      <div className="jl-orb jl-orb1" />
      <div className="jl-orb jl-orb2" />

      {/* Sidebar */}
      <aside className={`jl-sidebar ${sidebarOpen ? "open" : "closed"}`}>
        <div className="jl-sidebar-logo" onClick={toggleSidebar} style={{ cursor: "pointer" }}>
          <div className="jl-logo-icon">S</div>
          <span className="jl-logo-text">Swafy</span>
        </div>

        <nav className="jl-nav">
          {NAV_ITEMS.map((item, idx) => (
            <button
              key={idx}
              className={`jl-nav-item ${activeNav === idx ? "active" : ""}`}
              onClick={() => {
                setActiveNav(idx);
                if (item.path) navigate(item.path);
              }}
            >
              <span className="jl-nav-icon">{item.icon}</span>
              <span className="jl-nav-label">{item.label}</span>
            </button>
          ))}
        </nav>

        <button className="jl-logout" onClick={handleLogout}>
          <span>Déconnexion</span>
        </button>
      </aside>

      {/* Main Content */}
      <main className="jl-main">
        {/* Topbar mobile */}
        <div className="jl-topbar">
          <button className="jl-burger" onClick={toggleSidebar}>☰</button>
          <span className="jl-topbar-title">Swafy</span>
        </div>

        {/* Scroll Container (Middle Part Only) */}
        <div className="jl-scroll">
          <Outlet /> 
          
          {/* Dashboard contents... */}
          <section className="jl-welcome">
             <h1 className="jl-welcome-h1">Bonjour, <span>{user?.prenom_user}</span> 👋</h1>
          </section>

          <section className="jl-feed">
             {loading ? <p>Chargement...</p> : publications.map(pub => (
               <PublicationCard key={pub.id_publication} publication={pub} />
             ))}
          </section>
        </div>
      </main>

      {/* Right Sidebar (Chatbot) - Fixed */}
      <aside className="jl-right">
        <Chatbot />
      </aside>
    </div>
  );
};

export default JeuneLayout;