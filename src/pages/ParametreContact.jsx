import { useState } from "react";
import { useNavigate } from "react-router-dom";
import "./ParametreContact.css";

export default function ParametreContact({ onBack }) {
  const navigate = useNavigate();
  const [language, setLanguage] = useState("Français");
  const [blocked, setBlocked] = useState(false);

  const documents = [
    { id: 1, name: "photo.jpg" },
    { id: 2, name: "document.pdf" },
    { id: 3, name: "voice.mp3" },
  ];

  return (
    <div className="parametre-contact">

      <div className="pc-header">
       <button onClick={onBack}>←</button>
        <h2>Paramètres Contact</h2>
      </div>

      <div className="pc-card">
        <h3> Langue</h3>
        <select
          value={language}
          onChange={(e) => setLanguage(e.target.value)}
        >
          <option>Français</option>
          <option>English</option>
          <option>العربية</option>
        </select>
      </div>

      <div className="pc-card">
        <h3>😊 Emoji</h3>
        <div className="emoji-preview">
          😊 😂 ❤️ 👍 🔥 🎉
        </div>
      </div>

      <div className="pc-card danger">
       <button onClick={onBack}>←</button>
      </div>

      <div className="pc-card danger">
        <button>⚠️ Signaler Contact</button>
      </div>

      <div className="pc-card">
        <h3>📂 Documents</h3>
        <div className="documents">
          {documents.map((doc) => (
            <div key={doc.id} className="doc-item">
              {doc.name}
            </div>
          ))}
        </div>
      </div>

    </div>
  );
}