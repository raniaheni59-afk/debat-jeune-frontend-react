import React, { useState, useCallback, useEffect, useRef } from "react";
import API from "../services/api";
import "./DebateBlock.css";

/* ── helpers ───────────────────────────────────────────── */
const getCurrentUser = () => {
  try { const u = localStorage.getItem("user"); return u ? JSON.parse(u) : null; }
  catch { return null; }
};

const avatar = (name) =>
  `https://ui-avatars.com/api/?name=${encodeURIComponent(name || "U")}&background=6b5ae0&color=fff&size=80&bold=true`;

const timeAgo = (d) => {
  if (!d) return "";
  const s = (Date.now() - new Date(d)) / 1000;
  if (s < 60)     return "À l'instant";
  if (s < 3600)   return `${Math.floor(s / 60)} min`;
  if (s < 86400)  return `${Math.floor(s / 3600)}h`;
  if (s < 604800) return `${Math.floor(s / 86400)}j`;
  return new Date(d).toLocaleDateString("fr-FR");
};

/* ── DebateComment — un argument + ses replies ─────────── */
function DebateComment({ comment, pubId, side, onRefresh }) {
  const [replyOpen,    setReplyOpen]    = useState(false);
  const [replyText,    setReplyText]    = useState("");
  const [replySending, setReplySending] = useState(false);
  const [showReplies,  setShowReplies]  = useState(false);
  const inputRef = useRef(null);
  const me = getCurrentUser();

  const isOwner = me && (
    String(me.id_user || me.id) === String(comment.id_user || comment.user_id)
    || me.role === "admin"
  );

  const sendReply = async () => {
    const t = replyText.trim();
    if (!t || replySending) return;
    setReplySending(true);
    setReplyText("");   // clear immediately
    setReplyOpen(false);
    try {
      await API.post(`/publications/${pubId}/comments`, {
        contenu_commentaire: t,
        contenu: t,
        parent_id: comment.id_commentaire,
        debat_side: side,
      });
      setShowReplies(true);
      await onRefresh();
    } catch (e) {
      console.error("reply error:", e?.response?.data || e.message);
      setReplyText(t);  // restore on error
      setReplyOpen(true);
    } finally {
      setReplySending(false);
    }
  };

  const deleteComment = async () => {
    if (!window.confirm("Supprimer cet argument ?")) return;
    try {
      await API.delete(`/publications/${pubId}/comments/${comment.id_commentaire}`);
      onRefresh();
    } catch (e) {
      console.error("delete error:", e?.response?.data || e.message);
    }
  };

  const replies = comment.replies || [];

  return (
    <div className={`db-arg db-arg-${side}`}>
      {/* Avatar + header */}
      <div className="db-arg-header">
        <img
          className="db-arg-ava"
          src={comment.photo_user || avatar(comment.prenom_user || "U")}
          alt=""
          onError={e => { e.target.src = avatar(comment.prenom_user || "U"); }}
        />
        <div className="db-arg-meta">
          <span className="db-arg-name">{comment.prenom_user} {comment.nom_user}</span>
          <span className="db-arg-time">{timeAgo(comment.created_at)}</span>
        </div>
        {isOwner && (
          <button className="db-arg-del" onClick={deleteComment} title="Supprimer">✕</button>
        )}
      </div>

      {/* Contenu */}
      <p className="db-arg-text">{comment.contenu_commentaire || comment.contenu}</p>

      {/* Actions */}
      <div className="db-arg-actions">
        <button
          className="db-arg-reply-btn"
          onClick={() => {
            setReplyOpen(o => !o);
            if (!replyOpen) setTimeout(() => inputRef.current?.focus(), 100);
          }}
        >
          💬 Répondre
        </button>
        {replies.length > 0 && (
          <button
            className="db-arg-toggle-btn"
            onClick={() => setShowReplies(o => !o)}
          >
            {showReplies ? "▲ Masquer" : `▼ ${replies.length} réponse${replies.length > 1 ? "s" : ""}`}
          </button>
        )}
      </div>

      {/* Zone de réponse — inline comme commentaire normal */}
      {replyOpen && (
        <div className="db-reply-wrap">
          <img
            className="db-reply-ava"
            src={me?.photo_user || avatar(me?.prenom_user || "Moi")}
            alt=""
            onError={e => { e.target.src = avatar(me?.prenom_user || "Moi"); }}
          />
          <div className="db-reply-box">
            <input
              ref={inputRef}
              className="db-reply-inp"
              placeholder={`Répondre à ${comment.prenom_user}…`}
              value={replyText}
              onChange={e => setReplyText(e.target.value)}
              onKeyDown={e => {
                if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendReply(); }
                if (e.key === "Escape") setReplyOpen(false);
              }}
            />
            <div className="db-reply-btns">
              <button
                className="db-reply-cancel"
                onClick={() => { setReplyOpen(false); setReplyText(""); }}
              >Annuler</button>
              <button
                className="db-reply-send"
                onClick={sendReply}
                disabled={!replyText.trim() || replySending}
              >
                {replySending ? "…" : "Envoyer"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Replies imbriquées */}
      {showReplies && replies.length > 0 && (
        <div className="db-replies">
          {replies.map(r => (
            <div key={r.id_commentaire} className="db-nested">
              <div className="db-nest-line" />
              <div className="db-nested-content">
                <img
                  className="db-arg-ava small"
                  src={r.photo_user || avatar(r.prenom_user || "U")}
                  alt=""
                  onError={e => { e.target.src = avatar(r.prenom_user || "U"); }}
                />
                <div className="db-nested-bubble">
                  <span className="db-arg-name">{r.prenom_user} {r.nom_user}</span>
                  <p className="db-arg-text">{r.contenu_commentaire || r.contenu}</p>
                  <span className="db-arg-time">{timeAgo(r.created_at)}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/* ── DebateSide — colonne POUR ou CONTRE ───────────────── */
function DebateSide({ side, label, icon, pubId, comments, onRefresh, accentClass }) {
  const [text,    setText]    = useState("");
  const [sending, setSending] = useState(false);
  const me = getCurrentUser();

  const submit = async () => {
    const t = text.trim();
    if (!t || sending) return;
    setSending(true);
    setText(""); // clear immediately (optimistic)
    try {
      await API.post(`/publications/${pubId}/comments`, {
        contenu_commentaire: t,
        contenu: t,
        debat_side: side,
      });
      await onRefresh();
    } catch (e) {
      console.error("debate comment error:", e?.response?.data || e.message);
      setText(t); // restore on error
    } finally {
      setSending(false);
    }
  };

  return (
    <div className={`db-side ${accentClass}`}>
      <div className="db-side-header">
        <span className="db-side-icon">{icon}</span>
        <span className="db-side-label">{label}</span>
        <span className="db-side-count">{comments.length} arg.</span>
      </div>

      {/* Input */}
      <div className="db-input-wrap">
        <textarea
          className="db-input"
          placeholder={`Ajouter un argument ${label}…`}
          value={text}
          onChange={e => setText(e.target.value)}
          rows={2}
          onKeyDown={e => {
            if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); submit(); }
          }}
        />
        <button
          className={`db-submit ${accentClass}`}
          onClick={submit}
          disabled={!text.trim() || sending}
        >
          {sending ? "…" : "Publier"}
        </button>
      </div>

      {/* Arguments */}
      <div className="db-args-list">
        {comments.length === 0 ? (
          <p className="db-empty">Soyez le premier à argumenter {label} !</p>
        ) : (
          comments.map(c => (
            <DebateComment
              key={c.id_commentaire}
              comment={c}
              pubId={pubId}
              side={side}
              onRefresh={onRefresh}
            />
          ))
        )}
      </div>
    </div>
  );
}

/* ── DebateBlock — composant principal ─────────────────── */
export default function DebateBlock({ publication }) {
  const pub   = publication;
  const pubId = pub.id_publication;

  const [pourCount,    setPourCount]    = useState(pub.pour_count   || 0);
  const [contreCount,  setContreCount]  = useState(pub.contre_count || 0);
  const [userVote,     setUserVote]     = useState(pub.userVote     || null);
  const [pourCmts,     setPourCmts]     = useState([]);
  const [contreCmts,   setContreCmts]  = useState([]);
  const [loading,      setLoading]      = useState(true);
  const me = getCurrentUser();

  const loadComments = useCallback(async () => {
    try {
      const res = await API.get(`/publications/${pubId}/comments`);
      const all = Array.isArray(res.data) ? res.data : [];
      setPourCmts(all.filter(c => c.debat_side === "pour"));
      setContreCmts(all.filter(c => c.debat_side === "contre"));
    } catch (e) {
      console.error("load debate comments:", e?.response?.data || e.message);
    } finally {
      setLoading(false);
    }
    // explicit return so callers can await it
    return Promise.resolve();
  }, [pubId]);

  useEffect(() => { loadComments(); }, [loadComments]);

  const vote = async (pos) => {
    const same = userVote === pos;
    const prevVote = userVote;
    const prevPour = pourCount;
    const prevContre = contreCount;

    // optimistic
    setUserVote(same ? null : pos);
    if (pos === "pour") {
      setPourCount(n => same ? n - 1 : n + 1);
      if (!same && prevVote === "contre") setContreCount(n => n - 1);
    } else {
      setContreCount(n => same ? n - 1 : n + 1);
      if (!same && prevVote === "pour") setPourCount(n => n - 1);
    }

    try {
      await API.post(`/publications/${pubId}/vote`, { position: pos });
    } catch {
      setUserVote(prevVote);
      setPourCount(prevPour);
      setContreCount(prevContre);
    }
  };

  const total = pourCount + contreCount;
  const pourPct   = total ? Math.round((pourCount   / total) * 100) : 50;
  const contrePct = total ? Math.round((contreCount / total) * 100) : 50;

  return (
    <div className="db-block">
      {/* Question */}
      <div className="db-question-wrap">
        <span className="db-badge">⚖️ QUESTION P/C</span>
        <h3 className="db-question">{pub.question_debat || pub.titre_publication}</h3>
        {(pub.contenu_publication || pub.contenu) && (
          <p className="db-desc">{pub.contenu_publication || pub.contenu}</p>
        )}
      </div>

      {/* Barre de votes */}
      <div className="db-vote-bar-wrap">
        <span className="db-vote-label pour">POUR {pourPct}%</span>
        <div className="db-vote-bar">
          <div className="db-vote-fill pour" style={{ width: `${pourPct}%` }} />
        </div>
        <span className="db-vote-label contre">CONTRE {contrePct}%</span>
      </div>

      {/* Boutons vote */}
      <div className="db-vote-btns">
        <button
          className={`db-vote-btn pour${userVote === "pour" ? " active" : ""}`}
          onClick={() => vote("pour")}
        >
          ✅ POUR · {pourCount}
        </button>
        <button
          className={`db-vote-btn contre${userVote === "contre" ? " active" : ""}`}
          onClick={() => vote("contre")}
        >
          ❌ CONTRE · {contreCount}
        </button>
      </div>

      {/* Les deux colonnes */}
      {loading ? (
        <div className="db-loading">Chargement des arguments…</div>
      ) : (
        <div className="db-columns">
          <DebateSide
            side="pour"
            label="POUR"
            icon="✅"
            pubId={pubId}
            comments={pourCmts}
            onRefresh={loadComments}
            accentClass="pour"
          />
          <DebateSide
            side="contre"
            label="CONTRE"
            icon="❌"
            pubId={pubId}
            comments={contreCmts}
            onRefresh={loadComments}
            accentClass="contre"
          />
        </div>
      )}
    </div>
  );
}