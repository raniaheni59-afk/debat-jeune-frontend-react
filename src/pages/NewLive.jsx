import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import API from "../services/api";

const THEMATIQUES = [
  "Sciences & Innovation", "Environnement & Développement Durable",
  "Technologie & Numérique", "Santé & Bien-être",
  "Éducation & Formation", "Citoyenneté & Société", "Autre",
];

const THEMATIQUE_ICONS = {
  "Sciences & Innovation": "🔬",
  "Environnement & Développement Durable": "🌿",
  "Technologie & Numérique": "💻",
  "Santé & Bien-être": "💊",
  "Éducation & Formation": "📚",
  "Citoyenneté & Société": "🏛️",
  "Autre": "✨",
};

// ── Custom Date Picker ────────────────────────────────────────────
function CustomDatePicker({ value, onChange, error }) {
  const [open, setOpen] = useState(false);
  const [view, setView] = useState("days"); // days | months | years
  const ref = useRef(null);

  const today = new Date();
  const selected = value ? new Date(value + "T00:00:00") : null;

  const [cursor, setCursor] = useState(() => {
    const d = value ? new Date(value + "T00:00:00") : new Date();
    return { year: d.getFullYear(), month: d.getMonth() };
  });

  useEffect(() => {
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const MONTHS = ["Janvier","Février","Mars","Avril","Mai","Juin","Juillet","Août","Septembre","Octobre","Novembre","Décembre"];
  const DAYS   = ["Lu","Ma","Me","Je","Ve","Sa","Di"];

  const getDaysInMonth = (y, m) => new Date(y, m + 1, 0).getDate();
  const getFirstDay    = (y, m) => { const d = new Date(y, m, 1).getDay(); return d === 0 ? 6 : d - 1; };

  const prevMonth = () => setCursor(c => c.month === 0 ? { year: c.year - 1, month: 11 } : { ...c, month: c.month - 1 });
  const nextMonth = () => setCursor(c => c.month === 11 ? { year: c.year + 1, month: 0 } : { ...c, month: c.month + 1 });

  const selectDay = (day) => {
    const y = cursor.year, m = String(cursor.month + 1).padStart(2, "0"), d = String(day).padStart(2, "0");
    onChange(`${y}-${m}-${d}`);
    setOpen(false);
  };

  const isPast = (day) => {
    const d = new Date(cursor.year, cursor.month, day);
    d.setHours(0,0,0,0);
    const t = new Date(); t.setHours(0,0,0,0);
    return d < t;
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
    ? selected.toLocaleDateString("fr-FR", { weekday:"short", day:"numeric", month:"short", year:"numeric" })
    : "Sélectionner une date";

  const firstDay = getFirstDay(cursor.year, cursor.month);
  const daysInMonth = getDaysInMonth(cursor.year, cursor.month);
  const cells = [];
  for (let i = 0; i < firstDay; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);

  // Years range
  const yearStart = Math.floor(cursor.year / 10) * 10;
  const years = Array.from({ length: 12 }, (_, i) => yearStart + i);

  // ✅ parse dd/mm/yyyy typed manually
  return (
    <div ref={ref} style={{ position: "relative" }}>
      {/* ✅ Bouton trigger unique */}
      <button type="button" onClick={() => setOpen(o => !o)} style={{
        width: "100%", display: "flex", alignItems: "center", gap: 10,
        padding: "12px 16px", borderRadius: 12,
        background: "rgba(255,255,255,.06)",
        border: `1px solid ${error ? "#ef4444" : open ? "rgba(124,106,191,.8)" : "rgba(255,255,255,.12)"}`,
        color: selected ? "#fff" : "rgba(255,255,255,.45)",
        fontSize: 14, cursor: "pointer", textAlign: "left",
        boxShadow: open ? "0 0 0 3px rgba(124,106,191,.2)" : error ? "0 0 0 3px rgba(239,68,68,.15)" : "none",
        transition: "all .2s", fontFamily: "inherit",
      }}>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={selected ? "#c4b5fd" : "rgba(255,255,255,.4)"} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/>
        </svg>
        <span style={{ flex: 1 }}>
          {selected
            ? selected.toLocaleDateString("fr-FR", { weekday:"short", day:"numeric", month:"long", year:"numeric" })
            : "Sélectionner une date"}
        </span>
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,.35)" strokeWidth="2" strokeLinecap="round"
          style={{ transform: open ? "rotate(180deg)" : "none", transition: "transform .2s" }}>
          <path d="m6 9 6 6 6-6"/>
        </svg>
      </button>

      {/* Dropdown calendar */}
      {open && (
        <div style={{
          position: "absolute", top: "calc(100% + 8px)", left: 0, right: 0, zIndex: 999,
          background: "linear-gradient(160deg,#1a1040 0%,#2a1a5e 50%,#3d2f7a 100%)",
          border: "1px solid rgba(124,106,191,.3)",
          borderRadius: 20, padding: 16,
          boxShadow: "0 24px 64px rgba(0,0,0,.6), inset 0 1px 0 rgba(255,255,255,.08)",
          animation: "fadeUp .2s cubic-bezier(.16,1,.3,1)",
          backdropFilter: "blur(12px)",
        }}>
          {/* Header */}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
            <button type="button" onClick={prevMonth} style={NAV_BTN}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="m15 18-6-6 6-6"/></svg>
            </button>
            <button type="button" onClick={() => setView(v => v === "days" ? "months" : "days")}
              style={{ background: "rgba(124,106,191,.15)", border: "1px solid rgba(124,106,191,.25)", borderRadius: 8, padding: "5px 12px", color: "#c4b5fd", fontSize: 13, fontWeight: 700, cursor: "pointer" }}>
              {MONTHS[cursor.month]} {cursor.year}
            </button>
            <button type="button" onClick={nextMonth} style={NAV_BTN}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="m9 18 6-6-6-6"/></svg>
            </button>
          </div>

          {view === "days" && (
            <>
              {/* Day names */}
              <div style={{ display: "grid", gridTemplateColumns: "repeat(7,1fr)", gap: 2, marginBottom: 6 }}>
                {DAYS.map(d => (
                  <div key={d} style={{ textAlign: "center", fontSize: 10, fontWeight: 700, color: "rgba(196,181,253,.5)", padding: "4px 0" }}>{d}</div>
                ))}
              </div>
              {/* Days grid */}
              <div style={{ display: "grid", gridTemplateColumns: "repeat(7,1fr)", gap: 2 }}>
                {cells.map((day, i) => day === null ? (
                  <div key={`e${i}`} />
                ) : (
                  <button key={day} type="button" onClick={() => !isPast(day) && selectDay(day)}
                    disabled={isPast(day)}
                    style={{
                      width: "100%", aspectRatio: "1", borderRadius: 8, border: "none",
                      background: isSelected(day)
                        ? "linear-gradient(135deg,#7c6abf,#9c8fd4)"
                        : isToday(day)
                        ? "rgba(124,106,191,.2)"
                        : "transparent",
                      color: isSelected(day) ? "#fff" : isPast(day) ? "rgba(255,255,255,.2)" : isToday(day) ? "#c4b5fd" : "rgba(255,255,255,.85)",
                      fontSize: 13, fontWeight: isSelected(day) || isToday(day) ? 700 : 400,
                      cursor: isPast(day) ? "not-allowed" : "pointer",
                      transition: "all .15s",
                      outline: isToday(day) && !isSelected(day) ? "1px solid rgba(124,106,191,.5)" : "none",
                    }}
                    onMouseEnter={e => { if (!isPast(day) && !isSelected(day)) e.currentTarget.style.background = "rgba(124,106,191,.25)"; }}
                    onMouseLeave={e => { if (!isSelected(day)) e.currentTarget.style.background = isToday(day) ? "rgba(124,106,191,.2)" : "transparent"; }}
                  >{day}</button>
                ))}
              </div>
            </>
          )}

          {view === "months" && (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 6 }}>
              {MONTHS.map((m, i) => (
                <button key={m} type="button" onClick={() => { setCursor(c => ({ ...c, month: i })); setView("days"); }}
                  style={{
                    padding: "8px 4px", borderRadius: 8, border: "none", cursor: "pointer",
                    background: cursor.month === i ? "linear-gradient(135deg,#7c6abf,#9c8fd4)" : "rgba(255,255,255,.05)",
                    color: cursor.month === i ? "#fff" : "rgba(255,255,255,.75)",
                    fontSize: 12, fontWeight: cursor.month === i ? 700 : 400,
                    transition: "all .15s",
                  }}>
                  {m.slice(0, 3)}
                </button>
              ))}
            </div>
          )}

          {/* Quick: today / tomorrow */}
          <div style={{ display: "flex", gap: 6, marginTop: 10, borderTop: "1px solid rgba(255,255,255,.07)", paddingTop: 10 }}>
            {[["Aujourd'hui", 0], ["Demain", 1], ["Dans 7j", 7]].map(([label, days]) => {
              const d = new Date(); d.setDate(d.getDate() + days);
              const val = `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`;
              return (
                <button key={label} type="button" onClick={() => { onChange(val); setCursor({ year: d.getFullYear(), month: d.getMonth() }); setOpen(false); }}
                  style={{ flex: 1, padding: "6px 4px", borderRadius: 8, border: "1px solid rgba(124,106,191,.25)", background: "rgba(124,106,191,.1)", color: "#c4b5fd", fontSize: 11, fontWeight: 600, cursor: "pointer" }}>
                  {label}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

const NAV_BTN = {
  background: "rgba(255,255,255,.06)", border: "1px solid rgba(255,255,255,.1)",
  borderRadius: 8, padding: "6px 8px", color: "rgba(255,255,255,.7)",
  cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center",
};

// ── Custom Thematique Select ──────────────────────────────────────
function ThematiqueSelect({ value, onChange, error }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  return (
    <div ref={ref} style={{ position: "relative" }}>
      <button type="button" onClick={() => setOpen(o => !o)} style={{
        width: "100%", display: "flex", alignItems: "center", gap: 10,
        padding: "12px 16px", borderRadius: 12,
        background: "rgba(255,255,255,.06)",
        border: `1px solid ${error ? "#ef4444" : open ? "rgba(124,106,191,.8)" : "rgba(255,255,255,.12)"}`,
        color: value ? "#fff" : "rgba(255,255,255,.45)",
        fontSize: 14, cursor: "pointer", textAlign: "left",
        boxShadow: open ? "0 0 0 3px rgba(124,106,191,.2)" : error ? "0 0 0 3px rgba(239,68,68,.15)" : "none",
        transition: "all .2s", fontFamily: "inherit",
      }}>
        <span style={{ fontSize: 16 }}>{value ? THEMATIQUE_ICONS[value] : "🎯"}</span>
        <span style={{ flex: 1 }}>{value || "-- Sélectionnez --"}</span>
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,.3)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ transform: open ? "rotate(180deg)" : "none", transition: "transform .2s" }}>
          <path d="m6 9 6 6 6-6"/>
        </svg>
      </button>

      {open && (
        <div style={{
          position: "absolute", top: "calc(100% + 8px)", left: 0, right: 0, zIndex: 999,
          background: "linear-gradient(135deg,#1e1540,#2a1a5e)",
          border: "1px solid rgba(124,106,191,.35)",
          borderRadius: 14, overflow: "hidden",
          boxShadow: "0 20px 60px rgba(0,0,0,.6)",
          animation: "fadeUp .2s ease",
        }}>
          {THEMATIQUES.map((t, i) => (
            <button key={t} type="button" onClick={() => { onChange(t); setOpen(false); }}
              style={{
                width: "100%", display: "flex", alignItems: "center", gap: 10,
                padding: "11px 16px", border: "none",
                background: value === t ? "rgba(124,106,191,.25)" : "transparent",
                color: value === t ? "#fff" : "rgba(255,255,255,.8)",
                fontSize: 13, fontWeight: value === t ? 700 : 400,
                cursor: "pointer", textAlign: "left",
                borderBottom: i < THEMATIQUES.length - 1 ? "1px solid rgba(255,255,255,.05)" : "none",
                transition: "background .15s",
              }}
              onMouseEnter={e => { if (value !== t) e.currentTarget.style.background = "rgba(124,106,191,.15)"; }}
              onMouseLeave={e => { if (value !== t) e.currentTarget.style.background = "transparent"; }}
            >
              <span style={{ fontSize: 15 }}>{THEMATIQUE_ICONS[t]}</span>
              <span style={{ flex: 1 }}>{t}</span>
              {value === t && (
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#c4b5fd" strokeWidth="2.5" strokeLinecap="round"><path d="M20 6 9 17l-5-5"/></svg>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Custom Time Picker ────────────────────────────────────────────
function CustomTimePicker({ value, onChange, error }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  const [h, setH] = useState(value ? value.split(":")[0] : "");
  const [m, setM] = useState(value ? value.split(":")[1] : "");

  useEffect(() => {
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const apply = (hh, mm) => {
    if (hh !== "" && mm !== "") onChange(`${String(hh).padStart(2,"0")}:${String(mm).padStart(2,"0")}`);
  };

  const hours   = Array.from({ length: 24 }, (_, i) => i);
  const minutes = [0, 15, 30, 45];

  const handleManualTime = (e) => {
    const raw = e.target.value.trim();
    const match = raw.match(/^(\d{1,2})[:\h](\d{2})$/);
    if (match) {
      const hh = String(parseInt(match[1])).padStart(2,"0");
      const mm = String(parseInt(match[2])).padStart(2,"0");
      if (parseInt(hh) < 24 && parseInt(mm) < 60) {
        setH(hh); setM(mm); onChange(`${hh}:${mm}`);
      }
    } else if (raw === "") { onChange(""); }
  };

  return (
    <div ref={ref} style={{ position: "relative" }}>
      <div style={{ display: "flex", alignItems: "center",
        background: "rgba(255,255,255,.06)",
        border: `1px solid ${error ? "#ef4444" : open ? "rgba(124,106,191,.8)" : "rgba(255,255,255,.12)"}`,
        borderRadius: 12,
        boxShadow: open ? "0 0 0 3px rgba(124,106,191,.2)" : error ? "0 0 0 3px rgba(239,68,68,.15)" : "none",
        transition: "all .2s",
      }}>
        <input
          type="text"
          placeholder="hh:mm"
          defaultValue={value || ""}
          key={value}
          onBlur={handleManualTime}
          onKeyDown={e => { if (e.key === "Enter") { e.preventDefault(); handleManualTime({ target: e.currentTarget }); } }}
          style={{
            flex: 1, background: "transparent", border: "none", outline: "none",
            color: value ? "#fff" : "rgba(255,255,255,.45)", fontSize: 14,
            padding: "12px 16px", fontFamily: "inherit", minWidth: 0,
          }}
        />
        <button type="button" onClick={() => setOpen(o => !o)} style={{
          background: "transparent", border: "none", cursor: "pointer",
          padding: "12px 14px", display: "flex", alignItems: "center",
          color: open ? "#c4b5fd" : "rgba(255,255,255,.4)",
        }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/>
          </svg>
        </button>
      </div>

      {open && (
        <div style={{
          position: "absolute", top: "calc(100% + 8px)", left: 0, right: 0, zIndex: 999,
          background: "linear-gradient(135deg,#1e1540,#2a1a5e)",
          border: "1px solid rgba(124,106,191,.35)",
          borderRadius: 14, padding: 14,
          boxShadow: "0 20px 60px rgba(0,0,0,.6)",
          animation: "fadeUp .2s ease",
        }}>
          <div style={{ display: "flex", gap: 10 }}>
            {/* Hours */}
            <div style={{ flex: 1 }}>
              <p style={{ color: "rgba(196,181,253,.6)", fontSize: 10, fontWeight: 700, letterSpacing: 1, textTransform: "uppercase", marginBottom: 6 }}>Heure</p>
              <div style={{ maxHeight: 160, overflowY: "auto", display: "flex", flexDirection: "column", gap: 2 }}>
                {hours.map(hv => (
                  <button key={hv} type="button" onClick={() => { setH(hv); apply(hv, m); }}
                    style={{
                      padding: "6px 10px", borderRadius: 7, border: "none", cursor: "pointer",
                      background: String(hv).padStart(2,"0") === String(h).padStart(2,"0") ? "linear-gradient(135deg,#7c6abf,#9c8fd4)" : "rgba(255,255,255,.04)",
                      color: String(hv).padStart(2,"0") === String(h).padStart(2,"0") ? "#fff" : "rgba(255,255,255,.75)",
                      fontSize: 13, fontWeight: 600, textAlign: "center", transition: "all .1s",
                    }}>
                    {String(hv).padStart(2, "0")}
                  </button>
                ))}
              </div>
            </div>
            {/* Minutes */}
            <div style={{ flex: 1 }}>
              <p style={{ color: "rgba(196,181,253,.6)", fontSize: 10, fontWeight: 700, letterSpacing: 1, textTransform: "uppercase", marginBottom: 6 }}>Minute</p>
              <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
                {minutes.map(mv => (
                  <button key={mv} type="button" onClick={() => { setM(mv); apply(h, mv); if (h !== "") setOpen(false); }}
                    style={{
                      padding: "8px 10px", borderRadius: 7, border: "none", cursor: "pointer",
                      background: String(mv).padStart(2,"0") === String(m).padStart(2,"0") ? "linear-gradient(135deg,#7c6abf,#9c8fd4)" : "rgba(255,255,255,.04)",
                      color: String(mv).padStart(2,"0") === String(m).padStart(2,"0") ? "#fff" : "rgba(255,255,255,.75)",
                      fontSize: 13, fontWeight: 600, textAlign: "center", transition: "all .1s",
                    }}>
                    :{String(mv).padStart(2, "0")}
                  </button>
                ))}
              </div>
            </div>
          </div>
          {/* Quick times */}
          <div style={{ borderTop: "1px solid rgba(255,255,255,.07)", paddingTop: 10, marginTop: 10 }}>
            <p style={{ color: "rgba(196,181,253,.5)", fontSize: 10, fontWeight: 700, letterSpacing: 1, marginBottom: 6 }}>RAPIDE</p>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 5 }}>
              {["09:00","10:00","14:00","15:00","18:00","20:00"].map(t => (
                <button key={t} type="button" onClick={() => { onChange(t); setH(t.split(":")[0]); setM(t.split(":")[1]); setOpen(false); }}
                  style={{ padding: "5px 10px", borderRadius: 7, border: "1px solid rgba(124,106,191,.25)", background: value===t?"rgba(124,106,191,.3)":"rgba(124,106,191,.1)", color: "#c4b5fd", fontSize: 12, fontWeight: 600, cursor: "pointer" }}>
                  {t}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Main Component ────────────────────────────────────────────────
export default function NewLive({ onCancel }) {
  const navigate = useNavigate();
  const [form, setForm] = useState({ title: "", description: "", date: "", time: "", thematique: "" });
  const [errors, setErrors] = useState({});
  const [step, setStep] = useState("form");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);

  const [emailInput, setEmailInput] = useState("");
  const [emails, setEmails] = useState([]);
  const [emailError, setEmailError] = useState("");
  const [sending, setSending] = useState(false);
  const [sentCount, setSentCount] = useState(0);

  const set = (k, v) => { setForm(p => ({ ...p, [k]: v })); setErrors(p => ({ ...p, [k]: "" })); };

  const validate = () => {
    const e = {};
    if (!form.title.trim())       e.title = "Titre obligatoire";
    if (!form.description.trim()) e.description = "Description obligatoire";
    if (!form.date)               e.date = "Date obligatoire";
    else if (new Date(`${form.date}T${form.time || "00:00"}`) < new Date()) e.date = "Date future requise";
    if (!form.time)               e.time = "Heure obligatoire";
    if (!form.thematique)         e.thematique = "Thématique obligatoire";
    setErrors(e);
    return !Object.keys(e).length;
  };

  const isValidEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());

  const addEmail = () => {
    const val = emailInput.trim();
    if (!val) return;
    if (!isValidEmail(val)) { setEmailError("Adresse e-mail invalide"); return; }
    if (emails.includes(val)) { setEmailError("Déjà ajouté"); return; }
    setEmails(p => [...p, val]);
    setEmailInput("");
    setEmailError("");
  };

  const removeEmail = (email) => setEmails(p => p.filter(e => e !== email));

  const handleEmailKeyDown = (e) => {
    if (e.key === "Enter" || e.key === ",") { e.preventDefault(); addEmail(); }
  };

  const handleCreate = async () => {
    setLoading(true);
    try {
      const finalThematique = form.thematique === "Autre" && form.thematiqueAutre
        ? form.thematiqueAutre
        : form.thematique;

      const res = await API.post("/lives/session/create", {
        title: form.title, description: form.description,
        date: form.date, time: form.time,
        thematique: finalThematique, status: "En cours", category: "other",
      });

      if (!res.data?.success) throw new Error(res.data?.message || "Erreur");

      const { hostLink, viewerLink, roomCode, hostAccessToken } = res.data;
      localStorage.setItem("currentLiveViewerLink", viewerLink);
      setResult({ hostLink, viewerLink, roomCode });

      if (emails.length > 0) {
        setSending(true);
        try {
          const emailRes = await API.post("/lives/invite", {
            emails, viewerLink, title: form.title, date: form.date,
            time: form.time, thematique: form.thematique, description: form.description,
          });
          setSentCount(emailRes.data?.sent || emails.length);
        } catch {} finally { setSending(false); }
      }

      setStep("success");
      setTimeout(() => { navigate(`/meet/${roomCode}?at=${hostAccessToken}`); }, 2500);

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
        {sentCount > 0 && (
          <div style={W.successBadge}>
            <span>✉️</span>
            <span>{sentCount} invitation{sentCount > 1 ? "s" : ""} envoyée{sentCount > 1 ? "s" : ""}</span>
          </div>
        )}
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
            ["📌 Titre", form.title],
            ["📅 Date", fmtDate()],
            [`${THEMATIQUE_ICONS[form.thematique]} Thématique`, form.thematique],
          ].map(([k, v]) => (
            <div key={k} style={W.detailRow}>
              <span style={W.detailKey}>{k}</span>
              <span style={W.detailVal}>{v}</span>
            </div>
          ))}
          {emails.length > 0 && (
            <div style={W.detailRow}>
              <span style={W.detailKey}>✉️ Invités</span>
              <span style={W.detailVal}>{emails.length} personne{emails.length > 1 ? "s" : ""}</span>
            </div>
          )}
        </div>
        {emails.length > 0 && (
          <div style={W.invitePreview}>
            <p style={{ color: "rgba(255,255,255,.45)", fontSize: 11, marginBottom: 8, textTransform: "uppercase", letterSpacing: 1 }}>Invitations à envoyer</p>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
              {emails.map(e => <span key={e} style={W.emailTag}>{e}</span>)}
            </div>
          </div>
        )}
        <div style={{ display: "flex", gap: 12, justifyContent: "center", marginTop: 8 }}>
          <button onClick={() => setStep("form")} style={W.ghost} disabled={loading}>← Modifier</button>
          <button onClick={handleCreate} style={W.primary} disabled={loading || sending}>
            {loading || sending
              ? <><span style={W.spinnerInline} />{sending ? "Envoi des invitations…" : "Création…"}</>
              : "🚀 Démarrer maintenant"
            }
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
              <CustomDatePicker value={form.date} onChange={v => set("date", v)} error={errors.date} />
            </Field>
            <Field label="🕐 Heure" error={errors.time}>
              <CustomTimePicker value={form.time} onChange={v => set("time", v)} error={errors.time} />
            </Field>
          </div>

          <Field label="🎯 Thématique" error={errors.thematique}>
            <ThematiqueSelect value={form.thematique} onChange={v => set("thematique", v)} error={errors.thematique} />
            {form.thematique === "Autre" && (
              <input
                style={{ ...inp(errors.thematique), marginTop: 8 }}
                placeholder="Précisez la thématique…"
                value={form.thematiqueAutre || ""}
                onChange={e => setForm(p => ({ ...p, thematiqueAutre: e.target.value }))}
                autoFocus
              />
            )}
          </Field>

          {/* EMAIL INVITES */}
          <div style={W.inviteSection}>
            <div style={W.inviteHeader}>
              <div style={W.inviteIconWrap}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="4" width="20" height="16" rx="2"/><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/></svg>
              </div>
              <div>
                <p style={{ color: "rgba(255,255,255,.9)", fontSize: 13, fontWeight: 700, margin: 0 }}>Inviter par e-mail</p>
                <p style={{ color: "rgba(255,255,255,.4)", fontSize: 11, margin: "2px 0 0" }}>Optionnel — Le lien live sera envoyé automatiquement</p>
              </div>
            </div>
            <div style={W.emailInputRow}>
              <input style={{ ...inp(emailError), flex: 1 }} type="email" placeholder="exemple@email.com"
                value={emailInput} onChange={e => { setEmailInput(e.target.value); setEmailError(""); }}
                onKeyDown={handleEmailKeyDown} />
              <button type="button" onClick={addEmail} style={W.addEmailBtn} disabled={!emailInput.trim()}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
                Ajouter
              </button>
            </div>
            {emailError && <p style={{ color: "#f87171", fontSize: 12, marginTop: 4 }}>⚠ {emailError}</p>}
            {emails.length > 0 && (
              <div style={W.emailList}>
                {emails.map(email => (
                  <div key={email} style={W.emailPill}>
                    <span style={W.emailDot} />
                    <span style={{ fontSize: 12, color: "rgba(255,255,255,.85)", flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{email}</span>
                    <button type="button" onClick={() => removeEmail(email)} style={W.removePillBtn}>
                      <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M18 6 6 18M6 6l12 12"/></svg>
                    </button>
                  </div>
                ))}
                <div style={W.emailCount}>
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><circle cx="12" cy="12" r="10"/><path d="M12 8v4M12 16h.01"/></svg>
                  {emails.length} invitation{emails.length > 1 ? "s" : ""} sera{emails.length > 1 ? "ont" : ""} envoyée{emails.length > 1 ? "s" : ""}
                </div>
              </div>
            )}
          </div>

          <div style={W.actions}>
            <button type="button" onClick={() => onCancel ? onCancel() : navigate(-1)} style={W.ghost}>Annuler</button>
            <button onClick={() => validate() && setStep("confirm")} style={W.primary}>Créer le Live →</button>
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
  background: "rgba(255,255,255,.06)",
  border: `1px solid ${err ? "#ef4444" : "rgba(255,255,255,.12)"}`,
  borderRadius: 12, color: "#fff", fontSize: 14, padding: "12px 16px",
  outline: "none", width: "100%", fontFamily: "inherit",
  boxShadow: err ? "0 0 0 3px rgba(239,68,68,.15)" : "none",
  transition: "all .2s",
});

const ANIM = `
  @keyframes bounceIn { from{transform:scale(0)} to{transform:scale(1)} }
  @keyframes spin { to{transform:rotate(360deg)} }
  @keyframes fadeUp { from{opacity:0;transform:translateY(20px)} to{opacity:1;transform:translateY(0)} }
  @keyframes fadeIn { from{opacity:0;transform:translateY(6px)} to{opacity:1;transform:translateY(0)} }
  @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:.4} }
`;

const W = {
  page:      { minHeight: "100vh", background: "linear-gradient(135deg,#7c6abf 0%,#6a58a8 40%,#5a4a95 100%)", display: "flex", alignItems: "center", justifyContent: "center", padding: "40px 20px", fontFamily: "ui-sans-serif,system-ui,sans-serif" },
  card:      { background: "rgba(255,255,255,.12)", backdropFilter: "blur(20px)", WebkitBackdropFilter: "blur(20px)", border: "1px solid rgba(255,255,255,.25)", borderRadius: 24, width: "100%", maxWidth: 680, padding: "44px 40px", boxShadow: "0 25px 60px rgba(0,0,0,.2),inset 0 1px 0 rgba(255,255,255,.3)", animation: "fadeUp .4s ease", textAlign: "center" },
  badge:     { display: "inline-flex", alignItems: "center", gap: 8, background: "rgba(255,255,255,.15)", border: "1px solid rgba(255,255,255,.3)", color: "#fff", padding: "7px 20px", borderRadius: 50, fontSize: 11, fontWeight: 800, letterSpacing: 2, textTransform: "uppercase", marginBottom: 18 },
  dot:       { width: 9, height: 9, background: "#f87171", borderRadius: "50%", animation: "pulse 1.5s infinite", display: "inline-block" },
  h1:        { fontSize: 28, fontWeight: 900, color: "#fff", margin: "0 0 10px" },
  h2:        { fontSize: 22, fontWeight: 800, color: "#fff", margin: "0 0 10px" },
  sub:       { color: "rgba(255,255,255,.7)", fontSize: 14, marginBottom: 28 },
  form:      { display: "flex", flexDirection: "column", gap: 20, textAlign: "left" },
  actions:   { display: "flex", justifyContent: "flex-end", gap: 12, paddingTop: 8, borderTop: "1px solid rgba(255,255,255,.15)" },
  primary:   { background: "linear-gradient(135deg,#1f1a33,#2d2550)", border: "none", borderRadius: 12, padding: "13px 28px", color: "#fff", fontWeight: 800, fontSize: 14, cursor: "pointer", boxShadow: "0 8px 20px rgba(0,0,0,.25)", display: "flex", alignItems: "center", gap: 8 },
  ghost:     { background: "rgba(255,255,255,.12)", border: "1px solid rgba(255,255,255,.25)", borderRadius: 12, padding: "13px 24px", color: "rgba(255,255,255,.85)", fontWeight: 600, fontSize: 14, cursor: "pointer" },
  detailBox: { background: "rgba(255,255,255,.08)", border: "1px solid rgba(255,255,255,.15)", borderRadius: 14, padding: "16px 20px", margin: "20px 0", textAlign: "left" },
  detailRow: { display: "flex", gap: 12, marginBottom: 10, fontSize: 13 },
  detailKey: { color: "rgba(255,255,255,.55)", minWidth: 110 },
  detailVal: { color: "#fff", fontWeight: 600, wordBreak: "break-all" },
  linkBox:   { background: "rgba(255,255,255,.08)", border: "1px solid rgba(255,255,255,.15)", borderRadius: 14, padding: 16, marginBottom: 20, textAlign: "left" },
  linkLabel: { color: "rgba(255,255,255,.6)", fontSize: 11, fontWeight: 700, display: "block", marginBottom: 8, textTransform: "uppercase", letterSpacing: 1 },
  linkRow:   { display: "flex", gap: 8, alignItems: "center" },
  linkCode:  { flex: 1, color: "#fff", fontSize: 11, wordBreak: "break-all", background: "rgba(255,255,255,.1)", padding: "6px 10px", borderRadius: 8 },
  copyBtn:   { background: "rgba(255,255,255,.2)", border: "none", borderRadius: 8, padding: "6px 10px", color: "#fff", cursor: "pointer", flexShrink: 0 },
  spinner:   { width: 20, height: 20, border: "2px solid rgba(255,255,255,.3)", borderTopColor: "#fff", borderRadius: "50%", animation: "spin .7s linear infinite", display: "inline-block" },
  spinnerInline: { width: 14, height: 14, border: "2px solid rgba(255,255,255,.3)", borderTopColor: "#fff", borderRadius: "50%", animation: "spin .7s linear infinite", display: "inline-block" },
  successBadge: { display: "inline-flex", alignItems: "center", gap: 6, background: "rgba(255,255,255,.15)", border: "1px solid rgba(255,255,255,.3)", color: "#fff", padding: "6px 16px", borderRadius: 20, fontSize: 13, fontWeight: 600, marginBottom: 16 },
  inviteSection: { background: "rgba(255,255,255,.08)", border: "1px solid rgba(255,255,255,.2)", borderRadius: 16, padding: "18px 20px", display: "flex", flexDirection: "column", gap: 12 },
  inviteHeader:  { display: "flex", gap: 12, alignItems: "flex-start" },
  inviteIconWrap:{ width: 36, height: 36, borderRadius: 10, background: "rgba(255,255,255,.15)", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", flexShrink: 0 },
  emailInputRow: { display: "flex", gap: 8 },
  addEmailBtn:   { display: "flex", alignItems: "center", gap: 6, background: "linear-gradient(135deg,#1f1a33,#2d2550)", border: "none", borderRadius: 10, padding: "10px 16px", color: "#fff", fontSize: 13, fontWeight: 700, cursor: "pointer", flexShrink: 0, whiteSpace: "nowrap" },
  emailList:     { display: "flex", flexDirection: "column", gap: 6 },
  emailPill:     { display: "flex", alignItems: "center", gap: 8, background: "rgba(255,255,255,.1)", border: "1px solid rgba(255,255,255,.2)", borderRadius: 10, padding: "8px 12px" },
  emailDot:      { width: 7, height: 7, borderRadius: "50%", background: "#fff", flexShrink: 0 },
  removePillBtn: { background: "rgba(239,68,68,.2)", border: "none", borderRadius: 6, padding: "3px 5px", color: "#fca5a5", cursor: "pointer", flexShrink: 0, display: "flex", alignItems: "center" },
  emailCount:    { display: "flex", alignItems: "center", gap: 5, color: "rgba(255,255,255,.6)", fontSize: 11, fontWeight: 600 },
  emailTag:      { background: "rgba(255,255,255,.15)", color: "#fff", fontSize: 11, padding: "3px 10px", borderRadius: 20, border: "1px solid rgba(255,255,255,.25)" },
  invitePreview: { background: "rgba(255,255,255,.06)", border: "1px solid rgba(255,255,255,.12)", borderRadius: 12, padding: "14px 16px", textAlign: "left", marginTop: 4 },
};