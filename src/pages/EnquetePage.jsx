/**
 * EnquetePage.jsx  —  Admin Survey Builder
 * Matches the AdminDashboard purple/glass design system
 * Stack: React + Node/Express + Railway/Render/Vercel
 *
 * Routes expected (backend):
 *   POST   /api/enquetes            → create enquête
 *   GET    /api/enquetes            → list all
 *   PUT    /api/enquetes/:id        → update
 *   DELETE /api/enquetes/:id        → delete
 *   PUT    /api/enquetes/:id/publish → toggle published
 *   GET    /api/enquetes/:id/reponses → all responses
 */

import { useState, useEffect, useRef } from "react";
import API from "../services/api";

/* ─── tiny uid helper ─── */
const uid = () => Math.random().toString(36).slice(2, 10);

/* ─── question types ─── */
const Q_TYPES = [
  { value: "text",     label: "Texte court",     icon: "✏️" },
  { value: "textarea", label: "Texte long",       icon: "📝" },
  { value: "radio",    label: "Choix unique",     icon: "🔘" },
  { value: "checkbox", label: "Choix multiple",   icon: "☑️" },
  { value: "select",   label: "Liste déroulante", icon: "📋" },
  { value: "rating",   label: "Note (1-5)",       icon: "⭐" },
  { value: "date",     label: "Date",             icon: "📅" },
  { value: "number",   label: "Nombre",           icon: "🔢" },
];

/* ─── blank question factory ─── */
const blankQuestion = () => ({
  id: uid(),
  type: "text",
  label: "",
  required: false,
  options: [],
});

/* ─── blank enquête factory ─── */
const blankEnquete = () => ({
  titre: "",
  description: "",
  couleur: "#7c5cbf",
  questions: [blankQuestion()],
});

/* ══════════════════════════════════════════════════════════
   SUB-COMPONENT: QuestionEditor
══════════════════════════════════════════════════════════ */
function QuestionEditor({ q, idx, onChange, onDelete, onMove, total }) {
  const needsOptions = ["radio", "checkbox", "select"].includes(q.type);

  const updateField = (key, val) => onChange({ ...q, [key]: val });

  const addOption = () =>
    onChange({ ...q, options: [...(q.options || []), { id: uid(), text: "" }] });

  const updateOption = (oid, text) =>
    onChange({ ...q, options: q.options.map((o) => (o.id === oid ? { ...o, text } : o)) });

  const removeOption = (oid) =>
    onChange({ ...q, options: q.options.filter((o) => o.id !== oid) });

  return (
    <div style={S.qCard}>
      {/* drag handle row */}
      <div style={S.qHeader}>
        <span style={S.qNum}>Q{idx + 1}</span>
        <div style={S.qTypeRow}>
          <select
            style={S.qTypeSelect}
            value={q.type}
            onChange={(e) => updateField("type", e.target.value)}
          >
            {Q_TYPES.map((t) => (
              <option key={t.value} value={t.value}>
                {t.icon} {t.label}
              </option>
            ))}
          </select>
          <label style={S.reqToggle}>
            <input
              type="checkbox"
              checked={q.required}
              onChange={(e) => updateField("required", e.target.checked)}
            />
            <span style={{ fontSize: 12, color: "#7c5cbf" }}>Obligatoire</span>
          </label>
        </div>
        <div style={S.qActions}>
          <button
            style={S.qActBtn}
            onClick={() => onMove(idx, -1)}
            disabled={idx === 0}
            title="Monter"
          >▲</button>
          <button
            style={S.qActBtn}
            onClick={() => onMove(idx, 1)}
            disabled={idx === total - 1}
            title="Descendre"
          >▼</button>
          <button
            style={{ ...S.qActBtn, color: "#dc2626", borderColor: "#fecaca" }}
            onClick={() => onDelete(q.id)}
            title="Supprimer"
          >✕</button>
        </div>
      </div>

      {/* question label */}
      <input
        style={S.qInput}
        placeholder={`Question ${idx + 1}…`}
        value={q.label}
        onChange={(e) => updateField("label", e.target.value)}
      />

      {/* options for radio / checkbox / select */}
      {needsOptions && (
        <div style={{ marginTop: 10 }}>
          {(q.options || []).map((opt, oi) => (
            <div key={opt.id} style={S.optRow}>
              <span style={S.optBullet}>
                {q.type === "radio" ? "○" : q.type === "checkbox" ? "□" : `${oi + 1}.`}
              </span>
              <input
                style={{ ...S.qInput, flex: 1, marginTop: 0 }}
                placeholder={`Option ${oi + 1}`}
                value={opt.text}
                onChange={(e) => updateOption(opt.id, e.target.value)}
              />
              <button
                style={{ ...S.qActBtn, color: "#dc2626", borderColor: "#fecaca", marginLeft: 6 }}
                onClick={() => removeOption(opt.id)}
              >✕</button>
            </div>
          ))}
          <button style={S.addOptBtn} onClick={addOption}>
            + Ajouter une option
          </button>
        </div>
      )}

      {/* rating preview */}
      {q.type === "rating" && (
        <div style={{ display: "flex", gap: 6, marginTop: 10 }}>
          {[1, 2, 3, 4, 5].map((n) => (
            <span key={n} style={S.ratingStar}>☆</span>
          ))}
          <span style={{ fontSize: 11, color: "#9080b8", alignSelf: "center" }}>
            Aperçu — le jeune cliquera pour noter
          </span>
        </div>
      )}
    </div>
  );
}

