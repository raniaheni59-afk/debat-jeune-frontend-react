<<<<<<< HEAD
import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import "./AdminContact.css";
import ParametreContact from "./ParametreContact";

const AVATAR_COLORS = ["#7c5cbf", "#3b82f6", "#22c55e", "#f59e0b", "#ef4444"];

const seedChats = [
{
id: 1,
name: "Wealth",
platform: "whatsapp",
avatar: "W",
color: AVATAR_COLORS[0],
preview: "What's up?",
time: "2:45pm",
messages: [
{ id: 101, from: "them", text: "What's up?", at: "2:40pm" },
{ id: 102, from: "me", text: "Good you?", at: "2:41pm" },
{ id: 103, from: "them", text: "I'm fine", at: "2:41pm" },
{ id: 104, from: "them", text: "What you up to?", at: "2:42pm" },
{ id: 105, from: "me", text: "I'm in class", at: "2:43pm" },
{ id: 106, from: "them", text: "Hahaha... and u're texting", at: "2:44pm" },
{ id: 107, from: "me", text: "Yup", at: "2:44pm" },
{ id: 108, from: "me", text: "Because I'm sitting at the back", at: "2:45pm" },
],
},
{
id: 2,
name: "Just Bot",
platform: "whatsapp",
avatar: "J",
color: AVATAR_COLORS[1],
preview: "Hey there ",
time: "today",
messages: [{ id: 201, from: "them", text: "Hey there 👋", at: "9:15am" }],
},
{
id: 3,
name: "Arcane",
platform: "whatsapp",
avatar: "A",
color: AVATAR_COLORS[2],
preview: "Are you coming today?",
time: "yesterday",
messages: [{ id: 301, from: "them", text: "Are you coming today?", at: "5:08pm" }],
},
];

