import React, { useState, useEffect, useRef, useCallback } from "react";
import API from "../services/api";
import "./PublicationCard.css";
import DebateBlock from "./DebateBlock";

/* ─── helpers ─────────────────────────────────────────────────── */
const getCurrentUser = () => {
  try { const u = localStorage.getItem("user"); return u ? JSON.parse(u) : null; }
  catch { return null; }
};

const BACKEND = (() => {
  const base = API.defaults?.baseURL || "";
  return base.replace(/\/api\/?$/, "").replace(/\/$/, "");
})();

const getMediaUrl = (p) => {
  if (!p) return null;
  if (p.startsWith("http://") || p.startsWith("https://")) return p;
  const clean = p.split("\\").join("/").replace(/^\/+/, "");
  const nodup = clean.replace(/^(uploads\/)+/, "");
  return BACKEND + "/uploads/" + nodup;
};

const avatar = (name) =>
  `https://ui-avatars.com/api/?name=${encodeURIComponent(name||"U")}&background=1877f2&color=fff&size=80&bold=true`;

const timeAgo = (d) => {
  if (!d) return "";
  const s = (Date.now() - new Date(d)) / 1000;
  if (s < 60) return "À l'instant";
  if (s < 3600) return `${Math.floor(s/60)} min`;
  if (s < 86400) return `${Math.floor(s/3600)}h`;
  if (s < 604800) return `${Math.floor(s/86400)}j`;
  return new Date(d).toLocaleDateString("fr-FR");
};

const getSrc = (m) => getMediaUrl(m?.url_media || m?.chemin_fichier || m?.url || "");
const isImg  = (m) => { const s=getSrc(m)||""; return m?.type_media==="image"||/\.(jpg|jpeg|png|gif|webp|svg)(\?|$)/i.test(s); };
const isVid  = (m) => { const s=getSrc(m)||""; return m?.type_media==="video"||/\.(mp4|webm|ogg|mov|avi)(\?|$)/i.test(s); };
const isPdf  = (m) => { const s=getSrc(m)||""; return m?.type_media==="pdf"||/\.pdf(\?|$)/i.test(s); };
const getSrcSafe = (m) => {
  const s = getSrc(m);
  if (!s) return null;
  if (s.endsWith("/uploads/") || s.endsWith("/uploads")) return null;
  return s;
};

/* ─── constants ─────────────────────────────────────────────────── */
const REACTIONS = [
  { key:"like",  emoji:"👍", label:"J'aime",  color:"#1877f2" },
  { key:"love",  emoji:"❤️", label:"J'adore", color:"#f33e58" },
  { key:"haha",  emoji:"😂", label:"Haha",    color:"#f7b928" },
  { key:"wow",   emoji:"😮", label:"Wow",     color:"#f7b928" },
  { key:"sad",   emoji:"😢", label:"Triste",  color:"#f7b928" },
  { key:"angry", emoji:"😡", label:"Grrrr",   color:"#e9710f" },
];

const STICKERS = [
  { cat:"😄", items:["😀","😂","🤣","😍","🥰","😎","🤩","😭","😤","🥺","😅","😇","🤔","😏","🙄","😬","🥳","😴","🤯","😱"] },
  { cat:"👋", items:["👍","👎","👏","🙌","🤝","✌️","🤞","👌","🤌","💪","🫶","🤙","☝️","👊","🫂","🙏","🤲","👐","🫁","💅"] },
  { cat:"❤️", items:["❤️","🧡","💛","💚","💙","💜","🖤","🤍","💕","💞","💓","💗","💖","💘","💝","💔","❣️","💟","🩷","🩵"] },
  { cat:"🎉", items:["🎉","🎊","🎈","🎁","🥂","🍾","🎂","🎆","🎇","✨","🌟","⭐","🏆","🥇","🎖️","🎗️","🎟️","🎠","🎡","🎢"] },
  { cat:"🐾", items:["🐶","🐱","🐭","🐹","🐰","🦊","🐻","🐼","🐨","🦁","🐯","🐸","🐵","🦄","🐧","🦋","🐝","🦅","🦜","🐙"] },
  { cat:"🍕", items:["🍕","🍔","🌮","🍜","🍣","🍰","🎂","🧁","🍩","🍪","🍫","🥗","🍱","🍛","☕","🧋","🥤","🍺","🧃","🍭"] },
];

/* ─── icons ──────────────────────────────────────────────────── */
const ThumbIcon   = ()=><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 9V5a3 3 0 0 0-3-3l-4 9v11h11.28a2 2 0 0 0 2-1.7l1.38-9a2 2 0 0 0-2-2.3H14z"/><path d="M7 22H4a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2h3"/></svg>;
const CommentIcon = ()=><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>;
const SendIcon    = ()=><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>;
const DotsIcon    = ()=><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="5" r="1" fill="currentColor"/><circle cx="12" cy="12" r="1" fill="currentColor"/><circle cx="12" cy="19" r="1" fill="currentColor"/></svg>;
const GlobeIcon   = ()=><svg width="11" height="11" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.95-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z"/></svg>;
const ImageIcon   = ()=><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>;
const SearchIcon  = ()=><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>;

