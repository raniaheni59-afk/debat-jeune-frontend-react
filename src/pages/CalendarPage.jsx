/**
 * CalendarPage.jsx — Redesigned (Project Management Dashboard aesthetic)
 * ✅ Vue Mois / Semaine / Jour
 * ✅ Lives récupérés depuis API avec lien correct
 * ✅ Notes persistées en localStorage
 * ✅ Click sur live → navigue vers MeetRoom
 * ✅ Nouveau design: teal/mint, clean, professional
 */
import React, { useState, useEffect, useCallback } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import {
  format, addMonths, subMonths, addWeeks, subWeeks, addDays, subDays,
  startOfMonth, endOfMonth, startOfWeek, endOfWeek,
  eachDayOfInterval, isSameDay, isToday, isSameMonth,
  getHours,
} from "date-fns";
import fr from "date-fns/locale/fr";
import API from "../services/api";

/* ─── Palette ─── */
const TEAL    = "#0ABFAA";
const TEAL_LT = "#E6F9F7";
const NAVY    = "#1A2340";
const SLATE   = "#4A5568";
const MUTED   = "#94A3B8";
const BORDER  = "#E8EDF5";
const WHITE   = "#FFFFFF";
const SAND    = "#F7F9FC";

/* ─── Couleurs catégories ─── */
const CAT_COLOR = {
  Live:      { bg: "#0ABFAA", light: "#E6F9F7", text: "#065E56" },
  Enquete:   { bg: "#F59E0B", light: "#FEF3C7", text: "#78350F" },
  Evenement: { bg: "#6366F1", light: "#EEF2FF", text: "#3730A3" },
  Personnel: { bg: "#EC4899", light: "#FCE7F3", text: "#9D174D" },
};

const HOURS = Array.from({ length: 24 }, (_, i) => i);

function extractViewerInfo(streamLink) {
  if (!streamLink) return { roomCode: null, vt: null };
  try {
    const url      = new URL(streamLink);
    const parts    = url.pathname.split("/").filter(Boolean);
    const roomCode = parts[parts.length - 1];
    const vt       = url.searchParams.get("vt");
    return { roomCode, vt };
  } catch { return { roomCode: null, vt: null }; }
}

