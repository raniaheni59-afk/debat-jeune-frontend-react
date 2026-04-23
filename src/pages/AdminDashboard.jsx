import React, { useState } from "react";
import { Navigate } from "react-router-dom";
import ManageUsers from "../components/ManageUsers"; // On crée ce composant ci-dessous
import "./AdminDashboard.css";

const AdminDashboard = () => {
  const user = JSON.parse(localStorage.getItem("user"));

  if (!user || user.role !== "admin") {
    return <Navigate to="/admin/login" />;
  }

  const [activeTab, setActiveTab] = useState("users");

  return (
    <div className="admin-layout">
      <aside className="admin-sidebar">
        <div className="admin-logo">SWA<span>FY</span></div>
        <nav>
          <button 
            className={activeTab === "users" ? "active" : ""} 
            onClick={() => setActiveTab("users")}
          >
            Gestion Jeunes
          </button>
          <button className={activeTab === "debates" ? "active" : ""}>
            Gestion Débats
          </button>
          <button className={activeTab === "stats" ? "active" : ""}>
            Statistiques
          </button>
          <button onClick={() => {
            localStorage.removeItem("token");
            localStorage.removeItem("user");
            window.location.href = "/admin/login";
          }} className="logout-btn">
            Déconnexion
          </button>
        </nav>
      </aside>

      <main className="admin-content">
        <header>
          <h2>Tableau de Bord Administrateur</h2>
          <span>Bienvenue, {user.nom_user}</span>
        </header>

        <div className="admin-card">
          {activeTab === "users" && <ManageUsers />}
          {activeTab === "debates" && <div>Gestion des débats à venir...</div>}
          {activeTab === "stats" && <div>Statistiques globales...</div>}
        </div>
      </main>
    </div>
  );
};

export default AdminDashboard;