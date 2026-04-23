import React, { useEffect, useState } from "react";
import "./Profile.css";
import api from "../services/api";
import { useNavigate } from "react-router-dom";
import { getDefaultAvatar } from "../utils/avatar";

const Profile = () => {
  const navigate = useNavigate();

  const [profileData, setProfileData] = useState(null);

  const [formData, setFormData] = useState({
    nom_user: "",
    prenom_user: "",
    email_user: "",
    sexe: "",
    telephone_user: "",
    photo_user: "",
    age: "",
    statut: "",
    etablissement: "",
    gouvernorat_jeune: "",
    delegation_jeune: "",
    ville_jeune: "",
    mot_de_passe_user: "",
  });

  const handleAvatarUpload = async (e) => {
  const file = e.target.files?.[0];
  if (!file) return;

  const fd = new FormData();
  fd.append("avatar", file);

  const res = await api.put("/profile/avatar", fd, {
    headers: { "Content-Type": "multipart/form-data" },
  });

  alert("Photo mise à jour");
  fetchProfile();
};
  const fetchProfile = async () => {
    try {
      const res = await api.get("/profile/me");
      setProfileData(res.data);
      setFormData({
        nom_user: res.data.nom_user || "",
        prenom_user: res.data.prenom_user || "",
        email_user: res.data.email_user || "",
        sexe: res.data.sexe || "",
        telephone_user: res.data.telephone_user || "",
        photo_user: res.data.photo_user || "",
        age: res.data.age ?? "",
        statut: res.data.statut || "",
        etablissement: res.data.etablissement || "",
        gouvernorat_jeune: res.data.gouvernorat_jeune || "",
        delegation_jeune: res.data.delegation_jeune || "",
        ville_jeune: res.data.ville_jeune || "",
        mot_de_passe_user: "",
      });
    } catch (error) {
      console.error("Erreur récupération profil:", error);
      // إذا token مش موجود/expired
      if (error.response?.status === 401 || error.response?.status === 403) {
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        navigate("/login", { replace: true });
      }
    }
  };

  useEffect(() => {
    fetchProfile();
  }, []);

  const handleChange = (e) => {
    setFormData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  const handleSave = async (e) => {
    e.preventDefault();
    try {
      await api.put("/profile/update", formData);

      // ✅ جيب الداتا الجديدة
      const me = await api.get("/profile/me");

      setProfileData(me.data);
      setFormData((prev) => ({
        ...prev,
        ...me.data,
        mot_de_passe_user: "",
      }));

      // ✅ update localStorage باش JeuneLayout يبدّل
      localStorage.setItem("user", JSON.stringify(me.data));
      window.dispatchEvent(new Event("userUpdated"));

      alert("Profil mis à jour avec succès !");
    } catch (error) {
      console.error("Erreur update profil:", error);
      alert(error.response?.data?.message || "Erreur lors de la mise à jour");
    }
  };

  if (!profileData) return <p style={{ color: "white", padding: "20px" }}>Chargement...</p>;

  const avatarSrc = profileData?.photo_user
    ? `http://localhost:5000/${profileData.photo_user}`
    : getDefaultAvatar(profileData?.sexe);

  return (
    <div style={{ height: "100vh", overflowY: "auto", overflowX: "hidden" }}>
      <div className="profile-page">
        {/* ===== LEFT ===== */}
        <div className="profile-left">
          <div className="profile-small-card">
            <img
              src={avatarSrc}
              alt="profile"
            />
            <h4>{profileData.nom_user} {profileData.prenom_user}</h4>
            <p>{profileData.email_user}</p>

            <div className="profile-left-menu">
              <p onClick={() => navigate("/jeune/profile")}>Settings</p>
              <p>Notification</p>
              <p onClick={() => navigate("/jeune")}>Accueil</p>
            </div>
          </div>

          <div className="info-card">
            <h4>information</h4>
            <p>nom : {profileData.nom_user}</p>
            <p>prenom : {profileData.prenom_user}</p>
            <p>email : {profileData.email_user}</p>
            <p>age : {profileData.age ?? "-"}</p>
            <p>sexe : {profileData.sexe ?? "-"}</p>
            <p>telephone : {profileData.telephone_user || "-"}</p>
            <p>statut : {profileData.statut || "-"}</p>
            <p>etablissement : {profileData.etablissement || "-"}</p>
            <p>gouvernorat : {profileData.gouvernorat_jeune || "-"}</p>
            <p>delegation : {profileData.delegation_jeune || "-"}</p>
            <p>ville : {profileData.ville_jeune || "-"}</p>
          </div>
        </div>

        {/* ===== MAIN CARD ===== */}
        <div className="profile-main-card">
          <h2 className="profile-title">profile utilisateur</h2>

          <div className="profile-top-section">
            <div className="profile-user-head">
              <img
                src={formData.photo_user || "https://randomuser.me/api/portraits/women/44.jpg"}
                alt="profile"
              />
              <div>
                <h3>{formData.nom_user} {formData.prenom_user}</h3>
                <p>{formData.statut || "Jeune membre"}</p>
                <span>{formData.etablissement || "Tunisie"}</span>
              </div>
            </div>
          </div>

          <form className="profile-form" onSubmit={handleSave}>
            <div className="form-group">
              <label>nom</label>
              <input type="text" name="nom_user" value={formData.nom_user} onChange={handleChange} />
            </div>

            <div className="form-group">
              <label>prenom</label>
              <input type="text" name="prenom_user" value={formData.prenom_user} onChange={handleChange} />
            </div>

            <div className="form-group">
              <label>sexe</label>
              <input type="text" name="sexe" value={formData.sexe} onChange={handleChange} />
            </div>

            <div className="form-group">
              <label>email</label>
              <input type="email" name="email_user" value={formData.email_user} onChange={handleChange} />
            </div>

            <div className="form-group">
              <label>telephone</label>
              <input type="text" name="telephone_user" value={formData.telephone_user} onChange={handleChange} />
            </div>

            <div className="form-group">
              <label>ville</label>
              <input type="text" name="ville_jeune" value={formData.ville_jeune} onChange={handleChange} />
            </div>

            <div className="form-group">
              <label>age</label>
              <input type="number" name="age" value={formData.age} onChange={handleChange} />
            </div>

            <div className="form-group">
              <label>mot de passe</label>
              <input
                type="password"
                name="mot_de_passe_user"
                value={formData.mot_de_passe_user}
                onChange={handleChange}
                placeholder="Laisser vide pour ne pas changer"
              />
            </div>

            <div className="form-group">
              <label>statut</label>
              <input type="text" name="statut" value={formData.statut} onChange={handleChange} />
            </div>

            <div className="form-group">
              <label>etablissement</label>
              <input type="text" name="etablissement" value={formData.etablissement} onChange={handleChange} />
            </div>

            <div className="form-group">
              <label>gouvernorat</label>
              <input type="text" name="gouvernorat_jeune" value={formData.gouvernorat_jeune} onChange={handleChange} />
            </div>

            <div className="form-group">
              <label>delegation</label>
              <input type="text" name="delegation_jeune" value={formData.delegation_jeune} onChange={handleChange} />
            </div>

            <div className="form-group full-width">
              <label>photo url</label>
              <input
                type="text"
                name="photo_user"
                value={formData.photo_user}
                onChange={handleChange}
                placeholder="https://..."
              />
            </div>
              <input type="file" accept="image/*" onChange={handleAvatarUpload} />
            <button type="submit" className="save-btn">
              enregistrer
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Profile;