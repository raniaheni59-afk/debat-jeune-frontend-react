
import { useState, useEffect, useCallback, useRef } from "react";
import { useNavigate } from "react-router-dom";
import {
  Chart as ChartJS,
  CategoryScale, LinearScale,
  PointElement, LineElement,
  BarElement, ArcElement,
  Filler, Tooltip, Legend,
} from "chart.js";
import { Line, Bar, Doughnut } from "react-chartjs-2";
import API from "../services/api";

ChartJS.register(
  CategoryScale, LinearScale, PointElement, LineElement,
  BarElement, ArcElement, Filler, Tooltip, Legend
);

const C = {
  purple:  "#7c5cbf",
  purple2: "#5a3fa0",
  blue:    "#4285f4",
  green:   "#16a34a",
  red:     "#dc2626",
  teal:    "#0d9488",
  pink:    "#ec4899",
  amber:   "#f59e0b",
};

const GOUV = [
  "Tunis","Ariana","Ben Arous","Manouba",
  "Nabeul","Zaghouan","Bizerte",
  "Béja","Jendouba","Kef","Siliana",
  "Sousse","Monastir","Mahdia",
  "Sfax","Kairouan","Kasserine","Sidi Bouzid",
  "Gabes","Mednine","Tataouine",
  "Gafsa","Tozeur","Kebili"
];

function Spin() {
  return (
    <div style={{ display:"flex", justifyContent:"center", padding:40 }}>
      <div style={{
        width:36, height:36, borderRadius:"50%",
        border:"3px solid #e0dce8", borderTopColor: C.purple,
        animation:"gsSpin .7s linear infinite",
      }}/>
      <style>{`@keyframes gsSpin{to{transform:rotate(360deg)}}`}</style>
    </div>
  );
}
function useToast() {
  const [toasts, setToasts] = useState([]);
  const id = useRef(0);
  const push = useCallback((msg, type="ok") => {
    const tid = ++id.current;
    setToasts(p => [...p, { tid, msg, type }]);
    setTimeout(() => setToasts(p => p.filter(t => t.tid !== tid)), 3200);
  }, []);
  return { toasts, push };
}
function Modal({ title, onClose, children, footer }) {
  return (
    <div style={MS.overlay} onClick={e => e.target === e.currentTarget && onClose()}>
      <div style={MS.box}>
        <div style={MS.head}>
          <span style={MS.title}>{title}</span>
          <button style={MS.xBtn} onClick={onClose}>✕</button>
        </div>
        <div style={MS.body}>{children}</div>
        {footer && <div style={MS.foot}>{footer}</div>}
      </div>
    </div>
  );
}
const MS = {
  overlay:{ position:"fixed", inset:0, background:"rgba(0,0,0,.45)", backdropFilter:"blur(8px)", zIndex:1000, display:"flex", alignItems:"center", justifyContent:"center", padding:20 },
  box:{ background:"#fff", borderRadius:22, width:"100%", maxWidth:560, maxHeight:"90vh", overflowY:"auto", boxShadow:"0 24px 70px rgba(0,0,0,.2)", fontFamily:"'Poppins',sans-serif" },
  head:{ display:"flex", alignItems:"center", justifyContent:"space-between", padding:"22px 26px 0", position:"sticky", top:0, background:"#fff", zIndex:2, borderRadius:"22px 22px 0 0" },
  title:{ fontSize:16, fontWeight:700, color:"#2d2555" },
  xBtn:{ width:34, height:34, borderRadius:10, border:"none", background:"#f5f3ff", color:"#666", cursor:"pointer", fontSize:17, display:"flex", alignItems:"center", justifyContent:"center" },
  body:{ padding:"18px 26px" },
  foot:{ display:"flex", gap:10, justifyContent:"flex-end", padding:"14px 26px 22px", borderTop:"1px solid #f0eef5" },
};
const Fg = ({ label, children }) => (
  <div style={{ marginBottom:16 }}>
    <label style={{ display:"block", fontSize:11, fontWeight:700, color:"#aaa", textTransform:"uppercase", letterSpacing:.5, marginBottom:6 }}>{label}</label>
    {children}
  </div>
);

