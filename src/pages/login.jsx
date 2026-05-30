import React, { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import API from "../services/api";
import "./Login.css";

const Login = () => {
  const [email, setEmail]       = useState("");
  const [password, setPassword] = useState("");
  const [error, setError]       = useState("");
  const [loading, setLoading]   = useState(false);

  // Forgot password states
  const [showForgot, setShowForgot] = useState(false);
  const [forgotEmail, setForgotEmail] = useState("");
  const [forgotStep, setForgotStep]   = useState(1);
  // step 1 = saisir email → envoyer lien OUI
  // step 2 = chargement auto après retour du lien OUI
  // step 3 = coller le code reçu → connexion

  const [forgotCode, setForgotCode] = useState("");
  const [forgotMsg, setForgotMsg]   = useState({ type: "", text: "" });

  const navigate = useNavigate();

  // ── Détecter retour depuis le lien OUI dans l'email ──────────────────────
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get("forgot") === "confirm") {
      const emailFromUrl = decodeURIComponent(params.get("email") || "");
      if (emailFromUrl) {
        setShowForgot(true);
        setForgotEmail(emailFromUrl);
        // Nettoyer l'URL
        window.history.replaceState({}, "", "/login");
        // Envoyer le code directement
        sendForgotCodeFor(emailFromUrl);
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── LOGIN NORMAL ──────────────────────────────────────────────────────────
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
      setError(
        err.response?.data?.message ||
        (err.code === "ERR_NETWORK"
          ? "Impossible de contacter le serveur. Vérifiez votre connexion."
          : "Une erreur est survenue. Veuillez réessayer.")
      );
    }
    setLoading(false);
  };

  // ── FORGOT — Étape 1 : envoyer l'email avec lien OUI ─────────────────────
  const handleForgotSendVerif = async () => {
    if (!forgotEmail.includes("@"))
      return setForgotMsg({ type: "error", text: "Adresse email invalide." });

    setLoading(true);
    setForgotMsg({ type: "", text: "" });
    try {
      await API.post("/auth/forgot-send", { email: forgotEmail });
      setForgotMsg({
        type: "success",
        text: "✅ Email envoyé ! Ouvrez votre boîte mail et cliquez sur « OUI, c'est moi ».",
      });
    } catch (err) {
      setForgotMsg({
        type: "error",
        text: err.response?.data?.message || "Email introuvable. Vérifiez l'adresse saisie.",
      });
    }
    setLoading(false);
  };

  // ── FORGOT — Étape 2 (auto) : appelé après clic OUI → envoie le code ─────
  const sendForgotCodeFor = async (targetEmail) => {
    setForgotStep(2);
    setLoading(true);
    setForgotMsg({ type: "", text: "" });
    try {
      await API.post("/auth/forgot-confirm", { email: targetEmail });
      setForgotMsg({
        type: "success",
        text: "✅ Identité confirmée ! Un code secret a été envoyé à votre email. Copiez-le ci-dessous.",
      });
      setForgotStep(3);
    } catch (err) {
      setForgotMsg({
        type: "error",
        text: err.response?.data?.message || "Erreur serveur. Recommencez.",
      });
      setForgotStep(1);
    }
    setLoading(false);
  };

  // ── FORGOT — Étape 3 : soumettre le code → met à jour mot de passe + connexion auto ──
  const handleForgotReset = async () => {
    if (!forgotCode.trim())
      return setForgotMsg({ type: "error", text: "Veuillez coller le code reçu par email." });

    setLoading(true);
    setForgotMsg({ type: "", text: "" });
    try {
      const res = await API.post("/auth/forgot-reset", {
        email: forgotEmail,
        code: forgotCode.trim(),
      });

      // Connexion automatique
      localStorage.setItem("token", res.data.token);
      localStorage.setItem("user", JSON.stringify(res.data.user));

      setForgotMsg({
        type: "success",
        text: "✅ Mot de passe mis à jour ! Connexion en cours...",
      });

      setTimeout(() => {
        const role = res.data.user?.role;
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

  // ── Reset complet du flow forgot ─────────────────────────────────────────
  const resetForgot = () => {
    setShowForgot(false);
    setForgotStep(1);
    setForgotEmail("");
    setForgotCode("");
    setForgotMsg({ type: "", text: "" });
  };

  // ── RENDER ────────────────────────────────────────────────────────────────
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

        {/* ══ LOGIN NORMAL ════════════════════════════════════════════════ */}
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
                  setForgotEmail(email);
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
          /* ══ FORGOT PASSWORD ════════════════════════════════════════════ */
          <>
            <p>Réinitialisation du mot de passe</p>

            {/* Message feedback */}
            {forgotMsg.text && (
              <div
                className="error-msg"
                style={{
                  background: forgotMsg.type === "success"
                    ? "rgba(40,167,69,0.2)" : "rgba(220,50,50,0.2)",
                  borderColor: forgotMsg.type === "success"
                    ? "rgba(40,167,69,0.4)" : "rgba(220,50,50,0.4)",
                  color: forgotMsg.type === "success" ? "#a8ffb8" : "#ffaaaa",
                }}
              >
                {forgotMsg.text}
              </div>
            )}

            {/* ─── Étape 1 : saisir email ─── */}
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
                <button onClick={handleForgotSendVerif} disabled={loading}>
                  {loading ? "Envoi..." : "Envoyer l'email de vérification"}
                </button>
              </>
            )}

            {/* ─── Étape 2 : chargement auto (envoi code) ─── */}
            {forgotStep === 2 && (
              <div style={{ textAlign: "center", padding: "20px 0", color: "rgba(255,255,255,0.85)" }}>
                <p>⏳ Vérification en cours...</p>
              </div>
            )}

            {/* ─── Étape 3 : coller le code ─── */}
            {forgotStep === 3 && (
              <>
                <label>Code secret reçu par email</label>
                <input
                  type="text"
                  placeholder="Collez le code ici..."
                  value={forgotCode}
                  onChange={(e) => setForgotCode(e.target.value)}
                  autoFocus
                />
                <button onClick={handleForgotReset} disabled={loading}>
                  {loading ? "Mise à jour..." : "Confirmer et accéder à mon espace"}
                </button>
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
                  Code non reçu ? Recommencer →
                </div>
              </>
            )}

            {/* Retour login */}
            <div
              style={{
                marginTop: 18,
                cursor: "pointer",
                color: "rgba(255,255,255,0.65)",
                fontSize: 13,
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