export default function AdminContact({ setActivePage }) {
const navigate = useNavigate();
const [loadingIntro, setLoadingIntro] = useState(true); // 2s splash
const [contacts, setContacts] = useState(seedChats);
const [selected, setSelected] = useState(seedChats[0]);
const [query, setQuery] = useState("");
const [text, setText] = useState("");
const fileRef = useRef(null);
const bottomRef = useRef(null);

// Splash 2s kif WhatsApp
useEffect(() => {
const t = setTimeout(() => setLoadingIntro(false), 2000);
return () => clearTimeout(t);
}, []);

// scroll to bottom ki yji msg jdyd
useEffect(() => {
bottomRef.current?.scrollIntoView({ behavior: "smooth" });
}, [selected?.messages.length]);

const filtered = contacts.filter((c) =>
c.name.toLowerCase().includes(query.toLowerCase())
);

const send = () => {
if (!text.trim() || !selected) return;
const msg = {
id: Date.now(),
from: "me",
text: text.trim(),
at: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
};
const next = contacts.map((c) =>
c.id === selected.id
? { ...c, preview: msg.text, time: msg.at, messages: [...c.messages, msg] }
: c
);
setContacts(next);
setSelected(next.find((c) => c.id === selected.id));
setText("");
};

const attachFiles = (e) => {
const files = Array.from(e.target.files || []);
if (!files.length || !selected) return;
const first = files[0];
let icon = "📁";
if (first.type.startsWith("image/")) icon = "🖼️";
else if (first.type === "application/pdf") icon = "📄";
else if (first.type.includes("zip") || first.type.includes("rar")) icon = "🗜️";

text

const label =
  files.length > 1 ? `${icon} ${files.length} files attached` : `${icon} ${first.name}`;

const msg = {
  id: Date.now(),
  from: "me",
  text: label,
  at: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
};

const next = contacts.map((c) =>
  c.id === selected.id
    ? { ...c, preview: msg.text, time: msg.at, messages: [...c.messages, msg] }
    : c
);
setContacts(next);
setSelected(next.find((c) => c.id === selected.id));
e.target.value = "";
};

return (
<>
{loadingIntro && (
<div className="chat-splash">
<img src="/contact.png" alt="logo" />
</div>
)}

text

  {/* hidden file input */}
  <input
    ref={fileRef}
    type="file"
    multiple
    accept="image/*,application/pdf,.doc,.docx,.txt,.zip,.rar"
    style={{ display: "none" }}
    onChange={attachFiles}
  />

  <div className="admin-contact">
    {/* LEFT PANEL */}
    <aside className="contacts-panel">
      <div className="contacts-icons">
       {[
  {
    key: "whatsapp",
    url: "https://cdn.simpleicons.org/whatsapp",
    label: "WhatsApp",
    action: () => window.open("https://web.whatsapp.com", "_blank"),
  },
  {
    key: "linkedin",
    url: "https://cdn.simpleicons.org/linkedin/0A66C2",
    label: "LinkedIn",
    action: () => window.open("https://www.linkedin.com", "_blank"),
  },
  {
    key: "email",
    url: "https://cdn.simpleicons.org/gmail",
    label: "Email",
    action: () => window.open("https://mail.google.com", "_blank"),
  },
].map((p) => (
  <button
    key={p.key}
    className="contact-btn"
    title={p.label}
    onClick={p.action}
  >
    <img src={p.url} width="26" height="26" alt={p.label} />
    <span style={{ fontSize: 10, color: "#666", marginTop: 6 }}>
      {p.label}
    </span>
  </button>
))}
      </div>

      <input
        type="text"
        placeholder="Search..."
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        style={{
          width: "100%",
          padding: "10px 12px",
          borderRadius: 10,
          border: "1px solid #e5e5e5",
          outline: "none",
          fontSize: 13,
        }}
      />

      <div className="chat-list">
        {filtered.map((c) => (
          <div
            key={c.id}
            className={`chat-item ${selected?.id === c.id ? "active" : ""}`}
            onClick={() => setSelected(c)}
          >
            <div
              style={{
                width: 38,
                height: 38,
                borderRadius: "50%",
                background: c.color,
                color: "#fff",
                fontWeight: 800,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              {c.avatar}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontWeight: 700, fontSize: 13 }}>{c.name}</div>
              <div
                style={{
                  fontSize: 12,
                  color: "#888",
                  whiteSpace: "nowrap",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  maxWidth: 160,
                }}
              >
                {c.preview}
              </div>
            </div>
            <div style={{ fontSize: 11, color: "#aaa" }}>{c.time}</div>
          </div>
        ))}
      </div>

    
    </aside>

    {/* MIDDLE CHAT */}
    <main className="chat-window">
      {!selected ? (
        <div className="chat-empty">
          <img src="/contact.png" alt="empty" />

        </div>
      ) : (
        <>
          <div className="chat-header">
            <div
              style={{
                width: 40,
                height: 40,
                borderRadius: "50%",
                background: selected.color,
                color: "#fff",
                fontWeight: 800,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 14,
              }}
            >
              {selected.avatar}
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 800 }}>{selected.name}</div>
              <div style={{ fontSize: 12, color: "#8a8a8a" }}>
                Online • {selected.platform}
              </div>
            </div>
            <div style={{ display: "flex", gap: 10 }}>
             
              <button
              className="emoji-btn"
              title="Paramètres"
             onClick={() => setActivePage("parametreContact")}
            >
              <img src="/para.png" alt="parametre" style={{ width: 22 }} />
            </button>
            </div>
          </div>

          <div className="chat-messages">
            {selected.messages.map((m) => (
              <div key={m.id} className={m.from === "me" ? "outgoing" : "incoming"} title={m.at}>
                {m.text}
              </div>
            ))}
            <div ref={bottomRef} />
          </div>

          <div className="chat-input">
            <textarea
              placeholder="Type your message here..."
              value={text}
              onChange={(e) => setText(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  send();
                }
              }}
            />
            <div className="input-actions">
              <span className="emoji-btn" title="Attach" onClick={() => fileRef.current?.click()}>
                📎
              </span>
              <span className="emoji-btn" title="Emoji" onClick={() => setText((t) => t + "😊")}>
                
              </span>
              <span className="send-btn" title="Send" onClick={send}>
                ➤
              </span>
            </div>
          </div>
        </>
      )}
    </main>
  </div>
</>
);
}
=======
import { useEffect, useRef, useState, useCallback } from "react";
import { io } from "socket.io-client";
import API from "../services/api";
import "./AdminContact.css";

const BACKEND = "https://debat-jeune-production.up.railway.app";
const AVATAR_COLORS = ["#7c5cbf", "#3b82f6", "#22c55e", "#f59e0b", "#ef4444"];

