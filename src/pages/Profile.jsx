import { useState, useEffect, useRef } from "react";
import { useNavigate, useParams } from "react-router-dom";
import API from "../services/api";
import "./Profile.css";

const BACKEND =
  import.meta.env.VITE_BACKEND_URL || "https://debat-jeune.onrender.com";

const getAvatar = (photo, sexe) => {
  if (photo) return photo.startsWith("http") ? photo : `${BACKEND}/${photo}`;
  return sexe === "femme"
    ? "https://randomuser.me/api/portraits/women/44.jpg"
    : "https://randomuser.me/api/portraits/men/44.jpg";
};

export default function Profile() {
  const navigate = useNavigate();
  const { id }   = useParams();

  const me = (() => {
    try { return JSON.parse(localStorage.getItem("user")) || {}; } catch { return {}; }
  })();

  const isOwn = !id || String(id) === String(me.id_user);

  const [profile,  setProfile]  = useState(null);
  const [loading,  setLoading]  = useState(true);
  const [editing,  setEditing]  = useState(false);
  const [saving,   setSaving]   = useState(false);
  const [saved,    setSaved]    = useState(false);
  const [error,    setError]    = useState("");

  const [form, setForm] = useState({
    prenom_user: "", nom_user: "", email_user: "", bio: "",
    sexe: "", gouvernorat: "", delegation: "", ville: "",
    etablissement: "", statut: "",
  });

  const [photoFile,    setPhotoFile]    = useState(null);
  const [photoPreview, setPhotoPreview] = useState(null);
  const fileRef = useRef(null);

  // ── Load profile ─────────────────────────────────────
  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        let data;
        if (isOwn) {
          const res = await API.get("/profile/me");
          data = res.data;
          // Sync localStorage
          localStorage.setItem("user", JSON.stringify({ ...me, ...data }));
        } else {
          const res = await API.get(`/profile/${id}`);
          data = res.data;
        }
        setProfile(data);
        setForm({
          prenom_user  : data.prenom_user   || "",
          nom_user     : data.nom_user      || "",
          email_user   : data.email_user    || "",
          bio          : data.bio           || "",
          sexe         : data.sexe          || "",
          gouvernorat  : data.gouvernorat_jeune || data.gouvernorat || "",
          delegation   : data.delegation_jeune  || data.delegation  || "",
          ville        : data.ville_jeune   || data.ville           || "",
          etablissement: data.etablissement || "",
          statut       : data.statut        || "",
        });
      } catch {
        // Fallback to localStorage if API fails
        setProfile(me);
        setForm({
          prenom_user  : me.prenom_user   || "",
          nom_user     : me.nom_user      || "",
          email_user   : me.email_user    || "",
          bio          : me.bio           || "",
          sexe         : me.sexe          || "",
          gouvernorat  : me.gouvernorat   || "",
          delegation   : me.delegation    || "",
          ville        : me.ville         || "",
          etablissement: me.etablissement || "",
          statut       : me.statut        || "",
        });
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [id]);

  const handleChange = (e) => {
    setForm(p => ({ ...p, [e.target.name]: e.target.value }));
    setSaved(false); setError("");
  };

  const handlePhoto = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setPhotoFile(file);
    setPhotoPreview(URL.createObjectURL(file));
  };

  const handleSave = async () => {
    setSaving(true); setError(""); setSaved(false);
    try {
      const fd = new FormData();
      Object.entries(form).forEach(([k, v]) => { if (v !== undefined) fd.append(k, v); });
      if (photoFile) fd.append("photo", photoFile);

      const token = localStorage.getItem("token");
      const res = await fetch(`${BACKEND}/api/profile/update`, {
        method : "PUT",
        headers: { Authorization: `Bearer ${token}` },
        body   : fd,
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Erreur sauvegarde");

      const updated = { ...me, ...form };
      if (data.photo_user) updated.photo_user = data.photo_user;
      localStorage.setItem("user", JSON.stringify(updated));
      setProfile(updated);
      setSaved(true);
      setEditing(false);
      setPhotoFile(null);
      setPhotoPreview(null);
    } catch (err) {
      setError(err.message || "Erreur réseau. Réessayez.");
    } finally {
      setSaving(false);
    }
  };

  // ── Render ────────────────────────────────────────────
  if (loading) return (
    <div className="prof-loading">
      <div className="prof-spinner"/>
      <p>Chargement du profil…</p>
    </div>
  );

  const avatarSrc = photoPreview || getAvatar(profile?.photo_user, profile?.sexe);
  const fullName  = `${profile?.prenom_user || ""} ${profile?.nom_user || ""}`.trim() || "Utilisateur";
  const statLabel = { college:"Collège", lycee:"Lycée", etudiant:"Étudiant", diplome:"Diplômé", autre:"Autre" };

  return (
    <div className="prof-root">
      {/* Back button */}
      <button className="prof-back" onClick={() => navigate(-1)}>
        ← Retour
      </button>

      <div className="prof-card">
        {/* ── COVER ─────────────────────────────── */}
        <div className="prof-cover">
          <div className="prof-cover-gradient"/>
        </div>

        {/* ── AVATAR + NAME ─────────────────────── */}
        <div className="prof-top">
          <div className="prof-ava-wrap">
            <img className="prof-ava" src={avatarSrc} alt={fullName}
              onError={e => { e.target.src = "https://randomuser.me/api/portraits/men/44.jpg"; }}/>
            {isOwn && editing && (
              <button className="prof-ava-btn" onClick={() => fileRef.current?.click()}>📷</button>
            )}
            <input ref={fileRef} type="file" accept="image/*"
              style={{ display:"none" }} onChange={handlePhoto}/>
          </div>
          <div className="prof-top-info">
            <h1 className="prof-name">{fullName}</h1>
            {profile?.email_user && <p className="prof-email">{profile.email_user}</p>}
            {profile?.statut && (
              <span className="prof-badge">{statLabel[profile.statut] || profile.statut}</span>
            )}
          </div>
          {isOwn && !editing && (
            <button className="prof-edit-btn" onClick={() => setEditing(true)}>
              ✏️ Modifier
            </button>
          )}
        </div>

        {/* ── BIO ───────────────────────────────── */}
        {(profile?.bio || editing) && (
          <div className="prof-section">
            <h3 className="prof-section-title">À propos</h3>
            {editing ? (
              <textarea className="prof-input prof-textarea" name="bio"
                value={form.bio} onChange={handleChange}
                placeholder="Parlez de vous…"/>
            ) : (
              <p className="prof-bio">{profile?.bio || "—"}</p>
            )}
          </div>
        )}

        {/* ── INFORMATIONS ──────────────────────── */}
        <div className="prof-section">
          <h3 className="prof-section-title">Informations personnelles</h3>
          <div className="prof-grid">
            {editing ? (
              <>
                <div className="prof-field">
                  <label>Prénom</label>
                  <input className="prof-input" name="prenom_user"
                    value={form.prenom_user} onChange={handleChange}/>
                </div>
                <div className="prof-field">
                  <label>Nom</label>
                  <input className="prof-input" name="nom_user"
                    value={form.nom_user} onChange={handleChange}/>
                </div>
                <div className="prof-field">
                  <label>Email</label>
                  <input className="prof-input" name="email_user" type="email"
                    value={form.email_user} onChange={handleChange}/>
                </div>
                <div className="prof-field">
                  <label>Sexe</label>
                  <select className="prof-input" name="sexe"
                    value={form.sexe} onChange={handleChange}>
                    <option value="">—</option>
                    <option value="homme">Homme</option>
                    <option value="femme">Femme</option>
                  </select>
                </div>
                <div className="prof-field">
                  <label>Statut</label>
                  <select className="prof-input" name="statut"
                    value={form.statut} onChange={handleChange}>
                    <option value="">—</option>
                    <option value="college">Collège</option>
                    <option value="lycee">Lycée</option>
                    <option value="etudiant">Étudiant</option>
                    <option value="diplome">Diplômé</option>
                    <option value="autre">Autre</option>
                  </select>
                </div>
              </>
            ) : (
              <>
                <InfoRow label="Prénom"  value={profile?.prenom_user}/>
                <InfoRow label="Nom"     value={profile?.nom_user}/>
                <InfoRow label="Email"   value={profile?.email_user}/>
                <InfoRow label="Sexe"    value={profile?.sexe === "homme" ? "Homme" : profile?.sexe === "femme" ? "Femme" : null}/>
                <InfoRow label="Statut"  value={statLabel[profile?.statut] || profile?.statut}/>
              </>
            )}
          </div>
        </div>

        {/* ── LOCALISATION ──────────────────────── */}
        <div className="prof-section">
          <h3 className="prof-section-title">Localisation & Établissement</h3>
          <div className="prof-grid">
            {editing ? (
              <>
                <div className="prof-field">
                  <label>Gouvernorat</label>
                  <input className="prof-input" name="gouvernorat"
                    value={form.gouvernorat} onChange={handleChange}
                    placeholder="Ex: Tunis, Sfax…"/>
                </div>
                <div className="prof-field">
                  <label>Délégation</label>
                  <input className="prof-input" name="delegation"
                    value={form.delegation} onChange={handleChange}
                    placeholder="Ex: Carthage…"/>
                </div>
                <div className="prof-field">
                  <label>Ville</label>
                  <input className="prof-input" name="ville"
                    value={form.ville} onChange={handleChange}
                    placeholder="Ex: La Marsa…"/>
                </div>
                <div className="prof-field full">
                  <label>Établissement</label>
                  <input className="prof-input" name="etablissement"
                    value={form.etablissement} onChange={handleChange}
                    placeholder="Nom de ton école / université…"/>
                </div>
              </>
            ) : (
              <>
                <InfoRow label="Gouvernorat"   value={profile?.gouvernorat_jeune || profile?.gouvernorat}/>
                <InfoRow label="Délégation"    value={profile?.delegation_jeune  || profile?.delegation}/>
                <InfoRow label="Ville"         value={profile?.ville_jeune       || profile?.ville}/>
                <InfoRow label="Établissement" value={profile?.etablissement}/>
              </>
            )}
          </div>
        </div>

        {/* ── ACTIONS ───────────────────────────── */}
        {isOwn && editing && (
          <div className="prof-actions">
            {error  && <div className="prof-msg prof-msg-err">❌ {error}</div>}
            {saved  && <div className="prof-msg prof-msg-ok">✅ Profil mis à jour !</div>}
            <div className="prof-btns">
              <button className="prof-btn-cancel"
                onClick={() => { setEditing(false); setPhotoFile(null); setPhotoPreview(null); setError(""); }}>
                Annuler
              </button>
              <button className="prof-btn-save" onClick={handleSave} disabled={saving}>
                {saving ? "⏳ Enregistrement…" : "💾 Enregistrer"}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

const InfoRow = ({ label, value }) => (
  <div className="prof-field">
    <label>{label}</label>
    <p className="prof-val">{value || <span className="prof-empty">—</span>}</p>
  </div>
);