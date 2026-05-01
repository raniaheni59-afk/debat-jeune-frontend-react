import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import API from "../services/api";

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");
    try {
      const res = await API.post("/auth/login", {
        email_user: email,
        mot_de_passe_user: password,
      });
      
      console.log("Connexion réussie:", res.data);

      localStorage.setItem("token", res.data.token);
      localStorage.setItem("user", JSON.stringify(res.data.user));
      
      const role = res.data.user?.role;
      if (role === "admin" || role === "superadmin") {
        navigate("/admin");
      } else if (role === "jeune") {
        navigate("/jeune");
      } else {
        setError("Rôle utilisateur non reconnu.");
      }
    } catch (err) {
      console.error("❌ Détails Erreur Login:", {
        message: err.message,
        code: err.code,
        response: err.response?.data,
        url: err.config?.url
      });
      const errorMsg = err.response?.data?.message || "Impossible de contacter le serveur (Vérifiez si le backend est lancé sur le port 5000)";
      setError(errorMsg);
    }
  };

  return (
    <div className="auth-page">
      {/* Formes décoratives animées définies dans index.css */}
      <div className="shape shape-top-left"></div>
      <div className="shape shape-bottom-left"></div>
      <div className="shape shape-center-left"></div>
      <div className="shape shape-center-bottom"></div>
      <div className="shape shape-right-center"></div>
      <div className="shape shape-small-wave"></div>
      <div className="shape shape-small-wave-2"></div>
      <div className="shape shape-blob"></div>

      {/* Panneau principal en arrière-plan (effet de verre) */}
      <div className="main-panel"></div>

      {/* Carte de connexion */}
      <div className="auth-card">
        <h1>SWAFY</h1>
        <p> Connectez-vous pour continuer.</p>
        
        <form onSubmit={handleLogin}>
          <label>Email</label>
          <input 
            type="email" 
            placeholder="votre@email.com" 
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required 
          />

          <label>Mot de passe</label>
          <input 
            type="password" 
            placeholder="••••••••" 
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required 
          />

          <div className="forgot-password">Mot de passe oublié ?</div>

          <button type="submit">Se connecter</button>
        </form>

        {error && <div className="error-msg">{error}</div>}

        <div className="bottom-link">
          Pas encore de compte ? <Link to="/register">S'inscrire</Link>
        </div>
      </div>
    </div>
  );
};

export default Login;