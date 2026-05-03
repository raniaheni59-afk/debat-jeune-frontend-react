import React, { useEffect, useMemo, useState, useRef } from "react";
import api from "../services/api";
import { useNavigate } from "react-router-dom";
import "./PublicationCard.css";

const REACTIONS = [
  { type: "like",  emoji: "👍", label: "J'aime",  color: "#4267B2" },
  { type: "love",  emoji: "❤️", label: "J'adore", color: "#F33E58" },
  { type: "haha",  emoji: "😂", label: "Haha",    color: "#F7B125" },
  { type: "wow",   emoji: "😮", label: "Wow",     color: "#F7B125" },
  { type: "sad",   emoji: "😢", label: "Triste",  color: "#F7B125" },
  { type: "angry", emoji: "😡", label: "Grrr",    color: "#E9710F" },
];

const getMediaUrl = (url) => {
  if (!url) return "";
  if (url.startsWith("http")) return url;
  const base = (api?.defaults?.baseURL || "").replace(/\/api\/?$/, "");
  return `${base}/${url.replace(/^\//, "")}`;
};

const formatDate = (d) => {
  if (!d) return "";
  const date = new Date(d);
  const now = new Date();
  const diff = Math.floor((now - date) / 1000);
  if (diff < 60) return "À l'instant";
  if (diff < 3600) return `Il y a ${Math.floor(diff / 60)} min`;
  if (diff < 86400) return `Il y a ${Math.floor(diff / 3600)} h`;
  if (diff < 604800) return `Il y a ${Math.floor(diff / 86400)} j`;
  return date.toLocaleDateString("fr-FR", { day: "2-digit", month: "short", year: "numeric" });
};

const buildTree = (flat = []) => {
  const map = {};
  flat.forEach(c => (map[c.id_commentaire] = { ...c, replies: [] }));
  const roots = [];
  flat.forEach(c => {
    if (c.parent_id && map[c.parent_id]) map[c.parent_id].replies.push(map[c.id_commentaire]);
    else roots.push(map[c.id_commentaire]);
  });
  return roots;
};

const countTree = (list = []) =>
  list.reduce((acc, item) => acc + 1 + countTree(item.replies || []), 0);

const currentUser = () => {
  try { return JSON.parse(localStorage.getItem("user")) || {}; }
  catch { return {}; }
};

/* ── Reaction Popup ── */
function ReactionPicker({ onSelect, onClose }) {
  const ref = useRef(null);
  useEffect(() => {
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) onClose(); };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [onClose]);

  return (
    <div ref={ref} className="pc-reaction-picker">
      {REACTIONS.map(r => (
        <button key={r.type} className="pc-reaction-btn" onClick={() => onSelect(r.type)} title={r.label}>
          <span className="pc-reaction-emoji">{r.emoji}</span>
          <span className="pc-reaction-label">{r.label}</span>
        </button>
      ))}
    </div>
  );
}

