import { useEffect, useState } from "react";
import API from "../services/api";

export default function Participants() {
  const [users, setUsers] = useState([]);



const fetchParticipants = async () => {
  console.log(" fetchParticipants CALLED");

  try {
    const res = await API.get("/users?role=jeune");
    console.log(" DATA USERS:", res.data);

    setUsers(res.data);

  } catch (err) {
    console.error("❌ ERROR:", err);
    setUsers([]); 
  }
};

useEffect(() => {
  console.log("✅ Participants mounted");

  fetchParticipants(); 
}, []);

  // ✅ Delete user
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
  return (
    
    <div style={{ padding: "30px" }}>
      <h1 style={{ marginBottom: "30px" }}>👥 Participants</h1>
       <h3>Participants: {users.length}</h3>
      <div style={grid}>
        {users.map((u) => (
          <div key={u.id_user} style={card}>

            {/* ACTIONS */}
            <div style={topActions}>
              <button style={btnBlock} onClick={() => blockUser(u.id_user)}>
                Bloquer
              </button>
              <button style={btnDelete} onClick={() => deleteUser(u.id_user)}>
                Supprimer
              </button>
            </div>

            {/* AVATAR */}
            <div style={avatarContainer}>
              <img
                src={u.photo_user || "/default-avatar.png"}
                alt="avatar"
                style={avatar}
              />

              {/* ✅ tofla (femme) */}
              {u.sexe === "femme" && (
                <img
                  src="/flower.png"
                  alt="flower"
                  style={flower}
                />
              )}
            </div>

            {/* INFO */}
            <h3 style={name}>
              {u.nom_user} {u.prenom_user}
            </h3>

            <p style={email}>{u.email_user}</p>

            {/* TAGS */}
            <div style={infoBox}>
              {u.statut && <span style={tag}>{u.statut}</span>}
              {u.etablissement && <span style={tag}>🏫 {u.etablissement}</span>}
              {u.gouvernorat && <span style={tag}>📍 {u.gouvernorat}</span>}
              {u.age && <span style={tag}>🎂 {u.age} ans</span>}
            </div>

            {/* STATUS */}
            <p style={{
              marginTop: "8px",
              fontSize: "11px",
              color: u.status_user === "actif" ? "green" : "red"
            }}>
              ● {u.status_user}
            </p>

          </div>
        ))}
      </div>
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