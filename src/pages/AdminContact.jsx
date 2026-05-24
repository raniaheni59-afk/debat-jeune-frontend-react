import { useEffect, useRef, useState, useCallback } from "react";
import { io } from "socket.io-client";
import API from "../services/api";
import "./AdminContact.css";

const BACKEND = import.meta.env.VITE_BACKEND_URL || "https://debat-jeune.onrender.com";
const PALETTE  = ["#7c5cbf","#3b82f6","#22c55e","#f59e0b","#ef4444","#ec4899","#06b6d4","#8b5cf6"];

const ini  = (p="",n="") => ((p[0]||"")+(n[0]||"")).toUpperCase()||"?";
const col  = (id) => PALETTE[(Number(id)||0)%PALETTE.length];
const abs  = (u) => !u?null:u.startsWith("http")?u:BACKEND+u;
const safe = (a) => Array.isArray(a)?a.filter(Boolean):[];

const ago = (s) => {
  if (!s) return "";
  const d=new Date(s), diff=Date.now()-d;
  if (isNaN(diff)) return "";
  if (diff<60e3)  return "À l'instant";
  if (diff<3.6e6) return Math.floor(diff/60e3)+"min";
  if (diff<864e5) return d.toLocaleTimeString([],{hour:"2-digit",minute:"2-digit"});
  return d.toLocaleDateString("fr-FR",{day:"2-digit",month:"short"});
};

const prefixSort = (arr,q) => {
  if (!q) return arr;
  const lq=q.toLowerCase();
  return [...arr].sort((a,b)=>{
    const af=`${a.prenom_user||""} ${a.nom_user||""}`.toLowerCase();
    const bf=`${b.prenom_user||""} ${b.nom_user||""}`.toLowerCase();
    const aS=af.startsWith(lq)||(a.prenom_user||"").toLowerCase().startsWith(lq)||(a.nom_user||"").toLowerCase().startsWith(lq);
    const bS=bf.startsWith(lq)||(b.prenom_user||"").toLowerCase().startsWith(lq)||(b.nom_user||"").toLowerCase().startsWith(lq);
    if(aS&&!bS) return -1; if(!aS&&bS) return 1;
    return af.localeCompare(bf);
  });
};

function Av({p="",n="",id,size=42}) {
  return (
    <div style={{width:size,height:size,borderRadius:"50%",flexShrink:0,background:col(id),
      display:"flex",alignItems:"center",justifyContent:"center",color:"#fff",
      fontWeight:700,fontSize:Math.round(size*.36),userSelect:"none"}}>
      {ini(p,n)}
    </div>
  );
}
function FileBubble({msg,isMe}) {
  if (!msg?.file_url) return null;
  const url=abs(msg.file_url);
  if (msg.msg_type==="image")
    return <a href={url} target="_blank" rel="noreferrer"><img src={url} alt="" style={{maxWidth:230,maxHeight:200,borderRadius:12,display:"block",marginTop:msg.text?8:0,objectFit:"cover"}}/></a>;
  if (msg.msg_type==="video")
    return <video controls style={{maxWidth:230,borderRadius:12,marginTop:msg.text?8:0,display:"block"}}><source src={url}/></video>;
  return (
    <a href={url} target="_blank" rel="noreferrer" style={{display:"inline-flex",alignItems:"center",gap:8,
      marginTop:msg.text?6:0,padding:"9px 14px",borderRadius:10,fontSize:13,fontWeight:600,textDecoration:"none",
      background:isMe?"rgba(255,255,255,0.18)":"#f0ecff",color:isMe?"#fff":"#7c5cbf",
      border:isMe?"1px solid rgba(255,255,255,0.25)":"1px solid #ddd6fe"}}>
      <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21.44 11.05l-9.19 9.19a6 6 0 01-8.49-8.49l8.57-8.57A4 4 0 1118 8.84l-8.59 8.57a2 2 0 01-2.83-2.83l8.49-8.48"/></svg>
      {msg.msg_type==="pdf"?"Ouvrir PDF":"Télécharger"}
    </a>
  );
}