/* ─── ReactionPicker ─────────────────────────────────────────── */
const ReactionPicker = ({ onPick, current }) => (
  <div className="pc-rpicker">
    {REACTIONS.map(r=>(
      <button key={r.key} className={`pc-rp-btn${current===r.key?" on":""}`}
        onClick={()=>onPick(r.key)} title={r.label} type="button">
        <span className="pc-rp-e">{r.emoji}</span>
        <span className="pc-rp-l">{r.label}</span>
      </button>
    ))}
  </div>
);

/* ─── ReactionSummary ────────────────────────────────────────── */
const ReactionSummary = ({ counts={} }) => {
  const nc = {};
  for (const k of Object.keys(counts)) nc[k] = Number(counts[k])||0;
  const top = REACTIONS.filter(r=>(nc[r.key]||0)>0).sort((a,b)=>(nc[b.key]||0)-(nc[a.key]||0)).slice(0,3);
  const total = Object.values(nc).reduce((s,v)=>s+v,0);
  if (!total) return null;
  return (
    <span className="pc-rs">
      {top.map(r=><span key={r.key} className="pc-rs-e">{r.emoji}</span>)}
      <span className="pc-rs-n">{total}</span>
    </span>
  );
};

/* ─── StickerPicker ──────────────────────────────────────────── */
const StickerPicker = ({ onPick, onClose }) => {
  const [cat,setCat] = useState(0);
  const ref = useRef(null);
  useEffect(()=>{
    const h=(e)=>{ if(ref.current&&!ref.current.contains(e.target)) onClose(); };
    setTimeout(()=>document.addEventListener("mousedown",h),10);
    return ()=>document.removeEventListener("mousedown",h);
  },[onClose]);
  return (
    <div className="pc-stk-picker" ref={ref}>
      <div className="pc-stk-tabs">
        {STICKERS.map((s,i)=>(
          <button key={i} className={`pc-stk-tab${cat===i?" on":""}`} onClick={()=>setCat(i)} type="button">{s.cat}</button>
        ))}
      </div>
      <div className="pc-stk-grid">
        {STICKERS[cat].items.map((s,i)=>(
          <button key={i} className="pc-stk-btn" onClick={(e)=>{e.stopPropagation();onPick(s);onClose();}} type="button">{s}</button>
        ))}
      </div>
    </div>
  );
};

/* ─── MediaLightbox ──────────────────────────────────────────── */
const MediaLightbox = ({ medias, startIndex, onClose }) => {
  const [idx, setIdx] = useState(startIndex);
  const m = medias[idx];
  const src = getSrc(m);
  useEffect(()=>{
    const h=(e)=>{ if(e.key==="Escape") onClose(); if(e.key==="ArrowLeft") setIdx(i=>Math.max(0,i-1)); if(e.key==="ArrowRight") setIdx(i=>Math.min(medias.length-1,i+1)); };
    document.addEventListener("keydown",h);
    return ()=>document.removeEventListener("keydown",h);
  },[medias.length,onClose]);
  return (
    <div className="pc-lightbox" onClick={onClose}>
      <button className="pc-lb-close" onClick={onClose}>✕</button>
      {medias.length>1 && <div className="pc-lb-counter">{idx+1} / {medias.length}</div>}
      {idx>0 && <button className="pc-lb-nav left" onClick={e=>{e.stopPropagation();setIdx(i=>i-1);}}>‹</button>}
      <img className="pc-lb-img" src={src} alt="" onClick={e=>e.stopPropagation()}/>
      {idx<medias.length-1 && <button className="pc-lb-nav right" onClick={e=>{e.stopPropagation();setIdx(i=>i+1);}}>›</button>}
    </div>
  );
};

