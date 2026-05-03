import React, { useEffect, useState } from "react";
import axios from "axios";
import "./ManageUsers.css";

// Helper pour avoir les headers avec token
const getAuthHeaders = () => {
  const token = localStorage.getItem("token");
  return {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  };
};

const ManageUsers = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("tous");

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const res = await axios.get(
        "http://localhost:5000/api/admin/users",
        getAuthHeaders() // ✅ Token envoyé
      );
      setUsers(res.data);
    } catch (err) {
      console.error("Erreur fetchUsers:", err);
      if (err.response?.status === 403) {
        alert("Session expirée, reconnectez-vous");
        window.location.href = "/admin/login";
      }
    } finally {
      setLoading(false);
    }
  };

  const handleAction = async (id, action) => {
    const messages = {
      approve: "valider",
      block: "bloquer",
      delete: "supprimer définitivement",
    };

    if (!window.confirm(`Voulez-vous ${messages[action]} cet utilisateur ?`))
      return;

    try {
      if (action === "delete") {
        await axios.delete(
          `http://localhost:5000/api/admin/users/${id}`,
          getAuthHeaders()
        );
      } else {
        await axios.put(
          `http://localhost:5000/api/admin/users/${id}/${action}`,
          {},
          getAuthHeaders()
        );
      }
      fetchUsers(); // Rafraîchir
    } catch (err) {
      console.error("Erreur action:", err);
      alert("Erreur lors de l'opération");
    }
  };

  // Filtrage local
  const filteredUsers = users.filter((u) => {
    const matchSearch =
      u.nom_user?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.email_user?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchStatus =
      filterStatus === "tous" || u.status_user === filterStatus;
    return matchSearch && matchStatus;
  });

  if (loading) {
    return (
      <div className="loading-container">
        <div className="spinner"></div>
        <p>Chargement...</p>
      </div>
    );
  }

  return (
    <div className="users-management">
      <div className="management-header">
        <h3>👥 Gestion des Jeunes ({users.length} inscrits)</h3>

        {/* Barre de recherche + filtre */}
        <div className="filters">
          <input
            type="text"
            placeholder="🔍 Rechercher..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="search-input"
          />
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="filter-select"
          >
            <option value="tous">Tous les statuts</option>
            <option value="actif">Actifs</option>
            <option value="bloque">Bloqués</option>
            <option value="en_attente">En attente</option>
          </select>
        </div>
      </div>

      {filteredUsers.length === 0 ? (
        <div className="empty-state">
          <p>Aucun utilisateur trouvé</p>
        </div>
      ) : (
        <div className="table-responsive">
          <table className="users-table">
            <thead>
              <tr>
                <th>#</th>
                <th>Nom & Prénom</th>
                <th>Email</th>
                <th>Établissement</th>
                <th>Ville</th>
                <th>Statut</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredUsers.map((u, index) => (
                <tr key={u.id_user}>
                  <td>{index + 1}</td>
                  <td>
                    <strong>
                      {u.nom_user} {u.prenom_user}
                    </strong>
                  </td>
                  <td>{u.email_user}</td>
                  <td>{u.etablissement || "—"}</td>
                  <td>{u.gouvernorat_jeune || "—"}</td>
                  <td>
                    <span className={`status-badge ${u.status_user}`}>
                      {u.status_user === "actif" && "✅ Actif"}
                      {u.status_user === "bloque" && "🚫 Bloqué"}
                      {u.status_user === "en_attente" && "⏳ En attente"}
                    </span>
                  </td>
                  <td className="actions-cell">
                    {u.status_user !== "actif" && (
                      <button
                        className="btn-approve"
                        onClick={() => handleAction(u.id_user, "approve")}
                        title="Valider le compte"
                      >
                        ✓ Valider
                      </button>
                    )}
                    {u.status_user !== "bloque" && (
                      <button
                        className="btn-block"
                        onClick={() => handleAction(u.id_user, "block")}
                        title="Bloquer le compte"
                      >
                        ⚠ Bloquer
                      </button>
                    )}
                    <button
                      className="btn-delete"
                      onClick={() => handleAction(u.id_user, "delete")}
                      title="Supprimer définitivement"
                    >
                      🗑
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default ManageUsers;