export default function AdminContact() {
  const [convs,   setConvs]   = useState([]);
  const [sel,     setSel]     = useState(null);
  const [msgs,    setMsgs]    = useState([]);
  const [grpMsgs, setGrpMsgs] = useState([]);
  const [query,   setQuery]   = useState("");
  const [results, setResults] = useState([]);
  const [srching, setSrching] = useState(false);
  const [text,    setText]    = useState("");
  const [file,    setFile]    = useState(null);
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);

  const botRef  = useRef(null);
  const sockRef = useRef(null);
  const tmrRef  = useRef(null);
  const selRef  = useRef(null);
  const fRef    = useRef(null);

  const ME = (() => { try { return Number(JSON.parse(localStorage.getItem("user")||"{}").id_user||0); } catch { return 0; } })();

  // ── Socket ───────────────────────────────────────────────────────
  useEffect(() => {
    const token = localStorage.getItem("token");
    const s = io(BACKEND, {
      auth:{token}, transports:["websocket"],
      reconnection:true, reconnectionAttempts:10, reconnectionDelay:2000,
    });
    sockRef.current = s;

    s.on("connect", () => {
      s.emit("joinGroup");
      const cur = selRef.current;
      if (cur && cur!=="group" && cur.id)
        s.emit("joinConversation", { conversationId: cur.id });
    });

    // ✅ Backend émet uniquement vers le destinataire → on est toujours le destinataire ici
    s.on("newMessage", (m) => {
      if (!m?.id || !m?.conversation_id) return;
      const cur = selRef.current;

      setConvs(p => safe(p)
        .map(c => Number(c.id)===Number(m.conversation_id)
          ? {...c, last_message:m.text||`[${m.msg_type||"fichier"}]`, last_time:m.created_at}
          : c)
        .sort((a,b)=>new Date(b.last_time||0)-new Date(a.last_time||0))
      );

      if (cur && cur!=="group" && Number(m.conversation_id)===Number(cur.id)) {
        setMsgs(p => {
          const arr = safe(p);
          if (arr.some(x=>!x._temp && Number(x.id)===Number(m.id))) return arr;
          return [...arr, m];
        });
      }
    });

    s.on("newGroupMessage", (m) => {
      if (!m?.id) return;
      setGrpMsgs(p => {
        const arr = safe(p);
        if (arr.some(x=>!x._temp && Number(x.id)===Number(m.id))) return arr;
        return [...arr, m];
      });
    });

    s.on("connect_error", (e) => console.error("Socket:", e.message));
    return () => s.disconnect();
  }, []);

  useEffect(() => { selRef.current = sel; }, [sel]);

  const fetchConvs = useCallback(async () => {
    try { const r=await API.get("/messenger/conversations"); setConvs(safe(r.data)); }
    catch(e) { console.error(e); }
  }, []);
  useEffect(() => { fetchConvs(); }, [fetchConvs]);

  useEffect(() => {
    API.get("/messenger/group/messages").then(r=>setGrpMsgs(safe(r.data))).catch(()=>{});
  }, []);

  useEffect(() => {
    clearTimeout(tmrRef.current);
    const q=query.trim();
    if (!q) { setResults([]); setSrching(false); return; }
    setSrching(true);
    tmrRef.current = setTimeout(async () => {
      try {
        const r=await API.get(`/messenger/users/search?q=${encodeURIComponent(q)}`);
        setResults(prefixSort(safe(r.data).filter(u=>Number(u.id_user)!==ME), q));
      } catch { setResults([]); }
      finally { setSrching(false); }
    }, 300);
    return () => clearTimeout(tmrRef.current);
  }, [query]);

  const openConv = async (userInfo) => {
    setQuery(""); setResults([]);
    try {
      const r=await API.post("/messenger/conversation",{targetId:userInfo.id_user});
      if (!r.data?.id) return;
      const conv={id:r.data.id,user_a_id:r.data.user_a_id,user_b_id:r.data.user_b_id,
        id_user:userInfo.id_user,prenom_user:userInfo.prenom_user,nom_user:userInfo.nom_user,role:userInfo.role};
      setSel(conv);
      setConvs(p=>{const arr=safe(p);const ex=arr.find(c=>Number(c.id)===Number(conv.id));
        return ex?arr.map(c=>Number(c.id)===Number(conv.id)?{...c,...conv}:c):[conv,...arr];});
    } catch(e) { console.error(e); }
  };

  useEffect(() => {
    if (!sel||sel==="group"||!sel.id) return;
    setMsgs([]);
    setLoading(true);
    API.get(`/messenger/messages/${sel.id}`)
      .then(r=>{ setMsgs(safe(r.data)); sockRef.current?.emit("joinConversation",{conversationId:sel.id}); API.put(`/messenger/messages/read/${sel.id}`).catch(()=>{}); })
      .catch(e=>console.error(e))
      .finally(()=>setLoading(false));
  }, [sel?.id]);

  useEffect(() => {
    requestAnimationFrame(()=>botRef.current?.scrollIntoView({behavior:"smooth"}));
  }, [msgs, grpMsgs, sel]);

  const send = async () => {
    if ((!text.trim()&&!file)||!sel||sending) return;
    const t=text.trim(), f=file;
    setText(""); setFile(null);
    setSending(true);

    const optimistic={id:`temp_${Date.now()}`,_temp:true,
      conversation_id:sel!=="group"?sel.id:null,sender_id:ME,text:t||null,
      file_url:f?URL.createObjectURL(f):null,
      msg_type:f?(f.type.startsWith("image/")?"image":f.type.startsWith("video/")?"video":"pdf"):"text",
      created_at:new Date().toISOString()};

    if (sel==="group") setGrpMsgs(p=>[...safe(p),optimistic]);
    else               setMsgs(p=>[...safe(p),optimistic]);

    try {
      let res;
      if (sel==="group") {
        if (f){const fd=new FormData();fd.append("file",f);if(t) fd.append("text",t);res=await API.post("/messenger/group/messages/upload",fd);}
        else {res=await API.post("/messenger/group/messages",{text:t});}
        if (res?.data) setGrpMsgs(p=>safe(p).map(x=>x._temp?res.data:x));
      } else {
        if (f){const fd=new FormData();fd.append("file",f);fd.append("conversationId",String(sel.id));if(t) fd.append("text",t);res=await API.post("/messenger/messages/upload",fd);}
        else {res=await API.post("/messenger/messages",{conversationId:sel.id,text:t});}
        if (res?.data) setMsgs(p=>safe(p).map(x=>x._temp?res.data:x));
      }
    } catch(e) {
      console.error(e);
      if(sel==="group") setGrpMsgs(p=>safe(p).filter(x=>!x._temp));
      else              setMsgs(p=>safe(p).filter(x=>!x._temp));
      if(t) setText(t); if(f) setFile(f);
    } finally { setSending(false); }
  };

  const isGrp  = sel==="group";
  const isSrch = !!query.trim();
  const list   = isSrch?results:convs;
  const actMsgs= safe(isGrp?grpMsgs:msgs);
  const ok     = !!(text.trim()||file)&&!sending;

  return (
    <div className="admin-contact">
      <aside className="contacts-panel">
        <div style={{padding:"18px 16px 12px",borderBottom:"1px solid #ede9ff",flexShrink:0}}>
          <div style={{display:"flex",alignItems:"center",gap:9,marginBottom:14}}>
            <div style={{width:34,height:34,borderRadius:10,background:"linear-gradient(135deg,#7c5cbf,#5a3fa0)",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>
              <svg viewBox="0 0 24 24" width="17" height="17" fill="none" stroke="#fff" strokeWidth="2"><path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/></svg>
            </div>
            <span style={{fontSize:16,fontWeight:700,color:"#1a1a2e"}}>Messages</span>
          </div>
          <div style={{position:"relative"}}>
            <svg style={{position:"absolute",left:10,top:"50%",transform:"translateY(-50%)",pointerEvents:"none"}} width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#9e97c0" strokeWidth="2.5"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>
            <input value={query} onChange={e=>setQuery(e.target.value)} placeholder="Rechercher un utilisateur…"
              style={{width:"100%",padding:"9px 32px",boxSizing:"border-box",borderRadius:10,border:"1.5px solid #e0daff",background:"#f5f2ff",color:"#1a1a2e",fontSize:13,outline:"none",fontFamily:"inherit",transition:"border-color .2s"}}
              onFocus={e=>e.target.style.borderColor="#a78bfa"} onBlur={e=>e.target.style.borderColor="#e0daff"}/>
            {srching&&<div style={{position:"absolute",right:11,top:"50%",transform:"translateY(-50%)",width:13,height:13,borderRadius:"50%",border:"2px solid #e0daff",borderTopColor:"#7c5cbf",animation:"spin .7s linear infinite"}}/>}
            {query&&!srching&&<button onClick={()=>{setQuery("");setResults([]);}} style={{position:"absolute",right:10,top:"50%",transform:"translateY(-50%)",background:"none",border:"none",cursor:"pointer",color:"#9e97c0",fontSize:15,padding:0,lineHeight:1}}>✕</button>}
          </div>
        </div>

        <div className="chat-list">
          {!isSrch&&<>
            <div className="section-label">Groupe</div>
            <div className={`group-item ${isGrp?"active":""}`} onClick={()=>{setSel("group");setFile(null);}}>
              <div className="group-avatar">S</div>
              <div style={{flex:1,minWidth:0}}>
                <div style={{fontWeight:600,fontSize:13.5,color:"#1a1a2e"}}>Swafy</div>
                <div style={{fontSize:12,color:"#9e97c0",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>
                  {grpMsgs.length>0?(grpMsgs.at(-1)?.text||"[fichier]"):"Canal général"}
                </div>
              </div>
              <span style={{fontSize:9,fontWeight:700,background:"#ede9ff",color:"#7c5cbf",padding:"2px 7px",borderRadius:6,flexShrink:0}}>GROUPE</span>
            </div>
          </>}

          {!isSrch&&convs.length>0&&<div className="section-label">Conversations ({convs.length})</div>}
          {!isSrch&&convs.length===0&&<div style={{padding:"18px 16px",textAlign:"center",color:"#b0a9d4",fontSize:12}}>Aucune conversation</div>}
          {isSrch&&<div className="section-label">{srching?"Recherche…":results.length?`${results.length} résultat(s)`:"Aucun résultat"}</div>}

          {safe(list).map(item=>{
            if(!item) return null;
            const isActive=!isGrp&&sel&&sel!=="group"&&Number(sel.id)===Number(item.id);
            return (
              <div key={item.id||item.id_user} className={`chat-item ${isActive?"active":""}`}
                onClick={()=>isSrch?openConv(item):setSel(item)}>
                <Av p={item.prenom_user} n={item.nom_user} id={item.id_user} size={42}/>
                <div style={{flex:1,minWidth:0}}>
                  <div style={{display:"flex",justifyContent:"space-between",alignItems:"baseline"}}>
                    <span style={{fontWeight:600,fontSize:13.5,color:"#1a1a2e",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap",maxWidth:140}}>
                      {item.prenom_user||""} {item.nom_user||""}
                    </span>
                    {item.last_time&&<span style={{fontSize:10,color:"#b0a9d4",flexShrink:0,marginLeft:6}}>{ago(item.last_time)}</span>}
                  </div>
                  <p style={{fontSize:12,color:"#9e97c0",margin:0,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>
                    {isSrch?(item.role==="admin"?"👑 Admin":"👤 Jeune"):(item.last_message||"Nouvelle conversation")}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </aside>

      <main className="chat-window">
        {!sel?(
          <div style={{flex:1,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",gap:14,background:"#f7f8fc"}}>
            <div style={{width:80,height:80,borderRadius:24,background:"linear-gradient(135deg,#ede9ff,#d0c9f5)",display:"flex",alignItems:"center",justifyContent:"center"}}>
              <svg viewBox="0 0 24 24" width="36" height="36" fill="none" stroke="#7c5cbf" strokeWidth="1.5"><path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/></svg>
            </div>
            <p style={{fontSize:16,fontWeight:700,color:"#1a1a2e",margin:"0 0 4px",textAlign:"center"}}>Swafy Messages</p>
            <p style={{fontSize:13,color:"#9e97c0",margin:0,textAlign:"center"}}>Choisissez une conversation ou le groupe</p>
          </div>
        ):(<>
          <div style={{padding:"14px 20px",display:"flex",alignItems:"center",gap:12,background:"#fff",borderBottom:"1px solid #ede9ff",flexShrink:0,boxShadow:"0 1px 6px rgba(0,0,0,0.05)"}}>
            {isGrp?<div className="group-avatar" style={{width:42,height:42,fontSize:16}}>S</div>
              :<Av p={sel.prenom_user} n={sel.nom_user} id={sel.id_user} size={42}/>}
            <div style={{flex:1}}>
              <div style={{fontWeight:700,fontSize:14.5,color:"#1a1a2e"}}>
                {isGrp?"Swafy":`${sel.prenom_user||""} ${sel.nom_user||""}`}
              </div>
              <div style={{fontSize:11,color:"#22c55e",display:"flex",alignItems:"center",gap:5,marginTop:2}}>
                <span style={{width:7,height:7,borderRadius:"50%",background:"#22c55e",display:"inline-block"}}/>
                {isGrp?"Canal général":"En ligne"}
              </div>
            </div>
          </div>

          <div style={{flex:1,overflowY:"auto",padding:"16px 20px",display:"flex",flexDirection:"column",gap:6,background:"#f7f8fc"}}>
            {loading?(
              <div style={{margin:"auto",color:"#9e97c0",fontSize:13,textAlign:"center"}}>
                <div style={{width:28,height:28,borderRadius:"50%",border:"3px solid #e0daff",borderTopColor:"#7c5cbf",animation:"spin .7s linear infinite",margin:"0 auto 10px"}}/>
                Chargement…
              </div>
            ):actMsgs.length===0?(
              <div style={{margin:"auto",textAlign:"center"}}>
                <div style={{width:60,height:60,borderRadius:18,background:"linear-gradient(135deg,#ede9ff,#d0c9f5)",display:"flex",alignItems:"center",justifyContent:"center",margin:"0 auto 12px"}}>
                  <svg viewBox="0 0 24 24" width="28" height="28" fill="none" stroke="#7c5cbf" strokeWidth="1.5"><path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/></svg>
                </div>
                <div style={{fontWeight:600,color:"#6b6b8a",fontSize:14,marginBottom:4}}>Démarrez la conversation</div>
                <div style={{fontSize:12,color:"#9e97c0"}}>Soyez le premier à écrire !</div>
              </div>
            ):actMsgs.map(m=>{
              if(!m) return null;
              const isMe=Number(m.sender_id)===ME;
              return (
                <div key={m.id} style={{alignSelf:isMe?"flex-end":"flex-start",maxWidth:"72%",display:"flex",flexDirection:"column",gap:3,animation:"fadeUp .18s ease"}}>
                  {isGrp&&!isMe&&(
                    <div style={{display:"flex",alignItems:"center",gap:6,paddingLeft:4,marginBottom:2}}>
                      <Av p={m.prenom_user} n={m.nom_user} id={m.sender_id} size={20}/>
                      <span style={{fontSize:11,color:"#7c5cbf",fontWeight:700}}>{m.prenom_user} {m.nom_user}</span>
                    </div>
                  )}
                  <div style={{background:isMe?"linear-gradient(135deg,#7c5cbf,#5a3fa0)":"#fff",
                    color:isMe?"#fff":"#1a1a2e",padding:"10px 14px",
                    borderRadius:isMe?"18px 18px 4px 18px":"18px 18px 18px 4px",
                    fontSize:13.5,lineHeight:1.55,wordBreak:"break-word",
                    boxShadow:isMe?"0 4px 14px rgba(90,63,160,0.28)":"0 1px 4px rgba(0,0,0,0.07)",
                    border:isMe?"none":"1px solid #ede9ff",opacity:m._temp?0.6:1}}>
                    {m.text&&<div>{m.text}</div>}
                    <FileBubble msg={m} isMe={isMe}/>
                  </div>
                  <span style={{fontSize:10,color:"#9e97c0",textAlign:isMe?"right":"left",paddingInline:4}}>
                    {m._temp?"Envoi…":ago(m.created_at)}
                  </span>
                </div>
              );
            })}
            <div ref={botRef}/>
          </div>

          {file&&(
            <div className="file-preview-bar">
              <span>{file.type.startsWith("image/")?"🖼️":file.type.startsWith("video/")?"🎬":"📄"}</span>
              <span style={{flex:1,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap",fontSize:13}}>{file.name}</span>
              <span style={{fontSize:11,color:"#9e97c0"}}>{(file.size/1024).toFixed(0)} Ko</span>
              <button onClick={()=>setFile(null)} style={{background:"none",border:"none",cursor:"pointer",color:"#ef4444",fontSize:18,padding:"0 4px",lineHeight:1}}>✕</button>
            </div>
          )}

          <div style={{padding:"10px 14px",borderTop:"1px solid #ede9ff",display:"flex",alignItems:"flex-end",gap:8,background:"#fff",flexShrink:0}}>
            <button onClick={()=>fRef.current?.click()}
              style={{width:40,height:40,borderRadius:11,border:"1.5px solid #e0daff",background:"#f5f2ff",cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0,color:"#7c5cbf",transition:"background .15s"}}
              onMouseEnter={e=>e.currentTarget.style.background="#ede9ff"}
              onMouseLeave={e=>e.currentTarget.style.background="#f5f2ff"}
              title="Joindre image / vidéo / PDF">
              <svg viewBox="0 0 24 24" fill="none" width="18" height="18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m21.44 11.05-9.19 9.19a6 6 0 0 1-8.49-8.49l8.57-8.57A4 4 0 1 1 18 8.84l-8.59 8.57a2 2 0 0 1-2.83-2.83l8.49-8.48"/></svg>
            </button>
            <input ref={fRef} type="file" accept="image/*,video/*,application/pdf" style={{display:"none"}}
              onChange={e=>{setFile(e.target.files[0]||null);e.target.value="";}}/>
            <textarea value={text}
              onChange={e=>{setText(e.target.value);e.target.style.height="40px";e.target.style.height=Math.min(e.target.scrollHeight,120)+"px";}}
              onKeyDown={e=>{if(e.key==="Enter"&&!e.shiftKey){e.preventDefault();send();}}}
              placeholder="Écrire un message…"
              style={{flex:1,padding:"10px 14px",borderRadius:12,border:"1.5px solid #e0daff",background:"#f5f2ff",color:"#1a1a2e",fontSize:13.5,outline:"none",resize:"none",fontFamily:"inherit",caretColor:"#7c5cbf",height:40,maxHeight:120,overflowY:"auto",lineHeight:1.5,transition:"border-color .2s"}}
              onFocus={e=>e.target.style.borderColor="#a78bfa"} onBlur={e=>e.target.style.borderColor="#e0daff"}/>
            <button onClick={send} disabled={!ok}
              style={{width:42,height:42,borderRadius:12,border:"none",flexShrink:0,background:ok?"linear-gradient(135deg,#7c5cbf,#5a3fa0)":"#e8e3ff",color:ok?"#fff":"#c4bde8",cursor:ok?"pointer":"default",display:"flex",alignItems:"center",justifyContent:"center",boxShadow:ok?"0 4px 14px rgba(90,63,160,0.35)":"none",transition:"all .2s"}}>
              {sending?<div style={{width:16,height:16,borderRadius:"50%",border:"2px solid rgba(255,255,255,0.4)",borderTopColor:"#fff",animation:"spin .7s linear infinite"}}/>
                :<svg viewBox="0 0 24 24" fill="none" width="18" height="18"><path d="M22 2L11 13M22 2L15 22L11 13M22 2L2 9L11 13" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>}
            </button>
          </div>
        </>)}
      </main>

      <style>{`
        @keyframes spin   { to { transform: rotate(360deg); } }
        @keyframes fadeUp { from { opacity:0; transform:translateY(8px); } to { opacity:1; transform:translateY(0); } }
      `}</style>
    </div>
  );
}