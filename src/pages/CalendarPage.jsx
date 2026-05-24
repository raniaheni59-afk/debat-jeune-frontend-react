/**
 * CalendarPage.jsx — Agenda style Google Calendar
 * ✅ Vue Mois / Semaine / Jour
 * ✅ Lives récupérés depuis API avec lien correct
 * ✅ Notes persistées en localStorage
 * ✅ Click sur live → navigue vers MeetRoom avec bon token
 * ✅ Design Google Agenda
 */
import React, { useState, useEffect, useCallback } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import {
  format, addMonths, subMonths, addWeeks, subWeeks, addDays, subDays,
  startOfMonth, endOfMonth, startOfWeek, endOfWeek,
  eachDayOfInterval, isSameDay, isToday, isSameMonth,
  getHours, getDay,
} from "date-fns";
import fr from "date-fns/locale/fr";
import API from "../services/api";

/* ─── Couleurs catégories ─── */
const CAT_COLOR = {
  Live:       { bg: "#1a73e8", light: "#e8f0fe" },
  Enquete:    { bg: "#f9ab00", light: "#fef9e7" },
  Evenement:  { bg: "#7c4dff", light: "#f3e5f5" },
  Personnel:  { bg: "#0f9d58", light: "#e8f5e9" },
};

const HOURS = Array.from({ length: 24 }, (_, i) => i);

/* ─── extract roomCode + token from stream_link ─── */
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

