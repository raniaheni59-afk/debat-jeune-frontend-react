<<<<<<< HEAD
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
=======
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
>>>>>>> 7ad9b6fb5d8413d2b7460a3024d4bcb3de574fb1
];

const getMediaUrl = (url) => {
  if (!url) return "";
  if (url.startsWith("http")) return url;
<<<<<<< HEAD
  const baseURL = api?.defaults?.baseURL || "";
  const cleanBase = baseURL.replace(/\/api\/?$/, "");
  const cleanUrl = url.replace(/^\//, "");
  return `${cleanBase}/${cleanUrl}`;
=======
  const base = (api?.defaults?.baseURL || "").replace(/\/api\/?$/, "");
  return `${base}/${url.replace(/^\//, "")}`;
>>>>>>> 7ad9b6fb5d8413d2b7460a3024d4bcb3de574fb1
};

const formatDate = (d) => {
  if (!d) return "";
<<<<<<< HEAD
  return new Date(d).toLocaleDateString("fr-FR", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
=======
  const date = new Date(d);
  const now = new Date();
  const diff = Math.floor((now - date) / 1000);
  if (diff < 60) return "À l'instant";
  if (diff < 3600) return `Il y a ${Math.floor(diff / 60)} min`;
  if (diff < 86400) return `Il y a ${Math.floor(diff / 3600)} h`;
  if (diff < 604800) return `Il y a ${Math.floor(diff / 86400)} j`;
  return date.toLocaleDateString("fr-FR", { day: "2-digit", month: "short", year: "numeric" });
>>>>>>> 7ad9b6fb5d8413d2b7460a3024d4bcb3de574fb1
};

const buildTree = (flat = []) => {
  const map = {};
<<<<<<< HEAD
  flat.forEach((c) => (map[c.id_commentaire] = { ...c, replies: [] }));
  const roots = [];
  flat.forEach((c) => {
=======
  flat.forEach(c => (map[c.id_commentaire] = { ...c, replies: [] }));
  const roots = [];
  flat.forEach(c => {
>>>>>>> 7ad9b6fb5d8413d2b7460a3024d4bcb3de574fb1
    if (c.parent_id && map[c.parent_id]) map[c.parent_id].replies.push(map[c.id_commentaire]);
    else roots.push(map[c.id_commentaire]);
  });
  return roots;
};

const countTree = (list = []) =>
  list.reduce((acc, item) => acc + 1 + countTree(item.replies || []), 0);

<<<<<<< HEAD
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
=======
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
>>>>>>> 7ad9b6fb5d8413d2b7460a3024d4bcb3de574fb1
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
<<<<<<< HEAD
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
=======
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
>>>>>>> 7ad9b6fb5d8413d2b7460a3024d4bcb3de574fb1
              </button>
            )}
          </div>

          {showReplyForm && (
<<<<<<< HEAD
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
=======
            <form onSubmit={handleReply} className="pc-reply-form">
              <input
                autoFocus
                placeholder={`Répondre à ${comment.prenom_user || ""}…`}
                value={replyText}
                onChange={e => setReplyText(e.target.value)}
              />
              <button type="submit" disabled={!replyText.trim()}>↩</button>
>>>>>>> 7ad9b6fb5d8413d2b7460a3024d4bcb3de574fb1
            </form>
          )}
        </div>
      </div>

      {showReplies && comment.replies?.length > 0 && (
<<<<<<< HEAD
        <div className="replies-list">
          {comment.replies.map((reply) => (
            <CommentItem
              key={reply.id_commentaire}
              comment={reply}
              publicationId={publicationId}
              depth={depth + 1}
              onRefresh={onRefresh}
            />
=======
        <div className="pc-replies">
          {comment.replies.map(r => (
            <CommentItem key={r.id_commentaire} comment={r} publicationId={publicationId}
              depth={depth + 1} onRefresh={onRefresh} />
>>>>>>> 7ad9b6fb5d8413d2b7460a3024d4bcb3de574fb1
          ))}
        </div>
      )}
    </div>
  );
}

<<<<<<< HEAD
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
=======
/* ── Debat Column ── */
function DebatColumn({ publicationId, side, onCountChange }) {
  const [tree, setTree] = useState([]);
  const [loading, setLoading] = useState(true);
  const [composerOpen, setComposerOpen] = useState(false);
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);
  const [selectedId, setSelectedId] = useState(null);

  const isPour = side === "pour";
>>>>>>> 7ad9b6fb5d8413d2b7460a3024d4bcb3de574fb1

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
=======
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
>>>>>>> 7ad9b6fb5d8413d2b7460a3024d4bcb3de574fb1
          </button>
        </form>
      )}

<<<<<<< HEAD
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
=======
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
>>>>>>> 7ad9b6fb5d8413d2b7460a3024d4bcb3de574fb1
      </div>
    </div>
  );
}

