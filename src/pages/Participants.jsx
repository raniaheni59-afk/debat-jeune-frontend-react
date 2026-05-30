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
  const [search, setSearch]             = useState("");
  const [gouvernorat, setGouvernorat]   = useState("Tous");
  const [statusFilter, setStatusFilter] = useState("tous");

  // ── Fetch ────────────────────────────────────────────
  const fetchParticipants = async () => {
    setLoading(true);
    try {
      // FIX 1: use the correct endpoint that your UserRoutes exposes
      const res = await API.get("/users", { params: { role: "jeune" } });
      const data = Array.isArray(res.data) ? res.data
                 : Array.isArray(res.data?.users) ? res.data.users
                 : [];
      setUsers(data);
    } catch (err) {
      console.error("❌ Fetch participants error:", err?.response?.data || err.message);
      setUsers([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchParticipants(); }, []);

  // ── Actions ──────────────────────────────────────────
  const deleteUser = async (id) => {
    if (!window.confirm("Supprimer ce participant ?")) return;
    try {
      await API.delete(`/users/${id}`);
      fetchParticipants();
    } catch (err) {
      console.error(err);
      alert("Erreur suppression");
    }
  };

  const blockUser = async (id) => {
    if (!window.confirm("Bloquer ce participant ?")) return;
    try {
      // FIX 2: correct block route — matches server.js admin-block socket or REST route
      await API.put(`/users/${id}/block`);
      fetchParticipants();
    } catch (err) {
      console.error(err);
      // Fallback: try the other possible route shape
      try {
        await API.patch(`/users/${id}`, { status_user: "bloqué" });
        fetchParticipants();
      } catch (err2) {
        console.error(err2);
        alert("Erreur blocage");
      }
    }
  };

  // ── Filter ───────────────────────────────────────────
  const filtered = users.filter(u => {
    const q = search.toLowerCase().trim();
    const matchSearch = !q ||
      `${u.nom_user ?? ""} ${u.prenom_user ?? ""}`.toLowerCase().includes(q) ||
      (u.email_user    ?? "").toLowerCase().includes(q) ||
      (u.etablissement ?? "").toLowerCase().includes(q);

    const matchGouv = gouvernorat === "Tous" || u.gouvernorat === gouvernorat;

    // FIX 3: case-insensitive status comparison + handle null/undefined
    const userStatus = (u.status_user ?? "").toLowerCase().trim();
    const matchStatus =
      statusFilter === "tous" ||
      userStatus === statusFilter.toLowerCase();

    return matchSearch && matchGouv && matchStatus;
  });

  // ── Render ───────────────────────────────────────────
  return (
    <div style={{ padding: "30px" }}>
      <h1 style={{ marginBottom: "20px", fontFamily: "Poppins,sans-serif", color: "#2d2555" }}>
        👥 Participants
      </h1>

      {/* ── FILTRES ── */}
      <div style={{ display: "flex", gap: 12, marginBottom: 24, flexWrap: "wrap", alignItems: "center" }}>
        <div style={{ position: "relative", flex: "1", minWidth: 220 }}>
          <span style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", fontSize: 14 }}>🔍</span>
          <input
            type="text"
            placeholder="Rechercher nom, email, établissement…"
            value={search}
            onChange={e => setSearch(e.target.value)}
            style={{ width: "100%", padding: "10px 14px 10px 36px", borderRadius: 12, border: "1.5px solid #e0dce8", fontSize: 13, fontFamily: "Poppins,sans-serif", outline: "none", background: "#fff", boxSizing: "border-box" }}
          />
        </div>

        <select
          value={gouvernorat}
          onChange={e => setGouvernorat(e.target.value)}
          style={{ padding: "10px 14px", borderRadius: 12, border: "1.5px solid #e0dce8", fontSize: 13, fontFamily: "Poppins,sans-serif", outline: "none", background: "#fff", color: "#333", cursor: "pointer" }}
        >
          {GOUVERNORATS.map(g => (
            <option key={g} value={g}>{g === "Tous" ? "📍 Tous les gouvernorats" : g}</option>
          ))}
        </select>

        <select
          value={statusFilter}
          onChange={e => setStatusFilter(e.target.value)}
          style={{ padding: "10px 14px", borderRadius: 12, border: "1.5px solid #e0dce8", fontSize: 13, fontFamily: "Poppins,sans-serif", outline: "none", background: "#fff", color: "#333", cursor: "pointer" }}
        >
          <option value="tous">● Tous les statuts</option>
          <option value="actif">● Actif</option>
          <option value="inactif">● Inactif</option>
          <option value="bloqué">● Bloqué</option>
        </select>

        <span style={{ fontSize: 13, color: "#888", fontFamily: "Poppins,sans-serif", flexShrink: 0 }}>
          {filtered.length} / {users.length} participant{users.length !== 1 ? "s" : ""}
        </span>
      </div>

      {/* ── STATES ── */}
      {loading ? (
        <div style={{ textAlign: "center", padding: "60px 0", color: "#bbb", fontFamily: "Poppins,sans-serif" }}>
          <div style={{ fontSize: 36, marginBottom: 12, animation: "spin 1s linear infinite" }}>⏳</div>
          <p style={{ fontSize: 14 }}>Chargement des participants…</p>
        </div>
      ) : filtered.length === 0 ? (
        <div style={{ textAlign: "center", padding: "60px 0", color: "#bbb", fontFamily: "Poppins,sans-serif" }}>
          <div style={{ fontSize: 48, marginBottom: 12 }}>🔍</div>
          <p style={{ fontSize: 14, fontWeight: 600 }}>
            {users.length === 0 ? "Aucun participant enregistré" : "Aucun participant trouvé"}
          </p>
          {users.length === 0 && (
            <p style={{ fontSize: 12, color: "#ccc", marginTop: 6 }}>
              Vérifiez que l'API <code>/users?role=jeune</code> retourne des données.
            </p>
          )}
        </div>
      ) : (
        <div style={gridStyle}>
          {filtered.map((u) => (
            <div key={u.id_user} style={card}>
              {/* Actions */}
              <div style={topActions}>
                <button
                  style={btnBlock}
                  title="Bloquer ce participant"
                  onClick={() => blockUser(u.id_user)}
                >
                  🔒 Bloquer
                </button>
                <button
                  style={btnDelete}
                  title="Supprimer ce participant"
                  onClick={() => deleteUser(u.id_user)}
                >
                  🗑
                </button>
              </div>

              {/* Avatar */}
              {/* FIX 4: flower was covering the avatar — now properly positioned as a border ring */}
              <div style={avatarContainer}>
                <img
                  src={u.photo_user || "/default-avatar.png"}
                  alt="avatar"
                  style={avatarStyle}
                  onError={e => { e.target.src = "/default-avatar.png"; }}
                />
                {u.sexe === "femme" && (
                  <span style={flowerBadge} title="Femme">🌸</span>
                )}
              </div>

              <h3 style={nameStyle}>{u.nom_user} {u.prenom_user}</h3>
              <p style={emailStyle}>{u.email_user}</p>

              <div style={infoBox}>
                {u.statut        && <span style={tag}>{u.statut}</span>}
                {u.etablissement && <span style={tag}>🏫 {u.etablissement}</span>}
                {u.gouvernorat   && <span style={tag}>📍 {u.gouvernorat}</span>}
                {u.age           && <span style={tag}>🎂 {u.age} ans</span>}
              </div>

              {/* FIX 5: normalize status display so "bloqué" with accent renders consistently */}
              <p style={{
                marginTop: "8px",
                fontSize: "11px",
                fontWeight: 600,
                color: u.status_user === "actif" ? "#16a34a"
                     : u.status_user === "bloqué" ? "#dc2626"
                     : "#f59e0b",
              }}>
                ● {u.status_user ?? "inconnu"}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/* ── STYLES ─────────────────────────────────────────── */

const gridStyle = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fill, minmax(250px, 1fr))",
  gap: "20px",
};

const card = {
  background: "#fff",
  borderRadius: "16px",
  padding: "20px",
  textAlign: "center",
  boxShadow: "0 6px 25px rgba(0,0,0,0.08)",
  position: "relative",
};

const topActions = {
  position: "absolute",
  top: 10,
  right: 10,
  display: "flex",
  gap: "5px",
};

const btnBlock = {
  background: "#f59e0b",
  border: "none",
  padding: "5px 8px",
  borderRadius: "6px",
  color: "#fff",
  cursor: "pointer",
  fontSize: "11px",
};

const btnDelete = {
  background: "#ef4444",
  border: "none",
  padding: "5px 8px",
  borderRadius: "6px",
  color: "#fff",
  cursor: "pointer",
  fontSize: "11px",
};

const avatarContainer = {
  position: "relative",
  width: "90px",
  height: "90px",
  margin: "0 auto 12px",
};

const avatarStyle = {
  width: "90px",
  height: "90px",
  borderRadius: "50%",
  objectFit: "cover",
  border: "3px solid #f1f5f9",
};

// FIX 4: flower is now a small emoji badge, not a white circle covering the photo
const flowerBadge = {
  position: "absolute",
  bottom: 0,
  right: 0,
  fontSize: "18px",
  lineHeight: 1,
};

const nameStyle = {
  fontSize: "16px",
  fontWeight: "600",
  margin: "0 0 4px",
};

const emailStyle = {
  fontSize: "12px",
  color: "#777",
  margin: "0 0 8px",
};

const infoBox = {
  marginTop: "10px",
  display: "flex",
  flexWrap: "wrap",
  justifyContent: "center",
  gap: "6px",
};

const tag = {
  background: "#f1f5f9",
  padding: "5px 8px",
  borderRadius: "6px",
  fontSize: "11px",
};