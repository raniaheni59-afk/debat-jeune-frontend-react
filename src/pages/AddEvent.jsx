import { useState } from "react";
import API from "../services/api";

const gouvernorats = [
  "Ariana", "Béja", "Ben Arous", "Bizerte", "Gabès", "Gafsa", "Jendouba",
  "Kairouan", "Kasserine", "Kébili", "Kef", "Mahdia", "Manouba", "Medenine",
  "Monastir", "Nabeul", "Sfax", "Sidi Bouzid", "Siliana", "Sousse", "Tataouine",
  "Tozeur", "Tunis", "Zaghouan"
];

export default function AddEvent() {
  const [form, setForm] = useState({
    titre: "",
    description: "",
    date: "",
    gouvernorat: "",
    lieu: ""
  });
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage("");
    setLoading(true);

    try {
      const res = await API.post("/api/events/add", form);
      setMessage("✅ Événement ajouté avec succès!");
      setForm({
        titre: "",
        description: "",
        date: "",
        gouvernorat: "",
        lieu: ""
      });
    } catch (error) {
      console.error("Erreur:", error);
      setMessage("❌ Erreur: " + (error.response?.data?.message || error.message));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: "600px", margin: "0 auto", padding: "20px" }}>
      <h2 style={{ textAlign: "center", marginBottom: "20px" }}>Ajouter un Événement</h2>

      {message && (
        <div style={{
          padding: "10px",
          marginBottom: "20px",
          backgroundColor: message.includes("✅") ? "#d4edda" : "#f8d7da",
          color: message.includes("✅") ? "#155724" : "#721c24",
          borderRadius: "4px"
        }}>
          {message}
        </div>
      )}

      <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "15px" }}>
        <div>
          <label htmlFor="titre" style={{ display: "block", marginBottom: "5px" }}>Titre:</label>
          <input
            type="text"
            id="titre"
            name="titre"
            value={form.titre}
            onChange={handleChange}
            required
            style={{ width: "100%", padding: "8px", borderRadius: "4px", border: "1px solid #ccc" }}
          />
        </div>

        <div>
          <label htmlFor="description" style={{ display: "block", marginBottom: "5px" }}>Description:</label>
          <textarea
            id="description"
            name="description"
            value={form.description}
            onChange={handleChange}
            required
            style={{ width: "100%", padding: "8px", borderRadius: "4px", border: "1px solid #ccc", minHeight: "100px" }}
          />
        </div>

        <div>
          <label htmlFor="date" style={{ display: "block", marginBottom: "5px" }}>Date:</label>
          <input
            type="date"
            id="date"
            name="date"
            value={form.date}
            onChange={handleChange}
            required
            style={{ width: "100%", padding: "8px", borderRadius: "4px", border: "1px solid #ccc" }}
          />
        </div>

        <div>
          <label htmlFor="gouvernorat" style={{ display: "block", marginBottom: "5px" }}>Gouvernorat:</label>
          <select
            id="gouvernorat"
            name="gouvernorat"
            value={form.gouvernorat}
            onChange={handleChange}
            required
            style={{ width: "100%", padding: "8px", borderRadius: "4px", border: "1px solid #ccc" }}
          >
            <option value="">Sélectionnez une gouvernorat</option>
            {gouvernorats.map(gouv => (
              <option key={gouv} value={gouv}>{gouv}</option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="lieu" style={{ display: "block", marginBottom: "5px" }}>Lieu:</label>
          <input
            type="text"
            id="lieu"
            name="lieu"
            value={form.lieu}
            onChange={handleChange}
            required
            style={{ width: "100%", padding: "8px", borderRadius: "4px", border: "1px solid #ccc" }}
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          style={{
            padding: "10px",
            backgroundColor: "#4285f4",
            color: "white",
            border: "none",
            borderRadius: "4px",
            cursor: "pointer",
            fontSize: "16px"
          }}
        >
          {loading ? "En cours..." : "Ajouter l'événement"}
        </button>
      </form>
    </div>
  );
}