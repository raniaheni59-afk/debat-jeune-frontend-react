import React, { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import {
  format,
  addMonths,
  subMonths,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  isToday,
} from "date-fns";
import fr from "date-fns/locale/fr";
import { ChevronLeft, ChevronRight } from "lucide-react";
import "./CalendarPage.css";

const CalendarPage = () => {
  const location = useLocation();
  const navigate = useNavigate();

  const [currentDate, setCurrentDate] = useState(new Date());
  const [events, setEvents] = useState({});
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [selectedCategory, setSelectedCategory] = useState("Tous");

  // Notes modal
  const [showNoteModal, setShowNoteModal] = useState(false);
  const [noteTitle, setNoteTitle] = useState("");
  const [noteText, setNoteText] = useState("");
  // ✅ Notes par date
  const [notes, setNotes] = useState({});

  // ✅ Catégories (sans accent pour la logique)
  const categories = ["Tous", "Live", "Enquete", "Evenement", "Personnel"];
  const CATEGORY_CONFIG = {
  Live: { label: "Live", color: "#3b82f6" },
  Enquete: { label: "Enquête", color: "#f59e0b" },
  Evenement: { label: "Événement", color: "#8b5cf6" },
  Personnel: { label: "Personnel", color: "#10b981" },
};
  // ===============================
  // Fetch lives (SAFE)
  // ===============================
  useEffect(() => {
    const token = localStorage.getItem("token");

    if (!token) {
      console.warn("No token, skip fetch lives");
      setEvents({});
      return;
}
    const fetchLives = async () => {
      try {
        const token = localStorage.getItem("token");
        const res = await fetch(
          "https://swafy-backend.onrender.com/api/lives",
          { headers: { Authorization: `Bearer ${token}` } }
        );

        if (!res.ok) {
          setEvents({});
          return;
        }

        const lives = await res.json();
        if (!Array.isArray(lives)) {
          setEvents({});
          return;
        }

        const newEvents = {};

        lives.forEach((live) => {
          if (!live.date) return;
          const key = format(new Date(live.date), "yyyy-MM-dd");
          if (!newEvents[key]) newEvents[key] = [];

          newEvents[key].push({
            id: live.id,
            title: live.title,
            time: live.time,
            category: "Live",
          });
        });

        setEvents(newEvents);
      } catch (err) {
        console.error(err);
        setEvents({});
      }
    };

    fetchLives();
  }, [location.key]);

  // ===============================
  // Helpers
  // ===============================
  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(currentDate);
  const days = eachDayOfInterval({ start: monthStart, end: monthEnd });

  const eventsOfDay = () => {
  const key = format(selectedDate, "yyyy-MM-dd");

  const liveEvents = (events[key] || []).map(e => ({
  ...e,
  color: CATEGORY_CONFIG[e.category]?.color,
}));
 const noteEvents = (notes[key] || []).map((n, i) => ({
  id: `note-${i}`,
  title: n.title,
  time: "Note",
  category: n.category,
  color: CATEGORY_CONFIG[n.category]?.color,
}));

  const merged = [...liveEvents, ...noteEvents];

  if (selectedCategory === "Tous") return merged;
  return merged.filter((e) => e.category === selectedCategory);
  };

  // ===============================
  // Render
  // ===============================
  return (
    <div className="calendar-layout">
      {/* ===== CALENDRIER PRINCIPAL ===== */}
      <div className="calendar-main">
        <div className="calendar-header">
          <div>
            <h1>{format(currentDate, "MMMM yyyy", { locale: fr })}</h1>
            <p>{format(new Date(), "EEEE dd MMMM yyyy", { locale: fr })}</p>
          </div>


          <div className="calendar-nav">
            <button onClick={() => setCurrentDate(subMonths(currentDate, 1))}>
              <ChevronLeft />
            </button>
            <button onClick={() => setCurrentDate(new Date())}>
              Aujourd’hui
            </button>
            <button onClick={() => setCurrentDate(addMonths(currentDate, 1))}>
              <ChevronRight />
            </button>
          </div>
        </div>

        <div className="big-calendar">
          {days.map((day) => {
            const key = format(day, "yyyy-MM-dd");
            const hasEvent = (events[key] || []).length > 0;
            return (
             <div
              key={key}
             onClick={() => {
              setSelectedDate(day);

              const key = format(day, "yyyy-MM-dd");
              const hasLive = (events[key] || []).length > 0;
              const hasNote = (notes[key] || []).length > 0;

              // ✅ إذا النهار فارغ → افتح modal مباشرة
              if (!hasLive && !hasNote) {
                setShowNoteModal(true);
  }
}}
              className={`calendar-day ${
                format(day, "yyyy-MM-dd") ===
                format(selectedDate, "yyyy-MM-dd")
                  ? "selected"
                  : ""
              }`}
            >
                <span className={isToday(day) ? "today" : ""}>
                  {format(day, "d")}
                </span>
                {hasEvent && <div className="dot" />}
              </div>
            );
          })}
        </div>
      </div>

      {/* ===== PANNEAU DROIT ===== */}
      <div className="calendar-panel">
        {/* Choix date */}
        <div className="panel-box">
          <label> Choisir une date</label>
          <input
            type="date"
            value={format(selectedDate, "yyyy-MM-dd")}
            onChange={(e) => setSelectedDate(new Date(e.target.value))}
          />
        </div>
       
        {/* Catégories */}
        <div className="panel-box">
          <label>🏷 Catégories</label>
          <div className="category-grid">
            {categories.map((c) => (
              <button
                key={c}
                className={selectedCategory === c ? "active" : ""}
                onClick={() => setSelectedCategory(c)}
              >
                {c}
              </button>
            ))}
          </div>
        </div>

        {/* Liste événements */}
        <div className="panel-box">
          <label> Événements</label>
          {eventsOfDay().length > 0 && (
            <button
              style={{ marginBottom: 10 }}
              onClick={() => setShowNoteModal(true)}
            >
              ➕ Ajouter une note
            </button>
          )}

          {eventsOfDay().map((ev) => (
            <div
              key={ev.id}
              className="event-item"
              onClick={() =>
                navigate("/admin/live", { state: { recentLive: ev } })
              }
            >
              <strong>{ev.title}</strong>
              <span>{ev.time || "—"}</span>
            </div>
          ))}
        </div>
      </div>

      {/* ===== MODAL NOTE ===== */}
      {showNoteModal && (
        <div className="note-overlay">
          <div className="note-modal">
            <h3>
               Note –{" "}
              {format(selectedDate, "dd MMMM yyyy", { locale: fr })}
            </h3>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
            >
              <option value="">-- Choisir une catégorie --</option>
              <option value="Enquete">Enquête</option>
              <option value="Evenement">Événement</option>
              <option value="Personnel">Personnel</option>
            </select>
            <input
            
              type="text"
              placeholder="Titre de la note"
              value={noteTitle}
              onChange={(e) => setNoteTitle(e.target.value)}
            />

            <textarea
              placeholder="Écrire votre note ici..."
              value={noteText}
              onChange={(e) => setNoteText(e.target.value)}
            />

            <div className="note-actions">
              <button
                className="cancel"
                onClick={() => {
                  setShowNoteModal(false);
                  setNoteTitle("");
                  setNoteText("");
                }}
              >
                Annuler
              </button>

              <button
                className="confirm"
                onClick={() => {
                const key = format(selectedDate, "yyyy-MM-dd");
                setNotes((prev) => ({
                    ...prev,
                    [key]: [
                      ...(prev[key] || []),
                     {
                        title: noteTitle,
                        text: noteText,
                        category: selectedCategory,
                      }
                    ],
                  }));

                  setShowNoteModal(false);
                  setNoteTitle("");
                  setNoteText("");


                  setShowNoteModal(false);
                  setNoteTitle("");
                  setNoteText("");
                }}
              >
                Confirmer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CalendarPage;
