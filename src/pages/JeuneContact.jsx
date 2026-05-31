import { useEffect, useRef, useState, useCallback } from "react";
import { io } from "socket.io-client";
import API from "../services/api";
import "./AdminContact.css";

const BACKEND = import.meta.env.VITE_BACKEND_URL || "https://debat-jeune.onrender.com";
const COLORS   = ["#6d56c1","#2563eb","#059669","#d97706","#dc2626","#7c3aed","#0891b2","#be185d"];

const initials  = (p="",n="") => ((p[0]||"")+(n[0]||"")).toUpperCase()||"?";
const avatarCol = (id) => COLORS[(Number(id)||0)%COLORS.length];
const resolveUrl= (u) => (!u?null:u.startsWith("http")?u:`${BACKEND}${u}`);
// ✅ filtre null/undefined de tout array
const safe      = (a) => Array.isArray(a)?a.filter(Boolean):[];

const fmtTime = (s) => {
  if (!s) return "";
  const d=new Date(s), diff=Date.now()-d;
  if (isNaN(diff)) return "";
  if (diff<60e3)  return "À l'instant";
  if (diff<3.6e6) return `${Math.floor(diff/60e3)}min`;
  if (diff<864e5) return d.toLocaleTimeString([],{hour:"2-digit",minute:"2-digit"});
  return d.toLocaleDateString("fr-FR",{day:"2-digit",month:"short"});
};

function Av({user,size=42}) {
  if (user?.photo_user)
    return <img src={user.photo_user} alt="" style={{width:size,height:size,borderRadius:"50%",objectFit:"cover",flexShrink:0}}/>;
  return (
    <div style={{width:size,height:size,borderRadius:"50%",flexShrink:0,background:avatarCol(user?.id_user),
      display:"flex",alignItems:"center",justifyContent:"center",color:"#fff",
      fontWeight:700,fontSize:Math.round(size*.35),userSelect:"none"}}>
      {initials(user?.prenom_user,user?.nom_user)}
    </div>
  );
}
function AdminAv({size=42}) {
  return (
    <div style={{width:size,height:size,borderRadius:"50%",flexShrink:0,
      background:"linear-gradient(135deg,#6d56c1,#4f3fa0)",
      display:"flex",alignItems:"center",justifyContent:"center",
      color:"#fff",fontWeight:800,fontSize:Math.round(size*.42),userSelect:"none"}}>S</div>
  );
}
function FileBubble({msg,isMe}) {
  if (!msg?.file_url) return null;
  const url=resolveUrl(msg.file_url);
  if (msg.msg_type==="image")
    return <a href={url} target="_blank" rel="noreferrer"><img src={url} alt="" style={{maxWidth:230,maxHeight:200,borderRadius:12,display:"block",marginTop:msg.text?8:0,objectFit:"cover"}}/></a>;
  if (msg.msg_type==="video")
    return <video controls style={{maxWidth:230,borderRadius:12,marginTop:msg.text?8:0,display:"block"}}><source src={url}/></video>;
  return (
    <a href={url} target="_blank" rel="noreferrer" style={{display:"inline-flex",alignItems:"center",gap:8,
      marginTop:msg.text?6:0,padding:"9px 14px",borderRadius:10,fontSize:13,fontWeight:600,textDecoration:"none",
      background:isMe?"rgba(255,255,255,0.18)":"#f0ecff",color:isMe?"#fff":"#6d56c1",
      border:isMe?"1px solid rgba(255,255,255,0.25)":"1px solid #ddd6fe"}}>
      <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21.44 11.05l-9.19 9.19a6 6 0 01-8.49-8.49l8.57-8.57A4 4 0 1118 8.84l-8.59 8.57a2 2 0 01-2.83-2.83l8.49-8.48"/></svg>
      {msg.msg_type==="pdf"?"Ouvrir PDF":"Télécharger"}
    </a>
  );
}

