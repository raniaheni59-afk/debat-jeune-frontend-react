/**
 * JeuneEnquete.jsx  —  Espace Jeune: répondre à une enquête
 * Matches JeuneLayout purple/glass design system
 *
 * Usage in JeuneLayout.jsx:
 *   import JeuneEnquete from "./JeuneEnquete";
 *   // Add ENQUETE to PAGES and render <JeuneEnquete /> in renderContent()
 *
 * Routes expected (backend):
 *   GET  /api/enquetes/published          → list of published enquêtes for jeunes
 *   GET  /api/enquetes/:id                → single enquête (questions)
 *   POST /api/enquetes/:id/reponses       → submit answers
 *   GET  /api/enquetes/:id/reponses/mine  → check if already answered (by JWT user)
 */

import { useState, useEffect } from "react";
import API from "../services/api";

/* ─── star rating widget ─── */
function StarRating({ value, onChange }) {
  const [hovered, setHovered] = useState(0);
  return (
    <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
      {[1, 2, 3, 4, 5].map((n) => (
        <span
          key={n}
          style={{
            fontSize: 30,
            cursor: "pointer",
            color: n <= (hovered || value) ? "#f59e0b" : "#d1c4e9",
            transition: "color .15s, transform .15s",
            transform: n <= (hovered || value) ? "scale(1.15)" : "scale(1)",
            userSelect: "none",
          }}
          onMouseEnter={() => setHovered(n)}
          onMouseLeave={() => setHovered(0)}
          onClick={() => onChange(n)}
          role="button"
          aria-label={`Note: ${n}`}
        >
          ★
        </span>
      ))}
      {value > 0 && (
        <span style={{ fontSize: 13, color: "#7c5cbf", fontWeight: 600 }}>
          {value}/5
        </span>
      )}
    </div>
  );
}

/* ─── single question renderer ─── */
function QuestionField({ q, value, onChange }) {
  switch (q.type) {
    case "text":
      return (
        <input
          style={S.input}
          placeholder="Votre réponse…"
          value={value || ""}
          onChange={(e) => onChange(e.target.value)}
        />
      );

    case "textarea":
      return (
        <textarea
          style={{ ...S.input, minHeight: 100, resize: "vertical", lineHeight: 1.6 }}
          placeholder="Votre réponse…"
          value={value || ""}
          onChange={(e) => onChange(e.target.value)}
        />
      );

    case "radio":
      return (
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {(q.options || []).map((opt) => (
            <label key={opt.id} style={S.optionLabel}>
              <div
                style={{
                  ...S.radioCircle,
                  borderColor: value === opt.text ? "#7c5cbf" : "#d1c4e9",
                  background: value === opt.text ? "#7c5cbf" : "transparent",
                }}
              >
                {value === opt.text && (
                  <span style={{ width: 8, height: 8, borderRadius: "50%", background: "#fff", display: "block" }} />
                )}
              </div>
              <input
                type="radio"
                name={q.id}
                value={opt.text}
                checked={value === opt.text}
                onChange={() => onChange(opt.text)}
                style={{ display: "none" }}
              />
              <span style={S.optionText}>{opt.text}</span>
            </label>
          ))}
        </div>
      );

    case "checkbox":
      return (
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {(q.options || []).map((opt) => {
            const checked = Array.isArray(value) && value.includes(opt.text);
            return (
              <label key={opt.id} style={S.optionLabel}>
                <div
                  style={{
                    ...S.checkBox,
                    borderColor: checked ? "#7c5cbf" : "#d1c4e9",
                    background: checked ? "#7c5cbf" : "transparent",
                  }}
                >
                  {checked && <span style={{ color: "#fff", fontSize: 12, lineHeight: 1 }}>✓</span>}
                </div>
                <input
                  type="checkbox"
                  value={opt.text}
                  checked={checked}
                  onChange={() => {
                    const arr = Array.isArray(value) ? [...value] : [];
                    const next = arr.includes(opt.text)
                      ? arr.filter((v) => v !== opt.text)
                      : [...arr, opt.text];
                    onChange(next);
                  }}
                  style={{ display: "none" }}
                />
                <span style={S.optionText}>{opt.text}</span>
              </label>
            );
          })}
        </div>
      );

    case "select":
      return (
        <select
          style={{ ...S.input, cursor: "pointer" }}
          value={value || ""}
          onChange={(e) => onChange(e.target.value)}
        >
          <option value="">— Sélectionner —</option>
          {(q.options || []).map((opt) => (
            <option key={opt.id} value={opt.text}>
              {opt.text}
            </option>
          ))}
        </select>
      );

    case "rating":
      return <StarRating value={value || 0} onChange={onChange} />;

    case "date":
      return (
        <input
          type="date"
          style={S.input}
          value={value || ""}
          onChange={(e) => onChange(e.target.value)}
        />
      );

    case "number":
      return (
        <input
          type="number"
          style={S.input}
          placeholder="0"
          value={value || ""}
          onChange={(e) => onChange(e.target.value)}
        />
      );

    default:
      return null;
  }
}

