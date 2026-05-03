import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import API from "../services/api";
import "./AdminAuth.css";

const AdminLogin = () => {
  const [form, setForm] = useState({ 
    email_user: "", 
    mot_de_passe_user: "" 
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      console.log("📤 Envoi login:", form.email_user);
      
      const res = await API.post("/auth/login", form);
      
      console.log("📥 Réponse:", res.data);
      
      const { token, user } = res.data;

      if (user.role !== "admin") {
        setError("Accès réservé aux administrateurs");
        setLoading(false);
        return;
      }

      localStorage.setItem("token", token);
      localStorage.setItem("user", JSON.stringify(user));
      
      console.log("✅ Admin connecté, redirection...");
      navigate("/admin/dashboard");

    } catch (err) {
      console.error("❌ Erreur login:", err.response?.data);
      setError(err.response?.data?.message || "Erreur de connexion");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="admin-auth-page">
      <div className="admin-auth-card">
        
        {/* Logo */}
        <div className="admin-logo-section">
          <h1>SWA<span>FY</span></h1>
          <p>Espace Administrateur</p>
        </div>

        {/* Form */}
        <form onSubmit={handleLogin}>
          <div className="input-group">
            <label>Email</label>
            <input
              type="email"
              placeholder="admin@swafy.tn"
              value={form.email_user}
              onChange={(e) => setForm({ ...form, email_user: e.target.value })}
              disabled={loading}
              required
            />
          </div>

          <div className="input-group">
            <label>Mot de passe</label>
            <input
              type="password"
              placeholder="••••••••"
              value={form.mot_de_passe_user}
              onChange={(e) => setForm({ ...form, mot_de_passe_user: e.target.value })}
              disabled={loading}
              required
            />
          </div>

          <button type="submit" disabled={loading}>
            {loading ? (
              <span>Connexion en cours...</span>
            ) : (
              <span>Se connecter</span>
            )}
          </button>
        </form>

        {/* Error */}
        {error && (
          <div className="error-msg">
            ⚠️ {error}
          </div>
        )}

      </div>
    </div>
  );
};

export default AdminLogin;