/* ══════════════════════════════════════════════ */
export default function CalendarPage() {
  const location = useLocation();
  const navigate = useNavigate();

  const [view,           setView]        = useState("month");  // month | week | day
  const [current,        setCurrent]     = useState(new Date());
  const [selected,       setSelected]    = useState(new Date());
  const [events,         setEvents]      = useState({});  // { "yyyy-MM-dd": [event,...] }
  const [notes,          setNotes]       = useState(() => {
    try { return JSON.parse(localStorage.getItem("swafy_calendar_notes") || "{}"); }
    catch { return {}; }
  });
  const [filterCat,      setFilterCat]   = useState("Tous");
  const [showModal,      setShowModal]   = useState(false);
  const [modalDate,      setModalDate]   = useState(null);
  const [noteForm,       setNoteForm]    = useState({ title: "", text: "", category: "Personnel", time: "" });
  const [detailEvent,    setDetailEvent] = useState(null);  // popup détail
  const [miniCalOpen,    setMiniCalOpen] = useState(true);

  /* ── Save notes to localStorage ── */
  useEffect(() => {
    localStorage.setItem("swafy_calendar_notes", JSON.stringify(notes));
  }, [notes]);

  /* ── Fetch lives ── */
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
            id:         live.id || live.id_live,
            title:      live.title_live || live.title || "Live",
            time:       live.time || "",
            category:   "Live",
            streamLink: live.stream_link || "",
            isActive:   live.is_active,
            description:live.description || "",
          });
        });
        setEvents(map);
      })
      .catch(() => {});
  }, [location.key]);

  /* ── Helpers ── */
  const keyOf = d => format(d, "yyyy-MM-dd");

  const eventsOfDay = useCallback((day) => {
    const key = keyOf(day);
    const liveEvs  = (events[key] || []);
    const noteEvs  = (notes[key]  || []).map((n, i) => ({
      ...n,
      id:       `note-${key}-${i}`,
      category: n.category || "Personnel",
      isNote:   true,
    }));
    const all = [...liveEvs, ...noteEvs];
    if (filterCat === "Tous") return all;
    return all.filter(e => e.category === filterCat);
  }, [events, notes, filterCat]);

  const hasEvent = d => eventsOfDay(d).length > 0;

  /* ── Navigation ── */
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

  /* ── Click event ── */
  const handleEventClick = (e, ev) => {
    e.stopPropagation();
    if (ev.isNote) {
      setDetailEvent({ ...ev, _type: "note" });
      return;
    }
    // Live → navigate to MeetRoom
    if (ev.category === "Live" && ev.streamLink) {
      const { roomCode, vt } = extractViewerInfo(ev.streamLink);
      if (roomCode && vt) {
        navigate(`/meet/${roomCode}?vt=${vt}`);
        return;
      }
    }
    setDetailEvent({ ...ev, _type: "live" });
  };

  /* ── Add note ── */
  const openAddNote = (day) => {
    setModalDate(day);
    setNoteForm({ title: "", text: "", category: "Personnel", time: "" });
    setShowModal(true);
  };

  const saveNote = () => {
    if (!noteForm.title.trim() || !modalDate) return;
    const key = keyOf(modalDate);
    setNotes(prev => ({
      ...prev,
      [key]: [...(prev[key] || []), { ...noteForm }],
    }));
    setShowModal(false);
  };

  const deleteNote = (day, idx) => {
    const key = keyOf(day);
    setNotes(prev => ({
      ...prev,
      [key]: (prev[key] || []).filter((_, i) => i !== idx),
    }));
    setDetailEvent(null);
  };

  /* ── Title ── */
  const viewTitle = () => {
    if (view === "month") return format(current, "MMMM yyyy", { locale: fr });
    if (view === "week") {
      const ws = startOfWeek(current, { weekStartsOn: 1 });
      const we = endOfWeek(current, { weekStartsOn: 1 });
      return `${format(ws, "d MMM", { locale: fr })} – ${format(we, "d MMM yyyy", { locale: fr })}`;
    }
    return format(current, "EEEE d MMMM yyyy", { locale: fr });
  };

  /* ─────────────────────────────────────────────
     MONTH VIEW
  ───────────────────────────────────────────── */
  const MonthView = () => {
    const monthStart = startOfMonth(current);
    const monthEnd   = endOfMonth(current);
    const calStart   = startOfWeek(monthStart, { weekStartsOn: 1 });
    const calEnd     = endOfWeek(monthEnd,   { weekStartsOn: 1 });
    const days       = eachDayOfInterval({ start: calStart, end: calEnd });
    const DOWS       = ["Lun", "Mar", "Mer", "Jeu", "Ven", "Sam", "Dim"];

    return (
      <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>
        {/* DOW headers */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(7,1fr)", borderBottom: "1px solid #e0e0e0" }}>
          {DOWS.map(d => (
            <div key={d} style={{ padding: "8px 0", textAlign: "center", fontSize: 11, fontWeight: 600, color: "#70757a", textTransform: "uppercase" }}>
              {d}
            </div>
          ))}
        </div>
        {/* Days grid */}
        <div style={{ flex: 1, display: "grid", gridTemplateColumns: "repeat(7,1fr)", gridAutoRows: "1fr", overflow: "hidden" }}>
          {days.map(day => {
            const isSelected  = isSameDay(day, selected);
            const isCurrentM  = isSameMonth(day, current);
            const dayEvents   = eventsOfDay(day);
            const todayFlag   = isToday(day);

            return (
              <div
                key={keyOf(day)}
                onClick={() => { setSelected(day); if (!dayEvents.length) openAddNote(day); }}
                style={{
                  borderRight: "1px solid #e0e0e0", borderBottom: "1px solid #e0e0e0",
                  padding: "4px 6px",
                  background: isSelected ? "#e8f0fe" : "white",
                  cursor: "pointer",
                  minHeight: 80,
                  display: "flex", flexDirection: "column",
                  opacity: isCurrentM ? 1 : 0.4,
                  transition: "background .15s",
                }}
              >
                {/* Day number */}
                <div style={{ marginBottom: 4, alignSelf: "flex-start" }}>
                  <span style={{
                    display: "inline-flex", alignItems: "center", justifyContent: "center",
                    width: 26, height: 26, borderRadius: "50%", fontSize: 13, fontWeight: 500,
                    background: todayFlag ? "#1a73e8" : "transparent",
                    color: todayFlag ? "#fff" : isCurrentM ? "#202124" : "#bbb",
                  }}>{format(day, "d")}</span>
                </div>
                {/* Events (max 3) */}
                {dayEvents.slice(0, 3).map((ev, i) => {
                  const col = CAT_COLOR[ev.category] || CAT_COLOR.Personnel;
                  return (
                    <div
                      key={ev.id || i}
                      onClick={e => handleEventClick(e, ev)}
                      style={{
                        background: col.bg, color: "#fff",
                        borderRadius: 4, padding: "1px 6px",
                        fontSize: 11, marginBottom: 2, overflow: "hidden",
                        whiteSpace: "nowrap", textOverflow: "ellipsis",
                        cursor: "pointer",
                        display: "flex", alignItems: "center", gap: 3,
                      }}
                    >
                      {ev.isActive && <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#ea4335", flexShrink: 0 }} />}
                      {ev.title}
                    </div>
                  );
                })}
                {dayEvents.length > 3 && (
                  <div style={{ fontSize: 10, color: "#1a73e8", fontWeight: 600, marginTop: 1 }}>
                    +{dayEvents.length - 3} autres
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  /* ─────────────────────────────────────────────
     WEEK VIEW
  ───────────────────────────────────────────── */
  const WeekView = () => {
    const ws   = startOfWeek(current, { weekStartsOn: 1 });
    const days = Array.from({ length: 7 }, (_, i) => addDays(ws, i));

    return (
      <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>
        {/* Header */}
        <div style={{ display: "grid", gridTemplateColumns: "60px repeat(7,1fr)", borderBottom: "1px solid #e0e0e0", flexShrink: 0 }}>
          <div />
          {days.map(d => (
            <div key={keyOf(d)} style={{ textAlign: "center", padding: "8px 4px", cursor: "pointer" }}
              onClick={() => { setSelected(d); setCurrent(d); setView("day"); }}>
              <div style={{ fontSize: 11, color: "#70757a", textTransform: "uppercase", fontWeight: 500 }}>
                {format(d, "EEE", { locale: fr })}
              </div>
              <div style={{
                display: "inline-flex", alignItems: "center", justifyContent: "center",
                width: 32, height: 32, borderRadius: "50%", fontSize: 18, fontWeight: 400, margin: "0 auto",
                background: isToday(d) ? "#1a73e8" : "transparent",
                color: isToday(d) ? "#fff" : isSameDay(d, selected) ? "#1a73e8" : "#202124",
              }}>{format(d, "d")}</div>
            </div>
          ))}
        </div>
        {/* Time grid */}
        <div style={{ flex: 1, overflowY: "auto", display: "grid", gridTemplateColumns: "60px repeat(7,1fr)" }}>
          {HOURS.map(h => (
            <React.Fragment key={h}>
              <div style={{ padding: "0 8px", textAlign: "right", fontSize: 10, color: "#70757a", height: 52, lineHeight: "52px", borderRight: "1px solid #e0e0e0" }}>
                {h > 0 ? `${String(h).padStart(2,"0")}:00` : ""}
              </div>
              {days.map(d => {
                const dayEvs = eventsOfDay(d).filter(ev => {
                  if (!ev.time) return h === 8;
                  const hh = parseInt(ev.time.split(":")[0]);
                  return hh === h;
                });
                return (
                  <div key={keyOf(d)} style={{ borderRight: "1px solid #e0e0e0", borderBottom: "1px solid #f1f3f4", height: 52, padding: "2px 2px", position: "relative" }}
                    onClick={() => { setSelected(d); openAddNote(d); }}>
                    {dayEvs.map((ev, i) => {
                      const col = CAT_COLOR[ev.category] || CAT_COLOR.Personnel;
                      return (
                        <div key={ev.id || i} onClick={e => handleEventClick(e, ev)}
                          style={{ background: col.bg, color: "#fff", borderRadius: 4, padding: "2px 5px", fontSize: 11, overflow: "hidden", cursor: "pointer", marginBottom: 1 }}>
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

  /* ─────────────────────────────────────────────
     DAY VIEW
  ───────────────────────────────────────────── */
  const DayView = () => {
    const dayEvs = eventsOfDay(current);
    return (
      <div style={{ flex: 1, display: "flex", overflow: "hidden" }}>
        {/* Time column */}
        <div style={{ width: 60, overflowY: "auto", borderRight: "1px solid #e0e0e0" }}>
          {HOURS.map(h => (
            <div key={h} style={{ height: 52, padding: "0 8px", textAlign: "right", fontSize: 10, color: "#70757a", borderBottom: "1px solid #f1f3f4", lineHeight: "52px" }}>
              {h > 0 ? `${String(h).padStart(2,"0")}:00` : ""}
            </div>
          ))}
        </div>
        {/* Events column */}
        <div style={{ flex: 1, overflowY: "auto", position: "relative" }}>
          {HOURS.map(h => {
            const slot = dayEvs.filter(ev => {
              if (!ev.time) return h === 8;
              return parseInt(ev.time.split(":")[0]) === h;
            });
            return (
              <div key={h} style={{ height: 52, borderBottom: "1px solid #f1f3f4", padding: "2px 8px", display: "flex", gap: 4, alignItems: "flex-start" }}
                onClick={() => openAddNote(current)}>
                {slot.map((ev, i) => {
                  const col = CAT_COLOR[ev.category] || CAT_COLOR.Personnel;
                  return (
                    <div key={ev.id || i} onClick={e => handleEventClick(e, ev)}
                      style={{ background: col.bg, color: "#fff", borderRadius: 6, padding: "4px 10px", fontSize: 13, cursor: "pointer", minWidth: 160, boxShadow: "0 1px 4px rgba(0,0,0,.2)" }}>
                      <div style={{ fontWeight: 600 }}>{ev.title}</div>
                      {ev.time && <div style={{ fontSize: 11, opacity: .85 }}>{ev.time}</div>}
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

  /* ─────────────────────────────────────────────
     MINI CALENDAR (left sidebar)
  ───────────────────────────────────────────── */
  const MiniCalendar = () => {
    const [mini, setMini] = useState(current);
    const ms    = startOfMonth(mini);
    const me    = endOfMonth(mini);
    const cs    = startOfWeek(ms, { weekStartsOn: 1 });
    const ce    = endOfWeek(me, { weekStartsOn: 1 });
    const days  = eachDayOfInterval({ start: cs, end: ce });

    return (
      <div style={{ marginBottom: 20 }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
          <span style={{ fontSize: 13, fontWeight: 500, color: "#202124" }}>
            {format(mini, "MMMM yyyy", { locale: fr })}
          </span>
          <div style={{ display: "flex", gap: 2 }}>
            <button onClick={() => setMini(subMonths(mini, 1))} style={miniBtn}>‹</button>
            <button onClick={() => setMini(addMonths(mini, 1))} style={miniBtn}>›</button>
          </div>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(7,1fr)", gap: 0 }}>
          {["L","M","M","J","V","S","D"].map((d, i) => (
            <div key={i} style={{ textAlign: "center", fontSize: 10, color: "#70757a", fontWeight: 600, padding: "2px 0" }}>{d}</div>
          ))}
          {days.map(d => {
            const tod  = isToday(d);
            const sel  = isSameDay(d, selected);
            const inM  = isSameMonth(d, mini);
            const hasEv = hasEvent(d);
            return (
              <div key={keyOf(d)} onClick={() => { setSelected(d); setCurrent(d); }}
                style={{ textAlign: "center", padding: "3px 0", cursor: "pointer" }}>
                <div style={{
                  width: 24, height: 24, borderRadius: "50%", margin: "0 auto",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: 11, fontWeight: sel || tod ? 700 : 400,
                  background: tod ? "#1a73e8" : sel ? "#e8f0fe" : "transparent",
                  color: tod ? "#fff" : sel ? "#1a73e8" : inM ? "#202124" : "#bdbdbd",
                  position: "relative",
                }}>
                  {format(d, "d")}
                  {hasEv && !tod && <span style={{ position: "absolute", bottom: 1, left: "50%", transform: "translateX(-50%)", width: 4, height: 4, borderRadius: "50%", background: sel ? "#1a73e8" : "#1a73e8" }} />}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };
  const miniBtn = { background: "none", border: "none", cursor: "pointer", color: "#70757a", fontSize: 16, width: 24, height: 24, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", padding: 0 };

  /* ─────────────────────────────────────────────
     SELECTED DAY EVENTS (sidebar)
  ───────────────────────────────────────────── */
  const SidebarEvents = () => {
    const evs = eventsOfDay(selected);
    return (
      <div>
        <div style={{ fontSize: 13, fontWeight: 600, color: "#202124", marginBottom: 10 }}>
          {format(selected, "EEEE d MMMM", { locale: fr })}
        </div>
        {evs.length === 0 ? (
          <div style={{ fontSize: 12, color: "#70757a", textAlign: "center", padding: "20px 0" }}>
            Aucun événement
          </div>
        ) : (
          evs.map((ev, i) => {
            const col = CAT_COLOR[ev.category] || CAT_COLOR.Personnel;
            return (
              <div key={ev.id || i} onClick={e => handleEventClick(e, ev)}
                style={{ display: "flex", gap: 10, padding: "8px 0", borderBottom: "1px solid #f1f3f4", cursor: "pointer", alignItems: "flex-start" }}>
                <div style={{ width: 10, height: 10, borderRadius: "50%", background: col.bg, marginTop: 3, flexShrink: 0 }} />
                <div>
                  <div style={{ fontSize: 13, fontWeight: 500, color: "#202124" }}>{ev.title}</div>
                  {ev.time && <div style={{ fontSize: 11, color: "#70757a" }}>{ev.time}</div>}
                  {ev.isActive && <span style={{ background: "#ea4335", color: "#fff", fontSize: 9, padding: "1px 5px", borderRadius: 4, fontWeight: 700 }}>EN DIRECT</span>}
                </div>
              </div>
            );
          })
        )}
        <button onClick={() => openAddNote(selected)}
          style={{ width: "100%", marginTop: 14, padding: "8px", background: "none", border: "1px dashed #dadce0", borderRadius: 8, color: "#1a73e8", fontSize: 12, cursor: "pointer", fontWeight: 500 }}>
          ＋ Ajouter une note
        </button>
      </div>
    );
  };

  /* ─────────────────────────────────────────────
     RENDER
  ───────────────────────────────────────────── */
  return (
    <div style={{ height: "100vh", display: "flex", flexDirection: "column", fontFamily: "'Google Sans', Roboto, Arial, sans-serif", background: "#fff", overflow: "hidden" }}>

      {/* ══ TOP BAR ══ */}
      <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "10px 16px", borderBottom: "1px solid #e0e0e0", flexShrink: 0, background: "#fff" }}>
        {/* Hamburger + Logo */}
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <button onClick={() => setMiniCalOpen(o => !o)} style={{ background: "none", border: "none", cursor: "pointer", padding: 6, borderRadius: "50%", display: "flex" }}>
            <svg width={18} height={18} viewBox="0 0 24 24"><path d="M3 18h18v-2H3v2zm0-5h18v-2H3v2zm0-7v2h18V6H3z" fill="#5f6368"/></svg>
          </button>
          <span style={{ fontSize: 22, fontWeight: 400, color: "#3c4043", marginRight: 8 }}>Agenda</span>
        </div>

        {/* Today btn */}
        <button onClick={() => { setCurrent(new Date()); setSelected(new Date()); }}
          style={{ border: "1px solid #dadce0", background: "#fff", borderRadius: 4, padding: "6px 14px", fontSize: 13, fontWeight: 500, cursor: "pointer", color: "#3c4043" }}>
          Aujourd'hui
        </button>

        {/* Prev/Next */}
        <div style={{ display: "flex", gap: 2 }}>
          <button onClick={prev} style={navBtn}>‹</button>
          <button onClick={next} style={navBtn}>›</button>
        </div>

        {/* Title */}
        <span style={{ fontSize: 18, fontWeight: 400, color: "#3c4043", flex: 1 }}>{viewTitle()}</span>

        {/* View switcher */}
        <div style={{ display: "flex", borderRadius: 4, overflow: "hidden", border: "1px solid #dadce0" }}>
          {[["month","Mois"],["week","Semaine"],["day","Jour"]].map(([v, l]) => (
            <button key={v} onClick={() => setView(v)}
              style={{ padding: "6px 14px", border: "none", fontSize: 13, fontWeight: 500, cursor: "pointer", background: view === v ? "#e8f0fe" : "#fff", color: view === v ? "#1a73e8" : "#3c4043", borderRight: "1px solid #dadce0" }}>
              {l}
            </button>
          ))}
        </div>

        {/* Category filter */}
        <select value={filterCat} onChange={e => setFilterCat(e.target.value)}
          style={{ border: "1px solid #dadce0", borderRadius: 4, padding: "6px 10px", fontSize: 13, color: "#3c4043", background: "#fff", cursor: "pointer", outline: "none" }}>
          {["Tous","Live","Enquete","Evenement","Personnel"].map(c => (
            <option key={c} value={c}>{c === "Enquete" ? "Enquête" : c === "Evenement" ? "Événement" : c}</option>
          ))}
        </select>
      </div>

      {/* ══ BODY ══ */}
      <div style={{ flex: 1, display: "flex", overflow: "hidden" }}>

        {/* LEFT SIDEBAR */}
        {miniCalOpen && (
          <div style={{ width: 240, borderRight: "1px solid #e0e0e0", padding: 12, overflowY: "auto", flexShrink: 0 }}>
            {/* Create button */}
            <button onClick={() => openAddNote(selected)}
              style={{ display: "flex", alignItems: "center", gap: 8, padding: "10px 18px", borderRadius: 24, boxShadow: "0 1px 3px rgba(0,0,0,.3)", border: "none", background: "#fff", cursor: "pointer", marginBottom: 16, fontSize: 14, fontWeight: 500, color: "#3c4043", width: "100%" }}>
              <span style={{ fontSize: 20 }}>＋</span> Créer
            </button>
            <MiniCalendar />
            <hr style={{ border: "none", borderTop: "1px solid #e0e0e0", margin: "10px 0" }} />
            <SidebarEvents />
          </div>
        )}

        {/* MAIN CALENDAR */}
        <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>
          {view === "month" && <MonthView />}
          {view === "week"  && <WeekView />}
          {view === "day"   && <DayView />}
        </div>
      </div>

      {/* ══ MODAL ADD NOTE ══ */}
      {showModal && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,.4)", backdropFilter: "blur(4px)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 9999 }}>
          <div style={{ background: "#fff", borderRadius: 16, width: 440, maxWidth: "95vw", boxShadow: "0 24px 64px rgba(0,0,0,.25)", overflow: "hidden", animation: "calPop .2s ease" }}>
            <style>{`@keyframes calPop{from{transform:scale(.92);opacity:0}to{transform:scale(1);opacity:1}}`}</style>
            <div style={{ padding: "20px 24px", borderBottom: "1px solid #e0e0e0", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <span style={{ fontSize: 16, fontWeight: 600, color: "#202124" }}>
                Nouvel événement — {modalDate && format(modalDate, "d MMMM yyyy", { locale: fr })}
              </span>
              <button onClick={() => setShowModal(false)} style={{ background: "none", border: "none", cursor: "pointer", fontSize: 18, color: "#5f6368" }}>✕</button>
            </div>
            <div style={{ padding: "20px 24px", display: "flex", flexDirection: "column", gap: 14 }}>
              <input
                value={noteForm.title}
                onChange={e => setNoteForm(p => ({ ...p, title: e.target.value }))}
                placeholder="Titre"
                autoFocus
                style={{ border: "none", borderBottom: "1px solid #e0e0e0", padding: "6px 0", fontSize: 20, outline: "none", color: "#202124" }}
              />
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                <div>
                  <label style={{ fontSize: 12, color: "#70757a", display: "block", marginBottom: 4 }}>Heure</label>
                  <input type="time" value={noteForm.time} onChange={e => setNoteForm(p => ({ ...p, time: e.target.value }))}
                    style={{ width: "100%", padding: "8px", border: "1px solid #e0e0e0", borderRadius: 6, fontSize: 13, outline: "none" }} />
                </div>
                <div>
                  <label style={{ fontSize: 12, color: "#70757a", display: "block", marginBottom: 4 }}>Catégorie</label>
                  <select value={noteForm.category} onChange={e => setNoteForm(p => ({ ...p, category: e.target.value }))}
                    style={{ width: "100%", padding: "8px", border: "1px solid #e0e0e0", borderRadius: 6, fontSize: 13, outline: "none" }}>
                    <option value="Enquete">Enquête</option>
                    <option value="Evenement">Événement</option>
                    <option value="Personnel">Personnel</option>
                  </select>
                </div>
              </div>
              <textarea value={noteForm.text} onChange={e => setNoteForm(p => ({ ...p, text: e.target.value }))}
                placeholder="Description (optionnel)"
                style={{ border: "1px solid #e0e0e0", borderRadius: 8, padding: 10, fontSize: 13, resize: "vertical", minHeight: 80, outline: "none", fontFamily: "inherit" }} />
            </div>
            <div style={{ padding: "12px 24px 20px", display: "flex", justifyContent: "flex-end", gap: 8 }}>
              <button onClick={() => setShowModal(false)} style={{ padding: "9px 20px", border: "none", borderRadius: 4, background: "none", color: "#1a73e8", fontSize: 13, fontWeight: 600, cursor: "pointer" }}>Annuler</button>
              <button onClick={saveNote} style={{ padding: "9px 24px", border: "none", borderRadius: 4, background: "#1a73e8", color: "#fff", fontSize: 13, fontWeight: 600, cursor: "pointer" }}>Enregistrer</button>
            </div>
          </div>
        </div>
      )}

      {/* ══ DETAIL POPUP ══ */}
      {detailEvent && (
        <div style={{ position: "fixed", inset: 0, zIndex: 9998 }} onClick={() => setDetailEvent(null)}>
          <div style={{ position: "absolute", top: "30%", left: "50%", transform: "translateX(-50%)", background: "#fff", borderRadius: 12, boxShadow: "0 8px 30px rgba(0,0,0,.25)", padding: "20px 24px", minWidth: 300, maxWidth: 400 }}
            onClick={e => e.stopPropagation()}>
            <div style={{ display: "flex", alignItems: "flex-start", gap: 12, marginBottom: 12 }}>
              <div style={{ width: 12, height: 12, borderRadius: "50%", background: (CAT_COLOR[detailEvent.category] || CAT_COLOR.Personnel).bg, marginTop: 4, flexShrink: 0 }} />
              <div>
                <div style={{ fontSize: 18, fontWeight: 500, color: "#202124", marginBottom: 4 }}>{detailEvent.title}</div>
                {detailEvent.time && <div style={{ fontSize: 13, color: "#70757a" }}>🕐 {detailEvent.time}</div>}
                {detailEvent.description && <div style={{ fontSize: 13, color: "#3c4043", marginTop: 6 }}>{detailEvent.description}</div>}
                {detailEvent.text && <div style={{ fontSize: 13, color: "#3c4043", marginTop: 6 }}>{detailEvent.text}</div>}
              </div>
            </div>
            <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
              {detailEvent._type === "note" && (
                <button onClick={() => {
                    const day = selected;
                    const key = keyOf(day);
                    const idx = (notes[key] || []).findIndex(n => n.title === detailEvent.title && n.text === detailEvent.text);
                    if (idx !== -1) deleteNote(day, idx);
                  }}
                  style={{ padding: "7px 16px", border: "none", borderRadius: 4, background: "#fce8e6", color: "#ea4335", fontSize: 13, fontWeight: 600, cursor: "pointer" }}>
                  Supprimer
                </button>
              )}
              {detailEvent._type === "live" && detailEvent.streamLink && (
                <button onClick={() => {
                    const { roomCode, vt } = extractViewerInfo(detailEvent.streamLink);
                    if (roomCode && vt) navigate(`/meet/${roomCode}?vt=${vt}`);
                  }}
                  style={{ padding: "7px 16px", border: "none", borderRadius: 4, background: "#1a73e8", color: "#fff", fontSize: 13, fontWeight: 600, cursor: "pointer" }}>
                  Rejoindre le live ▶
                </button>
              )}
              <button onClick={() => setDetailEvent(null)} style={{ padding: "7px 16px", border: "none", borderRadius: 4, background: "#f1f3f4", color: "#3c4043", fontSize: 13, cursor: "pointer" }}>Fermer</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

const navBtn = {
  background: "none", border: "none", cursor: "pointer", color: "#5f6368",
  width: 32, height: 32, borderRadius: "50%", fontSize: 18,
  display: "flex", alignItems: "center", justifyContent: "center", padding: 0,
};