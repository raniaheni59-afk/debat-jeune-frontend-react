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