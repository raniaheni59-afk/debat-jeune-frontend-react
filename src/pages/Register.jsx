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
    gouvernorat: "", delegation: "", ville: "", etablissement: "", statut: "",
    email_user: "", mot_de_passe_user: ""
  });

  const [age, setAge] = useState(null);
  const [ownerConfirmed, setOwnerConfirmed] = useState(false);
  const [codeSent, setCodeSent] = useState(false);
  const [isParentRedirect, setIsParentRedirect] = useState(false);

 
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
      setIsParentRedirect(true);
      setMessage({ type: "error", text: "⚠️ Tu as moins de 12 ans. Redirection vers l'Espace Parent..." });
    } else {
      setIsParentRedirect(false);
      setMessage({ type: "", text: "" });
    }
  }
}, [form.date_naissance]);

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
      setMessage({ type: "success", text: "✅ Code secret envoyé !" });
    })
    .catch(() => setMessage({ type: "error", text: "Erreur envoi code." }));
}
    setOwnerConfirmed(true);
    setStep(3);
    API.post("/auth/send-password-code", { email: emailParam })
      .then(() => {
        setCodeSent(true);
        setMessage({ type: "success", text: "✅ Code secret envoyé !" });
      })
      .catch(() => setMessage({ type: "error", text: "Erreur envoi code." }));
  }
}, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm(prev => {
      const newForm = { ...prev, [name]: value };
      if (name === "gouvernorat") { newForm.delegation = ""; newForm.ville = ""; newForm.etablissement = ""; }
      if (name === "delegation") { newForm.ville = ""; newForm.etablissement = ""; }
      return newForm;
    });
  };

 const handleNextToEmail = (e) => {
  e.preventDefault();
  sessionStorage.setItem("registerForm", JSON.stringify(form));
  setStep(2);
};

  // STEP 2: Send Owner Check
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
      // Ma na3mlouch setOwnerConfirmed houni, lezem user yclicki fi email
    } catch (err) {
      setMessage({ type: "error", text: err.response?.data?.message || "Erreur envoi email." });
    }
    setLoading(false);
  };

  const checkOwnerStatus = async () => {
    setLoading(true);
    try {
      const res = await API.post("/auth/check-owner-status", { email: form.email_user });
      if (res.data.verified) {
        setOwnerConfirmed(true);
        setMessage({ type: "success", text: "✅ Propriétaire confirmé !" });
        setStep(3);
      } else {
        alert("❌ Vous n'avez pas encore cliqué sur 'OUI' dans l'email.");
      }
    } catch (err) {
      alert("Erreur vérification.");
    }
    setLoading(false);
  };

  // STEP 3: Send Password Code
  const sendPasswordCode = async () => {
    setLoading(true);
    try {
      const res = await API.post("/auth/send-password-code", { email: form.email_user });
      setCodeSent(true);
      setMessage({ type: "success", text: res.data.message });
    } catch (err) {
      setMessage({ type: "error", text: err.response?.data?.message || "Erreur envoi code." });
    }
    setLoading(false);
  };

  const handleFinalSubmit = async (e) => {
  e.preventDefault();
  if (!form.mot_de_passe_user) return alert("Veuillez coller le code reçu.");
  setLoading(true);
  try {
    await API.post("/auth/register-final", { ...form });
    // بعد الإنسكريبشن، دخّلو مباشرة
    const loginRes = await API.post("/auth/login", {
      email_user: form.email_user,
      mot_de_passe_user: form.mot_de_passe_user
    });
    localStorage.setItem("token", loginRes.data.token);
    localStorage.setItem("user", JSON.stringify(loginRes.data.user));
    alert("🎉 Inscription réussie !");
    navigate("/jeune");
  } catch (err) {
    setMessage({ type: "error", text: err.response?.data?.message || "Erreur inscription." });
  }
  setLoading(false);
};
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

            {/* STEP 1 */}
            {step === 1 && (
              <form onSubmit={handleNextToEmail} className="register-form-grid">
                <div className="input-group"><label>Nom *</label><input name="nom_user" value={form.nom_user} onChange={handleChange} required /></div>
                <div className="input-group"><label>Prénom *</label><input name="prenom_user" value={form.prenom_user} onChange={handleChange} required /></div>
                
                <div className="input-group">
                  <label>Date Naissance *</label>
                  <input type="date" name="date_naissance" value={form.date_naissance} onChange={handleChange} required />
                  {age !== null && <span className="age-badge">{age} ans</span>}
                </div>

                <div className="input-group">
                  <label>Sexe *</label>
                  <select name="sexe" value={form.sexe} onChange={handleChange} required>
                    <option value="">Choisir...</option>
                    <option value="homme">Homme</option>
                    <option value="femme">Femme</option>
                  </select>
                </div>

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

                <div className="input-group">
                  <label>Gouvernorat *</label>
                  <select name="gouvernorat" value={form.gouvernorat} onChange={handleChange} required>
                    <option value="">Choisir...</option>
                    {DATA_TUNISIE_COMPLETE.gouvernorats.map(g => <option key={g} value={g}>{g}</option>)}
                  </select>
                </div>

                <div className="input-group">
                  <label>Délégation *</label>
                  <select name="delegation" value={form.delegation} onChange={handleChange} disabled={!form.gouvernorat} required>
                    <option value="">Choisir...</option>
                    {form.gouvernorat && DATA_TUNISIE_COMPLETE.delegations[form.gouvernorat]?.map(d => <option key={d} value={d}>{d}</option>)}
                  </select>
                </div>

                <div className="input-group">
                  <label>Ville *</label>
                  <input 
                    name="ville" 
                    placeholder="Ex: Carthage, El Menzah..." 
                    value={form.ville} 
                    onChange={handleChange} 
                    disabled={!form.delegation} 
                    required 
                  />
                </div>

                <div className="input-group full-width">
                  <label>Établissement *</label>
                  <input 
                    name="etablissement" 
                    placeholder="Nom de ton école/fac" 
                    value={form.etablissement} 
                    onChange={handleChange} 
                    disabled={!form.delegation} 
                    required 
                  />
                </div>

                {isParentRedirect ? (
                  <button type="button" onClick={() => navigate("/parent-space")} className="register-submit-btn full-width" style={{background: '#f39c12'}}>
                    Aller à l'Espace Parent
                  </button>
                ) : (
                  <button type="submit" className="register-submit-btn full-width">
                    Suivant
                  </button>
                )}
              </form>
            )}

            {/* STEP 2 */}
            {step === 2 && (
  <div className="step-content">
    <p>Entrez votre email. Nous allons vérifier que c'est bien vous.</p>
    <div className="input-group full-width">
      <label>Email *</label>
      <input type="email" name="email_user" value={form.email_user} onChange={handleChange} placeholder="votre@email.com" />
    </div>
    <button onClick={sendOwnerCheck} className="register-submit-btn full-width" disabled={loading}>
      {loading ? "Envoi..." : "Envoyer Vérification"}
    </button>
    <p style={{marginTop: 15, color: "#666", fontSize: 14}}>
      ✉️ Cliquez sur "OUI" dans l'email pour continuer automatiquement.
    </p>
  </div>
)}

            {/* STEP 3 */}
            {step === 3 && (
  <form onSubmit={handleFinalSubmit} className="step-content">
    <p>Nous avons envoyé un <strong>Code Secret</strong> à votre email. Copiez-le et collez-le ici.</p>
    
    {!codeSent && (
      <p style={{color: "#667eea"}}>⏳ Envoi du code en cours...</p>
    )}

    {codeSent && (
      <>
        <div className="input-group full-width">
          <label>Code Secret (Mot de passe) *</label>
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

// Données complètes des 24 gouvernorats de Tunisie
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