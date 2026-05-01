import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import API from "../services/api";

// ✅ CSS داخل نفس الملف
const styles = `
  @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&display=swap');
  * { margin: 0; padding: 0; box-sizing: border-box; }
  .new-live-wrapper {
    min-height: 100vh;
    background: linear-gradient(135deg, #1a0533 0%, #2d0f5e 50%, #1a0533 100%);
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 40px 20px;
    font-family: 'Inter', sans-serif;
  }
  .new-live-container {
    background: rgba(255, 255, 255, 0.05);
    backdrop-filter: blur(20px);
    border: 1px solid rgba(255, 255, 255, 0.1);
    border-radius: 24px;
    width: 100%;
    max-width: 720px;
    padding: 48px;
    box-shadow: 0 25px 60px rgba(0, 0, 0, 0.4);
  }
  .new-live-header { text-align: center; margin-bottom: 40px; }
  .header-badge {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    background: linear-gradient(135deg, #8b2fc9, #c44dff);
    color: white;
    padding: 8px 20px;
    border-radius: 50px;
    font-size: 12px;
    font-weight: 700;
    letter-spacing: 2px;
    margin-bottom: 20px;
    text-transform: uppercase;
  }
  .live-dot {
    width: 10px; height: 10px; background: #ff4444;
    border-radius: 50%; animation: pulseDot 1.5s infinite;
  }
  @keyframes pulseDot { 0%, 100% { opacity: 1; transform: scale(1); } 50% { opacity: 0.5; transform: scale(1.4); } }
  .new-live-header h1 {
    font-size: 28px; font-weight: 800; color: #fff; margin: 0 0 12px 0;
    background: linear-gradient(135deg, #fff, #d4a8ff);
    -webkit-background-clip: text; -webkit-text-fill-color: transparent;
  }
  .new-live-header p { color: rgba(255,255,255,0.55); font-size: 14px; }
  .divider { width: 60px; height: 3px; background: linear-gradient(135deg, #8b2fc9, #c44dff); border-radius: 10px; margin: 16px auto 0; }
  .new-live-form { display: flex; flex-direction: column; gap: 22px; }
  .form-group { display: flex; flex-direction: column; gap: 8px; }
  .form-row { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; }
  .nl-label { color: rgba(255,255,255,0.85); font-size: 13px; font-weight: 600; display: flex; align-items: center; gap: 8px; }
  .required { color: #ff6b9d; margin-left: 2px; }
  .nl-input, .nl-textarea, .nl-select {
    background: rgba(255,255,255,0.06); border: 1px solid rgba(255,255,255,0.12);
    border-radius: 12px; color: #fff; font-size: 14px; padding: 14px 18px;
    outline: none; width: 100%; font-family: 'Inter', sans-serif;
  }
  .nl-input::placeholder { color: rgba(255,255,255,0.28); }
  .nl-input:focus, .nl-textarea:focus, .nl-select:focus {
    border-color: #a855f7; background: rgba(168,85,247,0.1);
    box-shadow: 0 0 0 3px rgba(168,85,247,0.18);
  }
  .nl-select option { background: #2d0f5e; color: #fff; }
  .nl-textarea { resize: vertical; min-height: 115px; }
  .error-msg { color: #ff7070; font-size: 12px; font-weight: 500; padding-left: 4px; }
  .form-actions { display: flex; justify-content: flex-end; gap: 14px; margin-top: 8px; padding-top: 8px; border-top: 1px solid rgba(255,255,255,0.07); }
  .nl-btn-cancel {
    background: rgba(255,255,255,0.07); border: 1px solid rgba(255,255,255,0.18);
    color: rgba(255,255,255,0.75); padding: 13px 28px; border-radius: 12px;
    font-size: 14px; font-weight: 600; cursor: pointer; transition: all 0.3s;
  }
  .nl-btn-cancel:hover { background: rgba(255,255,255,0.13); color: #fff; transform: translateY(-2px); }
  .nl-btn-submit {
    background: linear-gradient(135deg, #8b2fc9, #c44dff); border: none; color: white;
    padding: 13px 32px; border-radius: 12px; font-size: 14px; font-weight: 700;
    cursor: pointer; transition: all 0.3s; box-shadow: 0 4px 20px rgba(138,43,226,0.4);
  }
  .nl-btn-submit:hover { transform: translateY(-3px); box-shadow: 0 8px 30px rgba(138,43,226,0.6); }
  .confirm-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.72); backdrop-filter: blur(10px); display: flex; align-items: center; justify-content: center; z-index: 9999; }
  .confirm-modal {
    background: linear-gradient(145deg, #1e0645, #2d0f5e); border: 1px solid rgba(168,85,247,0.3);
    border-radius: 24px; padding: 48px 40px; max-width: 500px; width: 90%; text-align: center;
    animation: slideUpModal 0.35s cubic-bezier(0.34, 1.56, 0.64, 1);
  }
  @keyframes slideUpModal { from { opacity: 0; transform: translateY(40px) scale(0.95); } to { opacity: 1; transform: translateY(0) scale(1); } }
  .confirm-emoji { font-size: 54px; margin-bottom: 18px; animation: bounceIn 0.5s; }
  @keyframes bounceIn { from { transform: scale(0); } to { transform: scale(1); } }
  .confirm-modal h2 { color: #fff; font-size: 22px; font-weight: 800; margin: 0 0 10px 0; background: linear-gradient(135deg, #fff, #d4a8ff); -webkit-background-clip: text; -webkit-text-fill-color: transparent; }
  .confirm-modal p { color: rgba(255,255,255,0.65); font-size: 14px; line-height: 1.7; margin: 0 0 24px 0; }
  .confirm-modal p strong { color: #d4a8ff; font-weight: 600; }
  .confirm-details-box { background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.1); border-radius: 14px; padding: 18px 20px; margin-bottom: 28px; text-align: left; }
  .confirm-detail-row { display: flex; align-items: flex-start; gap: 10px; color: rgba(255,255,255,0.7); font-size: 13px; line-height: 1.5; }
  .confirm-detail-label { color: rgba(255,255,255,0.4); font-size: 11px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px; display: block; margin-bottom: 2px; }
  .confirm-detail-value { color: rgba(255,255,255,0.85); font-size: 13px; font-weight: 500; word-break: break-all; }
  .confirm-actions { display: flex; gap: 14px; justify-content: center; }
  .nl-btn-confirm {
    background: linear-gradient(135deg, #8b2fc9, #c44dff); border: none; color: white;
    padding: 13px 36px; border-radius: 12px; font-size: 14px; font-weight: 700; cursor: pointer;
    transition: all 0.3s; box-shadow: 0 4px 20px rgba(138,43,226,0.4);
  }
  .nl-btn-confirm:disabled { opacity: 0.65; cursor: not-allowed; transform: none; }
  .spinner { width: 17px; height: 17px; border: 2px solid rgba(255,255,255,0.3); border-top-color: #fff; border-radius: 50%; animation: spin 0.75s linear infinite; display: inline-block; }
  @keyframes spin { to { transform: rotate(360deg); } }
  @media (max-width: 640px) {
    .new-live-container { padding: 30px 22px; border-radius: 18px; }
    .new-live-header h1 { font-size: 22px; }
    .form-row { grid-template-columns: 1fr; gap: 22px; }
    .form-actions { flex-direction: column-reverse; }
    .nl-btn-cancel, .nl-btn-submit { width: 100%; justify-content: center; }
  }
`;

