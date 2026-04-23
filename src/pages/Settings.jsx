import { useState } from "react";
import API from "../services/api";

export default function Settings() {
  const [tab, setTab] = useState("security");
  const [form, setForm] = useState({ current_password: "", new_password: "" });

  const changePassword = async (e) => {
    e.preventDefault();
    await API.put("/profile/change-password", form);
    alert("Mot de passe modifié");
    setForm({ current_password: "", new_password: "" });
  };

  return (
    <div style={{ padding: 20 }}>
      <h2>Paramètres</h2>

      <div style={{ display: "flex", gap: 10, margin: "12px 0" }}>
        <button onClick={() => setTab("security")}>Sécurité</button>
      </div>

      {tab === "security" && (
        <form onSubmit={changePassword} style={{ maxWidth: 400 }}>
          <label>Mot de passe actuel</label>
          <input
            type="password"
            value={form.current_password}
            onChange={(e) => setForm({ ...form, current_password: e.target.value })}
            style={{ width: "100%", padding: 10, marginBottom: 10 }}
          />
          <label>Nouveau mot de passe</label>
          <input
            type="password"
            value={form.new_password}
            onChange={(e) => setForm({ ...form, new_password: e.target.value })}
            style={{ width: "100%", padding: 10, marginBottom: 10 }}
          />
          <button type="submit">Enregistrer</button>
        </form>
      )}
    </div>
  );
}