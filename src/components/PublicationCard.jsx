import React, { useEffect, useMemo, useState } from "react";
import api from "../services/api";
import { useNavigate } from "react-router-dom"; 
import "./PublicationCard.css";

const REACTIONS = [
  { type: "like", emoji: "👍", label: "J'aime" },
  { type: "love", emoji: "❤️", label: "J'adore" },
  { type: "haha", emoji: "😂", label: "Haha" },
  { type: "wow", emoji: "😮", label: "Wow" },
  { type: "sad", emoji: "😢", label: "Triste" },
  { type: "angry", emoji: "😡", label: "Grrr" },
];

const getMediaUrl = (url) => {
  if (!url) return "";
  if (url.startsWith("http")) return url;
  const baseURL = api?.defaults?.baseURL || "";
  const cleanBase = baseURL.replace(/\/api\/?$/, "");
  const cleanUrl = url.replace(/^\//, "");
  return `${cleanBase}/${cleanUrl}`;
};

const formatDate = (d) => {
  if (!d) return "";
  return new Date(d).toLocaleDateString("fr-FR", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
};

const buildTree = (flat = []) => {
  const map = {};
  flat.forEach((c) => (map[c.id_commentaire] = { ...c, replies: [] }));
  const roots = [];
  flat.forEach((c) => {
    if (c.parent_id && map[c.parent_id]) map[c.parent_id].replies.push(map[c.id_commentaire]);
    else roots.push(map[c.id_commentaire]);
  });
  return roots;
};

const countTree = (list = []) =>
  list.reduce((acc, item) => acc + 1 + countTree(item.replies || []), 0);

/* ─────────────────────────────────────────────
   Commentaires NORMAUX (publication non-debat)
───────────────────────────────────────────── */
function CommentItem({ comment, publicationId, depth = 0, onRefresh }) {
  const [showReactions, setShowReactions] = useState(false);
  const [showReplyForm, setShowReplyForm] = useState(false);
  const [replyText, setReplyText] = useState("");
  const [showReplies, setShowReplies] = useState(false);

  const handleReactComment = async (type) => {
    try {
      await api.post("/publications/comment-react", {
        id_commentaire: comment.id_commentaire,
        type_reaction: type,
      });
      setShowReactions(false);
      onRefresh?.();
    } catch (err) {
      console.error(err);
    }
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
      setReplyText("");
      setShowReplyForm(false);
      setShowReplies(true);
      onRefresh?.();
    } catch (err) {
      console.error(err);
    }
  };

  const totalReact = (comment.reactions || []).reduce((acc, r) => acc + (r.count || 0), 0);

  return (
    <div
      className="comment-item-wrap"
      style={{ marginLeft: depth > 0 ? `${Math.min(depth * 28, 84)}px` : "0" }}
    >
      <div className="comment-item">
        <img
          src={comment.photo_user ? getMediaUrl(comment.photo_user) : "https://via.placeholder.com/38"}
          alt="avatar"
          className="comment-avatar"
          onError={(e) => (e.target.src = "https://via.placeholder.com/38")}
        />

        <div className="comment-bubble-wrap">
          <div className="comment-bubble">
            <strong>{[comment.nom_user, comment.prenom_user].filter(Boolean).join(" ")}</strong>
            <p>{comment.contenu}</p>
          </div>

          {totalReact > 0 && (
            <div className="comment-react-badges">
              {(comment.reactions || [])
                .filter((r) => r.count > 0)
                .map((r) => (
                  <span key={r.type} className="react-badge">
                    {REACTIONS.find((x) => x.type === r.type)?.emoji} {r.count}
                  </span>
                ))}
            </div>
          )}

          <div className="comment-actions">
            <span className="comment-date">{formatDate(comment.created_at)}</span>

            <div
              className="comment-action-btn"
              style={{ position: "relative" }}
              onMouseEnter={() => setShowReactions(true)}
              onMouseLeave={() => setShowReactions(false)}
            >
              <span>
                {comment.userReaction
                  ? REACTIONS.find((r) => r.type === comment.userReaction)?.emoji
                  : "👍"}{" "}
                {comment.userReaction
                  ? REACTIONS.find((r) => r.type === comment.userReaction)?.label
                  : "Réagir"}
              </span>

              {showReactions && (
                <div className="comment-reactions-popup">
                  {REACTIONS.map((r) => (
                    <button key={r.type} onClick={() => handleReactComment(r.type)} title={r.label} type="button">
                      {r.emoji}
                    </button>
                  ))}
                </div>
              )}
            </div>

            <button className="comment-action-btn" onClick={() => setShowReplyForm(!showReplyForm)} type="button">
              💬 Répondre
            </button>

            {comment.replies?.length > 0 && (
              <button className="comment-action-btn replies-btn" onClick={() => setShowReplies(!showReplies)} type="button">
                {showReplies
                  ? "▲ Masquer"
                  : `▼ ${comment.replies.length} réponse${comment.replies.length > 1 ? "s" : ""}`}
              </button>
            )}
          </div>

          {showReplyForm && (
            <form onSubmit={handleReply} className="reply-form">
              <input
                type="text"
                placeholder={`Répondre à ${comment.nom_user || "cet utilisateur"}...`}
                value={replyText}
                onChange={(e) => setReplyText(e.target.value)}
                autoFocus
              />
              <button type="submit" disabled={!replyText.trim()}>
                ↩
              </button>
            </form>
          )}
        </div>
      </div>

      {showReplies && comment.replies?.length > 0 && (
        <div className="replies-list">
          {comment.replies.map((reply) => (
            <CommentItem
              key={reply.id_commentaire}
              comment={reply}
              publicationId={publicationId}
              depth={depth + 1}
              onRefresh={onRefresh}
            />
          ))}
        </div>
      )}
    </div>
  );
}

/* ─────────────────────────────────────────────
   KIALO-STYLE Debate: reply item (recursive)
───────────────────────────────────────────── */
function KuiReplyItem({ comment, publicationId, side, depth = 0, onRefresh }) {
  const [showReactions, setShowReactions] = useState(false);
  const [showReplyForm, setShowReplyForm] = useState(false);
  const [replyText, setReplyText] = useState("");
  const [showReplies, setShowReplies] = useState(true);

  const totalReact = (comment.reactions || []).reduce((acc, r) => acc + (r.count || 0), 0);

  const react = async (type) => {
    try {
      await api.post("/publications/comment-react", {
        id_commentaire: comment.id_commentaire,
        type_reaction: type,
      });
      setShowReactions(false);
      onRefresh?.();
    } catch (e) {
      console.error(e);
    }
  };

  const reply = async (e) => {
    e.preventDefault();
    if (!replyText.trim()) return;
    try {
      await api.post("/publications/comment", {
        id_publication: publicationId,
        contenu: replyText,
        parent_id: comment.id_commentaire,
        debat_side: side,
      });
      setReplyText("");
      setShowReplyForm(false);
      setShowReplies(true);
      onRefresh?.();
    } catch (e2) {
      console.error(e2);
    }
  };

  return (
    <div className="kui-reply" style={{ marginLeft: depth ? `${Math.min(depth * 18, 54)}px` : 0 }}>
      <div className="kui-reply-card">
        <div className="kui-reply-head">
          <img
            className="kui-reply-avatar"
            src={comment.photo_user ? getMediaUrl(comment.photo_user) : "https://via.placeholder.com/28"}
            alt="av"
            onError={(e) => (e.target.src = "https://via.placeholder.com/28")}
          />
          <div className="kui-reply-meta">
            <strong>{[comment.nom_user, comment.prenom_user].filter(Boolean).join(" ")}</strong>
            <span>{formatDate(comment.created_at)}</span>
          </div>
        </div>

        <div className="kui-reply-text">{comment.contenu}</div>

        {totalReact > 0 && (
          <div className="kui-reply-badges">
            {(comment.reactions || [])
              .filter((r) => r.count > 0)
              .map((r) => (
                <span key={r.type} className="kui-badge">
                  {REACTIONS.find((x) => x.type === r.type)?.emoji} {r.count}
                </span>
              ))}
          </div>
        )}

        <div className="kui-reply-actions">
          <div
            className="kui-link"
            style={{ position: "relative" }}
            onMouseEnter={() => setShowReactions(true)}
            onMouseLeave={() => setShowReactions(false)}
          >
            {comment.userReaction
              ? `${REACTIONS.find((r) => r.type === comment.userReaction)?.emoji} ${
                  REACTIONS.find((r) => r.type === comment.userReaction)?.label
                }`
              : "👍 Réagir"}

            {showReactions && (
              <div className="kui-react-popup">
                {REACTIONS.map((r) => (
                  <button key={r.type} type="button" onClick={() => react(r.type)} title={r.label}>
                    {r.emoji}
                  </button>
                ))}
              </div>
            )}
          </div>

          <button className="kui-link" type="button" onClick={() => setShowReplyForm(!showReplyForm)}>
            💬 Répondre
          </button>

          {comment.replies?.length > 0 && (
            <button className="kui-link" type="button" onClick={() => setShowReplies(!showReplies)}>
              {showReplies ? "▲ Masquer" : `▼ ${comment.replies.length}`}
            </button>
          )}
        </div>

        {showReplyForm && (
          <form onSubmit={reply} className="kui-reply-form">
            <input
              value={replyText}
              onChange={(e) => setReplyText(e.target.value)}
              placeholder="Écrire une réponse..."
              autoFocus
            />
            <button type="submit" disabled={!replyText.trim()}>
              ↩
            </button>
          </form>
        )}

        {showReplies && comment.replies?.length > 0 && (
          <div className="kui-reply-children">
            {comment.replies.map((child) => (
              <KuiReplyItem
                key={child.id_commentaire}
                comment={child}
                publicationId={publicationId}
                side={side}
                depth={depth + 1}
                onRefresh={onRefresh}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────
   KIALO-STYLE Debate column (Pros/Cons)
───────────────────────────────────────────── */
function KuiColumn({ publicationId, side, onCountChange }) {
  const [tree, setTree] = useState([]);
  const [loading, setLoading] = useState(true);

  const [composerOpen, setComposerOpen] = useState(false);
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);

  const [selectedId, setSelectedId] = useState(null);
  const [showComments, setShowComments] = useState(true);

  const roots = useMemo(() => tree, [tree]);
  const totalArgs = useMemo(() => countTree(tree), [tree]);

  const load = async () => {
    try {
      setLoading(true);
      const res = await api.get(`/publications/${publicationId}/comments?side=${side}`);
      const t = buildTree(res.data || []);
      setTree(t);
      onCountChange?.(countTree(t));
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [publicationId, side]);

  useEffect(() => {
    // auto select first argument like Kialo feel
    if (!selectedId && roots.length > 0) setSelectedId(roots[0].id_commentaire);
  }, [roots, selectedId]);

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
      setText("");
      setComposerOpen(false);
      await load();
    } catch (e2) {
      console.error(e2);
    } finally {
      setSending(false);
    }
  };

  const selected = useMemo(
    () => roots.find((x) => x.id_commentaire === selectedId) || null,
    [roots, selectedId]
  );

  const title = side === "pour" ? "Pros" : "Cons";

  return (
    <div className={`kui-col ${side}`}>
      <div className="kui-col-head">
        <div className={`kui-col-title ${side}`}>{title}</div>
        <button
          type="button"
          className={`kui-plus ${side}`}
          onClick={() => setComposerOpen((s) => !s)}
          title="Ajouter"
        >
          +
        </button>
      </div>

      <div className="kui-col-sub">
        <span className="kui-pill">{totalArgs} {totalArgs === 1 ? "argument" : "arguments"}</span>
      </div>

      {composerOpen && (
        <form className="kui-compose" onSubmit={send}>
          <input
            className="kui-input"
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder={side === "pour" ? "Ajouter un pro..." : "Ajouter un con..."}
          />
          <button className={`kui-send ${side}`} type="submit" disabled={!text.trim() || sending}>
            {sending ? "..." : "Publier"}
          </button>
        </form>
      )}

      <div className="kui-col-body">
        <div className="kui-arg-list">
          {loading ? (
            <div className="kui-empty">Chargement...</div>
          ) : roots.length === 0 ? (
            <div className="kui-empty">Aucun argument</div>
          ) : (
            roots.map((arg) => {
              const isSelected = arg.id_commentaire === selectedId;
              return (
                <React.Fragment key={arg.id_commentaire}>
                  <div
                    className={`kui-arg-card ${side} ${isSelected ? "is-selected" : ""}`}
                    onClick={() => setSelectedId(arg.id_commentaire)}
                    role="button"
                    tabIndex={0}
                  >
                    <div className="kui-arg-head">
                      <img
                        className="kui-arg-avatar"
                        src={arg.photo_user ? getMediaUrl(arg.photo_user) : "https://via.placeholder.com/34"}
                        alt="av"
                        onError={(e) => (e.target.src = "https://via.placeholder.com/34")}
                      />
                      <div className="kui-arg-meta">
                        <strong>{[arg.nom_user, arg.prenom_user].filter(Boolean).join(" ")}</strong>
                        <span>{formatDate(arg.created_at)}</span>
                      </div>

                      <div className="kui-arg-icons" aria-hidden="true">
                        <span>⋯</span>
                        <span>💬</span>
                      </div>
                    </div>

                    <div className={`kui-meter ${side}`} aria-hidden="true">
                      <span />
                    </div>

                    <div className="kui-arg-text">{arg.contenu}</div>
                  </div>

                  {isSelected && (
                    <div className="kui-detail">
                      <div className="kui-toolbar">
                        <button type="button" className="kui-tbtn" title="Comments">💬</button>
                        <button type="button" className="kui-tbtn" title="Link">🔗</button>
                        <button type="button" className="kui-tbtn" title="Bookmark">🔖</button>
                        <button type="button" className="kui-tbtn" title="Stats">📊</button>
                        <div className="kui-toolbar-spacer" />
                        <button type="button" className="kui-tbtn" title="Close" onClick={() => setSelectedId(null)}>
                          ✕
                        </button>
                      </div>

                      <div className="kui-detail-controls">
                        <button type="button" className="kui-older" disabled>
                          Show Older
                        </button>

                        <label className="kui-check">
                          <input
                            type="checkbox"
                            checked={showComments}
                            onChange={(e) => setShowComments(e.target.checked)}
                          />
                          <span>Show Comments</span>
                        </label>
                      </div>

                      {showComments && (
                        <div className="kui-comments">
                          {arg.replies?.length ? (
                            arg.replies.map((rep) => (
                              <KuiReplyItem
                                key={rep.id_commentaire}
                                comment={rep}
                                publicationId={publicationId}
                                side={side}
                                onRefresh={load}
                              />
                            ))
                          ) : (
                            <div className="kui-empty kecil">No comments yet</div>
                          )}

                          {/* reply to selected argument */}
                          <form
                            className="kui-reply-root"
                            onSubmit={async (e) => {
                              e.preventDefault();
                              const input = e.currentTarget.elements.replyRoot;
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
                              } catch (er) {
                                console.error(er);
                              }
                            }}
                          >
                            <input name="replyRoot" placeholder="Write a comment..." />
                            <button type="submit">↩</button>
                          </form>
                        </div>
                      )}
                    </div>
                  )}
                </React.Fragment>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────
   Main PublicationCard
───────────────────────────────────────────── */
export default function PublicationCard({ publication, onUpdate, defaultShowComments = false }) {
  const navigate = useNavigate();  
  const [showComments, setShowComments] = useState(defaultShowComments);
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState("");
  const [showReactions, setShowReactions] = useState(false);
  const [loadingComments, setLoadingComments] = useState(false);
  const [imageModal, setImageModal] = useState(null);

  const [pourCount, setPourCount] = useState(publication.pour_comments_count || 0);
  const [contreCount, setContreCount] = useState(publication.contre_comments_count || 0);

  useEffect(() => {
    setPourCount(publication.pour_comments_count || 0);
    setContreCount(publication.contre_comments_count || 0);
  }, [publication.id_publication, publication.pour_comments_count, publication.contre_comments_count]);

  const totalReactions =
    (publication.likes || 0) +
    (publication.loves || 0) +
    (publication.hahas || 0) +
    (publication.wows || 0) +
    (publication.sads || 0) +
    (publication.angrys || 0);

  const loadComments = async () => {
    if (showComments) {
      setShowComments(false);
      return;
    }
    setLoadingComments(true);
    try {
      const res = await api.get(`/publications/${publication.id_publication}/comments`);
      setComments(buildTree(res.data || []));
      setShowComments(true);
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingComments(false);
    }
  };

  const refreshComments = async () => {
    try {
      const res = await api.get(`/publications/${publication.id_publication}/comments`);
      setComments(buildTree(res.data || []));
      onUpdate?.();
    } catch (e) {
      console.error(e);
    }
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
    } catch (e2) {
      console.error(e2);
    }
  };

  const handleReact = async (type) => {
    try {
      setShowReactions(false);
      await api.post("/publications/react", {
        id_publication: publication.id_publication,
        type_reaction: type,
      });
      onUpdate?.();
    } catch (e) {
      console.error(e);
    }
  };

  const totalComments =
    showComments && publication.type_publication !== "debat"
      ? countTree(comments)
      : publication.nb_commentaires || 0;

  const debateTotalArgs = pourCount + contreCount;

  return (
    <div className="publication-card">
      {/* HEADER */}
      <div className="pub-header">
        <img
          src={publication.photo_user ? getMediaUrl(publication.photo_user) : "https://via.placeholder.com/46"}
          alt="avatar"
          className="pub-avatar"
          onError={(e) => (e.target.src = "https://via.placeholder.com/46")}
        />
        <div className="pub-user-info">
  <strong 
    style={{cursor:'pointer', color: '#1c1e21'}}
    onClick={() => navigate(`/profile/${publication.user_id}`)}
    onMouseEnter={(e) => e.target.style.textDecoration = 'underline'}
    onMouseLeave={(e) => e.target.style.textDecoration = 'none'}
  >
    {[publication.nom_user, publication.prenom_user].filter(Boolean).join(" ") || "Utilisateur"}
  </strong>
  <span>{formatDate(publication.date_publication || publication.created_at)}</span>
</div>

        {publication.type_publication === "debat" && <span className="pub-badge badge-debat">⚖️ Débat</span>}
        {publication.type_publication === "photo" && <span className="pub-badge badge-photo">📷 Photo</span>}
        {publication.type_publication === "video" && <span className="pub-badge badge-video">🎥 Vidéo</span>}
        {publication.type_publication === "pdf" && <span className="pub-badge badge-pdf">📄 PDF</span>}
      </div>

      {/* CONTENT */}
      {publication.type_publication === "debat" ? (
        <div className="kui-wrap">
          <div className="kui-q-card">
            <div className="kui-q-head">
              <div className="kui-q-left">
                <img
                  className="kui-q-avatar"
                  src={publication.photo_user ? getMediaUrl(publication.photo_user) : "https://via.placeholder.com/36"}
                  alt="av"
                  onError={(e) => (e.target.src = "https://via.placeholder.com/36")}
                />
                <div className="kui-q-meta">
  <strong 
  style={{cursor:'pointer'}} 
  onClick={() => navigate(`/profile/${publication.user_id}`)}
>
  {publication.nom_user}
</strong>
</div>
              </div>

              <div className="kui-q-bluebar" aria-hidden="true">
                <span />
              </div>

              <div className="kui-q-right" aria-hidden="true">
                <span>⋯</span>
                <span>💬</span>
              </div>
            </div>

            <div className="kui-q-text">{publication.question_debat}</div>
          </div>

          <div className="kui-cols">
            <KuiColumn publicationId={publication.id_publication} side="pour" onCountChange={setPourCount} />
            <KuiColumn publicationId={publication.id_publication} side="contre" onCountChange={setContreCount} />
          </div>
        </div>
      ) : (
        <div className="pub-content">
          {publication.titre_publication && <h4 className="pub-title">{publication.titre_publication}</h4>}
          {publication.contenu && <p className="pub-text">{publication.contenu}</p>}

          {publication.medias?.length > 0 && (
            <div className={`pub-medias medias-${Math.min(publication.medias.length, 3)}`}>
              {publication.medias.map((media) => (
                <div key={media.id_media} className="media-item">
                  {media.type_media === "photo" && (
                    <img
                      src={getMediaUrl(media.url_media)}
                      alt="publication"
                      loading="lazy"
                      onClick={() => setImageModal(getMediaUrl(media.url_media))}
                      onError={(e) => (e.target.src = "https://via.placeholder.com/300")}
                    />
                  )}

                  {media.type_media === "video" && (
  <video 
    controls 
    preload="metadata"
    style={{ width: "100%", maxHeight: "500px", borderRadius: "12px" }}
    poster="https://via.placeholder.com/300x200/6b5ae0/ffffff?text=Vidéo"
  >
    <source src={getMediaUrl(media.url_media)} type={media.mimetype || "video/mp4"} />
    Votre navigateur ne supporte pas la vidéo.
  </video>
)}

{media.type_media === "pdf" && (
  <div style={{border: '1px solid #e0e0e0', borderRadius: '8px', overflow: 'hidden'}}>
    <div style={{background: '#f5f5f5', padding: '12px', display: 'flex', alignItems: 'center', gap: '10px'}}>
      <span>📄</span>
      <span style={{fontWeight: 'bold'}}>{media.nom_original || "Document PDF"}</span>
      <a 
        href={`https://docs.google.com/viewer?url=${encodeURIComponent(getMediaUrl(media.url_media))}&embedded=true`}
        target="_blank"
        rel="noopener noreferrer"
        style={{marginLeft: 'auto', background: '#667eea', color: 'white', padding: '6px 12px', borderRadius: '6px', textDecoration: 'none'}}
      >
        Voir le PDF ↗
      </a>
    </div>
  </div>
)}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* FOOTER */}
      <div className="pub-footer">
        <div className="pub-stats-bar">
          {totalReactions > 0 && (
            <span className="stat-reactions">
              {["like", "love", "haha", "wow", "sad", "angry"]
                .filter((t) => publication[`${t}s`] > 0)
                .slice(0, 3)
                .map((t) => REACTIONS.find((r) => r.type === t)?.emoji)
                .join("")}{" "}
              {totalReactions}
            </span>
          )}

          {publication.type_publication === "debat" ? (
            <span className="stat-comments" style={{ cursor: "default" }}>
              💬 {debateTotalArgs} argument{debateTotalArgs !== 1 ? "s" : ""}
            </span>
          ) : (
            <span className="stat-comments" onClick={loadComments} style={{ cursor: "pointer" }}>
              💬 {totalComments} commentaire{totalComments !== 1 ? "s" : ""}
            </span>
          )}
        </div>

        <div className="pub-actions-bar">
          <div
            className="pub-action-btn"
            onMouseEnter={() => setShowReactions(true)}
            onMouseLeave={() => setShowReactions(false)}
          >
            {publication.userReaction ? (
              <span className="reacted">
                {REACTIONS.find((r) => r.type === publication.userReaction)?.emoji}{" "}
                {REACTIONS.find((r) => r.type === publication.userReaction)?.label}
              </span>
            ) : (
              <span>👍 Réagir</span>
            )}

            {showReactions && (
              <div className="reactions-popup">
                {REACTIONS.map((r) => (
                  <button key={r.type} onClick={() => handleReact(r.type)} title={r.label} type="button">
                    {r.emoji}
                  </button>
                ))}
              </div>
            )}
          </div>

          {publication.type_publication !== "debat" && (
            <button className="pub-action-btn" onClick={loadComments} type="button">
              {loadingComments ? "⏳" : "💬"} {showComments ? "Masquer" : "Commenter"}
            </button>
          )}
        </div>
      </div>

      {/* COMMENTS (normal publications only) */}
      {showComments && publication.type_publication !== "debat" && (
        <div className="comments-section">
          <p className="comments-count">
            💬 {totalComments} commentaire{totalComments !== 1 ? "s" : ""}
          </p>

          <form onSubmit={handleComment} className="comment-root-form">
  <img 
    src={JSON.parse(localStorage.getItem("user"))?.photo_user 
      ? getMediaUrl(JSON.parse(localStorage.getItem("user")).photo_user)
      : "https://via.placeholder.com/36"} 
    alt="me" 
    className="comment-avatar"
    onError={(e) => (e.target.src = "https://via.placeholder.com/36")}
  />
  <div className="comment-input-wrap">
    <input
      type="text"
      placeholder="Écrire un commentaire..."
      value={newComment}
      onChange={(e) => setNewComment(e.target.value)}
    />
    <button type="submit" disabled={!newComment.trim()}>
      ➤
    </button>
  </div>
</form>

          <div className="comments-tree">
            {comments.length === 0 ? (
              <p className="no-comments">Aucun commentaire. Soyez le premier !</p>
            ) : (
              comments.map((c) => (
                <CommentItem
                  key={c.id_commentaire}
                  comment={c}
                  publicationId={publication.id_publication}
                  depth={0}
                  onRefresh={refreshComments}
                />
              ))
            )}
          </div>
        </div>
      )}

      {/* IMAGE MODAL */}
      {imageModal && (
        <div className="image-modal" onClick={() => setImageModal(null)}>
          <div className="image-modal-content" onClick={(e) => e.stopPropagation()}>
            <button className="modal-close" onClick={() => setImageModal(null)} type="button">
              ✕
            </button>
            <img src={imageModal} alt="full" />
          </div>
        </div>
      )}
    </div>
  );
}