/* ─── DotsMenu ───────────────────────────────────────────────── */
const DotsMenu = ({ items }) => {
  const [open,setOpen] = useState(false);
  const ref = useRef(null);
  useEffect(()=>{
    const h=(e)=>{ if(ref.current&&!ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener("mousedown",h);
    return ()=>document.removeEventListener("mousedown",h);
  },[]);
  return (
    <div className="pc-dots-menu" ref={ref}>
      <button className="pc-dots-btn" onClick={()=>setOpen(o=>!o)} type="button"><DotsIcon/></button>
      {open && (
        <div className="pc-dots-dropdown">
          {items.map((item,i)=>(
            <button key={i} className={`pc-dots-item${item.danger?" danger":""}`}
              onClick={()=>{setOpen(false);item.onClick();}} type="button">
              <span>{item.icon}</span><span>{item.label}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

/* ─── EditPublicationModal ───────────────────────────────────── */
const EditPublicationModal = ({ publication, onClose, onSaved }) => {
  const [titre,    setTitre]    = useState(publication.titre_publication||"");
  const [contenu,  setContenu]  = useState(publication.contenu_publication||publication.contenu||"");
  const [medias,   setMedias]   = useState(publication.medias||[]);
  const [newFiles, setNewFiles] = useState([]);
  const [saving,   setSaving]   = useState(false);
  const [saveError,setSaveError]= useState("");
  const fileRef = useRef(null);

  useEffect(()=>{ document.body.style.overflow="hidden"; return()=>{ document.body.style.overflow=""; }; },[]);

  const addFiles = (files) => Array.from(files).forEach(file=>{
    const url  = URL.createObjectURL(file);
    const type = file.type.startsWith("video")?"video": file.type==="application/pdf"?"pdf":"image";
    setNewFiles(f=>[...f,{file,preview:url,type}]);
  });

  const handleSave = async () => {
    setSaving(true); setSaveError("");
    try {
      const form = new FormData();
      form.append("titre_publication",   titre);
      form.append("contenu_publication", contenu);
      form.append("contenu",             contenu);
      medias.forEach(m=>{ const id=m.id_media??m.id??""; if(id!=="") form.append("kept_media_ids[]",String(id)); });
      newFiles.forEach(f=>form.append("medias",f.file));
      await API.patch(`/publications/${publication.id_publication}`, form);
      onSaved({ titre_publication:titre, contenu, contenu_publication:contenu, medias });
      onClose();
    } catch(e) {
      const raw=e?.response?.data;
      setSaveError((typeof raw==="string"&&raw.includes("<html"))?`Erreur ${e?.response?.status}`: raw?.message||raw?.error||(typeof raw==="string"?raw:null)||e.message||"Erreur");
    } finally { setSaving(false); }
  };

  return (
    <div className="pc-modal-overlay" onClick={e=>e.target===e.currentTarget&&onClose()}>
      <div className="pc-modal">
        <div className="pc-modal-header">
          <span>Modifier la publication</span>
          <button className="pc-modal-close" onClick={onClose} type="button">✕</button>
        </div>
        {saving && <div className="pc-modal-progress"><div className="pc-modal-progress-bar"/></div>}
        <div className="pc-modal-body">
          <label className="pc-modal-label">Titre</label>
          <input className="pc-modal-inp" value={titre} onChange={e=>setTitre(e.target.value)} placeholder="Titre…"/>
          <label className="pc-modal-label">Contenu</label>
          <textarea className="pc-modal-ta" value={contenu} onChange={e=>setContenu(e.target.value)} rows={4} placeholder="Contenu…"/>
          {medias.length>0 && (<>
            <label className="pc-modal-label">Médias actuels</label>
            <div className="pc-modal-media-list">
              {medias.map((m,i)=>{
                const src=getSrc(m); const type=m.type_media||(isPdf(m)?"pdf":isVid(m)?"video":"image");
                return (
                  <div key={i} className="pc-modal-media-item">
                    {type==="pdf"?<span className="pc-modal-media-pdf">📄<br/>PDF</span>
                    :type==="video"?<span className="pc-modal-media-pdf">🎥<br/>Vidéo</span>
                    :src?<img src={src} alt="" style={{position:"absolute",inset:0,width:"100%",height:"100%",objectFit:"cover",borderRadius:"9px"}} onError={e=>{e.target.replaceWith(Object.assign(document.createElement("span"),{className:"pc-modal-media-pdf",textContent:"🖼️"}));}}/>
                    :<span className="pc-modal-media-pdf">🖼️</span>}
                    <button className="pc-modal-media-del" onClick={()=>setMedias(m=>m.filter((_,j)=>j!==i))} type="button">✕</button>
                  </div>
                );
              })}
            </div>
          </>)}
          {newFiles.length>0 && (<>
            <label className="pc-modal-label">Nouveaux médias</label>
            <div className="pc-modal-media-list">
              {newFiles.map((f,i)=>(
                <div key={i} className="pc-modal-media-item">
                  {f.type==="pdf"?<span className="pc-modal-media-pdf">📄 PDF</span>
                  :f.type==="video"?<span className="pc-modal-media-pdf">🎥 Vidéo</span>
                  :<img src={f.preview} alt=""/>}
                  <button className="pc-modal-media-del" onClick={()=>setNewFiles(f=>f.filter((_,j)=>j!==i))} type="button">✕</button>
                </div>
              ))}
            </div>
          </>)}
          <div className="pc-modal-add-row">
            <button className="pc-modal-add-btn" type="button" onClick={()=>fileRef.current?.click()}>
              <ImageIcon/> Ajouter image / vidéo / PDF
            </button>
            <input ref={fileRef} type="file" multiple accept="image/*,video/*,application/pdf"
              style={{display:"none"}} onChange={e=>{addFiles(e.target.files);e.target.value="";}}/>
          </div>
          {saveError && <div className="pc-modal-error">⚠️ {saveError}</div>}
        </div>
        <div className="pc-modal-footer">
          <button className="pc-modal-cancel" onClick={onClose} type="button">Annuler</button>
          <button className="pc-modal-save" onClick={handleSave} disabled={saving} type="button">
            {saving?<span className="pc-btn-spin" style={{display:"inline-block"}}/>:"Enregistrer"}
          </button>
        </div>
      </div>
    </div>
  );
};

/* ─── EditCommentModal ───────────────────────────────────────── */
const EditCommentModal = ({ comment, pubId, onClose, onSaved }) => {
  const [text, setText]       = useState(comment.contenu_commentaire||comment.contenu||"");
  const [saving, setSaving]   = useState(false);
  const [saveError,setSaveError]= useState("");
  const [stkOpen, setStkOpen] = useState(false);
  const inputRef = useRef(null);

  useEffect(()=>{ document.body.style.overflow="hidden"; return()=>{ document.body.style.overflow=""; }; },[]);

  const handleSave = async () => {
    const t=text.trim(); if(!t||saving) return;
    setSaving(true); setSaveError("");
    try {
      await API.patch(`/publications/${pubId}/comments/${comment.id_commentaire}`,{contenu_commentaire:t,contenu:t});
      onSaved(t); onClose();
    } catch(e) {
      const raw=e?.response?.data;
      setSaveError((typeof raw==="string"&&raw.includes("<html"))?`Erreur ${e?.response?.status}`: raw?.message||e.message||"Erreur");
      setSaving(false);
    }
  };

  return (
    <div className="pc-modal-overlay" onClick={e=>e.target===e.currentTarget&&onClose()}>
      <div className="pc-modal pc-modal-sm">
        <div className="pc-modal-header">
          <span>Modifier le commentaire</span>
          <button className="pc-modal-close" onClick={onClose} type="button">✕</button>
        </div>
        <div className="pc-modal-body" style={{position:"relative",overflow:"visible"}}>
          {stkOpen && (
            <div style={{position:"absolute",bottom:"calc(100% - 10px)",right:0,zIndex:9999}}>
              <StickerPicker onPick={s=>{setText(t=>t+s);setStkOpen(false);setTimeout(()=>inputRef.current?.focus(),50);}} onClose={()=>setStkOpen(false)}/>
            </div>
          )}
          <div className="pc-cmt-input-wrap" style={{borderRadius:14,padding:"4px 6px 4px 0",minHeight:48}}>
            <input ref={inputRef} className="pc-cmt-inp" value={text}
              onChange={e=>setText(e.target.value)}
              onKeyDown={e=>{if(e.key==="Enter"&&!e.shiftKey){e.preventDefault();handleSave();}}}
              placeholder="Modifier le commentaire…" autoFocus
              style={{padding:"10px 14px",fontSize:14}}/>
            <div className="pc-cmt-inp-acts">
              <button className="pc-cmt-emoji-btn" type="button" onClick={()=>setStkOpen(o=>!o)}>😊</button>
            </div>
          </div>
          {saveError && <div className="pc-modal-error" style={{marginTop:8}}>⚠️ {saveError}</div>}
        </div>
        <div className="pc-modal-footer">
          <button className="pc-modal-cancel" onClick={onClose} type="button">Annuler</button>
          <button className="pc-modal-save" onClick={handleSave} disabled={saving||!text.trim()} type="button">
            {saving?<span className="pc-btn-spin" style={{display:"inline-block"}}/>:"Enregistrer"}
          </button>
        </div>
      </div>
    </div>
  );
};

/* ─── Comment ────────────────────────────────────────────────── */
const Comment = ({ comment, pubId, onRefresh, depth=0 }) => {
  const [localText,    setLocalText]    = useState(comment.contenu_commentaire||comment.contenu||"");
  const [replyOpen,    setReplyOpen]    = useState(false);
  const [replyText,    setReplyText]    = useState("");
  const [replySending, setReplySending] = useState(false);
  const [showReplies,  setShowReplies]  = useState(false);
  const [myReaction,   setMyReaction]   = useState(comment.my_reaction||null);
  const [counts,       setCounts]       = useState(()=>{ const nc={}; for(const k of Object.keys(comment.reaction_counts||{})) nc[k]=Number(comment.reaction_counts[k])||0; return nc; });
  const [pickerOpen,   setPickerOpen]   = useState(false);
  const [stkOpen,      setStkOpen]      = useState(false);
  const [editOpen,     setEditOpen]     = useState(false);
  const picRef  = useRef(null);
  const inpRef  = useRef(null);

  const currentUser = getCurrentUser();
  const isOwner = currentUser && (
    currentUser.id_user===comment.id_user || currentUser.id===comment.id_user ||
    currentUser.id_user===comment.user_id || currentUser.id===comment.user_id ||
    currentUser.role==="admin"
  );

  useEffect(()=>{
    const h=(e)=>{ if(picRef.current&&!picRef.current.contains(e.target)) setPickerOpen(false); };
    document.addEventListener("mousedown",h);
    return ()=>document.removeEventListener("mousedown",h);
  },[]);

  const reactCmt = async(key)=>{
    setPickerOpen(false);
    const same=myReaction===key, prev=myReaction;
    setMyReaction(same?null:key);
    setCounts(c=>{ const n={...c}; if(prev) n[prev]=Math.max(0,(n[prev]||1)-1); if(!same) n[key]=(n[key]||0)+1; return n; });
    try { await API.post(`/publications/${pubId}/comments/${comment.id_commentaire}/react`,{type_reaction:same?null:key}); }
    catch { onRefresh(); }
  };

  const deleteCmt = async () => {
    if(!window.confirm("Supprimer ce commentaire ?")) return;
    try { await API.delete(`/publications/${pubId}/comments/${comment.id_commentaire}`); onRefresh(); }
    catch(e) { console.error("delete:",e?.response?.data||e.message); }
  };

  const sendReply = async (textOverride) => {
    const t=(textOverride||replyText).trim(); if(!t||replySending) return;
    setReplySending(true);
    setReplyText(""); setReplyOpen(false); setShowReplies(true);
    try {
      await API.post(`/publications/${pubId}/comments`,{
        contenu_commentaire:t, contenu:t,
        parent_id:comment.id_commentaire
      });
      onRefresh();
    } catch(e){
      console.error("reply:",e?.response?.data||e.message);
      setReplyText(t); setReplyOpen(true);
    }
    finally { setReplySending(false); }
  };

  const myDef   = REACTIONS.find(r=>r.key===myReaction);
  const replies = comment.replies||[];
  const menuItems = [];
  if(isOwner) {
    menuItems.push({ icon:"✏️", label:"Modifier",  onClick:()=>setEditOpen(true) });
    menuItems.push({ icon:"🗑️", label:"Supprimer", danger:true, onClick:deleteCmt });
  }

  return (
    <>
      <div className={`pc-cmt${depth>0?" nested":""}`}>
        {depth>0 && <div className="pc-nest-line"/>}
        <img className="pc-cmt-ava"
          src={getMediaUrl(comment.photo_user)||avatar(comment.prenom_user||"U")}
          alt="" onError={e=>{e.target.src=avatar(comment.prenom_user||"U");}}/>
        <div className="pc-cmt-right">
          <div className="pc-cmt-bubble-row">
            <div className="pc-cmt-bubble">
              <span className="pc-cmt-nm">{comment.prenom_user} {comment.nom_user}</span>
              {(()=>{
                const txt=localText;
                const onlyEmoji=/^[\p{Emoji}\s]{1,6}$/u.test(txt)&&txt.trim().length<=6;
                return onlyEmoji?<p className="pc-cmt-sticker">{txt}</p>:<p className="pc-cmt-txt">{txt}</p>;
              })()}
            </div>
            {menuItems.length>0 && <DotsMenu items={menuItems}/>}
          </div>
          {Object.values(counts).reduce((s,v)=>s+(v||0),0)>0 && <ReactionSummary counts={counts}/>}
          <div className="pc-cmt-meta">
            <span className="pc-cmt-time">{timeAgo(comment.created_at)}</span>
            <div className="pc-cmt-rpick-wrap" ref={picRef}>
              <button className={`pc-cmt-act${myReaction?" on":""}`}
                onClick={()=>setPickerOpen(o=>!o)} type="button"
                style={myReaction?{color:REACTIONS.find(r=>r.key===myReaction)?.color||"#1877f2"}:{}}>
                {myDef?`${myDef.emoji} ${myDef.label}`:"J'aime"}
              </button>
              {pickerOpen && <ReactionPicker onPick={reactCmt} current={myReaction}/>}
            </div>
            {depth<2 && <button className="pc-cmt-act" onClick={()=>setReplyOpen(o=>!o)} type="button">Répondre</button>}
            {replies.length>0 && (
              <button className="pc-cmt-act accent" onClick={()=>setShowReplies(o=>!o)} type="button">
                {showReplies?"Masquer":`${replies.length} réponse${replies.length>1?"s":""}`}
              </button>
            )}
          </div>

          {replyOpen && (
            <div className="pc-reply-row">
              <div className="pc-reply-box">
                <input ref={inpRef} className="pc-reply-inp"
                  placeholder={`Répondre à ${comment.prenom_user}…`}
                  value={replyText} onChange={e=>setReplyText(e.target.value)}
                  onKeyDown={e=>{if(e.key==="Enter"&&!e.shiftKey){e.preventDefault();sendReply();}}}
                  autoFocus/>
                <div className="pc-reply-acts">
                  <button className="pc-cmt-emoji-btn" type="button" onClick={()=>setStkOpen(o=>!o)}>😊</button>
                  <button className="pc-send-btn" onClick={()=>sendReply()} disabled={!replyText.trim()||replySending} type="button">
                    {replySending?<div className="pc-btn-spin"/>:<SendIcon/>}
                  </button>
                </div>
              </div>
              {stkOpen && <StickerPicker onPick={s=>{setStkOpen(false);!replyText.trim()?sendReply(s):setReplyText(t=>t+s);}} onClose={()=>setStkOpen(false)}/>}
            </div>
          )}

          {showReplies && replies.map(r=>(
            <Comment key={r.id_commentaire} comment={r} pubId={pubId} onRefresh={onRefresh} depth={depth+1}/>
          ))}
        </div>
      </div>

      {editOpen && (
        <EditCommentModal
          comment={{...comment,contenu_commentaire:localText,contenu:localText}}
          pubId={pubId}
          onClose={()=>setEditOpen(false)}
          onSaved={(newText)=>{ if(newText) setLocalText(newText); onRefresh(); }}/>
      )}
    </>
  );
};

/* ═══════════════════════════════════════════════════════════════
   PUBLICATION SEARCH BAR (exportable)
═══════════════════════════════════════════════════════════════ */
export const PublicationSearchBar = ({ publications=[], onResult }) => {
  const [q, setQ] = useState("");
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(()=>{
    const h=(e)=>{ if(ref.current&&!ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener("mousedown",h);
    return ()=>document.removeEventListener("mousedown",h);
  },[]);

  const results = q.trim().length>1
    ? publications.filter(p=>{
        const hay=(p.titre_publication||"")+" "+(p.contenu_publication||p.contenu||"")+" "+(p.prenom_user||"")+" "+(p.nom_user||"");
        return hay.toLowerCase().includes(q.toLowerCase());
      }).slice(0,6)
    : [];

  return (
    <div className="pc-search-wrap" ref={ref}>
      <div className="pc-search-inner">
        <SearchIcon/>
        <input className="pc-search-inp"
          placeholder="Rechercher une publication…"
          value={q} onChange={e=>{setQ(e.target.value);setOpen(true);}}
          onFocus={()=>setOpen(true)}/>
        {q && <button className="pc-search-clear" onClick={()=>{setQ("");setOpen(false);}} type="button">✕</button>}
      </div>
      {open && results.length>0 && (
        <div className="pc-search-dd">
          {results.map(p=>(
            <button key={p.id_publication} className="pc-search-item" type="button"
              onClick={()=>{ setQ(""); setOpen(false); if(onResult) onResult(p); }}>
              <span className="pc-search-icon">
                {p.type_publication==="photo"?"📷":p.type_publication==="video"?"🎥":p.type_publication==="debat"?"⚖️":p.type_publication==="pdf"?"📄":"📝"}
              </span>
              <div className="pc-search-info">
                <span className="pc-search-title">{p.titre_publication||"Sans titre"}</span>
                <span className="pc-search-sub">{p.prenom_user} {p.nom_user} · {timeAgo(p.created_at||p.date_publication)}</span>
              </div>
            </button>
          ))}
        </div>
      )}
      {open && q.trim().length>1 && results.length===0 && (
        <div className="pc-search-dd">
          <div className="pc-search-empty">Aucun résultat pour « {q} »</div>
        </div>
      )}
    </div>
  );
};

/* ═══════════════════════════════════════════════════════════════
   MAIN PublicationCard
═══════════════════════════════════════════════════════════════ */
export default function PublicationCard({ publication, onUpdate, defaultShowComments=false }) {
  const [localPub,   setLocalPub]   = useState(publication);
  const [showCmts,   setShowCmts]   = useState(defaultShowComments);
  const [comments,   setComments]   = useState([]);
  const [cmtLoading, setCmtLoading] = useState(false);
  const [cmtText,    setCmtText]    = useState("");
  const [cmtSending, setCmtSending] = useState(false);
  const [myReaction, setMyReaction] = useState(publication.my_reaction||null);
  const [counts,     setCounts]     = useState(()=>{ const nc={}; for(const k of Object.keys(publication.reaction_counts||{})) nc[k]=Number(publication.reaction_counts[k])||0; return nc; });
  const [pickerOpen, setPickerOpen] = useState(false);
  const [stkOpen,    setStkOpen]    = useState(false);
  const [lightbox,   setLightbox]   = useState(null);
  const [expanded,   setExpanded]   = useState(false);
  const [cmtCount,   setCmtCount]   = useState(publication.nb_commentaires??0);
  const [editOpen,   setEditOpen]   = useState(false);
  const [imgErrors,  setImgErrors]  = useState({});

  const currentUser = getCurrentUser();
  const pub         = localPub;
  const picRef      = useRef(null);
  const inputRef    = useRef(null);
  const stkRef      = useRef(null);

  const isAdmin = currentUser?.role==="admin";
  const isOwner = currentUser && (
    currentUser.id_user===pub.user_id || currentUser.id===pub.user_id ||
    currentUser.id_user===pub.id_user || currentUser.id===pub.id_user ||
    isAdmin
  );

  useEffect(()=>{
    const h=(e)=>{ if(picRef.current&&!picRef.current.contains(e.target)) setPickerOpen(false); };
    document.addEventListener("mousedown",h);
    return ()=>document.removeEventListener("mousedown",h);
  },[]);

  useEffect(()=>{ if(defaultShowComments) loadComments(); },[]);

  const loadComments = useCallback(async()=>{
    setCmtLoading(true);
    try {
      const res=await API.get(`/publications/${pub.id_publication}/comments`);
      const list=Array.isArray(res.data)?res.data:[];
      setComments(list);
      setCmtCount(list.reduce((s,c)=>s+1+(c.replies?.length||0),0));
    } catch { setComments([]); }
    finally  { setCmtLoading(false); }
  },[pub.id_publication]);

  const toggleCmts = ()=>{
    if(!showCmts) loadComments();
    setShowCmts(o=>!o);
    setTimeout(()=>inputRef.current?.focus(),200);
  };

  const sendComment = async(text_override)=>{
    const t=(text_override||cmtText).trim(); if(!t||cmtSending) return;
    setCmtSending(true);
    setCmtText("");
    // optimistic — show comment right away
    const me = getCurrentUser();
    const optimistic = {
      id_commentaire: `tmp-${Date.now()}`,
      contenu_commentaire: t, contenu: t,
      prenom_user: me?.prenom_user||me?.prenom||"",
      nom_user: me?.nom_user||me?.nom||"",
      photo_user: me?.photo_user||null,
      id_user: me?.id_user||me?.id,
      user_id: me?.id_user||me?.id,
      created_at: new Date().toISOString(),
      reaction_counts:{}, my_reaction:null, replies:[],
    };
    setComments(prev=>[...prev, optimistic]);
    setCmtCount(c=>c+1);
    try {
      await API.post(`/publications/${pub.id_publication}/comments`,{
        contenu_commentaire:t, contenu:t
      });
      await loadComments();
    } catch(e){
      console.error("comment:",e?.response?.status,e?.response?.data||e.message);
      setComments(prev=>prev.filter(c=>c.id_commentaire!==optimistic.id_commentaire));
      setCmtCount(c=>Math.max(0,c-1));
      setCmtText(t);
    }
    finally{ setCmtSending(false); }
  };

  const reactPub = async(key)=>{
    setPickerOpen(false);
    const same=myReaction===key, prev=myReaction;
    setMyReaction(same?null:key);
    setCounts(c=>{ const n={...c}; if(prev) n[prev]=Math.max(0,(n[prev]||1)-1); if(!same) n[key]=(n[key]||0)+1; return n; });
    try { await API.post(`/publications/${pub.id_publication}/react`,{type_reaction:same?null:key}); }
    catch(e) {
      setMyReaction(prev);
      setCounts(c=>{ const n={...c}; if(!same) n[key]=Math.max(0,(n[key]||1)-1); if(prev) n[prev]=(n[prev]||0)+1; return n; });
    }
  };

  const deletePub = async () => {
    if(!window.confirm("Supprimer cette publication ?")) return;
    try { await API.delete(`/publications/${pub.id_publication}`); if(onUpdate) onUpdate(); }
    catch(e){ console.error("delete pub:",e?.response?.data||e.message); }
  };

  const myDef  = REACTIONS.find(r=>r.key===myReaction);
  const media  = pub.medias||[];
  const body   = pub.contenu_publication||pub.contenu||"";
  const isLong = body.length>300;

  /* media split — guard against broken URLs */
  const pdfMedias = media.filter(m=>isPdf(m)&&getSrcSafe(m));
  const vidMedias = media.filter(m=>!isPdf(m)&&isVid(m)&&getSrcSafe(m));
  const imgMedias = media.filter(m=>!isPdf(m)&&!isVid(m)&&isImg(m)&&getSrcSafe(m));

  /* image grid class */
  const gridClass = imgMedias.length===1?"pc-media-1":imgMedias.length===2?"pc-media-2":imgMedias.length===3?"pc-media-3":"pc-media-4";

  const pubMenuItems = [];
  if(isOwner) {
    pubMenuItems.push({ icon:"✏️", label:"Modifier", onClick:()=>setEditOpen(true) });
    pubMenuItems.push({ icon:"🗑️", label:"Supprimer", danger:true, onClick:deletePub });
  }

  const typeLabel = {photo:"📷 Photo",video:"🎥 Vidéo",debat:"⚖️ Débat",pdf:"📄 PDF",texte:"📝 Texte"};

  return (
    <>
      <article className="pc-card">

        {/* ── HEADER ── */}
        <div className="pc-header">
          <img className="pc-ava"
            src={getMediaUrl(pub.photo_user)||avatar(pub.prenom_user||"U")}
            alt={pub.prenom_user}
            onError={e=>{e.target.src=avatar(pub.prenom_user||"U");}}/>
          <div className="pc-author">
            <span className="pc-nm">{pub.prenom_user} {pub.nom_user}</span>
            <div className="pc-meta">
              <span className="pc-time">{timeAgo(pub.created_at||pub.date_publication)}</span>
              <span className="pc-dot-sep">·</span>
              <GlobeIcon/>
              {pub.type_publication && (
                <span className="pc-type">{typeLabel[pub.type_publication]||pub.type_publication}</span>
              )}
            </div>
          </div>
          {pubMenuItems.length>0 && <DotsMenu items={pubMenuItems}/>}
        </div>

        {/* ── BODY ── */}
        {pub.titre_publication && <h3 className="pc-title">{pub.titre_publication}</h3>}
        {body && (
          <p className="pc-body">
            {isLong&&!expanded?body.slice(0,300)+"… ":body}
            {isLong && (
              <button className="pc-more-txt" onClick={()=>setExpanded(o=>!o)} type="button">
                {expanded?"Voir moins":"Voir plus"}
              </button>
            )}
          </p>
        )}

        {/* ── PDFs ── */}
        {pdfMedias.map((m,i)=>{
          const src=getSrc(m);
          const raw=m.url_media||m.chemin_fichier||"";
          const filename=decodeURIComponent(raw.split("/").pop().split("?")[0])||"document.pdf";
          return (
            <div key={`pdf-${i}`} className="pc-pdf-card">
              <span className="pc-pdf-icon">📄</span>
              <div className="pc-pdf-info">
                <span className="pc-pdf-name">{filename}</span>
                <span className="pc-pdf-meta">Document PDF</span>
              </div>
              <a href={src} target="_blank" rel="noreferrer" className="pc-pdf-view-btn">Voir</a>
              <a href={src} download={filename} target="_blank" rel="noreferrer" className="pc-pdf-dl-btn">⬇</a>
            </div>
          );
        })}

        {/* ── VIDEOS ── */}
        {vidMedias.map((m,i)=>(
          <div key={`vid-${i}`} className="pc-vid-wrap">
            <video src={getSrcSafe(m)} controls playsInline preload="metadata"
              style={{width:"100%",display:"block",maxHeight:"360px",background:"#000",borderRadius:"0 0 4px 4px"}}
              onError={e=>{
                const w=e.target.closest(".pc-vid-wrap");
                if(w) w.innerHTML='<div style="width:100%;padding:40px 0;display:flex;align-items:center;justify-content:center;gap:8px;background:#1a1a2e;color:#9080b8;font-size:13px;font-weight:600;border-radius:4px;">🎥 Vidéo indisponible</div>';
              }}/>
          </div>
        ))}

        {/* ── IMAGES ── */}
        {imgMedias.length>0 && (
          <div className={`pc-media ${gridClass}`}>
            {imgMedias.slice(0,4).map((m,i)=>{
              const src=getSrcSafe(m);
              const more=imgMedias.length>4&&i===3;
              const hasErr=imgErrors[i];
              return (
                <div key={i} className={`pc-media-item${imgMedias.length===1?" pc-media-solo":""}`}
                  onClick={()=>!hasErr&&setLightbox(i)}>
                  {!hasErr
                    ? <img src={src} alt="" loading="lazy"
                        onError={()=>setImgErrors(e=>({...e,[i]:true}))}/>
                    : <div className="pc-img-fallback">🖼️</div>
                  }
                  {more && <div className="pc-media-more">+{imgMedias.length-4}</div>}
                </div>
              );
            })}
          </div>
        )}

        {/* ── DEBATE ── */}
        {pub.type_publication==="debat" && <DebateBlock publication={pub}/>}

        {/* ── STATS BAR ── */}
        {pub.type_publication!=="debat" && (
          <div className="pc-stats">
            {Object.values(counts).reduce((s,v)=>s+(v||0),0)>0 && <ReactionSummary counts={counts}/>}
            <span className="pc-cmt-cnt" onClick={toggleCmts} style={{cursor:"pointer"}}>
              {cmtCount>0?`${cmtCount} commentaire${cmtCount!==1?"s":""}`:""}</span>
          </div>
        )}

        {/* ── DIVIDER ── */}
        {pub.type_publication!=="debat" && <div className="pc-divider"/>}

        {/* ── ACTION BUTTONS ── */}
        {pub.type_publication!=="debat" && (
          <div className="pc-actions">
            <div className="pc-act-wrap" ref={picRef}>
              <button
                className={`pc-act-btn${myReaction?" on":""}`}
                onClick={()=>myReaction?reactPub(myReaction):setPickerOpen(o=>!o)}
                onMouseEnter={()=>setPickerOpen(true)}
                type="button"
                style={myReaction?{color:REACTIONS.find(r=>r.key===myReaction)?.color||"#1877f2"}:{}}>
                {myDef
                  ?<><span style={{fontSize:18}}>{myDef.emoji}</span><span>{myDef.label}</span></>
                  :<><ThumbIcon/><span>J'aime</span></>}
              </button>
              {pickerOpen && <ReactionPicker onPick={reactPub} current={myReaction}/>}
            </div>
            <button className="pc-act-btn" onClick={toggleCmts} type="button">
              <CommentIcon/><span>Commenter</span>
            </button>
          </div>
        )}

        {/* ── COMMENTS ── */}
        {pub.type_publication!=="debat" && showCmts && (
          <div className="pc-cmts-section">
            <div className="pc-new-cmt">
              <img className="pc-cmt-ava"
                src={getMediaUrl(currentUser?.photo_user)||avatar(currentUser?.prenom_user||currentUser?.prenom||"Moi")}
                alt="moi"
                onError={e=>{e.target.src=avatar(currentUser?.prenom_user||"Moi");}}/>
              <div className="pc-cmt-input-wrap">
                <input ref={inputRef} className="pc-cmt-inp"
                  placeholder="Écrire un commentaire…"
                  value={cmtText}
                  onChange={e=>setCmtText(e.target.value)}
                  onKeyDown={e=>{if(e.key==="Enter"&&!e.shiftKey){e.preventDefault();sendComment();}}}/>
                <div className="pc-cmt-inp-acts">
                  <div className="pc-stk-wrap" ref={stkRef}>
                    <button className="pc-cmt-emoji-btn" type="button" onClick={()=>setStkOpen(o=>!o)}>😊</button>
                    {stkOpen && <StickerPicker
                      onPick={s=>{ setStkOpen(false); !cmtText.trim()?sendComment(s):setCmtText(t=>t+s); }}
                      onClose={()=>setStkOpen(false)}/>}
                  </div>
                  <button className="pc-send-btn" onClick={()=>sendComment()}
                    disabled={!cmtText.trim()||cmtSending} type="button">
                    {cmtSending?<div className="pc-btn-spin"/>:<SendIcon/>}
                  </button>
                </div>
              </div>
            </div>
            {cmtLoading
              ?<div className="pc-spin-wrap"><div className="pc-spin"/></div>
              :comments.length===0
              ?<p className="pc-cmt-empty">Soyez le premier à commenter 💬</p>
              :<div className="pc-cmt-list">
                {comments.map(c=>(
                  <Comment key={c.id_commentaire} comment={c}
                    pubId={pub.id_publication} onRefresh={loadComments}/>
                ))}
              </div>
            }
          </div>
        )}
      </article>

      {/* ── LIGHTBOX ── */}
      {lightbox!==null && imgMedias.length>0 && (
        <MediaLightbox medias={imgMedias} startIndex={lightbox} onClose={()=>setLightbox(null)}/>
      )}

      {/* ── EDIT MODAL ── */}
      {editOpen && (
        <EditPublicationModal
          publication={pub}
          onClose={()=>setEditOpen(false)}
          onSaved={(updatedFields)=>{
            if(updatedFields) setLocalPub(p=>({...p,...updatedFields}));
            if(onUpdate) onUpdate();
          }}/>
      )}
    </>
  );
}