export default function JeuneContact() {
  const [convs,       setConvs]       = useState([]);
  const [admins,      setAdmins]      = useState([]);
  const [sel,         setSel]         = useState(null);
  const [msgs,        setMsgs]        = useState([]);
  const [grpMsgs,     setGrpMsgs]     = useState([]);
  const [query,       setQuery]       = useState("");
  const [results,     setResults]     = useState([]);
  const [searching,   setSearching]   = useState(false);
  const [text,        setText]        = useState("");
  const [filePrev,    setFilePrev]    = useState(null);
  const [loadingMsgs, setLoadingMsgs] = useState(false);
  const [sending,     setSending]     = useState(false);

  const bottomRef = useRef(null);
  const sockRef   = useRef(null);
  const timerRef  = useRef(null);
  const selRef    = useRef(null);
  const fileRef   = useRef(null);

  const myId = (() => { try { return Number(JSON.parse(localStorage.getItem("user")||"{}").id_user||0); } catch { return 0; } })();

  // ── Socket ───────────────────────────────────────────────────────
  useEffect(() => {
    const token = localStorage.getItem("token");
    const sock  = io(BACKEND, {
      auth:{token}, transports:["websocket"],
      reconnection:true, reconnectionAttempts:10, reconnectionDelay:2000,
    });
    sockRef.current = sock;

    sock.on("connect", () => {
      sock.emit("joinGroup");
      const cur = selRef.current;
      if (cur && cur!=="group" && cur.id)
        sock.emit("joinConversation", { conversationId: cur.id });
    });

    // ✅ Backend n'émet QUE vers le destinataire → ici on est forcément le destinataire
    // Pas besoin de vérifier sender_id, juste ajouter le message directement
    sock.on("newMessage", (m) => {
      if (!m?.id || !m?.conversation_id) return;
      const cur = selRef.current;

      // Mettre à jour la sidebar (toujours)
      setConvs(p => safe(p)
        .map(c => Number(c.id)===Number(m.conversation_id)
          ? {...c, last_message:m.text||`[${m.msg_type||"fichier"}]`, last_time:m.created_at}
          : c)
        .sort((a,b)=>new Date(b.last_time||0)-new Date(a.last_time||0))
      );

      // Ajouter dans la conversation ouverte
      if (cur && cur!=="group" && Number(m.conversation_id)===Number(cur.id)) {
        setMsgs(p => {
          const arr = safe(p);
          // Pas de doublon
          if (arr.some(x=>!x._temp && Number(x.id)===Number(m.id))) return arr;
          return [...arr, m];
        });
      }
    });

    // ✅ Même logique pour le groupe
    sock.on("newGroupMessage", (m) => {
      if (!m?.id) return;
      setGrpMsgs(p => {
        const arr = safe(p);
        if (arr.some(x=>!x._temp && Number(x.id)===Number(m.id))) return arr;
        return [...arr, m];
      });
    });

    sock.on("connect_error", (e) => console.error("Socket:", e.message));
    return () => sock.disconnect();
  }, []);

  useEffect(() => { selRef.current = sel; }, [sel]);

  // ── Fetch conversations ──────────────────────────────────────────
  const fetchConvs = useCallback(async () => {
    try {
      const r = await API.get("/messenger/conversations");
      const all = safe(r.data);
      // ✅ Dédupliquer: garder une seule conv par admin (la plus récente en premier)
      const seen = new Set();
      const deduped = all.filter(c => {
        const key = Number(c.id_user);
        if (!key || seen.has(key)) return false;
        seen.add(key);
        return true;
      });
      setConvs(deduped);
    } catch(e) { console.error(e); }
  }, []);
  useEffect(() => { fetchConvs(); }, [fetchConvs]);

  // ── Fetch admins + group ─────────────────────────────────────────
  useEffect(() => {
    API.get("/messenger/admins").then(r=>setAdmins(safe(r.data))).catch(()=>{});
    API.get("/messenger/group/messages").then(r=>setGrpMsgs(safe(r.data))).catch(()=>{});
  }, []);

  // ── Search admins ────────────────────────────────────────────────
  useEffect(() => {
    clearTimeout(timerRef.current);
    const q=query.trim();
    if (!q) { setResults([]); setSearching(false); return; }
    setSearching(true);
    timerRef.current = setTimeout(() => {
      const lq=q.toLowerCase();
      setResults(safe(admins).filter(u=>`${u.prenom_user||""} ${u.nom_user||""}`.toLowerCase().includes(lq)));
      setSearching(false);
    }, 250);
    return () => clearTimeout(timerRef.current);
  }, [query, admins]);

  // ── Open conversation ────────────────────────────────────────────
  const openConv = async (targetUser) => {
    setQuery(""); setResults([]);
    try {
      const r = await API.post("/messenger/conversation",{targetId:targetUser.id_user});
      if (!r.data?.id) return;
      const conv = {
        id:r.data.id, user_a_id:r.data.user_a_id, user_b_id:r.data.user_b_id,
        id_user:targetUser.id_user, nom_user:targetUser.nom_user,
        prenom_user:targetUser.prenom_user, role:targetUser.role,
      };
      setSel(conv);
      setConvs(p=>{
        const arr=safe(p);
        const ex=arr.find(c=>Number(c.id)===Number(conv.id));
        return ex?arr.map(c=>Number(c.id)===Number(conv.id)?{...c,...conv}:c):[conv,...arr];
      });
    } catch(e) { console.error(e); }
  };

  // ── Load messages ────────────────────────────────────────────────
  useEffect(() => {
    if (!sel||sel==="group"||!sel.id) return;
    setMsgs([]);
    setLoadingMsgs(true);
    API.get(`/messenger/messages/${sel.id}`)
      .then(r=>{ setMsgs(safe(r.data)); sockRef.current?.emit("joinConversation",{conversationId:sel.id}); API.put(`/messenger/messages/read/${sel.id}`).catch(()=>{}); })
      .catch(e=>console.error(e))
      .finally(()=>setLoadingMsgs(false));
  }, [sel?.id]);

  // ── Auto-scroll ──────────────────────────────────────────────────
  useEffect(() => {
    requestAnimationFrame(()=>bottomRef.current?.scrollIntoView({behavior:"smooth"}));
  }, [msgs, grpMsgs, sel]);

  // ── Send ─────────────────────────────────────────────────────────
  const send = async () => {
    if ((!text.trim()&&!filePrev)||!sel||sending) return;
    const msgText=text.trim(), file=filePrev;
    setText(""); setFilePrev(null);
    setSending(true);

    // Message optimiste — visible immédiatement, opacity 0.6
    const optimistic = {
      id:`temp_${Date.now()}`, _temp:true,
      conversation_id:sel!=="group"?sel.id:null,
      sender_id:myId, text:msgText||null,
      file_url:file?URL.createObjectURL(file):null,
      msg_type:file?(file.type.startsWith("image/")?"image":file.type.startsWith("video/")?"video":"pdf"):"text",
      created_at:new Date().toISOString(),
    };

    if (sel==="group") setGrpMsgs(p=>[...safe(p),optimistic]);
    else               setMsgs(p=>[...safe(p),optimistic]);

    try {
      let res;
      if (sel==="group") {
        if (file) { const fd=new FormData(); fd.append("file",file); if(msgText) fd.append("text",msgText); res=await API.post("/messenger/group/messages/upload",fd); }
        else { res=await API.post("/messenger/group/messages",{text:msgText}); }
        // ✅ Remplacer optimiste par vrai message — socket n'arrivera PAS (backend exclut sender)
        if (res?.data) setGrpMsgs(p=>safe(p).map(x=>x._temp?res.data:x));
      } else {
        if (file) { const fd=new FormData(); fd.append("file",file); fd.append("conversationId",String(sel.id)); if(msgText) fd.append("text",msgText); res=await API.post("/messenger/messages/upload",fd); }
        else { res=await API.post("/messenger/messages",{conversationId:sel.id,text:msgText}); }
        // ✅ Remplacer optimiste par vrai message
        if (res?.data) setMsgs(p=>safe(p).map(x=>x._temp?res.data:x));
      }
    } catch(e) {
      console.error(e);
      if(sel==="group") setGrpMsgs(p=>safe(p).filter(x=>!x._temp));
      else              setMsgs(p=>safe(p).filter(x=>!x._temp));
      if(msgText) setText(msgText);
      if(file) setFilePrev(file);
    } finally { setSending(false); }
  };

  const isGroup        = sel==="group";
  const isSearch       = !!query.trim();
  const listItems      = isSearch?results:convs;
  const adminNotInConv = safe(admins).filter(a=>!safe(convs).find(c=>Number(c.id_user)===Number(a.id_user)));
  const activeMsgs     = safe(isGroup?grpMsgs:msgs);
  const canSend        = !!(text.trim()||filePrev)&&!sending;

  return (
    <div className="admin-contact">

      {/* ══ SIDEBAR ══ */}
      <aside className="contacts-panel">
        <div style={{padding:"18px 16px 12px",borderBottom:"1px solid #ede9ff",flexShrink:0}}>
          <div style={{display:"flex",alignItems:"center",gap:9,marginBottom:14}}>
            <div style={{width:34,height:34,borderRadius:10,background:"linear-gradient(135deg,#6d56c1,#4f3fa0)",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>
              <svg viewBox="0 0 24 24" width="17" height="17" fill="none" stroke="#fff" strokeWidth="2"><path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/></svg>
            </div>
            <span style={{fontSize:16,fontWeight:700,color:"#1a1a2e"}}>Messages</span>
          </div>
          <div style={{position:"relative"}}>
            <svg style={{position:"absolute",left:10,top:"50%",transform:"translateY(-50%)",pointerEvents:"none"}} width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#9e97c0" strokeWidth="2.5"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>
            <input value={query} onChange={e=>setQuery(e.target.value)} placeholder="Rechercher un admin…"
              style={{width:"100%",padding:"9px 32px",boxSizing:"border-box",borderRadius:10,border:"1.5px solid #e0daff",background:"#f5f2ff",color:"#1a1a2e",fontSize:13,outline:"none",fontFamily:"inherit",transition:"border-color .2s"}}
              onFocus={e=>e.target.style.borderColor="#a78bfa"} onBlur={e=>e.target.style.borderColor="#e0daff"}/>
            {searching&&<div style={{position:"absolute",right:11,top:"50%",transform:"translateY(-50%)",width:13,height:13,borderRadius:"50%",border:"2px solid #e0daff",borderTopColor:"#6d56c1",animation:"spin .7s linear infinite"}}/>}
            {query&&!searching&&<button onClick={()=>{setQuery("");setResults([]);}} style={{position:"absolute",right:10,top:"50%",transform:"translateY(-50%)",background:"none",border:"none",cursor:"pointer",color:"#9e97c0",fontSize:15,padding:0,lineHeight:1}}>✕</button>}
          </div>
        </div>

        <div className="chat-list">
          {!isSearch&&<>
            <div className="section-label">Groupe</div>
            <div className={`group-item ${isGroup?"active":""}`} onClick={()=>{setSel("group");setFilePrev(null);}}>
              <div className="group-avatar">S</div>
              <div style={{flex:1,minWidth:0}}>
                <div style={{fontWeight:600,fontSize:13.5,color:"#1a1a2e"}}>Swafy</div>
                <div style={{fontSize:12,color:"#9e97c0",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>
                  {grpMsgs.length>0?(grpMsgs.at(-1)?.text||"[fichier]"):"Canal général"}
                </div>
              </div>
              <span style={{fontSize:9,fontWeight:700,background:"#ede9ff",color:"#6d56c1",padding:"2px 7px",borderRadius:6,flexShrink:0}}>GROUPE</span>
            </div>
          </>}

          {!isSearch&&adminNotInConv.length>0&&<>
            <div className="section-label">Contacter</div>
            {adminNotInConv.map(a=>(
              <div key={a.id_user} className="chat-item" onClick={()=>openConv(a)}>
                <AdminAv size={42}/>
                <div style={{flex:1,minWidth:0}}>
                  <div style={{fontWeight:600,fontSize:13.5,color:"#1a1a2e"}}>Swafy</div>
                  <div style={{fontSize:12,color:"#9e97c0"}}>Équipe Swafy</div>
                </div>
              </div>
            ))}
          </>}

          {!isSearch&&convs.length>0&&<div className="section-label">Conversations ({convs.length})</div>}
          {isSearch&&<div className="section-label">{searching?"Recherche…":results.length?`${results.length} résultat(s)`:"Aucun résultat"}</div>}

          {safe(listItems).map(item=>{
            if(!item) return null;
            const isAdmin  = item.role==="admin";
            const isActive = !isGroup&&sel&&sel!=="group"&&Number(sel.id)===Number(item.id);
            return (
              <div key={item.id||item.id_user} className={`chat-item ${isActive?"active":""}`}
                onClick={()=>isSearch?openConv(item):setSel(item)}>
                {isAdmin?<AdminAv size={42}/>:<Av user={item} size={42}/>}
                <div style={{flex:1,minWidth:0}}>
                  <div style={{display:"flex",justifyContent:"space-between",alignItems:"baseline"}}>
                    <span style={{fontWeight:600,fontSize:13.5,color:"#1a1a2e",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap",maxWidth:140}}>
                      {isAdmin?"Swafy":`${item.prenom_user||""} ${item.nom_user||""}`}
                    </span>
                    {item.last_time&&<span style={{fontSize:10,color:"#b0a9d4",flexShrink:0,marginLeft:6}}>{fmtTime(item.last_time)}</span>}
                  </div>
                  <p style={{fontSize:12,color:"#9e97c0",margin:0,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>
                    {isSearch?"Équipe Swafy":(item.last_message||"Nouvelle conversation")}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </aside>

      {/* ══ CHAT ══ */}
      <main className="chat-window">
        {!sel?(
          <div style={{flex:1,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",gap:14,background:"#f4f2fb"}}>
            <div style={{width:80,height:80,borderRadius:24,background:"linear-gradient(135deg,#ede9ff,#d0c9f5)",display:"flex",alignItems:"center",justifyContent:"center"}}>
              <svg viewBox="0 0 24 24" width="36" height="36" fill="none" stroke="#6d56c1" strokeWidth="1.5"><path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/></svg>
            </div>
            <p style={{fontSize:16,fontWeight:700,color:"#1a1a2e",margin:"0 0 4px",textAlign:"center"}}>Swafy Messages</p>
            <p style={{fontSize:13,color:"#9e97c0",margin:0,textAlign:"center"}}>Choisissez une conversation ou le groupe</p>
          </div>
        ):(<>
          {/* Header */}
          <div style={{padding:"14px 20px",display:"flex",alignItems:"center",gap:12,background:"#fff",borderBottom:"1px solid #ede9ff",flexShrink:0,boxShadow:"0 1px 6px rgba(0,0,0,0.05)"}}>
            {isGroup?<div className="group-avatar" style={{width:42,height:42,fontSize:16}}>S</div>
              :sel.role==="admin"?<AdminAv size={42}/>:<Av user={sel} size={42}/>}
            <div style={{flex:1}}>
              <div style={{fontWeight:700,fontSize:14.5,color:"#1a1a2e"}}>
                {isGroup?"Swafy":sel.role==="admin"?"Swafy":`${sel.prenom_user||""} ${sel.nom_user||""}`}
              </div>
              <div style={{fontSize:11,color:"#059669",display:"flex",alignItems:"center",gap:5,marginTop:2}}>
                <span style={{width:7,height:7,borderRadius:"50%",background:"#059669",display:"inline-block"}}/>
                {isGroup?"Canal général":"En ligne"}
              </div>
            </div>
          </div>

          {/* Messages */}
          <div style={{flex:1,overflowY:"auto",padding:"16px 20px",display:"flex",flexDirection:"column",gap:6,background:"#f4f2fb"}}>
            {loadingMsgs?(
              <div style={{margin:"auto",color:"#b0a9d4",fontSize:13,textAlign:"center"}}>
                <div style={{width:28,height:28,borderRadius:"50%",border:"3px solid #e0daff",borderTopColor:"#6d56c1",animation:"spin .7s linear infinite",margin:"0 auto 10px"}}/>
                Chargement…
              </div>
            ):activeMsgs.length===0?(
              <div style={{margin:"auto",textAlign:"center"}}>
                <div style={{width:60,height:60,borderRadius:18,background:"linear-gradient(135deg,#ede9ff,#d0c9f5)",display:"flex",alignItems:"center",justifyContent:"center",margin:"0 auto 12px"}}>
                  <svg viewBox="0 0 24 24" width="28" height="28" fill="none" stroke="#6d56c1" strokeWidth="1.5"><path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/></svg>
                </div>
                <div style={{fontWeight:600,color:"#6b6b8a",marginBottom:4,fontSize:14}}>Démarrez la conversation</div>
                <div style={{fontSize:12,color:"#b0a9d4"}}>Soyez le premier à écrire !</div>
              </div>
            ):activeMsgs.map(m=>{
              if(!m) return null;
              const isMe=Number(m.sender_id)===myId;
              return (
                <div key={m.id} style={{alignSelf:isMe?"flex-end":"flex-start",maxWidth:"72%",display:"flex",flexDirection:"column",gap:3,animation:"fadeUp .18s ease"}}>
                  {isGroup&&!isMe&&(
                    <div style={{display:"flex",alignItems:"center",gap:6,paddingLeft:4,marginBottom:2}}>
                      <Av user={{id_user:m.sender_id,prenom_user:m.prenom_user,nom_user:m.nom_user}} size={20}/>
                      <span style={{fontSize:11,color:"#6d56c1",fontWeight:700}}>{m.prenom_user} {m.nom_user}</span>
                    </div>
                  )}
                  <div style={{background:isMe?"linear-gradient(135deg,#6d56c1,#4f3fa0)":"#fff",
                    color:isMe?"#fff":"#1a1a2e",padding:"10px 14px",
                    borderRadius:isMe?"18px 18px 4px 18px":"18px 18px 18px 4px",
                    fontSize:13.5,lineHeight:1.55,wordBreak:"break-word",
                    boxShadow:isMe?"0 4px 14px rgba(79,63,160,0.3)":"0 1px 4px rgba(0,0,0,0.07)",
                    border:isMe?"none":"1px solid #ede9ff",opacity:m._temp?0.6:1}}>
                    {m.text&&<div>{m.text}</div>}
                    <FileBubble msg={m} isMe={isMe}/>
                  </div>
                  <span style={{fontSize:10,color:"#b0a9d4",textAlign:isMe?"right":"left",paddingInline:4}}>
                    {m._temp?"Envoi…":fmtTime(m.created_at)}
                  </span>
                </div>
              );
            })}
            <div ref={bottomRef}/>
          </div>

          {/* File preview */}
          {filePrev&&(
            <div className="file-preview-bar">
              <span>{filePrev.type.startsWith("image/")?"🖼️":filePrev.type.startsWith("video/")?"🎬":"📄"}</span>
              <span style={{flex:1,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap",fontSize:13}}>{filePrev.name}</span>
              <span style={{fontSize:11,color:"#9e97c0"}}>{(filePrev.size/1024).toFixed(0)} Ko</span>
              <button onClick={()=>setFilePrev(null)} style={{background:"none",border:"none",cursor:"pointer",color:"#ef4444",fontSize:18,padding:"0 4px",lineHeight:1}}>✕</button>
            </div>
          )}

          {/* Input */}
          <div style={{padding:"10px 14px",borderTop:"1px solid #ede9ff",display:"flex",alignItems:"flex-end",gap:8,background:"#fff",flexShrink:0}}>
            <button onClick={()=>fileRef.current?.click()}
              style={{width:40,height:40,borderRadius:11,border:"1.5px solid #e0daff",background:"#f5f2ff",cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0,color:"#6d56c1",transition:"background .15s"}}
              onMouseEnter={e=>e.currentTarget.style.background="#ede9ff"}
              onMouseLeave={e=>e.currentTarget.style.background="#f5f2ff"}
              title="Joindre image / vidéo / PDF">
              <svg viewBox="0 0 24 24" fill="none" width="18" height="18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m21.44 11.05-9.19 9.19a6 6 0 0 1-8.49-8.49l8.57-8.57A4 4 0 1 1 18 8.84l-8.59 8.57a2 2 0 0 1-2.83-2.83l8.49-8.48"/></svg>
            </button>
            <input ref={fileRef} type="file" accept="image/*,video/*,application/pdf" style={{display:"none"}}
              onChange={e=>{setFilePrev(e.target.files[0]||null);e.target.value="";}}/>
            <textarea value={text}
              onChange={e=>{setText(e.target.value);e.target.style.height="40px";e.target.style.height=Math.min(e.target.scrollHeight,120)+"px";}}
              onKeyDown={e=>{if(e.key==="Enter"&&!e.shiftKey){e.preventDefault();send();}}}
              placeholder="Écrire un message…"
              style={{flex:1,padding:"10px 14px",borderRadius:12,border:"1.5px solid #e0daff",background:"#f5f2ff",color:"#1a1a2e",fontSize:13.5,outline:"none",resize:"none",fontFamily:"inherit",caretColor:"#6d56c1",height:40,maxHeight:120,overflowY:"auto",lineHeight:1.5,transition:"border-color .2s"}}
              onFocus={e=>e.target.style.borderColor="#a78bfa"} onBlur={e=>e.target.style.borderColor="#e0daff"}/>
            <button onClick={send} disabled={!canSend}
              style={{width:42,height:42,borderRadius:12,border:"none",flexShrink:0,
                background:canSend?"linear-gradient(135deg,#6d56c1,#4f3fa0)":"#e8e3ff",
                color:canSend?"#fff":"#c4bde8",cursor:canSend?"pointer":"default",
                display:"flex",alignItems:"center",justifyContent:"center",
                boxShadow:canSend?"0 4px 14px rgba(79,63,160,0.38)":"none",transition:"all .2s"}}>
              {sending
                ?<div style={{width:16,height:16,borderRadius:"50%",border:"2px solid rgba(255,255,255,0.4)",borderTopColor:"#fff",animation:"spin .7s linear infinite"}}/>
                :<svg viewBox="0 0 24 24" fill="none" width="18" height="18"><path d="M22 2L11 13M22 2L15 22L11 13M22 2L2 9L11 13" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
              }
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