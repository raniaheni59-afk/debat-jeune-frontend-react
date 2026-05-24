import React, { useState, useEffect, useRef } from "react";
import API from "../services/api";
import "./DebateBlock.css";

/* ── helpers ─────────────────────────────────────── */
const COLORS = ["#6b4fbb","#8b6fd4","#a29bfe","#6c5ce7","#9b59b6","#b388ff"];
const avatarColor = (name = "") => COLORS[(name?.charCodeAt(0) || 0) % COLORS.length];

const fmtDate = (d) => {
  if (!d) return "";
  const s = (Date.now() - new Date(d)) / 1000;
  if (s < 60)    return "À l'instant";
  if (s < 3600)  return `${Math.floor(s / 60)} min`;
  if (s < 86400) return `${Math.floor(s / 3600)}h`;
  return new Date(d).toLocaleDateString("fr-FR");
};

const getCurrentUser = () => {
  try { const u = localStorage.getItem("user"); return u ? JSON.parse(u) : null; }
  catch { return null; }
};

/* ── CommentCard — manages its own replies state ── */
const CommentCard = ({ comment: initialComment, side, debateId, onRefresh, currentUser }) => {
  /* Keep a local copy of the comment so replies update immediately */
  const [comment, setComment] = useState(initialComment);
  const [showReply, setShowReply] = useState(false);
  const [replyText, setReplyText] = useState("");
  const [sending,   setSending]   = useState(false);
  const inputRef = useRef(null);

  /* Sync if parent refreshes with new data */
  useEffect(() => { setComment(initialComment); }, [initialComment]);

  /* Focus input when reply form opens */
  useEffect(() => {
    if (showReply) setTimeout(() => inputRef.current?.focus(), 50);
  }, [showReply]);

  const isOwner = currentUser && (
    currentUser.id_user === comment.id_user ||
    currentUser.id      === comment.id_user ||
    currentUser.id_user === comment.user_id  ||
    currentUser.id      === comment.user_id  ||
    currentUser.role    === "admin"
  );

  const handleDelete = async () => {
    if (!window.confirm("Supprimer cet argument ?")) return;
    try {
      await API.delete(`/publications/${debateId}/comments/${comment.id_commentaire}`);
      onRefresh();
    } catch (e) { console.error("delete:", e?.response?.data || e.message); }
  };

  const handleSendReply = async () => {
    const t = replyText.trim();
    if (!t || sending) return;
    setSending(true);

    /* 1 — Optimistic: add reply immediately to local state */
    const user = currentUser || {};
    const optimistic = {
      id_commentaire     : `tmp-${Date.now()}`,
      contenu_commentaire: t,
      contenu            : t,
      prenom_user        : user.prenom_user || user.prenom || user.name || "Moi",
      nom_user           : user.nom_user || user.nom || "",
      created_at         : new Date().toISOString(),
      debat_side         : side,
      parent_id          : comment.id_commentaire,
    };

    setComment(prev => ({
      ...prev,
      replies: [...(prev.replies || []), optimistic],
    }));
    setReplyText("");
    setShowReply(false);

    /* 2 — Send to API */
    try {
      await API.post(`/publications/${debateId}/comments`, {
        contenu_commentaire: t,
        contenu            : t,
        debat_side         : side,
        parent_id          : comment.id_commentaire,
      });
      /* 3 — Refresh to get real IDs */
      onRefresh();
    } catch (e) {
      console.error("reply error:", e?.response?.data || e.message);
      /* rollback optimistic reply */
      setComment(prev => ({
        ...prev,
        replies: (prev.replies || []).filter(r => r.id_commentaire !== optimistic.id_commentaire),
      }));
      setReplyText(t);
      setShowReply(true);
    } finally {
      setSending(false);
    }
  };

  return (
    <div className={`db-comment-card ${side}-card`}>
      {isOwner && (
        <button className="db-delete-btn" onClick={handleDelete} title="Supprimer" type="button">✕</button>
      )}

      <div className="db-cmt-header">
        <div className="db-avatar" style={{ background: avatarColor(comment.prenom_user || comment.nom_user) }}>
          {(comment.prenom_user?.[0] || comment.nom_user?.[0] || "U").toUpperCase()}
        </div>
        <div className="db-user-info">
          <strong>{comment.prenom_user} {comment.nom_user}</strong>
          <span className="db-time">{fmtDate(comment.created_at)}</span>
        </div>
      </div>

      <p className="db-cmt-content">{comment.contenu_commentaire || comment.contenu}</p>

      {/* ── Reply trigger ── */}
      <button
        className="db-reply-trigger"
        type="button"
        onClick={() => setShowReply(v => !v)}
      >
        💬 Répondre
      </button>

      {/* ── Reply form ── */}
      {showReply && (
        <div className="db-reply-form">
          <input
            ref={inputRef}
            type="text"
            value={replyText}
            onChange={e => setReplyText(e.target.value)}
            onKeyDown={e => { if (e.key === "Enter") { e.preventDefault(); handleSendReply(); } }}
            placeholder={`Répondre à ${comment.prenom_user || ""}…`}
          />
          <div className="db-reply-btns">
            <button
              className="db-reply-cancel"
              type="button"
              onClick={() => { setShowReply(false); setReplyText(""); }}
            >
              Annuler
            </button>
            <button
              className="db-reply-send"
              type="button"
              onClick={handleSendReply}
              disabled={!replyText.trim() || sending}
            >
              {sending ? "…" : "Envoyer"}
            </button>
          </div>
        </div>
      )}

      {/* ── Nested replies ── */}
      {comment.replies?.length > 0 && (
        <div className="db-replies-list">
          {comment.replies.map(r => (
            <div key={r.id_commentaire} className="db-reply-item">
              <div className="db-reply-avatar" style={{ background: avatarColor(r.prenom_user || r.nom_user) }}>
                {(r.prenom_user?.[0] || r.nom_user?.[0] || "U").toUpperCase()}
              </div>
              <div className="db-reply-body">
                <strong>{r.prenom_user} {r.nom_user}</strong>
                <span className="db-reply-time"> · {fmtDate(r.created_at)}</span>
                <p>{r.contenu_commentaire || r.contenu}</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

/* ── Main DebateBlock ── */
const DebateBlock = ({ publication }) => {
  const debateId    = publication?.id_publication;
  const currentUser = getCurrentUser();

  const [comments,      setComments]      = useState([]);
  const [loading,       setLoading]       = useState(true);
  const [pourText,      setPourText]      = useState("");
  const [contreText,    setContreText]    = useState("");
  const [pourSending,   setPourSending]   = useState(false);
  const [contreSending, setContreSending] = useState(false);

  const fetchData = async () => {
    try {
      const res  = await API.get(`/publications/${debateId}/comments`);
      const flat = Array.isArray(res.data) ? res.data : [];
      const top  = flat.filter(c => !c.parent_id);
      setComments(
        top.map(c => ({
          ...c,
          replies: flat
            .filter(r => String(r.parent_id) === String(c.id_commentaire))
            .map(r => ({ ...r, debat_side: r.debat_side || c.debat_side })),
        }))
      );
    } catch (err) {
      console.error("Erreur débat:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { if (debateId) fetchData(); }, [debateId]);

  const handleSend = async (side) => {
    const text = side === "pour" ? pourText : contreText;
    if (!text.trim()) return;
    side === "pour" ? setPourSending(true) : setContreSending(true);
    try {
      await API.post(`/publications/${debateId}/comments`, {
        contenu_commentaire: text.trim(),
        contenu            : text.trim(),
        debat_side         : side,
        parent_id          : null,
      });
      side === "pour" ? setPourText("") : setContreText("");
      await fetchData();
    } catch (e) {
      console.error("send:", e?.response?.data || e.message);
    } finally {
      side === "pour" ? setPourSending(false) : setContreSending(false);
    }
  };

  const pourComments   = comments.filter(c => c.debat_side === "pour");
  const contreComments = comments.filter(c => c.debat_side === "contre");

  if (loading) return (
    <div className="db-loading">
      <div className="db-spinner" />
      <span>Chargement du débat…</span>
    </div>
  );

  const renderSide = (side, list, text, setText, sending) => (
    <div className={`db-side db-${side}`}>
      <div className={`db-side-header db-${side}-header`}>
        <span>{side === "pour" ? "✅ POUR" : "❌ CONTRE"}</span>
        <span className="db-side-count">{list.length} arg.</span>
      </div>

      <div className="db-add-area">
        <textarea
          placeholder={`Ajouter un argument ${side === "pour" ? "POUR" : "CONTRE"}…`}
          value={text}
          onChange={e => setText(e.target.value)}
        />
        <div className="db-add-footer">
          <button
            className={`db-publish-btn db-${side}-btn`}
            type="button"
            onClick={() => handleSend(side)}
            disabled={!text.trim() || sending}
          >
            {sending ? "…" : "Publier"}
          </button>
        </div>
      </div>

      <div className="db-comments-list">
        {list.length === 0
          ? <div className="db-empty">
              Soyez le premier à argumenter {side === "pour" ? "POUR" : "CONTRE"} !
            </div>
          : list.map(c => (
              <CommentCard
                key={c.id_commentaire}
                comment={c}
                side={side}
                debateId={debateId}
                onRefresh={fetchData}
                currentUser={currentUser}
              />
            ))
        }
      </div>
    </div>
  );

  return (
    <div className="db-wrapper">
      <div className="db-header">
        <span className="db-badge">⚖️ QUESTION P/C</span>
        <h2 className="db-question">{publication?.question_debat || "Débat"}</h2>
      </div>

      {comments.length > 0 && (
        <div className="db-score-bar">
          <span className="db-score-pour">POUR {pourComments.length}</span>
          <div className="db-score-track">
            <div
              className="db-score-fill"
              style={{ width: `${Math.round((pourComments.length / comments.length) * 100)}%` }}
            />
          </div>
          <span className="db-score-contre">CONTRE {contreComments.length}</span>
        </div>
      )}

      <div className="db-columns">
        {renderSide("pour",   pourComments,   pourText,   setPourText,   pourSending)}
        {renderSide("contre", contreComments, contreText, setContreText, contreSending)}
      </div>
    </div>
  );
};

export default DebateBlock;