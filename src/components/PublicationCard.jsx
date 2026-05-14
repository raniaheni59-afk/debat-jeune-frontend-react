import React, { useState, useEffect, useRef, useCallback } from "react";
import API from "../services/api";
import "./PublicationCard.css";

/* ─── current user ──────────────────────────────────────────── */
const getCurrentUser = () => {
  try { const u = localStorage.getItem("user"); return u ? JSON.parse(u) : null; }
  catch { return null; }
};

/* ─── URL helper ────────────────────────────────────────────── */
const BACKEND = (() => {
  const base = API.defaults?.baseURL || window.location.origin;
  return base.replace(/\/api\/?$/, "").replace(/\/$/, "");
})();

const getMediaUrl = (p) => {
  if (!p) return null;
  if (p.startsWith("http://") || p.startsWith("https://")) return p;
  const clean = p.split("\\").join("/").replace(/^\/+/, "");
  return BACKEND + "/" + clean;
};

const avatar = (name) =>
  `https://ui-avatars.com/api/?name=${encodeURIComponent(name||"U")}&background=5a3fa0&color=fff&size=80`;

const timeAgo = (d) => {
  if (!d) return "";
  const s = (Date.now() - new Date(d)) / 1000;
  if (s < 60) return "À l'instant";
  if (s < 3600) return `${Math.floor(s/60)} min`;
  if (s < 86400) return `${Math.floor(s/3600)}h`;
  if (s < 604800) return `${Math.floor(s/86400)}j`;
  return new Date(d).toLocaleDateString("fr-FR");
};

const getSrc   = (m) => getMediaUrl(m.url_media || m.chemin_fichier || m.url || "");
const isImg    = (m) => { const s=getSrc(m)||""; return m.type_media==="image"||/\.(jpg|jpeg|png|gif|webp|svg)(\?|$)/i.test(s); };
const isVid    = (m) => { const s=getSrc(m)||""; return m.type_media==="video"||/\.(mp4|webm|ogg|mov|avi)(\?|$)/i.test(s); };
const isPdf    = (m) => { const s=getSrc(m)||""; return m.type_media==="pdf"||/\.pdf(\?|$)/i.test(s); };

/* ─── data ──────────────────────────────────────────────────── */
const REACTIONS = [
  { key:"like",  emoji:"👍", label:"J'aime"  },
  { key:"love",  emoji:"❤️", label:"J'adore" },
  { key:"haha",  emoji:"😂", label:"Haha"    },
  { key:"wow",   emoji:"😮", label:"Wow"     },
  { key:"sad",   emoji:"😢", label:"Triste"  },
  { key:"angry", emoji:"😡", label:"Grrrr"   },
];

const STICKERS = [
  { cat:"😄", items:["😀","😂","🤣","😍","🥰","😎","🤩","😭","😤","🥺","😅","😇","🤔","😏","🙄","😬","🥳","😴","🤯","😱"] },
  { cat:"👋", items:["👍","👎","👏","🙌","🤝","✌️","🤞","👌","🤌","💪","🫶","🤙","☝️","👊","🫂","🙏","🤲","👐","🫁","💅"] },
  { cat:"❤️", items:["❤️","🧡","💛","💚","💙","💜","🖤","🤍","💕","💞","💓","💗","💖","💘","💝","💔","❣️","💟","🩷","🩵"] },
  { cat:"🎉", items:["🎉","🎊","🎈","🎁","🥂","🍾","🎂","🎆","🎇","✨","🌟","⭐","🏆","🥇","🎖️","🎗️","🎟️","🎠","🎡","🎢"] },
  { cat:"🐾", items:["🐶","🐱","🐭","🐹","🐰","🦊","🐻","🐼","🐨","🦁","🐯","🐸","🐵","🦄","🐧","🦋","🐝","🦅","🦜","🐙"] },
  { cat:"🍕", items:["🍕","🍔","🌮","🍜","🍣","🍰","🎂","🧁","🍩","🍪","🍫","🥗","🍱","🍛","☕","🧋","🥤","🍺","🧃","🍭"] },
];

/* ─── ReactionPicker ────────────────────────────────────────── */
const ReactionPicker = ({ onPick, current, mini }) => (
  <div className={`pc-rpicker${mini?" mini":""}`}>
    {REACTIONS.map(r=>(
      <button key={r.key} className={`pc-rp-btn${current===r.key?" on":""}`}
        onClick={()=>onPick(r.key)} title={r.label} type="button">
        <span className="pc-rp-e">{r.emoji}</span>
        {!mini && <span className="pc-rp-l">{r.label}</span>}
      </button>
    ))}
  </div>
);

