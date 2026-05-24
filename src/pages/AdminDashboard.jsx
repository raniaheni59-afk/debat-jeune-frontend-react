import CalendarPage from "./CalendarPage";
import AdminContact from "./AdminContact";
import NewLive from "./NewLive";
import AdminLiveStream from "./AdminLiveStream";
import Swafy_Meet from "./Swafy_Meet";
import ArchivePage from "./ArchivePage";
import ParametrePage from "./ParametrePage";
import { useLang } from "../i18n/LanguageContext";
import ParametreContact from "./ParametreContact";
import PublierPage from "./PublierPage";
import Acceuil from "./Acceuil";
import AdminEnquete from "./AdminEnquete";
import Suivi from "./Suivi";
import Participants from "../pages/Participants";
import { useNavigate } from "react-router-dom";
import Notifications from "../pages/Notifications";
import { useLocation } from "react-router-dom";
import { useState, useEffect, useRef, useCallback } from "react";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Filler,
  Tooltip,
  Legend,
} from "chart.js";
import { Line, Bar, Doughnut } from "react-chartjs-2";
import API from "../services/api";

ChartJS.register(
  CategoryScale, LinearScale, PointElement, LineElement,
  BarElement, ArcElement, Filler, Tooltip, Legend
);
export default function AdminDashboard() {
  const user = JSON.parse(localStorage.getItem("user"));
  const navigate = useNavigate();
  const { t } = useLang();
  const [activePage, setActivePage] = useState("dashboard");
  const [calSplash, setCalSplash] = useState(false);
  const [archiveSplash, setArchiveSplash] = useState(false);
  const [paramSplash, setParamSplash] = useState(false);
  const [sidebarVisible, setSidebarVisible] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [highlightedCard, setHighlightedCard] = useState(null);
  const [year, setYear] = useState(2026);
  const [period, setPeriod] = useState("7");
  const [toasts, setToasts] = useState([]);
  const toastId = useRef(0);
  const [participantCount, setParticipantCount] = useState(0);
  const [editModal, setEditModal] = useState({ open: false, mode: "", targetId: null, data: {} });
  const [addChartModal, setAddChartModal] = useState(false);
  const [confirmDel, setConfirmDel] = useState({ open: false, id: null, title: "" });
  const [newChart, setNewChart] = useState({ type: "line", title: "" });
  const [charts, setCharts] = useState([
    {
      id: "chart-event",
      type: "line",
      title: "Événements par Gouvernorat (par an)",
      keywords: "evenement Gouvernaurat tunisie annuel statistique",
      labels: [
        "Tunis","Ariana","Ben Arous","Manouba",
        "Nabeul","Zaghouan","Bizerte",
        "Béja","Jendouba","Kef","Siliana",
        "Sousse","Monastir","Mahdia",
        "Sfax","Kairouan","Kasserine","Sidi Bouzid",
        "Gabes","Mednine","Tataouine",
        "Gafsa","Tozeur","Kebili"
      ],
      datasets: [
        {
          label: "Nombre d'événements / an",
          data: [4,6,3,7,2,5,4,6,3,2,4,7,5,6,8,4,3,5,2,6,4,3,2,1],
          color: "#4285f4",
          dashed: false,
        },
      ],
    },
  
    {
  id: "chart-enquete-satisfaction",
  type: "line",
  title: "Évolution de la satisfaction (Enquête)",
  keywords: "enquete satisfaction evolution",
  labels: [],
  datasets: [
    {
      label: "Satisfaction moyenne",
      data: [],
      color: "#7c5cbf",
      dashed: false,
    },
    {
      label: "Nb réponses",
      data: [],
      color: "rgba(231,76,60,0.7)",
      dashed: true,
    },
  ],
},

  ]);

  const [statCards, setStatCards] = useState([
    {
      id:"stat-participant", label:"Nombre participant", value:0,
      gradient:"linear-gradient(135deg,#3498db,#2980b9)",
      keywords:"nombre participant nbr jeune bleu users", autoSync:true,
    },
    {
      id:"stat-gouvernant", label:"Nombre gouvernant", value:24,
      gradient:"linear-gradient(135deg,#6ab04c,#78c850)",
      keywords:"nombre gouvernant vert admin", autoSync:false,
    },
  ]);
  
const fetchGouvernoratStats = useCallback(async () => {
  try {
    const res = await API.get(`/events/stats-gouvernorat?year=${year}`);

    const data = new Array(24).fill(0);

    res.data.forEach((e) => {
      const i = e.id_gouvernorat - 1;
      if (i >= 0 && i < 24) data[i] = e.total;
    });

    setCharts((prev) =>
      prev.map((c) =>
        c.id === "chart-event"
          ? { ...c, datasets: [{ ...c.datasets[0], data }] }
          : c
      )
    );
  } catch (err) {
    console.error(" fetchGouvernoratStats error", err);
  }
}, [year]);
  const lastScrollY  = useRef(0);
  const prevDir      = useRef(null);
  const suggestTimer = useRef(null);

  // ── CSS injection ──
  useEffect(() => {
    const style = document.createElement("style");
    style.textContent = `
      @import url('https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;500;600;700;800&display=swap');
      @keyframes toastSlide{from{transform:translateX(120%);opacity:0}to{transform:translateX(0);opacity:1}}
      @keyframes fadeUp{from{opacity:0;transform:translateY(18px)}to{opacity:1;transform:translateY(0)}}
      @keyframes glow{0%,100%{box-shadow:0 0 0 3px rgba(142,114,209,.3)}50%{box-shadow:0 0 0 6px rgba(142,114,209,.15)}}
      @keyframes pulse{0%,100%{transform:scale(1)}50%{transform:scale(1.015)}}
      *{box-sizing:border-box;margin:0;padding:0}
      body{font-family:'Poppins',sans-serif}
      ::-webkit-scrollbar{width:6px}
      ::-webkit-scrollbar-track{background:transparent}
      ::-webkit-scrollbar-thumb{background:rgba(124,92,191,.3);border-radius:3px}
    `;
    document.head.appendChild(style);
    return () => document.head.removeChild(style);
  }, []);

 // ── Update Stat Card when participantCount changes ──
useEffect(() => {
  setStatCards((prev) =>
    prev.map((card) =>
      card.id === "stat-participant"
        ? { ...card, value: participantCount }
        : card
    )
  );
}, [participantCount]);

 useEffect(() => {
  const sync = async () => {
    try {
      const res = await API.get("/users/count/jeune-profiles");
      if (res.data?.count != null) {
       setParticipantCount(res.data.count); 
       console.log(" participantCount =", res.data.count);
      }
    } catch {}
  };

  sync();
  const interval = setInterval(sync, 30000);
  return () => clearInterval(interval);
}, []);

  // ── Scroll → sidebar hide/show ──
  useEffect(() => {
    const onScroll = () => {
      const y = window.scrollY;
      const dir = y > lastScrollY.current ? "down" : "up";
      if (dir !== prevDir.current && y > 80) {
        setSidebarVisible(dir === "up");
        prevDir.current = dir;
      }
      lastScrollY.current = y;
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);
  useEffect(() => {
  if (activePage !== "calendrier") return;

  setCalSplash(true);
  const t = setTimeout(() => {
    setCalSplash(false);
  }, 2000);

  return () => clearTimeout(t);
}, [activePage]);

  // ── FETCH DES EVENEMENTS DEPUIS LA BASE DE DONNEES ──
  // ── Chargement des statistiques des événements par gouvernorat ──
 const fetchEnqueteSatisfaction = useCallback(async () => {
  console.log(" fetchEnqueteSatisfaction CALLED");

  setCharts((prev) =>
    prev.map((chart) =>
      chart.id === "chart-enquete-satisfaction"
        ? {
            ...chart,
            labels: ["Jan", "Feb", "Mar", "Apr"],
            datasets: [
              { ...chart.datasets[0], data: [5, 4, 3, 4] },
              { ...chart.datasets[1], data: [2, 3, 1, 4] },
            ],
          }
        : chart
    )
  );
}, []);


useEffect(() => {
  fetchGouvernoratStats();
}, [fetchGouvernoratStats]);


useEffect(() => {
  fetchEnqueteSatisfaction();
}, [fetchEnqueteSatisfaction]);
useEffect(() => {
  if (activePage !== "archive") return;

  setArchiveSplash(true);
  const t = setTimeout(() => {
    setArchiveSplash(false);
  }, 2000);

  return () => clearTimeout(t);
}, [activePage]);

useEffect(() => {
  if (activePage !== "parametre") return;

  setParamSplash(true);
  const t = setTimeout(() => {
    setParamSplash(false);
  }, 2000);

  return () => clearTimeout(t);
}, [activePage]);
useEffect(() => {
  setCharts(prev =>
    prev.map(chart =>
      chart.id === "chart-donut"
        ? {
            ...chart,
            datasets: [
              {
                ...chart.datasets[0],
                data: [participantCount, 0, 0], 
              },
            ],
          }
        : chart
    )
  );
}, [participantCount]);
  // ── Toast ──
  const toast = useCallback((msg, type = "success") => {
    const id = ++toastId.current;
    setToasts((p) => [...p, { id, msg, type }]);
    setTimeout(() => setToasts((p) => p.filter((t) => t.id !== id)), 3500);
  }, []);

  // ── Navigation ──
  const goTo = (page) => {
    setActivePage(page);
    setSearchQuery("");
    setHighlightedCard(null);
  };

  const logout = () => {
    toast(" Déconnexion...");
    setTimeout(() => {
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      navigate("/");
    }, 800);
  };
  
  // ── Search ──
  const allSearchable = [
    ...charts.map((c) => ({
      id: c.id, label: c.title, kw: c.keywords,
      icon: c.type === "line" ? "📈" : c.type === "bar" ? "📊" : "🍩",
    })),
    
    ...statCards.map((s) => ({
      id: s.id, label: `${s.label} (${s.value.toLocaleString()})`,
      kw: s.keywords, icon: "💳",
    })),
  ];

  const matchSearch = (kw) => {
    if (!searchQuery.trim()) return true;
    return kw.toLowerCase().includes(searchQuery.toLowerCase());
  };

  const handleSearch = (val) => {
    setSearchQuery(val);
    setShowSuggestions(val.trim().length > 0);
    if (val.trim() && activePage !== "dashboard") setActivePage("dashboard");
    if (!val.trim()) setHighlightedCard(null);
  };

  const suggestions = allSearchable.filter(
    (i) =>
      i.kw.toLowerCase().includes(searchQuery.toLowerCase()) ||
      i.label.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const pickSuggestion = (id) => {
    setActivePage("dashboard");
    setSearchQuery("");
    setShowSuggestions(false);
    setHighlightedCard(id);
    setTimeout(() => {
      document.getElementById(id)?.scrollIntoView({ behavior:"smooth", block:"center" });
    }, 100);
    setTimeout(() => setHighlightedCard(null), 3500);
  };

  const changeYear = (dir) => {
    const y = year + dir;
    setYear(y);
    toast(` Année ${y} chargée`);
  };

  // ── Chart CRUD ──
const openEditChart = (chart) => {
  const copy = JSON.parse(JSON.stringify(chart));
  copy.labels.push(""); // Ajouter un nouveau label vide
  if (copy.type === "doughnut") { 
    copy.datasets[0].data.push(0); 
    copy.datasets[0].colors.push("#3b82f6"); 
  } else {
    copy.datasets.forEach((ds) => ds.data.push(0)); // Ajouter 0 pour chaque série
  }
  setEditModal({ open:true, mode:"edit-chart", targetId:chart.id, data:copy });
};

const openAddData = (chart) => {
  const copy = JSON.parse(JSON.stringify(chart));
  copy.labels.push("");
  if (copy.type === "doughnut") { copy.datasets[0].data.push(0); copy.datasets[0].colors.push("#3b82f6"); }
  else copy.datasets.forEach((ds) => ds.data.push(0));
  setEditModal({ open:true, mode:"add-data", targetId:chart.id, data:copy });
}; 

  const openEditStat = (stat) =>
    setEditModal({ open:true, mode:"edit-stat", targetId:stat.id, data:{ ...stat } });

  const saveModal = async () => {
  const { mode, targetId, data } = editModal;

  console.log(" SAVE clicked");
  console.log("mode:", mode);
  console.log("targetId:", targetId);
  console.log("data:", data);

  if (targetId === "chart-event" && mode === "add-data") {
    try {
      const payload = {
        titre_evenement: data.titre_evenement,
        id_gouvernorat: data.id_gouvernorat ?? 1,
        date_evenement: data.date_evenement,
        id_user: user?.id_user || user?.id || user?.userId,
      };

      console.log(" Payload à envoyer :", JSON.stringify(payload, null, 2));

      if (
        !payload.titre_evenement?.trim() ||
        !payload.id_gouvernorat ||
        !payload.date_evenement
      ) {
        toast(" Tous les champs sont obligatoires.", "error");
        return;
      }

      const token = localStorage.getItem("token");

      const response = await API.post("/events", payload, {
        headers: { Authorization: `Bearer ${token}` },
      });
      
      console.log(" Réponse backend :", response.data);

      toast(" Événement ajouté avec succès !");
      await fetchGouvernoratStats();
      closeModal();
      return;
    } catch (error) {
      console.error(" Erreur ajout événement :", {
        message: error.message,
        status: error.response?.status,
        data: error.response?.data,
      });

      toast(
        error.response?.data?.message ||
          " Erreur serveur lors de l'ajout de l'événement",
        "error"
      );
      return; 
    }
  }
  if (mode === "edit-stat" && targetId?.startsWith("stat-")) {
    setStatCards((p) =>
      p.map((s) =>
        s.id === targetId
          ? { ...s, label: data.label, value: parseInt(data.value, 10) || 0 }
          : s
      )
    );
    toast(" Stat modifié");
    closeModal();
    return;
  }

  
  if ((mode === "edit-chart" || mode === "add-data") && targetId) {
    setCharts((p) => p.map((c) => (c.id === targetId ? data : c)));
    toast(" Diagramme mis à jour");
    closeModal();
    return;
  }

  //  fallback
  closeModal();
};
  const closeModal = () => setEditModal({ open:false, mode:"", targetId:null, data:{} });

  const deleteChart = () => {
    setCharts((p) => p.filter((c) => c.id !== confirmDel.id));
    setConfirmDel({ open:false, id:null, title:"" });
    toast(" Diagramme supprimé");
  };

  const createChart = () => {
    const id    = `chart-${Date.now()}`;
    const title = newChart.title.trim() || `Nouveau ${newChart.type}`;
    let c;
    switch (newChart.type) {
      case "line":
        c = { id, type:"line", title, keywords:title.toLowerCase(),
              labels:["Jan","Fev","Mar","Avr"],
              datasets:[{ label:"Données", data:[0,0,0,0], color:"#4285f4", dashed:false }] };
        break;
      case "bar":
        c = { id, type:"bar", title, keywords:title.toLowerCase(),
              labels:["A","B","C","D"],
              datasets:[{ label:"Série 1", data:[0,0,0,0], color:"rgba(66,133,244,0.7)" }] };
        break;
      case "doughnut":
        c = { id, type:"doughnut", title, keywords:title.toLowerCase(),
              labels:["Cat 1","Cat 2","Cat 3"],
              datasets:[{ data:[33,33,34], colors:["#4a5568","#7c5cbf","#ec4899"] }] };
        break;
      default: return;
    }
    setCharts((p) => [...p, c]);
    setAddChartModal(false);
    setNewChart({ type:"line", title:"" });
    toast(" Nouveau diagramme créé !");
  };

  // ── Chart builders ──
  const buildData = (chart) => {
    if (chart.type === "line") {
      return {
        labels: chart.labels,
        datasets: chart.datasets.map((ds) => ({
          label: ds.label, data: ds.data, borderColor: ds.color,
          backgroundColor: ds.dashed ? "transparent" : `${ds.color}12`,
          tension: 0.4, fill: !ds.dashed,
          borderWidth: ds.dashed ? 2 : 2.5,
          borderDash: ds.dashed ? [6,4] : [],
          pointRadius: 4, pointBackgroundColor: ds.color,
          pointBorderColor: "#fff", pointBorderWidth: 2, pointHoverRadius: 7,
        })),
      };
    }
    if (chart.type === "bar") {
      return {
        labels: chart.labels,
        datasets: chart.datasets.map((ds) => ({
          label: ds.label, data: ds.data, backgroundColor: ds.color,
          borderRadius: 6, borderSkipped: false,
        })),
      };
    }
    return {
      labels: chart.labels,
      datasets: [{
        data: chart.datasets[0].data, backgroundColor: chart.datasets[0].colors,
        borderWidth: 3, borderColor: "#fff", hoverOffset: 10,
      }],
    };
  };

  const opts = {
    line: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: { legend: { display: false } },
      scales: {
        y: {
          beginAtZero: true,
          suggestedMax: 10,
          ticks: { stepSize: 1, precision: 0, font: { size: 11 }, color: "#aaa" },
          grid: { color: "rgba(0,0,0,0.04)" },
        },
        x: {
          ticks: { font: { size: 10 }, color: "#aaa" },
          grid: { display: false },
        },
      },
      interaction: { intersect: false, mode: "index" },
    },
    bar: {
      responsive:true, maintainAspectRatio:false,
      plugins:{ legend:{ display:false } },
      scales:{
        y: {
          type: "linear", min: 1, max: 10, beginAtZero: false,
          ticks: { stepSize: 1, precision: 0, font: { size: 11 }, color: "#aaa" },
          title: { display: true, text: "Nombre d'événements / an" },
          grid: { color: "rgba(0,0,0,0.04)" }
        },
        x:{ ticks:{ font:{size:10}, color:"#aaa" }, grid:{ display:false } },
      },
    },
    doughnut: {
      responsive:true, maintainAspectRatio:false, cutout:"60%",
      plugins:{ legend:{ position:"bottom", labels:{ padding:16, usePointStyle:true, pointStyle:"circle", font:{size:12} } } },
    },
  };

  const eventLineOpts = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: { legend: { display: false } },
    scales: {
      y: {
        type: "linear", min: 1, max: 10, bounds: "ticks", grace: 0,
        ticks: { stepSize: 1, precision: 0, callback: (v) => v, font: { size: 11 }, color: "#aaa" },
        title: { display: true, text: "Nombre d'événements / an" },
        grid: { color: "rgba(0,0,0,0.04)" }
      },
      x: {
        ticks: { autoSkip: false, maxRotation: 60, minRotation: 60, font: { size: 10 }, color: "#aaa" },
        grid: { display: false }
      }
    }
  };
  const Comp = { line:Line, bar:Bar, doughnut:Doughnut }; 
const navItems = [
  { key:"acceuil",      label: t("acceuil") },
   { key:"statistique",  label:"Suivi" },
  { key:"dashboard",    label: t("dashboard") },
  { key:"messages",     label: t("messages") },
  { key:"publier",      label: t("publier") },
  { key:"calendrier",   label: t("calendrier") },
  { key:"swafyMeet",    label: "Swafy Meet" }, 
  { key:"live",         label: t("live"), isLive:true },
  { key:"participant",  label: t("participants") },
  { key:"notification", label: t("notifications") },
  { key:"archive",      label: t("archive") },
  { key:"parametre",    label: t("parametre") },
  { key: "enquetes",    label: "Enquêtes" },



];
const emptyPages={};
  // ── Helpers ──
  const cardStyle = (id, kw, extra = {}) => {
    const base = { ...S.card, ...extra };
    if (highlightedCard === id)
      return { ...base, boxShadow:"0 0 0 3px #8e72d1,0 8px 30px rgba(100,70,180,.25)", animation:"glow 1.5s ease infinite" };
    if (searchQuery.trim() && !matchSearch(kw))
      return { ...base, opacity:0.06, transform:"scale(0.96)", pointerEvents:"none", filter:"blur(2px)" };
    return base;
  };

  const updateModalData = (updater) =>
    setEditModal((p) => ({ ...p, data: updater(p.data) }));

  const removeRow = (i) => {
    updateModalData((d) => {
      const copy = JSON.parse(JSON.stringify(d));
      copy.labels.splice(i, 1);
      if (copy.type === "doughnut") { copy.datasets[0].data.splice(i,1); copy.datasets[0].colors.splice(i,1); }
      else copy.datasets.forEach((ds) => ds.data.splice(i,1));
      return copy;
    });
  };

  const addRow = () => {
    updateModalData((d) => {
      const copy = JSON.parse(JSON.stringify(d));
      copy.labels.push("");
      if (copy.type === "doughnut") { copy.datasets[0].data.push(0); copy.datasets[0].colors.push("#3b82f6"); }
      else copy.datasets.forEach((ds) => ds.data.push(0));
      return copy;
    });
  };

  const firstChart = charts[0] || null;
  const restCharts = charts.slice(1);
  const fullPages = [
  "acceuil",
  "messages",
  "publier",
  "newlive",
  "live",
  "swafyMeet",
  "archive",
  "parametre" ,
  "parametreContact",
  "enquetes",
  "notification",
  "statistique",
];
  const isFullPage = fullPages.includes(activePage);
  /* ═════════════════════════════════
     R E N D E R
  ════════════════════════════════════ */
  return (
    <div style={S.wrapper}>

      {/* ── TOASTS ── */}
      <div style={S.toastBox}>
        {toasts.map((t) => (
          <div key={t.id} style={{
            ...S.toast,
            borderLeftColor: t.type==="warning"?"#f59e0b":t.type==="error"?"#ef4444":"#7c5cbf",
            animation:"toastSlide .4s ease",
          }}>
            {t.msg}
          </div>
        ))}
      </div>

      {/* ── FAB ── */}
      {!sidebarVisible && (
        <button style={S.fab} onClick={() => setSidebarVisible(true)}>☰</button>
      )}

      {/* ── SIDEBAR ── */}
      <aside style={{
        ...S.sidebar,
        transform: sidebarVisible ? "translateX(0)" : "translateX(-100%)",
        opacity:   sidebarVisible ? 1 : 0,
      }}>
        <button style={S.menuBtn} onClick={() => setSidebarVisible(!sidebarVisible)}>
          ☰ Menu
        </button>

        <div style={S.navList}>
          {navItems.map((n) => (
            <button
              key={n.key}
              style={{ ...S.navItem, ...(activePage === n.key ? S.navActive : {}) }}
              onClick={() => goTo(n.key)}
            >
              <span style={{ width:24, textAlign:"center", fontSize:16 }}>
                {n.isLive ? <span style={S.liveBadge}>LIVE</span> : n.icon}
              </span>
              <span>{n.label}</span>
              {n.badge && <span style={S.badge}>{n.badge}</span>}
            </button>
          ))}
        </div>

        <button style={S.exitBtn} onClick={logout}> {t("logout")}</button>
      </aside>
     
{/* ══════════════════════════════════
     A C C U E I L  ✅
══════════════════════════════════ */}
{activePage === "acceuil" && (
  <div
    style={{
      marginLeft: sidebarVisible ? 240 : 0,
      transition: "margin-left .5s cubic-bezier(.4,0,.2,1)",
      minHeight: "100vh",
      background: "#f8f7fc",
    }}
  >
    <Acceuil />
  </div>
)}

      {/* ══════════════════════════════════
           MESSAGES PAGE
      ══════════════════════════════════ */}
      {activePage === "messages" && (
        <div style={{
          marginLeft: sidebarVisible ? 240 : 0,
          transition: "margin-left .5s cubic-bezier(.4,0,.2,1)",
          minHeight: "100vh",
        }}>
         <AdminContact setActivePage={setActivePage} />
        </div>
      )}


      {/* ══════════════════════════════════
           NEW LIVE PAGE ✅
      ══════════════════════════════════ */}
      {activePage === "newlive" && (
        <div style={{
          marginLeft: sidebarVisible ? 240 : 0,
          transition: "margin-left .5s cubic-bezier(.4,0,.2,1)",
          minHeight: "100vh",
        }}>
          <NewLive
            onSuccess={() => {
              toast("✅ Le live a été enregistré avec succès !");
              setActivePage("live");
            }}
            onError={() => {
              toast("❌ Le live n'est pas enregistré. Veuillez réessayer.", "error");
            }}
            onCancel={() => setActivePage("dashboard")}
          />
        </div>
      )}
      {/* ══════════════════════════════════
     LIVE ✅
══════════════════════════════════ */}
{activePage === "live" && (
  <div
    style={{
      marginLeft: sidebarVisible ? 240 : 0,
      transition: "margin-left .5s cubic-bezier(.4,0,.2,1)",
      minHeight: "100vh",
      background: "#f8f7fc",
      padding: "30px 40px",
    }}
  >
    <AdminLiveStream />
  </div>
)}

{activePage === "swafyMeet" && (
  <div
    style={{
      marginLeft: sidebarVisible ? 240 : 0,
      transition: "margin-left .5s cubic-bezier(.4,0,.2,1)",
      minHeight: "100vh",
      background: "#fff",
    }}
  >
    <Swafy_Meet onNouvelleReunion={() => setActivePage("newlive")} />
  </div>
)}
{activePage === "archive" && (
  <>
    {archiveSplash && (
      <>
        <style>{`
          .archive-splash {
            position: fixed;
            inset: 0;
            background: #ffffff;
            display: flex;
            align-items: center;
            justify-content: center;
            z-index: 99999;
          }
          .archive-splash img {
            width: 150px;
            animation: splashAnim 2s ease forwards;
          }
        `}</style>
        <div className="archive-splash">
          <img src={`/archive.png?v=${Date.now()}`} alt="archive" />
        </div>
      </>
    )}

    <div
      style={{
        marginLeft: sidebarVisible ? 240 : 0,
        transition: "margin-left .5s cubic-bezier(.4,0,.2,1)",
        minHeight: "100vh",
        background: "#f8f7fc",
        padding: "30px 40px",
      }}
    >
      <ArchivePage />
    </div>
  </>
)}
{activePage === "parametre" && (
  <>
    {paramSplash && (
      <>
        <style>{`
          .param-splash {
            position: fixed;
            inset: 0;
            background: #ffffff;
            display: flex;
            align-items: center;
            justify-content: center;
            z-index: 99999;
          }
          .param-splash img {
            width: 150px;
            animation: splashAnim 2s ease forwards;
          }
          @keyframes splashAnim {
            0% { transform: scale(.6); opacity: 0; }
            25% { transform: scale(1); opacity: 1; }
            75% { transform: scale(1); opacity: 1; }
            100% { transform: scale(.9); opacity: 0; }
          }
        `}</style>
        <div className="param-splash">
          <img src={`/parametre.png?v=${Date.now()}`} alt="parametre" />
        </div>
      </>
    )}

    <div
      style={{
        marginLeft: sidebarVisible ? 240 : 0,
        transition: "margin-left .5s cubic-bezier(.4,0,.2,1)",
        minHeight: "100vh",
        background: "#f6f5ff",
      }}
    >
      <ParametrePage />
    </div>
  </>
)}
{activePage === "parametreContact" && (
  <div
    style={{
      marginLeft: sidebarVisible ? 240 : 0,
      transition: "margin-left .5s",
      minHeight: "100vh",
      background: "#f8f7fc",
    }}
  >
    <ParametreContact onBack={() => setActivePage("messages")} />
  </div>
)}
  
{/* ══════════════════════════════════
     P U B L I E R   P A G E ✅
══════════════════════════════════ */}
{activePage === "publier" && (
  <div
    style={{
      marginLeft: sidebarVisible ? 240 : 0,
      transition: "margin-left .5s cubic-bezier(.4,0,.2,1)",
      minHeight: "100vh",
      background: "#f8f7fc",
    }}
  >
    <PublierPage
  onBack={() => setActivePage("dashboard")}
  onSuccess={() => {
    toast("✅ Publication créée avec succès !");
    setActivePage("dashboard");
  }}
  onCancel={() => setActivePage("dashboard")}
/>
  </div>
)}
  {activePage === "participant" && (
      <div
        style={{
          marginLeft: sidebarVisible ? 240 : 0,
          transition: "margin-left .5s",
          minHeight: "100vh",
          background: "#f8f7fc",
          padding: "30px 40px",
        }}
      >
        <Participants />
      </div>
    )}
 {/* ══════════════════════════════════
          enquetes
      ═════════════════════════════════ */}

      {activePage === "enquetes" && (
        <div
          style={{
            marginLeft: sidebarVisible ? 240 : 0,
            transition: "margin-left .5s",
            minHeight: "100vh",
            background: "#f8f7fc"
          }}
        >
          <AdminEnquete />
        </div>
      )}
      {/* ══════════════════════════════════
     NOTIFICATIONS 
        ══════════════════════════════════ */}
        {activePage === "notification" && (
          <div
            style={{
              marginLeft: sidebarVisible ? 240 : 0,
              transition: "margin-left .5s",
              minHeight: "100vh",
              background: "#f8f7fc",
              padding: "30px 40px",
            }}
          >
            <Notifications onBack={() => setActivePage("dashboard")} />
          </div>
        )}
      {/* ══════════════════════════════════
           EMPTY PAGES
      ══════════════════════════════════ */}
      {!isFullPage &&
       activePage !== "dashboard" &&
       emptyPages[activePage] && (
        <div style={{
          ...S.empty,
          marginLeft: sidebarVisible ? 240 : 0,
          transition: "margin-left .5s cubic-bezier(.4,0,.2,1)",
        }}>
          <div style={S.emptyIco}>{emptyPages[activePage].icon}</div>
         <h2 style={S.emptyH}>{t(activePage)}</h2>
         <p style={S.emptyP}>{t(`${activePage}_desc`)}</p>
        </div>
      )}
     {activePage === "statistique" && (
  <div style={{ marginLeft: sidebarVisible ? 240 : 0, transition:"margin-left .5s", minHeight:"100vh" }}>
    <Suivi goDashboard={() => setActivePage("dashboard")} />
  </div>
  )}
      {/* ══════════════════════════════════
           M A I N  (dashboard)
      ══════════════════════════════════ */}
      {!isFullPage && (
        <div style={{ ...S.main, marginLeft: sidebarVisible ? 240 : 0 }}>

          {/* TOP BAR */}
          <div style={S.topBar}>
            <div style={S.searchWrap}>
              <span style={S.sIcon}>🔍</span>
              <input
                type="text"
                placeholder="Search..."
                value={searchQuery}
                onChange={(e) => handleSearch(e.target.value)}
                onFocus={() => searchQuery.trim() && setShowSuggestions(true)}
                onBlur={() => { suggestTimer.current = setTimeout(() => setShowSuggestions(false), 200); }}
                style={S.sInput}
              />
              {showSuggestions && (
                <div style={S.suggestBox}>
                  {suggestions.length > 0 ? (
                    suggestions.map((s) => (
                      <div key={s.id} style={S.suggestItem}
                        onMouseDown={() => { clearTimeout(suggestTimer.current); pickSuggestion(s.id); }}>
                        <span>{s.icon}</span><span>{s.label}</span>
                      </div>
                    ))
                  ) : (
                    <div style={S.suggestItem}>🔍 Aucun résultat pour « {searchQuery} »</div>
                  )}
                </div>
              )}
            </div>
            <div style={S.userArea}>
              <div style={S.avatar}>{user?.nom_user?.charAt(0)?.toUpperCase() || "A"}</div>
              <span style={{ fontSize:13, fontWeight:600, color:"#fff" }}>{user?.nom_user || "Admin"}</span>
            </div>
          </div>
         {activePage === "calendrier" && (
          <div
            style={{
              width: "100%",
              height: "calc(100vh - 100px)", // يخليها تملى الشاشة
              background: "#f8f7fc",
              borderRadius: "18px",
              overflow: "hidden"
            }}
          >
            <CalendarPage />
          </div>
        )}
          {/* ── DASHBOARD ── */}
          {activePage === "dashboard" && (
            <div style={{ animation:"fadeUp .5s ease" }}>
              {/* ROW 1 */}
              <div style={S.row1}>
                {firstChart && (() => {
                  const C = Comp[firstChart.type];
                  return (
                    <div id={firstChart.id}
                      style={cardStyle(firstChart.id, firstChart.keywords, { flex:1.6, padding:24 })}>
                      <div style={S.hdr}>
                        <span style={S.hdrTitle}>{firstChart.title}</span>
                        <div style={S.yearNav}>
                          <button style={S.yBtn} onClick={() => changeYear(-1)}>◀</button>
                          <span style={S.yLabel}>{year}</span>
                          <button style={S.yBtn} onClick={() => changeYear(1)}>▶</button>
                        </div>
                        <select style={S.sel} value={period}
                          onChange={(e) => { setPeriod(e.target.value); toast(`📆 Période : ${e.target.value} jours`); }}>
                          <option value="7">7 days</option>
                          <option value="30">30 days</option>
                          <option value="90">90 days</option>
                        </select>
                      </div>
                      <div style={{ height:220 }}>
                        <C data={buildData(firstChart)} options={opts[firstChart.type]} />
                      </div>
                      {firstChart.type === "line" && (
                        <div style={S.legend}>
                          {firstChart.datasets.map((ds, i) => (
                            <span key={i} style={S.legendItem}>
                              <span style={{ ...S.dot, background:ds.color, opacity:ds.dashed?0.5:1 }} />
                              {ds.label}
                            </span>
                          ))}
                        </div>
                      )}
                    <div style={S.actions}>
                        <button style={S.actBtn} onClick={() => openEditChart(firstChart)}>✏️ Modifier</button>
                        <button style={{ ...S.actBtn, ...S.actDel }}
                          onClick={() => setConfirmDel({ open:true, id:firstChart.id, title:firstChart.title })}>
                          🗑 Supprimer
                        </button>
                        <button style={{ ...S.actBtn, ...S.actAdd }} onClick={() => openAddData(firstChart)}>
                          ➕ Ajouter
                        </button>
                      </div>
                    </div>
                  );
                })()}
                <div style={S.statsCol}>
                  {statCards.map((s) => (
                    <div key={s.id} id={s.id}
                      style={{ ...cardStyle(s.id, s.keywords), ...S.statCard, background:s.gradient }}
                      onClick={() => openEditStat(s)}>
                      <div style={S.statEdit}></div>
                      {s.autoSync && <div style={S.autoSync ? { ...S.autoTag } : {}}>🔄 Auto-sync</div>}
                      <div style={S.statLabel}>{s.label}</div>
                      <div style={S.statNum}>{s.value.toLocaleString()}</div>
                      <div style={S.circle1} /><div style={S.circle2} />
                    </div>
                  ))}
                </div>
              </div>

              {/* GRID */}
              {restCharts.length > 0 && (
                <div style={S.grid}>
                  {restCharts.map((chart) => {
                    const C = Comp[chart.type];
                    if (!C) return null;
                    return (
                      <div key={chart.id} id={chart.id}
                        style={cardStyle(chart.id, chart.keywords, { padding:24 })}>
                        <div style={S.hdr}>
                          <span style={S.hdrTitle}>{chart.title}</span>
                          {chart.type === "doughnut" && (
                            <button style={S.reportBtn} onClick={() => toast("📄 Rapport généré !")}>
                              View Report
                            </button>
                          )}
                        </div>
                        {chart.subtitle && <p style={S.sub}>{chart.subtitle}</p>}
                        <div style={{ height: chart.type === "doughnut" ? 200 : 250 }}>
                          <C data={buildData(chart)} options={opts[chart.type]} />
                        </div>
                        <div style={S.actions}>
                          <button style={S.actBtn} onClick={() => openEditChart(chart)}>✏️ Modifier</button>
                          <button style={{ ...S.actBtn, ...S.actDel }}
                            onClick={() => setConfirmDel({ open:true, id:chart.id, title:chart.title })}>
                            🗑 Supprimer
                          </button>
                          <button style={{ ...S.actBtn, ...S.actAdd }} onClick={() => openAddData(chart)}>
                            ➕ Ajouter
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* ADD CHART */}
              <div style={S.addSection}>
              
              </div>
            </div>
          )}
         
        </div>
      )}

     {/* ══════════════════════════════════
           E D I T   M O D A L
      ══════════════════════════════════ */}
      {editModal.open && (
        <div style={S.overlay} onClick={(e) => e.target === e.currentTarget && closeModal()}>
          <div style={S.modal}>
            <div style={S.mHead}>
              <h3 style={S.mTitle}>
                {editModal.targetId === "chart-event" && editModal.mode === "add-data" 
                  ? "➕ Ajouter un nouvel événement" 
                  : (editModal.mode === "edit-stat" ? `✏️ ${editModal.data.label}` : `✏️ Modifier — ${editModal.data.title}`)}
              </h3>
              <button style={S.mClose} onClick={closeModal}>✕</button>
            </div>

            <div style={S.mBody}>
              {/* 1. حالة تعديل الإحصائيات الفردية (Cards) */}
              {editModal.mode === "edit-stat" && (
                <>
                  <div style={S.fg}>
                    <label style={S.fl}>Label</label>
                    <input style={S.fi} value={editModal.data.label}
                      onChange={(e) => updateModalData((d) => ({ ...d, label:e.target.value }))} />
                  </div>
                  <div style={S.fg}>
                    <label style={S.fl}>Valeur</label>
                    <input style={S.fi} type="number" value={editModal.data.value}
                      onChange={(e) => updateModalData((d) => ({ ...d, value:parseInt(e.target.value)||0 }))} />
                  </div>
                </>
              )}

              {/* 2. حالة إضافة بيانات لجدول evenement (خاص بمخطط الولايات) */}
              {editModal.targetId === "chart-event" && editModal.mode === "add-data" ? (
                <>
                  <div style={S.fg}>
                    <label style={S.fl}>Titre de l'événement</label>
                    <input 
                      style={S.fi} 
                      placeholder="Ex: Conférence Jeunesse" 
                      onChange={(e) => updateModalData(d => ({...d, titre_evenement: e.target.value}))} 
                    />
                  </div>
                  <div style={S.fg}>
                    <label style={S.fl}>Gouvernorat</label>
                    <select 
                      style={S.fi} 
                      onChange={(e) => updateModalData(d => ({...d, id_gouvernorat: parseInt(e.target.value)}))}
                      defaultValue={1}
                    >
                      {charts[0].labels.map((gouv, i) => (
                        <option key={i} value={i + 1}>{gouv}</option>
                      ))}
                    </select>
                  </div>
                  <div style={S.fg}>
                    <label style={S.fl}>Date de l'événement</label>
                    <input 
                      type="date" 
                      style={S.fi} 
                      onChange={(e) => updateModalData(d => ({...d, date_evenement: e.target.value}))} 
                    />
                  </div>
                </>
              ) : (
              
                (editModal.mode === "edit-chart" || editModal.mode === "add-data") && editModal.data.type !== "doughnut" && (
                  <>
                    {editModal.mode === "edit-chart" && (
                      <div style={S.fg}>
                        <label style={S.fl}>Titre</label>
                        <input style={S.fi} value={editModal.data.title}
                          onChange={(e) => updateModalData((d) => ({ ...d, title:e.target.value }))} />
                      </div>
                    )}
                    <div style={S.fg}>
                      <label style={S.fl}>Points de données</label>
                      <div style={S.tableHead}>
                        <span style={{ flex:1, fontSize:11, fontWeight:700, color:"#888" }}>Label</span>
                        {editModal.data.datasets.map((ds, di) => (
                          <span key={di} style={{ flex:1, fontSize:11, fontWeight:700, color:"#888" }}>{ds.label}</span>
                        ))}
                        <span style={{ width:36 }} />
                      </div>
                      {editModal.data.labels.map((lbl, i) => (
                        <div key={i} style={S.dRow}>
                          <input style={{ ...S.fi, flex:1 }} value={lbl}
                            onChange={(e) => updateModalData((d) => { const c=JSON.parse(JSON.stringify(d)); c.labels[i]=e.target.value; return c; })} />
                          {editModal.data.datasets.map((ds, di) => (
                            <input key={di} style={{ ...S.fi, flex:1 }} type="number" value={ds.data[i]}
                              onChange={(e) => updateModalData((d) => { const c=JSON.parse(JSON.stringify(d)); c.datasets[di].data[i]=parseInt(e.target.value)||0; return c; })} />
                          ))}
                          <button style={S.rmBtn} onClick={() => removeRow(i)}>🗑</button>
                        </div>
                      ))}
                      <button style={S.addRowBtn} onClick={addRow}>➕ Ajouter un point</button>
                    </div>
                  </>
                )
              )}
              {(editModal.mode === "edit-chart" || editModal.mode === "add-data") && editModal.data.type === "doughnut" && (
                <>
                  <div style={S.fg}>
                    <label style={S.fl}>Titre</label>
                    <input style={S.fi} value={editModal.data.title}
                      onChange={(e) => updateModalData((d) => ({ ...d, title:e.target.value }))} />
                  </div>
                  
                </>
              )}
            </div>

            <div style={S.mFoot}>
              <button style={S.cancelBtn} onClick={closeModal}>Annuler</button>
              <button style={S.saveBtn} onClick={saveModal}>💾 Sauvegarder</button>
            </div>
          </div>
        </div>
      )}

     

      {/* ══════════════════════════════════
           CONFIRM DELETE
      ══════════════════════════════════ */}
      {confirmDel.open && (
        <div style={S.overlay}
          onClick={(e) => e.target===e.currentTarget && setConfirmDel({ open:false, id:null, title:"" })}>
          <div style={{ ...S.modal, maxWidth:400, textAlign:"center", padding:"40px 30px" }}>
            <div style={{ fontSize:52, marginBottom:14 }}>🗑️</div>
            <h3 style={{ ...S.mTitle, textAlign:"center", marginBottom:8 }}>
              Supprimer « {confirmDel.title} » ?
            </h3>
            <p style={{ fontSize:13, color:"#888", marginBottom:28 }}>
              Cette action est irréversible. Toutes les données seront perdues.
            </p>
            <div style={{ ...S.mFoot, justifyContent:"center" }}>
              <button style={S.cancelBtn}
                onClick={() => setConfirmDel({ open:false, id:null, title:"" })}>
                Annuler
              </button>
              <button style={{ ...S.saveBtn, background:"linear-gradient(135deg,#ef4444,#dc2626)" }}
                onClick={deleteChart}>
                🗑 Supprimer
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}

/* ════════════════════════════════════════
   S T Y L E S
════════════════════════════════════════ */
const S = {
  wrapper:{
    minHeight: "100vh",
    overflowX: "hidden",
    overflowY: "auto",
    background:"linear-gradient(135deg,#b8a9e0,#9b89d0 20%,#8b7bc8 40%,#7c6cbf 60%,#9584cf 80%,#a897da)",
    fontFamily:"'Poppins',sans-serif",
    color:"#333",
  },
  toastBox:{ position:"fixed", top:20, right:20, zIndex:9999, display:"flex", flexDirection:"column", gap:10 },
  toast:{
    padding:"14px 22px", background:"#fff", borderRadius:14,
    boxShadow:"0 8px 32px rgba(0,0,0,.12)", fontSize:13, fontWeight:500,
    borderLeft:"4px solid #7c5cbf", maxWidth:380,
  },
  fab:{
    position:"fixed", top:20, left:20, width:48, height:48,
    background:"linear-gradient(135deg,#5a3fa0,#7c5cbf)", border:"none", borderRadius:14,
    color:"#fff", fontSize:22, cursor:"pointer", zIndex:300,
    display:"flex", alignItems:"center", justifyContent:"center",
    boxShadow:"0 4px 20px rgba(90,63,160,.4)",
  },
  sidebar:{
    position:"fixed", left:0, top:0, width:240, height:"100vh",
    background:"rgba(255,255,255,.12)", backdropFilter:"blur(24px)",
    borderRight:"1px solid rgba(255,255,255,.15)", zIndex:200,
    display:"flex", flexDirection:"column",
    transition:"transform .5s cubic-bezier(.4,0,.2,1),opacity .4s ease",
  },
  menuBtn:{
    display:"flex", alignItems:"center", gap:10,
    margin:"20px 20px 10px", padding:"13px 22px",
    background:"linear-gradient(135deg,#5a3fa0,#6a4dab)", border:"none", borderRadius:12,
    color:"#fff", fontSize:14, fontWeight:700, cursor:"pointer",
    fontFamily:"'Poppins',sans-serif", boxShadow:"0 4px 18px rgba(90,63,160,.35)",
  },
  navList:{ flex:1, padding:"10px 14px", overflowY:"auto", display:"flex", flexDirection:"column", gap:3 },
  navItem:{
    display:"flex", alignItems:"center", gap:14, padding:"12px 18px", borderRadius:12,
    border:"none", background:"transparent", color:"rgba(255, 255, 255, 0.85)", fontSize:13.5,
    fontWeight:500, cursor:"pointer", textAlign:"left", width:"100%",
    fontFamily:"'Poppins',sans-serif", transition:"all .25s ease",
  },
  navActive:{ background:"rgba(255,255,255,.22)", color:"#fff", fontWeight:700, boxShadow:"inset 3px 0 0 #fff" },
  badge:{ marginLeft:"auto", background:"#e74c3c", color:"#fff", fontSize:10, fontWeight:700, padding:"2px 7px", borderRadius:10 },
  liveBadge:{ background:"#e74c3c", color:"#120404", fontSize:9, fontWeight:800, padding:"2px 6px", borderRadius:4 },
  exitBtn:{
    margin:"10px 14px 20px", padding:"12px 18px", borderRadius:12,
    border:"1px solid rgba(255,255,255,.15)", background:"rgba(255,255,255,.06)",
    color:"rgba(255,255,255,.8)", fontSize:13.5, fontWeight:500, cursor:"pointer",
    display:"flex", alignItems:"center", gap:14, fontFamily:"'Poppins',sans-serif",
    transition:"background .2s",
  },
   main:{
    minHeight: "100vh",
    padding: "20px 30px 80px",
    transition:"margin-left .5s cubic-bezier(.4,0,.2,1)",
    boxSizing: "border-box",
  },
  topBar:{ display:"flex", alignItems:"center", marginBottom:28, gap:20 },
  searchWrap:{ flex:1, maxWidth:620, margin:"0 auto", position:"relative" },
  sIcon:{ position:"absolute", left:18, top:"50%", transform:"translateY(-50%)", fontSize:15 },
  sInput:{
    width:"100%", padding:"14px 20px 14px 48px",
    background:"rgba(255,255,255,.92)", border:"2px solid rgba(255,255,255,.5)",
    borderRadius:14, fontSize:14, fontFamily:"'Poppins',sans-serif",
    color:"#333", outline:"none", boxShadow:"0 4px 20px rgba(0,0,0,.06)", transition:"border-color .3s",
  },
  suggestBox:{
    position:"absolute", top:"calc(100% + 8px)", left:0, right:0,
    background:"#fff", borderRadius:14, boxShadow:"0 12px 40px rgba(0,0,0,.14)",
    zIndex:500, overflow:"hidden", border:"1px solid rgba(0,0,0,.06)",
  },
  suggestItem:{
    padding:"12px 20px", display:"flex", alignItems:"center", gap:12,
    cursor:"pointer", fontSize:13, color:"#555", transition:"background .15s",
  },
  userArea:{ display:"flex", alignItems:"center", gap:10, flexShrink:0 },
  avatar:{
    width:38, height:38, borderRadius:12, background:"linear-gradient(135deg,#5a3fa0,#7c5cbf)",
    color:"#fff", display:"flex", alignItems:"center", justifyContent:"center",
    fontSize:15, fontWeight:700, boxShadow:"0 2px 10px rgba(90,63,160,.3)",
  },
  row1:{ display:"flex", gap:20, marginBottom:20, alignItems:"stretch" },
  grid:{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:20, marginBottom:20 },
  statsCol:{ display:"flex", flexDirection:"column", gap:20, flex:1 },
  card:{
    background:"rgba(255,255,255,.93)", backdropFilter:"blur(10px)",
    borderRadius:18, boxShadow:"0 4px 24px rgba(100,70,180,.1)",
    border:"1px solid rgba(255,255,255,.5)", transition:"all .4s ease",
  },
  hdr:{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:18, flexWrap:"wrap", gap:10 },
  hdrTitle:{ fontSize:16, fontWeight:700, color:"#2d2555" },
  yearNav:{ display:"flex", alignItems:"center", gap:10 },
  yBtn:{ width:28, height:28, borderRadius:8, border:"1px solid #e0dce8", background:"#fff", color:"#666", cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center", fontSize:11 },
  yLabel:{ fontSize:14, fontWeight:700, color:"#444", minWidth:50, textAlign:"center" },
  sel:{ padding:"6px 14px", border:"1px solid #e0dce8", borderRadius:8, fontSize:12, fontFamily:"'Poppins',sans-serif", color:"#666", background:"#fff", cursor:"pointer", outline:"none" },
  legend:{ display:"flex", alignItems:"center", gap:24, justifyContent:"center", marginTop:14 },
  legendItem:{ display:"flex", alignItems:"center", gap:7, fontSize:12, color:"#777" },
  dot:{ width:10, height:10, borderRadius:"50%", display:"inline-block" },
  sub:{ fontSize:12, color:"#999", marginBottom:14 },
  reportBtn:{ padding:"6px 18px", background:"linear-gradient(135deg,#8e72d1,#6a4dab)", color:"#fff", border:"none", borderRadius:8, fontSize:11, fontWeight:600, cursor:"pointer", fontFamily:"'Poppins',sans-serif" },
  actions:{ display:"flex", gap:8, marginTop:16, justifyContent:"center", flexWrap:"wrap" },
  actBtn:{ padding:"7px 16px", borderRadius:10, border:"1.5px solid #e0dce8", background:"#faf8ff", color:"#5a3fa0", fontSize:11.5, fontWeight:600, cursor:"pointer", fontFamily:"'Poppins',sans-serif", transition:"all .2s", display:"flex", alignItems:"center", gap:4 },
  actDel:{ borderColor:"#fecaca", background:"#fef2f2", color:"#dc2626" },
  actAdd:{ borderColor:"#bbf7d0", background:"#f0fdf4", color:"#16a34a" },
  statCard:{ borderRadius:18, padding:"28px 28px", color:"#fff", position:"relative", overflow:"hidden", cursor:"pointer", transition:"all .3s ease", boxShadow:"0 6px 28px rgba(0,0,0,.12)", border:"none" },
  statLabel:{ fontSize:15, fontWeight:600, opacity:0.95, marginBottom:6, position:"relative", zIndex:2 },
  statNum:{ fontSize:42, fontWeight:800, lineHeight:1, position:"relative", zIndex:2 },
  statEdit:{ position:"absolute", top:14, right:14, width:30, height:30, background:"rgba(255,255,255,.2)", borderRadius:8, display:"flex", alignItems:"center", justifyContent:"center", fontSize:13, zIndex:2 },
  autoTag:{ position:"absolute", top:14, right:52, background:"rgba(255,255,255,.2)", borderRadius:6, padding:"3px 8px", fontSize:9, fontWeight:700, zIndex:2 },
  circle1:{ position:"absolute", top:"-50%", right:"-30%", width:180, height:180, background:"rgba(255,255,255,.1)", borderRadius:"50%" },
  circle2:{ position:"absolute", bottom:"-40%", left:"-20%", width:140, height:140, background:"rgba(255,255,255,.06)", borderRadius:"50%" },
  addSection:{ display:"flex", gap:14, justifyContent:"center", marginTop:30, flexWrap:"wrap", paddingBottom:20 },
  addChartBtn:{ padding:"14px 32px", borderRadius:14, background:"linear-gradient(135deg,#6a4dab,#5a3fa0)", border:"none", color:"#fff", fontSize:14, fontWeight:700, cursor:"pointer", fontFamily:"'Poppins',sans-serif", boxShadow:"0 6px 24px rgba(90,63,160,.35)", transition:"transform .2s,box-shadow .2s" },
  pbiBtn:{ padding:"14px 32px", borderRadius:14, background:"rgba(255,255,255,.9)", border:"2px solid #e0dce8", color:"#5a3fa0", fontSize:14, fontWeight:700, cursor:"pointer", fontFamily:"'Poppins',sans-serif", transition:"all .2s" },
  empty:{ display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", minHeight:"65vh", textAlign:"center", animation:"fadeUp .5s ease" },
  emptyIco:{ width:120, height:120, borderRadius:"50%", background:"rgba(255,255,255,.85)", display:"flex", alignItems:"center", justifyContent:"center", marginBottom:24, fontSize:48, boxShadow:"0 6px 30px rgba(100,70,180,.15)" },
  emptyH:{ fontSize:28, fontWeight:700, color:"#fff", marginBottom:10 },
  emptyP:{ fontSize:14, color:"rgba(255,255,255,.8)", maxWidth:420 },
  overlay:{ position:"fixed", inset:0, background:"rgba(0,0,0,.45)", backdropFilter:"blur(8px)", zIndex:1000, display:"flex", alignItems:"center", justifyContent:"center" },
  modal:{ background:"#fff", borderRadius:22, padding:0, width:"92%", maxWidth:580, maxHeight:"88vh", overflowY:"auto", boxShadow:"0 24px 70px rgba(0,0,0,.2)", fontFamily:"'Poppins',sans-serif" },
  mHead:{ display:"flex", alignItems:"center", justifyContent:"space-between", padding:"24px 28px 0", position:"sticky", top:0, background:"#fff", zIndex:2, borderRadius:"22px 22px 0 0" },
  mTitle:{ fontSize:17, fontWeight:700, color:"#2d2555" },
  mClose:{ width:36, height:36, borderRadius:10, border:"none", background:"#f5f3ff", color:"#666", cursor:"pointer", fontSize:18, display:"flex", alignItems:"center", justifyContent:"center" },
  mBody:{ padding:"20px 28px" },
  mFoot:{ display:"flex", gap:10, justifyContent:"flex-end", padding:"16px 28px 24px", position:"sticky", bottom:0, background:"#fff", borderRadius:"0 0 22px 22px" },
  fg:{ marginBottom:18 },
  fl:{ display:"block", fontSize:11, fontWeight:700, color:"#c4c4c4", marginBottom:6, textTransform:"uppercase", letterSpacing:.5 },
  fi:{ width:"100%", padding:"11px 14px", border:"2px solid #e8e5f0", borderRadius:10, fontSize:13, fontFamily:"'Poppins',sans-serif", color:"#333", outline:"none", transition:"border-color .2s" },
  tableHead:{ display:"flex", gap:10, padding:"0 0 6px", marginBottom:6, borderBottom:"1px solid #f0eef5" },
  dRow:{ display:"flex", alignItems:"center", gap:8, marginBottom:8 },
  rmBtn:{ width:34, height:34, borderRadius:8, border:"none", background:"#fef2f2", color:"#ef4444", cursor:"pointer", fontSize:14, flexShrink:0, display:"flex", alignItems:"center", justifyContent:"center" },
  addRowBtn:{ width:"100%", padding:11, border:"2px dashed #d8cef5", borderRadius:10, background:"#faf8ff", color:"#6a4dab", fontSize:12, fontWeight:700, cursor:"pointer", fontFamily:"'Poppins',sans-serif", marginTop:4 },
  colorIn:{ width:40, height:38, border:"none", borderRadius:8, cursor:"pointer", flexShrink:0 },
  cancelBtn:{ padding:"11px 24px", border:"1.5px solid #e0dce8", borderRadius:12, background:"#fff", color:"#666", fontSize:13, fontWeight:600, cursor:"pointer", fontFamily:"'Poppins',sans-serif" },
  saveBtn:{ padding:"11px 28px", border:"none", borderRadius:12, background:"linear-gradient(135deg,#6a4dab,#5a3fa0)", color:"#fff", fontSize:13, fontWeight:700, cursor:"pointer", fontFamily:"'Poppins',sans-serif", boxShadow:"0 4px 18px rgba(90,63,160,.3)" },
  typeGrid:{ display:"flex", gap:12, marginTop:8 },
  typeBtn:{ flex:1, padding:"18px 10px", borderRadius:14, border:"2px solid #e8e5f0", background:"#faf8ff", cursor:"pointer", display:"flex", flexDirection:"column", alignItems:"center", gap:8, transition:"all .2s", fontFamily:"'Poppins',sans-serif" },
  typeBtnOn:{ borderColor:"#7c5cbf", background:"#f0ebff", boxShadow:"0 0 0 3px rgba(124,92,191,.15)" },
  divider:{ height:1, background:"#e8e5f0", margin:"24px 0" },
  pbiModalBtn:{ width:"100%", padding:"14px", borderRadius:12, border:"2px solid #e0dce8", background:"#fff", color:"#5a3fa0", fontSize:13, fontWeight:700, cursor:"pointer", fontFamily:"'Poppins',sans-serif", display:"flex", alignItems:"center", justifyContent:"center", gap:8 },
};