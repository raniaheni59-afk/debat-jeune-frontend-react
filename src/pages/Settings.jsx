import React, { useState, useEffect, createContext, useContext } from "react";
import { useNavigate } from "react-router-dom";
import API from "../services/api";

// ── Language Context (export pour utiliser dans toute l'app) ──
export const LangContext = createContext();
export const useLang = () => useContext(LangContext);

const TRANSLATIONS = {
  fr: {
    settings: "Paramètres", account: "Compte", notifications: "Notifications",
    privacy: "Confidentialité", security: "Sécurité", language: "Langue", help: "Aide",
    basicInfo: "Informations de base", accountInfo: "Informations du compte",
    firstName: "Prénom", lastName: "Nom", email: "Email", phone: "Téléphone",
    bio: "Bio", save: "Enregistrer les modifications", cancel: "Annuler",
    saving: "Sauvegarde...", uploadPhoto: "Changer la photo", status: "Statut",
    memberSince: "Membre depuis", active: "Actif", password: "Mot de passe",
    logout: "Déconnexion", dashboard: "Tableau de bord", successMsg: "✅ Profil mis à jour !",
    errorMsg: "❌ Erreur lors de la mise à jour", chooseLanguage: "Choisir la langue",
    langDesc: "La langue sera appliquée sur tout le site",
    currentPassword: "Mot de passe actuel", newPassword: "Nouveau mot de passe",
    confirmPassword: "Confirmer le mot de passe", changePassword: "Changer le mot de passe",
    passwordMatch: "❌ Les mots de passe ne correspondent pas",
    passwordSuccess: "✅ Mot de passe changé avec succès !",
    twoFactor: "Authentification à deux facteurs",
    twoFactorDesc: "Ajoutez une couche de sécurité supplémentaire à votre compte",
    activeSessions: "Sessions actives", revokeAll: "Révoquer toutes les sessions",
    sessionDesc: "Gérez les appareils connectés à votre compte",
    notifPubs: "Nouvelles publications", notifComments: "Commentaires",
    notifMentions: "Mentions", notifDebats: "Débats", notifEmail: "Notifications par email",
    notifPush: "Notifications push", enabled: "Activé", disabled: "Désactivé",
    profileVisible: "Profil visible par", everyone: "Tout le monde", friendsOnly: "Amis seulement",
    onlyMe: "Moi seulement", showEmail: "Afficher l'email", showPhone: "Afficher le téléphone",
    faq: "Questions fréquentes", contact: "Contacter le support", reportBug: "Signaler un bug",
    terms: "Conditions d'utilisation", privacyPolicy: "Politique de confidentialité",
    faq1: "Comment modifier mon profil ?", faq1ans: "Allez dans Paramètres → Compte et modifiez vos informations.",
    faq2: "Comment changer mon mot de passe ?", faq2ans: "Allez dans Paramètres → Sécurité → Changer le mot de passe.",
    faq3: "Comment supprimer mon compte ?", faq3ans: "Contactez notre support pour supprimer votre compte.",
    faq4: "Comment signaler un contenu inapproprié ?", faq4ans: "Cliquez sur les 3 points d'une publication et sélectionnez 'Signaler'.",
    dangerZone: "Zone de danger", deleteAccount: "Supprimer mon compte",
    deleteDesc: "Cette action est irréversible. Toutes vos données seront supprimées.",
  },
  ar: {
    settings: "الإعدادات", account: "الحساب", notifications: "الإشعارات",
    privacy: "الخصوصية", security: "الأمان", language: "اللغة", help: "المساعدة",
    basicInfo: "المعلومات الأساسية", accountInfo: "معلومات الحساب",
    firstName: "الاسم الأول", lastName: "اسم العائلة", email: "البريد الإلكتروني",
    phone: "الهاتف", bio: "نبذة شخصية", save: "حفظ التغييرات", cancel: "إلغاء",
    saving: "جاري الحفظ...", uploadPhoto: "تغيير الصورة", status: "الحالة",
    memberSince: "عضو منذ", active: "نشط", password: "كلمة المرور",
    logout: "تسجيل الخروج", dashboard: "لوحة التحكم", successMsg: "✅ تم تحديث الملف الشخصي !",
    errorMsg: "❌ خطأ في التحديث", chooseLanguage: "اختيار اللغة",
    langDesc: "سيتم تطبيق اللغة على كامل الموقع",
    currentPassword: "كلمة المرور الحالية", newPassword: "كلمة المرور الجديدة",
    confirmPassword: "تأكيد كلمة المرور", changePassword: "تغيير كلمة المرور",
    passwordMatch: "❌ كلمتا المرور غير متطابقتان",
    passwordSuccess: "✅ تم تغيير كلمة المرور بنجاح !",
    twoFactor: "المصادقة الثنائية",
    twoFactorDesc: "أضف طبقة أمان إضافية لحسابك",
    activeSessions: "الجلسات النشطة", revokeAll: "إلغاء كل الجلسات",
    sessionDesc: "إدارة الأجهزة المتصلة بحسابك",
    notifPubs: "المنشورات الجديدة", notifComments: "التعليقات",
    notifMentions: "الإشارات", notifDebats: "النقاشات", notifEmail: "إشعارات البريد",
    notifPush: "الإشعارات الفورية", enabled: "مفعّل", disabled: "معطّل",
    profileVisible: "الملف الشخصي مرئي لـ", everyone: "الجميع", friendsOnly: "الأصدقاء فقط",
    onlyMe: "أنا فقط", showEmail: "إظهار البريد الإلكتروني", showPhone: "إظهار الهاتف",
    faq: "الأسئلة الشائعة", contact: "التواصل مع الدعم", reportBug: "الإبلاغ عن خطأ",
    terms: "شروط الاستخدام", privacyPolicy: "سياسة الخصوصية",
    faq1: "كيف أعدّل ملفي الشخصي؟", faq1ans: "اذهب إلى الإعدادات ← الحساب وعدّل معلوماتك.",
    faq2: "كيف أغيّر كلمة المرور؟", faq2ans: "اذهب إلى الإعدادات ← الأمان ← تغيير كلمة المرور.",
    faq3: "كيف أحذف حسابي؟", faq3ans: "تواصل مع الدعم لحذف حسابك.",
    faq4: "كيف أبلّغ عن محتوى غير لائق؟", faq4ans: "انقر على النقاط الثلاث في المنشور واختر 'إبلاغ'.",
    dangerZone: "منطقة الخطر", deleteAccount: "حذف حسابي",
    deleteDesc: "هذا الإجراء لا يمكن التراجع عنه. سيتم حذف جميع بياناتك.",
  },
  en: {
    settings: "Settings", account: "Account", notifications: "Notifications",
    privacy: "Privacy", security: "Security", language: "Language", help: "Help",
    basicInfo: "Basic Info", accountInfo: "Account Info",
    firstName: "First Name", lastName: "Last Name", email: "Email", phone: "Phone",
    bio: "Bio", save: "Save Changes", cancel: "Cancel",
    saving: "Saving...", uploadPhoto: "Change Photo", status: "Status",
    memberSince: "Member since", active: "Active", password: "Password",
    logout: "Logout", dashboard: "Dashboard", successMsg: "✅ Profile updated!",
    errorMsg: "❌ Error updating profile", chooseLanguage: "Choose Language",
    langDesc: "The language will be applied across the entire site",
    currentPassword: "Current Password", newPassword: "New Password",
    confirmPassword: "Confirm Password", changePassword: "Change Password",
    passwordMatch: "❌ Passwords do not match",
    passwordSuccess: "✅ Password changed successfully!",
    twoFactor: "Two-Factor Authentication",
    twoFactorDesc: "Add an extra layer of security to your account",
    activeSessions: "Active Sessions", revokeAll: "Revoke All Sessions",
    sessionDesc: "Manage devices connected to your account",
    notifPubs: "New Publications", notifComments: "Comments",
    notifMentions: "Mentions", notifDebats: "Debates", notifEmail: "Email Notifications",
    notifPush: "Push Notifications", enabled: "Enabled", disabled: "Disabled",
    profileVisible: "Profile visible to", everyone: "Everyone", friendsOnly: "Friends only",
    onlyMe: "Only me", showEmail: "Show email", showPhone: "Show phone",
    faq: "FAQ", contact: "Contact Support", reportBug: "Report a Bug",
    terms: "Terms of Service", privacyPolicy: "Privacy Policy",
    faq1: "How to edit my profile?", faq1ans: "Go to Settings → Account and update your info.",
    faq2: "How to change my password?", faq2ans: "Go to Settings → Security → Change Password.",
    faq3: "How to delete my account?", faq3ans: "Contact our support to delete your account.",
    faq4: "How to report inappropriate content?", faq4ans: "Click the 3 dots on a post and select 'Report'.",
    dangerZone: "Danger Zone", deleteAccount: "Delete My Account",
    deleteDesc: "This action is irreversible. All your data will be deleted.",
  }
};