/* ─── ReactionSummary ───────────────────────────────────────── */
const ReactionSummary = ({ counts={} }) => {
  // Force all values to numbers (MySQL can return strings)
  const nc = {};
  for (const k of Object.keys(counts)) nc[k] = Number(counts[k])||0;
  const top = REACTIONS.filter(r=>(nc[r.key]||0)>0)
    .sort((a,b)=>(nc[b.key]||0)-(nc[a.key]||0)).slice(0,3);
  const total = Object.values(nc).reduce((s,v)=>s+v,0);
  if (!total) return null;
  return (
    <span className="pc-rs">
      {top.map(r=><span key={r.key} className="pc-rs-e">{r.emoji}</span>)}
      <span className="pc-rs-n">{total}</span>
    </span>
  );
};

/* ─── StickerPicker ─────────────────────────────────────────── */
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
          <button key={i} className={`pc-stk-tab${cat===i?" on":""}`}
            onClick={()=>setCat(i)} type="button">{s.cat}</button>
        ))}
      </div>
      <div className="pc-stk-grid">
        {STICKERS[cat].items.map((s,i)=>(
          <button key={i} className="pc-stk-btn"
            onClick={()=>{onPick(s);onClose();}} type="button">{s}</button>
        ))}
      </div>
    </div>
  );
};

/* ─── MediaLightbox ─────────────────────────────────────────── */
const MediaLightbox = ({ medias, startIndex, onClose }) => {
  const [idx, setIdx] = useState(startIndex);
  const m = medias[idx];
  const src = getSrc(m);

  const prev = (e) => { e.stopPropagation(); setIdx(i=>Math.max(0,i-1)); };
  const next = (e) => { e.stopPropagation(); setIdx(i=>Math.min(medias.length-1,i+1)); };

  useEffect(()=>{
    const h=(e)=>{ if(e.key==="Escape") onClose(); if(e.key==="ArrowLeft") setIdx(i=>Math.max(0,i-1)); if(e.key==="ArrowRight") setIdx(i=>Math.min(medias.length-1,i+1)); };
    document.addEventListener("keydown",h);
    return ()=>document.removeEventListener("keydown",h);
  },[medias.length, onClose]);

  return (
    <div className="pc-lightbox" onClick={onClose}>
      <button className="pc-lb-close" onClick={onClose}>✕</button>
      <div className="pc-lb-counter">{idx+1} / {medias.length}</div>
      {idx>0 && <button className="pc-lb-nav left" onClick={prev}>‹</button>}
      <img className="pc-lb-img" src={src} alt="" onClick={e=>e.stopPropagation()} />
      {idx<medias.length-1 && <button className="pc-lb-nav right" onClick={next}>›</button>}
    </div>
  );
};