/* ══════════════════════════════════════════════════════════
   SUB-COMPONENT: ResponsesPanel
══════════════════════════════════════════════════════════ */
function ResponsesPanel({ enquete, onClose }) {
  const [responses, setResponses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(null);

  useEffect(() => {
    API.get(`/enquetes/${enquete._id}/reponses`)
      .then((r) => setResponses(r.data || []))
      .catch(() => setResponses([]))
      .finally(() => setLoading(false));
  }, [enquete._id]);

  return (
    <div style={S.overlay}>
      <div style={{ ...S.modal, maxWidth: 700 }}>
        {/* header */}
        <div style={S.mHead}>
          <div>
            <p style={S.mTitle}>📊 Réponses — {enquete.titre}</p>
            <p style={{ fontSize: 12, color: "#9080b8", margin: 0 }}>
              {responses.length} réponse{responses.length !== 1 ? "s" : ""} reçue{responses.length !== 1 ? "s" : ""}
            </p>
          </div>
          <button style={S.mClose} onClick={onClose}>✕</button>
        </div>

        <div style={{ padding: "0 28px 28px" }}>
          {loading ? (
            <div style={S.loadingBox}>
              <div style={S.spinner} />
              <p style={{ color: "#9080b8", fontSize: 13 }}>Chargement…</p>
            </div>
          ) : responses.length === 0 ? (
            <div style={S.emptyBox}>
              <span style={{ fontSize: 36 }}>📭</span>
              <p style={{ color: "#9080b8", marginTop: 8 }}>Aucune réponse pour l'instant</p>
            </div>
          ) : (
            <div style={{ display: "flex", gap: 16 }}>
              {/* list */}
              <div style={{ width: 200, flexShrink: 0 }}>
                <p style={S.secLabel}>Liste</p>
                {responses.map((r, i) => (
                  <button
                    key={r._id}
                    style={{
                      ...S.respBtn,
                      background: selected?._id === r._id ? "#f0ebff" : "transparent",
                      borderColor: selected?._id === r._id ? "#7c5cbf" : "#e8e5f0",
                      color: selected?._id === r._id ? "#5a3fa0" : "#444",
                    }}
                    onClick={() => setSelected(r)}
                  >
                    <span style={{ fontWeight: 600 }}>#{i + 1}</span>
                    <span style={{ fontSize: 11, color: "#9080b8" }}>
                      {r.jeune_nom || "Anonyme"}
                    </span>
                    <span style={{ fontSize: 10, color: "#b8b0cc", marginLeft: "auto" }}>
                      {r.created_at ? new Date(r.created_at).toLocaleDateString("fr-FR") : ""}
                    </span>
                  </button>
                ))}
              </div>

              {/* detail */}
              <div style={{ flex: 1 }}>
                {selected ? (
                  <div>
                    <p style={S.secLabel}>
                      Réponse de {selected.jeune_nom || "Anonyme"} —{" "}
                      {selected.created_at
                        ? new Date(selected.created_at).toLocaleString("fr-FR")
                        : ""}
                    </p>
                    {enquete.questions.map((q, qi) => (
                      <div key={q.id} style={S.respDetail}>
                        <p style={{ fontSize: 12, fontWeight: 700, color: "#5a3fa0", marginBottom: 4 }}>
                          Q{qi + 1}. {q.label || "(sans titre)"}
                        </p>
                        <p style={{ fontSize: 13, color: "#333" }}>
                          {Array.isArray(selected.answers?.[q.id])
                            ? selected.answers[q.id].join(", ")
                            : selected.answers?.[q.id] || (
                                <em style={{ color: "#b8b0cc" }}>Pas de réponse</em>
                              )}
                        </p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div style={S.emptyBox}>
                    <span style={{ fontSize: 28 }}>👈</span>
                    <p style={{ color: "#9080b8", fontSize: 13, marginTop: 8 }}>
                      Sélectionnez une réponse
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════
   MAIN COMPONENT: EnquetePage  (admin)
══════════════════════════════════════════════════════════ */
export default function EnquetePage() {
  const [enquetes, setEnquetes] = useState([]);
  const [loading, setLoading] = useState(true);

  /* builder state */
  const [builderOpen, setBuilderOpen] = useState(false);
  const [editing, setEditing]         = useState(null);   // existing enquête or null=new
  const [form, setForm]               = useState(blankEnquete());
  const [saving, setSaving]           = useState(false);
  const [toast, setToast]             = useState(null);

  /* responses panel */
  const [viewResp, setViewResp]       = useState(null);

  /* confirm delete */
  const [confirmDel, setConfirmDel]   = useState(null);

  /* ── load list ── */
  useEffect(() => {
    loadList();
  }, []);

  const loadList = () => {
    setLoading(true);
    API.get("/enquetes")
      .then((r) => setEnquetes(r.data || []))
      .catch(() => setEnquetes([]))
      .finally(() => setLoading(false));
  };

  /* ── toast helper ── */
  const showToast = (msg, type = "success") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  /* ── open builder ── */
  const openNew = () => {
    setEditing(null);
    setForm(blankEnquete());
    setBuilderOpen(true);
  };

  const openEdit = (e) => {
    setEditing(e);
    setForm({
      titre:       e.titre || "",
      description: e.description || "",
      couleur:     e.couleur || "#7c5cbf",
      questions:   e.questions?.length ? e.questions : [blankQuestion()],
    });
    setBuilderOpen(true);
  };

  /* ── question helpers ── */
  const addQuestion = () =>
    setForm((f) => ({ ...f, questions: [...f.questions, blankQuestion()] }));

  const updateQuestion = (updated) =>
    setForm((f) => ({
      ...f,
      questions: f.questions.map((q) => (q.id === updated.id ? updated : q)),
    }));

  const deleteQuestion = (id) =>
    setForm((f) => ({
      ...f,
      questions: f.questions.filter((q) => q.id !== id),
    }));

  const moveQuestion = (idx, dir) =>
    setForm((f) => {
      const qs = [...f.questions];
      const target = idx + dir;
      if (target < 0 || target >= qs.length) return f;
      [qs[idx], qs[target]] = [qs[target], qs[idx]];
      return { ...f, questions: qs };
    });

  /* ── save ── */
  const handleSave = async () => {
    if (!form.titre.trim()) {
      showToast("Veuillez saisir un titre", "error");
      return;
    }
    if (form.questions.some((q) => !q.label.trim())) {
      showToast("Toutes les questions doivent avoir un libellé", "error");
      return;
    }
    setSaving(true);
    try {
      if (editing) {
        await API.put(`/enquetes/${editing._id}`, form);
        showToast("Enquête mise à jour ✓");
      } else {
        await API.post("/enquetes", form);
        showToast("Enquête créée ✓");
      }
      setBuilderOpen(false);
      loadList();
    } catch {
      showToast("Erreur lors de la sauvegarde", "error");
    } finally {
      setSaving(false);
    }
  };

  /* ── toggle publish ── */
  const togglePublish = async (e) => {
    try {
      await API.put(`/enquetes/${e._id}/publish`);
      showToast(e.published ? "Enquête dépubliée" : "Enquête publiée ✓");
      loadList();
    } catch {
      showToast("Erreur", "error");
    }
  };

  /* ── delete ── */
  const handleDelete = async () => {
    if (!confirmDel) return;
    try {
      await API.delete(`/enquetes/${confirmDel._id}`);
      showToast("Enquête supprimée");
      setConfirmDel(null);
      loadList();
    } catch {
      showToast("Erreur lors de la suppression", "error");
    }
  };

  /* ══════════════════════════════════════════════════════
     RENDER
  ══════════════════════════════════════════════════════ */
  return (
    <div style={S.page}>

      {/* ── Toast ── */}
      {toast && (
        <div style={{ ...S.toast, background: toast.type === "error" ? "#dc2626" : "#16a34a" }}>
          {toast.msg}
        </div>
      )}

      {/* ── Header bar ── */}
      <div style={S.topRow}>
        <div>
          <h2 style={S.pageTitle}>📋 Gestion des Enquêtes</h2>
          <p style={S.pageSubtitle}>
            Créez et publiez des enquêtes pour les jeunes
          </p>
        </div>
        <button style={S.primaryBtn} onClick={openNew}>
          + Nouvelle enquête
        </button>
      </div>

      {/* ── List ── */}
      {loading ? (
        <div style={S.loadingBox}>
          <div style={S.spinner} />
          <p style={{ color: "#9080b8", fontSize: 13, marginTop: 12 }}>Chargement…</p>
        </div>
      ) : enquetes.length === 0 ? (
        <div style={S.emptyState}>
          <span style={{ fontSize: 54 }}>📋</span>
          <p style={{ color: "#fff", fontSize: 20, fontWeight: 700, margin: "16px 0 8px" }}>
            Aucune enquête pour l'instant
          </p>
          <p style={{ color: "rgba(255,255,255,.7)", fontSize: 14 }}>
            Créez votre première enquête pour recueillir l'avis des jeunes
          </p>
          <button style={{ ...S.primaryBtn, marginTop: 20 }} onClick={openNew}>
            + Créer maintenant
          </button>
        </div>
      ) : (
        <div style={S.grid}>
          {enquetes.map((e) => (
            <div key={e._id} style={S.enqCard}>
              {/* color bar */}
              <div
                style={{
                  height: 5,
                  borderRadius: "18px 18px 0 0",
                  background: e.couleur || "#7c5cbf",
                  margin: "-1px -1px 0",
                }}
              />
              <div style={{ padding: "18px 20px 16px" }}>
                {/* badge */}
                <div style={{ display: "flex", gap: 8, marginBottom: 10 }}>
                  <span
                    style={{
                      ...S.badge,
                      background: e.published ? "#dcfce7" : "#f5f3ff",
                      color: e.published ? "#16a34a" : "#7c5cbf",
                    }}
                  >
                    {e.published ? "● Publiée" : "○ Brouillon"}
                  </span>
                  <span style={{ ...S.badge, background: "#f0f4ff", color: "#5a3fa0" }}>
                    {e.questions?.length || 0} question{e.questions?.length !== 1 ? "s" : ""}
                  </span>
                </div>

                <h3 style={S.enqTitle}>{e.titre}</h3>
                {e.description && (
                  <p style={S.enqDesc}>{e.description}</p>
                )}

                <p style={S.enqMeta}>
                  {e.reponses_count || 0} réponse{e.reponses_count !== 1 ? "s" : ""} ·{" "}
                  {e.created_at ? new Date(e.created_at).toLocaleDateString("fr-FR") : ""}
                </p>

                {/* actions */}
                <div style={S.cardActions}>
                  <button
                    style={S.iconBtn}
                    onClick={() => openEdit(e)}
                    title="Modifier"
                  >
                    ✏️ Modifier
                  </button>
                  <button
                    style={S.iconBtn}
                    onClick={() => setViewResp(e)}
                    title="Voir les réponses"
                  >
                    📊 Réponses
                  </button>
                  <button
                    style={{
                      ...S.iconBtn,
                      background: e.published ? "#fef2f2" : "#f0fdf4",
                      color: e.published ? "#dc2626" : "#16a34a",
                      borderColor: e.published ? "#fecaca" : "#bbf7d0",
                    }}
                    onClick={() => togglePublish(e)}
                  >
                    {e.published ? "⛔ Dépublier" : "✅ Publier"}
                  </button>
                  <button
                    style={{ ...S.iconBtn, color: "#dc2626", borderColor: "#fecaca", background: "#fef2f2" }}
                    onClick={() => setConfirmDel(e)}
                    title="Supprimer"
                  >
                    🗑️
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ══ BUILDER MODAL ══ */}
      {builderOpen && (
        <div style={S.overlay}>
          <div style={{ ...S.modal, maxWidth: 740 }}>
            {/* head */}
            <div style={S.mHead}>
              <p style={S.mTitle}>
                {editing ? "✏️ Modifier l'enquête" : "📋 Nouvelle enquête"}
              </p>
              <button style={S.mClose} onClick={() => setBuilderOpen(false)}>✕</button>
            </div>

            <div style={{ padding: "0 28px", overflowY: "auto", maxHeight: "calc(88vh - 140px)" }}>

              {/* meta fields */}
              <div style={S.fGroup}>
                <label style={S.fLabel}>Titre *</label>
                <input
                  style={S.fInput}
                  placeholder="Ex: Satisfaction des activités culturelles"
                  value={form.titre}
                  onChange={(e) => setForm((f) => ({ ...f, titre: e.target.value }))}
                />
              </div>

              <div style={S.fGroup}>
                <label style={S.fLabel}>Description</label>
                <textarea
                  style={{ ...S.fInput, minHeight: 72, resize: "vertical", lineHeight: 1.6 }}
                  placeholder="Expliquez l'objectif de cette enquête…"
                  value={form.description}
                  onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                />
              </div>

              <div style={{ ...S.fGroup, display: "flex", alignItems: "center", gap: 16 }}>
                <label style={{ ...S.fLabel, margin: 0 }}>Couleur</label>
                <input
                  type="color"
                  value={form.couleur}
                  onChange={(e) => setForm((f) => ({ ...f, couleur: e.target.value }))}
                  style={{ width: 46, height: 36, border: "none", borderRadius: 8, cursor: "pointer" }}
                />
                <span style={{ fontSize: 12, color: "#9080b8" }}>Identifie visuellement l'enquête</span>
              </div>

              <div style={S.divider} />

              {/* questions */}
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
                <p style={{ fontWeight: 700, color: "#2d2555", fontSize: 14 }}>
                  Questions ({form.questions.length})
                </p>
                <button style={S.addQBtn} onClick={addQuestion}>
                  + Ajouter une question
                </button>
              </div>

              {form.questions.map((q, idx) => (
                <QuestionEditor
                  key={q.id}
                  q={q}
                  idx={idx}
                  total={form.questions.length}
                  onChange={updateQuestion}
                  onDelete={deleteQuestion}
                  onMove={moveQuestion}
                />
              ))}

              <div style={{ height: 24 }} />
            </div>

            {/* footer */}
            <div style={S.mFoot}>
              <button style={S.cancelBtn} onClick={() => setBuilderOpen(false)}>
                Annuler
              </button>
              <button style={S.saveBtn} onClick={handleSave} disabled={saving}>
                {saving ? "Enregistrement…" : editing ? "💾 Mettre à jour" : "💾 Créer l'enquête"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ══ CONFIRM DELETE MODAL ══ */}
      {confirmDel && (
        <div style={S.overlay}>
          <div style={{ ...S.modal, maxWidth: 420 }}>
            <div style={S.mHead}>
              <p style={S.mTitle}>🗑️ Supprimer l'enquête ?</p>
              <button style={S.mClose} onClick={() => setConfirmDel(null)}>✕</button>
            </div>
            <div style={{ padding: "12px 28px 24px" }}>
              <p style={{ color: "#555", fontSize: 14 }}>
                Vous allez supprimer <strong>{confirmDel.titre}</strong> et toutes ses réponses.
                Cette action est irréversible.
              </p>
              <div style={{ display: "flex", gap: 10, justifyContent: "flex-end", marginTop: 20 }}>
                <button style={S.cancelBtn} onClick={() => setConfirmDel(null)}>
                  Annuler
                </button>
                <button
                  style={{ ...S.saveBtn, background: "linear-gradient(135deg,#dc2626,#b91c1c)" }}
                  onClick={handleDelete}
                >
                  Supprimer définitivement
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ══ RESPONSES PANEL ══ */}
      {viewResp && (
        <ResponsesPanel enquete={viewResp} onClose={() => setViewResp(null)} />
      )}
    </div>
  );
}

/* ══════════════════════════════════════════════════════════
   STYLES  (matches AdminDashboard palette)
══════════════════════════════════════════════════════════ */
const S = {
  page: { padding: "0 0 80px", fontFamily: "'Poppins', sans-serif" },

  topRow: { display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 28, flexWrap: "wrap", gap: 12 },
  pageTitle: { fontSize: 22, fontWeight: 800, color: "#fff", margin: 0 },
  pageSubtitle: { fontSize: 13, color: "rgba(255,255,255,.65)", margin: "4px 0 0" },

  primaryBtn: {
    padding: "12px 26px", background: "linear-gradient(135deg,#6a4dab,#5a3fa0)",
    color: "#fff", border: "none", borderRadius: 12, fontSize: 14, fontWeight: 700,
    cursor: "pointer", fontFamily: "'Poppins',sans-serif", boxShadow: "0 4px 18px rgba(90,63,160,.35)",
  },

  grid: { display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(310px,1fr))", gap: 20 },

  enqCard: {
    background: "rgba(255,255,255,.93)", backdropFilter: "blur(10px)",
    borderRadius: 18, border: "1px solid rgba(255,255,255,.5)",
    boxShadow: "0 4px 24px rgba(100,70,180,.1)", overflow: "hidden",
    transition: "transform .2s ease, box-shadow .2s ease",
  },

  badge: {
    display: "inline-block", padding: "3px 10px", borderRadius: 8,
    fontSize: 11, fontWeight: 700,
  },

  enqTitle: { fontSize: 16, fontWeight: 700, color: "#2d2555", margin: "0 0 6px" },
  enqDesc:  { fontSize: 12.5, color: "#666", margin: "0 0 8px", lineHeight: 1.5 },
  enqMeta:  { fontSize: 11.5, color: "#9080b8", margin: "0 0 14px" },

  cardActions: { display: "flex", gap: 8, flexWrap: "wrap" },
  iconBtn: {
    padding: "6px 12px", borderRadius: 9, border: "1.5px solid #e0dce8",
    background: "#faf8ff", color: "#5a3fa0", fontSize: 11.5, fontWeight: 600,
    cursor: "pointer", fontFamily: "'Poppins',sans-serif",
  },

  /* builder */
  qCard: {
    background: "#faf8ff", borderRadius: 14, border: "1.5px solid #e8e5f0",
    padding: "16px 18px", marginBottom: 14,
  },
  qHeader: { display: "flex", alignItems: "center", gap: 10, marginBottom: 10, flexWrap: "wrap" },
  qNum:    { fontSize: 12, fontWeight: 800, color: "#7c5cbf", background: "#f0ebff", padding: "3px 9px", borderRadius: 7, flexShrink: 0 },
  qTypeRow:{ display: "flex", alignItems: "center", gap: 10, flex: 1, flexWrap: "wrap" },
  qTypeSelect: {
    padding: "6px 12px", border: "1.5px solid #e0dce8", borderRadius: 9,
    fontSize: 12, fontFamily: "'Poppins',sans-serif", color: "#444", background: "#fff", cursor: "pointer",
  },
  reqToggle: { display: "flex", alignItems: "center", gap: 5, cursor: "pointer" },
  qActions:  { display: "flex", gap: 5, marginLeft: "auto" },
  qActBtn: {
    width: 28, height: 28, border: "1.5px solid #e0dce8", background: "#fff",
    borderRadius: 7, cursor: "pointer", fontSize: 11, display: "flex",
    alignItems: "center", justifyContent: "center", color: "#666",
  },
  qInput: {
    width: "100%", padding: "10px 14px", border: "1.5px solid #e8e5f0",
    borderRadius: 10, fontSize: 13, fontFamily: "'Poppins',sans-serif",
    color: "#333", outline: "none", boxSizing: "border-box", marginTop: 6,
    background: "#fff",
  },
  optRow: { display: "flex", alignItems: "center", gap: 8, marginTop: 6 },
  optBullet: { fontSize: 16, color: "#9080b8", flexShrink: 0, width: 20, textAlign: "center" },
  addOptBtn: {
    marginTop: 10, padding: "7px 16px", border: "1.5px dashed #c4b8e8",
    borderRadius: 9, background: "transparent", color: "#7c5cbf", fontSize: 12,
    fontWeight: 700, cursor: "pointer", fontFamily: "'Poppins',sans-serif",
  },
  ratingStar: { fontSize: 22, color: "#d1c4e9" },

  addQBtn: {
    padding: "7px 18px", background: "linear-gradient(135deg,#7c5cbf,#6a4dab)",
    color: "#fff", border: "none", borderRadius: 10, fontSize: 12, fontWeight: 700,
    cursor: "pointer", fontFamily: "'Poppins',sans-serif",
  },

  /* form fields */
  fGroup: { marginBottom: 18 },
  fLabel: { display: "block", fontSize: 11, fontWeight: 700, color: "#9080b8", marginBottom: 6, textTransform: "uppercase", letterSpacing: .5 },
  fInput: {
    width: "100%", padding: "11px 14px", border: "2px solid #e8e5f0",
    borderRadius: 10, fontSize: 13, fontFamily: "'Poppins',sans-serif",
    color: "#333", outline: "none", boxSizing: "border-box",
  },
  divider: { height: 1, background: "#e8e5f0", margin: "18px 0" },

  /* modals */
  overlay: {
    position: "fixed", inset: 0, background: "rgba(0,0,0,.45)",
    backdropFilter: "blur(8px)", zIndex: 1200, display: "flex",
    alignItems: "center", justifyContent: "center", padding: 16,
  },
  modal: {
    background: "#fff", borderRadius: 22, width: "95%", maxHeight: "90vh",
    overflowY: "auto", boxShadow: "0 24px 70px rgba(0,0,0,.22)",
    fontFamily: "'Poppins',sans-serif",
  },
  mHead: {
    display: "flex", alignItems: "center", justifyContent: "space-between",
    padding: "22px 28px 16px", position: "sticky", top: 0, background: "#fff",
    zIndex: 2, borderBottom: "1px solid #f0eef5",
  },
  mTitle: { fontSize: 17, fontWeight: 700, color: "#2d2555", margin: 0 },
  mClose: {
    width: 34, height: 34, borderRadius: 10, border: "none",
    background: "#f5f3ff", color: "#666", cursor: "pointer", fontSize: 16,
    display: "flex", alignItems: "center", justifyContent: "center",
  },
  mFoot: {
    display: "flex", gap: 10, justifyContent: "flex-end", padding: "16px 28px 22px",
    position: "sticky", bottom: 0, background: "#fff", borderTop: "1px solid #f0eef5",
  },
  cancelBtn: {
    padding: "10px 22px", border: "1.5px solid #e0dce8", borderRadius: 12,
    background: "#fff", color: "#666", fontSize: 13, fontWeight: 600,
    cursor: "pointer", fontFamily: "'Poppins',sans-serif",
  },
  saveBtn: {
    padding: "10px 26px", border: "none", borderRadius: 12,
    background: "linear-gradient(135deg,#6a4dab,#5a3fa0)", color: "#fff",
    fontSize: 13, fontWeight: 700, cursor: "pointer", fontFamily: "'Poppins',sans-serif",
    boxShadow: "0 4px 18px rgba(90,63,160,.3)",
  },

  /* responses panel */
  secLabel: { fontSize: 11, fontWeight: 700, color: "#9080b8", textTransform: "uppercase", letterSpacing: .5, margin: "0 0 8px" },
  respBtn: {
    display: "flex", flexDirection: "column", gap: 2, width: "100%",
    padding: "10px 12px", borderRadius: 10, border: "1.5px solid #e8e5f0",
    background: "transparent", cursor: "pointer", textAlign: "left",
    marginBottom: 6, fontFamily: "'Poppins',sans-serif",
  },
  respDetail: { background: "#faf8ff", borderRadius: 10, padding: "12px 14px", marginBottom: 10 },

  /* misc */
  toast: {
    position: "fixed", top: 22, right: 22, padding: "12px 22px",
    borderRadius: 12, color: "#fff", fontSize: 13, fontWeight: 700,
    zIndex: 9999, boxShadow: "0 6px 24px rgba(0,0,0,.2)",
  },
  loadingBox: {
    display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
    minHeight: 220, gap: 12,
  },
  spinner: {
    width: 36, height: 36, border: "3px solid #e8e5f0",
    borderTopColor: "#7c5cbf", borderRadius: "50%",
    animation: "spin 0.8s linear infinite",
  },
  emptyBox: { display: "flex", flexDirection: "column", alignItems: "center", padding: "40px 0", textAlign: "center" },
  emptyState: {
    display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
    minHeight: "55vh", textAlign: "center",
  },
};