import { useEffect, useRef, useState, useCallback } from "react";
import { io } from "socket.io-client";
import API from "../services/api";
import "./AdminContact.css";

// ─────────────────────────────────────────────────────────────
// CONSTANTS
// ─────────────────────────────────────────────────────────────
const BACKEND = "https://debat-jeune-production.up.railway.app";
const AVATAR_COLORS = [
  "#7c5cbf", "#3b82f6", "#22c55e", "#f59e0b",
  "#ef4444", "#ec4899", "#06b6d4", "#8b5cf6",
];

// ─────────────────────────────────────────────────────────────
// UTILS
// ─────────────────────────────────────────────────────────────
const getInitials = (prenom = "", nom = "") =>
  ((prenom[0] || "") + (nom[0] || "")).toUpperCase() || "?";

const getColor = (id) => AVATAR_COLORS[(Number(id) || 0) % AVATAR_COLORS.length];

const formatTime = (dateStr) => {
  if (!dateStr) return "";
  const d = new Date(dateStr);
  const diff = Date.now() - d;
  if (diff < 60_000) return "À l'instant";
  if (diff < 3_600_000) return `${Math.floor(diff / 60_000)}min`;
  if (diff < 86_400_000) return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  return d.toLocaleDateString("fr-FR", { day: "2-digit", month: "short" });
};

const sortByPrefix = (list, query) => {
  if (!query) return list;
  const q = query.trim().toLowerCase();
  return [...list].sort((a, b) => {
    const af = `${a.prenom_user} ${a.nom_user}`.toLowerCase();
    const bf = `${b.prenom_user} ${b.nom_user}`.toLowerCase();
    const as = af.startsWith(q) || (a.prenom_user || "").toLowerCase().startsWith(q) || (a.nom_user || "").toLowerCase().startsWith(q);
    const bs = bf.startsWith(q) || (b.prenom_user || "").toLowerCase().startsWith(q) || (b.nom_user || "").toLowerCase().startsWith(q);
    if (as && !bs) return -1;
    if (!as && bs) return 1;
    return af.localeCompare(bf);
  });
};

const fileUrl = (url) =>
  !url ? null : url.startsWith("http") ? url : `${BACKEND}${url}`;

// ─────────────────────────────────────────────────────────────
// SUB-COMPONENTS
// ─────────────────────────────────────────────────────────────
function Avatar({ prenom, nom, id, size = 42 }) {
  return (
    <div style={{
      width: size, height: size, borderRadius: "50%", flexShrink: 0,
      background: getColor(id),
      display: "flex", alignItems: "center", justifyContent: "center",
      color: "#fff", fontWeight: 700,
      fontSize: Math.round(size * 0.36),
      userSelect: "none",
    }}>
      {getInitials(prenom, nom)}
    </div>
  );
}

function FileMessage({ msg, isMe }) {
  if (!msg.file_url) return null;
  const url = fileUrl(msg.file_url);
  if (msg.msg_type === "image") {
    return (
      <a href={url} target="_blank" rel="noreferrer">
        <img
          src={url} alt="image"
          style={{ maxWidth: 240, maxHeight: 200, borderRadius: 12, display: "block", marginTop: msg.text ? 8 : 0, objectFit: "cover" }}
        />
      </a>
    );
  }
  if (msg.msg_type === "video") {
    return (
      <video controls style={{ maxWidth: 240, borderRadius: 12, marginTop: msg.text ? 8 : 0, display: "block" }}>
        <source src={url} />
        Votre navigateur ne supporte pas la vidéo.
      </video>
    );
  }
  // pdf / other
  return (
    <a href={url} target="_blank" rel="noreferrer" style={{
      display: "inline-flex", alignItems: "center", gap: 8,
      marginTop: msg.text ? 6 : 0, padding: "9px 14px", borderRadius: 10,
      fontSize: 13, fontWeight: 600, textDecoration: "none",
      background: isMe ? "rgba(255,255,255,0.18)" : "#f0ecff",
      color: isMe ? "#fff" : "#7c5cbf",
      border: isMe ? "1px solid rgba(255,255,255,0.25)" : "1px solid #ddd6fe",
    }}>
      <span style={{ fontSize: 18 }}>{msg.msg_type === "pdf" ? "📄" : "📎"}</span>
      {msg.msg_type === "pdf" ? "Ouvrir PDF" : "Télécharger"}
    </a>
  );
}