/* ─── EditPublicationModal ──────────────────────────────────── */
const EditPublicationModal = ({ publication, onClose, onSaved }) => {
  const [titre,     setTitre]     = useState(publication.titre_publication||"");
  const [contenu,   setContenu]   = useState(publication.contenu_publication||publication.contenu||"");
  const [medias,    setMedias]    = useState(publication.medias||[]);
  const [newFiles,  setNewFiles]  = useState([]);   // { file, preview, type }
  const [saving,    setSaving]    = useState(false);
  const fileRef = useRef(null);

  const removeExisting = (idx) => setMedias(m=>m.filter((_,i)=>i!==idx));
  const removeNew      = (idx) => setNewFiles(f=>f.filter((_,i)=>i!==idx));

  const addFiles = (files) => {
    Array.from(files).forEach(file=>{
      const url = URL.createObjectURL(file);
      const type = file.type.startsWith("video") ? "video"
                 : file.type === "application/pdf" ? "pdf" : "image";
      setNewFiles(f=>[...f, { file, preview: url, type }]);
    });
  };

  const [saveError, setSaveError] = useState("");

  const handleSave = async () => {
    setSaving(true);
    setSaveError("");
    try {
      const form = new FormData();
      form.append("titre_publication",   titre);
      form.append("contenu_publication", contenu);
      form.append("contenu",             contenu);
      // IDs des médias existants à garder
      medias.forEach(m => {
        const id = m.id_media ?? m.id ?? "";
        if (id !== "") form.append("kept_media_ids[]", String(id));
      });
      // Nouveaux fichiers
      newFiles.forEach(f => form.append("medias", f.file));

      await API.patch(
        `/publications/${publication.id_publication}`,
        form,
        { headers: { "Content-Type": "multipart/form-data" } }
      );
      onSaved();
      onClose();
    } catch(e) {
      const raw = e?.response?.data;
      const msg = (typeof raw === "string" && raw.includes("<html"))
        ? `Erreur ${e?.response?.status} — vérifier le backend`
        : raw?.message || raw?.error || (typeof raw === "string" ? raw : null)
          || e.message || "Erreur inconnue";
      console.error("edit pub:", e?.response?.status, raw);
      setSaveError(String(msg));
    } finally {
      setSaving(false);
    }
  };

  // prevent body scroll
  useEffect(()=>{ document.body.style.overflow="hidden"; return()=>{ document.body.style.overflow=""; }; },[]);

  return (
    <div className="pc-modal-overlay" onClick={e=>e.target===e.currentTarget&&onClose()}>
      <div className="pc-modal">
        <div className="pc-modal-header">
          <span>Modifier la publication</span>
          <button className="pc-modal-close" onClick={onClose} type="button">✕</button>
        </div>

        <div className="pc-modal-body">
          <label className="pc-modal-label">Titre</label>
          <input className="pc-modal-inp" value={titre} onChange={e=>setTitre(e.target.value)} placeholder="Titre…"/>

          <label className="pc-modal-label">Contenu</label>
          <textarea className="pc-modal-ta" value={contenu} onChange={e=>setContenu(e.target.value)} rows={4} placeholder="Contenu…"/>

          {/* ── médias existants ── */}
          {medias.length>0 && (
            <>
              <label className="pc-modal-label">Médias actuels</label>
              <div className="pc-modal-media-list">
                {medias.map((m,i)=>{
                  const src  = getSrc(m);
                  const type = m.type_media || (isPdf(m)?"pdf": isVid(m)?"video":"image");
                  return (
                    <div key={i} className="pc-modal-media-item">
                      {type==="pdf"
                        ? <span className="pc-modal-media-pdf">📄<br/>PDF</span>
                        : type==="video"
                        ? <span className="pc-modal-media-pdf">🎥<br/>Vidéo</span>
                        : src
                        ? <img src={src} alt=""
                            style={{position:"absolute",inset:0,width:"100%",height:"100%",objectFit:"cover",borderRadius:"9px"}}
                            onError={e=>{e.target.replaceWith(Object.assign(document.createElement("span"),{className:"pc-modal-media-pdf",textContent:"🖼️"}));}}
                          />
                        : <span className="pc-modal-media-pdf">🖼️</span>
                      }
                      <button className="pc-modal-media-del" onClick={()=>removeExisting(i)} type="button" title="Supprimer">✕</button>
                    </div>
                  );
                })}
              </div>
            </>
          )}

          {/* ── nouveaux fichiers ── */}
          {newFiles.length>0 && (
            <>
              <label className="pc-modal-label">Nouveaux médias</label>
              <div className="pc-modal-media-list">
                {newFiles.map((f,i)=>(
                  <div key={i} className="pc-modal-media-item">
                    {f.type==="pdf" ? <span className="pc-modal-media-pdf">📄 PDF</span>
                     : f.type==="video" ? <span className="pc-modal-media-pdf">🎥 Vidéo</span>
                     : <img src={f.preview} alt=""/>}
                    <button className="pc-modal-media-del" onClick={()=>removeNew(i)} type="button" title="Supprimer">✕</button>
                  </div>
                ))}
              </div>
            </>
          )}

          {/* ── ajouter médias ── */}
          <div className="pc-modal-add-row">
            <button className="pc-modal-add-btn" type="button"
              onClick={()=>fileRef.current?.click()}>
              + Ajouter image / vidéo / PDF
            </button>
            <input ref={fileRef} type="file" multiple
              accept="image/*,video/*,application/pdf"
              style={{display:"none"}}
              onChange={e=>{ addFiles(e.target.files); e.target.value=""; }}/>
          </div>

          {saveError && (
            <div className="pc-modal-error">⚠️ {saveError}</div>
          )}
        </div>
        <div className="pc-modal-footer">
          <button className="pc-modal-cancel" onClick={onClose} type="button">Annuler</button>
          <button className="pc-modal-save" onClick={handleSave} disabled={saving} type="button">
            {saving ? <span className="pc-btn-spin" style={{display:"inline-block"}}/> : "Enregistrer"}
          </button>
        </div>
      </div>
    </div>
  );
};

