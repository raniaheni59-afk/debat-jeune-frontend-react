import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import API from "../services/api";
import "./Register.css";

export default function Register() {
  const navigate = useNavigate();

  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ type: "", text: "" });

  const [form, setForm] = useState({
    nom_user: "", prenom_user: "", date_naissance: "", sexe: "",
    gouvernorat: "", delegation: "", delegation_custom: "", ville: "",
    etablissement: "", statut: "",
    email_user: "", mot_de_passe_user: "",
    // Parent fields (used when age < 12)
    nom_parent: "", prenom_parent: "", lien_parent: "", tel_parent: ""
  });

  const [age, setAge] = useState(null);
  const [isMineur, setIsMineur] = useState(false);       // < 12 ans
  const [showParentForm, setShowParentForm] = useState(false); // show parent section
  const [ownerConfirmed, setOwnerConfirmed] = useState(false);
  const [codeSent, setCodeSent] = useState(false);

  // ── Age calculation ──────────────────────────────────
  useEffect(() => {
    if (form.date_naissance) {
      const birth = new Date(form.date_naissance);
      const today = new Date();
      let calculatedAge = today.getFullYear() - birth.getFullYear();
      if (today < new Date(today.getFullYear(), birth.getMonth(), birth.getDate())) {
        calculatedAge--;
      }
      setAge(calculatedAge);
      if (calculatedAge < 12) {
        setIsMineur(true);
        setShowParentForm(true);
        setMessage({ type: "error", text: "⚠️ Tu as moins de 12 ans. Les informations du parent sont requises." });
      } else {
        setIsMineur(false);
        setShowParentForm(false);
        setMessage({ type: "", text: "" });
      }
    }
  }, [form.date_naissance]);

  // ── URL param handler (redirect after email confirmation) ──
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const stepParam = params.get("step");
    const emailParam = params.get("email");

    if (stepParam === "3" && emailParam) {
      const savedForm = sessionStorage.getItem("registerForm");
      if (savedForm) {
        setForm(prev => ({ ...JSON.parse(savedForm), email_user: emailParam }));
      } else {
        setForm(prev => ({ ...prev, email_user: emailParam }));
      }
      setOwnerConfirmed(true);
      setStep(3);
      API.post("/auth/send-password-code", { email: emailParam })
        .then(() => {
          setCodeSent(true);
          setMessage({ type: "success", text: "✅ Code secret envoyé à votre email !" });
        })
        .catch((err) => {
          const msg = err.response?.data?.message || "Erreur envoi code.";
          setMessage({ type: "error", text: msg });
        });
    }
  }, []);

  // ── Handlers ─────────────────────────────────────────
  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm(prev => {
      const newForm = { ...prev, [name]: value };
      if (name === "gouvernorat") {
        newForm.delegation = "";
        newForm.delegation_custom = "";
        newForm.ville = "";
        newForm.etablissement = "";
      }
      if (name === "delegation") {
        newForm.delegation_custom = "";
        newForm.ville = "";
        newForm.etablissement = "";
      }
      return newForm;
    });
  };

  // The effective delegation value (either selected or custom text)
  const effectiveDelegation = form.delegation === "Autre"
    ? form.delegation_custom
    : form.delegation;

  // Établissement is disabled & not required when statut = "autre"
  const etablissementDisabled = form.statut === "autre";

  const handleNextToEmail = (e) => {
    e.preventDefault();

    // If mineur, require parent fields before proceeding
    if (isMineur) {
      if (!form.nom_parent || !form.prenom_parent || !form.lien_parent || !form.tel_parent) {
        setMessage({ type: "error", text: "⚠️ Veuillez remplir toutes les informations du parent/tuteur." });
        return;
      }
    }

    sessionStorage.setItem("registerForm", JSON.stringify({ ...form, delegation: effectiveDelegation }));
    setStep(2);
  };

  const sendOwnerCheck = async () => {
    if (!form.email_user.includes("@")) return alert("Email invalide");
    setLoading(true);
    setMessage({ type: "", text: "" });
    try {
      const res = await API.post("/auth/send-owner-check", {
        email: form.email_user,
        nom: form.nom_user,
        prenom: form.prenom_user
      });
      setMessage({ type: "success", text: res.data.message });
    } catch (err) {
      const msg = err.response?.data?.message || "Erreur envoi email.";
      setMessage({ type: "error", text: msg });
    }
    setLoading(false);
  };

  const handleFinalSubmit = async (e) => {
    e.preventDefault();
    if (!form.mot_de_passe_user) return alert("Veuillez coller le code reçu.");
    setLoading(true);
    try {
      await API.post("/auth/register-final", {
        ...form,
        delegation: effectiveDelegation,
        etablissement: etablissementDisabled ? "" : form.etablissement,
      });
      const loginRes = await API.post("/auth/login", {
        email_user: form.email_user,
        mot_de_passe_user: form.mot_de_passe_user
      });
      localStorage.setItem("token", loginRes.data.token);
      localStorage.setItem("user", JSON.stringify(loginRes.data.user));
      sessionStorage.removeItem("registerForm");
      alert("🎉 Inscription réussie !");
      navigate("/jeune");
    } catch (err) {
      const msg = err.response?.data?.message || "Erreur inscription.";
      setMessage({ type: "error", text: msg });
    }
    setLoading(false);
  };

  // ── Render ────────────────────────────────────────────
  return (
    <div className="register-page">
      <div className="register-bg-shape register-shape-top-left"></div>
      <div className="register-bg-shape register-shape-bottom-left"></div>

      <div className="register-main-layout">
        <div className="register-brand-side">
          <div className="register-brand-box">
            <h1>Swafy</h1>
            <p>Inscription Espace Jeune</p>
          </div>
        </div>

        <div className="register-form-side">
          <div className="register-glass-card">
            <h2>
              {step === 1 ? "Informations Personnelles" : step === 2 ? "Vérification Email" : "Code Secret"}
            </h2>

            <div className="form-progress">
              <div className="form-progress-bar" style={{ width: `${(step / 3) * 100}%` }}></div>
            </div>

            {message.text && (
              <div className={`register-message ${message.type}`}>{message.text}</div>
            )}

            {/* ══ STEP 1 ══════════════════════════════════ */}
            {step === 1 && (
              <form onSubmit={handleNextToEmail} className="register-form-grid">

                {/* Nom / Prénom */}
                <div className="input-group">
                  <label>Nom *</label>
                  <input name="nom_user" value={form.nom_user} onChange={handleChange} required />
                </div>
                <div className="input-group">
                  <label>Prénom *</label>
                  <input name="prenom_user" value={form.prenom_user} onChange={handleChange} required />
                </div>

                {/* Date naissance */}
                <div className="input-group">
                  <label>Date Naissance *</label>
                  <input type="date" name="date_naissance" value={form.date_naissance} onChange={handleChange} required />
                  {age !== null && <span className="age-badge">{age} ans</span>}
                </div>

                {/* Sexe */}
                <div className="input-group">
                  <label>Sexe *</label>
                  <select name="sexe" value={form.sexe} onChange={handleChange} required>
                    <option value="">Choisir...</option>
                    <option value="homme">Homme</option>
                    <option value="femme">Femme</option>
                  </select>
                </div>

                {/* ── SECTION PARENT (si age < 12) ──────── */}
                {showParentForm && (
                  <div className="parent-section full-width">
                    <div className="parent-section-title">
                       Informations du Parent / Tuteur
                    </div>
                    <div className="register-form-grid" style={{ padding: 0, marginTop: 12 }}>

                      <div className="input-group">
                        <label>Nom du parent *</label>
                        <input
                          name="nom_parent"
                          value={form.nom_parent}
                          onChange={handleChange}
                          placeholder="Nom de famille"
                          required={isMineur}
                        />
                      </div>

                      <div className="input-group">
                        <label>Prénom du parent *</label>
                        <input
                          name="prenom_parent"
                          value={form.prenom_parent}
                          onChange={handleChange}
                          placeholder="Prénom"
                          required={isMineur}
                        />
                      </div>

                      <div className="input-group">
                        <label>Lien de parenté *</label>
                        <select
                          name="lien_parent"
                          value={form.lien_parent}
                          onChange={handleChange}
                          required={isMineur}
                        >
                          <option value="">Choisir...</option>
                          <option value="pere">Père</option>
                          <option value="mere">Mère</option>
                          <option value="tuteur">Tuteur légal</option>
                        </select>
                      </div>

                      <div className="input-group">
                        <label>Téléphone du parent *</label>
                        <input
                          name="tel_parent"
                          value={form.tel_parent}
                          onChange={handleChange}
                          placeholder=""
                          type="tel"
                          required={isMineur}
                        />
                      </div>
                    </div>
                  </div>
                )}

                {/* Statut */}
                <div className="input-group full-width">
                  <label>Statut *</label>
                  <select name="statut" value={form.statut} onChange={handleChange} required>
                    <option value="">Choisir...</option>
                    <option value="college">Collège</option>
                    <option value="lycee">Lycée</option>
                    <option value="etudiant">Étudiant</option>
                    <option value="diplome">Diplômé</option>
                    <option value="autre">Autre</option>
                  </select>
                </div>

                {/* Gouvernorat */}
                <div className="input-group">
                  <label>Gouvernorat *</label>
                  <select name="gouvernorat" value={form.gouvernorat} onChange={handleChange} required>
                    <option value="">Choisir...</option>
                    {DATA_TUNISIE_COMPLETE.gouvernorats.map(g => (
                      <option key={g} value={g}>{g}</option>
                    ))}
                  </select>
                </div>

                {/* Délégation — with "Autre" option */}
                <div className="input-group">
                  <label>Délégation *</label>
                  <select
                    name="delegation"
                    value={form.delegation}
                    onChange={handleChange}
                    disabled={!form.gouvernorat}
                    required
                  >
                    <option value="">Choisir...</option>
                    {form.gouvernorat && DATA_TUNISIE_COMPLETE.delegations[form.gouvernorat]?.map(d => (
                      <option key={d} value={d}>{d}</option>
                    ))}
                    <option value="Autre">Autre...</option>
                  </select>

                  {/* Custom delegation input when "Autre" is selected */}
                  {form.delegation === "Autre" && (
                    <input
                      name="delegation_custom"
                      value={form.delegation_custom}
                      onChange={handleChange}
                      placeholder="Saisissez votre délégation..."
                      style={{ marginTop: 8 }}
                      required
                    />
                  )}
                </div>

                {/* Ville */}
                <div className="input-group">
                  <label>Ville *</label>
                  <input
                    name="ville"
                    placeholder="Ex: Carthage, El Menzah..."
                    value={form.ville}
                    onChange={handleChange}
                    disabled={!effectiveDelegation}
                    required
                  />
                </div>

                {/* Établissement — disabled & not required when statut = "autre" */}
                <div className="input-group full-width">
                  <label>
                    Établissement {etablissementDisabled ? "" : "*"}
                    {etablissementDisabled && (
                      <span style={{ fontSize: 12, color: "#999", marginLeft: 8 }}>(optionnel pour "Autre")</span>
                    )}
                  </label>
                  <input
                    name="etablissement"
                    placeholder={etablissementDisabled ? "Non applicable" : "Nom de ton école/fac/entreprise..."}
                    value={etablissementDisabled ? "" : form.etablissement}
                    onChange={handleChange}
                    disabled={etablissementDisabled || !effectiveDelegation}
                    required={!etablissementDisabled}
                  />
                </div>

                {/* Submit / block */}
                <button type="submit" className="register-submit-btn full-width">
                  Suivant →
                </button>

              </form>
            )}

            {/* ══ STEP 2 ══════════════════════════════════ */}
            {step === 2 && (
              <div className="step-content">
                <p>Entrez votre email. Nous allons vérifier que c'est bien vous.</p>
                <div className="input-group full-width">
                  <label>Email *</label>
                  <input
                    type="email"
                    name="email_user"
                    value={form.email_user}
                    onChange={handleChange}
                    placeholder="votre@email.com"
                  />
                </div>
                <button onClick={sendOwnerCheck} className="register-submit-btn full-width" disabled={loading}>
                  {loading ? "Envoi..." : "Envoyer Vérification"}
                </button>
                <p style={{ marginTop: 15, color: "#666", fontSize: 14 }}>
                  ✉️ Cliquez sur "OUI" dans l'email pour continuer automatiquement.
                </p>
              </div>
            )}

            {/* ══ STEP 3 ══════════════════════════════════ */}
            {step === 3 && (
              <form onSubmit={handleFinalSubmit} className="step-content">
                <p>Nous avons envoyé un <strong>Code Secret</strong> à votre email. Copiez-le et collez-le ici.</p>

                {!codeSent && (
                  <p style={{ color: "#667eea" }}>⏳ Envoi du code en cours...</p>
                )}

                {codeSent && (
                  <>
                    <div className="input-group full-width">
                      <label>Code Secret *</label>
                      <input
                        type="text"
                        name="mot_de_passe_user"
                        value={form.mot_de_passe_user}
                        onChange={handleChange}
                        placeholder="Collez le code ici..."
                        autoComplete="off"
                        required
                      />
                    </div>
                    <button type="submit" className="register-submit-btn full-width" disabled={loading}>
                      {loading ? "Création..." : "Confirmer & Accéder"}
                    </button>
                  </>
                )}
              </form>
            )}

            <div className="register-login-link">
              Déjà inscrit ? <Link to="/login">Se connecter</Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Data ──────────────────────────────────────────────
const DATA_TUNISIE_COMPLETE = {
  gouvernorats: [
    "Ariana", "Béja", "Ben Arous", "Bizerte", "Gabès", "Gafsa", "Jendouba",
    "Kairouan", "Kasserine", "Kebili", "Kef", "Mahdia", "Manouba", "Medenine",
    "Monastir", "Nabeul", "Sfax", "Sidi Bouzid", "Siliana", "Sousse",
    "Tataouine", "Tozeur", "Tunis", "Zaghouan"
  ],
  delegations: {
    "Tunis": ["Tunis Ville", "La Marsa", "Le Bardo", "Carthage", "Sidi Hassine", "La Goulette"],
    "Ariana": ["Ariana Ville", "Ettadhamen", "Raoued", "Sidi Thabet", "Mnihla"],
    "Ben Arous": ["Ben Arous", "Radès", "Ezzahra", "Hammam Lif", "Mornag", "Bou Mhel"],
    "Sousse": ["Sousse Ville", "Hammam Sousse", "Akouda", "Kalaâ Kebira", "Msaken"],
    "Sfax": ["Sfax Ville", "Sakiet Ezzit", "Sakiet Eddaïer", "Thyna", "Agareb"],
    "Nabeul": ["Nabeul", "Hammamet", "Korba", "Menzel Temime", "Grombalia"],
    "Bizerte": ["Bizerte Nord", "Menzel Bourguiba", "Mateur", "Ras Jebel"],
    "Monastir": ["Monastir Ville", "Sahline", "Téboulba", "Moknine", "Jammet"],
    "Kairouan": ["Kairouan Ville", "Bou Hajla", "Sbikha", "Oueslatia"],
    "Gafsa": ["Gafsa Ville", "Metlaoui", "El Ksar", "Redeyef"],
    "Gabès": ["Gabès Ville", "Mareth", "El Hamma", "Matmata"],
    "Medenine": ["Medenine Ville", "Djerba Houmt Souk", "Djerba Midoun", "Zarzis"],
    "Béja": ["Béja Ville", "Medjez el-Bab", "Téboursouk"],
    "Jendouba": ["Jendouba Ville", "Tabarka", "Aïn Draham"],
    "Kasserine": ["Kasserine Ville", "Sbeïtla", "Thala"],
    "Kef": ["Kef Ville", "Dahmani", "Tajerouine"],
    "Mahdia": ["Mahdia Ville", "Ksour Essef", "Chebba"],
    "Manouba": ["Manouba Ville", "Douar Hicher", "Tebourba"],
    "Sidi Bouzid": ["Sidi Bouzid Ville", "Regueb", "Menzel Bouzaiane"],
    "Siliana": ["Siliana Ville", "Bou Arada", "Makthar"],
    "Tataouine": ["Tataouine Ville", "Ghomrassen", "Remada"],
    "Tozeur": ["Tozeur Ville", "Nefta", "Degache"],
    "Zaghouan": ["Zaghouan Ville", "El Fahs", "Zriba"],
    "Kebili": ["Kebili Ville", "Douz", "Souk Lahad"]
  }
};