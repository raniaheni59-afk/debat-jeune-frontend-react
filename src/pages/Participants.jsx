import { useEffect, useState } from "react";
import API from "../services/api";

const GOUVERNORATS = [
  "Tous","Tunis","Ariana","Ben Arous","Manouba","Nabeul","Zaghouan","Bizerte",
  "Béja","Jendouba","Kef","Siliana","Sousse","Monastir","Mahdia","Sfax",
  "Kairouan","Kasserine","Sidi Bouzid","Gabes","Mednine","Tataouine",
  "Gafsa","Tozeur","Kebili",
];

export default function Participants() {
  const [users, setUsers]               = useState([]);
  const [loading, setLoading]           = useState(true);
  const [error, setError]               = useState(null);
  const [search, setSearch]             = useState("");
  const [gouvernorat, setGouvernorat]   = useState("Tous");
  const [statusFilter, setStatusFilter] = useState("tous");

  // ── Fetch: essaie plusieurs endpoints jusqu'au succès ────
  const fetchParticipants = async () => {
    setLoading(true);
    setError(null);

    // Liste des endpoints à essayer dans l'ordre
    const endpoints = [
      { url: "/users",              params: { role: "jeune" } },
      { url: "/admin/users",        params: { role: "jeune" } },
      { url: "/admin/participants", params: {} },
      { url: "/auth/users",         params: { role: "jeune" } },
    ];

    for (const ep of endpoints) {
      try {
        const res = await API.get(ep.url, {
          params: ep.params,
          headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
        });

        const data = Array.isArray(res.data)         ? res.data
                   : Array.isArray(res.data?.users)  ? res.data.users
                   : Array.isArray(res.data?.data)   ? res.data.data
                   : [];

        // Filtrer uniquement les jeunes (au cas où le backend renvoie tout)
        const jeunesOnly = data.filter(u =>
          !u.role || u.role === "jeune" || u.role === "user"
        );

        setUsers(jeunesOnly);
        setLoading(false);
        return; // succès — on arrête
      } catch (err) {
        console.warn(`❌ ${ep.url} failed:`, err?.response?.status, err?.response?.data?.message || err.message);
        // continuer vers le prochain endpoint
      }
    }

    // Tous les endpoints ont échoué
    setError("Impossible de charger les participants. Vérifiez que l'API backend est en ligne.");
    setUsers([]);
    setLoading(false);
  };

  useEffect(() => { fetchParticipants(); }, []);

  // ── Actions ──────────────────────────────────────────────
  const deleteUser = async (id) => {
    if (!window.confirm("Supprimer ce participant ?")) return;
    try {
      await API.delete(`/users/${id}`, {
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
      });
      fetchParticipants();
    } catch (err) {
      console.error(err);
      alert("Erreur suppression: " + (err?.response?.data?.message || err.message));
    }
  };

  const blockUser = async (id) => {
    if (!window.confirm("Bloquer ce participant ?")) return;
    try {
      await API.put(`/users/${id}/block`, {}, {
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
      });
      fetchParticipants();
    } catch {
      try {
        await API.patch(`/users/${id}`, { status_user: "bloqué" }, {
          headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
        });
        fetchParticipants();
      } catch (err2) {
        alert("Erreur blocage: " + (err2?.response?.data?.message || err2.message));
      }
    }
  };

  // ── Filter ───────────────────────────────────────────────
  const filtered = users.filter(u => {
    const q = search.toLowerCase().trim();
    const matchSearch = !q ||
      `${u.nom_user ?? ""} ${u.prenom_user ?? ""}`.toLowerCase().includes(q) ||
      (u.email_user    ?? "").toLowerCase().includes(q) ||
      (u.etablissement ?? "").toLowerCase().includes(q);
    const matchGouv   = gouvernorat === "Tous" || u.gouvernorat === gouvernorat;
    const userStatus  = (u.status_user ?? "").toLowerCase().trim();
    const matchStatus = statusFilter === "tous" || userStatus === statusFilter.toLowerCase();
    return matchSearch && matchGouv && matchStatus;
  });

  // ── Resolve photo URL ────────────────────────────────────
  const resolvePhoto = (photo) => {
    if (!photo) return null;
    if (photo.startsWith("http")) return photo;
    const BASE = import.meta.env.VITE_BACKEND_URL || "https://debat-jeune.onrender.com";
    return `${BASE}/${photo.replace(/^\//, "")}`;
  };

  // ── Status color ─────────────────────────────────────────
  const statusColor = (s) =>
    (s ?? "").toLowerCase() === "actif"  ? "#16a34a" :
    (s ?? "").toLowerCase() === "bloqué" ? "#dc2626" : "#f59e0b";

  // ── Render ───────────────────────────────────────────────
  return (
    <div style={{ padding: "30px" }}>
      <h1 style={{ marginBottom: "20px", fontFamily: "Poppins,sans-serif", color: "#2d2555" }}>
        👥 Participants
      </h1>

      {/* FILTRES */}
      <div style={{ display: "flex", gap: 12, marginBottom: 24, flexWrap: "wrap", alignItems: "center" }}>
        <div style={{ position: "relative", flex: "1", minWidth: 220 }}>
          <span style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", fontSize: 14 }}>🔍</span>
          <input
            type="text"
            placeholder="Rechercher nom, email, établissement…"
            value={search}
            onChange={e => setSearch(e.target.value)}
            style={{ width: "100%", padding: "10px 14px 10px 36px", borderRadius: 12, border: "1.5px solid #e0dce8", fontSize: 13, fontFamily: "Poppins,sans-serif", outline: "none", background: "#fff", boxSizing: "border-box", color: "#333" }}
          />
        </div>
        <select value={gouvernorat} onChange={e => setGouvernorat(e.target.value)}
          style={{ padding: "10px 14px", borderRadius: 12, border: "1.5px solid #e0dce8", fontSize: 13, fontFamily: "Poppins,sans-serif", outline: "none", background: "#fff", color: "#333", cursor: "pointer" }}>
          {GOUVERNORATS.map(g => <option key={g} value={g}>{g === "Tous" ? "📍 Tous les gouvernorats" : g}</option>)}
        </select>
        <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)}
          style={{ padding: "10px 14px", borderRadius: 12, border: "1.5px solid #e0dce8", fontSize: 13, fontFamily: "Poppins,sans-serif", outline: "none", background: "#fff", color: "#333", cursor: "pointer" }}>
          <option value="tous">● Tous les statuts</option>
          <option value="actif">● Actif</option>
          <option value="inactif">● Inactif</option>
          <option value="bloqué">● Bloqué</option>
        </select>
        <span style={{ fontSize: 13, color: "#888", fontFamily: "Poppins,sans-serif", flexShrink: 0 }}>
          {filtered.length} / {users.length} participant{users.length !== 1 ? "s" : ""}
        </span>
        <button onClick={fetchParticipants}
          style={{ padding: "10px 16px", borderRadius: 12, border: "1.5px solid #e0dce8", background: "#fff", color: "#5a3fa0", fontSize: 12, fontWeight: 600, cursor: "pointer", fontFamily: "Poppins,sans-serif" }}>
          🔄 Rafraîchir
        </button>
      </div>

      {/* STATES */}
      {loading ? (
        <div style={{ textAlign: "center", padding: "60px 0", color: "#bbb", fontFamily: "Poppins,sans-serif" }}>
          <div style={{ fontSize: 36, marginBottom: 12 }}>⏳</div>
          <p>Chargement des participants…</p>
        </div>

      ) : error ? (
        <div style={{ textAlign: "center", padding: "60px 0", fontFamily: "Poppins,sans-serif" }}>
          <div style={{ fontSize: 48, marginBottom: 12 }}>⚠️</div>
          <p style={{ color: "#dc2626", fontWeight: 600, fontSize: 14 }}>{error}</p>
          <p style={{ color: "#aaa", fontSize: 12, marginTop: 8 }}>
            Le backend Render peut être en veille — attendez 30s puis réessayez.
          </p>
          <button onClick={fetchParticipants}
            style={{ marginTop: 16, padding: "10px 24px", borderRadius: 12, border: "none", background: "#5a3fa0", color: "#fff", fontSize: 13, fontWeight: 600, cursor: "pointer", fontFamily: "Poppins,sans-serif" }}>
            🔄 Réessayer
          </button>
        </div>

      ) : filtered.length === 0 ? (
        <div style={{ textAlign: "center", padding: "60px 0", color: "#bbb", fontFamily: "Poppins,sans-serif" }}>
          <div style={{ fontSize: 48, marginBottom: 12 }}>🔍</div>
          <p style={{ fontSize: 14, fontWeight: 600 }}>
            {users.length === 0 ? "Aucun participant enregistré" : "Aucun résultat pour ces filtres"}
          </p>
        </div>

      ) : (
        <div style={gridStyle}>
          {filtered.map(u => {
            const photoUrl = resolvePhoto(u.photo_user);
            const initiale = (u.prenom_user?.[0] ?? u.nom_user?.[0] ?? "?").toUpperCase();
            return (
              <div key={u.id_user} style={card}>
                <div style={topActions}>
                  <button style={btnBlock} onClick={() => blockUser(u.id_user)}>🔒 Bloquer</button>
                  <button style={btnDelete} onClick={() => deleteUser(u.id_user)}>🗑</button>
                </div>

                <div style={avatarContainer}>
                  {photoUrl ? (
                    <img src={photoUrl} alt="avatar" style={avatarImg}
                      onError={e => { e.target.onerror = null; e.target.style.display = "none"; e.target.nextSibling.style.display = "flex"; }} />
                  ) : null}
                  <div style={{ ...avatarFallback, display: photoUrl ? "none" : "flex" }}>
                    <span style={{ fontSize: 30, fontWeight: 700, color: "#7c5cbf", fontFamily: "Poppins,sans-serif" }}>{initiale}</span>
                  </div>
                  {u.sexe === "femme" && <span style={flowerBadge}>🌸</span>}
                </div>

                <h3 style={nameStyle}>{u.nom_user} {u.prenom_user}</h3>
                <p style={emailStyle}>{u.email_user}</p>

                <div style={infoBox}>
                  {u.statut        && <span style={tag}>{u.statut}</span>}
                  {u.etablissement && <span style={tag}>🏫 {u.etablissement}</span>}
                  {u.gouvernorat   && <span style={tag}>📍 {u.gouvernorat}</span>}
                  {u.age           && <span style={tag}>🎂 {u.age} ans</span>}
                </div>

                <p style={{ marginTop: 8, fontSize: 11, fontWeight: 600, color: statusColor(u.status_user), fontFamily: "Poppins,sans-serif" }}>
                  ● {u.status_user ?? "inconnu"}
                </p>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

/* ── STYLES ──────────────────────────────────────────── */
const gridStyle = { display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(250px, 1fr))", gap: 20 };
const card = { backgroundColor: "#ffffff", borderRadius: 16, padding: 20, textAlign: "center", boxShadow: "0 6px 25px rgba(0,0,0,0.08)", position: "relative", color: "#333" };
const topActions = { position: "absolute", top: 10, right: 10, display: "flex", gap: 5 };
const btnBlock = { background: "#f59e0b", border: "none", padding: "5px 8px", borderRadius: 6, color: "#fff", cursor: "pointer", fontSize: 11, fontFamily: "Poppins,sans-serif" };
const btnDelete = { background: "#ef4444", border: "none", padding: "5px 8px", borderRadius: 6, color: "#fff", cursor: "pointer", fontSize: 11, fontFamily: "Poppins,sans-serif" };
const avatarContainer = { position: "relative", width: 90, height: 90, margin: "0 auto 12px" };
const avatarImg = { width: 90, height: 90, borderRadius: "50%", objectFit: "cover", border: "3px solid #e2d9f3", display: "block", background: "#f1f5f9" };
const avatarFallback = { width: 90, height: 90, borderRadius: "50%", background: "linear-gradient(135deg,#e2d9f3,#c4b5e8)", border: "3px solid #e2d9f3", alignItems: "center", justifyContent: "center" };
const flowerBadge = { position: "absolute", bottom: 0, right: 0, fontSize: 18, lineHeight: 1 };
const nameStyle = { fontSize: 16, fontWeight: 600, margin: "0 0 4px", color: "#2d2555", fontFamily: "Poppins,sans-serif" };
const emailStyle = { fontSize: 12, color: "#777", margin: "0 0 8px", fontFamily: "Poppins,sans-serif" };
const infoBox = { marginTop: 10, display: "flex", flexWrap: "wrap", justifyContent: "center", gap: 6 };
const tag = { background: "#f1f5f9", padding: "5px 8px", borderRadius: 6, fontSize: 11, color: "#555", fontFamily: "Poppins,sans-serif" };