const Fi = (props) => (
  <input style={{ width:"100%", padding:"10px 13px", border:"2px solid #e8e5f0", borderRadius:10, fontSize:13, fontFamily:"'Poppins',sans-serif", color:"#333", outline:"none" }} {...props} />
);
const Fsel = ({ children, ...props }) => (
  <select style={{ width:"100%", padding:"10px 13px", border:"2px solid #e8e5f0", borderRadius:10, fontSize:13, fontFamily:"'Poppins',sans-serif", color:"#333", outline:"none", background:"#fff" }} {...props}>
    {children}
  </select>
);
const BtnPrimary = ({ children, ...props }) => (
  <button style={{ padding:"10px 22px", borderRadius:11, border:"none", background:`linear-gradient(135deg,${C.purple2},${C.purple})`, color:"#fff", fontSize:13, fontWeight:700, cursor:"pointer", fontFamily:"'Poppins',sans-serif", display:"flex", alignItems:"center", gap:7 }} {...props}>
    {children}
  </button>
);
const BtnGhost = ({ children, ...props }) => (
  <button style={{ padding:"10px 22px", borderRadius:11, border:"1.5px solid #e0dce8", background:"#fff", color:"#666", fontSize:13, fontWeight:600, cursor:"pointer", fontFamily:"'Poppins',sans-serif" }} {...props}>
    {children}
  </button>
);