<<<<<<< HEAD
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
=======
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
>>>>>>> 7ad9b6fb5d8413d2b7460a3024d4bcb3de574fb1
    setLoadingComments(true);
    try {
      const res = await api.get(`/publications/${publication.id_publication}/comments`);
      setComments(buildTree(res.data || []));
      setShowComments(true);
<<<<<<< HEAD
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingComments(false);
    }
=======
    } catch (e) { console.error(e); }
    finally { setLoadingComments(false); }
>>>>>>> 7ad9b6fb5d8413d2b7460a3024d4bcb3de574fb1
  };

  const refreshComments = async () => {
    try {
      const res = await api.get(`/publications/${publication.id_publication}/comments`);
      setComments(buildTree(res.data || []));
      onUpdate?.();
<<<<<<< HEAD
    } catch (e) {
      console.error(e);
    }
=======
    } catch (e) { console.error(e); }
>>>>>>> 7ad9b6fb5d8413d2b7460a3024d4bcb3de574fb1
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
<<<<<<< HEAD
    } catch (e2) {
      console.error(e2);
    }
=======
    } catch (e) { console.error(e); }
>>>>>>> 7ad9b6fb5d8413d2b7460a3024d4bcb3de574fb1
  };

  const handleReact = async (type) => {
    try {
<<<<<<< HEAD
      setShowReactions(false);
=======
      setShowPicker(false);
>>>>>>> 7ad9b6fb5d8413d2b7460a3024d4bcb3de574fb1
      await api.post("/publications/react", {
        id_publication: publication.id_publication,
        type_reaction: type,
      });
      onUpdate?.();
<<<<<<< HEAD
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
=======
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
>>>>>>> 7ad9b6fb5d8413d2b7460a3024d4bcb3de574fb1
      </div>

      {/* CONTENT */}
      {publication.type_publication === "debat" ? (
<<<<<<< HEAD
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
=======
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
>>>>>>> 7ad9b6fb5d8413d2b7460a3024d4bcb3de574fb1
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* FOOTER */}
<<<<<<< HEAD
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
=======
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
>>>>>>> 7ad9b6fb5d8413d2b7460a3024d4bcb3de574fb1
              ))
            )}
          </div>
        </div>
      )}

      {/* IMAGE MODAL */}
      {imageModal && (
<<<<<<< HEAD
        <div className="image-modal" onClick={() => setImageModal(null)}>
          <div className="image-modal-content" onClick={(e) => e.stopPropagation()}>
            <button className="modal-close" onClick={() => setImageModal(null)} type="button">
              ✕
            </button>
=======
        <div className="pc-modal" onClick={() => setImageModal(null)}>
          <div className="pc-modal-content" onClick={e => e.stopPropagation()}>
            <button className="pc-modal-close" onClick={() => setImageModal(null)}>✕</button>
>>>>>>> 7ad9b6fb5d8413d2b7460a3024d4bcb3de574fb1
            <img src={imageModal} alt="full" />
          </div>
        </div>
      )}
    </div>
  );
}