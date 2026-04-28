import React, { useEffect, useMemo, useRef, useState } from "react";
import { io } from "socket.io-client";
import "./messenger.css";

// Helper: تأكد token موجود عندك في حالتك
// بدّلها حسب auth عندك
function getToken() {
  return localStorage.getItem("token"); // مثال
}
const API_BASE = import.meta.env.VITE_API_BASE || "http://localhost:4000";
const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || API_BASE;

export default function MessengerPage() {
  const token = getToken();
  const [conversations, setConversations] = useState([]);
  const [activeId, setActiveId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState("");

  const socketRef = useRef(null);
  const endRef = useRef(null);

  const activeConversation = useMemo(
    () => conversations.find((c) => c._id === activeId),
    [conversations, activeId]
  );

  useEffect(() => {
    if (!token) return;

    // fetch conversations
    async function load() {
      // ensure DM with admin exists
      // if first time, create it (ignore error if admin role)
      try {
        await fetch(`${API_BASE}/api/conversations/with-admin`, {
          method: "POST",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        });
      } catch (e) {
        // ok
      }

      const res = await fetch(`${API_BASE}/api/conversations`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      setConversations(data.conversations || []);
      if (data.conversations?.length) setActiveId(data.conversations[0]._id);
    }
    load();
  }, [token]);

  useEffect(() => {
    if (!token || !activeId) return;

    // connect socket
    if (!socketRef.current) {
      const socket = io(SOCKET_URL, {
        auth: { token },
      });

      socket.on("connect", () => {
        // join active conversation later
      });

      socket.on("newMessage", (payload) => {
        const { conversationId, message } = payload;
        // update conversation preview
        setConversations((prev) =>
          prev
            .map((c) =>
              c._id === conversationId ? { ...c, lastMessage: message } : c
            )
            .sort((a, b) => {
              const ta = a.lastMessage?.createdAt ? new Date(a.lastMessage.createdAt).getTime() : 0;
              const tb = b.lastMessage?.createdAt ? new Date(b.lastMessage.createdAt).getTime() : 0;
              return tb - ta;
            })
        );

        // if active, append messages
        if (conversationId === activeId) {
          setMessages((prev) => [...prev, message]);
          setTimeout(() => endRef.current?.scrollIntoView({ behavior: "smooth" }), 0);
        }
      });

      socketRef.current = socket;
    }

    // join room and load history
    const socket = socketRef.current;
    socket.emit("joinConversation", { conversationId: activeId });

    async function loadMessages() {
      const res = await fetch(`${API_BASE}/api/conversations/${activeId}/messages`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      setMessages(data.messages || []);
      setTimeout(() => endRef.current?.scrollIntoView({ behavior: "smooth" }), 0);
    }
    loadMessages();

    // cleanup join: not necessary
  }, [token, activeId]);

  const send = async () => {
    if (!text.trim() || !activeId) return;

    const value = text.trim();
    setText("");

    // send via socket realtime
    socketRef.current?.emit("sendMessage", {
      conversationId: activeId,
      text: value,
    });

    // optional: optimistic ui could be added
  };

  const onPickConversation = (id) => {
    setActiveId(id);
    setMessages([]);
  };

  return (
    <div className="ms-page">
      <div className="ms-shell">
        {/* Sidebar */}
        <aside className="ms-sidebar">
          <div className="ms-sidebarTop">
            <div className="ms-title">Chats</div>
            <input className="ms-search" placeholder="Search..." />
          </div>

          <div className="ms-list">
            {conversations.map((c) => {
              const isActive = c._id === activeId;
              const last = c.lastMessage?.text || "No messages yet";
              return (
                <button
                  key={c._id}
                  className={"ms-chatItem " + (isActive ? "active" : "")}
                  onClick={() => onPickConversation(c._id)}
                >
                  <div className="ms-avatar">
                    {c.otherUser?.avatarUrl ? (
                      <img alt="" src={c.otherUser.avatarUrl} />
                    ) : (
                      <div className="ms-avatarFallback">{(c.otherUser?.name || "U")[0]}</div>
                    )}
                  </div>

                  <div className="ms-chatMeta">
                    <div className="ms-chatName">{c.otherUser?.name}</div>
                    <div className="ms-chatLast">{last}</div>
                  </div>
                </button>
              );
            })}
          </div>
        </aside>

        {/* Chat Window */}
        <section className="ms-main">
          <header className="ms-mainHeader">
            <div className="ms-activeUser">
              <div className="ms-avatar small">
                {activeConversation?.otherUser?.avatarUrl ? (
                  <img alt="" src={activeConversation.otherUser.avatarUrl} />
                ) : (
                  <div className="ms-avatarFallback">
                    {(activeConversation?.otherUser?.name || "A")[0]}
                  </div>
                )}
              </div>
              <div>
                <div className="ms-activeName">{activeConversation?.otherUser?.name || "Select chat"}</div>
                <div className="ms-activeSub">Online (demo)</div>
              </div>
            </div>
          </header>

          <div className="ms-messages">
            {messages.map((m) => {
              const mine = m.senderId && token; // for UI we compare ids via backend return? simple approach:
              // Better: decode token to compare userId. We'll keep simple with class by checking if senderId === decoded.
              // We'll do decode quickly:
              return null;
            })}
            <MessagesList messages={messages} token={token} />
            <div ref={endRef} />
          </div>

          <footer className="ms-inputBar">
            <button className="ms-iconBtn" type="button">+</button>
            <input
              className="ms-input"
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="Write a message..."
              onKeyDown={(e) => {
                if (e.key === "Enter") send();
              }}
              disabled={!activeId}
            />
            <button className="ms-sendBtn" onClick={send} disabled={!activeId || !text.trim()}>
              Send
            </button>
          </footer>
        </section>

        {/* Right Panel (optional) */}
        <aside className="ms-right">
          <div className="ms-rightCard">
            <div className="ms-rightTitle">Info</div>
            <div className="ms-rightText">
              DM only with <b>Admin</b>. <br />
              Users cannot message each other.
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}

function MessagesList({ messages, token }) {
  const userId = useMemo(() => {
    try {
      const payload = JSON.parse(atob(token.split(".")[1]));
      return payload.userId;
    } catch {
      return null;
    }
  }, [token]);

  return (
    <>
      {messages.map((m) => {
        const mine = userId && m.senderId?.toString() === userId.toString();
        return (
          <div key={m._id} className={"ms-bubbleRow " + (mine ? "mine" : "theirs")}>
            <div className={"ms-bubble " + (mine ? "mine" : "theirs")}>
              {m.text}
              <div className="ms-time">
                {m.createdAt ? new Date(m.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : ""}
              </div>
            </div>
          </div>
        );
      })}
    </>
  );
}