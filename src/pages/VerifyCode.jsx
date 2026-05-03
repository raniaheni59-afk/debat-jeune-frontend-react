// frontend/src/pages/VerifyCode.jsx (VERSION COMPLETE)
import { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import API from "../services/api";

export default function VerifyCode() {
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  const location = useLocation();
  const navigate = useNavigate();

  const email = location.state?.email || "";

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!email) {
      setMessage("❌ Email manquant. Retournez à la page d'inscription.");
      return;
    }

    if (code.length !== 6) {
      setMessage("❌ Code doit contenir 6 chiffres");
      return;
    }

    setLoading(true);
    setMessage("");

    try {
      console.log("🔐 Vérification code pour:", email);

      const res = await API.post("/auth/verify-code", {
        email_user: email,
        code,
      });

      console.log("✅ Code validé:", res.data);

      // Stockage
      localStorage.setItem("token", res.data.token);
      localStorage.setItem("user", JSON.stringify(res.data.user));

      // Redirection
      if (res.data.user.role === "jeune") {
        navigate("/jeune");
      } else if (res.data.user.role === "admin") {
        navigate("/admin");
      } else if (res.data.user.role === "parent") {
        navigate("/parent");
      } else {
        navigate("/");
      }

    } catch (err) {
      console.error("❌ Erreur vérification:", err);
      setMessage(err.response?.data?.message || "Code incorrect ou expiré");
    } finally {
      setLoading(false);
    }
  };

  // Redirect si pas d'email
  if (!email) {
    return (
      <div style={{ 
        minHeight: "100vh", 
        display: "flex", 
        alignItems: "center", 
        justifyContent: "center",
        background: "#f8f9fa"
      }}>
        <div style={{ textAlign: "center", maxWidth: 400 }}>
          <h2 style={{ color: "#c33" }}>❌ Erreur</h2>
          <p>Email manquant. Veuillez vous inscrire d'abord.</p>
          <button 
            onClick={() => navigate("/register")}
            style={{ 
              marginTop: 20, 
              padding: "12px 24px", 
              background: "#667eea", 
              color: "white", 
              border: "none", 
              borderRadius: 8,
              cursor: "pointer"
            }}
          >
            Retour à l'inscription
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={{ 
      minHeight: "100vh",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)"
    }}>
      <div style={{ 
        maxWidth: 500, 
        width: "90%",
        padding: 40, 
        background: "rgba(255,255,255,0.95)", 
        borderRadius: 20, 
        textAlign: "center",
        boxShadow: "0 20px 60px rgba(0,0,0,0.3)"
      }}>
        <h1 style={{ color: "#667eea", fontSize: 48, marginBottom: 10 }}>SWAFY</h1>
        <h2 style={{ color: "#333", marginBottom: 10 }}>Vérification du compte</h2>
        <p style={{ color: "#666", marginBottom: 30 }}>
          Code envoyé à : <strong>{email}</strong>
        </p>

        <form onSubmit={handleSubmit}>
          <input
            type="text"
            placeholder="000000"
            value={code}
            onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
            style={{ 
              fontSize: 36, 
              textAlign: "center", 
              letterSpacing: 15, 
              width: "100%",
              maxWidth: 320,
              padding: 20, 
              margin: "20px auto",
              display: "block",
              border: "2px solid #e0e0e0",
              borderRadius: 10,
              fontFamily: "monospace"
            }}
            maxLength={6}
            autoFocus
            required
          />
          
          <button 
            type="submit" 
            disabled={loading || code.length !== 6}
            style={{
              width: "100%",
              padding: 16,
              fontSize: 16,
              fontWeight: "bold",
              background: (loading || code.length !== 6) 
                ? "#ccc" 
                : "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
              color: "white",
              border: "none",
              borderRadius: 10,
              cursor: (loading || code.length !== 6) ? "not-allowed" : "pointer",
              marginTop: 10
            }}
          >
            {loading ? "Vérification..." : "Activer mon compte"}
          </button>
        </form>

        {message && (
          <div style={{ 
            marginTop: 20, 
            padding: 12, 
            background: message.includes("❌") ? "#fee" : "#efe",
            color: message.includes("❌") ? "#c33" : "#3c3",
            borderRadius: 8,
            fontWeight: "bold"
          }}>
            {message}
          </div>
        )}

        <p style={{ marginTop: 30, fontSize: 14, color: "#999" }}>
          Code non reçu ? Vérifiez vos spams ou contactez le support.
        </p>
      </div>
    </div>
  );
}