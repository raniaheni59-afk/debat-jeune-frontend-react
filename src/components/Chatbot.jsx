import React, { useState, useRef, useEffect } from "react";
import api from "../services/api";
import "./Chatbot.css";

const Chatbot = () => {
  const [messages, setMessages] = useState([
    {
      id: 1,
      text: "👋 Bonjour ! Je suis l'assistant Swafy.\nJe peux vous aider sur:\n• La plateforme Swafy & l'ATJ\n• Les débats, lives, publications\n• Sciences, culture, droits en Tunisie\n\nPosez votre question !",
      sender: "bot",
    },
  ]);
  const [input, setInput]     = useState("");
  const [loading, setLoading] = useState(false);
  const endRef                = useRef(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = async (e) => {
    e.preventDefault();
    if (!input.trim()) return;

    const userMsg = { id: Date.now(), text: input, sender: "user" };
    setMessages((p) => [...p, userMsg]);
    const sent = input;
    setInput("");
    setLoading(true);

    try {
      const res = await api.post("/chatbot", { message: sent });
      setMessages((p) => [
        ...p,
        { id: Date.now() + 1, text: res.data.reply, sender: "bot" },
      ]);
    } catch {
      setMessages((p) => [
        ...p,
        {
          id: Date.now() + 1,
          text: "❌ Erreur de connexion. Réessayez plus tard.",
          sender: "bot",
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="chatbot-container">
      <div className="chatbot-header">
        <span>🤖 Assistant Swafy</span>
        <div className="chatbot-logo">S</div>
      </div>

      <div className="chatbot-body">
        {messages.map((msg) => (
          <div key={msg.id} className={`chat-message ${msg.sender}`}>
            {msg.text.split("\n").map((line, i) => (
              <span key={i}>{line}<br /></span>
            ))}
          </div>
        ))}
        {loading && (
          <div className="chat-message bot typing">
            <span>●</span><span>●</span><span>●</span>
          </div>
        )}
        <div ref={endRef} />
      </div>

      <form className="chatbot-footer" onSubmit={handleSend}>
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Posez votre question..."
          disabled={loading}
        />
        <button type="submit" disabled={loading || !input.trim()}>
          ➤
        </button>
      </form>
    </div>
  );
};

export default Chatbot;