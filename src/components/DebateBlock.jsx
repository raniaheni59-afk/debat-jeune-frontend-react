import React, { useState, useEffect } from "react";
import axios from "axios";
import API from "../services/api"; 
import "./DebateBlock.css";

// ─── Helpers ─────────────────────────────────
const COLORS = ["#6b4fbb", "#8b6fd4", "#a29bfe", "#6c5ce7", "#9b59b6", "#b388ff"];
const avatarColor = (name = "") =>
  COLORS[(name?.charCodeAt(0) || 0) % COLORS.length];

const fmtDate = (d) => new Date(d).toLocaleDateString("fr-FR");

const EMOJIS = [
  { emoji: "👏", key: "applause" },
  { emoji: "🔥", key: "fire" },
  { emoji: "💡", key: "idea" },
  { emoji: "😮", key: "wow" },
];

const DebateBlock = ({ debateId }) => {
  const [comments, setComments] = useState([]);
  const [stats, setStats] = useState({ follower_count: 0, comment_count: 0 });
  const [isFollowing, setIsFollowing] = useState(false);
  const [loading, setLoading] = useState(true);
  
  // NOUVEAU ✅
  const [debate, setDebate] = useState(null); // question_debat

  const [replyingTo, setReplyingTo] = useState(null);
  const [replyText, setReplyText] = useState("");
  const [pourComment, setPourComment] = useState("");
  const [contreComment, setContreComment] = useState("");

  // token
  const token = localStorage.getItem("token");
  const headers = token ? { Authorization: `Bearer ${token}` } : {};

  // ─── Fetch débat + commentaires + stats ─────────────────────────────
  const fetchData = async () => {
    try {
      // ✅ FETCH QUESTION DEBAT
      const pubRes = await axios.get(
        `http://localhost:5000/api/publications/${debateId}`,
        { headers }
      );
      setDebate(pubRes.data);

      // ✅ FETCH COMMENTS
      const commRes = await axios.get(
        `http://localhost:5000/api/debats/${debateId}/comments`,
        { headers }
      );
      const flat = commRes.data;

      // regrouper replies
      setComments(
        flat
          .filter((c) => c.parent_id === null)
          .map((c) => ({
            ...c,
            replies: flat.filter((r) => r.parent_id === c.id_comment),
          }))
      );

      // ✅ FETCH STATS
      const statsRes = await axios.get(
        `http://localhost:5000/api/debats/${debateId}/stats`
      );
      setStats(statsRes.data);

      // ✅ FOLLOW STATE
      try {
        const followRes = await axios.get(
          `http://localhost:5000/api/debats/${debateId}/follow-status`,
          { headers }
        );
        setIsFollowing(followRes.data.isFollowing);
      } catch {
        setIsFollowing(false);
      }
    } catch (err) {
      console.error("Erreur chargement débat:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [debateId]);

  // ─── FOLLOW / UNFOLLOW ─────────────────────────────────────────────
  const handleFollowToggle = async () => {
    try {
      if (isFollowing) {
        await axios.post(
          "http://localhost:5000/api/debats/unfollow",
          { id_debat: debateId },
          { headers }
        );
        setStats((s) => ({ ...s, follower_count: s.follower_count - 1 }));
      } else {
        await axios.post(
          "http://localhost:5000/api/debats/follow",
          { id_debat: debateId },
          { headers }
        );
        setStats((s) => ({ ...s, follower_count: s.follower_count + 1 }));
      }
      setIsFollowing((v) => !v);
    } catch {
      alert("Connectez-vous pour suivre ce débat !");
    }
  };

  // ─── ENVOI POUR/CONTRE ─────────────────────────────────────────────
  const handleSendComment = async (side) => {
    const contenu = side === "pour" ? pourComment : contreComment;
    if (!contenu.trim()) return;

    try {
      await axios.post(
        "http://localhost:5000/api/debats/comment",
        {
          id_debat: debateId,
          side,
          contenu,
          parent_id: null,
        },
        { headers }
      );

      if (side === "pour") setPourComment("");
      else setContreComment("");

      await fetchData();
    } catch {
      alert("Connectez-vous pour commenter !");
    }
  };

  // ─── REPLY ─────────────────────────────────────────────
  const handleReply = async () => {
    if (!replyText.trim() || !replyingTo) return;

    try {
      await axios.post(
        "http://localhost:5000/api/debats/comment",
        {
          id_debat: debateId,
          side: replyingTo.side,
          contenu: replyText,
          parent_id: replyingTo.id,
        },
        { headers }
      );

      setReplyText("");
      setReplyingTo(null);

      await fetchData();
    } catch {
      alert("Erreur réponse");
    }
  };

  // ─── REACTIONS ─────────────────────────────────────────────
  const handleReaction = async (commentId, type) => {
    try {
      await axios.post(
        "http://localhost:5000/api/debats/react",
        { id_comment: commentId, type },
        { headers }
      );

      const modify = (c) => {
        if (c.id_comment !== commentId) return c;

        const same = c.userReaction === type;

        return {
          ...c,
          likes:
            type === "like"
              ? same
                ? c.likes - 1
                : c.likes + 1
              : c.userReaction === "like"
              ? c.likes - 1
              : c.likes,
          dislikes:
            type === "dislike"
              ? same
                ? c.dislikes - 1
                : c.dislikes + 1
              : c.userReaction === "dislike"
              ? c.dislikes - 1
              : c.dislikes,
          userReaction: same ? null : type,
        };
      };

      setComments((prev) =>
        prev.map((c) => ({
          ...modify(c),
          replies: c.replies?.map(modify) || [],
        }))
      );
    } catch (err) {
      console.error(err);
    }
  };

  // ─── EMOJI ─────────────────────────────────────────────
  const handleEmoji = (commentId, emojiKey) => {
  setComments(prev =>
    prev.map(c => {
      if (c.id_comment !== commentId) return c;

      const same = c.userEmojiReaction === emojiKey;
      const old  = c.userEmojiReaction;
      const em   = c.emojiReactions || {};

      return {
        ...c,
        userEmojiReaction: same ? null : emojiKey,
        emojiReactions: {
          ...em,

          // ❌ إنقاص القديمة إذا بدّل emoji
          ...(old && !same
            ? { [old]: Math.max((em[old] || 1) - 1, 0) }
            : {}),

          // ✅ زيادة / إنقاص الجديدة
          [emojiKey]: same
            ? Math.max((em[emojiKey] || 1) - 1, 0)
            : (em[emojiKey] || 0) + 1,
        },
      };
    })
  );
};

  // ─── RENDER COMMENT ─────────────────────────────────────────────
  const renderComment = (comment, side) => (
    <div key={comment.id_comment} className={`comment-card ${side}-card`}>
      <div className="comment-header">
        <div
          className="avatar"
          style={{ background: avatarColor(comment.nom_user) }}
        >
          {(comment.nom_user?.[0] || "U").toUpperCase()}
        </div>
        <div className="user-info">
          <strong>{comment.nom_user}</strong>
          <span className="time">{fmtDate(comment.created_at)}</span>
        </div>
      </div>

      <p className="comment-content">{comment.contenu}</p>

      <div className="comment-actions">
        <button
          className={comment.userReaction === "like" ? "active-like" : ""}
          onClick={() => handleReaction(comment.id_comment, "like")}
        >
          👍 {comment.likes || 0}
        </button>

        <button
          className={comment.userReaction === "dislike" ? "active-dislike" : ""}
          onClick={() => handleReaction(comment.id_comment, "dislike")}
        >
          👎 {comment.dislikes || 0}
        </button>

        {EMOJIS.map(({ emoji, key }) => {
          const count = comment.emojiReactions?.[key] || 0;
          const active = comment.userEmojiReaction === key;
          return (
            <button
              key={key}
              className={`emoji-btn ${active ? "active" : ""}`}
              onClick={() => handleEmoji(comment.id_comment, key)}
            >
              {emoji}
              {count > 0 && <span className="emoji-count">{count}</span>}
            </button>
          );
        })}

        <button
          className="reply-btn"
          onClick={() =>
            setReplyingTo(
              replyingTo?.id === comment.id_comment
                ? null
                : { id: comment.id_comment, side }
            )
          }
        >
          💬 Répondre
        </button>
      </div>

      {replyingTo?.id === comment.id_comment && (
        <div className="reply-form">
          <input
            type="text"
            value={replyText}
            onChange={(e) => setReplyText(e.target.value)}
            autoFocus
            placeholder={`Répondre à ${comment.nom_user}...`}
          />
          <div className="reply-form-btns">
            <button
              className="reply-cancel"
              onClick={() => {
                setReplyingTo(null);
                setReplyText("");
              }}
            >
              Annuler
            </button>
            <button className="reply-send" onClick={handleReply}>
              Envoyer
            </button>
          </div>
        </div>
      )}

      {comment.replies?.length > 0 && (
        <div className="replies-list">
          {comment.replies.map((r) => (
            <div key={r.id_comment} className="reply-item">
              <div
                className="reply-avatar"
                style={{ background: avatarColor(r.nom_user) }}
              >
                {(r.nom_user?.[0] || "U").toUpperCase()}
              </div>
              <div className="reply-body">
                <strong>{r.nom_user}</strong>
                <span>{r.contenu}</span>
                <div className="reply-actions">
                  <button onClick={() => handleReaction(r.id_comment, "like")}>
                    👍 {r.likes || 0}
                  </button>
                  <button
                    onClick={() => handleReaction(r.id_comment, "dislike")}
                  >
                    👎 {r.dislikes || 0}
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );

  // ─── SEPARATION POUR / CONTRE ─────────────────────────────────────────────
  const pourComments = comments.filter((c) => c.side === "pour");
  const contreComments = comments.filter((c) => c.side === "contre");

  if (loading)
    return (
      <div className="debate-loading">
        <div className="debate-spinner" />
        <span>Chargement du débat...</span>
      </div>
    );

  // ─── RETURN ─────────────────────────────────────────────
  return (
    <div className="debate-wrapper">
      <div className="debate-header-card">
        <div className="debate-info">
          <span className="debate-badge">DÉBAT ACTIF</span>

          {/* ✅ AFFICHAGE DE LA QUESTION DEBAT */}
          <h2>{debate?.question_debat || "Débat"}</h2>

          <div className="debate-meta">
            <span>💬 {stats.comment_count} commentaires</span>
            <span>👥 {stats.follower_count} followers</span>
            <span>✅ {pourComments.length} Pour</span>
            <span>❌ {contreComments.length} Contre</span>
          </div>
        </div>

        <button
          className={`follow-btn ${isFollowing ? "following" : ""}`}
          onClick={handleFollowToggle}
        >
          {isFollowing ? "✓ Suivi" : "+ Suivre"}
        </button>
      </div>

      <div className="debate-columns">
        {/* POUR */}
        <div className="debate-side">
          <div className="side-header pour-header">
            <span>✅ POUR</span>
            <span className="side-count">{pourComments.length} arguments</span>
          </div>

          <div className="add-comment-area">
            <textarea
              placeholder="Ajouter un argument POUR..."
              value={pourComment}
              onChange={(e) => setPourComment(e.target.value)}
            />
            <div className="add-footer">
              <button
                className="publish-btn pour-btn"
                onClick={() => handleSendComment("pour")}
                disabled={!pourComment.trim()}
              >
                Publier
              </button>
            </div>
          </div>

          <div className="comments-list">
            {pourComments.length === 0 ? (
              <div className="empty-state">
                Soyez le premier à argumenter POUR !
              </div>
            ) : (
              pourComments.map((c) => renderComment(c, "pour"))
            )}
          </div>
        </div>

        {/* CONTRE */}
        <div className="debate-side">
          <div className="side-header contre-header">
            <span>❌ CONTRE</span>
            <span className="side-count">
              {contreComments.length} arguments
            </span>
          </div>

          <div className="add-comment-area">
            <textarea
              placeholder="Ajouter un argument CONTRE..."
              value={contreComment}
              onChange={(e) => setContreComment(e.target.value)}
            />
            <div className="add-footer">
              <button
                className="publish-btn contre-btn"
                onClick={() => handleSendComment("contre")}
                disabled={!contreComment.trim()}
              >
                Publier
              </button>
            </div>
          </div>

          <div className="comments-list">
            {contreComments.length === 0 ? (
              <div className="empty-state">
                Soyez le premier à argumenter CONTRE !
              </div>
            ) : (
              contreComments.map((c) => renderComment(c, "contre"))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default DebateBlock;