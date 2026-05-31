import { useEffect, useRef, useState, useCallback } from "react";
import { io } from "socket.io-client";
import API from "../services/api";
import "./AdminContact.css";

const BACKEND = import.meta.env.VITE_BACKEND_URL || "https://debat-jeune-production.up.railway.app";
const PALETTE  = ["#7c5cfc","#3b82f6","#22c55e","#f59e0b","#ef4444","#ec4899","#06b6d4","#8b5cf6"];

const ini  = (p,n) => { const ps=String(p??""); const ns=String(n??""); return ((ps[0]||"")+(ns[0]||"")).toUpperCase()||"?"; };
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

/* ── Avatar ── */
function Av({p,n,id,size=40}) {
  return (
    <div style={{
      width:size, height:size, borderRadius:"50%", flexShrink:0,
      background:`linear-gradient(135deg,${col(id)},${col((Number(id)||0)+2)})`,
      display:"flex", alignItems:"center", justifyContent:"center",
      color:"#fff", fontWeight:700, fontSize:Math.round(size*.36),
      userSelect:"none", boxShadow:`0 2px 8px ${col(id)}55`,
    }}>
      {ini(p,n)}
    </div>
  );
}

/* ── File bubble ── */
function FileBubble({msg,isMe}) {
  if (!msg?.file_url) return null;
  const url=abs(msg.file_url);
  if (msg.msg_type==="image")
    return <a href={url} target="_blank" rel="noreferrer">
      <img src={url} alt="" style={{maxWidth:220,maxHeight:190,borderRadius:10,display:"block",marginTop:msg.text?8:0,objectFit:"cover"}}/>
    </a>;
  if (msg.msg_type==="video")
    return <video controls style={{maxWidth:220,borderRadius:10,marginTop:msg.text?8:0,display:"block"}}>
      <source src={url}/>
    </video>;
  return (
    <a href={url} target="_blank" rel="noreferrer" style={{
      display:"inline-flex",alignItems:"center",gap:7,marginTop:msg.text?6:0,
      padding:"8px 12px",borderRadius:9,fontSize:12.5,fontWeight:600,textDecoration:"none",
      background:isMe?"rgba(255,255,255,0.15)":"rgba(124,92,252,0.15)",
      color:isMe?"#e8e8f8":"#a78bfa",
      border:isMe?"1px solid rgba(255,255,255,0.2)":"1px solid rgba(124,92,252,0.3)",
    }}>
      <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M21.44 11.05l-9.19 9.19a6 6 0 01-8.49-8.49l8.57-8.57A4 4 0 1118 8.84l-8.59 8.57a2 2 0 01-2.83-2.83l8.49-8.48"/>
      </svg>
      {msg.msg_type==="pdf"?"Ouvrir PDF":"Télécharger"}
    </a>
  );
}

/* ── Unread badge ── */
function UnreadBadge({count}) {
  if (!count||count<1) return null;
  return (
    <span style={{
      marginLeft:"auto",flexShrink:0,
      background:"linear-gradient(135deg,#ef4444,#dc2626)",
      color:"#fff",fontSize:9.5,fontWeight:800,
      padding:"2px 6px",borderRadius:8,minWidth:16,textAlign:"center",
      lineHeight:"15px",display:"inline-block",
      boxShadow:"0 2px 6px rgba(239,68,68,0.4)",
    }}>
      {count>99?"99+":count}
    </span>
  );
}