// ─────────────────────────────────────────────────────────────
// MAIN COMPONENT
// ─────────────────────────────────────────────────────────────
export default function AdminContact() {
  // ── State ────────────────────────────────────────────────────
  const [conversations, setConversations]   = useState([]);
  const [selected, setSelected]             = useState(null);
  const [messages, setMessages]             = useState([]);
  const [groupMessages, setGroupMessages]   = useState([]);
  const [query, setQuery]                   = useState("");
  const [searchResults, setSearchResults]   = useState([]);
  const [searching, setSearching]           = useState(false);
  const [text, setText]                     = useState("");
  const [filePreview, setFilePreview]       = useState(null);
  const [loadingMsgs, setLoadingMsgs]       = useState(false);
  const [sending, setSending]               = useState(false);

  // ── Refs ─────────────────────────────────────────────────────
  const bottomRef    = useRef(null);
  const socketRef    = useRef(null);
  const searchTimer  = useRef(null);
  const selectedRef  = useRef(null);
  const fileInputRef = useRef(null);

  // ✅ FIX: myId calculé UNE seule fois hors du render map — Number() évite bug string/int
  const currentUser = JSON.parse(localStorage.getItem("user") || "{}");
  const myId = Number(currentUser.id_user);

  // ── Socket setup ─────────────────────────────────────────────
  useEffect(() => {
    const token = localStorage.getItem("token");
    const socket = io(BACKEND, { auth: { token }, transports: ["websocket"] });
    socketRef.current = socket;

    socket.on("connect", () => console.log("✅ Socket connected"));
    socket.on("connect_error", (e) => console.error("❌ Socket error:", e.message));

    socket.on("newMessage", (msg) => {
      // ✅ FIX: Number() comparison
      if (
        selectedRef.current &&
        selectedRef.current !== "group" &&
        Number(msg.conversation_id) === Number(selectedRef.current.id)
      ) {
        setMessages((prev) =>
          prev.find((m) => Number(m.id) === Number(msg.id)) ? prev : [...prev, msg]
        );
      }
      setConversations((prev) =>
        prev
          .map((c) =>
            Number(c.id) === Number(msg.conversation_id)
              ? { ...c, last_message: msg.text || `[${msg.msg_type || "fichier"}]`, last_time: msg.created_at }
              : c
          )
          .sort((a, b) => new Date(b.last_time || 0) - new Date(a.last_time || 0))
      );
    });

    socket.on("newGroupMessage", (msg) => {
      setGroupMessages((prev) =>
        prev.find((m) => Number(m.id) === Number(msg.id)) ? prev : [...prev, msg]
      );
    });

    socket.emit("joinGroup");

    return () => socket.disconnect();
  }, []);

  useEffect(() => { selectedRef.current = selected; }, [selected]);

  // ── Fetch conversations ──────────────────────────────────────
  const fetchConversations = useCallback(async () => {
    try {
      const res = await API.get("/messenger/conversations");
      setConversations(Array.isArray(res.data) ? res.data : []);
    } catch (err) { console.error("conversations:", err); }
  }, []);

  useEffect(() => { fetchConversations(); }, [fetchConversations]);

  // ── Fetch group messages ─────────────────────────────────────
  useEffect(() => {
    API.get("/messenger/group/messages")
      .then((res) => setGroupMessages(Array.isArray(res.data) ? res.data : []))
      .catch(console.error);
  }, []);

  // ── Search ───────────────────────────────────────────────────
  useEffect(() => {
    clearTimeout(searchTimer.current);
    if (!query.trim()) { setSearchResults([]); setSearching(false); return; }
    setSearching(true);
    searchTimer.current = setTimeout(async () => {
      try {
        const res = await API.get(`/messenger/users/search?q=${encodeURIComponent(query.trim())}`);
        setSearchResults(sortByPrefix(Array.isArray(res.data) ? res.data : [], query));
      } catch { setSearchResults([]); }
      finally { setSearching(false); }
    }, 350);
    return () => clearTimeout(searchTimer.current);
  }, [query]);

  // ── Open/select conversation ─────────────────────────────────
  const openConversation = async (targetId, userInfo) => {
    setQuery(""); setSearchResults([]);
    try {
      const res = await API.post("/messenger/conversation", { targetId });
      const conv = {
        ...res.data,
        nom_user: userInfo.nom_user,
        prenom_user: userInfo.prenom_user,
        id_user: userInfo.id_user || targetId,
        role: userInfo.role,
      };
      setSelected(conv);
      setConversations((prev) => {
        const exists = prev.find((c) => c.id === conv.id);
        return exists
          ? prev.map((c) => (c.id === conv.id ? { ...c, ...conv } : c))
          : [conv, ...prev];
      });
    } catch (err) { console.error("openConversation:", err); }
  };

  const selectConv = (conv) => {
    setSelected(conv);
    setQuery(""); setSearchResults([]); setFilePreview(null);
  };

  // ── Load messages when conversation changes ──────────────────
  useEffect(() => {
    if (!selected || selected === "group") return;
    setMessages([]);
    const load = async () => {
      setLoadingMsgs(true);
      try {
        const res = await API.get(`/messenger/messages/${selected.id}`);
        setMessages(Array.isArray(res.data) ? res.data : []);
        socketRef.current?.emit("joinConversation", { conversationId: selected.id });
      } catch (err) { console.error("loadMessages:", err); }
      finally { setLoadingMsgs(false); }
    };
    load();
  }, [selected?.id]);

  // ── Auto-scroll ──────────────────────────────────────────────
  useEffect(() => {
    requestAnimationFrame(() =>
      bottomRef.current?.scrollIntoView({ behavior: "smooth" })
    );
  }, [messages, groupMessages, selected]);

  // ── Send message ─────────────────────────────────────────────
  const send = async () => {
    if ((!text.trim() && !filePreview) || !selected || sending) return;
    const msgText = text.trim();
    const file = filePreview;
    setText(""); setFilePreview(null);
    setSending(true);
    try {
      if (selected === "group") {
        if (file) {
          const fd = new FormData();
          fd.append("file", file);
          if (msgText) fd.append("text", msgText);
          await API.post("/messenger/group/messages/upload", fd);
        } else {
          await API.post("/messenger/group/messages", { text: msgText });
        }
      } else {
        if (file) {
          const fd = new FormData();
          fd.append("file", file);
          fd.append("conversationId", String(selected.id));
          if (msgText) fd.append("text", msgText);
          await API.post("/messenger/messages/upload", fd);
        } else {
          await API.post("/messenger/messages", {
            conversationId: selected.id,
            text: msgText,
          });
        }
      }
    } catch (err) {
      console.error("send:", err);
      // Restore text on error
      if (msgText) setText(msgText);
    } finally {
      setSending(false);
    }
  };

  // ── Derived state ────────────────────────────────────────────
  const isGroup      = selected === "group";
  const isSearchMode = !!query.trim();
  const displayList  = isSearchMode ? searchResults : conversations;
  const activeMessages = isGroup ? groupMessages : messages;
  const canSend = (text.trim() || filePreview) && !sending;

  // ─────────────────────────────────────────────────────────────
  // RENDER
  // ─────────────────────────────────────────────────────────────
  return (
    <div className="admin-contact">

      {/* ═══════════════ SIDEBAR ═══════════════ */}
      <aside className="contacts-panel">

        {/* Header */}
        <div style={{ padding: "18px 16px 12px", borderBottom: "1px solid #ede9ff", flexShrink: 0 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 14 }}>
            <div style={{
              width: 34, height: 34, borderRadius: 10,
              background: "linear-gradient(135deg,#7c5cbf,#5a3fa0)",
              display: "flex", alignItems: "center", justifyContent: "center",
              color: "#fff", fontSize: 16,
            }}>💬</div>
            <span style={{ fontSize: 16, fontWeight: 700, color: "#1a1a2e" }}>Messages</span>
          </div>
          {/* Search input */}
          <div style={{ position: "relative" }}>
            <svg style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", opacity: 0.4 }} width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#7c5cbf" strokeWidth="2.5"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>
            <input
              type="text"
              placeholder="Rechercher un utilisateur..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              style={{
                width: "100%", padding: "9px 32px 9px 32px",
                borderRadius: 10, border: "1.5px solid #e0daff",
                background: "#f5f2ff", color: "#1a1a2e",
                fontSize: 13, outline: "none", boxSizing: "border-box",
                fontFamily: "inherit", transition: "border-color 0.2s",
              }}
              onFocus={(e) => (e.target.style.borderColor = "#a78bfa")}
              onBlur={(e) => (e.target.style.borderColor = "#e0daff")}
            />
            {searching && (
              <div style={{
                position: "absolute", right: 10, top: "50%", transform: "translateY(-50%)",
                width: 14, height: 14, borderRadius: "50%",
                border: "2px solid #d0c9f5", borderTopColor: "#7c5cbf",
                animation: "spin 0.7s linear infinite",
              }} />
            )}
            {query && !searching && (
              <button onClick={() => setQuery("")} style={{
                position: "absolute", right: 10, top: "50%", transform: "translateY(-50%)",
                background: "none", border: "none", cursor: "pointer",
                color: "#9e97c0", fontSize: 14, padding: 0, lineHeight: 1,
              }}>✕</button>
            )}
          </div>
        </div>

        {/* List */}
        <div className="chat-list">

          {/* Groupe — toujours visible hors search */}
          {!isSearchMode && (
            <>
              <div className="section-label">Groupe</div>
              <div
                className={`group-item ${isGroup ? "active" : ""}`}
                onClick={() => { setSelected("group"); setFilePreview(null); }}
              >
                <div className="group-avatar">S</div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: 600, fontSize: 13.5, color: "#1a1a2e" }}>Swafy Group</div>
                  <div style={{ fontSize: 12, color: "#9e97c0", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                    {groupMessages.length > 0
                      ? (groupMessages[groupMessages.length - 1].text || "[fichier]")
                      : "Canal général — tous les membres"}
                  </div>
                </div>
                <span style={{
                  fontSize: 9, fontWeight: 700, background: "#ede9ff",
                  color: "#7c5cbf", padding: "2px 7px", borderRadius: 6, flexShrink: 0,
                }}>GROUPE</span>
              </div>
            </>
          )}

          {/* Section labels */}
          {!isSearchMode && conversations.length > 0 && (
            <div className="section-label">Conversations ({conversations.length})</div>
          )}
          {!isSearchMode && conversations.length === 0 && (
            <div style={{ padding: "16px", textAlign: "center", color: "#b0a9d4", fontSize: 12 }}>
              Aucune conversation
            </div>
          )}
          {isSearchMode && (
            <div className="section-label">
              {searching ? "Recherche…" : searchResults.length > 0 ? `${searchResults.length} résultat(s)` : "Aucun résultat"}
            </div>
          )}

          {/* Items */}
          {displayList.map((item) => {
            const targetId = item.id_user;
            const isActive = !isGroup && (
              selected?.id === item.id || selected?.id_user === targetId
            );
            return (
              <div
                key={item.id || item.id_user}
                className={`chat-item ${isActive ? "active" : ""}`}
                onClick={() => isSearchMode ? openConversation(targetId, item) : selectConv(item)}
              >
                <Avatar prenom={item.prenom_user} nom={item.nom_user} id={targetId} size={42} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
                    <span style={{
                      fontWeight: 600, fontSize: 13.5, color: "#1a1a2e",
                      whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", maxWidth: 130,
                    }}>
                      {item.prenom_user} {item.nom_user}
                    </span>
                    {item.last_time && (
                      <span style={{ fontSize: 10, color: "#b0a9d4", flexShrink: 0, marginLeft: 6 }}>
                        {formatTime(item.last_time)}
                      </span>
                    )}
                  </div>
                  <p style={{ fontSize: 12, color: "#9e97c0", margin: 0, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                    {isSearchMode
                      ? (item.role === "admin" ? "👑 Admin" : "👤 Membre")
                      : (item.last_message || "Nouvelle conversation")}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </aside>

      {/* ═══════════════ CHAT WINDOW ═══════════════ */}
      <main className="chat-window">
        {!selected ? (

          /* Empty state */
          <div style={{
            flex: 1, display: "flex", flexDirection: "column",
            alignItems: "center", justifyContent: "center",
            gap: 14, background: "#f7f8fc",
          }}>
            <div style={{
              width: 80, height: 80, borderRadius: 24,
              background: "linear-gradient(135deg,#ede9ff,#d0c9f5)",
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: 36,
            }}>💬</div>
            <div style={{ textAlign: "center" }}>
              <p style={{ fontSize: 16, fontWeight: 700, color: "#1a1a2e", margin: "0 0 6px" }}>Swafy Messages</p>
              <p style={{ fontSize: 13, color: "#9e97c0", margin: 0 }}>Choisissez une conversation ou rejoignez le groupe</p>
            </div>
          </div>

        ) : (
          <>
            {/* ── Chat Header ── */}
            <div style={{
              padding: "14px 20px", display: "flex", alignItems: "center", gap: 12,
              background: "#fff", borderBottom: "1px solid #ede9ff", flexShrink: 0,
              boxShadow: "0 1px 6px rgba(0,0,0,0.05)",
            }}>
              {isGroup ? (
                <div className="group-avatar" style={{ width: 42, height: 42, fontSize: 16 }}>S</div>
              ) : (
                <Avatar prenom={selected.prenom_user} nom={selected.nom_user} id={selected.id_user} size={42} />
              )}
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 700, fontSize: 14.5, color: "#1a1a2e" }}>
                  {isGroup ? "Swafy Group" : `${selected.prenom_user} ${selected.nom_user}`}
                </div>
                <div style={{ fontSize: 11, color: "#22c55e", display: "flex", alignItems: "center", gap: 5, marginTop: 2 }}>
                  <span style={{ width: 7, height: 7, borderRadius: "50%", background: "#22c55e", display: "inline-block" }} />
                  {isGroup ? "Canal général" : "En ligne"}
                </div>
              </div>
            </div>

            {/* ── Messages area ── */}
            <div style={{
              flex: 1, overflowY: "auto", padding: "16px 20px",
              display: "flex", flexDirection: "column", gap: 6,
              background: "#f7f8fc",
            }}>
              {loadingMsgs ? (
                <div style={{ margin: "auto", color: "#9e97c0", fontSize: 13 }}>
                  <div style={{ width: 28, height: 28, borderRadius: "50%", border: "3px solid #e0daff", borderTopColor: "#7c5cbf", animation: "spin 0.7s linear infinite", margin: "0 auto 10px" }} />
                  Chargement…
                </div>
              ) : activeMessages.length === 0 ? (
                <div style={{ margin: "auto", color: "#9e97c0", fontSize: 13, textAlign: "center" }}>
                  <div style={{ fontSize: 40, marginBottom: 10 }}>🌟</div>
                  <div style={{ fontWeight: 600, color: "#6b6b8a", marginBottom: 4 }}>Démarrez la conversation</div>
                  <div style={{ fontSize: 12 }}>Soyez le premier à écrire !</div>
                </div>
              ) : (
                activeMessages.map((m) => {
                  // ✅ FIX PRINCIPAL: myId défini AVANT, Number() des deux côtés
                  const isMe = Number(m.sender_id) === myId;
                  return (
                    <div
                      key={m.id}
                      style={{
                        // ✅ moi → droite / autre → gauche
                        alignSelf: isMe ? "flex-end" : "flex-start",
                        maxWidth: "72%",
                        display: "flex",
                        flexDirection: "column",
                        gap: 3,
                        animation: "fadeUp 0.18s ease",
                      }}
                    >
                      {/* Nom + avatar dans le group (seulement pour les autres) */}
                      {isGroup && !isMe && (
                        <div style={{ display: "flex", alignItems: "center", gap: 6, paddingLeft: 4, marginBottom: 2 }}>
                          <Avatar prenom={m.prenom_user} nom={m.nom_user} id={m.sender_id} size={20} />
                          <span style={{ fontSize: 11, color: "#7c5cbf", fontWeight: 700 }}>
                            {m.prenom_user} {m.nom_user}
                          </span>
                        </div>
                      )}

                      {/* Bubble */}
                      <div style={{
                        background: isMe ? "linear-gradient(135deg,#7c5cbf,#5a3fa0)" : "#ffffff",
                        color: isMe ? "#ffffff" : "#1a1a2e",
                        padding: "10px 14px",
                        borderRadius: isMe ? "18px 18px 4px 18px" : "18px 18px 18px 4px",
                        fontSize: 13.5, lineHeight: 1.55,
                        boxShadow: isMe
                          ? "0 4px 14px rgba(90,63,160,0.28)"
                          : "0 1px 4px rgba(0,0,0,0.07)",
                        border: isMe ? "none" : "1px solid #ede9ff",
                        wordBreak: "break-word",
                      }}>
                        {m.text && <div>{m.text}</div>}
                        <FileMessage msg={m} isMe={isMe} />
                      </div>

                      {/* Timestamp */}
                      <span style={{
                        fontSize: 10, color: "#9e97c0",
                        textAlign: isMe ? "right" : "left",
                        paddingInline: 4,
                      }}>
                        {formatTime(m.created_at)}
                      </span>
                    </div>
                  );
                })
              )}
              <div ref={bottomRef} />
            </div>

            {/* ── File preview bar ── */}
            {filePreview && (
              <div className="file-preview-bar">
                <span style={{ fontSize: 16 }}>
                  {filePreview.type.startsWith("image/") ? "🖼️"
                    : filePreview.type.startsWith("video/") ? "🎬"
                    : "📄"}
                </span>
                <span style={{ flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  {filePreview.name}
                </span>
                <span style={{ color: "#9e97c0", fontSize: 11 }}>
                  {(filePreview.size / 1024).toFixed(0)} Ko
                </span>
                <button
                  onClick={() => setFilePreview(null)}
                  style={{ background: "none", border: "none", cursor: "pointer", color: "#ef4444", fontSize: 18, padding: "0 4px", lineHeight: 1 }}
                >✕</button>
              </div>
            )}

            {/* ── Input bar ── */}
            <div style={{
              padding: "10px 14px", borderTop: "1px solid #ede9ff",
              display: "flex", alignItems: "flex-end", gap: 8,
              background: "#fff", flexShrink: 0,
            }}>
              {/* Attach button */}
              <button
                onClick={() => fileInputRef.current?.click()}
                title="Joindre image / vidéo / PDF"
                style={{
                  width: 40, height: 40, borderRadius: 11,
                  border: "1.5px solid #e0daff", background: "#f5f2ff",
                  cursor: "pointer", fontSize: 18,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  flexShrink: 0, transition: "background 0.15s",
                }}
                onMouseEnter={(e) => (e.currentTarget.style.background = "#ede9ff")}
                onMouseLeave={(e) => (e.currentTarget.style.background = "#f5f2ff")}
              >📎</button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*,video/*,application/pdf"
                style={{ display: "none" }}
                onChange={(e) => {
                  setFilePreview(e.target.files[0] || null);
                  e.target.value = "";
                }}
              />

              {/* Textarea */}
              <textarea
                placeholder="Écrire un message…"
                value={text}
                onChange={(e) => {
                  setText(e.target.value);
                  // auto-resize
                  e.target.style.height = "40px";
                  e.target.style.height = Math.min(e.target.scrollHeight, 120) + "px";
                }}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(); }
                }}
                style={{
                  flex: 1, padding: "10px 14px",
                  borderRadius: 12, border: "1.5px solid #e0daff",
                  background: "#f5f2ff", color: "#1a1a2e",
                  fontSize: 13.5, outline: "none", resize: "none",
                  fontFamily: "inherit", caretColor: "#7c5cbf",
                  height: 40, maxHeight: 120, overflowY: "auto",
                  lineHeight: 1.5, transition: "border-color 0.2s",
                }}
                onFocus={(e) => (e.target.style.borderColor = "#a78bfa")}
                onBlur={(e) => (e.target.style.borderColor = "#e0daff")}
              />

              {/* Send button */}
              <button
                onClick={send}
                disabled={!canSend}
                style={{
                  width: 42, height: 42, borderRadius: 12, border: "none",
                  background: canSend
                    ? "linear-gradient(135deg,#7c5cbf,#5a3fa0)"
                    : "#e8e3ff",
                  color: canSend ? "#fff" : "#c4bde8",
                  cursor: canSend ? "pointer" : "default",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  flexShrink: 0,
                  boxShadow: canSend ? "0 4px 14px rgba(90,63,160,0.35)" : "none",
                  transition: "all 0.2s",
                }}
              >
                {sending ? (
                  <div style={{ width: 16, height: 16, borderRadius: "50%", border: "2px solid rgba(255,255,255,0.4)", borderTopColor: "#fff", animation: "spin 0.7s linear infinite" }} />
                ) : (
                  <svg viewBox="0 0 24 24" fill="none" width="18" height="18">
                    <path d="M22 2L11 13M22 2L15 22L11 13M22 2L2 9L11 13" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                )}
              </button>
            </div>
          </>
        )}
      </main>

      {/* Spin animation */}
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}