const getInitials = (prenom, nom) =>
  ((prenom?.[0] || "") + (nom?.[0] || "")).toUpperCase() || "?";

const getColor = (id) => AVATAR_COLORS[(id || 0) % AVATAR_COLORS.length];

const formatTime = (dateStr) => {
  if (!dateStr) return "";
  const d = new Date(dateStr);
  const now = new Date();
  const diff = now - d;
  if (diff < 60000) return "À l'instant";
  if (diff < 3600000) return `${Math.floor(diff / 60000)}min`;
  if (diff < 86400000) return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  return d.toLocaleDateString("fr-FR", { day: "2-digit", month: "short" });
};

export default function AdminContact() {
  const [conversations, setConversations] = useState([]);
  const [selected, setSelected] = useState(null);
  const [messages, setMessages] = useState([]);
  const [query, setQuery] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const [text, setText] = useState("");
  const [loadingMsgs, setLoadingMsgs] = useState(false);
  const bottomRef = useRef(null);
  const socketRef = useRef(null);
  const searchTimer = useRef(null);
  const currentUser = JSON.parse(localStorage.getItem("user") || "{}");

  // ── Socket ──────────────────────────────────────────────────────────────────
  useEffect(() => {
    const token = localStorage.getItem("token");
    socketRef.current = io(BACKEND, { auth: { token }, transports: ["websocket"] });

    socketRef.current.on("newMessage", (msg) => {
      if (selected && msg.conversation_id === selected.id) {
        setMessages((prev) =>
          prev.find((m) => m.id === msg.id) ? prev : [...prev, msg]
        );
      }
      setConversations((prev) =>
        prev
          .map((c) =>
            c.id === msg.conversation_id
              ? { ...c, last_message: msg.text, last_time: msg.created_at }
              : c
          )
          .sort((a, b) => new Date(b.last_time) - new Date(a.last_time))
      );
    });

    return () => socketRef.current?.disconnect();
  }, [selected?.id]);

  // ── Fetch conversations ──────────────────────────────────────────────────────
  const fetchConversations = useCallback(async () => {
    try {
      const res = await API.get("/messenger/conversations");
      setConversations(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      console.error("conversations error:", err);
    }
  }, []);

  useEffect(() => { fetchConversations(); }, [fetchConversations]);

  // ── Search users ─────────────────────────────────────────────────────────────
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

  // ── Select conversation or open new from search ──────────────────────────────
  const openConversation = async (targetId, userInfo) => {
    setQuery("");
    setSearchResults([]);
    try {
      const res = await API.post("/messenger/conversation", { targetId });
      const conv = {
        ...res.data,
        nom_user: userInfo.nom_user,
        prenom_user: userInfo.prenom_user,
        photo_user: userInfo.photo_user,
        id_user: targetId,
      };
      setSelected(conv);
      setConversations((prev) => {
        const exists = prev.find((c) => c.id === conv.id);
        return exists
          ? prev.map((c) => (c.id === conv.id ? { ...c, ...conv } : c))
          : [conv, ...prev];
      });
    } catch (err) {
      console.error(err);
    }
  };

  const selectConv = (conv) => {
    setSelected(conv);
    setQuery("");
    setSearchResults([]);
  };

  // ── Fetch messages ───────────────────────────────────────────────────────────
  useEffect(() => {
    if (!selected) return;
    const load = async () => {
      try {
        setLoadingMsgs(true);
        const res = await API.get(`/messenger/messages/${selected.id}`);
        setMessages(Array.isArray(res.data) ? res.data : []);
        socketRef.current?.emit("joinConversation", { conversationId: selected.id });
      } catch (err) {
        console.error(err);
      } finally {
        setLoadingMsgs(false);
      }
    };
    load();
  }, [selected?.id]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // ── Send ─────────────────────────────────────────────────────────────────────
  const send = async () => {
    if (!text.trim() || !selected) return;
    const msgText = text.trim();
    setText("");
    try {
      const res = await API.post("/messenger/messages", {
        conversationId: selected.id,
        text: msgText,
      });
      setMessages((prev) => [...prev, res.data]);
    } catch {
      alert("Erreur d'envoi");
    }
  };

  // ── Helpers ──────────────────────────────────────────────────────────────────
  const displayList = query.trim() ? searchResults : conversations;
  const isSearchMode = !!query.trim();

  return (
    <div className="admin-contact">

      {/* ── SIDEBAR ─────────────────────────────────────────────────────────── */}
      <aside className="contacts-panel">

        {/* Header */}
        <div style={{ padding: "20px 16px 10px", borderBottom: "1px solid rgba(255,255,255,0.1)" }}>
          <h2 style={{ fontSize: 16, fontWeight: 700, color: "#fff", marginBottom: 12 }}>
            💬 Messages
          </h2>

          {/* Search bar */}
          <div style={{ position: "relative" }}>
            <span style={{
              position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)",
              fontSize: 13, color: "rgba(255,255,255,0.5)",
            }}>🔍</span>
            <input
              type="text"
              placeholder="Rechercher un utilisateur..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              style={{
                width: "100%", padding: "9px 10px 9px 32px",
                borderRadius: 10, border: "1px solid rgba(255,255,255,0.2)",
                background: "rgba(255,255,255,0.12)", color: "#fff",
                fontSize: 13, outline: "none", boxSizing: "border-box",
              }}
            />
            {searching && (
              <span style={{ position: "absolute", right: 10, top: "50%", transform: "translateY(-50%)", fontSize: 11, color: "rgba(255,255,255,0.5)" }}>
                ...
              </span>
            )}
          </div>
        </div>

        {/* Section label */}
        {isSearchMode && (
          <div style={{ padding: "8px 16px 4px", fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: 1, color: "rgba(255,255,255,0.4)" }}>
            Résultats ({searchResults.length})
          </div>
        )}
        {!isSearchMode && conversations.length > 0 && (
          <div style={{ padding: "8px 16px 4px", fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: 1, color: "rgba(255,255,255,0.4)" }}>
            Conversations ({conversations.length})
          </div>
        )}

        {/* List */}
        <div className="chat-list">
          {displayList.length === 0 && !searching && (
            <div style={{ padding: "30px 16px", textAlign: "center", color: "rgba(255,255,255,0.4)", fontSize: 13 }}>
              {isSearchMode ? "Aucun résultat" : "Aucune conversation"}
            </div>
          )}

          {displayList.map((item) => {
            const id = item.id_user || item.user_id;
            const nom = item.nom_user;
            const prenom = item.prenom_user;
            const isActive = selected?.id === item.id || selected?.id_user === id;

            return (
              <div
                key={item.id || item.id_user}
                className={`chat-item ${isActive ? "active" : ""}`}
                onClick={() =>
                  isSearchMode
                    ? openConversation(id, item)
                    : selectConv(item)
                }
              >
                {/* Avatar */}
                <div style={{
                  width: 42, height: 42, borderRadius: "50%", flexShrink: 0,
                  background: getColor(id),
                  display: "flex", alignItems: "center", justifyContent: "center",
                  color: "#fff", fontWeight: 700, fontSize: 15,
                }}>
                  {getInitials(prenom, nom)}
                </div>

                {/* Info */}
                <div style={{ flex: 1, minWidth: 0, marginLeft: 10 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <span style={{ fontWeight: 600, fontSize: 13.5, color: "#fff", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", maxWidth: 120 }}>
                      {prenom} {nom}
                    </span>
                    {item.last_time && (
                      <span style={{ fontSize: 10, color: "rgba(255,255,255,0.4)", flexShrink: 0, marginLeft: 4 }}>
                        {formatTime(item.last_time)}
                      </span>
                    )}
                  </div>
                  <p style={{ fontSize: 12, color: "rgba(255,255,255,0.5)", margin: 0, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                    {isSearchMode
                      ? (item.role === "admin" ? "👑 Admin" : "👤 Jeune")
                      : (item.last_message || "Nouvelle conversation")}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </aside>

      {/* ── CHAT WINDOW ─────────────────────────────────────────────────────── */}
      <main className="chat-window">
        {selected ? (
          <>
            {/* Header */}
            <div style={{
              padding: "16px 20px", display: "flex", alignItems: "center", gap: 12,
              background: "rgba(255,255,255,0.06)", borderBottom: "1px solid rgba(255,255,255,0.1)",
              flexShrink: 0,
            }}>
              <div style={{
                width: 40, height: 40, borderRadius: "50%",
                background: getColor(selected.id_user),
                display: "flex", alignItems: "center", justifyContent: "center",
                color: "#fff", fontWeight: 700, fontSize: 15,
              }}>
                {getInitials(selected.prenom_user, selected.nom_user)}
              </div>
              <div>
                <div style={{ fontWeight: 700, fontSize: 14, color: "#fff" }}>
                  {selected.prenom_user} {selected.nom_user}
                </div>
                <div style={{ fontSize: 11, color: "#4ade80" }}>● En ligne</div>
              </div>
            </div>

            {/* Messages */}
            <div style={{
              flex: 1, overflowY: "auto", padding: "20px",
              display: "flex", flexDirection: "column", gap: 8,
              scrollbarWidth: "thin", scrollbarColor: "rgba(255,255,255,0.15) transparent",
            }}>
              {loadingMsgs ? (
                <div style={{ margin: "auto", color: "rgba(255,255,255,0.4)", fontSize: 13 }}>Chargement…</div>
              ) : messages.length === 0 ? (
                <div style={{ margin: "auto", color: "rgba(255,255,255,0.4)", fontSize: 13, textAlign: "center" }}>
                  <div style={{ fontSize: 32, marginBottom: 8 }}>💬</div>
                  Démarrez la conversation !
                </div>
              ) : (
                messages.map((m) => {
                  const isMe = m.sender_id === currentUser.id_user;
                  return (
                    <div key={m.id} style={{
                      alignSelf: isMe ? "flex-end" : "flex-start",
                      maxWidth: "70%", display: "flex", flexDirection: "column",
                      gap: 3,
                    }}>
                      <div style={{
                        background: isMe
                          ? "linear-gradient(135deg,#7c5cbf,#5a3fa0)"
                          : "rgba(255,255,255,0.13)",
                        color: "#fff",
                        padding: "10px 14px",
                        borderRadius: isMe ? "16px 16px 4px 16px" : "16px 16px 16px 4px",
                        fontSize: 13.5, lineHeight: 1.5,
                        boxShadow: isMe ? "0 4px 12px rgba(90,63,160,0.3)" : "none",
                        backdropFilter: !isMe ? "blur(10px)" : "none",
                      }}>
                        {m.text}
                      </div>
                      <span style={{
                        fontSize: 10, color: "rgba(255,255,255,0.35)",
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

            {/* Input */}
            <div style={{
              padding: "14px 16px", borderTop: "1px solid rgba(255,255,255,0.1)",
              display: "flex", gap: 10, flexShrink: 0,
              background: "rgba(255,255,255,0.04)",
            }}>
              <textarea
                placeholder="Écrire un message..."
                value={text}
                onChange={(e) => setText(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(); }
                }}
                rows={1}
                style={{
                  flex: 1, padding: "10px 14px",
                  borderRadius: 12, border: "1px solid rgba(255,255,255,0.2)",
                  background: "rgba(255,255,255,0.1)", color: "#fff",
                  fontSize: 13.5, outline: "none", resize: "none",
                  fontFamily: "Poppins, sans-serif",
                }}
              />
              <button
                onClick={send}
                style={{
                  background: "linear-gradient(135deg,#7c5cbf,#5a3fa0)",
                  color: "#fff", border: "none",
                  padding: "0 20px", borderRadius: 12,
                  fontWeight: 700, fontSize: 14, cursor: "pointer",
                  boxShadow: "0 4px 12px rgba(90,63,160,0.4)",
                  transition: "opacity 0.2s",
                }}
              >
                ➤
              </button>
            </div>
          </>
        ) : (
          <div style={{
            display: "flex", flexDirection: "column",
            alignItems: "center", justifyContent: "center",
            height: "100%", color: "rgba(255,255,255,0.35)", gap: 12,
          }}>
            <div style={{ fontSize: 48 }}>💬</div>
            <p style={{ fontSize: 14, fontWeight: 500 }}>Sélectionnez une conversation</p>
            <p style={{ fontSize: 12, color: "rgba(255,255,255,0.25)" }}>
              ou recherchez un utilisateur
            </p>
          </div>
        )}
      </main>
    </div>
  );
}

>>>>>>> 7ad9b6fb5d8413d2b7460a3024d4bcb3de574fb1