/* ══════════════════════════════════════════════════════════
   MAIN COMPONENT: JeuneEnquete
══════════════════════════════════════════════════════════ */
export default function JeuneEnquete() {
  const [enquetes, setEnquetes] = useState([]);
  const [loading, setLoading]   = useState(true);
  const [active, setActive]     = useState(null);  // currently open enquête
  const [answers, setAnswers]   = useState({});
  const [step, setStep]         = useState(0);      // current question index (stepper mode)
  const [mode, setMode]         = useState("list"); // list | form | success
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors]         = useState({});
  const [alreadyDone, setAlreadyDone] = useState({}); // id → true if already answered

  useEffect(() => {
    API.get("/enquetes/published")
      .then((r) => setEnquetes(r.data || []))
      .catch(() => setEnquetes([]))
      .finally(() => setLoading(false));
  }, []);

  /* ── open an enquête ── */
  const openEnquete = async (e) => {
    setActive(e);
    setAnswers({});
    setStep(0);
    setErrors({});
    // check if already answered
    try {
      await API.get(`/enquetes/${e._id}/reponses/mine`);
      setAlreadyDone((d) => ({ ...d, [e._id]: true }));
    } catch {
      /* not answered yet */
    }
    setMode("form");
  };

  /* ── answer setter ── */
  const setAnswer = (qid, val) =>
    setAnswers((a) => ({ ...a, [qid]: val }));

  /* ── validate current step ── */
  const validateStep = () => {
    if (!active) return true;
    const q = active.questions[step];
    if (q.required) {
      const v = answers[q.id];
      const empty =
        v === undefined ||
        v === "" ||
        v === 0 ||
        (Array.isArray(v) && v.length === 0);
      if (empty) {
        setErrors((e) => ({ ...e, [q.id]: true }));
        return false;
      }
    }
    setErrors((e) => { const n = { ...e }; delete n[active.questions[step].id]; return n; });
    return true;
  };

  /* ── next / prev ── */
  const handleNext = () => {
    if (!validateStep()) return;
    if (step < active.questions.length - 1) {
      setStep((s) => s + 1);
    }
  };
  const handlePrev = () => setStep((s) => Math.max(s, 1) - 1);

  /* ── submit ── */
  const handleSubmit = async () => {
    if (!validateStep()) return;
    setSubmitting(true);
    try {
      await API.post(`/enquetes/${active._id}/reponses`, { answers });
      setMode("success");
      setAlreadyDone((d) => ({ ...d, [active._id]: true }));
    } catch {
      alert("Erreur lors de l'envoi. Veuillez réessayer.");
    } finally {
      setSubmitting(false);
    }
  };

  /* ── progress ── */
  const progress = active
    ? Math.round(((step + 1) / active.questions.length) * 100)
    : 0;

  /* ══════════════════════════════════════════════════════
     LIST VIEW
  ══════════════════════════════════════════════════════ */
  if (mode === "list" || mode === "list-reload") {
    return (
      <div style={S.page}>
        <div style={S.listHead}>
          <h2 style={S.listTitle}>📋 Enquêtes</h2>
          <p style={S.listSub}>Partagez votre avis et aidez-nous à améliorer nos activités</p>
        </div>

        {loading ? (
          <div style={S.centered}><div style={S.spinner} /></div>
        ) : enquetes.length === 0 ? (
          <div style={S.emptyCard}>
            <span style={{ fontSize: 44 }}>📭</span>
            <p style={S.emptyTitle}>Aucune enquête pour l'instant</p>
            <p style={S.emptySub}>Revenez bientôt !</p>
          </div>
        ) : (
          <div style={S.enqGrid}>
            {enquetes.map((e) => (
              <div key={e._id} style={S.enqCard}>
                <div
                  style={{
                    height: 6, borderRadius: "16px 16px 0 0",
                    background: e.couleur || "#7c5cbf",
                  }}
                />
                <div style={{ padding: "18px 20px 20px" }}>
                  <h3 style={S.enqTitle}>{e.titre}</h3>
                  {e.description && <p style={S.enqDesc}>{e.description}</p>}
                  <p style={S.enqMeta}>
                    {e.questions?.length || 0} question{e.questions?.length !== 1 ? "s" : ""}
                  </p>

                  {alreadyDone[e._id] ? (
                    <div style={S.donePill}>✅ Déjà répondu — Merci !</div>
                  ) : (
                    <button
                      style={{ ...S.startBtn, background: `linear-gradient(135deg, ${e.couleur || "#7c5cbf"}, ${e.couleur || "#5a3fa0"})` }}
                      onClick={() => openEnquete(e)}
                    >
                      Répondre →
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  }

  /* ══════════════════════════════════════════════════════
     SUCCESS VIEW
  ══════════════════════════════════════════════════════ */
  if (mode === "success") {
    return (
      <div style={{ ...S.page, display: "flex", alignItems: "center", justifyContent: "center", minHeight: 400 }}>
        <div style={S.successCard}>
          <div style={S.successIcon}>🎉</div>
          <h2 style={S.successTitle}>Merci pour votre réponse !</h2>
          <p style={S.successSub}>
            Votre avis a été enregistré avec succès et transmis à l'équipe.
          </p>
          <button style={S.startBtn} onClick={() => { setMode("list"); setActive(null); }}>
            ← Retour aux enquêtes
          </button>
        </div>
      </div>
    );
  }

  /* ══════════════════════════════════════════════════════
     FORM VIEW  (stepper style, like Google Form)
  ══════════════════════════════════════════════════════ */
  if (!active) return null;
  const currentQ = active.questions[step];
  const isLast   = step === active.questions.length - 1;

  return (
    <div style={S.page}>
      {/* header */}
      <div style={{ ...S.formHeader, borderTop: `5px solid ${active.couleur || "#7c5cbf"}` }}>
        <button style={S.backBtn} onClick={() => { setMode("list"); setActive(null); }}>
          ← Retour
        </button>
        <div>
          <h2 style={S.formTitle}>{active.titre}</h2>
          {active.description && <p style={S.formDesc}>{active.description}</p>}
        </div>
      </div>

      {/* progress bar */}
      <div style={S.progressWrap}>
        <div style={{ ...S.progressBar, width: `${progress}%`, background: active.couleur || "#7c5cbf" }} />
      </div>
      <p style={S.progressLabel}>
        Question {step + 1} / {active.questions.length}
      </p>

      {/* already answered banner */}
      {alreadyDone[active._id] && (
        <div style={S.alreadyBanner}>
          ℹ️ Vous avez déjà répondu à cette enquête. Vous pouvez tout de même la consulter.
        </div>
      )}

      {/* question card */}
      <div style={S.qCard}>
        <p style={S.qLabel}>
          {currentQ.label}
          {currentQ.required && <span style={S.qRequired}> *</span>}
        </p>
        <QuestionField
          q={currentQ}
          value={answers[currentQ.id]}
          onChange={(val) => setAnswer(currentQ.id, val)}
        />
        {errors[currentQ.id] && (
          <p style={S.errorMsg}>⚠️ Cette question est obligatoire</p>
        )}
      </div>

      {/* navigation */}
      <div style={S.navRow}>
        {step > 0 && (
          <button style={S.prevBtn} onClick={handlePrev}>
            ← Précédent
          </button>
        )}
        <div style={{ flex: 1 }} />
        {isLast ? (
          <button
            style={{ ...S.nextBtn, background: active.couleur || "#7c5cbf" }}
            onClick={handleSubmit}
            disabled={submitting || alreadyDone[active._id]}
          >
            {submitting ? "Envoi…" : "✅ Soumettre"}
          </button>
        ) : (
          <button
            style={{ ...S.nextBtn, background: active.couleur || "#7c5cbf" }}
            onClick={handleNext}
          >
            Suivant →
          </button>
        )}
      </div>

      {/* dots navigator */}
      <div style={S.dotsRow}>
        {active.questions.map((_, i) => (
          <div
            key={i}
            style={{
              ...S.dot,
              background: i < step ? (active.couleur || "#7c5cbf") : i === step ? (active.couleur || "#7c5cbf") : "#d1c4e9",
              opacity: i === step ? 1 : i < step ? 0.7 : 0.35,
              transform: i === step ? "scale(1.3)" : "scale(1)",
            }}
          />
        ))}
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════
   STYLES  (matches JeuneLayout palette)
══════════════════════════════════════════════════════════ */
const S = {
  page: { padding: "0 0 60px", fontFamily: "'Poppins', sans-serif", maxWidth: 680, margin: "0 auto" },

  /* list */
  listHead:  { marginBottom: 24 },
  listTitle: { fontSize: 22, fontWeight: 800, color: "#fff", margin: 0 },
  listSub:   { fontSize: 13, color: "rgba(255,255,255,.65)", margin: "4px 0 0" },
  enqGrid:   { display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(280px,1fr))", gap: 18 },

  enqCard: {
    background: "rgba(255,255,255,.93)", backdropFilter: "blur(10px)",
    borderRadius: 16, border: "1px solid rgba(255,255,255,.45)",
    boxShadow: "0 4px 20px rgba(90,63,160,.1)", overflow: "hidden",
  },
  enqTitle: { fontSize: 16, fontWeight: 700, color: "#2d2555", margin: "0 0 6px" },
  enqDesc:  { fontSize: 12.5, color: "#666", margin: "0 0 8px", lineHeight: 1.55 },
  enqMeta:  { fontSize: 12, color: "#9080b8", margin: "0 0 14px" },
  startBtn: {
    display: "inline-block", padding: "10px 22px",
    color: "#fff", border: "none", borderRadius: 10,
    fontSize: 13, fontWeight: 700, cursor: "pointer",
    fontFamily: "'Poppins',sans-serif", width: "100%", textAlign: "center",
  },
  donePill: {
    background: "#f0fdf4", color: "#16a34a", padding: "10px 14px",
    borderRadius: 10, fontSize: 13, fontWeight: 700, textAlign: "center",
    border: "1.5px solid #bbf7d0",
  },

  /* form */
  formHeader: {
    background: "rgba(255,255,255,.93)", backdropFilter: "blur(10px)",
    borderRadius: "0 0 18px 18px", padding: "20px 24px 20px",
    marginBottom: 20, border: "1px solid rgba(255,255,255,.45)",
    boxShadow: "0 4px 20px rgba(90,63,160,.1)",
  },
  backBtn: {
    background: "none", border: "none", color: "#7c5cbf", fontSize: 13,
    fontWeight: 700, cursor: "pointer", padding: "0 0 10px",
    fontFamily: "'Poppins',sans-serif",
  },
  formTitle: { fontSize: 20, fontWeight: 800, color: "#2d2555", margin: 0 },
  formDesc:  { fontSize: 13, color: "#666", margin: "6px 0 0", lineHeight: 1.55 },

  progressWrap: { height: 6, background: "rgba(255,255,255,.2)", borderRadius: 3, marginBottom: 6 },
  progressBar:  { height: "100%", borderRadius: 3, transition: "width .4s ease" },
  progressLabel: { fontSize: 12, color: "rgba(255,255,255,.7)", textAlign: "right", marginBottom: 20 },

  alreadyBanner: {
    background: "rgba(255,255,255,.15)", border: "1px solid rgba(255,255,255,.3)",
    borderRadius: 10, padding: "10px 16px", fontSize: 13, color: "#fff",
    marginBottom: 16,
  },

  qCard: {
    background: "rgba(255,255,255,.93)", backdropFilter: "blur(10px)",
    borderRadius: 16, padding: "24px 24px 20px",
    border: "1px solid rgba(255,255,255,.45)",
    boxShadow: "0 4px 20px rgba(90,63,160,.1)", marginBottom: 20,
    minHeight: 180,
  },
  qLabel:    { fontSize: 16, fontWeight: 700, color: "#2d2555", marginBottom: 18, lineHeight: 1.5 },
  qRequired: { color: "#e74c3c" },
  errorMsg:  { fontSize: 12, color: "#e74c3c", marginTop: 10, fontWeight: 600 },

  /* inputs */
  input: {
    width: "100%", padding: "11px 14px", border: "2px solid #e8e5f0",
    borderRadius: 10, fontSize: 13, fontFamily: "'Poppins',sans-serif",
    color: "#333", outline: "none", boxSizing: "border-box",
    background: "#fff", transition: "border-color .2s",
  },

  /* option items */
  optionLabel: {
    display: "flex", alignItems: "center", gap: 12, cursor: "pointer",
    padding: "10px 14px", background: "#faf8ff", borderRadius: 10,
    border: "1.5px solid #e8e5f0", transition: "border-color .15s",
  },
  optionText: { fontSize: 14, color: "#333", fontWeight: 500 },
  radioCircle: {
    width: 20, height: 20, borderRadius: "50%", border: "2px solid",
    display: "flex", alignItems: "center", justifyContent: "center",
    flexShrink: 0, transition: "background .15s, border-color .15s",
  },
  checkBox: {
    width: 20, height: 20, borderRadius: 6, border: "2px solid",
    display: "flex", alignItems: "center", justifyContent: "center",
    flexShrink: 0, transition: "background .15s, border-color .15s",
  },

  /* nav */
  navRow:  { display: "flex", alignItems: "center", gap: 12, marginBottom: 24 },
  prevBtn: {
    padding: "11px 22px", background: "rgba(255,255,255,.85)", border: "2px solid rgba(255,255,255,.5)",
    borderRadius: 10, color: "#5a3fa0", fontSize: 13, fontWeight: 700,
    cursor: "pointer", fontFamily: "'Poppins',sans-serif",
  },
  nextBtn: {
    padding: "11px 28px", border: "none", borderRadius: 10,
    color: "#fff", fontSize: 14, fontWeight: 700,
    cursor: "pointer", fontFamily: "'Poppins',sans-serif",
    boxShadow: "0 4px 16px rgba(90,63,160,.35)",
    transition: "transform .15s, box-shadow .15s",
  },

  dotsRow: { display: "flex", gap: 7, justifyContent: "center" },
  dot: {
    width: 9, height: 9, borderRadius: "50%",
    transition: "background .3s, transform .3s, opacity .3s",
  },

  /* success */
  successCard: {
    background: "rgba(255,255,255,.93)", borderRadius: 22,
    padding: "48px 36px", textAlign: "center", maxWidth: 440, margin: "0 auto",
    boxShadow: "0 8px 40px rgba(90,63,160,.15)", border: "1px solid rgba(255,255,255,.5)",
  },
  successIcon:  { fontSize: 56, marginBottom: 16 },
  successTitle: { fontSize: 22, fontWeight: 800, color: "#2d2555", margin: "0 0 10px" },
  successSub:   { fontSize: 14, color: "#666", margin: "0 0 24px", lineHeight: 1.6 },

  /* misc */
  centered: { display: "flex", justifyContent: "center", alignItems: "center", minHeight: 200 },
  spinner: {
    width: 34, height: 34, border: "3px solid rgba(255,255,255,.2)",
    borderTopColor: "#fff", borderRadius: "50%",
    animation: "spin 0.8s linear infinite",
  },
  emptyCard: {
    background: "rgba(255,255,255,.1)", borderRadius: 18, padding: "48px 24px",
    textAlign: "center", border: "1px solid rgba(255,255,255,.2)",
  },
  emptyTitle: { fontSize: 18, fontWeight: 700, color: "#fff", margin: "12px 0 6px" },
  emptySub:   { fontSize: 13, color: "rgba(255,255,255,.65)", margin: 0 },
};