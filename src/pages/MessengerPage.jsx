import React, { useEffect, useMemo, useRef, useState } from "react";
import { io } from "socket.io-client";
import API from "../services/api";
import "./MessengerPage.css";

function decodeUserId(token) {
  if (!token) return null;
  try {
    const payload = JSON.parse(atob(token.split(".")[1]));
    return String(payload.userId ?? payload.id_user ?? payload.id ?? payload.sub ?? payload.user?.id);
  } catch {
    return null;
  }
}

export default function MessengerPage() {
  const token = localStorage.getItem("token");
  const userId = useMemo(() => decodeUserId(token), [token]);

  const apiBase = API.defaults.baseURL || "";
  const SOCKET_URL = apiBase.replace(/\/api\/?$/, ""); // remove /api

  const [query, setQuery] = useState("");
  const [searchUsers, setSearchUsers] = useState([]);

  const [conversations, setConversations] = useState([]);
  const [activeConversationId, setActiveConversationId] = useState(null);
  const [messages, setMessages] = useState([]);

  const [text, setText] = useState("");
  const [file, setFile] = useState(null);

  const socketRef = useRef(null);
  const fileInputRef = useRef(null);

  const activeConversation = useMemo(
    () => conversations.find(c => c._id === activeConversationId) || null,
    [conversations, activeConversationId]
  );

  // socket connect + listen
  useEffect(() => {
    if (!token) return;

    const socket = io(SOCKET_URL, {
      auth: { token },
      transports: ["websocket"],
    });

    socketRef.current = socket;

    socket.on("newMessage", ({ conversationId, message }) => {
      // realtime update (إذا نخدم io.emit بعد insert)
      if (String(conversationId) === String(activeConversationId)) {
        setMessages(prev => [...prev, message]);
      }
      setConversations(prev =>
        prev.map(c =>
          c._id === conversationId ? { ...c, lastMessage: message } : c
        )
      );
    });

    return () => socket.disconnect();
  }, [token, SOCKET_URL, activeConversationId]);

  // load conversations
  useEffect(() => {
    if (!token) return;

    (async () => {
      const res = await API.get("/messenger/conversations");
      setConversations(res.data.conversations || []);
      if (!activeConversationId && res.data.conversations?.[0]?._id) {
        setActiveConversationId(res.data.conversations[0]._id);
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  // load messages when change active
  useEffect(() => {
    if (!token || !activeConversationId) return;

    (async () => {
      const res = await API.get(`/messenger/conversations/${activeConversationId}/messages`);
      setMessages(res.data.messages || []);
    })();

    socketRef.current?.emit("joinConversation", { conversationId: activeConversationId });
  }, [token, activeConversationId]);

  // search users debounce simple
  useEffect(() => {
    if (!token) return;

    const t = setTimeout(async () => {
      const q = query.trim();
      if (q.length < 2) {
        setSearchUsers([]);
        return;
      }
      const res = await API.get(`/messenger/users/search?q=${encodeURIComponent(q)}`);
      setSearchUsers(res.data.users || []);
    }, 300);

    return () => clearTimeout(t);
  }, [query, token]);

  const ensureConversationAndOpen = async (otherUserId) => {
    const res = await API.post("/messenger/conversations/ensure", { otherUserId });
    const conversationId = res.data.conversationId;

    // refresh list
    const convRes = await API.get("/messenger/conversations");
    setConversations(convRes.data.conversations || []);
    setActiveConversationId(conversationId);

    // clear search UI
    setQuery("");
    setSearchUsers([]);
  };

  const send = async () => {
    if (!activeConversationId) return;

    const form = new FormData();
    form.append("text", text);
    if (file) form.append("file", file);

    const res = await API.post(
      `/messenger/conversations/${activeConversationId}/messages`,
      form,
      { headers: { "Content-Type": "multipart/form-data" } }
    );

    // optimistic local add (if REST returns message)
    const newMsg = res.data.message;
    setMessages(prev => [...prev, newMsg]);
    setText("");
    setFile(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  return (
    <div className="ms-page">
      <div className="ms-shell">
        {/* Sidebar */}
        <aside className="ms-sidebar">
          <div className="ms-sidebarTop">
            <div className="ms-title">Chats</div>
            <input
              className="ms-search"
              placeholder="Search name..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
          </div>

          <div className="ms-list">
            {searchUsers.length > 0 ? (
              <div>
                <div className="ms-subtitle">Results</div>
                {searchUsers.map((u) => (
                  <button
                    key={u._id}
                    className="ms-userResult"
                    onClick={() => ensureConversationAndOpen(u._id)}
                  >
                    <div className="ms-avatar">
                      {u.avatarUrl ? (
                        <img alt="" src={u.avatarUrl} />
                      ) : (
                        <div className="ms-avatarFallback">{u.name?.[0] || "U"}</div>
                      )}
                    </div>
                    <div className="ms-chatMeta">
                      <div className="ms-chatName">{u.name}</div>
                      <div className="ms-chatLast">{u.email || ""}</div>
                    </div>
                  </button>
                ))}
              </div>
            ) : (
              <>
                {conversations.length === 0 ? (
                  <div className="ms-empty">No chats yet</div>
                ) : (
                  conversations.map((c) => {
                    const isActive = String(c._id) === String(activeConversationId);
                    const last = c.lastMessage?.type === "text"
                      ? (c.lastMessage?.text || "No messages")
                      : (c.lastMessage?.type === "image" ? "📷 Photo" : "🎥 Video");

                    return (
                      <button
                        key={c._id}
                        className={"ms-chatItem " + (isActive ? "active" : "")}
                        onClick={() => setActiveConversationId(c._id)}
                      >
                        <div className="ms-avatar">
                          {c.otherUser?.avatarUrl ? (
                            <img alt="" src={c.otherUser.avatarUrl} />
                          ) : (
                            <div className="ms-avatarFallback">{(c.otherUser?.name || "U")[0]}</div>
                          )}
                        </div>
                        <div className="ms-chatMeta">
                          <div className="ms-chatName">{c.otherUser?.name || "User"}</div>
                          <div className="ms-chatLast">{last}</div>
                        </div>
                      </button>
                    );
                  })
                )}
              </>
            )}
          </div>
        </aside>

        {/* Main */}
        <section className="ms-main">
          <header className="ms-mainHeader">
            {activeConversation ? (
              <div className="ms-activeUser">
                <div className="ms-avatar small">
                  {activeConversation.otherUser?.avatarUrl ? (
                    <img alt="" src={activeConversation.otherUser.avatarUrl} />
                  ) : (
                    <div className="ms-avatarFallback">
                      {(activeConversation.otherUser?.name || "A")[0]}
                    </div>
                  )}
                </div>
                <div>
                  <div className="ms-activeName">{activeConversation.otherUser?.name}</div>
                  <div className="ms-activeSub">{activeConversation.otherUser?.email || ""}</div>
                </div>
              </div>
            ) : (
              <div className="ms-activeUser">
                <div className="ms-activeName">Select a chat</div>
              </div>
            )}
          </header>

          <div className="ms-messages">
            {messages.map((m) => {
              const mine = userId && String(m.senderId) === String(userId);

              return (
                <div key={m.id || m.createdAt} className={"ms-bubbleRow " + (mine ? "mine" : "theirs")}>
                  <div className={"ms-bubble " + (mine ? "mine" : "theirs")}>
                    {m.type === "text" && <div>{m.text}</div>}
                    {m.type === "image" && (
                      <img
                        className="ms-attachmentImg"
                        src={m.attachmentUrl}
                        alt="attachment"
                      />
                    )}
                    {m.type === "video" && (
                      <video className="ms-attachmentVideo" controls src={m.attachmentUrl} />
                    )}

                    <div className="ms-time">
                      {m.createdAt ? new Date(m.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : ""}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          <footer className="ms-inputBar">
            <button
              className="ms-iconBtn"
              type="button"
              onClick={() => fileInputRef.current?.click()}
              title="Add image/video"
            >
              +
            </button>

            <input
              ref={fileInputRef}
              type="file"
              accept="image/*,video/*"
              style={{ display: "none" }}
              onChange={(e) => setFile(e.target.files?.[0] || null)}
            />

            <input
              className="ms-input"
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="Write a message..."
              onKeyDown={(e) => e.key === "Enter" && send()}
              disabled={!activeConversationId}
            />

            <button className="ms-sendBtn" onClick={send} disabled={!activeConversationId}>
              Send
            </button>
          </footer>
        </section>
      </div>
    </div>
  );
}