const BACKEND = "https://debat-jeune-production.up.railway.app";

const getAvatar = (photo, sexe) => {
  if (photo) return photo.startsWith("http") ? photo : `${BACKEND}/${photo}`;
  return sexe === "femme"
    ? "https://randomuser.me/api/portraits/women/44.jpg"
    : "https://randomuser.me/api/portraits/men/44.jpg";
};

// ── Toast notification ──
const Toast = ({ msg, onClose }) => {
  useEffect(() => { const t = setTimeout(onClose, 3000); return () => clearTimeout(t); }, []);
  return (
    <div style={{
      position: "fixed", bottom: 30, right: 30, zIndex: 9999,
      background: msg.includes("❌") ? "#ff4444" : "#22c55e",
      color: "#fff", padding: "14px 24px", borderRadius: 12,
      fontWeight: 600, fontSize: 15, boxShadow: "0 8px 32px rgba(0,0,0,0.3)",
      animation: "slideUp 0.3s ease"
    }}>
      {msg}
    </div>
  );
};

// ── Toggle Switch ──
const Toggle = ({ value, onChange }) => (
  <div onClick={onChange} style={{
    width: 48, height: 26, borderRadius: 13, cursor: "pointer", transition: "all 0.3s",
    background: value ? "#a78bfa" : "rgba(255,255,255,0.15)", position: "relative", flexShrink: 0
  }}>
    <div style={{
      width: 20, height: 20, borderRadius: "50%", background: "#fff",
      position: "absolute", top: 3, left: value ? 25 : 3, transition: "left 0.3s",
      boxShadow: "0 2px 6px rgba(0,0,0,0.3)"
    }} />
  </div>
);

