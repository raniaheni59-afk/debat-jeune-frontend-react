import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../services/api";
import "./PublierPage.css";

export default function PublierPage({ onBack }) {
  const navigate = useNavigate();

  const goBack = () => {
    if (onBack) onBack();
    else navigate(-1);
  };

  const [activeType, setActiveType] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const [uploadProgress, setUploadProgress] = useState(0);
const progressIntervalRef = React.useRef(null);

const startFakeProgress = () => {
  setUploadProgress(0);
  progressIntervalRef.current = setInterval(() => {
    setUploadProgress(prev => {
      if (prev >= 90) {
        clearInterval(progressIntervalRef.current);
        return 90;
      }
      return prev + Math.random() * 8;
    });
  }, 400);
};

const finishProgress = () => {
  clearInterval(progressIntervalRef.current);
  setUploadProgress(100);
  setTimeout(() => setUploadProgress(0), 500);
};

 const [formData, setFormData] = useState({
  titre_publication: "",
  contenu: "",
  question_debat: "",
});

  const [previews, setPreviews] = useState([]);

  const resetForm = () => {
    setFormData({
      titre_publication: "",
      contenu: "",
      question_debat: "",
      
    });
    setPreviews([]);
  };

  const handleFileChange = (e) => {
    const selectedFiles = Array.from(e.target.files);
    if (selectedFiles.length === 0) return;

    const newPreviews = selectedFiles.map(file => ({
      url: URL.createObjectURL(file),
      type: file.type.startsWith("image/")
        ? "image"
        : file.type.startsWith("video/")
        ? "video"
        : "pdf",
      name: file.name
    }));

    setPreviews(newPreviews);
  };

  const handleChange = (e) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }));
  };

const handleSubmit = async (e) => {
  e.preventDefault();
  setLoading(true);
  setError("");
  startFakeProgress();

  const dataToSend = new FormData();
  dataToSend.append("type_publication", activeType);

  if (activeType === "debat") {
    dataToSend.append("question_debat", formData.question_debat);
    dataToSend.append("contenu", formData.contenu || "");
  } else {
    dataToSend.append("contenu", formData.contenu);
    dataToSend.append("titre_publication", formData.titre_publication || "");
  }

  const fileInput = document.getElementById("fileInput");
  if (fileInput && fileInput.files.length > 0) {
    Array.from(fileInput.files).forEach((file) => {
      dataToSend.append("files", file);
    });
  }

  try {
    await api.post("/publications", dataToSend);
    finishProgress();
    setTimeout(() => {
      if (onBack) onBack();
      else navigate("/jeune");
    }, 300);
  } catch (err) {
    clearInterval(progressIntervalRef.current);
    setUploadProgress(0);
    setError(err.response?.data?.message || "Erreur serveur");
  } finally {
    setLoading(false);
  }
};

  return (
    <div className="publier-page">
      <div className="publier-container">

        {/* HEADER */}
        <div className="publier-header">
          <button onClick={goBack} className="btn-back">
            ← Retour
          </button>
          <h1>Créer une Publication</h1>
        </div>

        {/* SELECT TYPE */}
        <div className="type-selector">
          {["texte", "photo", "video", "pdf", "debat"].map((type) => (
            <button
              key={type}
              className={activeType === type ? "active" : ""}
              onClick={() => {
                setActiveType(type);
                resetForm();
              }}
            >
              {type === "texte" && "📝 Texte"}
              {type === "photo" && "📷 Photo"}
              {type === "video" && "🎥 Vidéo"}
              {type === "pdf" && "📄 PDF"}
              {type === "debat" && "⚖️ Question P/C"}
            </button>
          ))}
        </div>

        {/* FORMULAIRE */}
        {activeType && (
          <form onSubmit={handleSubmit} className="publier-form">

            {/* CHAMPS */}
            {activeType !== "debat" ? (
              <>
                <input
                  type="text"
                  name="titre_publication"
                  placeholder="Titre (optionnel)"
                  value={formData.titre_publication}
                  onChange={handleChange}
                />

                <textarea
                  name="contenu"
                  placeholder="Qu'est-ce que tu veux partager ?"
                  value={formData.contenu}
                  onChange={handleChange}
                  rows="4"
                />
              </>
            ) : (
              <>
  <input
    type="text"
    name="question_debat"
    placeholder="✍️ Pose ta question Pour / Contre..."
    value={formData.question_debat}
    onChange={handleChange}
    required
  />

  <textarea
    name="contenu"
    placeholder="💬 Description (optionnel) — contexte, infos supplémentaires..."
    value={formData.contenu}
    onChange={handleChange}
    rows="4"
  />
</>
            )}

            {/* UPLOAD FICHIERS */}
            {(activeType === "photo" ||
              activeType === "video" ||
              activeType === "pdf" ||
              activeType === "debat") && (
              <div className="upload-zone">
                <input
                  type="file"
                  id="fileInput"
                  multiple={activeType === "photo" || activeType === "debat"}
                  accept={
                    activeType === "photo" || activeType === "debat"
                      ? "image/*,video/*"
                      : activeType === "video"
                      ? "video/*"
                      : "application/pdf"
                  }
                  onChange={handleFileChange}
                />

                <label htmlFor="fileInput" className="upload-label">
                  📎 {activeType === "debat"
                    ? "Ajouter image ou vidéo (optionnel)"
                    : activeType === "photo"
                    ? "Choisir des photos"
                    : activeType === "video"
                    ? "Choisir une vidéo"
                    : "Choisir un PDF"}
                </label>
              </div>
            )}

            {/* APERÇUS */}
            {previews.length > 0 && (
              <div className="previews-section">
                <h3>Aperçu ({previews.length})</h3>

                <div className="previews-grid">
                  {previews.map((preview, index) => (
                    <div key={index} className="preview-item">
                      {preview.type === "image" && (
                        <img src={preview.url} alt="preview" />
                      )}
                      {preview.type === "video" && (
                        <video src={preview.url} controls />
                      )}
                      {preview.type === "pdf" && (
                        <div className="pdf-preview">📄 {preview.name}</div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* MESSAGES */}
            {error && <p className="error-message">{error}</p>}
            {success && (
              <p className="success-message">
                Publication réussie ! Redirection...
              </p>
            )}

            {loading && (
  <div style={{margin: '15px 0'}}>
    <div style={{
      background: '#e8e8f0', 
      borderRadius: '20px', 
      height: '8px',
      overflow: 'hidden'
    }}>
      <div style={{
        background: 'linear-gradient(90deg, #667eea, #764ba2)',
        width: `${uploadProgress}%`, 
        height: '8px', 
        borderRadius: '20px',
        transition: 'width 0.4s ease',
        boxShadow: '0 0 10px rgba(102,126,234,0.5)'
      }}/>
    </div>
    <p style={{
      textAlign: 'center', 
      marginTop: '8px', 
      color: '#667eea',
      fontSize: '14px',
      fontWeight: '500'
    }}>
      {Math.round(uploadProgress) < 100 
        ? `Publication en cours... ${Math.round(uploadProgress)}%`
        : '✅ Presque terminé !'}
    </p>
  </div>
)}
            {/* SUBMIT */}
            <button type="submit" className="btn-submit" disabled={loading}>
              {loading ? "Publication en cours..." : "Publier maintenant"}
            </button>
          </form>
        )}
      </div>
    </div>
  );

}