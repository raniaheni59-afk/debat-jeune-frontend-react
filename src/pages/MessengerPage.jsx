import React, { useEffect, useMemo, useRef, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { io } from "socket.io-client";
import API from "../services/api";

const BACKEND = API.defaults.baseURL?.split("/api")[0] || "";

function decodeUserId(token) {
  if (!token) return null;
  try {
    const payload = JSON.parse(atob(token.split(".")[1]));
    return String(payload.userId ?? payload.id_user ?? payload.id ?? payload.sub ?? "");
  } catch { return null; }
}

function getAvatar(avatarUrl, name = "U") {
  if (avatarUrl) return avatarUrl.startsWith("http") ? avatarUrl : `${BACKEND}${avatarUrl}`;
  return `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=7c5cfc&color=fff&size=128`;
}

export default function MessengerPage() {
  const navigate = useNavigate();
  const token = localStorage.getItem("token");
  const userId = useMemo(() => decodeUserId(token), [token]);
  const SOCKET_URL = BACKEND || "https://debat-jeune-production.up.railway.app";

  const [query, setQuery] = useState("");
  const [searchUsers, setSearchUsers] = useState([]);
  const [conversations, setConversations] = useState([]);
  const [activeConversationId, setActiveConversationId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState("");
  const [file, setFile] = useState(null);
  const [filePreview, setFilePreview] = useState(null);
  const [sending, setSending] = useState(false);
  const [gallery, setGallery] = useState({ photos: [], videos: [] });
  const [loadingGallery, setLoadingGallery] = useState(false);

  const socketRef = useRef(null);
  const fileInputRef = useRef(null);
  const messagesEndRef = useRef(null);

  const activeConversation = useMemo(
    () => conversations.find(c => c._id === activeConversationId) || null,
    [conversations, activeConversationId]
  );

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Socket
  useEffect(() => {
    if (!token) return;
    const socket = io(SOCKET_URL, { auth: { token }, transports: ["websocket"] });
    socketRef.current = socket;

    socket.on("newMessage", ({ conversationId, message }) => {
      if (String(conversationId) === String(activeConversationId)) {
        setMessages(prev => [...prev, message]);
      }
      setConversations(prev =>
        prev.map(c => c._id === conversationId ? { ...c, lastMessage: message } : c)
      );
    });

    return () => socket.disconnect();
  }, [token, SOCKET_URL, activeConversationId]);

  // Load conversations
  useEffect(() => {
    if (!token) return;
    (async () => {
      const res = await API.get("/messenger/conversations");
      const convs = res.data.conversations || [];
      setConversations(convs);
      if (!activeConversationId && convs[0]?._id) {
        setActiveConversationId(convs[0]._id);
      }
    })();
  }, [token]);

  // Load messages when active changes
  useEffect(() => {
    if (!token || !activeConversationId) return;
    (async () => {
      const res = await API.get(`/messenger/conversations/${activeConversationId}/messages`);
      setMessages(res.data.messages || []);
    })();
    socketRef.current?.emit("joinConversation", { conversationId: activeConversationId });
  }, [token, activeConversationId]);

  // Load gallery when active conversation changes
  useEffect(() => {
    if (!activeConversation?.otherUser?._id) return;
    setLoadingGallery(true);
    API.get(`/messenger/users/${activeConversation.otherUser._id}/gallery`)
      .then(res => setGallery(res.data))
      .catch(() => setGallery({ photos: [], videos: [] }))
      .finally(() => setLoadingGallery(false));
  }, [activeConversation?.otherUser?._id]);

  // Search users debounce
  useEffect(() => {
    if (!token) return;
    const t = setTimeout(async () => {
      const q = query.trim();
      if (q.length < 2) { setSearchUsers([]); return; }
      const res = await API.get(`/messenger/users/search?q=${encodeURIComponent(q)}`);
      setSearchUsers(res.data.users || []);
    }, 300);
    return () => clearTimeout(t);
  }, [query, token]);

  const ensureConversationAndOpen = async (otherUserId) => {
    const res = await API.post("/messenger/conversations/ensure", { otherUserId });
    const convId = res.data.conversationId;
    const convRes = await API.get("/messenger/conversations");
    setConversations(convRes.data.conversations || []);
    setActiveConversationId(convId);
    setQuery(""); setSearchUsers([]);
  };

  const handleFileChange = (e) => {
    const f = e.target.files?.[0];
    if (!f) return;
    setFile(f);
    if (f.type.startsWith("image/")) {
      const reader = new FileReader();
      reader.onload = ev => setFilePreview(ev.target.result);
      reader.readAsDataURL(f);
    } else {
      setFilePreview(null);
    }
  };

  const removeFile = () => {
    setFile(null); setFilePreview(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const send = async () => {
    if (!activeConversationId || sending) return;
    if (!text.trim() && !file) return;
    setSending(true);
    try {
      const form = new FormData();
      form.append("text", text);
      if (file) form.append("file", file);
      const res = await API.post(
        `/messenger/conversations/${activeConversationId}/messages`,
        form,
        { headers: { "Content-Type": "multipart/form-data" } }
      );
      setMessages(prev => [...prev, res.data.message]);
      setText(""); removeFile();
    } catch (err) {
      console.error("send error:", err);
    } finally {
      setSending(false);
    }
  };

  const formatTime = (d) => {
    if (!d) return "";
    return new Date(d).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" });
  };
  const formatDate = (d) => {
    if (!d) return "";
    return new Date(d).toLocaleDateString("fr-FR", { day: "2-digit", month: "short" });
  };

  const lastMsg = (c) => {
    if (!c.lastMessage) return "Nouvelle conversation";
    if (c.lastMessage.type === "image") return "📷 Photo";
    if (c.lastMessage.type === "video") return "🎥 Vidéo";
    return c.lastMessage.text || "…";
  };

  return (
    <div className="ms-page">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@400;500;600;700;800&family=Syne:wght@700;800&display=swap');
        .ms-page { all: initial; display: block; font-family: 'Outfit', sans-serif; }
        .ms-page * { box-sizing: border-box; margin: 0; padding: 0; }
        .ms-page button { font-family: 'Outfit', sans-serif; cursor: pointer; border: none; background: none; }
        .ms-page input { font-family: 'Outfit', sans-serif; }

        .ms-page {
          min-height: 100vh; width: 100%;
          background: #0d0d1a;
          display: flex; justify-content: center; align-items: stretch;
          color: #e8ecff;
        }
        /* orb */
        .ms-orb { position: fixed; border-radius: 50%; filter: blur(80px); pointer-events: none; z-index: 0; opacity:.45; }
        .ms-orb1 { width:500px;height:500px;background:radial-gradient(circle,rgba(124,92,252,.2) 0%,transparent 70%);top:-100px;left:-80px; }
        .ms-orb2 { width:350px;height:350px;background:radial-gradient(circle,rgba(79,163,247,.15) 0%,transparent 70%);bottom:0;right:60px; }

        .ms-shell {
          width: 100%; max-width: 1400px;
          height: 100vh;
          display: grid;
          grid-template-columns: 300px 1fr 280px;
          position: relative; z-index: 1;
        }

        /* ── SIDEBAR ── */
        .ms-sidebar {
          display: flex; flex-direction: column;
          background: rgba(18,18,43,0.88);
          backdrop-filter: blur(24px);
          border-right: 1px solid rgba(255,255,255,.09);
        }
        .ms-sidebar-top {
          padding: 20px 16px 14px;
          border-bottom: 1px solid rgba(255,255,255,.07);
        }
        .ms-sidebar-header {
          display: flex; align-items: center; gap: 10px; margin-bottom: 14px;
        }
        .ms-back-btn {
          width: 32px; height: 32px; border-radius: 8px;
          background: rgba(124,92,252,.15); color: #a78bfa;
          border: 1px solid rgba(124,92,252,.25);
          display: flex; align-items: center; justify-content: center;
          font-size: 14px; transition: all .2s;
        }
        .ms-back-btn:hover { background: rgba(124,92,252,.3); }
        .ms-title {
          font-family: 'Syne', sans-serif; font-size: 17px; font-weight: 800;
          background: linear-gradient(90deg,#fff,#a78bfa);
          -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text;
        }
        .ms-search {
          width: 100%; padding: 10px 14px; border-radius: 12px;
          border: 1px solid rgba(255,255,255,.10);
          background: rgba(255,255,255,.05); color: #e8ecff;
          outline: none; font-size: 13px; transition: border-color .2s;
        }
        .ms-search:focus { border-color: rgba(124,92,252,.4); }
        .ms-search::placeholder { color: rgba(232,236,255,.4); }
        .ms-list { flex: 1; overflow-y: auto; padding: 8px; scrollbar-width: thin; scrollbar-color: rgba(124,92,252,.2) transparent; }
        .ms-list::-webkit-scrollbar { width: 3px; }
        .ms-list::-webkit-scrollbar-thumb { background: rgba(124,92,252,.3); border-radius: 4px; }
        .ms-subtitle { font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 1.5px; color: rgba(167,139,250,.7); padding: 8px 8px 4px; }
        .ms-empty { opacity: .6; padding: 24px; text-align: center; font-size: 13px; }

        .ms-chat-item {
          width: 100%; display: flex; gap: 10px; align-items: center;
          padding: 11px 10px; border-radius: 12px;
          border: 1px solid transparent; background: transparent;
          color: #e8ecff; text-align: left; margin-bottom: 4px;
          transition: all .18s;
        }
        .ms-chat-item:hover { background: rgba(255,255,255,.06); border-color: rgba(255,255,255,.09); }
        .ms-chat-item.active { background: rgba(124,92,252,.18); border-color: rgba(124,92,252,.35); }
        .ms-chat-item .ms-ava { width:42px;height:42px;border-radius:50%;overflow:hidden;border:2px solid rgba(255,255,255,.12);flex-shrink:0;background:rgba(255,255,255,.06); }
        .ms-chat-item .ms-ava img { width:100%;height:100%;object-fit:cover; }
        .ms-chat-meta { flex:1;min-width:0; }
        .ms-chat-name { font-size:13px;font-weight:700;color:#e8ecff;white-space:nowrap;overflow:hidden;text-overflow:ellipsis; }
        .ms-chat-last { font-size:11.5px;color:rgba(232,236,255,.55);white-space:nowrap;overflow:hidden;text-overflow:ellipsis;margin-top:2px; }
        .ms-chat-time { font-size:10px;color:rgba(232,236,255,.4);flex-shrink:0; }

        /* ── MAIN CHAT ── */
        .ms-main {
          display: flex; flex-direction: column;
          background: rgba(0,0,0,.08);
          border-right: 1px solid rgba(255,255,255,.07);
        }
        .ms-main-header {
          padding: 16px 20px; border-bottom: 1px solid rgba(255,255,255,.07);
          background: rgba(18,18,43,.6); backdrop-filter: blur(16px);
          display: flex; align-items: center; justify-content: space-between; flex-shrink: 0;
        }
        .ms-active-user { display:flex;gap:12px;align-items:center; }
        .ms-active-ava { width:42px;height:42px;border-radius:50%;overflow:hidden;border:2px solid rgba(124,92,252,.4);flex-shrink:0; }
        .ms-active-ava img { width:100%;height:100%;object-fit:cover; }
        .ms-active-name { font-size:15px;font-weight:700; }
        .ms-active-sub { font-size:11.5px;color:rgba(232,236,255,.55);margin-top:1px; }
        .ms-online-dot { width:8px;height:8px;border-radius:50%;background:#34d399;display:inline-block;margin-right:5px; }

        .ms-messages {
          flex: 1; padding: 20px; overflow-y: auto;
          display: flex; flex-direction: column; gap: 8px;
          scrollbar-width: thin; scrollbar-color: rgba(124,92,252,.2) transparent;
        }
        .ms-messages::-webkit-scrollbar { width: 3px; }
        .ms-messages::-webkit-scrollbar-thumb { background: rgba(124,92,252,.3); border-radius: 4px; }

        .ms-date-divider {
          text-align: center; font-size: 11px; color: rgba(232,236,255,.35);
          font-weight: 600; margin: 8px 0; letter-spacing: .5px;
        }
        .ms-bubble-row { display:flex; align-items:flex-end; gap:8px; }
        .ms-bubble-row.mine { justify-content:flex-end; }
        .ms-bubble-row.theirs { justify-content:flex-start; }
        .ms-bubble-row .ms-ava-sm { width:28px;height:28px;border-radius:50%;overflow:hidden;flex-shrink:0;border:1px solid rgba(255,255,255,.1); }
        .ms-bubble-row .ms-ava-sm img { width:100%;height:100%;object-fit:cover; }

        .ms-bubble {
          max-width: 65%; padding: 11px 14px;
          border-radius: 18px; line-height: 1.45; font-size: 14px;
          border: 1px solid rgba(255,255,255,.1);
          box-shadow: 0 4px 16px rgba(0,0,0,.18);
          word-break: break-word;
        }
        .ms-bubble.mine {
          background: linear-gradient(135deg, rgba(124,92,252,.35), rgba(79,163,247,.25));
          border-color: rgba(124,92,252,.4);
          border-bottom-right-radius: 4px;
        }
        .ms-bubble.theirs {
          background: rgba(255,255,255,.07);
          border-color: rgba(255,255,255,.12);
          border-bottom-left-radius: 4px;
        }
        .ms-time { margin-top: 5px; font-size: 10.5px; color: rgba(232,236,255,.45); text-align: right; }
        .ms-bubble.theirs .ms-time { text-align: left; }
        .ms-attach-img { width:220px;max-width:100%;border-radius:12px;display:block;cursor:pointer;transition:opacity .2s; }
        .ms-attach-img:hover { opacity:.85; }
        .ms-attach-video { width:260px;max-width:100%;border-radius:12px;display:block; }

        /* file preview */
        .ms-file-preview {
          margin: 0 20px 0; padding: 10px 14px;
          background: rgba(124,92,252,.12); border: 1px solid rgba(124,92,252,.25);
          border-radius: 12px; display: flex; align-items: center; gap: 10px;
        }
        .ms-file-preview img { width:50px;height:50px;object-fit:cover;border-radius:8px; }
        .ms-file-preview span { font-size:12px;color:#a78bfa;flex:1; }
        .ms-file-preview button { color:rgba(244,114,182,.8);font-size:16px;padding:0 4px; }

        /* input bar */
        .ms-input-bar {
          padding: 14px 20px; border-top: 1px solid rgba(255,255,255,.07);
          background: rgba(18,18,43,.6); backdrop-filter: blur(16px);
          display: flex; gap: 10px; align-items: center; flex-shrink: 0;
        }
        .ms-attach-btn {
          width: 40px; height: 40px; border-radius: 12px; flex-shrink: 0;
          background: rgba(255,255,255,.06); border: 1px solid rgba(255,255,255,.10);
          color: #a78bfa; font-size: 18px;
          display: flex; align-items: center; justify-content: center;
          transition: all .2s;
        }
        .ms-attach-btn:hover { background: rgba(124,92,252,.18); border-color: rgba(124,92,252,.3); }
        .ms-text-input {
          flex: 1; border-radius: 14px; border: 1px solid rgba(255,255,255,.10);
          background: rgba(255,255,255,.06); color: #e8ecff;
          padding: 10px 16px; outline: none; font-size: 14px;
          transition: border-color .2s;
        }
        .ms-text-input:focus { border-color: rgba(124,92,252,.4); }
        .ms-text-input::placeholder { color: rgba(232,236,255,.35); }
        .ms-text-input:disabled { opacity: .5; }
        .ms-send-btn {
          height: 40px; padding: 0 20px; border-radius: 12px;
          background: linear-gradient(135deg, #7c5cfc, #4fa3f7);
          color: white; font-weight: 700; font-size: 13px;
          box-shadow: 0 4px 14px rgba(124,92,252,.35);
          transition: all .2s; white-space: nowrap;
        }
        .ms-send-btn:hover:not(:disabled) { transform: translateY(-1px); box-shadow: 0 6px 20px rgba(124,92,252,.45); }
        .ms-send-btn:disabled { opacity: .5; cursor: not-allowed; }

        /* empty chat */
        .ms-empty-chat {
          flex: 1; display: flex; flex-direction: column;
          align-items: center; justify-content: center;
          color: rgba(232,236,255,.35); gap: 12px;
        }
        .ms-empty-chat-icon { font-size: 48px; opacity: .5; }

        /* ── RIGHT PANEL ── */
        .ms-right {
          display: flex; flex-direction: column;
          background: rgba(18,18,43,.75);
          backdrop-filter: blur(24px);
          overflow-y: auto; scrollbar-width: none;
        }
        .ms-right::-webkit-scrollbar { display: none; }
        .ms-right-inner { padding: 20px 16px; display: flex; flex-direction: column; gap: 16px; }
        .ms-right-avatar-wrap { display: flex; flex-direction: column; align-items: center; gap: 10px; }
        .ms-right-avatar { width: 76px; height: 76px; border-radius: 50%; border: 3px solid rgba(124,92,252,.5); object-fit: cover; }
        .ms-right-name { font-family: 'Syne', sans-serif; font-size: 16px; font-weight: 800; text-align: center; }
        .ms-right-email { font-size: 12px; color: rgba(232,236,255,.5); text-align: center; }
        .ms-right-view-btn {
          width: 100%; padding: 9px; border-radius: 10px;
          background: rgba(124,92,252,.15); color: #a78bfa;
          border: 1px solid rgba(124,92,252,.25);
          font-size: 12px; font-weight: 700; transition: all .2s;
        }
        .ms-right-view-btn:hover { background: rgba(124,92,252,.28); }
        .ms-divider { height: 1px; background: rgba(255,255,255,.07); }
        .ms-right-section-title { font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 1.5px; color: rgba(167,139,250,.7); }
        .ms-photo-grid { display: grid; grid-template-columns: repeat(3,1fr); gap: 3px; }
        .ms-photo-thumb { aspect-ratio:1; border-radius:6px; overflow:hidden; cursor:pointer; }
        .ms-photo-thumb img { width:100%;height:100%;object-fit:cover;transition:opacity .2s; }
        .ms-photo-thumb:hover img { opacity:.8; }
        .ms-no-media { font-size:12px;color:rgba(232,236,255,.35);text-align:center;padding:16px 0; }

        /* user result */
        .ms-user-result {
          width: 100%; display: flex; gap: 10px; align-items: center;
          padding: 10px; border-radius: 12px;
          border: 1px solid rgba(255,255,255,.10);
          background: rgba(255,255,255,.05);
          color: #e8ecff; cursor: pointer; margin-bottom: 6px;
          text-align: left; transition: background .18s;
        }
        .ms-user-result:hover { background: rgba(255,255,255,.10); }

        /* image lightbox */
        .ms-lightbox { position:fixed;inset:0;background:rgba(0,0,0,.92);z-index:9999;display:flex;align-items:center;justify-content:center;backdrop-filter:blur(4px); }
        .ms-lightbox img { max-width:90vw;max-height:88vh;object-fit:contain;border-radius:12px; }
        .ms-lightbox-close { position:absolute;top:20px;right:20px;background:rgba(255,255,255,.1);border:1px solid rgba(255,255,255,.2);color:white;font-size:20px;width:40px;height:40px;border-radius:50%;display:flex;align-items:center;justify-content:center; }

        @media (max-width:1100px) { .ms-shell { grid-template-columns: 280px 1fr; } .ms-right { display:none; } }
        @media (max-width:700px) { .ms-shell { grid-template-columns: 1fr; } .ms-sidebar { display:none; } }
      `}</style>

      <div className="ms-orb ms-orb1" />
      <div className="ms-orb ms-orb2" />

      <div className="ms-shell">
        {/* ── SIDEBAR ── */}
        <aside className="ms-sidebar">
          <div className="ms-sidebar-top">
            <div className="ms-sidebar-header">
              <button className="ms-back-btn" onClick={() => navigate("/jeune")}>←</button>
              <span className="ms-title">Messages</span>
            </div>
            <input
              className="ms-search"
              placeholder="Rechercher un utilisateur…"
              value={query}
              onChange={e => setQuery(e.target.value)}
            />
          </div>

          <div className="ms-list">
            {searchUsers.length > 0 ? (
              <>
                <div className="ms-subtitle">Résultats</div>
                {searchUsers.map(u => (
                  <button key={u._id} className="ms-user-result" onClick={() => ensureConversationAndOpen(u._id)}>
                    <div className="ms-ava">
                      <img src={getAvatar(u.avatarUrl, u.name)} alt="" onError={e => e.target.src = getAvatar("", u.name)} />
                    </div>
                    <div className="ms-chat-meta">
                      <div className="ms-chat-name">{u.name}</div>
                      <div className="ms-chat-last">{u.email}</div>
                    </div>
                  </button>
                ))}
              </>
            ) : conversations.length === 0 ? (
              <div className="ms-empty">Aucune conversation — recherchez un utilisateur ↑</div>
            ) : (
              conversations.map(c => (
                <button
                  key={c._id}
                  className={`ms-chat-item ${c._id === activeConversationId ? "active" : ""}`}
                  onClick={() => setActiveConversationId(c._id)}
                >
                  <div className="ms-ava">
                    <img src={getAvatar(c.otherUser?.avatarUrl, c.otherUser?.name)} alt=""
                      onError={e => e.target.src = getAvatar("", c.otherUser?.name)} />
                  </div>
                  <div className="ms-chat-meta">
                    <div className="ms-chat-name">{c.otherUser?.name || "Utilisateur"}</div>
                    <div className="ms-chat-last">{lastMsg(c)}</div>
                  </div>
                  {c.lastMessage?.createdAt && (
                    <span className="ms-chat-time">{formatDate(c.lastMessage.createdAt)}</span>
                  )}
                </button>
              ))
            )}
          </div>
        </aside>

        {/* ── MAIN CHAT ── */}
        <section className="ms-main">
          <header className="ms-main-header">
            {activeConversation ? (
              <div className="ms-active-user">
                <div className="ms-active-ava">
                  <img src={getAvatar(activeConversation.otherUser?.avatarUrl, activeConversation.otherUser?.name)} alt=""
                    onError={e => e.target.src = getAvatar("", activeConversation.otherUser?.name)} />
                </div>
                <div>
                  <div className="ms-active-name">{activeConversation.otherUser?.name}</div>
                  <div className="ms-active-sub">
                    <span className="ms-online-dot" />
                    {activeConversation.otherUser?.email}
                  </div>
                </div>
              </div>
            ) : (
              <div className="ms-active-user">
                <div className="ms-active-name" style={{ color: "rgba(232,236,255,.5)" }}>
                  Sélectionnez une conversation
                </div>
              </div>
            )}
          </header>

          {/* Messages */}
          {activeConversationId ? (
            <>
              <div className="ms-messages">
                {messages.map((m, i) => {
                  const mine = userId && String(m.senderId) === String(userId);
                  const showDate = i === 0 || formatDate(m.createdAt) !== formatDate(messages[i - 1]?.createdAt);
                  return (
                    <React.Fragment key={m.id || i}>
                      {showDate && <div className="ms-date-divider">{formatDate(m.createdAt)}</div>}
                      <div className={`ms-bubble-row ${mine ? "mine" : "theirs"}`}>
                        {!mine && (
                          <div className="ms-ava-sm">
                            <img src={getAvatar(activeConversation?.otherUser?.avatarUrl, activeConversation?.otherUser?.name)} alt="" />
                          </div>
                        )}
                        <div className={`ms-bubble ${mine ? "mine" : "theirs"}`}>
                          {m.type === "text" && <div>{m.text}</div>}
                          {m.type === "image" && (
                            <img className="ms-attach-img" src={m.attachmentUrl?.startsWith("http") ? m.attachmentUrl : `${BACKEND}${m.attachmentUrl}`} alt="" />
                          )}
                          {m.type === "video" && (
                            <video className="ms-attach-video" controls>
                              <source src={m.attachmentUrl?.startsWith("http") ? m.attachmentUrl : `${BACKEND}${m.attachmentUrl}`} />
                            </video>
                          )}
                          <div className="ms-time">{formatTime(m.createdAt)}</div>
                        </div>
                      </div>
                    </React.Fragment>
                  );
                })}
                <div ref={messagesEndRef} />
              </div>

              {/* File preview */}
              {file && (
                <div className="ms-file-preview">
                  {filePreview ? <img src={filePreview} alt="preview" /> : <span style={{ fontSize: 28 }}>📎</span>}
                  <span>{file.name}</span>
                  <button onClick={removeFile}>✕</button>
                </div>
              )}

              {/* Input bar */}
              <footer className="ms-input-bar">
                <button className="ms-attach-btn" onClick={() => fileInputRef.current?.click()} title="Joindre">
                  +
                </button>
                <input ref={fileInputRef} type="file" accept="image/*,video/*" style={{ display: "none" }} onChange={handleFileChange} />
                <input
                  className="ms-text-input"
                  value={text}
                  onChange={e => setText(e.target.value)}
                  placeholder="Écrire un message…"
                  onKeyDown={e => e.key === "Enter" && !e.shiftKey && send()}
                />
                <button className="ms-send-btn" onClick={send} disabled={sending || (!text.trim() && !file)}>
                  {sending ? "…" : "Envoyer →"}
                </button>
              </footer>
            </>
          ) : (
            <div className="ms-empty-chat">
              <div className="ms-empty-chat-icon">💬</div>
              <p>Sélectionnez ou démarrez une conversation</p>
            </div>
          )}
        </section>

        {/* ── RIGHT PANEL ── */}
        <aside className="ms-right">
          <div className="ms-right-inner">
            {activeConversation ? (
              <>
                <div className="ms-right-avatar-wrap">
                  <img
                    className="ms-right-avatar"
                    src={getAvatar(activeConversation.otherUser?.avatarUrl, activeConversation.otherUser?.name)}
                    alt=""
                    onError={e => e.target.src = getAvatar("", activeConversation.otherUser?.name)}
                  />
                  <div className="ms-right-name">{activeConversation.otherUser?.name}</div>
                  <div className="ms-right-email">{activeConversation.otherUser?.email}</div>
                  <button
                    className="ms-right-view-btn"
                    onClick={() => navigate(`/profile/${activeConversation.otherUser?._id}`)}
                  >
                    Voir le profil →
                  </button>
                </div>

                <div className="ms-divider" />

                {/* Photo gallery */}
                <div className="ms-right-section-title">Photos partagées</div>
                {loadingGallery ? (
                  <div className="ms-no-media">Chargement…</div>
                ) : gallery.photos.length > 0 ? (
                  <div className="ms-photo-grid">
                    {gallery.photos.slice(0, 9).map((p, i) => (
                      <div key={i} className="ms-photo-thumb">
                        <img
                          src={p.url_media?.startsWith("http") ? p.url_media : `${BACKEND}${p.url_media}`}
                          alt=""
                        />
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="ms-no-media">Aucune photo publiée</div>
                )}

                {gallery.videos.length > 0 && (
                  <>
                    <div className="ms-divider" />
                    <div className="ms-right-section-title">Vidéos ({gallery.videos.length})</div>
                    <div className="ms-no-media" style={{ color: "#a78bfa" }}>
                      {gallery.videos.length} vidéo{gallery.videos.length > 1 ? "s" : ""} publiée{gallery.videos.length > 1 ? "s" : ""}
                    </div>
                  </>
                )}
              </>
            ) : (
              <div className="ms-no-media" style={{ paddingTop: 40 }}>
                Sélectionnez une conversation
              </div>
            )}
          </div>
        </aside>
      </div>
    </div>
  );
}