const Settings = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("account");
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState(null);
  const [openFaq, setOpenFaq] = useState(null);

  // Language
  const [lang, setLang] = useState(() => localStorage.getItem("swafy_lang") || "fr");
  const t = TRANSLATIONS[lang];
  const isRTL = lang === "ar";

  // Profile form
  const [formData, setFormData] = useState({
    nom_user: "", prenom_user: "", email_user: "",
    telephone_user: "", bio_user: "", photo_user: null,
    sexe: "homme", newPhoto: null, photoFile: null
  });

  // Security
  const [secData, setSecData] = useState({ currentPassword: "", newPassword: "", confirmPassword: "" });
  const [twoFactor, setTwoFactor] = useState(false);

  // Notifications
  const [notifs, setNotifs] = useState({
    publications: true, comments: true, mentions: true,
    debats: false, email: true, push: false
  });

  // Privacy
  const [privacy, setPrivacy] = useState({
    profileVisible: "everyone", showEmail: false, showPhone: false
  });

  useEffect(() => {
    const userStr = localStorage.getItem("user");
    if (userStr) {
      const u = JSON.parse(userStr);
      setFormData({
        nom_user: u.nom_user || "", prenom_user: u.prenom_user || "",
        email_user: u.email_user || "", telephone_user: u.telephone_user || "",
        bio_user: u.bio_user || "", photo_user: u.photo_user || null,
        sexe: u.sexe || "homme", newPhoto: null, photoFile: null
      });
    }
    // Load saved preferences
    const savedNotifs = localStorage.getItem("swafy_notifs");
    if (savedNotifs) setNotifs(JSON.parse(savedNotifs));
    const savedPrivacy = localStorage.getItem("swafy_privacy");
    if (savedPrivacy) setPrivacy(JSON.parse(savedPrivacy));
    const saved2fa = localStorage.getItem("swafy_2fa");
    if (saved2fa) setTwoFactor(saved2fa === "true");
  }, []);

  const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

  const handlePhotoChange = (e) => {
    const file = e.target.files[0];
    if (file) setFormData({ ...formData, newPhoto: URL.createObjectURL(file), photoFile: file });
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      const data = new FormData();
      data.append("nom_user", formData.nom_user);
      data.append("prenom_user", formData.prenom_user);
      data.append("email_user", formData.email_user);
      data.append("telephone_user", formData.telephone_user);
      data.append("bio_user", formData.bio_user);
      if (formData.photoFile) data.append("photo", formData.photoFile);

      const res = await API.put("/profile/update", data, {
        headers: { "Content-Type": "multipart/form-data" }
      });

      // Update localStorage
      const current = JSON.parse(localStorage.getItem("user") || "{}");
      const updated = { ...current, ...formData, photo_user: res.data?.photo_user || current.photo_user };
      localStorage.setItem("user", JSON.stringify(updated));
      setFormData({ ...formData, newPhoto: null, photoFile: null });
      setToast(t.successMsg);

      // Force update dans toutes les pages via storage event
      window.dispatchEvent(new Event("storage"));
    } catch (err) {
      setToast(t.errorMsg);
    } finally {
      setSaving(false);
    }
  };

  const handlePasswordChange = async () => {
    if (secData.newPassword !== secData.confirmPassword) {
      setToast(t.passwordMatch); return;
    }
    try {
      setSaving(true);
      await API.put("/profile/change-password", {
        currentPassword: secData.currentPassword,
        newPassword: secData.newPassword
      });
      setSecData({ currentPassword: "", newPassword: "", confirmPassword: "" });
      setToast(t.passwordSuccess);
    } catch {
      setToast(t.errorMsg);
    } finally {
      setSaving(false);
    }
  };

  const handleLangChange = (newLang) => {
    setLang(newLang);
    localStorage.setItem("swafy_lang", newLang);
    window.dispatchEvent(new CustomEvent("langChange", { detail: newLang }));
  };

  const handleNotifChange = (key) => {
    const updated = { ...notifs, [key]: !notifs[key] };
    setNotifs(updated);
    localStorage.setItem("swafy_notifs", JSON.stringify(updated));
  };

  const handlePrivacyChange = (key, value) => {
    const updated = { ...privacy, [key]: value };
    setPrivacy(updated);
    localStorage.setItem("swafy_privacy", JSON.stringify(updated));
  };

  const menuItems = [
    { id: "account", label: t.account, icon: "👤" },
    { id: "notifications", label: t.notifications, icon: "🔔" },
    { id: "privacy", label: t.privacy, icon: "🔒" },
    { id: "security", label: t.security, icon: "🛡️" },
    { id: "language", label: t.language, icon: "🌍" },
    { id: "help", label: t.help, icon: "❓" },
  ];

  const inputStyle = {
    width: "100%", padding: "12px 16px", borderRadius: 10, border: "1.5px solid rgba(255,255,255,0.15)",
    background: "rgba(255,255,255,0.07)", color: "#fff", fontSize: 14, outline: "none",
    transition: "border 0.2s", boxSizing: "border-box",
    fontFamily: isRTL ? "'Cairo', sans-serif" : "'Sora', sans-serif"
  };

  const cardStyle = {
    background: "rgba(255,255,255,0.05)", backdropFilter: "blur(20px)",
    border: "1px solid rgba(255,255,255,0.1)", borderRadius: 16,
    padding: "28px 32px", marginBottom: 20
  };

  const rowStyle = {
    display: "flex", justifyContent: "space-between", alignItems: "center",
    padding: "14px 0", borderBottom: "1px solid rgba(255,255,255,0.07)"
  };

  // ── RENDER TABS ──
  const renderTab = () => {
    switch (activeTab) {

      // ── ACCOUNT ──
      case "account": return (
        <>
          <div style={cardStyle}>
            <h2 style={{ color: "#a78bfa", marginBottom: 24, fontSize: 18 }}>{t.basicInfo}</h2>

            {/* Photo */}
            <div style={{ display: "flex", alignItems: "center", gap: 20, marginBottom: 28 }}>
              <div style={{ position: "relative" }}>
                <img
                  src={formData.newPhoto || getAvatar(formData.photo_user, formData.sexe)}
                  alt="avatar"
                  style={{ width: 80, height: 80, borderRadius: "50%", objectFit: "cover", border: "3px solid #a78bfa" }}
                />
                <label htmlFor="photo-input" style={{
                  position: "absolute", bottom: 0, right: 0, background: "#a78bfa",
                  borderRadius: "50%", width: 26, height: 26, display: "flex",
                  alignItems: "center", justifyContent: "center", cursor: "pointer", fontSize: 13
                }}>✏️
                  <input id="photo-input" type="file" accept="image/*" onChange={handlePhotoChange} hidden />
                </label>
              </div>
              <div>
                <div style={{ color: "#fff", fontWeight: 600, fontSize: 16 }}>
                  {formData.prenom_user} {formData.nom_user}
                </div>
                <label htmlFor="photo-input" style={{ color: "#a78bfa", fontSize: 13, cursor: "pointer" }}>
                  {t.uploadPhoto}
                </label>
              </div>
            </div>

            {/* Form Grid */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
              {[
                { label: t.firstName, name: "prenom_user", placeholder: "Rania" },
                { label: t.lastName, name: "nom_user", placeholder: "Heni" },
              ].map(f => (
                <div key={f.name}>
                  <label style={{ color: "rgba(255,255,255,0.6)", fontSize: 12, marginBottom: 6, display: "block" }}>{f.label}</label>
                  <input style={inputStyle} name={f.name} value={formData[f.name]} onChange={handleChange} placeholder={f.placeholder} />
                </div>
              ))}
              <div style={{ gridColumn: "1/-1" }}>
                <label style={{ color: "rgba(255,255,255,0.6)", fontSize: 12, marginBottom: 6, display: "block" }}>{t.email}</label>
                <input style={inputStyle} name="email_user" type="email" value={formData.email_user} onChange={handleChange} placeholder="rania@swafy.tn" />
              </div>
              <div>
                <label style={{ color: "rgba(255,255,255,0.6)", fontSize: 12, marginBottom: 6, display: "block" }}>{t.phone}</label>
                <input style={inputStyle} name="telephone_user" value={formData.telephone_user} onChange={handleChange} placeholder="+216 XX XXX XXX" />
              </div>
              <div style={{ gridColumn: "1/-1" }}>
                <label style={{ color: "rgba(255,255,255,0.6)", fontSize: 12, marginBottom: 6, display: "block" }}>{t.bio}</label>
                <textarea style={{ ...inputStyle, resize: "vertical", minHeight: 80 }} name="bio_user" value={formData.bio_user} onChange={handleChange} placeholder="..." />
              </div>
            </div>
          </div>

          <div style={cardStyle}>
            <h2 style={{ color: "#a78bfa", marginBottom: 20, fontSize: 18 }}>{t.accountInfo}</h2>
            <div style={rowStyle}>
              <span style={{ color: "rgba(255,255,255,0.6)" }}>{t.status}</span>
              <span style={{ color: "#22c55e", fontWeight: 600 }}>● {t.active}</span>
            </div>
            <div style={rowStyle}>
              <span style={{ color: "rgba(255,255,255,0.6)" }}>{t.memberSince}</span>
              <span style={{ color: "#fff" }}>{new Date().toLocaleDateString(lang === "ar" ? "ar-TN" : lang === "en" ? "en-US" : "fr-FR")}</span>
            </div>
            <div style={{ ...rowStyle, cursor: "pointer", borderBottom: "none" }} onClick={() => setActiveTab("security")}>
              <span style={{ color: "rgba(255,255,255,0.6)" }}>{t.password}</span>
              <span style={{ color: "#a78bfa" }}>•••••••• →</span>
            </div>
          </div>

          <div style={{ display: "flex", gap: 12 }}>
            <button onClick={handleSave} disabled={saving} style={{
              flex: 1, padding: "14px", borderRadius: 12, border: "none", cursor: "pointer",
              background: "linear-gradient(135deg, #a78bfa, #7c3aed)", color: "#fff",
              fontWeight: 700, fontSize: 15, opacity: saving ? 0.7 : 1
            }}>{saving ? t.saving : t.save}</button>
            <button onClick={() => {
              const u = JSON.parse(localStorage.getItem("user") || "{}");
              setFormData({ ...formData, ...u, newPhoto: null, photoFile: null });
            }} style={{
              padding: "14px 24px", borderRadius: 12, border: "1px solid rgba(255,255,255,0.2)",
              background: "transparent", color: "#fff", fontWeight: 600, cursor: "pointer"
            }}>{t.cancel}</button>
          </div>
        </>
      );

      // ── SECURITY ──
      case "security": return (
        <>
          <div style={cardStyle}>
            <h2 style={{ color: "#a78bfa", marginBottom: 24, fontSize: 18 }}>{t.changePassword}</h2>
            {[
              { label: t.currentPassword, key: "currentPassword" },
              { label: t.newPassword, key: "newPassword" },
              { label: t.confirmPassword, key: "confirmPassword" },
            ].map(f => (
              <div key={f.key} style={{ marginBottom: 16 }}>
                <label style={{ color: "rgba(255,255,255,0.6)", fontSize: 12, marginBottom: 6, display: "block" }}>{f.label}</label>
                <input style={inputStyle} type="password" value={secData[f.key]}
                  onChange={e => setSecData({ ...secData, [f.key]: e.target.value })} placeholder="••••••••" />
              </div>
            ))}
            <button onClick={handlePasswordChange} disabled={saving} style={{
              width: "100%", padding: 14, borderRadius: 12, border: "none", cursor: "pointer",
              background: "linear-gradient(135deg, #a78bfa, #7c3aed)", color: "#fff", fontWeight: 700
            }}>{saving ? t.saving : t.changePassword}</button>
          </div>

          <div style={cardStyle}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
              <div>
                <h3 style={{ color: "#fff", marginBottom: 6, fontSize: 16 }}>{t.twoFactor}</h3>
                <p style={{ color: "rgba(255,255,255,0.5)", fontSize: 13, margin: 0 }}>{t.twoFactorDesc}</p>
              </div>
              <Toggle value={twoFactor} onChange={() => {
                const v = !twoFactor; setTwoFactor(v);
                localStorage.setItem("swafy_2fa", String(v));
              }} />
            </div>
          </div>

          <div style={cardStyle}>
            <h3 style={{ color: "#fff", marginBottom: 8, fontSize: 16 }}>{t.activeSessions}</h3>
            <p style={{ color: "rgba(255,255,255,0.5)", fontSize: 13, marginBottom: 20 }}>{t.sessionDesc}</p>
            {[
              { device: "Chrome — Tunis, TN", time: "Maintenant", current: true },
              { device: "Firefox — Tunis, TN", time: "Il y a 2h", current: false },
              { device: "Mobile Safari — iOS", time: "Hier", current: false },
            ].map((s, i) => (
              <div key={i} style={{ ...rowStyle, borderBottom: i < 2 ? "1px solid rgba(255,255,255,0.07)" : "none" }}>
                <div>
                  <div style={{ color: "#fff", fontSize: 14 }}>{s.device}</div>
                  <div style={{ color: "rgba(255,255,255,0.4)", fontSize: 12 }}>{s.time}</div>
                </div>
                {s.current
                  ? <span style={{ color: "#22c55e", fontSize: 12, fontWeight: 600 }}>● Actuel</span>
                  : <button style={{ background: "rgba(239,68,68,0.2)", color: "#ef4444", border: "1px solid rgba(239,68,68,0.3)", borderRadius: 8, padding: "4px 12px", cursor: "pointer", fontSize: 12 }}>Révoquer</button>
                }
              </div>
            ))}
            <button style={{
              width: "100%", marginTop: 16, padding: "12px", borderRadius: 10,
              border: "1px solid rgba(239,68,68,0.4)", background: "rgba(239,68,68,0.1)",
              color: "#ef4444", fontWeight: 600, cursor: "pointer"
            }}>{t.revokeAll}</button>
          </div>

          <div style={{ ...cardStyle, border: "1px solid rgba(239,68,68,0.3)", background: "rgba(239,68,68,0.05)" }}>
            <h3 style={{ color: "#ef4444", marginBottom: 8 }}>{t.dangerZone}</h3>
            <p style={{ color: "rgba(255,255,255,0.5)", fontSize: 13, marginBottom: 16 }}>{t.deleteDesc}</p>
            <button style={{
              padding: "12px 24px", borderRadius: 10, border: "1px solid #ef4444",
              background: "transparent", color: "#ef4444", fontWeight: 600, cursor: "pointer"
            }}>{t.deleteAccount}</button>
          </div>
        </>
      );

      // ── NOTIFICATIONS ──
      case "notifications": return (
        <div style={cardStyle}>
          <h2 style={{ color: "#a78bfa", marginBottom: 24, fontSize: 18 }}>{t.notifications}</h2>
          {[
            { key: "publications", label: t.notifPubs, icon: "📝" },
            { key: "comments", label: t.notifComments, icon: "💬" },
            { key: "mentions", label: t.notifMentions, icon: "🔖" },
            { key: "debats", label: t.notifDebats, icon: "🎤" },
            { key: "email", label: t.notifEmail, icon: "📧" },
            { key: "push", label: t.notifPush, icon: "📲" },
          ].map((item, i, arr) => (
            <div key={item.key} style={{ ...rowStyle, borderBottom: i < arr.length - 1 ? "1px solid rgba(255,255,255,0.07)" : "none" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <span style={{ fontSize: 20 }}>{item.icon}</span>
                <div>
                  <div style={{ color: "#fff", fontSize: 14 }}>{item.label}</div>
                  <div style={{ color: "rgba(255,255,255,0.4)", fontSize: 12 }}>{notifs[item.key] ? t.enabled : t.disabled}</div>
                </div>
              </div>
              <Toggle value={notifs[item.key]} onChange={() => handleNotifChange(item.key)} />
            </div>
          ))}
        </div>
      );

      // ── PRIVACY ──
      case "privacy": return (
        <div style={cardStyle}>
          <h2 style={{ color: "#a78bfa", marginBottom: 24, fontSize: 18 }}>{t.privacy}</h2>

          <div style={{ marginBottom: 24 }}>
            <label style={{ color: "rgba(255,255,255,0.6)", fontSize: 13, marginBottom: 12, display: "block" }}>{t.profileVisible}</label>
            <div style={{ display: "flex", gap: 10 }}>
              {[
                { val: "everyone", label: t.everyone },
                { val: "friends", label: t.friendsOnly },
                { val: "me", label: t.onlyMe },
              ].map(opt => (
                <button key={opt.val} onClick={() => handlePrivacyChange("profileVisible", opt.val)} style={{
                  flex: 1, padding: "10px 8px", borderRadius: 10, border: "1.5px solid",
                  borderColor: privacy.profileVisible === opt.val ? "#a78bfa" : "rgba(255,255,255,0.15)",
                  background: privacy.profileVisible === opt.val ? "rgba(167,139,250,0.15)" : "transparent",
                  color: privacy.profileVisible === opt.val ? "#a78bfa" : "rgba(255,255,255,0.6)",
                  cursor: "pointer", fontSize: 13, fontWeight: 600
                }}>{opt.label}</button>
              ))}
            </div>
          </div>

          {[
            { key: "showEmail", label: t.showEmail, icon: "📧" },
            { key: "showPhone", label: t.showPhone, icon: "📱" },
          ].map((item, i) => (
            <div key={item.key} style={{ ...rowStyle, borderBottom: i === 0 ? "1px solid rgba(255,255,255,0.07)" : "none" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <span style={{ fontSize: 20 }}>{item.icon}</span>
                <span style={{ color: "#fff", fontSize: 14 }}>{item.label}</span>
              </div>
              <Toggle value={privacy[item.key]} onChange={() => handlePrivacyChange(item.key, !privacy[item.key])} />
            </div>
          ))}
        </div>
      );

      // ── LANGUAGE ──
      case "language": return (
        <div style={cardStyle}>
          <h2 style={{ color: "#a78bfa", marginBottom: 8, fontSize: 18 }}>{t.chooseLanguage}</h2>
          <p style={{ color: "rgba(255,255,255,0.5)", fontSize: 13, marginBottom: 28 }}>{t.langDesc}</p>
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {[
              { code: "fr", label: "Français", flag: "🇫🇷", native: "Français" },
              { code: "ar", label: "العربية", flag: "🇹🇳", native: "العربية" },
              { code: "en", label: "English", flag: "🇬🇧", native: "English" },
            ].map(l => (
              <button key={l.code} onClick={() => handleLangChange(l.code)} style={{
                display: "flex", alignItems: "center", gap: 16, padding: "18px 20px",
                borderRadius: 14, border: "2px solid",
                borderColor: lang === l.code ? "#a78bfa" : "rgba(255,255,255,0.1)",
                background: lang === l.code ? "rgba(167,139,250,0.15)" : "rgba(255,255,255,0.03)",
                cursor: "pointer", textAlign: "left", transition: "all 0.2s"
              }}>
                <span style={{ fontSize: 28 }}>{l.flag}</span>
                <div style={{ flex: 1 }}>
                  <div style={{ color: lang === l.code ? "#a78bfa" : "#fff", fontWeight: 700, fontSize: 16 }}>{l.native}</div>
                  <div style={{ color: "rgba(255,255,255,0.4)", fontSize: 13 }}>{l.label}</div>
                </div>
                {lang === l.code && <span style={{ color: "#a78bfa", fontSize: 20 }}>✓</span>}
              </button>
            ))}
          </div>
        </div>
      );

      // ── HELP ──
      case "help": return (
        <>
          <div style={cardStyle}>
            <h2 style={{ color: "#a78bfa", marginBottom: 24, fontSize: 18 }}>{t.faq}</h2>
            {[
              { q: t.faq1, a: t.faq1ans },
              { q: t.faq2, a: t.faq2ans },
              { q: t.faq3, a: t.faq3ans },
              { q: t.faq4, a: t.faq4ans },
            ].map((item, i) => (
              <div key={i} style={{ borderBottom: i < 3 ? "1px solid rgba(255,255,255,0.07)" : "none" }}>
                <div onClick={() => setOpenFaq(openFaq === i ? null : i)} style={{
                  display: "flex", justifyContent: "space-between", alignItems: "center",
                  padding: "16px 0", cursor: "pointer"
                }}>
                  <span style={{ color: "#fff", fontSize: 14, fontWeight: 500 }}>{item.q}</span>
                  <span style={{ color: "#a78bfa", fontSize: 18, transition: "transform 0.3s", transform: openFaq === i ? "rotate(45deg)" : "none" }}>+</span>
                </div>
                {openFaq === i && (
                  <div style={{ padding: "0 0 16px", color: "rgba(255,255,255,0.6)", fontSize: 13, lineHeight: 1.7 }}>
                    {item.a}
                  </div>
                )}
              </div>
            ))}
          </div>

          <div style={cardStyle}>
            {[
              { label: t.contact, icon: "💬", color: "#60a5fa" },
              { label: t.reportBug, icon: "🐛", color: "#f59e0b" },
              { label: t.terms, icon: "📄", color: "rgba(255,255,255,0.6)" },
              { label: t.privacyPolicy, icon: "🔐", color: "rgba(255,255,255,0.6)" },
            ].map((item, i, arr) => (
              <div key={i} style={{ ...rowStyle, cursor: "pointer", borderBottom: i < arr.length - 1 ? "1px solid rgba(255,255,255,0.07)" : "none" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                  <span style={{ fontSize: 20 }}>{item.icon}</span>
                  <span style={{ color: item.color, fontSize: 14, fontWeight: 500 }}>{item.label}</span>
                </div>
                <span style={{ color: "rgba(255,255,255,0.3)" }}>→</span>
              </div>
            ))}
          </div>
        </>
      );

      default: return (
        <div style={{ ...cardStyle, textAlign: "center", padding: "60px 32px" }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>🚧</div>
          <p style={{ color: "rgba(255,255,255,0.5)" }}>Coming soon...</p>
        </div>
      );
    }
  };

  return (
    <LangContext.Provider value={{ lang, t, isRTL }}>
      <div dir={isRTL ? "rtl" : "ltr"} style={{
        minHeight: "100vh", background: "linear-gradient(135deg, #0f0c29, #302b63, #24243e)",
        fontFamily: isRTL ? "'Cairo', sans-serif" : "'Sora', sans-serif",
        position: "relative", overflow: "hidden"
      }}>
        {/* Google Fonts */}
        <link href="https://fonts.googleapis.com/css2?family=Sora:wght@400;600;700&family=Cairo:wght@400;600;700&display=swap" rel="stylesheet" />

        <style>{`
          @keyframes slideUp { from { transform: translateY(20px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }
          input:focus, textarea:focus { border-color: #a78bfa !important; box-shadow: 0 0 0 3px rgba(167,139,250,0.15); }
          ::-webkit-scrollbar { width: 6px; } ::-webkit-scrollbar-track { background: transparent; }
          ::-webkit-scrollbar-thumb { background: rgba(167,139,250,0.4); border-radius: 3px; }
        `}</style>

        {/* Orbs */}
        {[
          { w: 400, h: 400, top: -100, left: -100, color: "rgba(124,58,237,0.15)" },
          { w: 300, h: 300, top: "40%", right: -80, color: "rgba(167,139,250,0.1)" },
          { w: 250, h: 250, bottom: -80, left: "30%", color: "rgba(99,102,241,0.12)" },
        ].map((o, i) => (
          <div key={i} style={{
            position: "fixed", width: o.w, height: o.h, borderRadius: "50%",
            background: o.color, filter: "blur(80px)", pointerEvents: "none", zIndex: 0,
            top: o.top, left: o.left, right: o.right, bottom: o.bottom
          }} />
        ))}

        <div style={{
          position: "relative", zIndex: 1, display: "flex", minHeight: "100vh",
          maxWidth: 1100, margin: "0 auto", padding: "32px 20px", gap: 24
        }}>

          {/* ── SIDEBAR ── */}
          <aside style={{
            width: 240, flexShrink: 0, background: "rgba(255,255,255,0.04)",
            backdropFilter: "blur(20px)", border: "1px solid rgba(255,255,255,0.08)",
            borderRadius: 20, padding: "24px 16px", height: "fit-content",
            position: "sticky", top: 32
          }}>
            {/* Brand */}
            <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 28, padding: "0 8px" }}>
              <div style={{
                width: 40, height: 40, borderRadius: 12, background: "linear-gradient(135deg, #a78bfa, #7c3aed)",
                display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontWeight: 800, fontSize: 18
              }}>S</div>
              <div>
                <div style={{ color: "#fff", fontWeight: 700, fontSize: 14 }}>Swafy</div>
                <div style={{ color: "rgba(255,255,255,0.4)", fontSize: 11 }}>Débat Jeune</div>
              </div>
            </div>

            <div style={{ color: "rgba(255,255,255,0.4)", fontSize: 11, fontWeight: 700, letterSpacing: 1.5, padding: "0 8px", marginBottom: 12, textTransform: "uppercase" }}>
              {t.settings}
            </div>

            <nav style={{ display: "flex", flexDirection: "column", gap: 4 }}>
              {menuItems.map(item => (
                <button key={item.id} onClick={() => setActiveTab(item.id)} style={{
                  display: "flex", alignItems: "center", gap: 12, padding: "11px 12px",
                  borderRadius: 12, border: "none", cursor: "pointer", textAlign: isRTL ? "right" : "left",
                  background: activeTab === item.id ? "rgba(167,139,250,0.2)" : "transparent",
                  color: activeTab === item.id ? "#a78bfa" : "rgba(255,255,255,0.6)",
                  fontWeight: activeTab === item.id ? 600 : 400,
                  transition: "all 0.2s",
                  fontFamily: isRTL ? "'Cairo', sans-serif" : "'Sora', sans-serif"
                }}>
                  <span style={{ fontSize: 18 }}>{item.icon}</span>
                  <span style={{ fontSize: 14 }}>{item.label}</span>
                  {activeTab === item.id && <span style={{ marginLeft: "auto", fontSize: 10 }}>●</span>}
                </button>
              ))}
            </nav>

            <div style={{ borderTop: "1px solid rgba(255,255,255,0.08)", marginTop: 20, paddingTop: 16 }}>
              <button onClick={() => navigate("/jeune")} style={{
                display: "flex", alignItems: "center", gap: 10, width: "100%",
                padding: "10px 12px", borderRadius: 12, border: "none", cursor: "pointer",
                background: "transparent", color: "rgba(255,255,255,0.5)", fontSize: 13,
                fontFamily: isRTL ? "'Cairo', sans-serif" : "'Sora', sans-serif"
              }}>
                <span>←</span> {t.dashboard}
              </button>
              <button onClick={() => {
                localStorage.removeItem("token");
                localStorage.removeItem("user");
                navigate("/login");
              }} style={{
                display: "flex", alignItems: "center", gap: 10, width: "100%",
                padding: "10px 12px", borderRadius: 12, border: "none", cursor: "pointer",
                background: "transparent", color: "#ef4444", fontSize: 13, fontWeight: 600,
                fontFamily: isRTL ? "'Cairo', sans-serif" : "'Sora', sans-serif"
              }}>
                <span>↩</span> {t.logout}
              </button>
            </div>
          </aside>

          {/* ── MAIN ── */}
          <main style={{ flex: 1, minWidth: 0 }}>
            <div style={{ marginBottom: 28 }}>
              <h1 style={{ color: "#fff", fontSize: 26, fontWeight: 800, margin: 0 }}>{t.settings}</h1>
              <p style={{ color: "rgba(255,255,255,0.4)", fontSize: 14, marginTop: 4 }}>
                {menuItems.find(m => m.id === activeTab)?.label}
              </p>
            </div>
            {renderTab()}
          </main>
        </div>

        {toast && <Toast msg={toast} onClose={() => setToast(null)} />}
      </div>
    </LangContext.Provider>
  );
};

export default Settings;
