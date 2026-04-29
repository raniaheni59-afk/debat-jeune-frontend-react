import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import API from "../services/api";
import "./Settings.css";

const BACKEND = API.defaults.baseURL?.split("/api")[0] || "https://debat-jeune-production.up.railway.app";

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
  
  const [formData, setFormData] = useState({
    nom_user: "", prenom_user: "", email_user: "", telephone_user: "", bio_user: "", photo_user: null, sexe: "homme"
  });

  useEffect(() => { fetchUserProfile(); }, []);

  const fetchUserProfile = async () => {
    const userStr = localStorage.getItem("user");
    if (userStr) {
      const savedUser = JSON.parse(userStr);
      setFormData({ ...savedUser });
    }
  };

  const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

  return (
    <div className="settings-inner-wrapper"> {/* Na7ina el sidebar el kbiira mte3 el settings */}
      <main className="settings-main">
        <header className="settings-header">
          <h1>Account Settings</h1>
          <p>Gérez vos informations personnelles</p>
        </header>

        <section className="settings-card">
          <div className="profile-photo-section">
             {/* Photo upload logic hna... */}
             <img src={getAvatar(formData.photo_user, formData.sexe)} className="profile-pic-large" />
          </div>

          <div className="form-grid">
            <div className="form-group">
              <label>Prénom</label>
              <input type="text" name="prenom_user" value={formData.prenom_user} onChange={handleChange} />
            </div>
            <div className="form-group">
              <label>Nom</label>
              <input type="text" name="nom_user" value={formData.nom_user} onChange={handleChange} />
            </div>
            {/* ... ba9it el form ... */}
          </div>
        </section>

        <div className="settings-actions">
          <button className="btn-save" onClick={() => alert('Saved!')}>Enregistrer</button>
        </div>
      </main>

      <aside className="settings-right-panel">
        <div className="widget-card espace-debat">
          <h3>Statut</h3>
          <p>● Actif</p>
        </div>
      </aside>
    </div>
  );
};

export default Settings;