const EditCommentModal = ({ comment, pubId, onClose, onSaved }) => {
  const [text,      setText]     = useState(comment.contenu_commentaire||comment.contenu||"");
  const [stkOpen,   setStkOpen]  = useState(false);
  const [saving,    setSaving]   = useState(false);
  const [saveError, setSaveError]= useState("");
  const inputRef = useRef(null);

  const handleSave = async () => {
    const t = text.trim(); if(!t||saving) return;
    setSaving(true);
    setSaveError("");
    try {
      await API.patch(
        `/publications/${pubId}/comments/${comment.id_commentaire}`,
        { contenu_commentaire: t, contenu: t }
      );
      onSaved();
      onClose();
    } catch(e) {
      const raw = e?.response?.data;
      const msg = (typeof raw === "string" && raw.includes("<html"))
        ? `Erreur ${e?.response?.status} — vérifier le backend`
        : raw?.message || raw?.error || (typeof raw === "string" ? raw : null)
          || e.message || "Erreur inconnue";
      console.error("edit comment:", e?.response?.status, raw);
      setSaveError(String(msg));
      setSaving(false);
    }
  };

  useEffect(()=>{ document.body.style.overflow="hidden"; return()=>{ document.body.style.overflow=""; }; },[]);

  return (
    <div className="pc-modal-overlay" onClick={e=>e.target===e.currentTarget&&onClose()}>
      <div className="pc-modal pc-modal-sm">
        <div className="pc-modal-header">
          <span>Modifier le commentaire</span>
          <button className="pc-modal-close" onClick={onClose} type="button">✕</button>
        </div>
        <div className="pc-modal-body" style={{position:"relative", overflow:"visible"}}>
          {/* sticker picker — au-dessus du champ */}
          {stkOpen && (
            <div style={{position:"absolute", bottom:"calc(100% - 10px)", right:"0", zIndex:9999}}>
              <StickerPicker
                onPick={s=>{setText(t=>t+s); setStkOpen(false); setTimeout(()=>inputRef.current?.focus(),50);}}
                onClose={()=>setStkOpen(false)}/>
            </div>
          )}
          <div className="pc-cmt-input-wrap" style={{borderRadius:"14px", padding:"4px 6px 4px 0", minHeight:"48px"}}>
            <input ref={inputRef} className="pc-cmt-inp" value={text}
              onChange={e=>setText(e.target.value)}
              onKeyDown={e=>{if(e.key==="Enter"&&!e.shiftKey){e.preventDefault();handleSave();}}}
              placeholder="Modifier le commentaire…" autoFocus
              style={{padding:"10px 14px", fontSize:"14px"}}/>
            <div className="pc-cmt-inp-acts">
              <button className="pc-cmt-emoji-btn" type="button"
                onClick={()=>setStkOpen(o=>!o)} title="Stickers">😊</button>
            </div>
          </div>
          {saveError && (
            <div className="pc-modal-error" style={{marginTop:"8px"}}>⚠️ {saveError}</div>
          )}
        </div>
        <div className="pc-modal-footer">
          <button className="pc-modal-cancel" onClick={onClose} type="button">Annuler</button>
          <button className="pc-modal-save" onClick={handleSave} disabled={saving||!text.trim()} type="button">
            {saving ? <span className="pc-btn-spin" style={{display:"inline-block"}}/> : "Enregistrer"}
          </button>
        </div>
      </div>
    </div>
  );
};

