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
  const selectedRef = useRef(null);
  const currentUser = JSON.parse(localStorage.getItem("user") || "{}");

  useEffect(() => {
    const token = localStorage.getItem("token");
    socketRef.current = io(BACKEND, { auth: { token }, transports: ["websocket"] });

    socketRef.current.on("newMessage", (msg) => {
      if (selectedRef.current && msg.conversation_id === selectedRef.current.id) {
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
  }, []);

  useEffect(() => { selectedRef.current = selected; }, [selected]);

  const fetchConversations = useCallback(async () => {
    try {
      const res = await API.get("/messenger/conversations");
      setConversations(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      console.error("conversations error:", err);
    }
  }, []);

  useEffect(() => { fetchConversations(); }, [fetchConversations]);

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

  const send = async () => {
    if (!text.trim() || !selected) return;
    const msgText = text.trim();
    setText("");
    try {
      await API.post("/messenger/messages", {
        conversationId: selected.id,
        text: msgText,
      });
    } catch {
      alert("Erreur d'envoi");
    }
  };

  const displayList = query.trim() ? searchResults : conversations;
  const isSearchMode = !!query.trim();

  return (
    <div className="admin-contact">

      {/* ── SIDEBAR ─────────────────────────────────────────────────────────── */}
      <aside className="contacts-panel">

        <div style={{ padding: "20px 16px 10px", borderBottom: "1px solid #e8e8f0" }}>
          <h2 style={{ fontSize: 16, fontWeight: 700, color: "#1a1a2e", marginBottom: 12 }}>
            💬 Messages
          </h2>
          <div style={{ position: "relative" }}>
            <span style={{
              position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)",
              fontSize: 13, color: "#9e97c0",
            }}>🔍</span>
            <input
              type="text"
              placeholder="Rechercher un utilisateur..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              style={{
                width: "100%", padding: "9px 10px 9px 32px",
                borderRadius: 10, border: "1.5px solid #d0c9f5",
                background: "#f3f0ff", color: "#1a1a2e",
                fontSize: 13, outline: "none", boxSizing: "border-box",
                caretColor: "#6b4fbb",
              }}
            />
            {searching && (
              <span style={{ position: "absolute", right: 10, top: "50%", transform: "translateY(-50%)", fontSize: 11, color: "#9e97c0" }}>
                ...
              </span>
            )}
          </div>
        </div>

        {isSearchMode && (
          <div style={{ padding: "8px 16px 4px", fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: 1, color: "#9e97c0" }}>
            Résultats ({searchResults.length})
          </div>
        )}
        {!isSearchMode && conversations.length > 0 && (
          <div style={{ padding: "8px 16px 4px", fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: 1, color: "#9e97c0" }}>
            Conversations ({conversations.length})
          </div>
        )}

        <div className="chat-list">
          {displayList.length === 0 && !searching && (
            <div style={{ padding: "30px 16px", textAlign: "center", color: "#9e97c0", fontSize: 13 }}>
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
                  isSearchMode ? openConversation(id, item) : selectConv(item)
                }
              >
                <div style={{
                  width: 42, height: 42, borderRadius: "50%", flexShrink: 0,
                  background: getColor(id),
                  display: "flex", alignItems: "center", justifyContent: "center",
                  color: "#fff", fontWeight: 700, fontSize: 15,
                }}>
                  {getInitials(prenom, nom)}
                </div>

                <div style={{ flex: 1, minWidth: 0, marginLeft: 10 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <span style={{ fontWeight: 600, fontSize: 13.5, color: "#1a1a2e", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", maxWidth: 120 }}>
                      {prenom} {nom}
                    </span>
                    {item.last_time && (
                      <span style={{ fontSize: 10, color: "#9e97c0", flexShrink: 0, marginLeft: 4 }}>
                        {formatTime(item.last_time)}
                      </span>
                    )}
                  </div>
                  <p style={{ fontSize: 12, color: "#6b6b8a", margin: 0, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
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
              background: "#ffffff", borderBottom: "1px solid #e8e8f0",
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
                <div style={{ fontWeight: 700, fontSize: 14, color: "#1a1a2e" }}>
                  {selected.prenom_user} {selected.nom_user}
                </div>
                <div style={{ fontSize: 11, color: "#22c55e" }}>● En ligne</div>
              </div>
            </div>

            {/* Messages */}
            <div style={{
              flex: 1, overflowY: "auto", padding: "20px",
              display: "flex", flexDirection: "column", gap: 8,
              background: "#f7f8fc",
              scrollbarWidth: "thin", scrollbarColor: "#d0c9f5 transparent",
            }}>
              {loadingMsgs ? (
                <div style={{ margin: "auto", color: "#9e97c0", fontSize: 13 }}>Chargement…</div>
              ) : messages.length === 0 ? (
                <div style={{ margin: "auto", color: "#9e97c0", fontSize: 13, textAlign: "center" }}>
                  <div style={{ fontSize: 32, marginBottom: 8 }}>💬</div>
                  Démarrez la conversation !
                </div>
              ) : (
                messages.map((m) => {
                  const isMe = m.sender_id === currentUser.id_user;
                  return (
                    <div key={m.id} style={{
                      alignSelf: isMe ? "flex-end" : "flex-start",
                      maxWidth: "70%", display: "flex", flexDirection: "column", gap: 3,
                    }}>
                      <div style={{
                        background: isMe ? "linear-gradient(135deg,#7c5cbf,#5a3fa0)" : "#ffffff",
                        color: isMe ? "#ffffff" : "#1a1a2e",
                        padding: "10px 14px",
                        borderRadius: isMe ? "16px 16px 4px 16px" : "16px 16px 16px 4px",
                        fontSize: 13.5, lineHeight: 1.5,
                        boxShadow: isMe ? "0 4px 12px rgba(90,63,160,0.25)" : "0 1px 4px rgba(0,0,0,0.08)",
                        border: isMe ? "none" : "1px solid #e8e8f0",
                      }}>
                        {m.text}
                      </div>
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

            {/* Input */}
            <div style={{
              padding: "14px 16px", borderTop: "1px solid #e8e8f0",
              display: "flex", gap: 10, flexShrink: 0,
              background: "#ffffff",
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
                  borderRadius: 12, border: "1.5px solid #d0c9f5",
                  background: "#f3f0ff", color: "#1a1a2e",
                  fontSize: 13.5, outline: "none", resize: "none",
                  fontFamily: "Segoe UI, system-ui, Arial",
                  caretColor: "#6b4fbb",
                }}
              />
              <button
                onClick={send}
                style={{
                  background: "linear-gradient(135deg,#7c5cbf,#5a3fa0)",
                  color: "#fff", border: "none",
                  padding: "0 20px", borderRadius: 12,
                  fontWeight: 700, fontSize: 14, cursor: "pointer",
                  boxShadow: "0 4px 12px rgba(90,63,160,0.3)",
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
            height: "100%", gap: 12, background: "#f7f8fc",
          }}>
            <div style={{ fontSize: 48 }}>💬</div>
            <p style={{ fontSize: 14, fontWeight: 500, color: "#6b6b8a" }}>Sélectionnez une conversation</p>
            <p style={{ fontSize: 12, color: "#9e97c0" }}>ou recherchez un utilisateur</p>
          </div>
        )}
      </main>
    </div>
  );
}