export default function AdminContact({ onUnreadChange }) {
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
  const [unread,  setUnread]  = useState({});

  const botRef  = useRef(null);
  const sockRef = useRef(null);
  const tmrRef  = useRef(null);
  const selRef  = useRef(null);
  const fRef    = useRef(null);

  const ME = (() => { try { return Number(JSON.parse(localStorage.getItem("user")||"{}").id_user||0); } catch { return 0; } })();

  useEffect(() => {
    const total = Object.values(unread).reduce((s,v)=>s+(v||0),0);
    onUnreadChange?.(total);
  }, [unread, onUnreadChange]);

  const fetchUnreadCounts = useCallback(async () => {
    try {
      const r = await API.get("/messenger/conversations/unread-counts");
      if (Array.isArray(r.data)) {
        const map = {};
        r.data.forEach(row => { map[row.conversation_id]=Number(row.unread_count||0); });
        setUnread(map);
      }
    } catch {}
  }, []);

  /* ── Socket ── */
  useEffect(() => {
    const token = localStorage.getItem("token");
    const s = io(BACKEND,{auth:{token},transports:["websocket"],reconnection:true,reconnectionAttempts:10,reconnectionDelay:2000});
    sockRef.current = s;

    s.on("connect",()=>{
      s.emit("joinGroup");
      const cur=selRef.current;
      if(cur&&cur!=="group"&&cur.id) s.emit("joinConversation",{conversationId:cur.id});
    });

    s.on("newMessage",(m)=>{
      if(!m?.id||!m?.conversation_id) return;
      const cur=selRef.current;
      setConvs(p=>safe(p)
        .map(c=>Number(c.id)===Number(m.conversation_id)?{...c,last_message:m.text||`[${m.msg_type||"fichier"}]`,last_time:m.created_at}:c)
        .sort((a,b)=>new Date(b.last_time||0)-new Date(a.last_time||0)));
      if(cur&&cur!=="group"&&Number(m.conversation_id)===Number(cur.id)){
        setMsgs(p=>{const arr=safe(p);if(arr.some(x=>!x._temp&&Number(x.id)===Number(m.id))) return arr;return [...arr,m];});
        API.put(`/messenger/messages/read/${m.conversation_id}`).catch(()=>{});
      } else {
        if(Number(m.sender_id)!==ME) setUnread(prev=>({...prev,[m.conversation_id]:(prev[m.conversation_id]||0)+1}));
      }
    });

    s.on("newGroupMessage",(m)=>{
      if(!m?.id) return;
      setGrpMsgs(p=>{const arr=safe(p);if(arr.some(x=>!x._temp&&Number(x.id)===Number(m.id))) return arr;return [...arr,m];});
    });

    s.on("connect_error",(e)=>console.error("Socket:",e.message));
    return ()=>s.disconnect();
  }, []);

  useEffect(()=>{ selRef.current=sel; },[sel]);

  const fetchConvs = useCallback(async()=>{
    try { const r=await API.get("/messenger/conversations"); setConvs(safe(r.data)); } catch(e){console.error(e);}
  },[]);

  useEffect(()=>{ fetchConvs(); fetchUnreadCounts(); },[fetchConvs,fetchUnreadCounts]);
  useEffect(()=>{ API.get("/messenger/group/messages").then(r=>setGrpMsgs(safe(r.data))).catch(()=>{}); },[]);

  useEffect(()=>{
    clearTimeout(tmrRef.current);
    const q=query.trim();
    if(!q){setResults([]);setSrching(false);return;}
    setSrching(true);
    tmrRef.current=setTimeout(async()=>{
      try { const r=await API.get(`/messenger/users/search?q=${encodeURIComponent(q)}`); setResults(prefixSort(safe(r.data).filter(u=>Number(u.id_user)!==ME),q)); }
      catch{setResults([]);}
      finally{setSrching(false);}
    },300);
    return()=>clearTimeout(tmrRef.current);
  },[query]);

  const openConv = async(userInfo)=>{
    setQuery("");setResults([]);
    try{
      const r=await API.post("/messenger/conversation",{targetId:userInfo.id_user});
      if(!r.data?.id) return;
      const conv={id:r.data.id,user_a_id:r.data.user_a_id,user_b_id:r.data.user_b_id,
        id_user:userInfo.id_user,prenom_user:userInfo.prenom_user,nom_user:userInfo.nom_user,role:userInfo.role};
      setSel(conv);
      setConvs(p=>{const arr=safe(p);const ex=arr.find(c=>Number(c.id)===Number(conv.id));
        return ex?arr.map(c=>Number(c.id)===Number(conv.id)?{...c,...conv}:c):[conv,...arr];});
    }catch(e){console.error(e);}
  };

  const openSel=(item)=>{
    setSel(item);
    if(item&&item!=="group"&&item.id){
      setUnread(prev=>{const next={...prev};delete next[item.id];return next;});
      API.put(`/messenger/messages/read/${item.id}`).catch(()=>{});
    }
  };

  useEffect(()=>{
    if(!sel||sel==="group"||!sel.id) return;
    setMsgs([]);setLoading(true);
    API.get(`/messenger/messages/${sel.id}`)
      .then(r=>{
        setMsgs(safe(r.data));
        sockRef.current?.emit("joinConversation",{conversationId:sel.id});
        API.put(`/messenger/messages/read/${sel.id}`).catch(()=>{});
        setUnread(prev=>{const next={...prev};delete next[sel.id];return next;});
      })
      .catch(e=>console.error(e))
      .finally(()=>setLoading(false));
  },[sel?.id]);

  useEffect(()=>{
    requestAnimationFrame(()=>botRef.current?.scrollIntoView({behavior:"smooth"}));
  },[msgs,grpMsgs,sel]);

  const send=async()=>{
    if((!text.trim()&&!file)||!sel||sending) return;
    const t=text.trim(),f=file;
    setText("");setFile(null);setSending(true);
    const optimistic={id:`temp_${Date.now()}`,_temp:true,
      conversation_id:sel!=="group"?sel.id:null,sender_id:ME,text:t||null,
      file_url:f?URL.createObjectURL(f):null,
      msg_type:f?(f.type.startsWith("image/")?"image":f.type.startsWith("video/")?"video":"pdf"):"text",
      created_at:new Date().toISOString()};
    if(sel==="group") setGrpMsgs(p=>[...safe(p),optimistic]);
    else              setMsgs(p=>[...safe(p),optimistic]);
    try{
      let res;
      if(sel==="group"){
        if(f){const fd=new FormData();fd.append("file",f);if(t)fd.append("text",t);res=await API.post("/messenger/group/messages/upload",fd);}
        else{res=await API.post("/messenger/group/messages",{text:t});}
        if(res?.data) setGrpMsgs(p=>safe(p).map(x=>x._temp?res.data:x));
      }else{
        if(f){const fd=new FormData();fd.append("file",f);fd.append("conversationId",String(sel.id));if(t)fd.append("text",t);res=await API.post("/messenger/messages/upload",fd);}
        else{res=await API.post("/messenger/messages",{conversationId:sel.id,text:t});}
        if(res?.data) setMsgs(p=>safe(p).map(x=>x._temp?res.data:x));
      }
    }catch(e){
      console.error(e);
      if(sel==="group") setGrpMsgs(p=>safe(p).filter(x=>!x._temp));
      else              setMsgs(p=>safe(p).filter(x=>!x._temp));
      if(t) setText(t); if(f) setFile(f);
    }finally{setSending(false);}
  };

  const isGrp=sel==="group";
  const isSrch=!!query.trim();
  const filteredConvs=convs.filter(c=>c.id_user!=null);
  const list=isSrch?results:filteredConvs;
  const actMsgs=safe(isGrp?grpMsgs:msgs);
  const ok=!!(text.trim()||file)&&!sending;

  return (
    <div className="ac-root">

      {/* ── SIDEBAR ── */}
      <aside className="ac-sidebar">
        <div className="ac-sidebar-top">
          <div className="ac-sidebar-header">
            <div className="ac-logo-icon">
              <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="#fff" strokeWidth="2">
                <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/>
              </svg>
            </div>
            <span className="ac-sidebar-title">Messages</span>
          </div>

          <div className="ac-search-wrap">
            <svg className="ac-search-icon" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
            </svg>
            <input
              className="ac-search"
              value={query}
              onChange={e=>setQuery(e.target.value)}
              placeholder="Rechercher…"
            />
            {srching && <div className="ac-search-spin"/>}
            {query && !srching && (
              <button className="ac-search-clear" onClick={()=>{setQuery("");setResults([]);}}>✕</button>
            )}
          </div>
        </div>

        <div className="ac-list">
          {/* Groupe */}
          {!isSrch && <>
            <div className="ac-section-label">Groupe</div>
            <div className={`ac-group-item ${isGrp?"active":""}`} onClick={()=>{setSel("group");setFile(null);}}>
              <div className="ac-group-avatar">S</div>
              <div className="ac-item-meta">
                <span className="ac-item-name">Swafy</span>
                <span className="ac-item-last">
                  {grpMsgs.length>0?(grpMsgs.at(-1)?.text||"[fichier]"):"Canal général"}
                </span>
              </div>
              <span className="ac-group-badge">GROUPE</span>
            </div>
          </>}

          {/* Conversations */}
          {!isSrch && filteredConvs.length>0 && (
            <div className="ac-section-label">Conversations ({filteredConvs.length})</div>
          )}
          {!isSrch && filteredConvs.length===0 && (
            <div className="ac-list-empty">Aucune conversation</div>
          )}
          {isSrch && (
            <div className="ac-section-label">
              {srching?"Recherche…":results.length?`${results.length} résultat(s)`:"Aucun résultat"}
            </div>
          )}

          {safe(list).map(item=>{
            if(!item) return null;
            const isActive=!isGrp&&sel&&sel!=="group"&&Number(sel.id)===Number(item.id);
            const unreadCount=isSrch?0:(unread[item.id]||0);
            return (
              <div key={item.id||item.id_user}
                className={`ac-conv-item ${isActive?"active":""}`}
                onClick={()=>isSrch?openConv(item):openSel(item)}
              >
                <Av p={item.prenom_user} n={item.nom_user} id={item.id_user} size={40}/>
                <div className="ac-item-meta">
                  <div className="ac-item-row">
                    <span className="ac-item-name" style={{fontWeight:unreadCount>0?700:600}}>
                      {String(item.prenom_user??"")} {String(item.nom_user??"")}
                    </span>
                    <div style={{display:"flex",alignItems:"center",gap:5,flexShrink:0}}>
                      {item.last_time && <span className="ac-item-time">{ago(item.last_time)}</span>}
                      <UnreadBadge count={unreadCount}/>
                    </div>
                  </div>
                  <span className="ac-item-last" style={{fontWeight:unreadCount>0?600:400,color:unreadCount>0?"#a78bfa":undefined}}>
                    {isSrch?(item.role==="admin"?"Admin":"Jeune"):(item.last_message||"Nouvelle conversation")}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </aside>

      {/* ── CHAT WINDOW ── */}
      <main className="ac-chat">
        {!sel ? (
          <div className="ac-empty-state">
            <div className="ac-empty-icon">
              <svg viewBox="0 0 24 24" width="34" height="34" fill="none" stroke="#a78bfa" strokeWidth="1.5">
                <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/>
              </svg>
            </div>
            <p className="ac-empty-title">Swafy Messages</p>
            <p className="ac-empty-sub">Choisissez une conversation ou le groupe</p>
          </div>
        ) : (<>

          {/* Header */}
          <div className="ac-chat-header">
            {isGrp
              ? <div className="ac-group-avatar sm">S</div>
              : <Av p={sel.prenom_user} n={sel.nom_user} id={sel.id_user} size={40}/>
            }
            <div>
              <div className="ac-chat-name">
                {isGrp?"Swafy":`${String(sel.prenom_user??"")} ${String(sel.nom_user??"")}`}
              </div>
              <div className="ac-chat-status">
                <span className="ac-online-dot"/>
                {isGrp?"Canal général":"En ligne"}
              </div>
            </div>
          </div>

          {/* Messages */}
          <div className="ac-messages">
            {loading ? (
              <div className="ac-msg-loading">
                <div className="ac-spinner"/>
                <span>Chargement…</span>
              </div>
            ) : actMsgs.length===0 ? (
              <div className="ac-msg-empty">
                <div className="ac-msg-empty-icon">
                  <svg viewBox="0 0 24 24" width="26" height="26" fill="none" stroke="#a78bfa" strokeWidth="1.5">
                    <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/>
                  </svg>
                </div>
                <div className="ac-msg-empty-title">Démarrez la conversation</div>
                <div className="ac-msg-empty-sub">Soyez le premier à écrire !</div>
              </div>
            ) : actMsgs.map(m=>{
              if(!m) return null;
              const isMe=Number(m.sender_id)===ME;
              return (
                <div key={m.id} className={`ac-msg-row ${isMe?"mine":"theirs"}`}>
                  {isGrp&&!isMe&&(
                    <div className="ac-msg-sender">
                      <Av p={m.prenom_user} n={m.nom_user} id={m.sender_id} size={20}/>
                      <span>{String(m.prenom_user??"")} {String(m.nom_user??"")}</span>
                    </div>
                  )}
                  <div className={`ac-bubble ${isMe?"mine":"theirs"}`} style={{opacity:m._temp?0.6:1}}>
                    {m.text&&<div>{m.text}</div>}
                    <FileBubble msg={m} isMe={isMe}/>
                  </div>
                  <span className={`ac-msg-time ${isMe?"right":"left"}`}>
                    {m._temp?"Envoi…":ago(m.created_at)}
                  </span>
                </div>
              );
            })}
            <div ref={botRef}/>
          </div>

          {/* File preview */}
          {file && (
            <div className="ac-file-preview">
              <span>{file.type.startsWith("image/")?"🖼️":file.type.startsWith("video/")?"🎬":"📄"}</span>
              <span className="ac-file-name">{file.name}</span>
              <span className="ac-file-size">{(file.size/1024).toFixed(0)} Ko</span>
              <button onClick={()=>setFile(null)} className="ac-file-remove">✕</button>
            </div>
          )}

          {/* Input bar */}
          <div className="ac-input-bar">
            <button className="ac-attach-btn" onClick={()=>fRef.current?.click()} title="Joindre">
              <svg viewBox="0 0 24 24" fill="none" width="17" height="17" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="m21.44 11.05-9.19 9.19a6 6 0 0 1-8.49-8.49l8.57-8.57A4 4 0 1 1 18 8.84l-8.59 8.57a2 2 0 0 1-2.83-2.83l8.49-8.48"/>
              </svg>
            </button>
            <input ref={fRef} type="file" accept="image/*,video/*,application/pdf" style={{display:"none"}}
              onChange={e=>{setFile(e.target.files[0]||null);e.target.value="";}}/>
            <textarea
              className="ac-textarea"
              value={text}
              onChange={e=>{setText(e.target.value);e.target.style.height="40px";e.target.style.height=Math.min(e.target.scrollHeight,120)+"px";}}
              onKeyDown={e=>{if(e.key==="Enter"&&!e.shiftKey){e.preventDefault();send();}}}
              placeholder="Écrire un message…"
            />
            <button className={`ac-send-btn ${ok?"active":""}`} onClick={send} disabled={!ok}>
              {sending
                ? <div className="ac-send-spin"/>
                : <svg viewBox="0 0 24 24" fill="none" width="17" height="17">
                    <path d="M22 2L11 13M22 2L15 22L11 13M22 2L2 9L11 13" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
              }
            </button>
          </div>
        </>)}
      </main>
    </div>
  );
}