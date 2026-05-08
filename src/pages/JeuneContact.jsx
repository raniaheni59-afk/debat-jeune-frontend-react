import { useEffect, useRef, useState, useCallback } from "react";
import { io } from "socket.io-client";
import API from "../services/api";
import "./AdminContact.css";

const BACKEND = "https://debat-jeune-production.up.railway.app";
const AVATAR_COLORS = ["#6d56c1", "#2563eb", "#059669", "#d97706", "#dc2626", "#7c3aed"];

const getInitials = (prenom, nom) =>
  ((prenom?.[0] || "") + (nom?.[0] || "")).toUpperCase() || "?";
const getColor = (id) => AVATAR_COLORS[(id || 0) % AVATAR_COLORS.length];
const formatTime = (d) => {
  if (!d) return "";
  const dt = new Date(d), now = new Date(), diff = now - dt;
  if (diff < 60000) return "À l'instant";
  if (diff < 3600000) return `${Math.floor(diff / 60000)}min`;
  if (diff < 86400000) return dt.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  return dt.toLocaleDateString("fr-FR", { day: "2-digit", month: "short" });
};

function Avatar({ user, size = 42 }) {
  if (user?.photo_user) {
    return <img src={user.photo_user} alt="" style={{ width: size, height: size, borderRadius: "50%", objectFit: "cover", flexShrink: 0 }} />;
  }
  return (
    <div style={{
      width: size, height: size, borderRadius: "50%", flexShrink: 0,
      background: getColor(user?.id_user),
      display: "flex", alignItems: "center", justifyContent: "center",
      color: "#fff", fontWeight: 700, fontSize: size * 0.35,
    }}>
      {getInitials(user?.prenom_user, user?.nom_user)}
    </div>
  );
}

function FileMessage({ msg, isMe }) {
  if (!msg.file_url) return null;
  if (msg.msg_type === "image") {
    return <a href={msg.file_url} target="_blank" rel="noreferrer"><img src={msg.file_url} alt="" style={{ maxWidth: 200, borderRadius: 10, display: "block", marginTop: msg.text ? 6 : 0 }} /></a>;
  }
  if (msg.msg_type === "video") {
    return <video controls style={{ maxWidth: 200, borderRadius: 10, marginTop: msg.text ? 6 : 0 }}><source src={msg.file_url} /></video>;
  }
  return (
    <a href={msg.file_url} target="_blank" rel="noreferrer" style={{
      display: "inline-flex", alignItems: "center", gap: 6, marginTop: msg.text ? 6 : 0,
      padding: "7px 12px", borderRadius: 8, fontSize: 13, textDecoration: "none",
      background: isMe ? "rgba(255,255,255,0.18)" : "rgba(109,86,193,0.1)",
      color: isMe ? "#fff" : "#6d56c1",
    }}>
      📄 {msg.msg_type === "pdf" ? "PDF" : "Fichier"}
    </a>
  );
}