/* ─── DotsMenu ──────────────────────────────────────────────── */
const DotsMenu = ({ items }) => {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  useEffect(()=>{
    const h=(e)=>{ if(ref.current&&!ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener("mousedown",h);
    return ()=>document.removeEventListener("mousedown",h);
  },[]);
  return (
    <div className="pc-dots-menu" ref={ref}>
      <button className="pc-more" type="button" aria-label="Options" onClick={()=>setOpen(o=>!o)}>
        <DotsIcon/>
      </button>
      {open && (
        <div className="pc-dots-dropdown">
          {items.map((item,i)=>(
            <button key={i}
              className={`pc-dots-item${item.danger?" danger":""}`}
              type="button"
              onClick={()=>{ setOpen(false); item.onClick(); }}>
              {item.icon && <span>{item.icon}</span>}
              {item.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

/* ─── Comment ───────────────────────────────────────────────── */
const Comment = ({ comment, pubId, onRefresh, depth=0 }) => {
  const [replyOpen,    setReplyOpen]    = useState(false);
  const [replyText,    setReplyText]    = useState("");
  const [replySending, setReplySending] = useState(false);
  const [showReplies,  setShowReplies]  = useState(false);
  const [myReaction,   setMyReaction]   = useState(comment.my_reaction||null);
  const [counts,       setCounts]       = useState(()=>{
    const raw = comment.reaction_counts||{};
    const nc = {};
    for (const k of Object.keys(raw)) nc[k] = Number(raw[k])||0;
    return nc;
  });
  const [pickerOpen,   setPickerOpen]   = useState(false);
  const [stkOpen,      setStkOpen]      = useState(false);
  const [editOpen,     setEditOpen]     = useState(false);
  const picRef = useRef(null);

  const currentUser = getCurrentUser();
  const isOwner = currentUser && (
    currentUser.id_user === comment.id_user ||
    currentUser.id === comment.id_user ||
    currentUser.role === "admin"
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
    catch(e) { console.error("delete comment:", e?.response?.data||e.message); }
  };

  const sendReply = async()=>{
    const t=replyText.trim(); if(!t||replySending) return;
    setReplySending(true);
    try {
      await API.post(`/publications/${pubId}/comments`,{ contenu_commentaire:t, parent_id:comment.id_commentaire });
      setReplyText(""); setReplyOpen(false); onRefresh();
    } catch(e){ console.error("reply:",e?.response?.data||e.message); }
    finally{ setReplySending(false); }
  };

  const myDef  = REACTIONS.find(r=>r.key===myReaction);
  const replies= comment.replies||[];

  const menuItems = [];
  if (isOwner) {
    menuItems.push({ icon:"✏️", label:"Modifier", onClick:()=>setEditOpen(true) });
    menuItems.push({ icon:"🗑️", label:"Supprimer", danger:true, onClick:deleteCmt });
  }

  return (
    <>
      <div className={`pc-cmt${depth>0?" nested":""}`}>
        {depth>0 && <div className="pc-nest-line"/>}
        <img className="pc-cmt-ava"
          src={getMediaUrl(comment.photo_user)||avatar(comment.prenom_user)}
          alt={comment.prenom_user}
          onError={e=>{e.target.src=avatar(comment.prenom_user);}}/>
        <div className="pc-cmt-right">
          <div className="pc-cmt-bubble-row">
            <div className="pc-cmt-bubble">
              <span className="pc-cmt-nm">{comment.prenom_user} {comment.nom_user}</span>
              {(() => {
                const txt = comment.contenu_commentaire||comment.contenu||"";
                const onlyEmoji = /^[\p{Emoji}\s]{1,6}$/u.test(txt) && txt.trim().length <= 6;
                return onlyEmoji
                  ? <p className="pc-cmt-sticker">{txt}</p>
                  : <p className="pc-cmt-txt">{txt}</p>;
              })()}
            </div>
            {menuItems.length > 0 && (
              <DotsMenu items={menuItems}/>
            )}
          </div>
          {Object.values(counts).reduce((s,v)=>s+(v||0),0) > 0 && <ReactionSummary counts={counts}/>}
          <div className="pc-cmt-meta">
            <span className="pc-cmt-time">{timeAgo(comment.created_at)}</span>
            <div className="pc-cmt-rpick-wrap" ref={picRef}>
              <button className={`pc-cmt-act${myReaction?" on":""}`}
                onClick={()=>setPickerOpen(o=>!o)} type="button"
                style={myReaction==="like"?{color:"#1877f2"}:myReaction?{color:"#5a3fa0"}:{}}>
                {myDef?`${myDef.emoji} ${myDef.label}`:"👍 J'aime"}
              </button>
              {pickerOpen && <ReactionPicker onPick={reactCmt} current={myReaction} mini/>}
            </div>
            {depth<2 && (
              <button className="pc-cmt-act" onClick={()=>setReplyOpen(o=>!o)} type="button">Répondre</button>
            )}
            {replies.length>0 && (
              <button className="pc-cmt-act accent" onClick={()=>setShowReplies(o=>!o)} type="button">
                {showReplies?"Masquer":`${replies.length} réponse${replies.length>1?"s":""}`}
              </button>
            )}
          </div>

          {replyOpen && (
            <div className="pc-reply-row">
              <div className="pc-reply-box">
                <input className="pc-reply-inp"
                  placeholder={`Répondre à ${comment.prenom_user}…`}
                  value={replyText}
                  onChange={e=>setReplyText(e.target.value)}
                  onKeyDown={e=>e.key==="Enter"&&!e.shiftKey&&sendReply()}
                  autoFocus/>
                <div className="pc-reply-acts">
                  <button className="pc-cmt-emoji-btn" type="button" onClick={()=>setStkOpen(o=>!o)}>😊</button>
                  <button className="pc-send-btn" onClick={sendReply}
                    disabled={!replyText.trim()||replySending} type="button">
                    {replySending?<div className="pc-btn-spin"/>:<SendIcon/>}
                  </button>
                </div>
              </div>
              {stkOpen && <StickerPicker onPick={s=>{setReplyText(t=>t+s);setStkOpen(false);}} onClose={()=>setStkOpen(false)}/>}
            </div>
          )}

          {showReplies && replies.map(r=>(
            <Comment key={r.id_commentaire} comment={r} pubId={pubId} onRefresh={onRefresh} depth={depth+1}/>
          ))}
        </div>
      </div>

      {editOpen && (
        <EditCommentModal
          comment={comment}
          pubId={pubId}
          onClose={()=>setEditOpen(false)}
          onSaved={onRefresh}/>
      )}
    </>
  );
};

/* ═══════════════════════════════════════════════════════════════
   MAIN CARD
═══════════════════════════════════════════════════════════════ */
export default function PublicationCard({ publication, onUpdate, defaultShowComments=false }) {
  const [showCmts,   setShowCmts]   = useState(defaultShowComments);
  const [comments,   setComments]   = useState([]);
  const [cmtLoading, setCmtLoading] = useState(false);
  const [cmtText,    setCmtText]    = useState("");
  const [cmtSending, setCmtSending] = useState(false);
  const [myReaction, setMyReaction] = useState(publication.my_reaction||null);
  const [counts,     setCounts]     = useState(()=>{
    const raw = publication.reaction_counts||{};
    const nc = {};
    for (const k of Object.keys(raw)) nc[k] = Number(raw[k])||0;
    return nc;
  });
  const [pickerOpen, setPickerOpen] = useState(false);
  const [stkOpen,    setStkOpen]    = useState(false);
  const [lightbox,   setLightbox]   = useState(null);
  const [expanded,   setExpanded]   = useState(false);
  const [cmtCount,   setCmtCount]   = useState(publication.nb_commentaires??0);
  const [editOpen,   setEditOpen]   = useState(false);

  const currentUser = getCurrentUser();
  const pub         = publication;
  const picRef      = useRef(null);
  const inputRef    = useRef(null);
  const stkRef      = useRef(null);

  const isAdmin = currentUser?.role === "admin";
  // Owner = proprio de la publication OU admin
  const isOwner = currentUser && (
    currentUser.id_user === pub.user_id ||
    currentUser.id      === pub.user_id ||
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
      const res  = await API.get(`/publications/${pub.id_publication}/comments`);
      const list = Array.isArray(res.data)?res.data:[];
      setComments(list);
      const countAll=(arr)=>arr.reduce((s,c)=>s+1+(c.replies?.length||0),0);
      setCmtCount(countAll(list));
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
    try {
      await API.post(`/publications/${pub.id_publication}/comments`,{ contenu_commentaire:t });
      setCmtText("");
      await loadComments();
    } catch(e){ console.error("comment:",e?.response?.status, e?.response?.data||e.message); }
    finally{ setCmtSending(false); }
  };

  const reactPub = async(key)=>{
    setPickerOpen(false);
    const same=myReaction===key, prev=myReaction;
    setMyReaction(same?null:key);
    setCounts(c=>{ const n={...c}; if(prev) n[prev]=Math.max(0,(n[prev]||1)-1); if(!same) n[key]=(n[key]||0)+1; return n; });
    try {
      await API.post(`/publications/${pub.id_publication}/react`,{ type_reaction:same?null:key });
    } catch(e) {
      setMyReaction(prev);
      setCounts(c=>{ const n={...c}; if(!same) n[key]=Math.max(0,(n[key]||1)-1); if(prev) n[prev]=(n[prev]||0)+1; return n; });
    }
  };

  const deletePub = async () => {
    if(!window.confirm("Supprimer cette publication ?")) return;
    try {
      await API.delete(`/publications/${pub.id_publication}`);
      if(onUpdate) onUpdate();
    } catch(e) { console.error("delete pub:", e?.response?.data||e.message); }
  };

  const myDef  = REACTIONS.find(r=>r.key===myReaction);
  const media  = pub.medias||[];
  const body   = pub.contenu_publication||pub.contenu||"";
  const isLong = body.length>280;

  /* split media — skip medias without valid src */
  const pdfMedias  = media.filter(m=>isPdf(m) && getSrc(m));
  const imgMedias  = media.filter(m=>!isPdf(m)&&isImg(m) && getSrc(m));
  const vidMedias  = media.filter(m=>!isPdf(m)&&isVid(m) && getSrc(m));

  /* grid layout for images */
  const gridClass = imgMedias.length===1?"pc-media-1"
                  : imgMedias.length===2?"pc-media-2"
                  : imgMedias.length===3?"pc-media-3"
                  : "pc-media-4";

  /* pub dots menu */
  const pubMenuItems = [];
  if (isOwner) {
    pubMenuItems.push({ icon:"✏️", label:"Modifier", onClick:()=>setEditOpen(true) });
    pubMenuItems.push({ icon:"🗑️", label:"Supprimer", danger:true, onClick:deletePub });
  }

  return (
    <>
      <article className="pc-card">
        {/* ── header ── */}
        <div className="pc-header">
          <img className="pc-ava"
            src={getMediaUrl(pub.photo_user)||avatar(pub.prenom_user||"U")}
            alt={pub.prenom_user}
            onError={e=>{e.target.src=avatar(pub.prenom_user||"U");}}/>
          <div className="pc-author">
            <span className="pc-nm">{pub.prenom_user} {pub.nom_user}</span>
            <div className="pc-meta">
              <span className="pc-time">{timeAgo(pub.created_at||pub.date_publication)}</span>
              {pub.type_publication && (
                <span className="pc-type">
                  {pub.type_publication==="debat"&&"⚖️ Débat"}
                  {pub.type_publication==="photo"&&"📷 Photo"}
                  {pub.type_publication==="video"&&"🎥 Vidéo"}
                  {pub.type_publication==="pdf"  &&"📄 PDF"}
                  {pub.type_publication==="texte"&&"📝 Texte"}
                </span>
              )}
            </div>
          </div>
          {pubMenuItems.length > 0 && <DotsMenu items={pubMenuItems}/>}
        </div>

        {/* ── body ── */}
        {pub.titre_publication && <h3 className="pc-title">{pub.titre_publication}</h3>}
        {body && (
          <p className="pc-body">
            {isLong&&!expanded?body.slice(0,280)+"… ":body}
            {isLong&&(
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
              <a href={src} target="_blank" rel="noreferrer" className="pc-pdf-view-btn">👁 Voir</a>
              <a href={src} download={filename} target="_blank" rel="noreferrer" className="pc-pdf-dl-btn">⬇ Télécharger</a>
            </div>
          );
        })}

        {/* ── videos ── */}
        {vidMedias.map((m,i)=>(
          <div key={`vid-${i}`} className="pc-vid-wrap">
            <video src={getSrc(m)} controls playsInline preload="metadata"
              style={{width:"100%",display:"block",maxHeight:"460px",background:"#000"}}/>
          </div>
        ))}

        {/* ── image grid — only if valid images ── */}
        {imgMedias.length>0 && (
          <div className={`pc-media ${gridClass}`}>
            {imgMedias.slice(0,4).map((m,i)=>{
              const src = getSrc(m);
              const more = imgMedias.length>4 && i===3;
              return (
                <div key={i} className="pc-media-item" onClick={()=>setLightbox(i)}>
                  <img
                    src={src}
                    alt=""
                    loading="lazy"
                    onError={e=>{ e.target.closest(".pc-media-item").style.display="none"; }}
                  />
                  {more && (
                    <div className="pc-media-more">+{imgMedias.length-4}</div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* ── stats ── */}
        <div className="pc-stats">
          {Object.values(counts).reduce((s,v)=>s+(v||0),0) > 0 && <ReactionSummary counts={counts}/>}
          <span className="pc-cmt-cnt" onClick={toggleCmts}>
            {cmtCount > 0 ? `${cmtCount} commentaire${cmtCount!==1?"s":""}` : ""}
          </span>
        </div>

        {/* ── actions ── */}
        <div className="pc-actions">
          <div className="pc-act-wrap" ref={picRef}>
            <button
              className={`pc-act-btn${myReaction?" on":""}`}
              onClick={()=>myReaction?reactPub(myReaction):setPickerOpen(o=>!o)}
              onMouseEnter={()=>setPickerOpen(true)}
              type="button">
              {myDef
                ? <><span className="pc-act-emoji">{myDef.emoji}</span>
                    <span className={myDef.key==="like"?"pc-act-label-blue":"pc-act-label-react"}>{myDef.label}</span></>
                : <><ThumbIcon/><span>J'aime</span></>}
            </button>
            {pickerOpen && <ReactionPicker onPick={reactPub} current={myReaction}/>}
          </div>
          <button className="pc-act-btn" onClick={toggleCmts} type="button">
            <CommentIcon/><span>Commenter</span>
          </button>
        </div>

        {/* ── comments section ── */}
        {showCmts && (
          <div className="pc-cmts-section">
            <div className="pc-new-cmt">
              <img className="pc-cmt-ava"
                src={getMediaUrl(currentUser?.photo_user)||avatar(currentUser?.prenom||currentUser?.prenom_user||"Moi")}
                alt="moi"
                onError={e=>{e.target.src=avatar(currentUser?.prenom||"Moi");}}/>
              <div className="pc-cmt-input-wrap">
                <input ref={inputRef} className="pc-cmt-inp"
                  placeholder="Écrire un commentaire…"
                  value={cmtText}
                  onChange={e=>setCmtText(e.target.value)}
                  onKeyDown={e=>{if(e.key==="Enter"&&!e.shiftKey){e.preventDefault();sendComment();}}}/>
                <div className="pc-cmt-inp-acts">
                  <div className="pc-stk-wrap" ref={stkRef}>
                    <button className="pc-cmt-emoji-btn" type="button"
                      onClick={()=>setStkOpen(o=>!o)} title="Stickers">😊</button>
                    {stkOpen && (
                      <StickerPicker
                        onPick={s=>{
                          setStkOpen(false);
                          if(!cmtText.trim()){
                            // Envoyer le sticker seul directement
                            sendComment(s);
                          } else {
                            // Ajouter au texte existant
                            setCmtText(t=>t+s);
                            inputRef.current?.focus();
                          }
                        }}
                        onClose={()=>setStkOpen(false)}/>
                    )}
                  </div>
                  <button className="pc-send-btn" onClick={()=>sendComment()}
                    disabled={!cmtText.trim()||cmtSending} type="button">
                    {cmtSending?<div className="pc-btn-spin"/>:<SendIcon/>}
                  </button>
                </div>
              </div>
            </div>

            {cmtLoading
              ? <div className="pc-spin-wrap"><div className="pc-spin"/></div>
              : comments.length===0
                ? <p className="pc-cmt-empty">Soyez le premier à commenter 💬</p>
                : <div className="pc-cmt-list">
                    {comments.map(c=>(
                      <Comment key={c.id_commentaire} comment={c}
                        pubId={pub.id_publication} onRefresh={loadComments}/>
                    ))}
                  </div>
            }
          </div>
        )}
      </article>

      {/* ── lightbox ── */}
      {lightbox!==null && imgMedias.length>0 && (
        <MediaLightbox
          medias={imgMedias}
          startIndex={lightbox}
          onClose={()=>setLightbox(null)}/>
      )}

      {/* ── edit publication modal ── */}
      {editOpen && (
        <EditPublicationModal
          publication={pub}
          onClose={()=>setEditOpen(false)}
          onSaved={()=>{ if(onUpdate) onUpdate(); }}/>
      )}
    </>
  );
}

/* ── icons ── */
const ThumbIcon   = ()=><svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 9V5a3 3 0 0 0-3-3l-4 9v11h11.28a2 2 0 0 0 2-1.7l1.38-9a2 2 0 0 0-2-2.3H14z"/><path d="M7 22H4a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2h3"/></svg>;
const CommentIcon = ()=><svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>;
const SendIcon    = ()=><svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>;
const DotsIcon    = ()=><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="5" r="1"/><circle cx="12" cy="12" r="1"/><circle cx="12" cy="19" r="1"/></svg>;