/* ── Comment Item ── */
function CommentItem({ comment, publicationId, depth = 0, onRefresh }) {
  const [showPicker, setShowPicker] = useState(false);
  const [showReplyForm, setShowReplyForm] = useState(false);
  const [replyText, setReplyText] = useState("");
  const [showReplies, setShowReplies] = useState(false);
  const me = currentUser();

  const topReactions = (comment.reactions || [])
    .filter(r => r.count > 0)
    .sort((a, b) => b.count - a.count)
    .slice(0, 3);
  const totalReact = (comment.reactions || []).reduce((a, r) => a + (r.count || 0), 0);

  const handleReact = async (type) => {
    try {
      await api.post("/publications/comment-react", { id_commentaire: comment.id_commentaire, type_reaction: type });
      setShowPicker(false);
      onRefresh?.();
    } catch (e) { console.error(e); }
  };

  const handleReply = async (e) => {
    e.preventDefault();
    if (!replyText.trim()) return;
    try {
      await api.post("/publications/comment", {
        id_publication: publicationId,
        contenu: replyText,
        parent_id: comment.id_commentaire,
      });
      setReplyText(""); setShowReplyForm(false); setShowReplies(true);
      onRefresh?.();
    } catch (e) { console.error(e); }
  };

  const userReaction = REACTIONS.find(r => r.type === comment.userReaction);
  const avatarUrl = comment.photo_user ? getMediaUrl(comment.photo_user) : null;
  const initials = ((comment.prenom_user?.[0] || "") + (comment.nom_user?.[0] || "")).toUpperCase();

  return (
    <div className="pc-comment-wrap" style={{ marginLeft: depth > 0 ? Math.min(depth * 32, 96) + "px" : 0 }}>
      <div className="pc-comment">
        {avatarUrl ? (
          <img src={avatarUrl} alt="" className="pc-comment-avatar" onError={e => e.target.style.display = "none"} />
        ) : (
          <div className="pc-comment-avatar pc-avatar-fallback">{initials}</div>
        )}
        <div className="pc-comment-body">
          <div className="pc-comment-bubble">
            <span className="pc-comment-name">
              {[comment.prenom_user, comment.nom_user].filter(Boolean).join(" ")}
            </span>
            <p className="pc-comment-text">{comment.contenu}</p>
          </div>

          {totalReact > 0 && (
            <div className="pc-comment-react-summary">
              {topReactions.map(r => (
                <span key={r.type}>{REACTIONS.find(x => x.type === r.type)?.emoji}</span>
              ))}
              <span className="pc-react-count">{totalReact}</span>
            </div>
          )}

          <div className="pc-comment-actions">
            <span className="pc-comment-time">{formatDate(comment.created_at)}</span>
            <div className="pc-comment-action-wrap" style={{ position: "relative" }}>
              <button
                className={`pc-comment-act ${userReaction ? "reacted" : ""}`}
                onClick={() => setShowPicker(!showPicker)}
                style={userReaction ? { color: userReaction.color } : {}}
              >
                {userReaction ? `${userReaction.emoji} ${userReaction.label}` : "👍 J'aime"}
              </button>
              {showPicker && <ReactionPicker onSelect={handleReact} onClose={() => setShowPicker(false)} />}
            </div>
            <button className="pc-comment-act" onClick={() => setShowReplyForm(!showReplyForm)}>
              Répondre
            </button>
            {comment.replies?.length > 0 && (
              <button className="pc-comment-act pc-replies-toggle" onClick={() => setShowReplies(!showReplies)}>
                {showReplies ? "▲ Masquer" : `▼ ${comment.replies.length} réponse${comment.replies.length > 1 ? "s" : ""}`}
              </button>
            )}
          </div>

          {showReplyForm && (
            <form onSubmit={handleReply} className="pc-reply-form">
              <input
                autoFocus
                placeholder={`Répondre à ${comment.prenom_user || ""}…`}
                value={replyText}
                onChange={e => setReplyText(e.target.value)}
              />
              <button type="submit" disabled={!replyText.trim()}>↩</button>
            </form>
          )}
        </div>
      </div>

      {showReplies && comment.replies?.length > 0 && (
        <div className="pc-replies">
          {comment.replies.map(r => (
            <CommentItem key={r.id_commentaire} comment={r} publicationId={publicationId}
              depth={depth + 1} onRefresh={onRefresh} />
          ))}
        </div>
      )}
    </div>
  );
}

