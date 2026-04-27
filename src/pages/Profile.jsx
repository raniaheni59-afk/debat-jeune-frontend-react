import React, { useEffect, useState, useRef } from "react";
import api from "../services/api";
import { useNavigate, useParams } from "react-router-dom";

const BACKEND = "https://debat-jeune-production.up.railway.app";

const getAvatar = (photo, sexe) => {
  if (photo) return photo.startsWith("http") ? photo : `${BACKEND}/${photo}`;
  return sexe === "femme"
    ? "https://randomuser.me/api/portraits/women/44.jpg"
    : "https://randomuser.me/api/portraits/men/44.jpg";
};

const TABS = [
  { key: "publications", label: "Publications", icon: "✦" },
  { key: "photos", label: "Photos", icon: "◈" },
  { key: "videos", label: "Vidéos", icon: "▶" },
  { key: "pdfs", label: "Documents", icon: "⊟" },
  { key: "infos", label: "Infos", icon: "◉" },
];

const REACTION_EMOJI = { like: "👍", love: "❤️", haha: "😂", wow: "😮", sad: "😢", angry: "😡" };

export default function Profile() {
  const navigate = useNavigate();
  const { id } = useParams();
  const currentUser = JSON.parse(localStorage.getItem("user") || "{}");
  const isMe = !id || parseInt(id) === currentUser.id_user;

  const [profile, setProfile] = useState(null);
  const [publications, setPublications] = useState([]);
  const [activeTab, setActiveTab] = useState("publications");
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [imageModal, setImageModal] = useState(null);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const fileRef = useRef();

  useEffect(() => { fetchData(); }, [id]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const userId = id || currentUser.id_user;
      const [profileRes, pubRes] = await Promise.all([
        isMe ? api.get("/profile/me") : api.get(`/profile/${userId}`),
        api.get(`/profile/${userId}/publications`)
      ]);
      setProfile(profileRes.data);
      setForm(profileRes.data);
      setPublications(pubRes.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      await api.put("/profile/update", form);
      const res = await api.get("/profile/me");
      setProfile(res.data);
      setForm(res.data);
      localStorage.setItem("user", JSON.stringify(res.data));
      setEditing(false);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err) {
      alert("Erreur lors de la mise à jour");
    } finally {
      setSaving(false);
    }
  };

  const handleAvatarUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const fd = new FormData();
    fd.append("avatar", file);
    await api.put("/profile/avatar", fd);
    fetchData();
  };

  if (loading) return (
    <div style={styles.loadingWrap}>
      <div style={styles.loadingSpinner} />
      <p style={styles.loadingText}>Chargement du profil…</p>
    </div>
  );

  if (!profile) return <div style={styles.notFound}>Profil introuvable</div>;

  const photos = publications.flatMap(p => p.medias?.filter(m => m.type_media === "photo") || []);
  const videos = publications.flatMap(p => p.medias?.filter(m => m.type_media === "video") || []);
  const pdfs = publications.flatMap(p => p.medias?.filter(m => m.type_media === "pdf") || []);

  const totalReactions = (pub) =>
    (pub.likes || 0) + (pub.loves || 0) + (pub.hahas || 0) + (pub.wows || 0) + (pub.sads || 0) + (pub.angrys || 0);

  return (
    <div style={styles.root}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600;700&family=Playfair+Display:wght@700&display=swap');
        * { box-sizing: border-box; }
        body { margin: 0; }
        .tab-btn:hover { background: rgba(99,91,255,0.08) !important; color: #6355ff !important; }
        .pub-card:hover { transform: translateY(-2px); box-shadow: 0 8px 32px rgba(0,0,0,0.10) !important; }
        .media-thumb:hover { opacity: 0.85; transform: scale(1.02); }
        .action-btn:hover { background: #f4f3ff !important; color: #6355ff !important; }
        .edit-input:focus { outline: none; border-color: #6355ff !important; box-shadow: 0 0 0 3px rgba(99,91,255,0.12); }
        .back-btn:hover { background: rgba(0,0,0,0.18) !important; }
        .save-btn:hover { background: #4f43e8 !important; }
        .cancel-btn:hover { background: #e8e7ff !important; }
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes fadeIn { from { opacity:0; transform:translateY(16px); } to { opacity:1; transform:translateY(0); } }
        @keyframes slideDown { from { opacity:0; transform:translateY(-12px); } to { opacity:1; transform:translateY(0); } }
        @keyframes pulse { 0%,100% { opacity:1; } 50% { opacity:0.5; } }
        .stat-card:hover { transform: translateY(-3px); box-shadow: 0 8px 24px rgba(99,91,255,0.15) !important; }
      `}</style>

      {/* ───── HERO / COVER ───── */}
      <div style={styles.hero}>
        <div style={styles.coverBg} />

        <button className="back-btn" onClick={() => navigate(-1)} style={styles.backBtn}>
          ← Retour
        </button>

        {/* Avatar zone */}
        <div style={styles.avatarZone}>
          <div style={styles.avatarWrap}>
            <img
              src={getAvatar(profile.photo_user, profile.sexe)}
              alt="avatar"
              style={styles.avatarImg}
              onError={e => e.target.src = "https://randomuser.me/api/portraits/men/44.jpg"}
            />
            {isMe && (
              <label style={styles.avatarEditBtn} title="Changer la photo">
                <span style={{ fontSize: 16 }}>📷</span>
                <input type="file" accept="image/*" ref={fileRef} onChange={handleAvatarUpload} style={{ display: "none" }} />
              </label>
            )}
          </div>

          <div style={styles.heroInfo}>
            <h1 style={styles.heroName}>{profile.prenom_user} {profile.nom_user}</h1>
            <p style={styles.heroSub}>
              {profile.statut && <span style={styles.badge}>{profile.statut}</span>}
              {profile.etablissement && <span style={{ color: "#aaa", marginLeft: 8 }}>{profile.etablissement}</span>}
            </p>
            <p style={styles.heroLocation}>
              📍 {[profile.ville, profile.gouvernorat].filter(Boolean).join(", ") || "Tunisie"}
            </p>
          </div>

          {isMe && (
            <button
              onClick={() => setEditing(!editing)}
              style={{ ...styles.editProfileBtn, ...(editing ? styles.editProfileBtnActive : {}) }}
            >
              {editing ? "✕ Annuler" : "✏️ Modifier le profil"}
            </button>
          )}
        </div>

        {/* Stats bar */}
        <div style={styles.statsBar}>
          {[
            { label: "Publications", value: publications.length, icon: "✦" },
            { label: "Photos", value: photos.length, icon: "◈" },
            { label: "Vidéos", value: videos.length, icon: "▶" },
            { label: "Documents", value: pdfs.length, icon: "⊟" },
          ].map(s => (
            <div key={s.label} className="stat-card" style={styles.statCard}
              onClick={() => setActiveTab(s.label === "Publications" ? "publications" : s.label === "Photos" ? "photos" : s.label === "Vidéos" ? "videos" : "pdfs")}
            >
              <span style={styles.statIcon}>{s.icon}</span>
              <span style={styles.statValue}>{s.value}</span>
              <span style={styles.statLabel}>{s.label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* ───── TABS ───── */}
      <div style={styles.tabsWrap}>
        <div style={styles.tabsInner}>
          {TABS.map(tab => (
            <button
              key={tab.key}
              className="tab-btn"
              onClick={() => setActiveTab(tab.key)}
              style={{
                ...styles.tabBtn,
                ...(activeTab === tab.key ? styles.tabBtnActive : {})
              }}
            >
              <span style={{ marginRight: 6, opacity: 0.7 }}>{tab.icon}</span>
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* ───── CONTENT ───── */}
      <div style={styles.content}>

        {/* SUCCESS TOAST */}
        {saveSuccess && (
          <div style={styles.toast}>
            ✅ Profil mis à jour avec succès !
          </div>
        )}

        {/* ── EDIT FORM ── */}
        {editing && isMe && (
          <div style={{ ...styles.card, animation: "slideDown 0.3s ease", marginBottom: 20 }}>
            <h3 style={styles.cardTitle}>Modifier le profil</h3>
            <div style={styles.formGrid}>
              {[
                { label: "Prénom", key: "prenom_user" },
                { label: "Nom", key: "nom_user" },
                { label: "Email", key: "email_user", type: "email" },
                { label: "Téléphone", key: "telephone_user" },
                { label: "Âge", key: "age", type: "number" },
                { label: "Ville", key: "ville" },
                { label: "Gouvernorat", key: "gouvernorat" },
                { label: "Délégation", key: "delegation" },
                { label: "Établissement", key: "etablissement" },
                { label: "Statut", key: "statut" },
              ].map(f => (
                <div key={f.key} style={styles.formField}>
                  <label style={styles.formLabel}>{f.label}</label>
                  <input
                    className="edit-input"
                    type={f.type || "text"}
                    value={form[f.key] || ""}
                    onChange={e => setForm(prev => ({ ...prev, [f.key]: e.target.value }))}
                    style={styles.formInput}
                    placeholder={f.label}
                  />
                </div>
              ))}
            </div>
            <div style={{ display: "flex", gap: 10, marginTop: 20 }}>
              <button
                className="save-btn"
                onClick={handleSave}
                disabled={saving}
                style={styles.saveBtn}
              >
                {saving ? "Enregistrement…" : "💾 Enregistrer les modifications"}
              </button>
              <button
                className="cancel-btn"
                onClick={() => { setEditing(false); setForm(profile); }}
                style={styles.cancelBtn}
              >
                Annuler
              </button>
            </div>
          </div>
        )}

        {activeTab === "publications" && (
  <div style={{ animation: "fadeIn 0.35s ease", display: "flex", flexDirection: "column", gap: "20px" }}>
    {publications.length === 0 ? (
      <EmptyState icon="✦" text="Aucune publication pour le moment" />
    ) : (
      publications.map((pub) => (
        <div key={pub.id_publication} className="pub-card" style={styles.pubCard}>
          
          {/* 1. Header */}
          <div style={styles.pubHeader}>
            <img 
              src={getAvatar(profile.photo_user, profile.sexe)} 
              alt="" 
              style={styles.pubAvatar} 
            />
            <div>
              <p style={styles.pubAuthor}>{profile.prenom_user} {profile.nom_user}</p>
              <p style={styles.pubDate}>
                {new Date(pub.date_publication).toLocaleDateString("fr-FR", {
                  day: "2-digit", month: "long", year: "numeric"
                })}
                {" · "}
                {new Date(pub.date_publication).toLocaleTimeString("fr-FR", {
                  hour: "2-digit", minute: "2-digit"
                })}
              </p>
            </div>
          </div>

          {/* 2. Titre & Contenu */}
          {pub.titre_publication && (
            <h4 style={styles.pubTitle}>{pub.titre_publication}</h4>
          )}
          <div style={styles.pubContent}>
            <p style={{ fontSize: "1.05rem", lineHeight: "1.5", color: "#333", margin: "10px 0" }}>
              {pub.contenu}
            </p>
          </div>

          {/* 3. Media Grid (Photos/Vidéos/PDF) */}
          {pub.medias?.length > 0 && (
            <div style={{
              ...styles.mediaGrid,
              display: "grid",
              gap: "8px",
              gridTemplateColumns: pub.medias.length === 1 ? "1fr" : pub.medias.length === 2 ? "1fr 1fr" : "1fr 1fr 1fr"
            }}>
              {pub.medias.map(media => (
                <div key={media.id_media}>
                  {media.type_media === "photo" && (
                    <img
                      src={media.url_media}
                      alt=""
                      style={{ ...styles.mediaPhoto, width: "100%", borderRadius: "8px", cursor: "pointer" }}
                      onClick={() => setImageModal(media.url_media)}
                    />
                  )}
                  {media.type_media === "video" && (
                    <video controls style={{ width: "100%", borderRadius: "8px" }}>
                      <source src={media.url_media} />
                    </video>
                  )}
                  {media.type_media === "pdf" && (
                    <a
                      href={`https://docs.google.com/viewer?url=${encodeURIComponent(media.url_media)}&embedded=true`}
                      target="_blank" rel="noopener noreferrer"
                      style={styles.pdfLink}
                    >
                      <span>📄</span>
                      <span style={{ fontSize: 12 }}>{media.nom_original || "PDF"}</span>
                    </a>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* 4. Stats & Reactions */}
          <div style={styles.pubStats}>
            <div style={{ display: "flex", gap: "8px" }}>
              {/* Thabet esm el column mel backend: likes wela nb_likes */}
              { (pub.likes > 0 || pub.nb_likes > 0) && <span>👍 {pub.likes || pub.nb_likes}</span> }
              { (pub.loves > 0 || pub.nb_loves > 0) && <span>❤️ {pub.loves || pub.nb_loves}</span> }
              { (pub.wows > 0 || pub.nb_wows > 0) && <span>😮 {pub.wows || pub.nb_wows}</span> }
            </div>
            <div style={{ color: "#666", fontSize: "0.85rem" }}>
              {pub.nb_commentaires || pub.nb_comments || 0} commentaires
            </div>
          </div>

          <hr style={{ border: "0.5px solid #eee", margin: "12px 0" }} />

          {/* 5. Action Buttons */}
          <div style={styles.pubActionButtons}>
            <button style={styles.actionBtn}>👍 Like</button>
            <button style={styles.actionBtn}>💬 Commenter</button>
            <button style={styles.actionBtn}>🔗 Partager</button>
          </div>

          {/* 6. Comment Input */}
          <div style={styles.commentSection}>
            <img 
              src={getAvatar(profile.photo_user, profile.sexe)} 
              alt="" 
              style={styles.smallAvatar} 
            />
            <input 
              type="text" 
              placeholder="Écrire un commentaire..." 
              style={styles.commentInput}
            />
          </div>

        </div>
      ))
    )}
  </div>
)}

        {/* ── PHOTOS TAB ── */}
        {activeTab === "photos" && (
          <div style={{ ...styles.card, animation: "fadeIn 0.35s ease" }}>
            <h3 style={styles.cardTitle}>Photos · <span style={styles.countBadge}>{photos.length}</span></h3>
            {photos.length === 0 ? (
              <EmptyState icon="◈" text="Aucune photo publiée" />
            ) : (
              <div style={styles.photoGrid}>
                {photos.map(photo => (
                  <div key={photo.id_media} style={styles.photoThumbWrap} onClick={() => setImageModal(photo.url_media)}>
                    <img
                      src={photo.url_media}
                      alt=""
                      className="media-thumb"
                      style={styles.photoThumb}
                    />
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ── VIDEOS TAB ── */}
        {activeTab === "videos" && (
          <div style={{ ...styles.card, animation: "fadeIn 0.35s ease" }}>
            <h3 style={styles.cardTitle}>Vidéos · <span style={styles.countBadge}>{videos.length}</span></h3>
            {videos.length === 0 ? (
              <EmptyState icon="▶" text="Aucune vidéo publiée" />
            ) : (
              <div style={styles.videoGrid}>
                {videos.map(video => (
                  <video key={video.id_media} controls style={styles.videoItem}>
                    <source src={video.url_media} />
                  </video>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ── PDFs TAB ── */}
        {activeTab === "pdfs" && (
          <div style={{ ...styles.card, animation: "fadeIn 0.35s ease" }}>
            <h3 style={styles.cardTitle}>Documents · <span style={styles.countBadge}>{pdfs.length}</span></h3>
            {pdfs.length === 0 ? (
              <EmptyState icon="⊟" text="Aucun document publié" />
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {pdfs.map(pdf => (
                  <a
                    key={pdf.id_media}
                    href={`https://docs.google.com/viewer?url=${encodeURIComponent(pdf.url_media)}&embedded=true`}
                    target="_blank" rel="noopener noreferrer"
                    style={styles.pdfRow}
                  >
                    <div style={styles.pdfIcon}>📄</div>
                    <div>
                      <p style={{ margin: 0, fontWeight: 600, fontSize: 14, color: "#1c1e21" }}>
                        {pdf.nom_original || "Document PDF"}
                      </p>
                      <p style={{ margin: 0, fontSize: 12, color: "#888" }}>PDF · Cliquer pour ouvrir</p>
                    </div>
                    <span style={{ marginLeft: "auto", color: "#6355ff", fontSize: 18 }}>↗</span>
                  </a>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ── INFOS TAB ── */}
        {activeTab === "infos" && (
          <div style={{ ...styles.card, animation: "fadeIn 0.35s ease" }}>
            <h3 style={styles.cardTitle}>Informations personnelles</h3>
            <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>
              {[
                { icon: "👤", label: "Nom complet", value: `${profile.prenom_user || ""} ${profile.nom_user || ""}`.trim() },
                { icon: "📧", label: "Email", value: profile.email_user },
                { icon: "📱", label: "Téléphone", value: profile.telephone_user },
                { icon: "🎂", label: "Âge", value: profile.age },
                { icon: "⚧", label: "Sexe", value: profile.sexe },
                { icon: "🎓", label: "Statut", value: profile.statut },
                { icon: "🏫", label: "Établissement", value: profile.etablissement },
                { icon: "🗺️", label: "Gouvernorat", value: profile.gouvernorat },
                { icon: "📍", label: "Délégation", value: profile.delegation },
                { icon: "🏙️", label: "Ville", value: profile.ville },
              ].filter(i => i.value).map((info, idx) => (
                <div key={info.label} style={{
                  ...styles.infoRow,
                  borderBottom: idx < 9 ? "1px solid #f4f3ff" : "none"
                }}>
                  <div style={styles.infoIconWrap}>{info.icon}</div>
                  <div>
                    <p style={styles.infoLabel}>{info.label}</p>
                    <p style={styles.infoValue}>{info.value}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* ───── IMAGE MODAL ───── */}
      {imageModal && (
        <div onClick={() => setImageModal(null)} style={styles.modalOverlay}>
          <button onClick={() => setImageModal(null)} style={styles.modalClose}>✕</button>
          <img
            src={imageModal}
            alt=""
            onClick={e => e.stopPropagation()}
            style={styles.modalImg}
          />
        </div>
      )}
    </div>
  );
}

function EmptyState({ icon, text }) {
  return (
    <div style={{ textAlign: "center", padding: "56px 0", color: "#aaa" }}>
      <div style={{ fontSize: 40, marginBottom: 12, opacity: 0.4 }}>{icon}</div>
      <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 15 }}>{text}</p>
    </div>
  );
}

// ─── STYLES ─────────────────────────────────────────────
const styles = {
  root: {
    background: "#f7f7fb",
    minHeight: "100vh",
    fontFamily: "'DM Sans', system-ui, sans-serif",
    color: "#1c1e21",
  },
  loadingWrap: {
    display: "flex", flexDirection: "column",
    alignItems: "center", justifyContent: "center",
    height: "100vh", background: "#f7f7fb", gap: 16,
  },
  loadingSpinner: {
    width: 40, height: 40, borderRadius: "50%",
    border: "3px solid #e8e7ff",
    borderTopColor: "#6355ff",
    animation: "spin 0.8s linear infinite",
  },
  loadingText: { color: "#888", fontFamily: "'DM Sans', sans-serif", fontSize: 15 },
  notFound: { display: "flex", alignItems: "center", justifyContent: "center", height: "100vh", color: "#888" },

  // Hero
  hero: {
    background: "white",
    boxShadow: "0 2px 12px rgba(0,0,0,0.06)",
    paddingBottom: 0,
    position: "relative",
  },
  coverBg: {
    height: 260,
    background: "linear-gradient(135deg, #1a1a2e 0%, #16213e 40%, #0f3460 70%, #533483 100%)",
    position: "relative",
  },
  backBtn: {
    position: "absolute", top: 18, left: 18, zIndex: 10,
    background: "rgba(255,255,255,0.15)",
    backdropFilter: "blur(8px)",
    border: "1px solid rgba(255,255,255,0.25)",
    borderRadius: 20,
    padding: "8px 18px",
    color: "white", fontWeight: 600, fontSize: 14,
    cursor: "pointer", transition: "background 0.2s",
    fontFamily: "'DM Sans', sans-serif",
  },
  avatarZone: {
    maxWidth: 900, margin: "0 auto",
    padding: "0 24px",
    display: "flex", alignItems: "flex-end", gap: 20,
    marginTop: -70, paddingBottom: 20, flexWrap: "wrap",
  },
  avatarWrap: { position: "relative", flexShrink: 0 },
  avatarImg: {
    width: 148, height: 148, borderRadius: "50%",
    border: "5px solid white",
    objectFit: "cover",
    boxShadow: "0 4px 20px rgba(0,0,0,0.18)",
  },
  avatarEditBtn: {
    position: "absolute", bottom: 6, right: 6,
    background: "white",
    border: "2px solid #e8e7ff",
    borderRadius: "50%",
    width: 36, height: 36,
    display: "flex", alignItems: "center", justifyContent: "center",
    cursor: "pointer", boxShadow: "0 2px 8px rgba(0,0,0,0.12)",
    transition: "all 0.2s",
  },
  heroInfo: { flex: 1, paddingBottom: 8, paddingTop: 72 },
  heroName: {
    margin: "0 0 6px",
    fontSize: 26, fontWeight: 700,
    fontFamily: "'Playfair Display', serif",
    color: "#1c1e21",
  },
  heroSub: { margin: "0 0 4px", display: "flex", alignItems: "center", flexWrap: "wrap", gap: 6 },
  badge: {
    background: "#f0eeff", color: "#6355ff",
    borderRadius: 20, padding: "3px 12px",
    fontSize: 13, fontWeight: 600,
  },
  heroLocation: { margin: 0, color: "#888", fontSize: 13 },
  editProfileBtn: {
    alignSelf: "flex-end", marginBottom: 8,
    background: "#6355ff", color: "white",
    border: "none", borderRadius: 10,
    padding: "10px 20px",
    fontWeight: 600, fontSize: 14,
    cursor: "pointer", transition: "background 0.2s",
    fontFamily: "'DM Sans', sans-serif",
    whiteSpace: "nowrap",
  },
  editProfileBtnActive: {
    background: "#e8e7ff", color: "#6355ff",
  },

  // Stats
  statsBar: {
    maxWidth: 900, margin: "0 auto",
    padding: "12px 24px 0",
    display: "flex", gap: 12, flexWrap: "wrap",
    borderTop: "1px solid #f4f3ff",
    paddingTop: 16, paddingBottom: 4,
  },
  statCard: {
    flex: 1, minWidth: 90,
    display: "flex", flexDirection: "column", alignItems: "center",
    background: "#f7f7fb",
    border: "1px solid #e8e7ff",
    borderRadius: 12, padding: "12px 8px",
    cursor: "pointer", transition: "all 0.2s",
    boxShadow: "0 2px 8px rgba(0,0,0,0.04)",
  },
  statIcon: { fontSize: 16, color: "#6355ff", marginBottom: 4 },
  statValue: { fontSize: 20, fontWeight: 700, color: "#1c1e21", lineHeight: 1 },
  statLabel: { fontSize: 11, color: "#888", marginTop: 3, textAlign: "center" },

  // Tabs
  tabsWrap: {
    background: "white",
    borderTop: "1px solid #f0eeff",
    boxShadow: "0 2px 8px rgba(0,0,0,0.04)",
    position: "sticky", top: 0, zIndex: 100,
  },
  tabsInner: {
    maxWidth: 900, margin: "0 auto",
    display: "flex", gap: 0,
    padding: "0 16px",
    overflowX: "auto",
  },
  tabBtn: {
    background: "none", border: "none",
    padding: "14px 18px",
    cursor: "pointer", fontWeight: 500,
    color: "#888", fontSize: 14,
    borderBottom: "3px solid transparent",
    transition: "all 0.2s",
    whiteSpace: "nowrap",
    fontFamily: "'DM Sans', sans-serif",
  },
  tabBtnActive: {
    color: "#6355ff", fontWeight: 700,
    borderBottom: "3px solid #6355ff",
  },

  // Content
  content: {
    maxWidth: 900, margin: "0 auto",
    padding: "24px 16px 48px",
  },
  card: {
    background: "white",
    borderRadius: 16,
    padding: 24,
    boxShadow: "0 2px 12px rgba(0,0,0,0.05)",
    border: "1px solid #f0eeff",
  },
  cardTitle: {
    margin: "0 0 20px",
    fontSize: 16, fontWeight: 700,
    color: "#1c1e21",
    fontFamily: "'Playfair Display', serif",
    display: "flex", alignItems: "center", gap: 8,
  },
  countBadge: {
    background: "#f0eeff", color: "#6355ff",
    borderRadius: 20, padding: "2px 10px",
    fontSize: 13, fontWeight: 600,
    fontFamily: "'DM Sans', sans-serif",
  },

  // Publications
  pubHeader: { display: "flex", alignItems: "center", gap: 12, marginBottom: 14 },
  pubAvatar: { width: 44, height: 44, borderRadius: "50%", objectFit: "cover", border: "2px solid #f0eeff" },
  pubAuthor: { margin: 0, fontWeight: 700, fontSize: 14, color: "#1c1e21" },
  pubDate: { margin: 0, fontSize: 12, color: "#aaa" },
  pubTitle: { margin: "0 0 8px", fontSize: 16, fontWeight: 700, color: "#1c1e21" },
  pubContent: { margin: "0 0 12px", color: "#333", lineHeight: 1.6, fontSize: 15 },
  mediaGrid: {
    display: "grid", gap: 4,
    borderRadius: 12, overflow: "hidden",
    marginTop: 8,
  },
  mediaPhoto: {
    width: "100%", aspectRatio: "1 / 0.75",
    objectFit: "cover", cursor: "pointer",
    transition: "opacity 0.2s, transform 0.2s",
    display: "block",
  },
  mediaVideo: { width: "100%", borderRadius: 8, maxHeight: 360 },
  pdfLink: {
    display: "flex", alignItems: "center", gap: 10,
    background: "#f7f7fb", padding: "12px 14px",
    borderRadius: 10, textDecoration: "none",
    color: "#1c1e21", border: "1px solid #e8e7ff",
  },
  reactionsBar: {
    display: "flex", alignItems: "center", flexWrap: "wrap",
    gap: 6, marginTop: 12, paddingTop: 12,
    borderTop: "1px solid #f4f3ff",
  },
  reactionChip: {
    background: "#f7f7fb", border: "1px solid #e8e7ff",
    borderRadius: 20, padding: "3px 10px",
    fontSize: 13, display: "flex", alignItems: "center", gap: 4,
  },
  commentCount: { marginLeft: "auto", fontSize: 13, color: "#888" },

  // Photos grid
  photoGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fill, minmax(160px, 1fr))",
    gap: 6,
  },
  photoThumbWrap: {
    aspectRatio: "1",
    overflow: "hidden", borderRadius: 10, cursor: "pointer",
  },
  photoThumb: {
    width: "100%", height: "100%",
    objectFit: "cover",
    transition: "opacity 0.2s, transform 0.2s",
    display: "block",
  },

  // Videos grid
  videoGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
    gap: 12,
  },
  videoItem: { width: "100%", borderRadius: 10, background: "#000" },

  // PDF row
  pdfRow: {
    display: "flex", alignItems: "center", gap: 14,
    background: "#f7f7fb", padding: "14px 16px",
    borderRadius: 12, textDecoration: "none",
    border: "1px solid #e8e7ff",
    transition: "border-color 0.2s, box-shadow 0.2s",
  },
  pdfIcon: {
    width: 48, height: 48,
    background: "#f0eeff", borderRadius: 10,
    display: "flex", alignItems: "center", justifyContent: "center",
    fontSize: 24, flexShrink: 0,
  },

  // Info tab
  infoRow: {
    display: "flex", alignItems: "center", gap: 14,
    padding: "14px 0",
  },
  infoIconWrap: {
    width: 40, height: 40, borderRadius: 10,
    background: "#f0eeff",
    display: "flex", alignItems: "center", justifyContent: "center",
    fontSize: 18, flexShrink: 0,
  },
  infoLabel: { margin: 0, fontSize: 11, color: "#aaa", marginBottom: 2 },
  infoValue: { margin: 0, fontWeight: 600, fontSize: 15, color: "#1c1e21" },

  // Edit form
  formGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(2, 1fr)",
    gap: "14px 20px",
  },
  formField: {},
  formLabel: {
    display: "block", fontWeight: 600,
    fontSize: 12, color: "#888",
    marginBottom: 6, textTransform: "uppercase",
    letterSpacing: "0.5px",
  },
  formInput: {
    width: "100%", padding: "10px 14px",
    border: "1.5px solid #e8e7ff",
    borderRadius: 10, fontSize: 15,
    fontFamily: "'DM Sans', sans-serif",
    background: "#fafaff",
    transition: "border-color 0.2s, box-shadow 0.2s",
    color: "#1c1e21",
  },
  saveBtn: {
    background: "#6355ff", color: "white",
    border: "none", borderRadius: 10,
    padding: "12px 24px", cursor: "pointer",
    fontWeight: 700, fontSize: 15,
    fontFamily: "'DM Sans', sans-serif",
    transition: "background 0.2s",
  },
  cancelBtn: {
    background: "#f0eeff", color: "#6355ff",
    border: "none", borderRadius: 10,
    padding: "12px 20px", cursor: "pointer",
    fontWeight: 600, fontSize: 15,
    fontFamily: "'DM Sans', sans-serif",
    transition: "background 0.2s",
  },

  // Toast
  toast: {
    background: "#1a1a2e", color: "white",
    borderRadius: 12, padding: "14px 20px",
    marginBottom: 16, fontSize: 14, fontWeight: 600,
    display: "flex", alignItems: "center", gap: 8,
    animation: "slideDown 0.3s ease",
    border: "1px solid #6355ff",
  },

  // Modal
  modalOverlay: {
    position: "fixed", inset: 0,
    background: "rgba(10,10,20,0.92)",
    zIndex: 2000, display: "flex",
    alignItems: "center", justifyContent: "center",
    backdropFilter: "blur(4px)",
  },
  modalClose: {
    position: "absolute", top: 20, right: 20,
    background: "rgba(255,255,255,0.1)",
    border: "1px solid rgba(255,255,255,0.2)",
    color: "white", fontSize: 22, cursor: "pointer",
    borderRadius: "50%", width: 44, height: 44,
    display: "flex", alignItems: "center", justifyContent: "center",
    fontFamily: "sans-serif",
  },
  modalImg: {
    maxWidth: "92vw", maxHeight: "88vh",
    objectFit: "contain", borderRadius: 12,
    boxShadow: "0 24px 80px rgba(0,0,0,0.5)",
  },
  pubCard: {
    backgroundColor: "#fff",
    borderRadius: "12px",
    padding: "16px",
    border: "1px solid #e0e0e0",
    boxShadow: "0 2px 12px rgba(0,0,0,0.04)",
    transition: "all 0.3s ease",
  },
  pubHeader: {
    display: "flex",
    alignItems: "center",
    gap: "12px",
    marginBottom: "14px",
  },
  pubAvatar: {
    width: "48px",
    height: "48px",
    borderRadius: "50%",
    objectFit: "cover",
    border: "2px solid #f0f0f0",
  },
  pubAuthor: {
    margin: 0,
    fontWeight: "600",
    fontSize: "1rem",
    color: "#1c1e21",
  },
  pubDate: {
    margin: 0,
    fontSize: "0.85rem",
    color: "#65676b",
  },
  pubTitle: {
    margin: "0 0 8px 0",
    fontSize: "1.2rem",
    color: "#1c1e21",
    fontFamily: "'Playfair Display', serif",
  },
  pubContent: {
    marginBottom: "12px",
  },
  mediaGrid: {
    margin: "12px 0",
    borderRadius: "8px",
    overflow: "hidden",
  },
  mediaPhoto: {
    width: "100%",
    maxHeight: "450px",
    objectFit: "cover",
    backgroundColor: "#f8f9fa",
  },
  pdfLink: {
    display: "flex",
    alignItems: "center",
    gap: "10px",
    padding: "12px",
    backgroundColor: "#f8f9fa",
    borderRadius: "8px",
    textDecoration: "none",
    color: "#333",
    border: "1px solid #eee",
  },
  pubStats: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "8px 4px",
    fontSize: "0.9rem",
    color: "#65676b",
  },
  pubActionButtons: {
    display: "flex",
    justifyContent: "space-around",
    padding: "4px 0",
  },
  actionBtn: {
    flex: 1,
    padding: "10px",
    border: "none",
    backgroundColor: "transparent",
    borderRadius: "6px",
    cursor: "pointer",
    fontSize: "0.95rem",
    fontWeight: "500",
    color: "#65676b",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "6px",
    transition: "background 0.2s",
  },
  commentSection: {
    display: "flex",
    alignItems: "center",
    gap: "10px",
    marginTop: "12px",
  },
  smallAvatar: {
    width: "32px",
    height: "32px",
    borderRadius: "50%",
    objectFit: "cover",
  },
  commentInput: {
    flex: 1,
    backgroundColor: "#f0f2f5",
    border: "none",
    borderRadius: "20px",
    padding: "10px 16px",
    fontSize: "0.9rem",
    outline: "none",
  },
  
};