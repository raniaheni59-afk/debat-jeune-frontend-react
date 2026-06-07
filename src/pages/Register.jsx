import { useState, useEffect, useRef } from "react";
import { useNavigate, Link } from "react-router-dom";
import API from "../services/api";
import "./Register.css";


// ── Custom Date Picker (Date de naissance) ───────────────────────
function BirthDatePicker({ value, onChange }) {
  const [open, setOpen] = useState(false);
  const [view, setView] = useState("days");
  const ref = useRef(null);

  const today = new Date();
  const selected = value ? new Date(value + "T00:00:00") : null;
  const [cursor, setCursor] = useState(() => {
    if (value) {
      const d = new Date(value + "T00:00:00");
      return { year: d.getFullYear(), month: d.getMonth() };
    }
    return { year: 2005, month: 0 };
  });

  useEffect(() => {
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const MONTHS = ["Jan","Fév","Mar","Avr","Mai","Jun","Jul","Aoû","Sep","Oct","Nov","Déc"];
  const MONTHS_FULL = ["Janvier","Février","Mars","Avril","Mai","Juin","Juillet","Août","Septembre","Octobre","Novembre","Décembre"];
  const DAYS = ["Lu","Ma","Me","Je","Ve","Sa","Di"];

  const getDaysInMonth = (y, m) => new Date(y, m + 1, 0).getDate();
  const getFirstDay = (y, m) => { const d = new Date(y, m, 1).getDay(); return d === 0 ? 6 : d - 1; };

  const prevMonth = () => setCursor(c => c.month === 0 ? { year: c.year - 1, month: 11 } : { ...c, month: c.month - 1 });
  const nextMonth = () => setCursor(c => c.month === 11 ? { year: c.year + 1, month: 0 } : { ...c, month: c.month + 1 });

  const selectDay = (day) => {
    const y = cursor.year, m = String(cursor.month + 1).padStart(2, "0"), d = String(day).padStart(2, "0");
    onChange(`${y}-${m}-${d}`);
    setOpen(false);
  };

  const isFuture = (day) => {
    const d = new Date(cursor.year, cursor.month, day);
    d.setHours(0,0,0,0);
    const t = new Date(); t.setHours(0,0,0,0);
    return d > t;
  };

  const isSelected = (day) => selected &&
    selected.getFullYear() === cursor.year &&
    selected.getMonth() === cursor.month &&
    selected.getDate() === day;

  const isToday = (day) =>
    today.getFullYear() === cursor.year &&
    today.getMonth() === cursor.month &&
    today.getDate() === day;

  const displayValue = selected
    ? selected.toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" })
    : "Sélectionner votre date de naissance";

  const firstDay = getFirstDay(cursor.year, cursor.month);
  const daysInMonth = getDaysInMonth(cursor.year, cursor.month);
  const cells = [];
  for (let i = 0; i < firstDay; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);

  // Years from 1940 to today
  const currentDecadeStart = Math.floor(cursor.year / 12) * 12;
  const years = Array.from({ length: 12 }, (_, i) => currentDecadeStart + i).filter(y => y >= 1940 && y <= today.getFullYear());

  const NAV = {
    background: "rgba(255,255,255,.12)", border: "1px solid rgba(255,255,255,.2)",
    borderRadius: 8, padding: "5px 8px", color: "rgba(255,255,255,.8)",
    cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center",
  };

  return (
    <div ref={ref} style={{ position: "relative" }}>
      <div style={{
        display: "flex", alignItems: "center",
        background: "rgba(255,255,255,.15)",
        border: `1.5px solid ${open ? "rgba(255,255,255,.65)" : "rgba(255,255,255,.22)"}`,
        borderRadius: 11,
        boxShadow: open ? "0 0 0 3px rgba(255,255,255,.1)" : "none",
        transition: "all .2s",
      }}>
        {/* ✅ input type=date natif stylé */}
        <input
          type="date"
          max={new Date().toISOString().split("T")[0]}
          value={value || ""}
          onChange={e => {
            const val = e.target.value;
            if (val) {
              const dt = new Date(val + "T00:00:00");
              onChange(val);
              setCursor({ year: dt.getFullYear(), month: dt.getMonth() });
            } else { onChange(""); }
          }}
          style={{
            flex: 1, background: "transparent", border: "none", outline: "none",
            color: value ? "#fff" : "rgba(255,255,255,.45)",
            fontSize: 14, padding: "11px 14px", fontFamily: "inherit", minWidth: 0,
            colorScheme: "dark",
          }}
        />
        <button type="button" onClick={() => setOpen(o => !o)} style={{
          background: "transparent", border: "none", cursor: "pointer",
          padding: "11px 12px", display: "flex", alignItems: "center",
          color: open ? "#fff" : "rgba(255,255,255,.5)",
        }}>
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/>
          </svg>
        </button>
      </div>

      {open && (
        <div style={{
          position: "absolute", top: "calc(100% + 6px)", left: 0, right: 0, zIndex: 9999,
          background: "linear-gradient(135deg,#5a4a95,#6a58a8)",
          border: "1px solid rgba(255,255,255,.25)",
          borderRadius: 16, padding: 14,
          boxShadow: "0 20px 60px rgba(0,0,0,.4)",
          animation: "fadeIn .2s ease",
        }}>
          {/* Header nav */}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
            <button type="button" onClick={prevMonth} style={NAV}>
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="m15 18-6-6 6-6"/></svg>
            </button>
            <div style={{ display: "flex", gap: 5 }}>
              <button type="button" onClick={() => setView(v => v === "months" ? "days" : "months")}
                style={{ ...NAV, padding: "5px 10px", fontSize: 12, fontWeight: 700, color: "#fff" }}>
                {MONTHS_FULL[cursor.month]}
              </button>
              <button type="button" onClick={() => setView(v => v === "years" ? "days" : "years")}
                style={{ ...NAV, padding: "5px 10px", fontSize: 12, fontWeight: 700, color: "#fff" }}>
                {cursor.year}
              </button>
            </div>
            <button type="button" onClick={nextMonth} style={NAV}>
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="m9 18 6-6-6-6"/></svg>
            </button>
          </div>

          {view === "days" && (
            <>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(7,1fr)", gap: 2, marginBottom: 4 }}>
                {DAYS.map(d => (
                  <div key={d} style={{ textAlign: "center", fontSize: 9, fontWeight: 700, color: "rgba(255,255,255,.5)", padding: "3px 0" }}>{d}</div>
                ))}
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(7,1fr)", gap: 2 }}>
                {cells.map((day, i) => day === null ? <div key={"e"+i} /> : (
                  <button key={day} type="button" onClick={() => !isFuture(day) && selectDay(day)}
                    disabled={isFuture(day)}
                    style={{
                      width: "100%", aspectRatio: "1", borderRadius: 7, border: "none",
                      background: isSelected(day) ? "rgba(255,255,255,.9)" : isToday(day) ? "rgba(255,255,255,.15)" : "transparent",
                      color: isSelected(day) ? "#5a4a95" : isFuture(day) ? "rgba(255,255,255,.2)" : "#fff",
                      fontSize: 12, fontWeight: isSelected(day) ? 800 : 400,
                      cursor: isFuture(day) ? "not-allowed" : "pointer",
                      transition: "all .12s",
                    }}
                    onMouseEnter={e => { if (!isFuture(day) && !isSelected(day)) e.currentTarget.style.background = "rgba(255,255,255,.2)"; }}
                    onMouseLeave={e => { if (!isSelected(day)) e.currentTarget.style.background = isToday(day) ? "rgba(255,255,255,.15)" : "transparent"; }}
                  >{day}</button>
                ))}
              </div>
            </>
          )}

          {view === "months" && (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 5 }}>
              {MONTHS.map((m, i) => (
                <button key={m} type="button" onClick={() => { setCursor(c => ({ ...c, month: i })); setView("days"); }}
                  style={{
                    padding: "7px 4px", borderRadius: 8, border: "none", cursor: "pointer",
                    background: cursor.month === i ? "rgba(255,255,255,.9)" : "rgba(255,255,255,.1)",
                    color: cursor.month === i ? "#5a4a95" : "#fff",
                    fontSize: 11, fontWeight: cursor.month === i ? 800 : 400, transition: "all .12s",
                  }}>{m}</button>
              ))}
            </div>
          )}

          {view === "years" && (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 5 }}>
              <button type="button" onClick={() => setCursor(c => ({ ...c, year: c.year - 12 }))}
                style={{ gridColumn: "1/-1", ...NAV, justifyContent: "center", padding: "5px", marginBottom: 4, fontSize: 11 }}>← Années précédentes</button>
              {years.map(y => (
                <button key={y} type="button" onClick={() => { setCursor(c => ({ ...c, year: y })); setView("months"); }}
                  style={{
                    padding: "7px 4px", borderRadius: 8, border: "none", cursor: "pointer",
                    background: cursor.year === y ? "rgba(255,255,255,.9)" : "rgba(255,255,255,.1)",
                    color: cursor.year === y ? "#5a4a95" : "#fff",
                    fontSize: 11, fontWeight: cursor.year === y ? 800 : 400, transition: "all .12s",
                  }}>{y}</button>
              ))}
              {cursor.year + 12 <= today.getFullYear() && (
                <button type="button" onClick={() => setCursor(c => ({ ...c, year: c.year + 12 }))}
                  style={{ gridColumn: "1/-1", ...NAV, justifyContent: "center", padding: "5px", marginTop: 4, fontSize: 11 }}>Années suivantes →</button>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default function Register() {
  const navigate = useNavigate();

  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ type: "", text: "" });
  const codeSentRef = useRef(false); // prevent double send

  const [form, setForm] = useState({
    nom_user: "", prenom_user: "", date_naissance: "", sexe: "",
    gouvernorat: "", delegation: "", delegation_custom: "", ville: "",
    etablissement: "", statut: "",
    email_user: "", mot_de_passe_user: "",
    // Parent fields (informative — don't block registration)
    nom_parent: "", prenom_parent: "", lien_parent: "", tel_parent: ""
  });

  const [age, setAge] = useState(null);
  const [isMineur, setIsMineur] = useState(false);
  const [codeSent, setCodeSent] = useState(false);

  // ── Age calculation ──────────────────────────────────
  useEffect(() => {
    if (form.date_naissance) {
      const birth = new Date(form.date_naissance);
      const today = new Date();
      let a = today.getFullYear() - birth.getFullYear();
      if (today < new Date(today.getFullYear(), birth.getMonth(), birth.getDate())) a--;
      setAge(a);
      setIsMineur(a < 12);
      // Clear any previous age-related error
      if (a >= 12) setMessage({ type: "", text: "" });
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
      setStep(3);

      // Guard: only send code once even if effect re-runs
      if (codeSentRef.current) return;
      codeSentRef.current = true;

      // Retry logic: Render may be cold-starting — retry up to 4x with delay
      const sendWithRetry = async (attempts = 4, delayMs = 3000) => {
        for (let i = 0; i < attempts; i++) {
          try {
            await API.post("/auth/send-password-code", { email: emailParam });
            setCodeSent(true);
            setMessage({ type: "success", text: "✅ Code secret envoyé à votre email !" });
            return;
          } catch (err) {
            const isLast = i === attempts - 1;
            if (isLast) {
              setMessage({
                type: "error",
                text: err.response?.data?.message || "❌ Erreur envoi code. Rechargez la page."
              });
            } else {
              setMessage({ type: "", text: `⏳ Connexion au serveur... (tentative ${i + 2}/${attempts})` });
              await new Promise(r => setTimeout(r, delayMs));
            }
          }
        }
      };

      sendWithRetry();
    }
  }, []);

  // ── Handlers ─────────────────────────────────────────
  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm(prev => {
      const f = { ...prev, [name]: value };
      if (name === "gouvernorat") { f.delegation = ""; f.delegation_custom = ""; f.ville = ""; f.etablissement = ""; }
      if (name === "delegation") { f.delegation_custom = ""; f.ville = ""; f.etablissement = ""; }
      return f;
    });
  };

  const effectiveDelegation = form.delegation === "Autre" ? form.delegation_custom : form.delegation;
  const etablissementDisabled = form.statut === "autre";

  // Step 1 → Step 2
  const handleNextToEmail = (e) => {
    e.preventDefault();

    // If mineur, parent fields must be filled
    if (isMineur && (!form.nom_parent || !form.prenom_parent || !form.lien_parent || !form.tel_parent)) {
      setMessage({ type: "error", text: "⚠️ Veuillez remplir les informations du parent/tuteur." });
      return;
    }

    // Save form (with effective delegation) to sessionStorage for after email redirect
    sessionStorage.setItem("registerForm", JSON.stringify({
      ...form,
      delegation: effectiveDelegation
    }));
    setMessage({ type: "", text: "" });
    setStep(2);
  };

  // Step 2: send owner-check email
  const sendOwnerCheck = async () => {
    if (!form.email_user.includes("@")) return setMessage({ type: "error", text: "Email invalide." });
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
      setMessage({ type: "error", text: err.response?.data?.message || "Erreur envoi email." });
    }
    setLoading(false);
  };

  // Step 3: final submit
  const handleFinalSubmit = async (e) => {
    e.preventDefault();
    if (!form.mot_de_passe_user) return setMessage({ type: "error", text: "Veuillez coller le code reçu." });
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
      setMessage({ type: "success", text: "🎉 Inscription réussie !" });
      setTimeout(() => navigate("/jeune"), 1000);
    } catch (err) {
      setMessage({ type: "error", text: err.response?.data?.message || "Erreur inscription." });
    }
    setLoading(false);
  };

  // Manual retry for step 3 if code send failed
  const handleResendCode = async () => {
    if (!form.email_user) return;
    setLoading(true);
    setMessage({ type: "", text: "" });
    try {
      await API.post("/auth/send-password-code", { email: form.email_user });
      setCodeSent(true);
      setMessage({ type: "success", text: "✅ Code renvoyé !" });
    } catch (err) {
      setMessage({ type: "error", text: err.response?.data?.message || "Erreur. Réessayez." });
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

                <div className="input-group">
                  <label>Nom *</label>
                  <input name="nom_user" value={form.nom_user} onChange={handleChange} required />
                </div>
                <div className="input-group">
                  <label>Prénom *</label>
                  <input name="prenom_user" value={form.prenom_user} onChange={handleChange} required />
                </div>

                <div className="input-group full-width">
                  <label>Date Naissance *</label>
                  <BirthDatePicker
                    value={form.date_naissance}
                    onChange={(val) => setForm(p => ({ ...p, date_naissance: val }))}
                  />
                  {age !== null && <span className="age-badge">🎂 {age} ans</span>}
                </div>

                <div className="input-group">
                  <label>Sexe *</label>
                  <select name="sexe" value={form.sexe} onChange={handleChange} required>
                    <option value="">Choisir...</option>
                    <option value="homme">Homme</option>
                    <option value="femme">Femme</option>
                  </select>
                </div>

                {/* ── SECTION PARENT (si age < 12) — informatif, ne bloque pas ── */}
                {isMineur && (
                  <div className="parent-section full-width">
                    <div className="parent-section-title">
                      👨‍👩‍👦 Informations du Parent / Tuteur
                    </div>
                    <div className="register-form-grid" style={{ padding: 0, marginTop: 12 }}>
                      <div className="input-group">
                        <label>Nom du parent *</label>
                        <input name="nom_parent" value={form.nom_parent} onChange={handleChange}
                          placeholder="Nom de famille" required />
                      </div>
                      <div className="input-group">
                        <label>Prénom du parent *</label>
                        <input name="prenom_parent" value={form.prenom_parent} onChange={handleChange}
                          placeholder="Prénom" required />
                      </div>
                      <div className="input-group">
                        <label>Lien de parenté *</label>
                        <select name="lien_parent" value={form.lien_parent} onChange={handleChange} required>
                          <option value="">Choisir...</option>
                          <option value="pere">Père</option>
                          <option value="mere">Mère</option>
                          <option value="tuteur">Tuteur légal</option>
                        </select>
                      </div>
                      <div className="input-group">
                        <label>Téléphone du parent *</label>
                        <input name="tel_parent" value={form.tel_parent} onChange={handleChange}
                          placeholder="Ex: 55 123 456" type="tel" required />
                      </div>
                    </div>
                  </div>
                )}

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
                    {DATA_TUNISIE.gouvernorats.map(g => <option key={g} value={g}>{g}</option>)}
                  </select>
                </div>

                <div className="input-group">
                  <label>Délégation *</label>
                  <select name="delegation" value={form.delegation} onChange={handleChange}
                    disabled={!form.gouvernorat} required>
                    <option value="">Choisir...</option>
                    {form.gouvernorat && DATA_TUNISIE.delegations[form.gouvernorat]?.map(d =>
                      <option key={d} value={d}>{d}</option>
                    )}
                    <option value="Autre">Autre...</option>
                  </select>
                  {form.delegation === "Autre" && (
                    <input name="delegation_custom" value={form.delegation_custom} onChange={handleChange}
                      placeholder="Saisissez votre délégation..." style={{ marginTop: 8 }} required />
                  )}
                </div>

                <div className="input-group">
                  <label>Ville *</label>
                  <input name="ville" placeholder="Ex: Carthage, El Menzah..."
                    value={form.ville} onChange={handleChange}
                    disabled={!effectiveDelegation} required />
                </div>

                <div className="input-group full-width">
                  <label>
                    Établissement {etablissementDisabled ? "" : "*"}
                    {etablissementDisabled && <span style={{ fontSize: 12, color: "rgba(255,255,255,0.55)", marginLeft: 8 }}>(non requis)</span>}
                  </label>
                  <input name="etablissement"
                    placeholder={etablissementDisabled ? "Non applicable" : "Nom de ton école/fac..."}
                    value={etablissementDisabled ? "" : form.etablissement}
                    onChange={handleChange}
                    disabled={etablissementDisabled || !effectiveDelegation}
                    required={!etablissementDisabled} />
                </div>

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
                  <input type="email" name="email_user" value={form.email_user}
                    onChange={handleChange} placeholder="votre@email.com" />
                </div>
                <button onClick={sendOwnerCheck} className="register-submit-btn full-width" disabled={loading}>
                  {loading ? "Envoi..." : "Envoyer Vérification"}
                </button>
                <p style={{ marginTop: 15, color: "rgba(255,255,255,0.7)", fontSize: 14 }}>
                  ✉️ Cliquez sur <strong>"OUI"</strong> dans l'email pour continuer automatiquement.
                </p>
              </div>
            )}

            {/* ══ STEP 3 ══════════════════════════════════ */}
            {step === 3 && (
              <form onSubmit={handleFinalSubmit} className="step-content">
                <p>Nous avons envoyé un <strong>Code Secret</strong> à votre email. Copiez-le et collez-le ici.</p>

                {!codeSent ? (
                  <div style={{ textAlign: "center" }}>
                    <p style={{ color: "rgba(255,255,255,0.7)", fontSize: 14 }}>⏳ Envoi du code en cours...</p>
                    <button type="button" onClick={handleResendCode} disabled={loading}
                      className="register-submit-btn full-width" style={{ marginTop: 12 }}>
                      {loading ? "Envoi..." : "🔄 Renvoyer le code"}
                    </button>
                  </div>
                ) : (
                  <>
                    <div className="input-group full-width">
                      <label>Code Secret *</label>
                      <input type="text" name="mot_de_passe_user"
                        value={form.mot_de_passe_user} onChange={handleChange}
                        placeholder="Collez le code ici..." autoComplete="off" required />
                    </div>
                    <button type="submit" className="register-submit-btn full-width" disabled={loading}>
                      {loading ? "Création..." : "Confirmer & Accéder"}
                    </button>
                    <p style={{ fontSize: 13, color: "rgba(255,255,255,0.5)", textAlign: "center", cursor: "pointer" }}
                      onClick={handleResendCode}>
                      Code non reçu ? Cliquez ici pour renvoyer
                    </p>
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
const DATA_TUNISIE = {
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