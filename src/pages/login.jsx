import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import API from "../services/api";

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  // Forgot password states
  const [showForgot, setShowForgot] = useState(false);
  const [forgotEmail, setForgotEmail] = useState("");
  const [forgotStep, setForgotStep] = useState(1); // 1=email, 2=verification, 3=new password
  const [forgotCode, setForgotCode] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [forgotMsg, setForgotMsg] = useState({ type: "", text: "" });

  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await API.post("/auth/login", {
        email_user: email,
        mot_de_passe_user: password,
      });

      localStorage.setItem("token", res.data.token);
      localStorage.setItem("user", JSON.stringify(res.data.user));

      const role = res.data.user?.role;
      if (role === "admin" || role === "superadmin") {
        navigate("/admin/dashboard");
      } else if (role === "jeune") {
        navigate("/jeune");
      } else {
        setError("Rôle utilisateur non reconnu.");
      }
    } catch (err) {
      const errorMsg =
        err.response?.data?.message ||
        (err.code === "ERR_NETWORK"
          ? "Impossible de contacter le serveur. Vérifiez votre connexion."
          : "Une erreur est survenue. Veuillez réessayer.");
      setError(errorMsg);
    }
    setLoading(false);
  };

  // ── FORGOT PASSWORD FLOW ──────────────────────────

  // Step 1: Send verification email (OUI/NON)
  const handleForgotSendVerif = async () => {
    if (!forgotEmail.includes("@")) return setForgotMsg({ type: "error", text: "Email invalide." });
    setLoading(true);
    setForgotMsg({ type: "", text: "" });
    try {
      await API.post("/auth/send-owner-check", {
        email: forgotEmail,
        nom: "",
        prenom: "Utilisateur",
        isForgotPassword: true
      });
      setForgotMsg({ type: "success", text: "✅ Email de vérification envoyé ! Cliquez sur OUI dans l'email." });
      setForgotStep(2);
    } catch (err) {
      setForgotMsg({ type: "error", text: err.response?.data?.message || "Erreur envoi email." });
    }
    setLoading(false);
  };

  // Step 2: After user clicks OUI — send new password code
  const handleForgotSendCode = async () => {
    setLoading(true);
    setForgotMsg({ type: "", text: "" });
    try {
      await API.post("/auth/send-password-code", { email: forgotEmail });
      setForgotMsg({ type: "success", text: "✅ Code secret envoyé à votre email !" });
      setForgotStep(3);
    } catch (err) {
      setForgotMsg({ type: "error", text: err.response?.data?.message || "Erreur envoi code." });
    }
    setLoading(false);
  };

  // Step 3: Submit new password
  const handleForgotSubmit = async () => {
    if (!forgotCode) return setForgotMsg({ type: "error", text: "Veuillez entrer le code reçu." });
    setLoading(true);
    setForgotMsg({ type: "", text: "" });
    try {
      // Use register-final endpoint to update password
      await API.post("/auth/register-final", {
        email_user: forgotEmail,
        mot_de_passe_user: forgotCode,
      });
      setForgotMsg({ type: "success", text: "✅ Mot de passe mis à jour ! Vous pouvez vous connecter." });
      setTimeout(() => {
        setShowForgot(false);
        setForgotStep(1);
        setForgotEmail("");
        setForgotCode("");
        setEmail(forgotEmail);
      }, 2000);
    } catch (err) {
      setForgotMsg({ type: "error", text: err.response?.data?.message || "Code incorrect." });
    }
    setLoading(false);
  };

  return (
    <div className="auth-page">
      <div className="shape shape-top-left"></div>
      <div className="shape shape-bottom-left"></div>
      <div className="shape shape-center-left"></div>
      <div className="shape shape-center-bottom"></div>
      <div className="shape shape-right-center"></div>
      <div className="shape shape-small-wave"></div>
      <div className="shape shape-small-wave-2"></div>
      <div className="shape shape-blob"></div>
      <div className="main-panel"></div>

      <div className="auth-card">
        <h1>SWAFY</h1>

        {!showForgot ? (
          <>
            <p>Connectez-vous pour continuer.</p>
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
              <div
                className="forgot-password"
                style={{ cursor: "pointer", color: "#667eea" }}
                onClick={() => { setShowForgot(true); setForgotEmail(email); }}
              >
                Mot de passe oublié ?
              </div>
              <button type="submit" disabled={loading}>
                {loading ? "Connexion..." : "Se connecter"}
              </button>
            </form>
            {error && <div className="error-msg">{error}</div>}
          </>
        ) : (
          <>
            <p>Réinitialisation du mot de passe</p>

            {forgotMsg.text && (
              <div className={`error-msg`} style={{
                background: forgotMsg.type === "success" ? "#d4edda" : "#f8d7da",
                color: forgotMsg.type === "success" ? "#155724" : "#721c24",
                padding: 10, borderRadius: 8, marginBottom: 10
              }}>
                {forgotMsg.text}
              </div>
            )}

            {/* Step 1: Email */}
            {forgotStep === 1 && (
              <>
                <label>Votre email</label>
                <input
                  type="email"
                  placeholder="votre@email.com"
                  value={forgotEmail}
                  onChange={(e) => setForgotEmail(e.target.value)}
                />
                <button onClick={handleForgotSendVerif} disabled={loading} style={{ marginTop: 10 }}>
                  {loading ? "Envoi..." : "Envoyer vérification"}
                </button>
              </>
            )}

            {/* Step 2: Waiting for OUI click */}
            {forgotStep === 2 && (
              <>
                <p style={{ color: "#666", fontSize: 14 }}>
                  📧 Cliquez sur <strong>"OUI, c'est moi"</strong> dans l'email reçu, puis cliquez ci-dessous.
                </p>
                <button onClick={handleForgotSendCode} disabled={loading} style={{ marginTop: 10 }}>
                  {loading ? "Envoi..." : "✅ J'ai confirmé, envoyer le code"}
                </button>
              </>
            )}

            {/* Step 3: Enter code */}
            {forgotStep === 3 && (
              <>
                <label>Code secret reçu par email</label>
                <input
                  type="text"
                  placeholder="Collez le code ici..."
                  value={forgotCode}
                  onChange={(e) => setForgotCode(e.target.value)}
                />
                <button onClick={handleForgotSubmit} disabled={loading} style={{ marginTop: 10 }}>
                  {loading ? "Mise à jour..." : "Confirmer nouveau mot de passe"}
                </button>
              </>
            )}

            <div
              style={{ marginTop: 15, cursor: "pointer", color: "#667eea", fontSize: 14 }}
              onClick={() => { setShowForgot(false); setForgotStep(1); setForgotMsg({ type: "", text: "" }); }}
            >
              ← Retour à la connexion
            </div>
          </>
        )}

        <div className="bottom-link">
          Pas encore de compte ? <Link to="/register">S'inscrire</Link>
        </div>
      </div>
    </div>
  );
};

export default Login;