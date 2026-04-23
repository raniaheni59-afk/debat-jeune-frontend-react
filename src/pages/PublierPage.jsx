import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../services/api";
import "./PublierPage.css";

export default function PublierPage() {
  const navigate = useNavigate();

  const [activeType, setActiveType] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const [formData, setFormData] = useState({
    titre_publication: "",
    contenu: "",
    question_debat: "",
    files: []
  });

  const [previews, setPreviews] = useState([]);

  const resetForm = () => {
    setFormData({
      titre_publication: "",
      contenu: "",
      question_debat: "",
      files: []
    });
    setPreviews([]);
  };

  const handleFileChange = (e) => {
    const selectedFiles = Array.from(e.target.files);
    if (selectedFiles.length === 0) return;

    setFormData(prev => ({ ...prev, files: selectedFiles }));

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

    const dataToSend = new FormData();
    dataToSend.append("type_publication", activeType);

    if (activeType === "debat") {
  dataToSend.append("question_debat", formData.question_debat);
  dataToSend.append("contenu", formData.contenu || "");
} else {
  dataToSend.append("contenu", formData.contenu);
  dataToSend.append("titre_publication", formData.titre_publication || "");
}

    formData.files.forEach((file) => {
      dataToSend.append("files", file);
    });

    try {
      await api.post("/publications", dataToSend);
      alert("Publication créée avec succès !");
      navigate("/jeune");
    } catch (error) {
      setError(error.response?.data?.message || "Erreur serveur");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="publier-page" style={{ overflowY: "scroll", height: "100vh" }}>
      <div className="publier-container">

        {/* HEADER */}
        <div className="publier-header">
          <button onClick={() => navigate("/jeune")} className="btn-back">
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
              {type === "debat" && "⚖️ Débat"}
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
    placeholder="Pose ta question de débat..."
    value={formData.question_debat}
    onChange={handleChange}
    required
  />

  <textarea
    name="contenu"
    placeholder="Ajoute une petite description du débat (optionnel)"
    value={formData.contenu}
    onChange={handleChange}
    rows="4"
  />
</>
            )}

            {/* UPLOAD FICHIERS */}
            {(activeType === "photo" ||
              activeType === "video" ||
              activeType === "pdf") && (
              <div className="upload-zone">
                <input
                  type="file"
                  id="fileInput"
                  multiple={activeType === "photo"}
                  accept={
                    activeType === "photo"
                      ? "image/*"
                      : activeType === "video"
                      ? "video/*"
                      : "application/pdf"
                  }
                  onChange={handleFileChange}
                />

                <label htmlFor="fileInput" className="upload-label">
                  Choisir{" "}
                  {activeType === "photo"
                    ? "des photos"
                    : activeType === "video"
                    ? "une vidéo"
                    : "un PDF"}
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