export default function Suivi({ goDashboard }) {
  const user = JSON.parse(localStorage.getItem("user") || "{}");
  const { toasts, push } = useToast();
  const navigate = useNavigate(); 
  
  const [year,          setYear]          = useState(new Date().getFullYear());
  const [eventsData,    setEventsData]    = useState(new Array(24).fill(0));
  const [participantN,  setParticipantN]  = useState(null);
  const [loadingEvents, setLoadingEvents] = useState(true);
  const [loadingPart,   setLoadingPart]   = useState(true);
  const [lastSync,      setLastSync]      = useState(null);

  
  const [addEventOpen,  setAddEventOpen]  = useState(false);
  const [confirmDel,    setConfirmDel]    = useState(null); 
  const [editChart,     setEditChart]     = useState(null); 

 
  const [evForm, setEvForm] = useState({ titre:"", id_gouvernorat:1, date:"" });
  const [evSaving, setEvSaving] = useState(false);

 
  const [customCharts, setCustomCharts] = useState([]);
  const [addCustomOpen, setAddCustomOpen] = useState(false);
  const [newCustom, setNewCustom] = useState({ type:"bar", title:"", labels:"Jan,Fév,Mar,Avr", values:"0,0,0,0", color: C.blue });


  const fetchEvents = useCallback(async () => {
    setLoadingEvents(true);
    try {
      const res = await API.get(`/events/stats-gouvernorat?year=${year}`);
      const arr = new Array(24).fill(0);
      res.data.forEach(e => {
        const i = e.id_gouvernorat - 1;
        if (i >= 0 && i < 24) arr[i] = Number(e.total);
      });
      setEventsData(arr);
      setLastSync(new Date());
    } catch (err) {
      console.error("fetchEvents:", err);
      push("Erreur chargement événements", "err");
    } finally {
      setLoadingEvents(false);
    }
  }, [year]);

  const fetchParticipants = useCallback(async () => {
    setLoadingPart(true);
    try {
      const res = await API.get("/users/count/jeune-profiles");
      if (res.data?.count != null) setParticipantN(res.data.count);
    } catch (err) {
      console.error("fetchParticipants:", err);
    } finally {
      setLoadingPart(false);
    }
  }, []);

  useEffect(() => { fetchEvents(); }, [fetchEvents]);
  useEffect(() => { fetchParticipants(); }, [fetchParticipants]);

 
  useEffect(() => {
    const iv = setInterval(fetchParticipants, 30_000);
    return () => clearInterval(iv);
  }, [fetchParticipants]);

 
  const handleAddEvent = async () => {
    if (!evForm.titre.trim() || !evForm.date) {
      push("Remplissez tous les champs", "err"); return;
    }
    setEvSaving(true);
    try {
      await API.post("/events", {
        titre_evenement: evForm.titre,
        id_gouvernorat:  evForm.id_gouvernorat,
        date_evenement:  evForm.date,
        id_user: user?.id_user || user?.id || user?.userId,
      }, {
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
      });
      push(" Événement ajouté !");
      setAddEventOpen(false);
      setEvForm({ titre:"", id_gouvernorat:1, date:"" });
      await fetchEvents();
    } catch (err) {
      push(err.response?.data?.message || "Erreur ajout", "err");
    } finally {
      setEvSaving(false);
    }
  };


  const handleAddCustom = () => {
    const labels = newCustom.labels.split(",").map(s => s.trim()).filter(Boolean);
    const values = newCustom.values.split(",").map(s => Number(s.trim()) || 0);
    if (!newCustom.title.trim() || labels.length === 0) {
      push("Titre et labels requis", "err"); return;
    }
    const id = `custom-${Date.now()}`;
    setCustomCharts(p => [...p, {
      id, type: newCustom.type, title: newCustom.title,
      labels, values, color: newCustom.color,
    }]);
    setAddCustomOpen(false);
    setNewCustom({ type:"bar", title:"", labels:"Jan,Fév,Mar,Avr", values:"0,0,0,0", color: C.blue });
    push(" Diagramme ajouté !");
  };

  const deleteCustom = (id) => {
    setCustomCharts(p => p.filter(c => c.id !== id));
    setConfirmDel(null);
    push("Diagramme supprimé");
  };


  const eventsBarData = {
    labels: GOUV,
    datasets: [{
      label: "Événements",
      data: eventsData,
      backgroundColor: `${C.purple}cc`,
      borderRadius: 7,
      borderSkipped: false,
      hoverBackgroundColor: C.purple2,
    }],
  };

  const eventsBarOpts = {
    responsive: true, maintainAspectRatio: false,
    plugins: { legend:{ display:false }, tooltip:{ callbacks:{ label: ctx => ` ${ctx.parsed.y} événement${ctx.parsed.y !== 1 ? "s":""}`}}},
    scales: {
      y: {
        beginAtZero: true, ticks:{ stepSize:1, precision:0, color:"#aaa", font:{size:11} },
        grid:{ color:"rgba(0,0,0,.04)" },
        title:{ display:true, text:"Nombre d'événements" },
      },
      x: { ticks:{ autoSkip:false, maxRotation:55, minRotation:55, color:"#aaa", font:{size:10} }, grid:{ display:false } },
    },
  };

  const partDoughnutData = {
    labels: ["Jeunes", "Autres"],
    datasets: [{
      data: [participantN ?? 0, 0],
      backgroundColor: [C.purple, "#e0d9f5"],
      borderWidth: 3, borderColor:"#fff", hoverOffset:10,
    }],
  };

  const partDoughnutOpts = {
    responsive:true, maintainAspectRatio:false, cutout:"68%",
    plugins:{
      legend:{ position:"bottom", labels:{ padding:16, usePointStyle:true, font:{size:12} } },
      tooltip:{ callbacks:{ label: ctx => ` ${ctx.label} : ${ctx.parsed}` } },
    },
  };

  
  const buildCustomData = (c) => {
    if (c.type === "doughnut") {
      const colors = [C.purple, C.teal, C.pink, C.amber, C.blue];
      return {
        labels: c.labels,
        datasets: [{ data:c.values, backgroundColor: c.labels.map((_,i) => colors[i % colors.length]), borderWidth:3, borderColor:"#fff" }],
      };
    }
    if (c.type === "line") {
      return {
        labels: c.labels,
        datasets: [{ label:c.title, data:c.values, borderColor:c.color, backgroundColor:`${c.color}14`, tension:0.4, fill:true, pointRadius:4 }],
      };
    }
    return {
      labels: c.labels,
      datasets: [{ label:c.title, data:c.values, backgroundColor:`${c.color}cc`, borderRadius:6 }],
    };
  };

  const Comp = { line:Line, bar:Bar, doughnut:Doughnut };

  return (
    <div style={S.root}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Poppins:wght@400;500;600;700;800&display=swap');
        * { box-sizing: border-box; margin:0; padding:0; }
        ::-webkit-scrollbar { width:5px; }
        ::-webkit-scrollbar-thumb { background:rgba(124,92,191,.25); border-radius:3px; }
        @keyframes gsUp { from{opacity:0;transform:translateY(16px)} to{opacity:1;transform:translateY(0)} }
        @keyframes gsSpin { to{transform:rotate(360deg)} }
        @keyframes gsToast { from{transform:translateX(60px);opacity:0} to{transform:translateX(0);opacity:1} }
        @keyframes gsPulse { 0%,100%{box-shadow:0 0 0 3px rgba(22,163,74,.2)} 50%{box-shadow:0 0 0 6px rgba(22,163,74,.08)} }
      `}</style>

      {/* ── TOASTS ── */}
      <div style={{ position:"fixed", top:20, right:20, zIndex:9999, display:"flex", flexDirection:"column", gap:8 }}>
        {toasts.map(t => (
          <div key={t.tid} style={{
            padding:"12px 20px", background:"#fff", borderRadius:13,
            boxShadow:"0 8px 28px rgba(0,0,0,.12)", fontSize:13, fontWeight:500,
            borderLeft:`4px solid ${t.type==="err" ? C.red : C.purple}`,
            animation:"gsToast .3s ease", fontFamily:"'Poppins',sans-serif",
          }}>{t.msg}</div>
        ))}
      </div>

      {/* ═══════ PAGE HEADER ════════ */}
      <div style={S.pageHeader}>
        <div style={S.pageHeaderLeft}>
          
          
        <div
          style={{ ...S.pageIcon, cursor: "pointer" }}
          onClick={goDashboard}
        >
          🏠
        </div>


          <div>
            <h1 style={S.pageTitle}>Gérer Statistiques</h1>
            <p style={S.pageSub}>
             
              {lastSync && <span style={{ marginLeft:10, opacity:.6 }}>· sync {lastSync.toLocaleTimeString("fr-FR",{hour:"2-digit",minute:"2-digit",second:"2-digit"})}</span>}
            </p>
          </div>
        </div>
        <div style={{ display:"flex", gap:10 }}>
          <button style={S.refreshBtn} onClick={() => { fetchEvents(); fetchParticipants(); push("🔄 Données actualisées"); }}>
            🔄 Actualiser
          </button>          
        </div>
      </div>

      {/* ════════ KPI CARDS ════════ */}
      <div style={S.kpiRow}>

        {/* participants */}
        <div style={{ ...S.kpiCard, background:`linear-gradient(135deg,${C.purple2},${C.purple})` }}>
          <div style={S.kpiLabel}>Participants (jeune)</div>
          <div style={S.kpiVal}>
            {loadingPart ? "…" : (participantN ?? 0).toLocaleString("fr-FR")}
          </div>
          <div style={S.kpiSub}>
            <span style={S.liveDot} /> 
          </div>
          <div style={S.kpiCircle1}/><div style={S.kpiCircle2}/>
        </div>

        {/* total events */}
        <div style={{ ...S.kpiCard, background:`linear-gradient(135deg,${C.teal},#0f766e)` }}>
          <div style={S.kpiLabel}>Événements ({year})</div>
          <div style={S.kpiVal}>
            {loadingEvents ? "…" : eventsData.reduce((a,b) => a+b, 0).toLocaleString("fr-FR")}
          </div>
          <div style={S.kpiSub}>tous gouvernorats</div>
          <div style={S.kpiCircle1}/><div style={S.kpiCircle2}/>
        </div>

        {/* top gouvernorat */}
        <div style={{ ...S.kpiCard, background:`linear-gradient(135deg,${C.pink},#be185d)` }}>
          <div style={S.kpiLabel}>Top gouvernorat</div>
          <div style={{ ...S.kpiVal, fontSize:22, marginTop:6 }}>
            {loadingEvents ? "…" : (() => {
              const max = Math.max(...eventsData);
              const idx = eventsData.indexOf(max);
              return max > 0 ? `${GOUV[idx]} (${max})` : "—";
            })()}
          </div>
          <div style={S.kpiSub}>plus d'événements</div>
          <div style={S.kpiCircle1}/><div style={S.kpiCircle2}/>
        </div>

      </div>

      {/* ════════ DIAGRAMME 1 — Événements par gouvernorat ════════ */}
      <div style={S.card}>
        <div style={S.cardHeader}>
          <div>
            <div style={S.cardTitle}>📍 Événements par Gouvernorat</div>
            <div style={S.cardSub}>Source : table <code style={S.code}>events</code> — champ <code style={S.code}>id_gouvernorat</code></div>
          </div>
          <div style={{ display:"flex", gap:10, alignItems:"center" }}>
            <div style={S.yearNav}>
              <button style={S.yBtn} onClick={() => setYear(y => y - 1)}>◀</button>
              <span style={S.yLabel}>{year}</span>
              <button style={S.yBtn} onClick={() => setYear(y => y + 1)}>▶</button>
            </div>
            <button
          style={S.actionBtn}
          
        >
          
        </button>
          </div>
        </div>

        {loadingEvents ? <Spin /> : (
          <div style={{ height:280 }}>
            <Bar data={eventsBarData} options={eventsBarOpts} />
          </div>
        )}

        {/* table top 5 */}
        {!loadingEvents && (
          <div style={S.topTable}>
            <div style={S.topTableTitle}>Top 5 gouvernorats</div>
            <div style={{ display:"flex", flexDirection:"column", gap:6 }}>
              {[...eventsData.map((v,i) => ({ g:GOUV[i], v }))].sort((a,b) => b.v - a.v).slice(0,5).map((row, i) => {
                const pct = eventsData.reduce((a,b)=>a+b,0) > 0
                  ? Math.round(row.v / eventsData.reduce((a,b)=>a+b,0) * 100)
                  : 0;
                return (
                  <div key={i} style={{ display:"flex", alignItems:"center", gap:12 }}>
                    <span style={{ width:22, height:22, borderRadius:6, background:C.purple, color:"#fff", display:"flex", alignItems:"center", justifyContent:"center", fontSize:10, fontWeight:800, flexShrink:0 }}>{i+1}</span>
                    <span style={{ minWidth:110, fontSize:12, fontWeight:600, color:"#2d2555" }}>{row.g}</span>
                    <div style={{ flex:1, height:8, background:"#f0eef5", borderRadius:8, overflow:"hidden" }}>
                      <div style={{ width:`${pct}%`, height:"100%", background:`linear-gradient(90deg,${C.purple2},${C.purple})`, borderRadius:8, transition:"width .6s ease" }} />
                    </div>
                    <span style={{ fontSize:12, fontWeight:700, color:C.purple, minWidth:36, textAlign:"right" }}>{row.v}</span>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* ════════ DIAGRAMME 2 — Participants ════════ */}
      <div style={{ ...S.card, display:"flex", gap:32, alignItems:"center", flexWrap:"wrap" }}>
        <div style={{ flex:"1 1 220px" }}>
          <div style={S.cardTitle}> Participants Jeunes</div>
          <div style={S.cardSub}>Source : table <code style={S.code}>utilisateurs</code> WHERE <code style={S.code}>role = 'jeune'</code></div>
          <div style={{ marginTop:24, display:"flex", flexDirection:"column", gap:10 }}>
            <div style={S.statRow}>
              <span style={S.statRowLabel}>Total jeunes</span>
              <span style={{ ...S.statRowVal, color:C.purple }}>
                {loadingPart ? "…" : (participantN ?? 0).toLocaleString("fr-FR")}
              </span>
            </div>
            <div style={S.statRow}>
              <span style={S.statRowLabel}>Sync automatique</span>
              <span style={{ fontSize:12, fontWeight:600, color:"#16a34a", display:"flex", alignItems:"center", gap:6 }}>
                <span style={S.liveDot} /> toutes les 30s
              </span>
            </div>
            <div style={S.statRow}>
              <span style={S.statRowLabel}>Endpoint</span>
              <code style={{ ...S.code, fontSize:11 }}>/users/count/jeune-profiles</code>
            </div>
          </div>
        </div>
        <div style={{ flex:"0 0 220px", height:220 }}>
          {loadingPart ? <Spin /> : (
            <Doughnut data={partDoughnutData} options={partDoughnutOpts} />
          )}
        </div>
      </div>

      {/* ════════ CUSTOM CHARTS ════════ */}
      {customCharts.length > 0 && (
        <div style={S.grid}>
          {customCharts.map(chart => {
            const Ch = Comp[chart.type];
            if (!Ch) return null;
            return (
              <div key={chart.id} style={S.card}>
                <div style={S.cardHeader}>
                  <div style={S.cardTitle}>{chart.title}</div>
                  <div style={{ display:"flex", gap:6 }}>
                    
                  </div>
                </div>
                <div style={{ height:220 }}>
                  <Ch data={buildCustomData(chart)} options={{ responsive:true, maintainAspectRatio:false, plugins:{ legend:{ display: chart.type==="doughnut" } } }} />
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ════════ MODAL AJOUT ÉVÉNEMENT ════════ */}
     
 {addEventOpen && (
        <Modal
          title="aller à dashbord"
          onClose={() => setAddEventOpen(false)}
          footer={<>
            <BtnGhost onClick={() => setAddEventOpen(false)}>Annuler</BtnGhost>
            <BtnPrimary onClick={handleAddEvent} disabled={evSaving}>
              {evSaving ? <span style={{ width:14,height:14,borderRadius:"50%",border:"2px solid rgba(255,255,255,.3)",borderTopColor:"#fff",display:"inline-block",animation:"gsSpin .7s linear infinite" }}/> : null}
              Enregistrer
            </BtnPrimary>
          </>}
        >
          <Fg label="Titre de l'événement *">
            <Fi placeholder="Ex: Conférence Jeunesse" value={evForm.titre} onChange={e => setEvForm(p => ({...p, titre:e.target.value}))} />
          </Fg>
          <Fg label="Gouvernorat *">
            <Fsel value={evForm.id_gouvernorat} onChange={e => setEvForm(p => ({...p, id_gouvernorat:parseInt(e.target.value)}))}>
              {GOUV.map((g,i) => <option key={i} value={i+1}>{g}</option>)}
            </Fsel>
          </Fg>
          <Fg label="Date de l'événement *">
            <Fi type="date" value={evForm.date} onChange={e => setEvForm(p => ({...p, date:e.target.value}))} />
          </Fg>
        </Modal>
      )}

      
      {/* ════════ CONFIRM DELETE ════════ */}
      {confirmDel && (
        <Modal title="🗑 Supprimer ce diagramme ?" onClose={() => setConfirmDel(null)}
          footer={<>
            <BtnGhost onClick={() => setConfirmDel(null)}>Annuler</BtnGhost>
            <button onClick={() => deleteCustom(confirmDel)} style={{ padding:"10px 22px", borderRadius:11, border:"none", background:`linear-gradient(135deg,${C.red},#b91c1c)`, color:"#fff", fontSize:13, fontWeight:700, cursor:"pointer", fontFamily:"'Poppins',sans-serif" }}>
              🗑 Supprimer
            </button>
          </>}
        >
          <p style={{ fontSize:14, color:"#555", lineHeight:1.6 }}>
            Cette action est <strong>irréversible</strong>. Le diagramme sera supprimé définitivement.
          </p>
        </Modal>
      )}
    </div>
  );
}

/* ════════════════════════════════════════
   STYLES
════════════════════════════════════════ */
const S = {
  root:{ padding:"32px 36px 80px", background:"#f5f3fb", minHeight:"100vh", fontFamily:"'Poppins',sans-serif", animation:"gsUp .4s ease" },

  pageHeader:{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:28, flexWrap:"wrap", gap:14 },
  pageHeaderLeft:{ display:"flex", alignItems:"center", gap:16 },
  pageIcon:{ width:52, height:52, borderRadius:16, background:`linear-gradient(135deg,#5a3fa0,#7c5cbf)`, display:"flex", alignItems:"center", justifyContent:"center", fontSize:26, boxShadow:"0 6px 20px rgba(90,63,160,.3)" },
  pageTitle:{ fontSize:24, fontWeight:800, color:"#1a1625", letterSpacing:"-0.5px" },
  pageSub:{ fontSize:12, color:"#9ca3af", marginTop:3 },

  refreshBtn:{ padding:"10px 18px", borderRadius:10, border:"1.5px solid rgba(124,92,191,.25)", background:"rgba(255,255,255,.8)", color:"#9884cc", fontSize:12.5, fontWeight:700, cursor:"pointer", fontFamily:"'Poppins',sans-serif" },
  addBtn:{ padding:"10px 20px", borderRadius:10, border:"none", background:"linear-gradient(135deg,#5a3fa0,#7c5cbf)", color:"#fff", fontSize:12.5, fontWeight:700, cursor:"pointer", fontFamily:"'Poppins',sans-serif", boxShadow:"0 4px 16px rgba(90,63,160,.3)" },

  kpiRow:{ display:"flex", gap:16, marginBottom:24, flexWrap:"wrap" },
  kpiCard:{ flex:"1 1 200px", borderRadius:18, padding:"24px 26px", color:"#fff", position:"relative", overflow:"hidden", boxShadow:"0 6px 24px rgba(0,0,0,.12)" },
  kpiLabel:{ fontSize:12, fontWeight:600, opacity:.85, marginBottom:6 },
  kpiVal:{ fontSize:44, fontWeight:800, lineHeight:1 },
  kpiSub:{ fontSize:11, opacity:.75, marginTop:8, display:"flex", alignItems:"center", gap:6 },
  kpiCircle1:{ position:"absolute", top:"-50%", right:"-25%", width:160, height:160, borderRadius:"50%", background:"rgba(255,255,255,.08)" },
  kpiCircle2:{ position:"absolute", bottom:"-40%", left:"-15%", width:120, height:120, borderRadius:"50%", background:"rgba(255,255,255,.05)" },

  liveDot:{ width:8, height:8, borderRadius:"50%", background:"#99d9e3", display:"inline-block", animation:"gsPulse 2s ease infinite" },

  card:{ background:"rgba(255,255,255,.95)", borderRadius:18, padding:"24px", marginBottom:20, boxShadow:"0 4px 24px rgba(100,70,180,.08)", border:"1px solid rgba(255,255,255,.6)" },
  cardHeader:{ display:"flex", alignItems:"flex-start", justifyContent:"space-between", marginBottom:18, gap:12, flexWrap:"wrap" },
  cardTitle:{ fontSize:15, fontWeight:700, color:"#2d2555" },
  cardSub:{ fontSize:11.5, color:"#aaa", marginTop:4 },
  code:{ background:"#f0ebff", color:"#5a3fa0", padding:"1px 6px", borderRadius:5, fontFamily:"'DM Mono',monospace", fontSize:12 },

  yearNav:{ display:"flex", alignItems:"center", gap:8 },
  yBtn:{ width:28, height:28, borderRadius:8, border:"1px solid #e0dce8", background:"#fff", color:"#666", cursor:"pointer", fontSize:12, display:"flex", alignItems:"center", justifyContent:"center" },
  yLabel:{ fontSize:14, fontWeight:700, color:"#444", minWidth:44, textAlign:"center" },
  actionBtn:{ padding:"7px 14px", borderRadius:9, border:"1.5px solid rgba(90,63,160,.3)", background:"#f0ebff", color:"#5a3fa0", fontSize:12, fontWeight:700, cursor:"pointer", fontFamily:"'Poppins',sans-serif" },
  delBtn:{ width:32, height:32, borderRadius:8, border:"1.5px solid #fecaca", background:"#fef2f2", color:C.red, fontSize:14, cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center" },

  topTable:{ marginTop:22, padding:"16px 18px", background:"#faf8ff", borderRadius:12, border:"1px solid #ede9f5" },
  topTableTitle:{ fontSize:12, fontWeight:700, color:"#6b7280", textTransform:"uppercase", letterSpacing:.5, marginBottom:12 },

  statRow:{ display:"flex", alignItems:"center", justifyContent:"space-between", padding:"8px 0", borderBottom:"1px solid #f0eef5" },
  statRowLabel:{ fontSize:12.5, color:"#6b7280" },
  statRowVal:{ fontSize:22, fontWeight:800 },

  grid:{ display:"grid", gridTemplateColumns:"repeat(auto-fill, minmax(340px,1fr))", gap:18 },
};