/* ─── Injected styles ─── */
const STYLES = `
  @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600;700&family=Space+Grotesk:wght@400;500;600;700&display=swap');
  .cal-root * { box-sizing: border-box; margin: 0; padding: 0; }
  .cal-root { font-family: 'DM Sans', sans-serif; }
  .cal-root ::-webkit-scrollbar { width: 5px; height: 5px; }
  .cal-root ::-webkit-scrollbar-track { background: transparent; }
  .cal-root ::-webkit-scrollbar-thumb { background: #CBD5E1; border-radius: 4px; }

  /* Top bar */
  .cal-topbar { display:flex; align-items:center; gap:12px; padding:14px 24px; border-bottom:1px solid ${BORDER}; background:${WHITE}; flex-shrink:0; }
  .cal-topbar-title { font-family:'Space Grotesk',sans-serif; font-size:20px; font-weight:700; color:${NAVY}; letter-spacing:-.3px; }
  .cal-today-btn { padding:7px 18px; border:1.5px solid ${BORDER}; background:${WHITE}; border-radius:8px; font-size:13px; font-weight:600; cursor:pointer; color:${SLATE}; font-family:'DM Sans',sans-serif; transition:all .18s; }
  .cal-today-btn:hover { border-color:${TEAL}; color:${TEAL}; }
  .cal-nav-btn { background:none; border:none; cursor:pointer; color:${MUTED}; width:30px; height:30px; border-radius:8px; display:flex; align-items:center; justify-content:center; font-size:16px; transition:all .18s; }
  .cal-nav-btn:hover { background:${TEAL_LT}; color:${TEAL}; }
  .cal-view-btn { padding:7px 16px; border:1.5px solid ${BORDER}; background:${WHITE}; font-size:13px; font-weight:500; cursor:pointer; color:${SLATE}; font-family:'DM Sans',sans-serif; transition:all .18s; }
  .cal-view-btn:first-child { border-radius:8px 0 0 8px; }
  .cal-view-btn:last-child  { border-radius:0 8px 8px 0; }
  .cal-view-btn.active { background:${TEAL}; color:${WHITE}; border-color:${TEAL}; font-weight:600; }
  .cal-create-btn { display:flex; align-items:center; gap:6px; padding:8px 18px; border:none; border-radius:8px; background:${TEAL}; color:${WHITE}; font-size:13px; font-weight:600; cursor:pointer; font-family:'DM Sans',sans-serif; box-shadow:0 2px 8px rgba(10,191,170,.3); transition:all .18s; margin-left:auto; }
  .cal-create-btn:hover { background:#089E8C; box-shadow:0 4px 14px rgba(10,191,170,.4); transform:translateY(-1px); }
  .cal-filter-sel { border:1.5px solid ${BORDER}; border-radius:8px; padding:7px 12px; font-size:13px; color:${SLATE}; background:${WHITE}; cursor:pointer; outline:none; font-family:'DM Sans',sans-serif; }

  /* Sidebar */
  .cal-sidebar { width:232px; border-right:1px solid ${BORDER}; padding:16px; overflow-y:auto; flex-shrink:0; background:${WHITE}; }
  .cal-add-btn { display:flex; align-items:center; gap:8px; padding:10px 16px; border-radius:10px; box-shadow:0 2px 8px rgba(0,0,0,.08); border:none; background:${WHITE}; cursor:pointer; margin-bottom:16px; font-size:13px; font-weight:600; color:${SLATE}; width:100%; transition:box-shadow .18s; font-family:'DM Sans',sans-serif; }
  .cal-add-btn:hover { box-shadow:0 4px 16px rgba(0,0,0,.12); }

  /* Mini cal */
  .mini-cal-hdr { display:flex; align-items:center; justify-content:space-between; margin-bottom:8px; }
  .mini-cal-month { font-size:12px; font-weight:600; color:${NAVY}; }
  .mini-btn { background:none; border:none; cursor:pointer; color:${MUTED}; font-size:14px; width:22px; height:22px; border-radius:6px; display:flex; align-items:center; justify-content:center; transition:all .15s; }
  .mini-btn:hover { background:${TEAL_LT}; color:${TEAL}; }
  .mini-grid { display:grid; grid-template-columns:repeat(7,1fr); }
  .mini-dow  { text-align:center; font-size:9px; color:${MUTED}; font-weight:700; padding:2px 0; }
  .mini-day  { text-align:center; padding:2px 0; cursor:pointer; }
  .mini-day-inner { width:22px; height:22px; border-radius:50%; margin:0 auto; display:flex; align-items:center; justify-content:center; font-size:10px; font-weight:500; position:relative; transition:all .15s; }
  .mini-day-inner:hover { background:${TEAL_LT}; }
  .mini-day-dot { position:absolute; bottom:1px; left:50%; transform:translateX(-50%); width:3px; height:3px; border-radius:50%; background:${TEAL}; }

  /* Sidebar events */
  .side-evs-hdr { font-size:11px; font-weight:700; color:${NAVY}; margin-bottom:8px; text-transform:uppercase; letter-spacing:.8px; }
  .side-ev-item { display:flex; gap:8px; padding:7px 0; border-bottom:1px solid ${BORDER}; cursor:pointer; align-items:flex-start; }
  .side-ev-item:hover .side-ev-title { color:${TEAL}; }
  .side-ev-dot  { width:8px; height:8px; border-radius:50%; margin-top:4px; flex-shrink:0; }
  .side-ev-title { font-size:12px; font-weight:600; color:${NAVY}; transition:color .15s; }
  .side-ev-time  { font-size:10px; color:${MUTED}; }
  .side-add-note { width:100%; margin-top:12px; padding:7px; background:none; border:1.5px dashed ${BORDER}; border-radius:8px; color:${TEAL}; font-size:11px; cursor:pointer; font-weight:600; transition:border-color .15s; font-family:'DM Sans',sans-serif; }
  .side-add-note:hover { border-color:${TEAL}; background:${TEAL_LT}; }

  /* Month view */
  .month-dow { display:grid; grid-template-columns:repeat(7,1fr); border-bottom:1px solid ${BORDER}; }
  .month-dow-cell { padding:10px 0; text-align:center; font-size:10px; font-weight:700; color:${MUTED}; text-transform:uppercase; letter-spacing:.6px; }
  .month-grid { flex:1; display:grid; grid-template-columns:repeat(7,1fr); overflow:hidden; }
  .month-cell { border-right:1px solid ${BORDER}; border-bottom:1px solid ${BORDER}; padding:6px 8px; background:${WHITE}; cursor:pointer; min-height:90px; display:flex; flex-direction:column; transition:background .15s; }
  .month-cell:hover { background:#F0FDF9; }
  .month-cell.selected { background:${TEAL_LT}; }
  .month-day-num { display:inline-flex; align-items:center; justify-content:center; width:26px; height:26px; border-radius:50%; font-size:12px; font-weight:500; margin-bottom:4px; }
  .month-day-num.today { background:${TEAL}; color:${WHITE}; font-weight:700; }
  .month-ev-chip { border-radius:5px; padding:2px 7px; font-size:10px; font-weight:600; margin-bottom:2px; overflow:hidden; white-space:nowrap; text-overflow:ellipsis; cursor:pointer; display:flex; align-items:center; gap:3px; transition:opacity .15s; }
  .month-ev-chip:hover { opacity:.85; }
  .month-more { font-size:10px; font-weight:600; color:${TEAL}; margin-top:2px; }

  /* Week / Day grids */
  .time-label { padding:0 8px; text-align:right; font-size:9px; color:${MUTED}; border-right:1px solid ${BORDER}; }
  .week-header-cell { text-align:center; padding:8px 4px; cursor:pointer; transition:background .15s; border-right:1px solid ${BORDER}; }
  .week-header-cell:hover { background:${TEAL_LT}; }
  .week-day-name { font-size:10px; color:${MUTED}; text-transform:uppercase; font-weight:600; letter-spacing:.5px; }
  .week-day-num  { display:inline-flex; align-items:center; justify-content:center; width:30px; height:30px; border-radius:50%; font-size:17px; font-weight:500; margin:0 auto; }
  .week-day-num.today { background:${TEAL}; color:${WHITE}; }
  .week-day-num.selected { color:${TEAL}; }
  .week-slot { border-right:1px solid ${BORDER}; border-bottom:1px solid #F1F5F9; height:52px; padding:2px; cursor:pointer; transition:background .12s; }
  .week-slot:hover { background:#F0FDF9; }
  .time-ev-chip { border-radius:6px; padding:3px 7px; font-size:11px; overflow:hidden; cursor:pointer; margin-bottom:1px; font-weight:600; transition:opacity .15s; }
  .time-ev-chip:hover { opacity:.85; }

  /* Day view */
  .day-slot { height:52px; border-bottom:1px solid #F1F5F9; padding:2px 10px; display:flex; gap:6px; align-items:flex-start; cursor:pointer; transition:background .12s; }
  .day-slot:hover { background:#F0FDF9; }
  .day-ev-block { border-radius:8px; padding:5px 12px; font-size:12px; cursor:pointer; min-width:160px; box-shadow:0 2px 8px rgba(0,0,0,.1); transition:transform .15s; }
  .day-ev-block:hover { transform:translateY(-1px); }
  .day-ev-title { font-weight:700; }
  .day-ev-time  { font-size:10px; opacity:.8; }

  /* Modal */
  .cal-modal-overlay { position:fixed; inset:0; background:rgba(15,23,42,.4); backdrop-filter:blur(6px); display:flex; align-items:center; justify-content:center; z-index:9999; animation:calFadeIn .18s ease; }
  @keyframes calFadeIn { from{opacity:0} to{opacity:1} }
  .cal-modal { background:${WHITE}; border-radius:16px; width:440px; max-width:95vw; box-shadow:0 24px 64px rgba(0,0,0,.18); overflow:hidden; animation:calPop .22s cubic-bezier(.34,1.56,.64,1); }
  @keyframes calPop { from{transform:scale(.94);opacity:0} to{transform:scale(1);opacity:1} }
  .cal-modal-head { padding:20px 24px; border-bottom:1px solid ${BORDER}; display:flex; align-items:center; justify-content:space-between; }
  .cal-modal-title { font-family:'Space Grotesk',sans-serif; font-size:15px; font-weight:700; color:${NAVY}; }
  .cal-modal-close { background:none; border:none; cursor:pointer; font-size:17px; color:${MUTED}; width:30px; height:30px; border-radius:8px; display:flex; align-items:center; justify-content:center; transition:all .15s; }
  .cal-modal-close:hover { background:${TEAL_LT}; color:${TEAL}; }
  .cal-modal-body { padding:20px 24px; display:flex; flex-direction:column; gap:14px; }
  .cal-modal-input { border:none; border-bottom:1.5px solid ${BORDER}; padding:6px 0; font-size:18px; outline:none; color:${NAVY}; font-family:'Space Grotesk',sans-serif; font-weight:600; width:100%; transition:border-color .18s; background:transparent; }
  .cal-modal-input:focus { border-color:${TEAL}; }
  .cal-form-label { font-size:11px; color:${MUTED}; display:block; margin-bottom:4px; font-weight:700; text-transform:uppercase; letter-spacing:.5px; }
  .cal-form-ctrl  { width:100%; padding:9px 12px; border:1.5px solid ${BORDER}; border-radius:8px; font-size:13px; outline:none; font-family:'DM Sans',sans-serif; color:${SLATE}; transition:border-color .18s; background:${WHITE}; }
  .cal-form-ctrl:focus { border-color:${TEAL}; }
  .cal-modal-foot { padding:12px 24px 20px; display:flex; justify-content:flex-end; gap:8px; }
  .cal-modal-cancel { padding:9px 20px; border:none; border-radius:8px; background:none; color:${TEAL}; font-size:13px; font-weight:600; cursor:pointer; font-family:'DM Sans',sans-serif; transition:background .15s; }
  .cal-modal-cancel:hover { background:${TEAL_LT}; }
  .cal-modal-save { padding:9px 22px; border:none; border-radius:8px; background:${TEAL}; color:${WHITE}; font-size:13px; font-weight:700; cursor:pointer; font-family:'DM Sans',sans-serif; box-shadow:0 2px 8px rgba(10,191,170,.3); transition:all .18s; }
  .cal-modal-save:hover { background:#089E8C; transform:translateY(-1px); }

  /* Detail popup */
  .cal-detail { position:absolute; top:30%; left:50%; transform:translateX(-50%); background:${WHITE}; border-radius:14px; box-shadow:0 12px 40px rgba(0,0,0,.18); padding:20px 24px; min-width:300px; max-width:400px; animation:calPop .2s cubic-bezier(.34,1.56,.64,1); border:1px solid ${BORDER}; }
  .cal-detail-title { font-family:'Space Grotesk',sans-serif; font-size:17px; font-weight:700; color:${NAVY}; margin-bottom:4px; }
  .cal-detail-time  { font-size:12px; color:${MUTED}; margin-bottom:6px; }
  .cal-detail-desc  { font-size:12px; color:${SLATE}; line-height:1.5; }
  .cal-detail-actions { display:flex; gap:8px; justify-content:flex-end; margin-top:16px; }
  .cal-detail-close { padding:7px 16px; border:none; border-radius:8px; background:${SAND}; color:${SLATE}; font-size:12px; cursor:pointer; font-weight:600; transition:background .15s; }
  .cal-detail-close:hover { background:${BORDER}; }
  .cal-detail-del { padding:7px 16px; border:none; border-radius:8px; background:#FEE2E2; color:#DC2626; font-size:12px; font-weight:600; cursor:pointer; }
  .cal-detail-join { padding:7px 16px; border:none; border-radius:8px; background:${TEAL}; color:${WHITE}; font-size:12px; font-weight:700; cursor:pointer; box-shadow:0 2px 8px rgba(10,191,170,.3); }

  /* Live dot pulse */
  @keyframes pulse { 0%,100%{opacity:1}50%{opacity:.4} }
  .live-dot { width:6px; height:6px; border-radius:50%; background:#EF4444; display:inline-block; animation:pulse 1.2s infinite; }

  /* Highlighted card for scroll */
  .cal-highlighted { animation:glowRing .5s ease; }
  @keyframes glowRing { 0%,100%{box-shadow:none}50%{box-shadow:0 0 0 4px rgba(10,191,170,.3)} }
`;

