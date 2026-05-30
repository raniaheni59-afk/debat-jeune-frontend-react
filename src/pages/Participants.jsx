import { useEffect, useState } from "react";
import API from "../services/api";

const GOUVERNORATS = [
  "Tous","Tunis","Ariana","Ben Arous","Manouba","Nabeul","Zaghouan","Bizerte",
  "Béja","Jendouba","Kef","Siliana","Sousse","Monastir","Mahdia","Sfax",
  "Kairouan","Kasserine","Sidi Bouzid","Gabes","Mednine","Tataouine",
  "Gafsa","Tozeur","Kebili",
];

export default function Participants() {
  const [users, setUsers] = useState([]);
  const [search, setSearch] = useState("");
  const [gouvernorat, setGouvernorat] = useState("Tous");
  const [statusFilter, setStatusFilter] = useState("tous");

  const fetchParticipants = async () => {
    try {
      const res = await API.get("/users?role=jeune");
      setUsers(res.data);
    } catch (err) {
      console.error("❌ ERROR:", err);
      setUsers([]);
    }
  };

  useEffect(() => { fetchParticipants(); }, []);

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
    try {
      await API.put(`/users/block/${id}`);
      fetchParticipants();
    } catch (err) {
      console.error(err);
      alert("Erreur blocage");
    }
  };

  const filtered = users.filter(u => {
    const q = search.toLowerCase();
    const matchSearch = !q ||
      `${u.nom_user} ${u.prenom_user}`.toLowerCase().includes(q) ||
      (u.email_user || "").toLowerCase().includes(q) ||
      (u.etablissement || "").toLowerCase().includes(q);
    const matchGouv = gouvernorat === "Tous" || u.gouvernorat === gouvernorat;
    const matchStatus = statusFilter === "tous" || u.status_user === statusFilter;
    return matchSearch && matchGouv && matchStatus;
  });
  return (
    <div style={{ padding: "30px" }}>
      <h1 style={{ marginBottom: "20px", fontFamily:"Poppins,sans-serif", color:"#2d2555" }}>👥 Participants</h1>

      {/* ── FILTRES ── */}
      <div style={{ display:"flex", gap:12, marginBottom:24, flexWrap:"wrap", alignItems:"center" }}>
        {/* Search */}
        <div style={{ position:"relative", flex:"1", minWidth:220 }}>
          <span style={{ position:"absolute", left:12, top:"50%", transform:"translateY(-50%)", fontSize:14 }}>🔍</span>
          <input
            type="text"
            placeholder="Rechercher nom, email, établissement…"
            value={search}
            onChange={e => setSearch(e.target.value)}
            style={{ width:"100%", padding:"10px 14px 10px 36px", borderRadius:12, border:"1.5px solid #e0dce8", fontSize:13, fontFamily:"Poppins,sans-serif", outline:"none", background:"#fff", boxSizing:"border-box" }}
          />
        </div>

        {/* Gouvernorat filter */}
        <select
          value={gouvernorat}
          onChange={e => setGouvernorat(e.target.value)}
          style={{ padding:"10px 14px", borderRadius:12, border:"1.5px solid #e0dce8", fontSize:13, fontFamily:"Poppins,sans-serif", outline:"none", background:"#fff", color:"#333", cursor:"pointer" }}
        >
          {GOUVERNORATS.map(g => <option key={g} value={g}>{g === "Tous" ? "📍 Tous les gouvernorats" : g}</option>)}
        </select>

        {/* Statut filter */}
        <select
          value={statusFilter}
          onChange={e => setStatusFilter(e.target.value)}
          style={{ padding:"10px 14px", borderRadius:12, border:"1.5px solid #e0dce8", fontSize:13, fontFamily:"Poppins,sans-serif", outline:"none", background:"#fff", color:"#333", cursor:"pointer" }}
        >
          <option value="tous">● Tous les statuts</option>
          <option value="actif">● Actif</option>
          <option value="inactif">● Inactif</option>
          <option value="bloqué">● Bloqué</option>
        </select>

        <span style={{ fontSize:13, color:"#888", fontFamily:"Poppins,sans-serif", flexShrink:0 }}>
          {filtered.length} / {users.length} participant{users.length !== 1 ? "s" : ""}
        </span>
      </div>

      {/* ── GRID ── */}
      {filtered.length === 0 ? (
        <div style={{ textAlign:"center", padding:"60px 0", color:"#bbb", fontFamily:"Poppins,sans-serif" }}>
          <div style={{ fontSize:48, marginBottom:12 }}>🔍</div>
          <p style={{ fontSize:14, fontWeight:600 }}>Aucun participant trouvé</p>
        </div>
      ) : (
        <div style={grid}>
          {filtered.map((u) => (
            <div key={u.id_user} style={card}>
              <div style={topActions}>
                <button style={btnBlock} onClick={() => blockUser(u.id_user)}>Bloquer</button>
                <button style={btnDelete} onClick={() => deleteUser(u.id_user)}>Supprimer</button>
              </div>
              <div style={avatarContainer}>
                <img src={u.photo_user || "/default-avatar.png"} alt="avatar" style={avatar} />
                {u.sexe === "femme" && <img src="/flower.png" alt="flower" style={flower} />}
              </div>
              <h3 style={name}>{u.nom_user} {u.prenom_user}</h3>
              <p style={email}>{u.email_user}</p>
              <div style={infoBox}>
                {u.statut        && <span style={tag}>{u.statut}</span>}
                {u.etablissement && <span style={tag}>🏫 {u.etablissement}</span>}
                {u.gouvernorat   && <span style={tag}>📍 {u.gouvernorat}</span>}
                {u.age           && <span style={tag}>🎂 {u.age} ans</span>}
              </div>
              <p style={{ marginTop:"8px", fontSize:"11px", color: u.status_user === "actif" ? "green" : "red" }}>
                ● {u.status_user}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/* 🎨 STYLES */

const grid = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fill, minmax(250px,1fr))",
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
  fontSize: "11px"
};

const btnDelete = {
  background: "#ef4444",
  border: "none",
  padding: "5px 8px",
  borderRadius: "6px",
  color: "#fff",
  cursor: "pointer",
  fontSize: "11px"
};

const avatarContainer = {
  position: "relative",
  width: "90px",
  height: "90px",
  margin: "0 auto 12px",
};

const avatar = {
  width: "90px",
  height: "90px",
  borderRadius: "50%",
  objectFit: "cover",
};

const flower = {
  position: "absolute",
  top: "55%",
  left: "50%",
  transform: "translate(-50%, -50%)",
  width: "100px",
  height: "100px",
  background: "#fff",
  borderRadius: "50%",
  padding: "2px",
  boxShadow: "0 2px 6px rgba(0,0,0,0.25)"
};


const name = {
  fontSize: "16px",
  fontWeight: "600",
};

const email = {
  fontSize: "12px",
  color: "#777",
};

const infoBox = {
  marginTop: "10px",
  display: "flex",
  flexWrap: "wrap",
  justifyContent: "center",
  gap: "6px"
};

const tag = {
  background: "#f1f5f9",
  padding: "5px 8px",
  borderRadius: "6px",
  fontSize: "11px"
};