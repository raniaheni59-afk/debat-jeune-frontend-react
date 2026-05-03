import React from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import "./Navbar.css";

const Navbar = () => {
  const navigate = useNavigate();
  const location = useLocation();

  // Sécurité pour éviter le crash si le localStorage est vide ou corrompu
  const getUser = () => {
    try {
      const u = localStorage.getItem("user");
      return u ? JSON.parse(u) : null;
    } catch (e) {
      return null;
    }
  };

  const user = getUser();
  const token = localStorage.getItem("token");

  // Ne pas afficher la Navbar sur les pages d'authentification
  const authPages = ["/login", "/register", "/admin/login", "/"];
  if (authPages.includes(location.pathname) && !token) {
    return null;
  }

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    navigate("/login");
  };

  return (
    <nav className="navbar">
      <div className="navbar-brand" onClick={() => navigate(user?.role === 'admin' ? '/admin/dashboard' : '/jeune')}>
        SWA<span>FY</span>
      </div>

      <div className="navbar-links">
        {user?.role === "admin" ? (
          <>
            <Link to="/admin/dashboard">Dashboard</Link>
          </>
        ) : (
          <>
            <Link to="/jeune">Accueil</Link>
<Link to="/publier">Publier</Link>
<Link to="/notifications" className="nav-link">
    Notifications
</Link>
<Link to="/profile">Mon Profil</Link>
          </>
        )}
      </div>

      <div className="navbar-user">
        {user && (
          <div className="user-info">
            <img 
              src={user.photo_user ? `http://localhost:5000/${user.photo_user}` : "https://via.placeholder.com/40"} 
              alt="avatar" 
              className="nav-avatar"
            />
            <span className="nav-username">{user.nom_user}</span>
            <button onClick={handleLogout} className="logout-btn">Quitter</button>
          </div>
        )}
      </div>
    </nav>
  );
};

export default Navbar;