export default function JeuneContact() {
  const [conversations, setConversations] = useState([]);
  const [admins, setAdmins] = useState([]);
  const [selected, setSelected] = useState(null); // conv | "group" | null
  const [messages, setMessages] = useState([]);
  const [groupMessages, setGroupMessages] = useState([]);
  const [query, setQuery] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const [text, setText] = useState("");
  const [filePreview, setFilePreview] = useState(null);
  const [loadingMsgs, setLoadingMsgs] = useState(false);
  const bottomRef = useRef(null);
  const socketRef = useRef(null);
  const searchTimer = useRef(null);
  const selectedRef = useRef(null);
  const fileInputRef = useRef(null);
  const currentUser = JSON.parse(localStorage.getItem("user") || "{}");

  // ── Socket ──────────────────────────────────────────────────────────────────
  useEffect(() => {
    const token = localStorage.getItem("token");
    socketRef.current = io(BACKEND, { auth: { token }, transports: ["websocket"] });

    socketRef.current.on("newMessage", (msg) => {
  if (selectedRef.current !== "group" && selectedRef.current?.id === msg.conversation_id) {
    setMessages(prev => prev.find(m => m.id === msg.id) ? prev : [...prev, msg]);
  }
      setConversations(prev =>
        prev.map(c => c.id === msg.conversation_id
          ? { ...c, last_message: msg.text || `[${msg.msg_type}]`, last_time: msg.created_at }
          : c
        ).sort((a, b) => new Date(b.last_time) - new Date(a.last_time))
      );
    });

    socketRef.current.on("newGroupMessage", (msg) => {
      setGroupMessages(prev => prev.find(m => m.id === msg.id) ? prev : [...prev, msg]);
    });

    socketRef.current.emit("joinGroup");
    return () => socketRef.current?.disconnect();
  }, []);

  useEffect(() => { selectedRef.current = selected; }, [selected]);

  // ── Fetch data ──────────────────────────────────────────────────────────────
  const fetchConversations = useCallback(async () => {
    try {
      const res = await API.get("/messenger/conversations");

setConversations(res.data || []);
    } catch (err) {
      console.error("conversations error:", err);
    }
  }, []);



  useEffect(() => { fetchConversations(); }, [fetchConversations]);

  useEffect(() => {
    API.get("/messenger/admins")
      .then(res => setAdmins(Array.isArray(res.data) ? res.data : []))
      .catch(() => {});
    API.get("/messenger/group/messages")
      .then(res => setGroupMessages(Array.isArray(res.data) ? res.data : []))
      .catch(() => {});
  }, []);

  // ── Search ──────────────────────────────────────────────────────────────────
  useEffect(() => {
    clearTimeout(searchTimer.current);
    if (!query.trim()) { setSearchResults([]); setSearching(false); return; }
    setSearching(true);
    searchTimer.current = setTimeout(async () => {
      try {
        const res = await API.get(`/messenger/users/search?q=${encodeURIComponent(query)}`);
        setSearchResults(Array.isArray(res.data) ? res.data : []);
      } catch { setSearchResults([]); }
      finally { setSearching(false); }
    }, 350);
  }, [query]);

  // ── Open conversation ───────────────────────────────────────────────────────
  const openConversation = async (targetId, userInfo) => {
    setQuery(""); setSearchResults([]);
    try {
      const res = await API.post("/messenger/conversation", { targetId });
      const conv = { ...res.data, ...userInfo, id_user: userInfo.id_user || targetId };
      setSelected(conv);
      setConversations(prev => {
        const exists = prev.find(c => c.id === conv.id);
        return exists ? prev.map(c => c.id === conv.id ? { ...c, ...conv } : c) : [conv, ...prev];
      });
    } catch (err) { console.error(err); }
  };

  // ── Load messages ───────────────────────────────────────────────────────────
  useEffect(() => {
    if (!selected || selected === "group") return;
    const load = async () => {
      setLoadingMsgs(true);
      try {
        const res = await API.get(`/messenger/messages/${selected.id}`);
        setMessages(Array.isArray(res.data) ? res.data : []);
        socketRef.current?.emit("joinConversation", { conversationId: selected.id });
      } catch {}
      finally { setLoadingMsgs(false); }
    };
    load();
  }, [selected?.id]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, groupMessages, selected]);

  // ── Send ────────────────────────────────────────────────────────────────────
 const send = async () => {

  if (!text.trim() || !selected) return;

  const msgText = text.trim();

  setText("");

  try {

    if (selected === "group") {

      const res = await API.post(
        "/messenger/group/messages",
        { text: msgText }
      );

      setGroupMessages(prev => [...prev, res.data]);

    } else {

      const res = await API.post(
        "/messenger/messages",
        {
          conversationId: selected.id,
          text: msgText,
        }
      );

      setMessages(prev => [...prev, res.data]);

      setConversations(prev =>
        prev.map(c =>
          c.id === selected.id
            ? {
                ...c,
                last_message: msgText,
                last_time: new Date()
              }
            : c
        )
      );
    }

  } catch (err) {

    console.log(err);

    alert("Erreur d'envoi");
  }
};

  // ── Helpers ─────────────────────────────────────────────────────────────────
  const displayList = query.trim() ? searchResults : conversations;
  const isSearchMode = !!query.trim();
  const adminNotInConv = admins.filter(a => !conversations.find(c => c.id_user === a.id_user));
  const activeMessages = selected === "group" ? groupMessages : messages;
  const isGroup = selected === "group";

  return (
    <div className="admin-contact">

      {/* ── SIDEBAR ──────────────────────────────────────────────────────────── */}
      <aside className="contacts-panel">

        {/* Header + Search */}
        <div style={{ padding: "20px 16px 12px", borderBottom: "1px solid #ede9ff" }}>
          <h2 style={{ fontSize: 16, fontWeight: 700, color: "#1a1a2e", marginBottom: 12 }}>💬 Messages</h2>
          <div style={{ position: "relative" }}>
            <span style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", fontSize: 13, color: "#b0a9d4" }}>🔍</span>
            <input
              type="text"
              placeholder="Rechercher..."
              value={query}
              onChange={e => setQuery(e.target.value)}
              style={{
                width: "100%", padding: "9px 10px 9px 32px",
                borderRadius: 10, border: "1.5px solid #ede9ff",
                background: "#f7f5ff", color: "#1a1a2e",
                fontSize: 13, outline: "none", boxSizing: "border-box",
                caretColor: "#6d56c1", fontFamily: "inherit",
              }}
            />
            {searching && <span style={{ position: "absolute", right: 10, top: "50%", transform: "translateY(-50%)", fontSize: 11, color: "#b0a9d4" }}>⟳</span>}
          </div>
        </div>

        <div className="chat-list">

          {/* Group Swafy */}
          {!isSearchMode && (
            <>
              <div className="section-label">Groupe</div>
              <div className={`group-item ${selected === "group" ? "active" : ""}`} onClick={() => setSelected("group")}>
                <div className="group-avatar">S</div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: 600, fontSize: 13.5, color: "#1a1a2e" }}>Swafy</div>
                  <div style={{ fontSize: 12, color: "#9e97c0" }}>
                    {groupMessages.length > 0 ? groupMessages[groupMessages.length - 1].text || "[fichier]" : "Canal général"}
                  </div>
                </div>
                <span style={{ fontSize: 9, fontWeight: 700, background: "#ede9ff", color: "#6d56c1", padding: "2px 6px", borderRadius: 6 }}>GROUPE</span>
              </div>
            </>
          )}

          {/* Admins Swafy */}
          {!isSearchMode && adminNotInConv.length > 0 && (
            <>
              <div className="section-label">Swafy Admin</div>
              {adminNotInConv.map(admin => (
                <div key={admin.id_user} className="chat-item" onClick={() => openConversation(admin.id_user, admin)}>
                  {/* Avatar admin avec lettre S */}
                  <div style={{
                    width: 42, height: 42, borderRadius: "50%", flexShrink: 0,
                    background: "linear-gradient(135deg,#6d56c1,#4f3fa0)",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    color: "#fff", fontWeight: 800, fontSize: 18,
                  }}>S</div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: 600, fontSize: 13.5, color: "#1a1a2e" }}>Swafy</div>
                    <div style={{ fontSize: 12, color: "#9e97c0" }}>👑 Équipe Swafy</div>
                  </div>
                </div>
              ))}
            </>
          )}

          {/* Conversations */}
          {!isSearchMode && conversations.length > 0 && (
            <div className="section-label">Conversations ({conversations.length})</div>
          )}
          {isSearchMode && (
            <div className="section-label">
              {searchResults.length > 0 ? `${searchResults.length} résultat(s)` : "Aucun résultat"}
            </div>
          )}

          {displayList.map(item => {
            const id = item.id_user;
            const isActive = selected !== "group" && (selected?.id === item.id || selected?.id_user === id);
            // Admin affiché avec S
            const isAdmin = item.role === "admin";
            return (
              <div
                key={item.id || item.id_user}
                className={`chat-item ${isActive ? "active" : ""}`}
                onClick={() => {
  if (isSearchMode) {
    openConversation(item.id_user, item);
  } else {
    setSelected(item);
  }
}}
              >
                {isAdmin ? (
                  <div style={{
                    width: 42, height: 42, borderRadius: "50%", flexShrink: 0,
                    background: "linear-gradient(135deg,#6d56c1,#4f3fa0)",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    color: "#fff", fontWeight: 800, fontSize: 18,
                  }}>S</div>
                ) : (
                  <Avatar user={item} size={42} />
                )}
                <div style={{ flex: 1, minWidth: 0, marginLeft: 10 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <span style={{ fontWeight: 600, fontSize: 13.5, color: "#1a1a2e", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", maxWidth: 130 }}>
                      {isAdmin ? "Swafy" : `${item.prenom_user} ${item.nom_user}`}
                    </span>
                    {item.last_time && <span style={{ fontSize: 10, color: "#b0a9d4", flexShrink: 0, marginLeft: 4 }}>{formatTime(item.last_time)}</span>}
                  </div>
                  <p style={{ fontSize: 12, color: "#9e97c0", margin: 0, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                    {isSearchMode ? (isAdmin ? "👑 Admin" : "👤 Membre") : (item.last_message || "Nouvelle conversation")}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </aside>

      {/* ── CHAT WINDOW ──────────────────────────────────────────────────────── */}
      <main className="chat-window">
        {selected ? (
          <>
            {/* Header */}
            <div style={{ padding: "14px 20px", display: "flex", alignItems: "center", gap: 12, background: "#fff", borderBottom: "1px solid #ede9ff", flexShrink: 0, boxShadow: "0 1px 4px rgba(0,0,0,0.04)" }}>
              {isGroup ? (
                <div className="group-avatar" style={{ width: 42, height: 42, fontSize: 15 }}>S</div>
              ) : (
                selected.role === "admin" ? (
                  <div style={{ width: 42, height: 42, borderRadius: "50%", background: "linear-gradient(135deg,#6d56c1,#4f3fa0)", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontWeight: 800, fontSize: 18, flexShrink: 0 }}>S</div>
                ) : (
                  <Avatar user={selected} size={42} />
                )
              )}
              <div>
                <div style={{ fontWeight: 700, fontSize: 15, color: "#1a1a2e" }}>
                  {isGroup ? "Swafy" : (selected.role === "admin" ? "Swafy" : `${selected.prenom_user} ${selected.nom_user}`)}
                </div>
                <div style={{ fontSize: 11, color: "#059669", display: "flex", alignItems: "center", gap: 4 }}>
                  <span style={{ width: 7, height: 7, borderRadius: "50%", background: "#059669", display: "inline-block" }} />
                  {isGroup ? "Canal général" : "En ligne"}
                </div>
              </div>
            </div>

            {/* Messages */}
            <div style={{ flex: 1, overflowY: "auto", padding: "20px 24px", display: "flex", flexDirection: "column", gap: 10, background: "#f4f2fb" }}>
              {loadingMsgs ? (
                <div style={{ margin: "auto", color: "#b0a9d4", fontSize: 13 }}>Chargement…</div>
              ) : activeMessages.length === 0 ? (
                <div style={{ margin: "auto", textAlign: "center", color: "#b0a9d4", animation: "fadeUp 0.4s ease" }}>
                  <div style={{ fontSize: 44, marginBottom: 10 }}>💬</div>
                  <div style={{ fontWeight: 600, color: "#6b6b8a" }}>Démarrez la conversation</div>
                </div>
              ) : (
                activeMessages.map(m => {
                  const isMe = m.sender_id === currentUser.id_user;
                  return (
                    <div key={m.id} style={{ alignSelf: isMe ? "flex-end" : "flex-start", maxWidth: "72%", display: "flex", flexDirection: "column", gap: 3, animation: "fadeUp 0.2s ease" }}>
                      {/* Nom dans group */}
                      {isGroup && !isMe && (
                        <div style={{ display: "flex", alignItems: "center", gap: 6, paddingLeft: 4 }}>
                          <Avatar user={{ id_user: m.sender_id, prenom_user: m.prenom_user, nom_user: m.nom_user, photo_user: m.photo_user }} size={20} />
                          <span style={{ fontSize: 11, color: "#6d56c1", fontWeight: 600 }}>{m.prenom_user} {m.nom_user}</span>
                        </div>
                      )}
                      <div style={{
                        background: isMe ? "linear-gradient(135deg,#6d56c1,#4f3fa0)" : "#ffffff",
                        color: isMe ? "#ffffff" : "#1a1a2e",
                        padding: "10px 14px",
                        borderRadius: isMe ? "18px 18px 4px 18px" : "18px 18px 18px 4px",
                        fontSize: 13.5, lineHeight: 1.55,
                        boxShadow: isMe ? "0 4px 14px rgba(109,86,193,0.3)" : "0 1px 6px rgba(0,0,0,0.07)",
                        border: isMe ? "none" : "1px solid #ede9ff",
                      }}>
                        {m.text && <div>{m.text}</div>}
                        <FileMessage msg={m} isMe={isMe} />
                      </div>
                      <span style={{ fontSize: 10, color: "#b0a9d4", textAlign: isMe ? "right" : "left", paddingInline: 4 }}>
                        {formatTime(m.created_at)}
                      </span>
                    </div>
                  );
                })
              )}
              <div ref={bottomRef} />
            </div>

            {/* File preview */}
            {filePreview && (
              <div className="file-preview-bar">
                <span>📎 {filePreview.name}</span>
                <button onClick={() => setFilePreview(null)} style={{ background: "none", border: "none", cursor: "pointer", color: "#dc2626", fontSize: 16 }}>✕</button>
              </div>
            )}

            {/* Input bar */}
            <div style={{ padding: "12px 16px", borderTop: "1px solid #ede9ff", display: "flex", alignItems: "center", gap: 8, background: "#fff", flexShrink: 0 }}>
              {/* File attach */}
              <button
                onClick={() => fileInputRef.current?.click()}
                style={{ width: 38, height: 38, borderRadius: 10, border: "1.5px solid #ede9ff", background: "#f7f5ff", cursor: "pointer", fontSize: 16, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}
                title="Joindre un fichier"
              >📎</button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*,video/*,application/pdf,.doc,.docx"
                style={{ display: "none" }}
                onChange={e => setFilePreview(e.target.files[0] || null)}
              />

              <textarea
                placeholder="Écrire un message... (Entrée pour envoyer)"
                value={text}
                onChange={e => setText(e.target.value)}
                onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(); } }}
                rows={1}
                style={{
                  flex: 1, padding: "10px 14px",
                  borderRadius: 14, border: "1.5px solid #ede9ff",
                  background: "#f7f5ff", color: "#1a1a2e",
                  fontSize: 13.5, outline: "none", resize: "none",
                  fontFamily: "inherit", caretColor: "#6d56c1",
                  minHeight: 40, maxHeight: 120,
                }}
              />
              <button
                onClick={send}
                disabled={!text.trim() && !filePreview}
                style={{
                  width: 42, height: 42, borderRadius: 12, border: "none",
                  background: (text.trim() || filePreview) ? "linear-gradient(135deg,#6d56c1,#4f3fa0)" : "#e8e3ff",
                  color: (text.trim() || filePreview) ? "#fff" : "#b0a9d4",
                  cursor: (text.trim() || filePreview) ? "pointer" : "default",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  flexShrink: 0, boxShadow: (text.trim() || filePreview) ? "0 4px 14px rgba(109,86,193,0.35)" : "none",
                  transition: "all 0.2s",
                }}
              >
                <svg viewBox="0 0 24 24" fill="none" width="18" height="18">
                  <path d="M22 2L11 13M22 2L15 22L11 13M22 2L2 9L11 13" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </button>
            </div>
          </>
        ) : (
          <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 12, background: "#f4f2fb" }}>
            <div style={{ fontSize: 52, filter: "drop-shadow(0 4px 12px rgba(109,86,193,0.2))" }}>💬</div>
            <p style={{ fontSize: 16, fontWeight: 700, color: "#1a1a2e" }}>Swafy Messages</p>
            <p style={{ fontSize: 13, color: "#b0a9d4" }}>Sélectionnez une conversation ou rejoignez le groupe</p>
          </div>
        )}
      </main>
    </div>
  );
}