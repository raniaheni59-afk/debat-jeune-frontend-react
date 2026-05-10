import React, { useState, useEffect, useRef, useCallback } from "react";
import API from "../services/api";
import "./PublicationCard.css";

/* ─────────────────────────────────────────────
   CONSTANTS
───────────────────────────────────────────── */
const BACKEND =
  API.defaults.baseURL?.split("/api")[0] ||
  "https://debat-jeune-production.up.railway.app";

const REACTIONS = [
  { key: "like",     emoji: "👍", label: "J'aime"  },
  { key: "love",     emoji: "❤️", label: "J'adore" },
  { key: "haha",     emoji: "😂", label: "Haha"    },
  { key: "wow",      emoji: "😮", label: "Wow"     },
  { key: "sad",      emoji: "😢", label: "Triste"  },
  { key: "angry",    emoji: "😡", label: "Grrrr"   },
];

const getImg = (path) =>
  !path ? null : path.startsWith("http") ? path : `${BACKEND}/${path}`;

const timeAgo = (date) => {
  if (!date) return "";
  const diff = (Date.now() - new Date(date)) / 1000;
  if (diff < 60)  return "À l'instant";
  if (diff < 3600) return `${Math.floor(diff / 60)} min`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h`;
  if (diff < 604800) return `${Math.floor(diff / 86400)}j`;
  return new Date(date).toLocaleDateString("fr-FR");
};

/* ─────────────────────────────────────────────
   REACTION PICKER
───────────────────────────────────────────── */
const ReactionPicker = ({ onPick, current }) => (
  <div className="pc-reaction-picker">
    {REACTIONS.map((r) => (
      <button
        key={r.key}
        className={`pc-rp-btn${current === r.key ? " picked" : ""}`}
        onClick={() => onPick(r.key)}
        title={r.label}
      >
        <span className="pc-rp-emoji">{r.emoji}</span>
        <span className="pc-rp-label">{r.label}</span>
      </button>
    ))}
  </div>
);

/* ─────────────────────────────────────────────
   REACTION SUMMARY (grouped bubbles)
───────────────────────────────────────────── */
const ReactionSummary = ({ counts }) => {
  const top = REACTIONS.filter((r) => (counts?.[r.key] || 0) > 0)
    .sort((a, b) => (counts[b.key] || 0) - (counts[a.key] || 0))
    .slice(0, 3);
  const total = Object.values(counts || {}).reduce((s, v) => s + v, 0);
  if (!total) return null;
  return (
    <span className="pc-reaction-summary">
      {top.map((r) => (
        <span key={r.key} className="pc-rs-emoji">{r.emoji}</span>
      ))}
      <span className="pc-rs-count">{total}</span>
    </span>
  );
};

/* ─────────────────────────────────────────────
   SINGLE COMMENT
───────────────────────────────────────────── */
const Comment = ({ comment, pubId, onRefresh, depth = 0 }) => {
  const [showReplies,  setShowReplies]  = useState(false);
  const [replyText,    setReplyText]    = useState("");
  const [replyOpen,    setReplyOpen]    = useState(false);
  const [myReaction,   setMyReaction]   = useState(comment.my_reaction || null);
  const [reactionCounts, setReactionCounts] = useState(comment.reaction_counts || {});
  const [pickerOpen,   setPickerOpen]   = useState(false);
  const pickerRef = useRef(null);
  const holdTimer = useRef(null);

  /* close picker on outside click */
  useEffect(() => {
    const h = (e) => { if (pickerRef.current && !pickerRef.current.contains(e.target)) setPickerOpen(false); };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, []);

  const handleReact = async (key) => {
    setPickerOpen(false);
    try {
      const same = myReaction === key;
      const prev = myReaction;
      /* optimistic */
      setMyReaction(same ? null : key);
      setReactionCounts((c) => {
        const n = { ...c };
        if (prev) n[prev] = Math.max(0, (n[prev] || 1) - 1);
        if (!same) n[key] = (n[key] || 0) + 1;
        return n;
      });
      await API.post(`/publications/${pubId}/comments/${comment.id_commentaire}/react`, {
        type_reaction: same ? null : key,
      });
    } catch { /* revert on error */ onRefresh(); }
  };

  const sendReply = async () => {
    if (!replyText.trim()) return;
    try {
      await API.post(`/publications/${pubId}/comments`, {
        contenu_commentaire: replyText.trim(),
        parent_id: comment.id_commentaire,
      });
      setReplyText("");
      setReplyOpen(false);
      onRefresh();
    } catch {}
  };

  const myReactionDef = REACTIONS.find((r) => r.key === myReaction);
  const replies = comment.replies || [];

  return (
    <div className={`pc-comment${depth > 0 ? " pc-comment-reply" : ""}`}>
      {depth > 0 && <div className="pc-reply-line" />}

      <img
        className="pc-comment-ava"
        src={getImg(comment.photo_user) || `https://ui-avatars.com/api/?name=${encodeURIComponent(comment.prenom_user||"U")}&background=5a3fa0&color=fff`}
        alt={comment.prenom_user}
        onError={(e) => { e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(comment.prenom_user||"U")}&background=5a3fa0&color=fff`; }}
      />

      <div className="pc-comment-body">
        <div className="pc-comment-bubble">
          <span className="pc-comment-name">{comment.prenom_user} {comment.nom_user}</span>
          <p className="pc-comment-text">{comment.contenu_commentaire}</p>
        </div>

        {/* reaction summary on comment */}
        <ReactionSummary counts={reactionCounts} />

        <div className="pc-comment-meta">
          <span className="pc-comment-time">{timeAgo(comment.created_at)}</span>

          {/* react to comment */}
          <div className="pc-comment-action-wrap" ref={pickerRef}>
            <button
              className={`pc-comment-action${myReaction ? " reacted" : ""}`}
              onClick={() => setPickerOpen((o) => !o)}
              onMouseEnter={() => { holdTimer.current = setTimeout(() => setPickerOpen(true), 400); }}
              onMouseLeave={() => clearTimeout(holdTimer.current)}
            >
              {myReactionDef ? (
                <>{myReactionDef.emoji} {myReactionDef.label}</>
              ) : "👍 J'aime"}
            </button>
            {pickerOpen && (
              <div className="pc-picker-mini">
                <ReactionPicker onPick={handleReact} current={myReaction} />
              </div>
            )}
          </div>

          {/* reply */}
          {depth < 2 && (
            <button className="pc-comment-action" onClick={() => setReplyOpen((o) => !o)}>
              Répondre
            </button>
          )}

          {replies.length > 0 && (
            <button className="pc-comment-action accent" onClick={() => setShowReplies((o) => !o)}>
              {showReplies ? "Masquer" : `${replies.length} réponse${replies.length > 1 ? "s" : ""}`}
            </button>
          )}
        </div>

        {/* reply input */}
        {replyOpen && (
          <div className="pc-reply-input-wrap">
            <input
              className="pc-reply-input"
              placeholder={`Répondre à ${comment.prenom_user}…`}
              value={replyText}
              onChange={(e) => setReplyText(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && sendReply()}
              autoFocus
            />
            <button className="pc-reply-send" onClick={sendReply}>
              <SendIcon />
            </button>
          </div>
        )}

        {/* nested replies */}
        {showReplies && replies.map((r) => (
          <Comment key={r.id_commentaire} comment={r} pubId={pubId} onRefresh={onRefresh} depth={depth + 1} />
        ))}
      </div>
    </div>
  );
};

/* ─────────────────────────────────────────────
   MAIN PUBLICATION CARD
───────────────────────────────────────────── */
export default function PublicationCard({ publication, onUpdate, defaultShowComments = false }) {
  const [pub,          setPub]          = useState(publication);
  const [showComments, setShowComments] = useState(defaultShowComments);
  const [comments,     setComments]     = useState([]);
  const [cmtLoading,   setCmtLoading]   = useState(false);
  const [cmtText,      setCmtText]      = useState("");
  const [myReaction,   setMyReaction]   = useState(publication.my_reaction || null);
  const [reactionCounts, setReactionCounts] = useState(publication.reaction_counts || {});
  const [pickerOpen,   setPickerOpen]   = useState(false);
  const [lightbox,     setLightbox]     = useState(null); // image index
  const [expanded,     setExpanded]     = useState(false);
  const pickerRef = useRef(null);
  const holdTimer = useRef(null);
  const inputRef  = useRef(null);

  /* close picker on outside click */
  useEffect(() => {
    const h = (e) => { if (pickerRef.current && !pickerRef.current.contains(e.target)) setPickerOpen(false); };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, []);

  /* auto-load comments if defaultShowComments */
  useEffect(() => {
    if (defaultShowComments) loadComments();
  }, []);

  /* load comments */
  const loadComments = useCallback(async () => {
    if (cmtLoading) return;
    setCmtLoading(true);
    try {
      const res = await API.get(`/publications/${pub.id_publication}/comments`);
      setComments(Array.isArray(res.data) ? res.data : []);
    } catch { setComments([]); }
    finally   { setCmtLoading(false); }
  }, [pub.id_publication, cmtLoading]);

  const toggleComments = () => {
    if (!showComments) loadComments();
    setShowComments((o) => !o);
  };

  /* send comment */
  const sendComment = async () => {
    if (!cmtText.trim()) return;
    try {
      await API.post(`/publications/${pub.id_publication}/comments`, {
        contenu_commentaire: cmtText.trim(),
      });
      setCmtText("");
      loadComments();
      onUpdate?.();
    } catch {}
  };

  /* react to publication */
  const handleReact = async (key) => {
    setPickerOpen(false);
    const same = myReaction === key;
    const prev = myReaction;
    setMyReaction(same ? null : key);
    setReactionCounts((c) => {
      const n = { ...c };
      if (prev) n[prev] = Math.max(0, (n[prev] || 1) - 1);
      if (!same) n[key] = (n[key] || 0) + 1;
      return n;
    });
    try {
      await API.post(`/publications/${pub.id_publication}/react`, {
        type_reaction: same ? null : key,
      });
      onUpdate?.();
    } catch { onUpdate?.(); }
  };

  /* share */
  const handleShare = () => {
    const url = `${window.location.origin}/publication/${pub.id_publication}`;
    navigator.clipboard?.writeText(url).then(() => {
      // tiny toast handled in CSS
    });
  };

  const myReactionDef = REACTIONS.find((r) => r.key === myReaction);
  const media = pub.medias || [];
  const bodyText = pub.contenu_publication || pub.contenu || "";
  const isLong = bodyText.length > 280;

  return (
    <>
      <article className="pc-card">

        {/* ── HEADER ── */}
        <div className="pc-header">
          <img
            className="pc-avatar"
            src={getImg(pub.photo_user) || `https://ui-avatars.com/api/?name=${encodeURIComponent((pub.prenom_user||"U")[0])}&background=5a3fa0&color=fff`}
            alt={pub.prenom_user}
            onError={(e) => { e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent((pub.prenom_user||"U")[0])}&background=5a3fa0&color=fff`; }}
          />
          <div className="pc-author">
            <span className="pc-author-name">{pub.prenom_user} {pub.nom_user}</span>
            <div className="pc-author-meta">
              <span className="pc-time">{timeAgo(pub.created_at)}</span>
              {pub.type_publication && (
                <span className="pc-type-badge">
                  {pub.type_publication === "debat"  && "⚖️ Débat"}
                  {pub.type_publication === "photo"  && "📷 Photo"}
                  {pub.type_publication === "video"  && "🎥 Vidéo"}
                  {pub.type_publication === "pdf"    && "📄 PDF"}
                  {pub.type_publication === "texte"  && "📝 Texte"}
                </span>
              )}
            </div>
          </div>
          <button className="pc-more" aria-label="Options">
            <DotsIcon />
          </button>
        </div>

        {/* ── BODY ── */}
        {pub.titre_publication && (
          <h3 className="pc-title">{pub.titre_publication}</h3>
        )}

        {bodyText && (
          <p className="pc-body">
            {isLong && !expanded ? bodyText.slice(0, 280) + "… " : bodyText}
            {isLong && (
              <button className="pc-expand-btn" onClick={() => setExpanded((o) => !o)}>
                {expanded ? "Voir moins" : "Voir plus"}
              </button>
            )}
          </p>
        )}

        {/* ── MEDIA ── */}
        {media.length > 0 && (
          <div className={`pc-media-grid pc-media-${Math.min(media.length, 4)}`}>
            {media.slice(0, 4).map((m, i) => {
              const src = getImg(m.url_media || m.chemin_fichier);
              const isImg   = m.type_media === "image"  || /\.(jpg|jpeg|png|gif|webp)/i.test(src||"");
              const isVid   = m.type_media === "video"  || /\.(mp4|webm|ogg)/i.test(src||"");
              const isPdf   = m.type_media === "pdf"    || /\.pdf$/i.test(src||"");
              const overlay = media.length > 4 && i === 3;
              return (
                <div key={i} className="pc-media-item" onClick={() => isImg && setLightbox(i)}>
                  {isImg && <img src={src} alt="" loading="lazy"/>}
                  {isVid && <video src={src} controls preload="metadata"/>}
                  {isPdf && (
                    <a href={src} target="_blank" rel="noreferrer" className="pc-pdf-tile">
                      <span className="pc-pdf-icon">📄</span>
                      <span>Ouvrir le PDF</span>
                    </a>
                  )}
                  {overlay && (
                    <div className="pc-media-overlay">+{media.length - 4}</div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* ── REACTION SUMMARY ── */}
        <div className="pc-stats-row">
          <ReactionSummary counts={reactionCounts} />
          <span className="pc-stats-cmt" onClick={toggleComments}>
            {(pub.nb_commentaires || comments.length || 0)} commentaire{(pub.nb_commentaires||0)!==1?"s":""}
          </span>
        </div>

        {/* ── ACTIONS BAR ── */}
        <div className="pc-actions">

          {/* LIKE / REACT */}
          <div className="pc-action-wrap" ref={pickerRef}>
            <button
              className={`pc-action-btn${myReaction ? " reacted" : ""}`}
              onClick={() => myReaction ? handleReact(myReaction) : setPickerOpen((o) => !o)}
              onMouseEnter={() => { holdTimer.current = setTimeout(() => setPickerOpen(true), 500); }}
              onMouseLeave={() => clearTimeout(holdTimer.current)}
            >
              {myReactionDef ? (
                <span className="pc-action-emoji">{myReactionDef.emoji}</span>
              ) : <ThumbIcon />}
              <span style={{ color: myReaction ? "var(--p1)" : "inherit" }}>
                {myReactionDef ? myReactionDef.label : "J'aime"}
              </span>
            </button>
            {pickerOpen && (
              <div className="pc-picker-float">
                <ReactionPicker onPick={handleReact} current={myReaction} />
              </div>
            )}
          </div>

          {/* COMMENT */}
          <button className="pc-action-btn" onClick={toggleComments}>
            <CommentIcon />
            <span>Commenter</span>
          </button>

          {/* SHARE */}
          <button className="pc-action-btn" onClick={handleShare}>
            <ShareIcon />
            <span>Partager</span>
          </button>
        </div>

        {/* ── COMMENTS SECTION ── */}
        {showComments && (
          <div className="pc-comments-section">

            {/* comment input */}
            <div className="pc-new-comment">
              <img
                className="pc-comment-ava"
                src="https://randomuser.me/api/portraits/men/44.jpg"
                alt="moi"
              />
              <div className="pc-new-comment-box">
                <input
                  ref={inputRef}
                  className="pc-new-comment-input"
                  placeholder="Écrire un commentaire…"
                  value={cmtText}
                  onChange={(e) => setCmtText(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && sendComment()}
                />
                <div className="pc-new-comment-actions">
                  <button className="pc-cmt-emoji-btn" title="Emoji">😊</button>
                  <button className="pc-cmt-send-btn" onClick={sendComment} disabled={!cmtText.trim()}>
                    <SendIcon />
                  </button>
                </div>
              </div>
            </div>

            {/* comments list */}
            {cmtLoading ? (
              <div className="pc-cmt-loading">
                <div className="pc-cmt-spin"/>
              </div>
            ) : comments.length === 0 ? (
              <p className="pc-cmt-empty">Soyez le premier à commenter 💬</p>
            ) : (
              <div className="pc-comments-list">
                {comments.map((c) => (
                  <Comment
                    key={c.id_commentaire}
                    comment={c}
                    pubId={pub.id_publication}
                    onRefresh={loadComments}
                  />
                ))}
              </div>
            )}
          </div>
        )}
      </article>

      {/* ── LIGHTBOX ── */}
      {lightbox !== null && (
        <div className="pc-lightbox" onClick={() => setLightbox(null)}>
          <button className="pc-lb-close" onClick={() => setLightbox(null)}>✕</button>
          {lightbox > 0 && (
            <button className="pc-lb-prev" onClick={(e) => { e.stopPropagation(); setLightbox((i) => i - 1); }}>‹</button>
          )}
          <img
            className="pc-lb-img"
            src={getImg(media[lightbox]?.url_media || media[lightbox]?.chemin_fichier)}
            alt=""
            onClick={(e) => e.stopPropagation()}
          />
          {lightbox < media.length - 1 && (
            <button className="pc-lb-next" onClick={(e) => { e.stopPropagation(); setLightbox((i) => i + 1); }}>›</button>
          )}
        </div>
      )}
    </>
  );
}

/* ─── micro svg icons ─── */
const ThumbIcon   = () => <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 9V5a3 3 0 0 0-3-3l-4 9v11h11.28a2 2 0 0 0 2-1.7l1.38-9a2 2 0 0 0-2-2.3H14z"/><path d="M7 22H4a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2h3"/></svg>;
const CommentIcon = () => <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>;
const ShareIcon   = () => <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/></svg>;
const SendIcon    = () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>;
const DotsIcon    = () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="5" r="1"/><circle cx="12" cy="12" r="1"/><circle cx="12" cy="19" r="1"/></svg>;