/* ══════════════════════════════════════════════ */
export default function CalendarPage() {
  const location = useLocation();
  const navigate = useNavigate();

  const [view,        setView]      = useState("month");
  const [current,     setCurrent]   = useState(new Date());
  const [selected,    setSelected]  = useState(new Date());
  const [events,      setEvents]    = useState({});
  const [notes,       setNotes]     = useState(() => {
    try { return JSON.parse(localStorage.getItem("swafy_calendar_notes") || "{}"); }
    catch { return {}; }
  });
  const [filterCat,   setFilterCat] = useState("Tous");
  const [showModal,   setShowModal] = useState(false);
  const [modalDate,   setModalDate] = useState(null);
  const [noteForm,    setNoteForm]  = useState({ title: "", text: "", category: "Personnel", time: "" });
  const [detailEvent, setDetailEvent] = useState(null);
  const [miniCalOpen, setMiniCalOpen] = useState(true);

  useEffect(() => {
    localStorage.setItem("swafy_calendar_notes", JSON.stringify(notes));
  }, [notes]);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) return;
    API.get("/lives")
      .then(res => {
        const list = Array.isArray(res.data) ? res.data : [];
        const map  = {};
        list.forEach(live => {
          if (!live.date) return;
          const key = format(new Date(live.date), "yyyy-MM-dd");
          if (!map[key]) map[key] = [];
          map[key].push({
            id:          live.id || live.id_live,
            title:       live.title_live || live.title || "Live",
            time:        live.time || "",
            category:    "Live",
            streamLink:  live.stream_link || "",
            isActive:    live.is_active,
            description: live.description || "",
          });
        });
        setEvents(map);
      })
      .catch(() => {});
  }, [location.key]);

  const keyOf = d => format(d, "yyyy-MM-dd");

  const eventsOfDay = useCallback((day) => {
    const key = keyOf(day);
    const liveEvs = events[key] || [];
    const noteEvs = (notes[key] || []).map((n, i) => ({
      ...n, id: `note-${key}-${i}`, category: n.category || "Personnel", isNote: true,
    }));
    const all = [...liveEvs, ...noteEvs];
    if (filterCat === "Tous") return all;
    return all.filter(e => e.category === filterCat);
  }, [events, notes, filterCat]);

  const hasEvent = d => eventsOfDay(d).length > 0;

  const prev = () => {
    if (view === "month") setCurrent(subMonths(current, 1));
    else if (view === "week") setCurrent(subWeeks(current, 1));
    else setCurrent(subDays(current, 1));
  };
  const next = () => {
    if (view === "month") setCurrent(addMonths(current, 1));
    else if (view === "week") setCurrent(addWeeks(current, 1));
    else setCurrent(addDays(current, 1));
  };

  const handleEventClick = (e, ev) => {
    e.stopPropagation();
    if (ev.isNote) { setDetailEvent({ ...ev, _type: "note" }); return; }
    if (ev.category === "Live" && ev.streamLink) {
      const { roomCode, vt } = extractViewerInfo(ev.streamLink);
      if (roomCode && vt) { navigate(`/meet/${roomCode}?vt=${vt}`); return; }
    }
    setDetailEvent({ ...ev, _type: "live" });
  };

  const openAddNote = (day) => {
    setModalDate(day);
    setNoteForm({ title: "", text: "", category: "Personnel", time: "" });
    setShowModal(true);
  };

  const saveNote = () => {
    if (!noteForm.title.trim() || !modalDate) return;
    const key = keyOf(modalDate);
    setNotes(prev => ({ ...prev, [key]: [...(prev[key] || []), { ...noteForm }] }));
    setShowModal(false);
  };

  const deleteNote = (day, idx) => {
    const key = keyOf(day);
    setNotes(prev => ({ ...prev, [key]: (prev[key] || []).filter((_, i) => i !== idx) }));
    setDetailEvent(null);
  };

  const viewTitle = () => {
    if (view === "month") return format(current, "MMMM yyyy", { locale: fr });
    if (view === "week") {
      const ws = startOfWeek(current, { weekStartsOn: 1 });
      const we = endOfWeek(current, { weekStartsOn: 1 });
      return `${format(ws, "d MMM", { locale: fr })} – ${format(we, "d MMM yyyy", { locale: fr })}`;
    }
    return format(current, "EEEE d MMMM yyyy", { locale: fr });
  };

  /* ─── MONTH VIEW ─── */
  const MonthView = () => {
    const days = eachDayOfInterval({
      start: startOfWeek(startOfMonth(current), { weekStartsOn: 1 }),
      end:   endOfWeek(endOfMonth(current),     { weekStartsOn: 1 }),
    });
    return (
      <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>
        <div className="month-dow">
          {["Lun","Mar","Mer","Jeu","Ven","Sam","Dim"].map(d => (
            <div key={d} className="month-dow-cell">{d}</div>
          ))}
        </div>
        <div className="month-grid">
          {days.map(day => {
            const isSelected = isSameDay(day, selected);
            const inMonth    = isSameMonth(day, current);
            const dayEvents  = eventsOfDay(day);
            const todayFlag  = isToday(day);
            return (
              <div key={keyOf(day)}
                className={`month-cell${isSelected ? " selected" : ""}`}
                onClick={() => { setSelected(day); if (!dayEvents.length) openAddNote(day); }}
                style={{ opacity: inMonth ? 1 : 0.35 }}>
                <div className={`month-day-num${todayFlag ? " today" : ""}`}
                  style={{ color: !todayFlag ? (inMonth ? NAVY : MUTED) : undefined }}>
                  {format(day, "d")}
                </div>
                {dayEvents.slice(0, 3).map((ev, i) => {
                  const col = CAT_COLOR[ev.category] || CAT_COLOR.Personnel;
                  return (
                    <div key={ev.id || i} onClick={e => handleEventClick(e, ev)}
                      className="month-ev-chip"
                      style={{ background: col.bg, color: "#fff" }}>
                      {ev.isActive && <span className="live-dot" />}
                      {ev.title}
                    </div>
                  );
                })}
                {dayEvents.length > 3 && (
                  <div className="month-more">+{dayEvents.length - 3} autres</div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  /* ─── WEEK VIEW ─── */
  const WeekView = () => {
    const ws   = startOfWeek(current, { weekStartsOn: 1 });
    const days = Array.from({ length: 7 }, (_, i) => addDays(ws, i));
    return (
      <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>
        <div style={{ display: "grid", gridTemplateColumns: "52px repeat(7,1fr)", borderBottom: `1px solid ${BORDER}`, flexShrink: 0 }}>
          <div />
          {days.map(d => (
            <div key={keyOf(d)} className="week-header-cell"
              onClick={() => { setSelected(d); setCurrent(d); setView("day"); }}>
              <div className="week-day-name">{format(d, "EEE", { locale: fr })}</div>
              <div className={`week-day-num${isToday(d) ? " today" : ""}${isSameDay(d, selected) && !isToday(d) ? " selected" : ""}`}>
                {format(d, "d")}
              </div>
            </div>
          ))}
        </div>
        <div style={{ flex: 1, overflowY: "auto", display: "grid", gridTemplateColumns: "52px repeat(7,1fr)" }}>
          {HOURS.map(h => (
            <React.Fragment key={h}>
              <div className="time-label" style={{ height: 52, lineHeight: "52px", borderBottom: `1px solid #F1F5F9` }}>
                {h > 0 ? `${String(h).padStart(2,"0")}:00` : ""}
              </div>
              {days.map(d => {
                const dayEvs = eventsOfDay(d).filter(ev => {
                  if (!ev.time) return h === 8;
                  return parseInt(ev.time.split(":")[0]) === h;
                });
                return (
                  <div key={keyOf(d)} className="week-slot"
                    onClick={() => { setSelected(d); openAddNote(d); }}>
                    {dayEvs.map((ev, i) => {
                      const col = CAT_COLOR[ev.category] || CAT_COLOR.Personnel;
                      return (
                        <div key={ev.id || i} onClick={e => handleEventClick(e, ev)}
                          className="time-ev-chip"
                          style={{ background: col.light, color: col.text, border: `1px solid ${col.bg}20` }}>
                          {ev.title}
                        </div>
                      );
                    })}
                  </div>
                );
              })}
            </React.Fragment>
          ))}
        </div>
      </div>
    );
  };

  /* ─── DAY VIEW ─── */
  const DayView = () => {
    const dayEvs = eventsOfDay(current);
    return (
      <div style={{ flex: 1, display: "flex", overflow: "hidden" }}>
        <div style={{ width: 52, overflowY: "auto", borderRight: `1px solid ${BORDER}` }}>
          {HOURS.map(h => (
            <div key={h} className="time-label" style={{ height: 52, lineHeight: "52px", borderBottom: `1px solid #F1F5F9` }}>
              {h > 0 ? `${String(h).padStart(2,"0")}:00` : ""}
            </div>
          ))}
        </div>
        <div style={{ flex: 1, overflowY: "auto" }}>
          {HOURS.map(h => {
            const slot = dayEvs.filter(ev => {
              if (!ev.time) return h === 8;
              return parseInt(ev.time.split(":")[0]) === h;
            });
            return (
              <div key={h} className="day-slot" onClick={() => openAddNote(current)}>
                {slot.map((ev, i) => {
                  const col = CAT_COLOR[ev.category] || CAT_COLOR.Personnel;
                  return (
                    <div key={ev.id || i} onClick={e => handleEventClick(e, ev)}
                      className="day-ev-block"
                      style={{ background: col.light, borderLeft: `3px solid ${col.bg}`, color: col.text }}>
                      <div className="day-ev-title">{ev.title}</div>
                      {ev.time && <div className="day-ev-time">🕐 {ev.time}</div>}
                    </div>
                  );
                })}
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  /* ─── MINI CALENDAR ─── */
  const MiniCalendar = () => {
    const [mini, setMini] = useState(current);
    const days = eachDayOfInterval({
      start: startOfWeek(startOfMonth(mini), { weekStartsOn: 1 }),
      end:   endOfWeek(endOfMonth(mini),     { weekStartsOn: 1 }),
    });
    return (
      <div style={{ marginBottom: 18 }}>
        <div className="mini-cal-hdr">
          <span className="mini-cal-month">{format(mini, "MMMM yyyy", { locale: fr })}</span>
          <div style={{ display: "flex", gap: 2 }}>
            <button className="mini-btn" onClick={() => setMini(subMonths(mini, 1))}>‹</button>
            <button className="mini-btn" onClick={() => setMini(addMonths(mini, 1))}>›</button>
          </div>
        </div>
        <div className="mini-grid">
          {["L","M","M","J","V","S","D"].map((d, i) => (
            <div key={i} className="mini-dow">{d}</div>
          ))}
          {days.map(d => {
            const tod  = isToday(d);
            const sel  = isSameDay(d, selected);
            const inM  = isSameMonth(d, mini);
            const hasEv = hasEvent(d);
            return (
              <div key={keyOf(d)} className="mini-day"
                onClick={() => { setSelected(d); setCurrent(d); }}>
                <div className="mini-day-inner"
                  style={{
                    background: tod ? TEAL : sel ? TEAL_LT : "transparent",
                    color: tod ? WHITE : sel ? TEAL : inM ? NAVY : MUTED,
                    fontWeight: (tod || sel) ? 700 : 400,
                  }}>
                  {format(d, "d")}
                  {hasEv && !tod && <span className="mini-day-dot" />}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  /* ─── SIDEBAR EVENTS ─── */
  const SidebarEvents = () => {
    const evs = eventsOfDay(selected);
    return (
      <div>
        <div className="side-evs-hdr">{format(selected, "EEEE d MMMM", { locale: fr })}</div>
        {evs.length === 0 ? (
          <div style={{ fontSize: 11, color: MUTED, padding: "16px 0", textAlign: "center" }}>
            Aucun événement
          </div>
        ) : evs.map((ev, i) => {
          const col = CAT_COLOR[ev.category] || CAT_COLOR.Personnel;
          return (
            <div key={ev.id || i} className="side-ev-item" onClick={e => handleEventClick(e, ev)}>
              <div className="side-ev-dot" style={{ background: col.bg }} />
              <div>
                <div className="side-ev-title">{ev.title}</div>
                {ev.time && <div className="side-ev-time">🕐 {ev.time}</div>}
                {ev.isActive && (
                  <span style={{ background: "#EF4444", color: "#fff", fontSize: 9, padding: "1px 5px", borderRadius: 4, fontWeight: 800 }}>
                    EN DIRECT
                  </span>
                )}
              </div>
            </div>
          );
        })}
        <button className="side-add-note" onClick={() => openAddNote(selected)}>
          ＋ Ajouter une note
        </button>
      </div>
    );
  };

  /* ─── RENDER ─── */
  return (
    <div className="cal-root" style={{ height: "100vh", display: "flex", flexDirection: "column", background: SAND, overflow: "hidden" }}>
      <style>{STYLES}</style>

      {/* TOP BAR */}
      <div className="cal-topbar">
        <button onClick={() => setMiniCalOpen(o => !o)}
          style={{ background: "none", border: "none", cursor: "pointer", padding: 6, borderRadius: 8, display: "flex", color: SLATE }}>
          <svg width={18} height={18} viewBox="0 0 24 24"><path d="M3 18h18v-2H3v2zm0-5h18v-2H3v2zm0-7v2h18V6H3z" fill="currentColor"/></svg>
        </button>
        <span className="cal-topbar-title">Agenda</span>

        <button className="cal-today-btn"
          onClick={() => { setCurrent(new Date()); setSelected(new Date()); }}>
          Aujourd'hui
        </button>

        <div style={{ display: "flex", gap: 2 }}>
          <button className="cal-nav-btn" onClick={prev}>‹</button>
          <button className="cal-nav-btn" onClick={next}>›</button>
        </div>

        <span style={{ fontSize: 15, fontWeight: 600, color: NAVY, flex: 1, fontFamily: "'Space Grotesk',sans-serif" }}>
          {viewTitle()}
        </span>

        <select className="cal-filter-sel" value={filterCat} onChange={e => setFilterCat(e.target.value)}>
          {["Tous","Live","Enquete","Evenement","Personnel"].map(c => (
            <option key={c} value={c}>
              {c === "Enquete" ? "Enquête" : c === "Evenement" ? "Événement" : c}
            </option>
          ))}
        </select>

        <div style={{ display: "flex" }}>
          {[["month","Mois"],["week","Semaine"],["day","Jour"]].map(([v, l]) => (
            <button key={v} onClick={() => setView(v)}
              className={`cal-view-btn${view === v ? " active" : ""}`}>
              {l}
            </button>
          ))}
        </div>

        <button className="cal-create-btn" onClick={() => openAddNote(selected)}>
          <span style={{ fontSize: 16 }}>＋</span> Créer
        </button>
      </div>

      {/* BODY */}
      <div style={{ flex: 1, display: "flex", overflow: "hidden" }}>
        {/* LEFT SIDEBAR */}
        {miniCalOpen && (
          <div className="cal-sidebar">
            <button className="cal-add-btn" onClick={() => openAddNote(selected)}>
              <span style={{ fontSize: 18, color: TEAL }}>＋</span> Créer un événement
            </button>
            <MiniCalendar />
            <hr style={{ border: "none", borderTop: `1px solid ${BORDER}`, margin: "10px 0" }} />
            <SidebarEvents />
          </div>
        )}

        {/* MAIN CALENDAR */}
        <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden", background: WHITE }}>
          {view === "month" && <MonthView />}
          {view === "week"  && <WeekView />}
          {view === "day"   && <DayView />}
        </div>
      </div>

      {/* ADD NOTE MODAL */}
      {showModal && (
        <div className="cal-modal-overlay">
          <div className="cal-modal">
            <div className="cal-modal-head">
              <span className="cal-modal-title">
                Nouvel événement — {modalDate && format(modalDate, "d MMMM yyyy", { locale: fr })}
              </span>
              <button className="cal-modal-close" onClick={() => setShowModal(false)}>✕</button>
            </div>
            <div className="cal-modal-body">
              <input className="cal-modal-input" value={noteForm.title}
                onChange={e => setNoteForm(p => ({ ...p, title: e.target.value }))}
                placeholder="Titre de l'événement" autoFocus />
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                <div>
                  <label className="cal-form-label">Heure</label>
                  <input type="time" className="cal-form-ctrl" value={noteForm.time}
                    onChange={e => setNoteForm(p => ({ ...p, time: e.target.value }))} />
                </div>
                <div>
                  <label className="cal-form-label">Catégorie</label>
                  <select className="cal-form-ctrl" value={noteForm.category}
                    onChange={e => setNoteForm(p => ({ ...p, category: e.target.value }))}>
                    <option value="Enquete">Enquête</option>
                    <option value="Evenement">Événement</option>
                    <option value="Personnel">Personnel</option>
                  </select>
                </div>
              </div>
              <textarea className="cal-form-ctrl" value={noteForm.text}
                onChange={e => setNoteForm(p => ({ ...p, text: e.target.value }))}
                placeholder="Description (optionnel)"
                style={{ resize: "vertical", minHeight: 80 }} />
            </div>
            <div className="cal-modal-foot">
              <button className="cal-modal-cancel" onClick={() => setShowModal(false)}>Annuler</button>
              <button className="cal-modal-save" onClick={saveNote}>Enregistrer</button>
            </div>
          </div>
        </div>
      )}

      {/* DETAIL POPUP */}
      {detailEvent && (
        <div style={{ position: "fixed", inset: 0, zIndex: 9998 }} onClick={() => setDetailEvent(null)}>
          <div className="cal-detail" onClick={e => e.stopPropagation()}>
            <div style={{ display: "flex", gap: 10, marginBottom: 12, alignItems: "flex-start" }}>
              <div style={{
                width: 10, height: 10, borderRadius: "50%", marginTop: 6, flexShrink: 0,
                background: (CAT_COLOR[detailEvent.category] || CAT_COLOR.Personnel).bg,
              }} />
              <div>
                <div className="cal-detail-title">{detailEvent.title}</div>
                {detailEvent.time && <div className="cal-detail-time">🕐 {detailEvent.time}</div>}
                {(detailEvent.description || detailEvent.text) && (
                  <div className="cal-detail-desc">{detailEvent.description || detailEvent.text}</div>
                )}
              </div>
            </div>
            <div className="cal-detail-actions">
              {detailEvent._type === "note" && (
                <button className="cal-detail-del" onClick={() => {
                  const key = keyOf(selected);
                  const idx = (notes[key] || []).findIndex(n => n.title === detailEvent.title && n.text === detailEvent.text);
                  if (idx !== -1) deleteNote(selected, idx);
                }}>Supprimer</button>
              )}
              {detailEvent._type === "live" && detailEvent.streamLink && (
                <button className="cal-detail-join" onClick={() => {
                  const { roomCode, vt } = extractViewerInfo(detailEvent.streamLink);
                  if (roomCode && vt) navigate(`/meet/${roomCode}?vt=${vt}`);
                }}>▶ Rejoindre le live</button>
              )}
              <button className="cal-detail-close" onClick={() => setDetailEvent(null)}>Fermer</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}