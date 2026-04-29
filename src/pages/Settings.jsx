import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import API from "../services/api";
import "./Settings.css";

const BACKEND = API.defaults.baseURL?.split("/api")[0] || "https://debat-jeune-production.up.railway.app";

// Helper image (même logique que JeuneLayout)
const getAvatar = (photo, sexe) => {
  if (photo) return photo.startsWith("http") ? photo : `${BACKEND}/${photo}`;
  return sexe === "femme"
    ? "https://randomuser.me/api/portraits/women/44.jpg"
    : "https://randomuser.me/api/portraits/men/44.jpg";
};

const Settings = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("account");
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  
  // État du formulaire
  const [formData, setFormData] = useState({
    nom_user: "",
    prenom_user: "",
    email_user: "",
    telephone_user: "",
    bio_user: "",
    photo_user: null,
    newPhoto: null // Pour l'upload temporaire
  });

  // Charger les données utilisateur actuelles
  useEffect(() => {
    fetchUserProfile();
  }, []);

  const fetchUserProfile = async () => {
    try {
      setLoading(true);
      // Adapter selon ton endpoint réel (généralement /api/profile/me ou /api/auth/me)
      const userStr = localStorage.getItem("user");
      if (userStr) {
        const savedUser = JSON.parse(userStr);
        setFormData({
          nom_user: savedUser.nom_user || "",
          prenom_user: savedUser.prenom_user || "",
          email_user: savedUser.email_user || "",
          telephone_user: savedUser.telephone_user || "",
          bio_user: savedUser.bio_user || "",
          photo_user: savedUser.photo_user || null,
          sexe: savedUser.sexe || "homme"
        });
      }
    } catch (error) {
      console.error("Erreur chargement profil:", error);
    } finally {
      setLoading(false);
    }
  };

  // Gestion changement input
  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  // Gestion upload photo
  const handlePhotoChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Preview locale immédiate
      setFormData({ 
        ...formData, 
        newPhoto: URL.createObjectURL(file),
        photoFile: file // Garder le fichier pour l'envoi
      });
    }
  };

  // Enregistrer les modifications
  const handleSave = async () => {
    try {
      setSaving(true);
      
      const dataToSend = new FormData();
      dataToSend.append("nom_user", formData.nom_user);
      dataToSend.append("prenom_user", formData.prenom_user);
      dataToSend.append("email_user", formData.email_user);
      dataToSend.append("telephone_user", formData.telephone_user);
      dataToSend.append("bio_user", formData.bio_user);
      
      // Si nouvelle photo sélectionnée
      if (formData.photoFile) {
        dataToSend.append("photo", formData.photoFile);
      }

      // Appel API (adapter selon ton route existant)
      await API.put("/profile/update", dataToSend, {
        headers: { "Content-Type": "multipart/form-data" }
      });

      // Mise à jour localStorage
      const currentUser = JSON.parse(localStorage.getItem("user") || "{}");
      const updatedUser = { ...currentUser, ...formData };
      localStorage.setItem("user", JSON.stringify(updatedUser));
      
      alert("✅ Profil mis à jour avec succès!");
      
      // Nettoyer le preview si sauvegardé
      if (formData.photoFile) {
        setFormData({ ...formData, newPhoto: null, photoFile: null });
      }
      
    } catch (error) {
      console.error("Erreur sauvegarde:", error);
      alert("❌ Erreur lors de la mise à jour");
    } finally {
      setSaving(false);
    }
  };

  const menuItems = [
    { id: "account", label: "Account", icon: "👤" },
    { id: "notifications", label: "Notifications", icon: "🔔" },
    { id: "privacy", label: "Privacy", icon: "🔒" },
    { id: "security", label: "Sécurité", icon: "🛡️" },
    { id: "language", label: "Langue", icon: "🌍" },
    { id: "help", label: "Aide", icon: "❓" }
  ];

  return (
    <div className="settings-container">
      {/* Animated Background Orbs ( même style que JeuneLayout ) */}
      <div className="settings-orb orb1" />
      <div className="settings-orb orb2" />
      <div className="settings-orb orb3" />

      <div className="settings-wrapper">
        
        {/* ── LEFT SIDEBAR ── */}
        <aside className="settings-sidebar">
          <div className="settings-brand">
            <span className="settings-logo-icon">S</span>
            <div>
              <strong>Agence Swafy</strong>
              <small>Débat de Jeune - Tunis</small>
            </div>
          </div>

          <h3 className="sidebar-title">Settings</h3>
          
          <nav className="settings-nav">
            {menuItems.map((item) => (
              <button
                key={item.id}
                className={`nav-btn ${activeTab === item.id ? "active" : ""}`}
                onClick={() => setActiveTab(item.id)}
              >
                <span className="nav-icon">{item.icon}</span>
                <span>{item.label}</span>
              </button>
            ))}
          </nav>

          <button className="logout-settings-btn" onClick={() => {
            localStorage.removeItem("token");
            localStorage.removeItem("user");
            navigate("/login");
          }}>
            <span>↩</span> Déconnexion
          </button>
        </aside>

        {/* ── MAIN CONTENT ── */}
        <main className="settings-main">
          <header className="settings-header">
            <h1>Account Settings</h1>
            <p>Gérez vos informations personnelles et préférences</p>
          </header>

          {/* Basic Info Section */}
          <section className="settings-card">
            <h2 className="card-title">Basic Info</h2>
            
            <div className="profile-photo-section">
              <div className="photo-upload-area">
                <img 
                  src={formData.newPhoto || getAvatar(formData.photo_user, formData.sexe)}
                  alt="Profile" 
                  className="profile-pic-large"
                />
                <label htmlFor="photo-input" className="upload-label">
                  <input
                    id="photo-input"
                    type="file"
                    accept="image/*"
                    onChange={handlePhotoChange}
                    hidden
                  />
                  <span className="upload-text">Upload new picture</span>
                  <span className="remove-link">Remove</span>
                </label>
              </div>
            </div>

            <div className="form-grid">
              <div className="form-group">
                <label>Prénom</label>
                <input
                  type="text"
                  name="prenom_user"
                  value={formData.prenom_user}
                  onChange={handleChange}
                  placeholder="Wade"
                />
              </div>

              <div className="form-group">
                <label>Nom</label>
                <input
                  type="text"
                  name="nom_user"
                  value={formData.nom_user}
                  onChange={handleChange}
                  placeholder="Armstrong"
                />
              </div>

              <div className="form-group full-width">
                <label>Email</label>
                <input
                  type="email"
                  name="email_user"
                  value={formData.email_user}
                  onChange={handleChange}
                  placeholder="wade@swafy.tn"
                />
              </div>

              <div className="form-group">
                <label>Téléphone</label>
                <input
                  type="tel"
                  name="telephone_user"
                  value={formData.telephone_user}
                  onChange={handleChange}
                  placeholder="+216 XX XXX XXX"
                />
              </div>

              <div className="form-group full-width">
                <label>Bio</label>
                <textarea
                  name="bio_user"
                  value={formData.bio_user}
                  onChange={handleChange}
                  placeholder="Parlez-nous de vous..."
                  rows={3}
                />
              </div>
            </div>
          </section>

          {/* Account Info Section */}
          <section className="settings-card account-info-section">
            <h2 className="card-title">Account Info</h2>
            
            <div className="info-row">
              <span className="info-label">Statut</span>
              <span className="info-value active-status">● Actif</span>
            </div>
            
            <div className="info-row">
              <span className="info-label">Membre depuis</span>
              <span className="info-value">{new Date().toLocaleDateString('fr-FR')}</span>
            </div>

            <div className="info-row clickable" onClick={() => setActiveTab('security')}>
              <span className="info-label">Mot de passe</span>
              <span className="info-value">•••••••• <span className="arrow">→</span></span>
            </div>
          </section>

          {/* Action Buttons */}
          <div className="settings-actions">
            <button 
              className="btn-save" 
              onClick={handleSave} 
              disabled={saving}
            >
              {saving ? "Sauvegarde..." : "Enregistrer les modifications"}
            </button>
            <button className="btn-cancel" onClick={fetchUserProfile}>
              Annuler
            </button>
          </div>
        </main>

        {/* ── RIGHT WIDGET ── */}
        <aside className="settings-right-panel">
          <div className="widget-card espace-debat">
            <h3 className="widget-title">Espace Débat Jeune</h3>
            <ul className="widget-list">
              <li>
                <span className="widget-icon">🏆</span>
                <span>Prochains tournois</span>
              </li>
              <li>
                <span className="widget-icon">👥</span>
                <span>Mes équipes</span>
              </li>
              <li>
                <span className="widget-icon">🎤</span>
                <span>Tableau de bord orateur</span>
              </li>
              <li>
                <span className="widget-icon">📊</span>
                <span>Statistiques</span>
              </li>
            </ul>
            <button className="widget-btn" onClick={() => navigate("/jeune")}>
              Voir le tableau de bord →
            </button>
          </div>

          <div className="widget-card premium-widget">
            <div className="premium-badge">PRO</div>
            <h4>Passez Premium</h4>
            <p>Débloquez toutes les fonctionnalités avancées</p>
            <button className="btn-upgrade">Mettre à niveau</button>
          </div>
        </aside>

      </div>
    </div>
  );
};

export default Settings;