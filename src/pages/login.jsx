import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import API from "../services/api";
import "./Login.css"

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  // Forgot password states
  const [showForgot, setShowForgot] = useState(false);
  const [forgotEmail, setForgotEmail] = useState("");
  const [forgotStep, setForgotStep] = useState(1); // 1=email input, 2=enter code
  const [forgotCode, setForgotCode] = useState("");
  const [forgotMsg, setForgotMsg] = useState({ type: "", text: "" });

  const navigate = useNavigate();

  // ── LOGIN ─────────────────────────────────────────────
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

  // ── FORGOT PASSWORD FLOW ──────────────────────────────

  // Step 1 → Envoyer le code au mail
  const handleForgotSendCode = async () => {
    if (!forgotEmail.includes("@"))
      return setForgotMsg({ type: "error", text: "Adresse email invalide." });

    setLoading(true);
    setForgotMsg({ type: "", text: "" });
    try {
      await API.post("/auth/send-password-code", { email: forgotEmail });
      setForgotMsg({
        type: "success",
        text: "✅ Un code secret a été envoyé à votre email. Vérifiez votre boîte de réception.",
      });
      setForgotStep(2);
    } catch (err) {
      setForgotMsg({
        type: "error",
        text: err.response?.data?.message || "Email introuvable ou erreur serveur.",
      });
    }
    setLoading(false);
  };

  // Step 2 → Confirmer le code → met à jour le mot de passe → connecte automatiquement
  const handleForgotSubmit = async () => {
    if (!forgotCode.trim())
      return setForgotMsg({ type: "error", text: "Veuillez coller le code reçu par email." });

    setLoading(true);
    setForgotMsg({ type: "", text: "" });
    try {
      // Met à jour le mot de passe avec le code reçu
      await API.post("/auth/register-final", {
        email_user: forgotEmail,
        mot_de_passe_user: forgotCode.trim(),
      });

      // Connexion automatique avec le nouveau mot de passe
      const loginRes = await API.post("/auth/login", {
        email_user: forgotEmail,
        mot_de_passe_user: forgotCode.trim(),
      });

      localStorage.setItem("token", loginRes.data.token);
      localStorage.setItem("user", JSON.stringify(loginRes.data.user));

      setForgotMsg({ type: "success", text: "✅ Mot de passe mis à jour ! Redirection..." });

      setTimeout(() => {
        const role = loginRes.data.user?.role;
        if (role === "admin" || role === "superadmin") {
          navigate("/admin/dashboard");
        } else {
          navigate("/jeune");
        }
      }, 1500);
    } catch (err) {
      setForgotMsg({
        type: "error",
        text: err.response?.data?.message || "Code incorrect ou expiré. Réessayez.",
      });
    }
    setLoading(false);
  };

  // Reset le flow forgot
  const resetForgot = () => {
    setShowForgot(false);
    setForgotStep(1);
    setForgotEmail("");
    setForgotCode("");
    setForgotMsg({ type: "", text: "" });
  };

  // ── RENDER ────────────────────────────────────────────
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

        {/* ══ LOGIN NORMAL ══════════════════════════════ */}
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
                onClick={() => {
                  setShowForgot(true);
                  setForgotEmail(email); // pré-remplir si déjà saisi
                }}
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
          /* ══ FORGOT PASSWORD FLOW ══════════════════════ */
          <>
            <p>Réinitialisation du mot de passe</p>

            {/* Message feedback */}
            {forgotMsg.text && (
              <div
                className="error-msg"
                style={{
                  background: forgotMsg.type === "success"
                    ? "rgba(40,167,69,0.2)"
                    : "rgba(220,50,50,0.2)",
                  borderColor: forgotMsg.type === "success"
                    ? "rgba(40,167,69,0.4)"
                    : "rgba(220,50,50,0.4)",
                  color: forgotMsg.type === "success" ? "#a8ffb8" : "#ffaaaa",
                }}
              >
                {forgotMsg.text}
              </div>
            )}

            {/* ── Étape 1 : Saisir l'email ── */}
            {forgotStep === 1 && (
              <>
                <label>Votre adresse email</label>
                <input
                  type="email"
                  placeholder="votre@email.com"
                  value={forgotEmail}
                  onChange={(e) => setForgotEmail(e.target.value)}
                  autoFocus
                />
                <button onClick={handleForgotSendCode} disabled={loading}>
                  {loading ? "Envoi en cours..." : "Envoyer le code"}
                </button>
              </>
            )}

            {/* ── Étape 2 : Entrer le code reçu ── */}
            {forgotStep === 2 && (
              <>
                <label>Code reçu par email</label>
                <input
                  type="text"
                  placeholder="Collez le code secret ici..."
                  value={forgotCode}
                  onChange={(e) => setForgotCode(e.target.value)}
                  autoFocus
                />
                <button onClick={handleForgotSubmit} disabled={loading}>
                  {loading ? "Mise à jour..." : "Confirmer et se connecter"}
                </button>
                {/* Renvoyer le code */}
                <div
                  style={{
                    marginTop: 12,
                    textAlign: "center",
                    fontSize: 13,
                    color: "rgba(255,255,255,0.6)",
                    cursor: "pointer",
                  }}
                  onClick={() => {
                    setForgotStep(1);
                    setForgotCode("");
                    setForgotMsg({ type: "", text: "" });
                  }}
                >
                  Code non reçu ? Renvoyer →
                </div>
              </>
            )}

            {/* Retour au login */}
            <div
              style={{
                marginTop: 18,
                cursor: "pointer",
                color: "rgba(255,255,255,0.7)",
                fontSize: 14,
                textAlign: "center",
              }}
              onClick={resetForgot}
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