export default function NewLive({ onSuccess, onError, onCancel } = {}) {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({ title: "", description: "", link: "", date: "", time: "", thematique: "" });
  const [errors, setErrors] = useState({});
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  const thematiques = ["Sciences & Innovation", "Environnement & Développement Durable", "Technologie & Numérique", "Santé & Bien-être", "Éducation & Formation", "Citoyenneté & Société", "Autre"];

  const validate = () => {
    const newErrors = {};
    if (!formData.title.trim()) newErrors.title = "Le titre est obligatoire.";
    if (!formData.description.trim()) newErrors.description = "La description est obligatoire.";
    if (!formData.link.trim()) newErrors.link = "Le lien de diffusion est obligatoire.";
    else if (!/^https?:\/\/.+/.test(formData.link.trim())) newErrors.link = "Le lien de diffusion n'est pas valide.";
    if (!formData.date) newErrors.date = "La date est obligatoire.";
    else {
      const selectedDateTime = new Date(`${formData.date}T${formData.time || "00:00"}`);
      if (selectedDateTime < new Date()) newErrors.date = "Veuillez saisir une date future.";
    }
    if (!formData.time) newErrors.time = "L'heure est obligatoire.";
    if (!formData.thematique) newErrors.thematique = "La thématique est obligatoire.";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    setErrors((prev) => ({ ...prev, [name]: "" }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (validate()) setShowConfirm(true);
  };

    // ✅ دالة التأكيد النهائية (مع التحويل للصفحة)
 // ✅ Fonction handleConfirm modifiée
const handleConfirm = async () => {
  setLoading(true);

  try {
    const res = await API.post("/lives/session/create", {
      title: formData.title,
      description: formData.description,
      date: formData.date,
      time: formData.time,
      thematique: formData.thematique,
      status: "Programmé",
      category: "other",
    });

    console.log("✅ Live créé avec succès:", res.data);

    setShowConfirm(false);
    setLoading(false);

    // ✅ Redirection vers CalendarPage avec message de succès
    navigate("/calendar", {
      state: {
        message: `✅ Live "${formData.title}" programmé avec succès !`,
        refresh: true,
      },
    });
  } catch (err) {
    console.log("❌ Erreur:", err.response?.data || err.message);
    setShowConfirm(false);
    setLoading(false);
    alert("❌ Erreur lors de l'enregistrement. Veuillez réessayer.");
  }
};
  const formatDateDisplay = (date, time) => {
    if (!date) return "";
    const d = new Date(`${date}T${time || "00:00"}`);
    return d.toLocaleDateString("fr-FR", { weekday: "long", year: "numeric", month: "long", day: "numeric" }) + (time ? ` à ${time}` : "");
  };

  return (
    <>
      <style>{styles}</style>
      <div className="new-live-wrapper">
        <div className="new-live-container">
          <div className="new-live-header">
            <div className="header-badge"><span className="live-dot"></span>Nouvelle Session</div>
            <h1>Créer un nouveau Live</h1>
            <p>Remplissez les informations ci-dessous pour programmer votre session de débat en direct</p>
            <div className="divider"></div>
          </div>
          <form className="new-live-form" onSubmit={handleSubmit}>
            {/* Titre */}
            <div className="form-group">
              <label className="nl-label" htmlFor="title"><span className="label-icon">📌</span>Titre du Live <span className="required">*</span></label>
              <input className={`nl-input ${errors.title ? "input-error-field" : ""}`} type="text" id="title" name="title" placeholder="Ex : Débat sur l'innovation..." value={formData.title} onChange={handleChange} />
              {errors.title && <span className="error-msg">⚠ {errors.title}</span>}
            </div>
            {/* Description */}
            <div className="form-group">
              <label className="nl-label" htmlFor="description"><span className="label-icon">📝</span>Description <span className="required">*</span></label>
              <textarea className={`nl-textarea ${errors.description ? "input-error-field" : ""}`} id="description" name="description" placeholder="Décrivez le contenu..." value={formData.description} onChange={handleChange} rows={4} />
              {errors.description && <span className="error-msg">⚠ {errors.description}</span>}
            </div>
            {/* Lien */}
            <div className="form-group">
              <label className="nl-label" htmlFor="link"><span className="label-icon">🔗</span>Lien de diffusion <span className="required">*</span></label>
              <input className={`nl-input ${errors.link ? "input-error-field" : ""}`} type="text" id="link" name="link" placeholder="https://zoom.us/j/..." value={formData.link} onChange={handleChange} />
              {errors.link && <span className="error-msg">⚠ {errors.link}</span>}
            </div>
            {/* Date & Heure */}
            <div className="form-row">
              <div className="form-group">
                <label className="nl-label" htmlFor="date"><span className="label-icon">📅</span>Date <span className="required">*</span></label>
                <input className={`nl-input ${errors.date ? "input-error-field" : ""}`} type="date" id="date" name="date" value={formData.date} onChange={handleChange} />
                {errors.date && <span className="error-msg">⚠ {errors.date}</span>}
              </div>
              <div className="form-group">
                <label className="nl-label" htmlFor="time"><span className="label-icon">🕐</span>Heure <span className="required">*</span></label>
                <input className={`nl-input ${errors.time ? "input-error-field" : ""}`} type="time" id="time" name="time" value={formData.time} onChange={handleChange} />
                {errors.time && <span className="error-msg">⚠ {errors.time}</span>}
              </div>
            </div>
            {/* Thématique */}
            <div className="form-group">
              <label className="nl-label" htmlFor="thematique"><span className="label-icon">🎯</span>Thématique <span className="required">*</span></label>
              <select className={`nl-select ${errors.thematique ? "input-error-field" : ""}`} id="thematique" name="thematique" value={formData.thematique} onChange={handleChange}>
                <option value="">-- Sélectionnez --</option>
                {thematiques.map((t, i) => <option key={i} value={t}>{t}</option>)}
              </select>
              {errors.thematique && <span className="error-msg">⚠ {errors.thematique}</span>}
            </div>
            {/* Actions */}
            <div className="form-actions">
              <button type="button" className="nl-btn-cancel" onClick={() => onCancel ? onCancel() : navigate(-1)}>Annuler</button>
              <button type="submit" className="nl-btn-submit"><span className="live-dot-sm"></span>Créer le Live</button>
            </div>
          </form>
        </div>
        {/* Modal Confirmation */}
        {showConfirm && (
          <div className="confirm-overlay">
            <div className="confirm-modal">
              <span className="confirm-emoji">🎙️</span>
              <h2>Confirmer la création</h2>
              <p>Voulez-vous vraiment créer le live <strong>« {formData.title} »</strong> ?</p>
              <div className="confirm-details-box">
                <div className="confirm-detail-row"><span>📅</span><div><span className="confirm-detail-label">Date & Heure</span><span className="confirm-detail-value">{formatDateDisplay(formData.date, formData.time)}</span></div></div>
                <div className="confirm-detail-row"><span>🎯</span><div><span className="confirm-detail-label">Thématique</span><span className="confirm-detail-value">{formData.thematique}</span></div></div>
                <div className="confirm-detail-row"><span>🔗</span><div><span className="confirm-detail-label">Lien</span><span className="confirm-detail-value">{formData.link}</span></div></div>
              </div>
              <div className="confirm-actions">
                <button className="nl-btn-cancel" onClick={() => setShowConfirm(false)} disabled={loading}>Annuler</button>
                <button className="nl-btn-confirm" onClick={handleConfirm} disabled={loading}>
                  {loading ? <span className="spinner"></span> : "✓ Confirmer"}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
}