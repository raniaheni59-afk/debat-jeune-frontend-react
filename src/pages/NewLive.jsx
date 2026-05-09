
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import API from "../services/api";

const THEMATIQUES = [
  "Sciences & Innovation", "Environnement & Développement Durable",
  "Technologie & Numérique", "Santé & Bien-être",
  "Éducation & Formation", "Citoyenneté & Société", "Autre",
];

export default function NewLive({ onCancel }) {
  const navigate = useNavigate();
  const [form, setForm] = useState({ title: "", description: "", date: "", time: "", thematique: "" });
  const [errors, setErrors] = useState({});
  const [step, setStep]     = useState("form");   // form | confirm | success
  const [loading, setLoading] = useState(false);
  const [result, setResult]   = useState(null);

  const set = (k, v) => { setForm(p => ({ ...p, [k]: v })); setErrors(p => ({ ...p, [k]: "" })); };

  const validate = () => {
    const e = {};
    if (!form.title.trim())      e.title = "Titre obligatoire";
    if (!form.description.trim()) e.description = "Description obligatoire";
    if (!form.date)              e.date = "Date obligatoire";
    else if (new Date(`${form.date}T${form.time||"00:00"}`) < new Date()) e.date = "Date future requise";
    if (!form.time)              e.time = "Heure obligatoire";
    if (!form.thematique)        e.thematique = "Thématique obligatoire";
    setErrors(e);
    return !Object.keys(e).length;
  };

  const handleCreate = async () => {
    setLoading(true);
    try {
      const res = await API.post("/api/lives/session/create", {
        title: form.title, description: form.description,
        date: form.date, time: form.time,
        thematique: form.thematique, status: "En cours", category: "other",
      });

      if (!res.data?.success) throw new Error(res.data?.message || "Erreur");

      const { hostLink, viewerLink, roomCode, hostAccessToken } = res.data;

      // Sauvegarder viewerLink pour le partage depuis MeetRoom
      localStorage.setItem("currentLiveViewerLink", viewerLink);

      setResult({ hostLink, viewerLink, roomCode });
      setStep("success");

      // Redirection automatique vers MeetRoom en tant que host
      setTimeout(() => {
        navigate(`/meet/${roomCode}?at=${hostAccessToken}`);
      }, 2000);

    } catch (err) {
      alert("❌ " + (err.response?.data?.message || err.message));
    } finally {
      setLoading(false);
    }
  };

  const fmtDate = () => {
    if (!form.date) return "";
    return new Date(`${form.date}T${form.time || "00:00"}`).toLocaleDateString("fr-FR", {
      weekday: "long", day: "numeric", month: "long", year: "numeric",
    }) + (form.time ? ` à ${form.time}` : "");
  };

  /* ── SUCCESS ── */
  if (step === "success" && result) return (
    <div style={W.page}>
      <style>{ANIM}</style>
      <div style={W.card}>
        <div style={{ fontSize: 54, marginBottom: 16, animation: "bounceIn .5s" }}>🎙️</div>
        <h2 style={W.h2}>Live créé avec succès !</h2>
        <p style={W.sub}>Redirection vers la salle en cours…</p>
        <div style={W.linkBox}>
          <label style={W.linkLabel}>🔗 Lien pour les participants</label>
          <div style={W.linkRow}>
            <code style={W.linkCode}>{result.viewerLink}</code>
            <button onClick={() => navigator.clipboard.writeText(result.viewerLink)} style={W.copyBtn}>📋</button>
          </div>
        </div>
        <div style={W.spinner} />
      </div>
    </div>
  );

  /* ── CONFIRM ── */
  if (step === "confirm") return (
    <div style={W.page}>
      <style>{ANIM}</style>
      <div style={W.card}>
        <div style={{ fontSize: 48, marginBottom: 12 }}>📋</div>
        <h2 style={W.h2}>Confirmer le live</h2>
        <div style={W.detailBox}>
          {[
            ["📌 Titre",      form.title],
            ["📅 Date",       fmtDate()],
            ["🎯 Thématique", form.thematique],
          ].map(([k, v]) => (
            <div key={k} style={W.detailRow}>
              <span style={W.detailKey}>{k}</span>
              <span style={W.detailVal}>{v}</span>
            </div>
          ))}
        </div>
        <div style={{ display: "flex", gap: 12, justifyContent: "center" }}>
          <button onClick={() => setStep("form")} style={W.ghost} disabled={loading}>← Modifier</button>
          <button onClick={handleCreate} style={W.primary} disabled={loading}>
            {loading ? <span style={W.spinner} /> : "🚀 Démarrer maintenant"}
          </button>
        </div>
      </div>
    </div>
  );

  /* ── FORM ── */
  return (
    <div style={W.page}>
      <style>{ANIM}</style>
      <div style={W.card}>
        <div style={W.badge}><span style={W.dot} />Nouvelle Session</div>
        <h1 style={W.h1}>Créer un Live</h1>
        <p style={W.sub}>Remplissez les informations pour programmer et démarrer votre live</p>

        <div style={W.form}>
          <Field label="📌 Titre" error={errors.title}>
            <input style={inp(errors.title)} placeholder="Ex : Débat sur l'innovation..." value={form.title} onChange={e => set("title", e.target.value)} />
          </Field>

          <Field label="📝 Description" error={errors.description}>
            <textarea style={{ ...inp(errors.description), resize: "vertical", minHeight: 100 }}
              placeholder="Décrivez le contenu…" value={form.description} onChange={e => set("description", e.target.value)} />
          </Field>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
            <Field label="📅 Date" error={errors.date}>
              <input type="date" style={inp(errors.date)} value={form.date} onChange={e => set("date", e.target.value)} />
            </Field>
            <Field label="🕐 Heure" error={errors.time}>
              <input type="time" style={inp(errors.time)} value={form.time} onChange={e => set("time", e.target.value)} />
            </Field>
          </div>

          <Field label="🎯 Thématique" error={errors.thematique}>
            <select style={inp(errors.thematique)} value={form.thematique} onChange={e => set("thematique", e.target.value)}>
              <option value="">-- Sélectionnez --</option>
              {THEMATIQUES.map(t => <option key={t} value={t}>{t}</option>)}
            </select>
          </Field>

          <div style={W.actions}>
            <button type="button" onClick={() => onCancel ? onCancel() : navigate(-1)} style={W.ghost}>Annuler</button>
            <button onClick={() => validate() && setStep("confirm")} style={W.primary}>
              Créer le Live →
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function Field({ label, error, children }) {
  return (
    <div>
      <label style={{ color: "rgba(255,255,255,.8)", fontSize: 13, fontWeight: 600, display: "block", marginBottom: 8 }}>{label}</label>
      {children}
      {error && <p style={{ color: "#f87171", fontSize: 12, marginTop: 4 }}>⚠ {error}</p>}
    </div>
  );
}

const inp = (err) => ({
  background: "rgba(255,255,255,.06)", border: `1px solid ${err ? "#ef4444" : "rgba(255,255,255,.12)"}`,
  borderRadius: 12, color: "#fff", fontSize: 14, padding: "12px 16px",
  outline: "none", width: "100%", fontFamily: "inherit",
  boxShadow: err ? "0 0 0 3px rgba(239,68,68,.15)" : "none",
});

const ANIM = `
  @keyframes bounceIn { from{transform:scale(0)} to{transform:scale(1)} }
  @keyframes spin { to{transform:rotate(360deg)} }
  @keyframes fadeUp { from{opacity:0;transform:translateY(20px)} to{opacity:1;transform:translateY(0)} }
`;

const W = {
  page:      { minHeight: "100vh", background: "linear-gradient(135deg,#0f0c29,#1e0a4a,#0f0c29)", display: "flex", alignItems: "center", justifyContent: "center", padding: "40px 20px", fontFamily: "'DM Sans',sans-serif" },
  card:      { background: "rgba(255,255,255,.04)", backdropFilter: "blur(24px)", border: "1px solid rgba(255,255,255,.1)", borderRadius: 24, width: "100%", maxWidth: 680, padding: "44px 40px", boxShadow: "0 30px 80px rgba(0,0,0,.5)", animation: "fadeUp .4s ease", textAlign: "center" },
  badge:     { display: "inline-flex", alignItems: "center", gap: 8, background: "linear-gradient(135deg,#7c3aed,#c026d3)", color: "#fff", padding: "7px 20px", borderRadius: 50, fontSize: 11, fontWeight: 800, letterSpacing: 2, textTransform: "uppercase", marginBottom: 18 },
  dot:       { width: 9, height: 9, background: "#f87171", borderRadius: "50%", animation: "pulse 1.5s infinite", display: "inline-block" },
  h1:        { fontSize: 28, fontWeight: 900, color: "#fff", margin: "0 0 10px", background: "linear-gradient(135deg,#fff,#c4b5fd)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" },
  h2:        { fontSize: 22, fontWeight: 800, color: "#f1f5f9", margin: "0 0 10px" },
  sub:       { color: "rgba(255,255,255,.5)", fontSize: 14, marginBottom: 28 },
  form:      { display: "flex", flexDirection: "column", gap: 20, textAlign: "left" },
  actions:   { display: "flex", justifyContent: "flex-end", gap: 12, paddingTop: 8, borderTop: "1px solid rgba(255,255,255,.07)" },
  primary:   { background: "linear-gradient(135deg,#7c3aed,#3b82f6)", border: "none", borderRadius: 12, padding: "13px 28px", color: "#fff", fontWeight: 800, fontSize: 14, cursor: "pointer", boxShadow: "0 4px 20px rgba(124,58,237,.4)", display: "flex", alignItems: "center", gap: 8 },
  ghost:     { background: "rgba(255,255,255,.07)", border: "1px solid rgba(255,255,255,.15)", borderRadius: 12, padding: "13px 24px", color: "rgba(255,255,255,.75)", fontWeight: 600, fontSize: 14, cursor: "pointer" },
  detailBox: { background: "rgba(255,255,255,.04)", border: "1px solid rgba(255,255,255,.08)", borderRadius: 14, padding: "16px 20px", margin: "20px 0", textAlign: "left" },
  detailRow: { display: "flex", gap: 12, marginBottom: 10, fontSize: 13 },
  detailKey: { color: "rgba(255,255,255,.4)", minWidth: 110 },
  detailVal: { color: "rgba(255,255,255,.85)", fontWeight: 600, wordBreak: "break-all" },
  linkBox:   { background: "rgba(255,255,255,.04)", border: "1px solid rgba(255,255,255,.08)", borderRadius: 14, padding: 16, marginBottom: 20, textAlign: "left" },
  linkLabel: { color: "rgba(255,255,255,.5)", fontSize: 11, fontWeight: 700, display: "block", marginBottom: 8, textTransform: "uppercase", letterSpacing: 1 },
  linkRow:   { display: "flex", gap: 8, alignItems: "center" },
  linkCode:  { flex: 1, color: "#a78bfa", fontSize: 11, wordBreak: "break-all", background: "rgba(167,139,250,.08)", padding: "6px 10px", borderRadius: 8 },
  copyBtn:   { background: "#7c3aed", border: "none", borderRadius: 8, padding: "6px 10px", color: "#fff", cursor: "pointer", flexShrink: 0 },
  spinner:   { width: 20, height: 20, border: "2px solid rgba(255,255,255,.3)", borderTopColor: "#fff", borderRadius: "50%", animation: "spin .7s linear infinite", display: "inline-block" },
};