/* ── Debat Column ── */
function DebatColumn({ publicationId, side, onCountChange }) {
  const [tree, setTree] = useState([]);
  const [loading, setLoading] = useState(true);
  const [composerOpen, setComposerOpen] = useState(false);
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);
  const [selectedId, setSelectedId] = useState(null);

  const isPour = side === "pour";

  const load = async () => {
    try {
      setLoading(true);
      const res = await api.get(`/publications/${publicationId}/comments?side=${side}`);
      const t = buildTree(res.data || []);
      setTree(t);
      onCountChange?.(countTree(t));
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, [publicationId, side]);
  useEffect(() => {
    if (!selectedId && tree.length > 0) setSelectedId(tree[0].id_commentaire);
  }, [tree]);

  const send = async (e) => {
    e.preventDefault();
    if (!text.trim()) return;
    try {
      setSending(true);
      await api.post("/publications/comment", {
        id_publication: publicationId,
        contenu: text.trim(),
        debat_side: side,
      });
      setText(""); setComposerOpen(false);
      await load();
    } catch (e) { console.error(e); }
    finally { setSending(false); }
  };

  const selected = tree.find(x => x.id_commentaire === selectedId) || null;

  return (
    <div className={`pc-debat-col ${isPour ? "pour" : "contre"}`}>
      <div className="pc-debat-col-header">
        <div className={`pc-debat-col-title ${isPour ? "pour" : "contre"}`}>
          {isPour ? "✅ Pour" : "❌ Contre"}
        </div>
        <span className="pc-debat-count">{tree.length} arg.</span>
        <button className="pc-debat-add" onClick={() => setComposerOpen(s => !s)}>+</button>
      </div>

      {composerOpen && (
        <form className="pc-debat-compose" onSubmit={send}>
          <input
            autoFocus
            value={text}
            onChange={e => setText(e.target.value)}
            placeholder={isPour ? "Ajouter un argument pour…" : "Ajouter un argument contre…"}
          />
          <button type="submit" disabled={!text.trim() || sending} className={isPour ? "pour" : "contre"}>
            {sending ? "…" : "Publier"}
          </button>
        </form>
      )}

      <div className="pc-debat-args">
        {loading ? (
          <div className="pc-debat-empty">Chargement...</div>
        ) : tree.length === 0 ? (
          <div className="pc-debat-empty">Aucun argument. Soyez le premier !</div>
        ) : (
          tree.map(arg => (
            <React.Fragment key={arg.id_commentaire}>
              <div
                className={`pc-debat-arg ${isPour ? "pour" : "contre"} ${selectedId === arg.id_commentaire ? "selected" : ""}`}
                onClick={() => setSelectedId(selectedId === arg.id_commentaire ? null : arg.id_commentaire)}
              >
                <div className="pc-debat-arg-user">
                  <div className="pc-debat-avatar">
                    {((arg.prenom_user?.[0] || "") + (arg.nom_user?.[0] || "")).toUpperCase()}
                  </div>
                  <span className="pc-debat-arg-name">
                    {[arg.prenom_user, arg.nom_user].filter(Boolean).join(" ")}
                  </span>
                  <span className="pc-debat-arg-time">{formatDate(arg.created_at)}</span>
                </div>
                <p className="pc-debat-arg-text">{arg.contenu}</p>
                {arg.replies?.length > 0 && (
                  <span className="pc-debat-arg-replies">💬 {arg.replies.length}</span>
                )}
              </div>

              {selectedId === arg.id_commentaire && (
                <div className="pc-debat-thread">
                  <div className="pc-debat-thread-header">
                    <span>💬 Réponses</span>
                    <button className="pc-debat-thread-close" onClick={() => setSelectedId(null)}>✕</button>
                  </div>

                  {arg.replies?.length === 0 ? (
                    <p className="pc-debat-empty" style={{ padding: "8px 0" }}>Aucune réponse</p>
                  ) : (
                    arg.replies.map(r => (
                      <CommentItem key={r.id_commentaire} comment={r}
                        publicationId={publicationId} depth={0} onRefresh={load} />
                    ))
                  )}

                  <form
                    className="pc-debat-reply-form"
                    onSubmit={async (e) => {
                      e.preventDefault();
                      const input = e.currentTarget.elements.reply;
                      const val = (input?.value || "").trim();
                      if (!val) return;
                      try {
                        await api.post("/publications/comment", {
                          id_publication: publicationId,
                          contenu: val,
                          parent_id: arg.id_commentaire,
                          debat_side: side,
                        });
                        input.value = "";
                        await load();
                      } catch (er) { console.error(er); }
                    }}
                  >
                    <input name="reply" placeholder="Écrire une réponse…" />
                    <button type="submit">↩</button>
                  </form>
                </div>
              )}
            </React.Fragment>
          ))
        )}
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════
   MAIN PublicationCard
══════════════════════════════════════════ */
export default function PublicationCard({ publication, onUpdate, defaultShowComments = false }) {
  const navigate = useNavigate();
  const [showComments, setShowComments] = useState(defaultShowComments);
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState("");
  const [showPicker, setShowPicker] = useState(false);
  const [loadingComments, setLoadingComments] = useState(false);
  const [imageModal, setImageModal] = useState(null);
  const [pourCount, setPourCount] = useState(publication.pour_comments_count || 0);
  const [contreCount, setContreCount] = useState(publication.contre_comments_count || 0);
  const me = currentUser();

  const totalReactions = ["likes","loves","hahas","wows","sads","angrys"]
    .reduce((a, k) => a + (publication[k] || 0), 0);

  const topEmojis = REACTIONS
    .filter(r => publication[`${r.type}s`] > 0)
    .sort((a, b) => (publication[`${b.type}s`] || 0) - (publication[`${a.type}s`] || 0))
    .slice(0, 3)
    .map(r => r.emoji);

  const loadComments = async () => {
    if (showComments) { setShowComments(false); return; }
    setLoadingComments(true);
    try {
      const res = await api.get(`/publications/${publication.id_publication}/comments`);
      setComments(buildTree(res.data || []));
      setShowComments(true);
    } catch (e) { console.error(e); }
    finally { setLoadingComments(false); }
  };

  const refreshComments = async () => {
    try {
      const res = await api.get(`/publications/${publication.id_publication}/comments`);
      setComments(buildTree(res.data || []));
      onUpdate?.();
    } catch (e) { console.error(e); }
  };

  const handleComment = async (e) => {
    e.preventDefault();
    if (!newComment.trim()) return;
    try {
      await api.post("/publications/comment", {
        id_publication: publication.id_publication,
        contenu: newComment,
      });
      setNewComment("");
      refreshComments();
    } catch (e) { console.error(e); }
  };

  const handleReact = async (type) => {
    try {
      setShowPicker(false);
      await api.post("/publications/react", {
        id_publication: publication.id_publication,
        type_reaction: type,
      });
      onUpdate?.();
    } catch (e) { console.error(e); }
  };

  const totalComments = showComments && publication.type_publication !== "debat"
    ? countTree(comments)
    : (publication.nb_commentaires || 0);

  const userReaction = REACTIONS.find(r => r.type === publication.userReaction);
  const authorName = [publication.nom_user, publication.prenom_user].filter(Boolean).join(" ") || "Utilisateur";
  const authorAvatar = publication.photo_user ? getMediaUrl(publication.photo_user) : null;
  const authorInitials = ((publication.prenom_user?.[0] || "") + (publication.nom_user?.[0] || "")).toUpperCase();
  const myAvatar = me.photo_user ? getMediaUrl(me.photo_user) : null;
  const myInitials = ((me.prenom_user?.[0] || "") + (me.nom_user?.[0] || "")).toUpperCase();

  return (
    <div className="pc-card">
      {/* HEADER */}
      <div className="pc-header">
        {authorAvatar ? (
          <img src={authorAvatar} alt="" className="pc-author-avatar"
            onError={e => e.target.style.display = "none"} />
        ) : (
          <div className="pc-author-avatar pc-avatar-fallback">{authorInitials}</div>
        )}
        <div className="pc-author-info">
          <strong className="pc-author-name"
            onClick={() => navigate(`/profile/${publication.user_id}`)}>
            {authorName}
          </strong>
          <span className="pc-author-date">{formatDate(publication.date_publication || publication.created_at)}</span>
        </div>
        {publication.type_publication === "debat" && <span className="pc-badge debat">⚖️ Débat</span>}
        {publication.type_publication === "photo" && <span className="pc-badge photo">📷 Photo</span>}
        {publication.type_publication === "video" && <span className="pc-badge video">🎥 Vidéo</span>}
        {publication.type_publication === "pdf"   && <span className="pc-badge pdf">📄 PDF</span>}
      </div>

      {/* CONTENT */}
      {publication.type_publication === "debat" ? (
        <div className="pc-debat-wrap">
          <div className="pc-debat-question">
            <span className="pc-debat-icon">⚖️</span>
            <p>{publication.question_debat}</p>
          </div>
          <div className="pc-debat-cols">
            <DebatColumn publicationId={publication.id_publication} side="pour" onCountChange={setPourCount} />
            <DebatColumn publicationId={publication.id_publication} side="contre" onCountChange={setContreCount} />
          </div>
        </div>
      ) : (
        <div className="pc-content">
          {publication.titre_publication && <h4 className="pc-title">{publication.titre_publication}</h4>}
          {(publication.contenu || publication.contenu_publication) && (
            <p className="pc-text">{publication.contenu || publication.contenu_publication}</p>
          )}

          {publication.medias?.length > 0 && (
            <div className={`pc-medias count-${Math.min(publication.medias.length, 4)}`}>
              {publication.medias.map(media => (
                <div key={media.id_media} className="pc-media-item">
                  {(media.type_media === "photo" || media.type_media === "image") && (
                    <img src={getMediaUrl(media.url_media)} alt="" loading="lazy"
                      onClick={() => setImageModal(getMediaUrl(media.url_media))}
                      onError={e => e.target.style.display = "none"} />
                  )}
                  {media.type_media === "video" && (
                    <video controls preload="metadata">
                      <source src={getMediaUrl(media.url_media)} type={media.mimetype || "video/mp4"} />
                    </video>
                  )}
                  {media.type_media === "pdf" && (
                    <div className="pc-pdf-card">
                      <span className="pc-pdf-icon">📄</span>
                      <div className="pc-pdf-info">
                        <span className="pc-pdf-name">{media.nom_original || "Document PDF"}</span>
                        <span className="pc-pdf-size">PDF</span>
                      </div>
                      <a href={`https://docs.google.com/viewer?url=${encodeURIComponent(getMediaUrl(media.url_media))}&embedded=true`}
                        target="_blank" rel="noopener noreferrer" className="pc-pdf-btn">
                        Ouvrir ↗
                      </a>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* FOOTER */}
      <div className="pc-footer">
        {/* Stats bar */}
        {(totalReactions > 0 || totalComments > 0) && (
          <div className="pc-stats-bar">
            {totalReactions > 0 && (
              <span className="pc-stat-reactions">
                {topEmojis.join("")} <span>{totalReactions}</span>
              </span>
            )}
            {publication.type_publication !== "debat" && totalComments > 0 && (
              <span className="pc-stat-comments" onClick={loadComments}>
                {totalComments} commentaire{totalComments > 1 ? "s" : ""}
              </span>
            )}
            {publication.type_publication === "debat" && (
              <span className="pc-stat-comments">
                {pourCount + contreCount} argument{pourCount + contreCount > 1 ? "s" : ""}
              </span>
            )}
          </div>
        )}

        {/* Divider */}
        <div className="pc-divider" />

        {/* Action buttons */}
        <div className="pc-actions">
          {/* React button */}
          <div className="pc-action-wrap" style={{ position: "relative" }}>
            <button
              className={`pc-action-btn ${userReaction ? "reacted" : ""}`}
              onClick={() => setShowPicker(!showPicker)}
              style={userReaction ? { color: userReaction.color } : {}}
            >
              {userReaction ? `${userReaction.emoji} ${userReaction.label}` : "👍 J'aime"}
            </button>
            {showPicker && <ReactionPicker onSelect={handleReact} onClose={() => setShowPicker(false)} />}
          </div>

          {/* Comment button */}
          {publication.type_publication !== "debat" && (
            <button className="pc-action-btn" onClick={loadComments}>
              {loadingComments ? "⏳" : "💬"} {showComments ? "Masquer" : "Commenter"}
            </button>
          )}

          {/* Share button */}
          <button className="pc-action-btn" onClick={() => {
            navigator.clipboard?.writeText(window.location.origin + "/publication/" + publication.id_publication);
          }}>
            🔗 Partager
          </button>
        </div>
      </div>

      {/* COMMENTS SECTION */}
      {showComments && publication.type_publication !== "debat" && (
        <div className="pc-comments-section">
          {/* New comment form */}
          <form onSubmit={handleComment} className="pc-new-comment">
            {myAvatar ? (
              <img src={myAvatar} alt="" className="pc-comment-avatar"
                onError={e => e.target.style.display = "none"} />
            ) : (
              <div className="pc-comment-avatar pc-avatar-fallback">{myInitials}</div>
            )}
            <div className={`pc-new-comment-input ${newComment.trim() ? "has-text" : ""}`}>
              <textarea
                placeholder="Écrire un commentaire…"
                value={newComment}
                rows={1}
                onChange={e => {
                  setNewComment(e.target.value);
                  e.target.style.height = "20px";
                  e.target.style.height = Math.min(e.target.scrollHeight, 100) + "px";
                  e.target.style.overflowY = e.target.scrollHeight > 100 ? "auto" : "hidden";
                }}
                onKeyDown={e => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    if (newComment.trim()) handleComment(e);
                  }
                }}
              />
              <button
  type="submit"
  className="pc-new-comment-send"
  disabled={!newComment.trim()}
>
  ➤
</button>
            </div>
          </form>

          {/* Comments list */}
          <div className="pc-comments-list">
            {comments.length === 0 ? (
              <p className="pc-no-comments">Aucun commentaire. Soyez le premier ! 💬</p>
            ) : (
              comments.map(c => (
                <CommentItem key={c.id_commentaire} comment={c}
                  publicationId={publication.id_publication}
                  depth={0} onRefresh={refreshComments} />
              ))
            )}
          </div>
        </div>
      )}

      {/* IMAGE MODAL */}
      {imageModal && (
        <div className="pc-modal" onClick={() => setImageModal(null)}>
          <div className="pc-modal-content" onClick={e => e.stopPropagation()}>
            <button className="pc-modal-close" onClick={() => setImageModal(null)}>✕</button>
            <img src={imageModal} alt="full" />
          </div>
        </div>
      )}
    </div>
  );
}