import React, { useState, useEffect, useCallback, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { io } from "socket.io-client";
import API from "../services/api";
import "./JeuneLayout.css";
import PublicationCard from "../components/PublicationCard";
import PublierPage from "./PublierPage";


// Import conditionnel — adapte les chemins selon ta structure
let JeuneContact, LiveBanner, JeuneEnquete, LiveSection;
try { JeuneContact  = require("./JeuneContact").default;  } catch { JeuneContact  = () => <div style={{padding:40,textAlign:"center",color:"#aaa"}}>Messages — bientôt disponible</div>; }
try { LiveBanner    = require("../components/LiveBanner").default; } catch { LiveBanner = () => null; }
try { JeuneEnquete  = require("./JeuneEnquete").default;  } catch { JeuneEnquete  = () => <div style={{padding:40,textAlign:"center",color:"#aaa"}}>Enquêtes — bientôt disponible</div>; }
try { LiveSection   = require("./Livesection").default;   } catch { LiveSection   = () => <div style={{padding:40,textAlign:"center",color:"#aaa"}}>Live — bientôt disponible</div>; }



const BACKEND =
  API.defaults.baseURL?.split("/api")[0] ||
  "https://debat-jeune.onrender.com";

const getAvatar = (photo, sexe) => {
  if (photo) return photo.startsWith("http") ? photo : `${BACKEND}/${photo}`;
  return sexe === "femme"
    ? "https://randomuser.me/api/portraits/women/44.jpg"
    : "https://randomuser.me/api/portraits/men/44.jpg";
};

const PAGES = {
  HOME     : "home",
  MESSAGES : "messages",
  NOTIFS   : "notifications",
  SETTINGS : "settings",
  PUBLIER  : "publier",
  CALENDAR : "calendar",
  LIVE     : "live",
  ENQUETE  : "enquete",
};

/* ═══════════════════════════════════════════════════════════
   SVG ICONS — professionnels (Heroicons style)
═══════════════════════════════════════════════════════════ */
const Icon = ({ name, size = 20 }) => {
  const paths = {
    home     : "M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6",
    message  : "M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z",
    pencil   : "M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z",
    calendar : "M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z",
    radio    : "M8.111 16.404a5.5 5.5 0 017.778 0M12 20h.01m-7.08-7.071c3.904-3.905 10.236-3.905 14.141 0M1.394 9.393c5.857-5.857 15.355-5.857 21.213 0",
    bell     : "M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9",
    settings : "M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z M15 12a3 3 0 11-6 0 3 3 0 016 0z",
    logout   : "M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1",
    menu     : "M4 6h16M4 12h16M4 18h16",
    send     : "M12 19l9 2-9-18-9 18 9-2zm0 0v-8",
    heart    : "M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z",
    "heart-filled": "M11.645 20.91l-.007-.003-.022-.012a15.247 15.247 0 01-.383-.218 25.18 25.18 0 01-4.244-3.17C4.688 15.36 2.25 12.174 2.25 8.25 2.25 5.322 4.714 3 7.688 3A5.5 5.5 0 0112 5.052 5.5 5.5 0 0116.313 3c2.973 0 5.437 2.322 5.437 5.25 0 3.925-2.438 7.111-4.739 9.256a25.175 25.175 0 01-4.244 3.17 15.247 15.247 0 01-.383.219l-.022.012-.007.004-.003.001a.752.752 0 01-.704 0l-.003-.001z",
    comment  : "M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z",
    share    : "M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z",
    clock    : "M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z",
    play     : "M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z M21 12a9 9 0 11-18 0 9 9 0 0118 0z",
    mic      : "M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 016 0v6a3 3 0 01-3 3z",
    check    : "M5 13l4 4L19 7",
    close    : "M6 18L18 6M6 6l12 12",
    chevron  : "M9 5l7 7-7 7",
    user     : "M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z",
    photo    : "M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z",
    video    : "M15 10l4.553-2.069A1 1 0 0121 8.868v6.264a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z",
    link     : "M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1",
    shield   : "M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z",
    lock     : "M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z",
    palette  : "M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01",
    robot    : "M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17H3a2 2 0 01-2-2V5a2 2 0 012-2h3.5a2 2 0 012 2V7h3V5a2 2 0 012-2H19a2 2 0 012 2v10a2 2 0 01-2 2h-2M9 9h6m-6 4h6m-3-8v3",
    star     : "M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z",
    sparkles : "M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z",
    dots     : "M5 12h.01M12 12h.01M19 12h.01M6 12a1 1 0 11-2 0 1 1 0 012 0zm7 0a1 1 0 11-2 0 1 1 0 012 0zm7 0a1 1 0 11-2 0 1 1 0 012 0z",
  };
  const d = paths[name] || paths.dots;
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
      aria-hidden="true">
      {name === "heart-filled"
        ? <path d={d} fill="currentColor" stroke="none" />
        : <path d={d} />}
    </svg>
  );
};

/* ═══════════════════════════════════════════════════════════
   MODAL COMPONENTS
═══════════════════════════════════════════════════════════ */
const Toggle = ({ on, onToggle }) => (
  <div
    className={`jl-sw ${on ? "on" : "off"}`}
    onClick={onToggle}
    role="switch"
    aria-checked={on}
    tabIndex={0}
    onKeyDown={(e) => e.key === " " && onToggle()}
  >
    <div className="jl-sw-thumb" />
  </div>
);

const ModalProfile = ({ onSaved }) => {
  const storedUser = (() => { try { return JSON.parse(localStorage.getItem("user")) || {}; } catch { return {}; } })();
  const [form, setForm]       = useState({
    prenom_user   : storedUser.prenom_user   || "",
    nom_user      : storedUser.nom_user      || "",
    email_user    : storedUser.email_user    || "",
    bio           : storedUser.bio           || "",
    gouvernorat   : storedUser.gouvernorat   || "",
    delegation    : storedUser.delegation    || "",
    ville         : storedUser.ville         || "",
    etablissement : storedUser.etablissement || "",
    statut        : storedUser.statut        || "",
    sexe          : storedUser.sexe          || "",
  });
  const [saving,  setSaving]  = useState(false);
  const [saved,   setSaved]   = useState(false);
  const [error,   setError]   = useState("");
  const [photoFile, setPhotoFile] = useState(null);
  const [photoPreview, setPhotoPreview] = useState(null);
  const fileInputRef = useRef(null);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm(p => ({ ...p, [name]: value }));
    setSaved(false); setError("");
  };

  const handlePhoto = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setPhotoFile(file);
    setPhotoPreview(URL.createObjectURL(file));
  };

  const handleSave = async () => {
    setSaving(true); setError(""); setSaved(false);
    try {
      const fd = new FormData();
      Object.entries(form).forEach(([k, v]) => { if (v !== undefined && v !== null) fd.append(k, v); });
      if (photoFile) fd.append("photo", photoFile);

      const token = localStorage.getItem("token");
      const res = await fetch(`${BACKEND}/api/profile/update`, {
        method: "PUT",
        headers: { Authorization: `Bearer ${token}` },
        body: fd,
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Erreur sauvegarde");

      // Mettre à jour le localStorage
      const updated = { ...storedUser, ...form };
      if (data.photo_user) updated.photo_user = data.photo_user;
      localStorage.setItem("user", JSON.stringify(updated));

      setSaved(true);
      if (onSaved) onSaved(updated);
    } catch (err) {
      setError(err.message || "Erreur réseau. Réessayez.");
    } finally {
      setSaving(false);
    }
  };

  const avatarSrc = photoPreview || (storedUser.photo_user
    ? (storedUser.photo_user.startsWith("http") ? storedUser.photo_user : `${BACKEND}/${storedUser.photo_user}`)
    : (storedUser.sexe === "femme"
        ? "https://randomuser.me/api/portraits/women/44.jpg"
        : "https://randomuser.me/api/portraits/men/44.jpg"));

  return (
    <>
      {/* Avatar */}
      <div style={{ display:"flex", alignItems:"center", gap:14, marginBottom:20 }}>
        <img src={avatarSrc}
          style={{ width:58, height:58, borderRadius:"50%", border:"3px solid rgba(90,63,160,0.22)", objectFit:"cover" }} alt="avatar"/>
        <div style={{ display:"flex", flexDirection:"column", gap:6 }}>
          <button
            style={{ padding:"8px 16px", borderRadius:10, background:"#f4f0ff", color:"#5a3fa0", border:"1.5px solid rgba(90,63,160,0.2)", fontSize:12, fontWeight:700, cursor:"pointer", display:"flex", alignItems:"center", gap:6 }}
            onClick={() => fileInputRef.current?.click()}>
            <Icon name="photo" size={14}/> Changer la photo
          </button>
          {photoPreview && <span style={{ fontSize:11, color:"#10b981" }}>✓ Nouvelle photo sélectionnée</span>}
        </div>
        <input ref={fileInputRef} type="file" accept="image/*" style={{ display:"none" }} onChange={handlePhoto}/>
      </div>

      {/* Infos de base */}
      <div className="jl-m-row">
        <div className="jl-m-fg">
          <label className="jl-m-fl">Prénom</label>
          <input className="jl-m-fi" name="prenom_user" value={form.prenom_user} onChange={handleChange}/>
        </div>
        <div className="jl-m-fg">
          <label className="jl-m-fl">Nom</label>
          <input className="jl-m-fi" name="nom_user" value={form.nom_user} onChange={handleChange}/>
        </div>
      </div>
      <div className="jl-m-row">
        <div className="jl-m-fg">
          <label className="jl-m-fl">Email</label>
          <input className="jl-m-fi" name="email_user" value={form.email_user} onChange={handleChange} type="email"/>
        </div>
        <div className="jl-m-fg">
          <label className="jl-m-fl">Sexe</label>
          <select className="jl-m-fi" name="sexe" value={form.sexe} onChange={handleChange}>
            <option value="">—</option>
            <option value="homme">Homme</option>
            <option value="femme">Femme</option>
          </select>
        </div>
      </div>

      {/* Localisation */}
      <div className="jl-m-row">
        <div className="jl-m-fg">
          <label className="jl-m-fl">Gouvernorat</label>
          <input className="jl-m-fi" name="gouvernorat" value={form.gouvernorat} onChange={handleChange} placeholder="Ex: Tunis, Sfax..."/>
        </div>
        <div className="jl-m-fg">
          <label className="jl-m-fl">Délégation</label>
          <input className="jl-m-fi" name="delegation" value={form.delegation} onChange={handleChange} placeholder="Ex: Carthage..."/>
        </div>
      </div>
      <div className="jl-m-row">
        <div className="jl-m-fg">
          <label className="jl-m-fl">Ville</label>
          <input className="jl-m-fi" name="ville" value={form.ville} onChange={handleChange} placeholder="Ex: La Marsa..."/>
        </div>
        <div className="jl-m-fg">
          <label className="jl-m-fl">Statut</label>
          <select className="jl-m-fi" name="statut" value={form.statut} onChange={handleChange}>
            <option value="">—</option>
            <option value="college">Collège</option>
            <option value="lycee">Lycée</option>
            <option value="etudiant">Étudiant</option>
            <option value="diplome">Diplômé</option>
            <option value="autre">Autre</option>
          </select>
        </div>
      </div>
      <div className="jl-m-fg">
        <label className="jl-m-fl">Établissement</label>
        <input className="jl-m-fi" name="etablissement" value={form.etablissement} onChange={handleChange} placeholder="Nom de ton école / université..."/>
      </div>
      <div className="jl-m-fg">
        <label className="jl-m-fl">Bio</label>
        <textarea className="jl-m-fi" name="bio" value={form.bio} onChange={handleChange}
          placeholder="Parlez de vous…" style={{ resize:"vertical", minHeight:72, lineHeight:1.55 }}/>
      </div>

      {/* Feedback */}
      {error  && <div style={{ background:"#fee2e2", color:"#b91c1c", padding:"10px 14px", borderRadius:10, fontSize:13, marginTop:8 }}>❌ {error}</div>}
      {saved  && <div style={{ background:"#d1fae5", color:"#065f46", padding:"10px 14px", borderRadius:10, fontSize:13, marginTop:8 }}>✅ Profil mis à jour avec succès !</div>}

      {/* Save button */}
      <button
        style={{ marginTop:16, width:"100%", padding:"11px 0", borderRadius:12, background:"linear-gradient(135deg,#5a3fa0,#7c5cbf)", color:"#fff", fontSize:14, fontWeight:700, border:"none", cursor: saving ? "not-allowed":"pointer", opacity: saving ? 0.7 : 1, display:"flex", alignItems:"center", justifyContent:"center", gap:8, transition:"opacity .2s" }}
        onClick={handleSave}
        disabled={saving}>
        {saving ? "⏳ Enregistrement..." : <><Icon name="check" size={16}/> Enregistrer les modifications</>}
      </button>
    </>
  );
};

const ModalToggles = ({ items, initState }) => {
  const [states, setStates] = useState(initState || items.map(() => true));
  return (
    <>
      {items.map((item, i) => (
        <div key={i} className="jl-m-toggle-row">
          <div style={{ flex:1 }}>
            <p style={{ fontSize:13, fontWeight:600, color:"#261a52", marginBottom:2 }}>{item.label}</p>
            {item.sub && <p style={{ fontSize:11.5, color:"#9080b8" }}>{item.sub}</p>}
          </div>
          <Toggle on={states[i]} onToggle={() => setStates(s => { const n=[...s]; n[i]=!n[i]; return n; })} />
        </div>
      ))}
    </>
  );
};

const ModalAppearance = () => {
  const [theme, setTheme] = useState(0);
  return (
    <>
      <p className="jl-m-fl" style={{ marginBottom:10 }}>Thème</p>
      <div style={{ display:"flex", gap:10, marginBottom:20 }}>
        {[["☀️","Clair"],["🌙","Sombre"],["✨","Auto"]].map(([ic,l],i) => (
          <div key={i} onClick={() => setTheme(i)}
            style={{ flex:1, padding:"14px 8px", borderRadius:13, border:`2px solid ${theme===i?"#5a3fa0":"#e0d8f0"}`, background:theme===i?"#f0ebff":"#faf8ff", textAlign:"center", cursor:"pointer", transition:"all .22s" }}>
            <div style={{ fontSize:24, marginBottom:6 }}>{ic}</div>
            <p style={{ fontSize:12, fontWeight:600, color:"#261a52" }}>{l}</p>
          </div>
        ))}
      </div>
      <p className="jl-m-fl" style={{ marginBottom:8 }}>Langue</p>
      <select className="jl-m-fi">
        <option>Français</option><option>العربية</option><option>English</option>
      </select>
    </>
  );
};

const ModalSecurity = () => (
  <>
    <div className="jl-m-fg"><label className="jl-m-fl">Mot de passe actuel</label><input className="jl-m-fi" type="password" placeholder="••••••••"/></div>
    <div className="jl-m-fg"><label className="jl-m-fl">Nouveau mot de passe</label><input className="jl-m-fi" type="password" placeholder="••••••••"/></div>
    <div style={{ background:"linear-gradient(135deg,rgba(90,63,160,0.07),rgba(124,92,191,0.05))", borderRadius:14, padding:16, border:"1px solid rgba(90,63,160,0.16)", display:"flex", alignItems:"center", gap:12 }}>
      <div style={{ width:44, height:44, borderRadius:13, background:"linear-gradient(135deg,#5a3fa0,#7c5cbf)", display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}>
        <Icon name="shield" size={20}/><span style={{ color:"#fff", marginLeft:-20 }}/>
      </div>
      <div style={{ flex:1 }}>
        <p style={{ fontSize:13, fontWeight:700, color:"#261a52", marginBottom:2 }}>Authentification 2 facteurs</p>
        <p style={{ fontSize:11.5, color:"#9080b8" }}>Renforcez la sécurité de votre compte</p>
      </div>
      <button style={{ padding:"8px 16px", borderRadius:10, background:"linear-gradient(135deg,#5a3fa0,#7c5cbf)", color:"#fff", fontSize:12, fontWeight:700, border:"none", cursor:"pointer", boxShadow:"0 4px 14px rgba(90,63,160,0.3)" }}>Activer</button>
    </div>
  </>
);

const MODAL_MAP = {
  profile : { title:"Mon profil",      Body: ModalProfile,    hasFoot: false },
  notif   : { title:"Notifications",   Body: () => <ModalToggles items={[{label:"Nouvelles publications",sub:"Quand un membre publie"},{label:"Commentaires",sub:"Sur vos publications"},{label:"Messages",sub:"Nouveaux messages"},{label:"Live",sub:"Alertes avant les sessions"}]} initState={[true,true,false,true]}/>, hasFoot:true },
  priv    : { title:"Confidentialité", Body: () => <ModalToggles items={[{label:"Profil public"},{label:"Afficher mes publications"},{label:"Autoriser les messages"},{label:"Indexation dans la recherche"}]} initState={[true,true,true,false]}/>, hasFoot:true },
  app     : { title:"Apparence",       Body: ModalAppearance, hasFoot: true },
  sec     : { title:"Sécurité",        Body: ModalSecurity,   hasFoot: true },
};

/* ═══════════════════════════════════════════════════════════
   LIVE WIDGET — sidebar, shows active live from API
═══════════════════════════════════════════════════════════ */
const LiveEvWidget = ({ goToLive, activeLiveLink }) => {
  const [live, setLive] = React.useState(null);
  const navigate = useNavigate();

  React.useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) return;
    // Fetch active live
    fetch("https://debat-jeune.onrender.com/api/lives", { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.json())
      .then(list => {
        const active = Array.isArray(list) ? list.find(l => l.is_active) : null;
        setLive(active || null);
      })
      .catch(() => {});

    const onStarted = e => {
      const d = e.detail;
      if (d.viewerLink) {
        setLive({
          room_code: d.roomCode,
          stream_link: d.viewerLink,
          title_live: d.title || "Live en cours",
        });
      }
    };
    window.addEventListener("live-started", onStarted);
    window.addEventListener("live-ended", () => setLive(null));
    return () => {
      window.removeEventListener("live-started", onStarted);
      window.removeEventListener("live-ended", () => setLive(null));
    };
  }, []);

  // Sync avec activeLiveLink passé depuis JeuneLayout
  React.useEffect(() => {
    if (activeLiveLink && !live) {
      setLive({ stream_link: activeLiveLink, title_live: "Live en cours" });
    }
  }, [activeLiveLink]);

  const joinLive = () => {
    const linkToUse = live?.stream_link || activeLiveLink || localStorage.getItem("currentLiveViewerLink");
    if (linkToUse) {
      try {
        const url      = new URL(linkToUse);
        const parts    = url.pathname.split("/").filter(Boolean);
        const roomCode = parts[parts.length - 1];
        const vt       = url.searchParams.get("vt");
        if (roomCode && vt) { navigate(`/meet/${roomCode}?vt=${vt}`); return; }
      } catch {}
    }
    goToLive();
  };

  if (!live) return (
    <div className="jl-ev-widget">
      <p className="jl-ev-tag">Sessions Live</p>
      <p className="jl-ev-name">Aucun live en cours</p>
      <p className="jl-ev-time"><Icon name="clock" size={12}/>Disponible prochainement</p>
      <button className="jl-ev-join" onClick={goToLive}>
        <Icon name="radio" size={13}/>Voir les lives
      </button>
    </div>
  );

  return (
    <div className="jl-ev-widget" style={{ borderColor: "#ea4335", borderWidth: 2 }}>
      <p className="jl-ev-tag" style={{ color: "#ea4335", display:"flex", alignItems:"center", gap:4 }}>
        <span style={{ width:8, height:8, borderRadius:"50%", background:"#ea4335", display:"inline-block", animation:"jlPulse 1s infinite" }}/>
        LIVE EN COURS
      </p>
      <p className="jl-ev-name">{live.title_live || "Live en cours"}</p>
      {live.time && <p className="jl-ev-time"><Icon name="clock" size={12}/>{live.time}</p>}
      <button className="jl-ev-join" onClick={joinLive} style={{ background:"linear-gradient(135deg,#ea4335,#b31412)" }}>
        <Icon name="play" size={13}/>Rejoindre maintenant
      </button>
    </div>
  );
};

/* ═══════════════════════════════════════════════════════════
   JEUNE CALENDAR VIEW — Read-only calendar
   Shows only events/notes posted by Admin (from localStorage).
   Jeune cannot add, edit or delete anything.
   Clicking any cell shows a friendly "équipe Swafy" message.
═══════════════════════════════════════════════════════════ */
const CAL_CAT_COLORS_J = {
  Live:      { bg:"#0ABFAA", light:"#E6F9F7", text:"#065E56" },
  Enquete:   { bg:"#F59E0B", light:"#FEF3C7", text:"#78350F" },
  Evenement: { bg:"#6366F1", light:"#EEF2FF", text:"#3730A3" },
  Personnel: { bg:"#EC4899", light:"#FCE7F3", text:"#9D174D" },
};

function JeuneCalendarView() {
  const [current,  setCurrent]  = React.useState(new Date());
  const [selected, setSelected] = React.useState(new Date());
  const [notes,    setNotes]    = React.useState({});
  const [lives,    setLives]    = React.useState({});
  const [toast,    setToast]    = React.useState(null);
  const [detailEv, setDetailEv] = React.useState(null);

  // Load admin notes from localStorage (read-only)
  React.useEffect(() => {
    try {
      const raw = JSON.parse(localStorage.getItem("swafy_calendar_notes") || "{}");
      setNotes(raw);
    } catch {}
  }, []);

  // Fetch lives from API
  React.useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) return;
    fetch("https://debat-jeune.onrender.com/api/lives", { headers:{ Authorization:`Bearer ${token}` } })
      .then(r => r.json())
      .then(list => {
        if (!Array.isArray(list)) return;
        const map = {};
        list.forEach(live => {
          if (!live.date) return;
          const key = live.date.slice(0,10);
          if (!map[key]) map[key] = [];
          map[key].push({ title: live.title_live || "Live", time: live.time || "", category:"Live", isActive: live.is_active });
        });
        setLives(map);
      })
      .catch(() => {});
  }, []);

  const showTeamToast = () => {
    setToast("💬 L'équipe Swafy gère le calendrier. Tu peux consulter les événements ici !");
    setTimeout(() => setToast(null), 3500);
  };

  const keyOf = d => {
    const y = d.getFullYear(), m = String(d.getMonth()+1).padStart(2,"0"), dd = String(d.getDate()).padStart(2,"0");
    return `${y}-${m}-${dd}`;
  };

  const eventsOfDay = (day) => {
    const key = keyOf(day);
    const noteEvs = (notes[key] || []).map((n,i) => ({ ...n, id:`note-${key}-${i}`, isNote:true }));
    const liveEvs = (lives[key] || []);
    return [...liveEvs, ...noteEvs];
  };

  // Build month grid
  const monthStart = new Date(current.getFullYear(), current.getMonth(), 1);
  const monthEnd   = new Date(current.getFullYear(), current.getMonth()+1, 0);
  // Start on Monday
  const gridStart  = new Date(monthStart);
  gridStart.setDate(gridStart.getDate() - ((gridStart.getDay()+6)%7));
  const gridEnd    = new Date(monthEnd);
  gridEnd.setDate(gridEnd.getDate() + ((7 - (gridEnd.getDay()+6)%7) % 7));

  const days = [];
  for (let d = new Date(gridStart); d <= gridEnd; d.setDate(d.getDate()+1))
    days.push(new Date(d));

  const fmt = (d, opts) => d.toLocaleDateString("fr-FR", opts);
  const isToday = d => keyOf(d) === keyOf(new Date());
  const isSel   = d => keyOf(d) === keyOf(selected);
  const inMonth = d => d.getMonth() === current.getMonth();

  const prev = () => setCurrent(new Date(current.getFullYear(), current.getMonth()-1, 1));
  const next = () => setCurrent(new Date(current.getFullYear(), current.getMonth()+1, 1));

  const selEvs = eventsOfDay(selected);

  return (
    <div className="jl-page" style={{ padding:0 }}>
      <style>{`
        .jcal-root { font-family:'DM Sans',sans-serif; background:#fff; border-radius:18px; overflow:hidden; box-shadow:0 4px 24px rgba(90,63,160,.08); border:1px solid #EEF2FF; }
        .jcal-header { display:flex; align-items:center; gap:12px; padding:18px 22px; border-bottom:1px solid #EEF2FF; background:linear-gradient(135deg,#5a3fa0,#7c5cbf); }
        .jcal-title  { font-size:17px; font-weight:700; color:#fff; flex:1; font-family:'Poppins',sans-serif; }
        .jcal-nav    { background:rgba(255,255,255,.18); border:none; color:#fff; width:30px; height:30px; border-radius:8px; cursor:pointer; font-size:15px; display:flex; align-items:center; justify-content:center; transition:background .15s; }
        .jcal-nav:hover { background:rgba(255,255,255,.3); }
        .jcal-readonly-badge { background:rgba(255,255,255,.2); color:#fff; font-size:10px; font-weight:700; padding:3px 10px; border-radius:20px; letter-spacing:.5px; }
        .jcal-dow-row { display:grid; grid-template-columns:repeat(7,1fr); background:#F7F9FC; }
        .jcal-dow    { text-align:center; font-size:10px; font-weight:700; color:#94A3B8; padding:8px 0; text-transform:uppercase; letter-spacing:.6px; }
        .jcal-grid   { display:grid; grid-template-columns:repeat(7,1fr); }
        .jcal-cell   { border-right:1px solid #EEF2FF; border-bottom:1px solid #EEF2FF; padding:6px 8px; min-height:80px; cursor:pointer; transition:background .12s; display:flex; flex-direction:column; }
        .jcal-cell:hover { background:#F0FDF9; }
        .jcal-cell.sel { background:#E6F9F7; }
        .jcal-day-num { display:inline-flex; align-items:center; justify-content:center; width:24px; height:24px; border-radius:50%; font-size:12px; font-weight:500; margin-bottom:4px; }
        .jcal-day-num.today { background:#0ABFAA; color:#fff; font-weight:700; }
        .jcal-ev-chip { border-radius:5px; padding:1px 6px; font-size:10px; font-weight:600; margin-bottom:2px; overflow:hidden; white-space:nowrap; text-overflow:ellipsis; }
        .jcal-more   { font-size:10px; color:#6366F1; font-weight:700; }
        .jcal-side   { background:#F7F9FC; border-top:1px solid #EEF2FF; padding:16px 20px; }
        .jcal-side-title { font-size:13px; font-weight:700; color:#1A2340; margin-bottom:10px; font-family:'Poppins',sans-serif; }
        .jcal-ev-row { display:flex; gap:10px; padding:8px 0; border-bottom:1px solid #EEF2FF; align-items:flex-start; }
        .jcal-ev-dot { width:8px; height:8px; border-radius:50%; margin-top:4px; flex-shrink:0; }
        .jcal-ev-name { font-size:12px; font-weight:600; color:#1A2340; }
        .jcal-ev-time { font-size:10px; color:#94A3B8; }
        .jcal-empty  { font-size:12px; color:#94A3B8; padding:12px 0; text-align:center; }
        .jcal-toast  { position:fixed; bottom:28px; left:50%; transform:translateX(-50%); background:#1A2340; color:#fff; padding:12px 22px; border-radius:12px; font-size:13px; font-weight:600; z-index:9999; box-shadow:0 8px 24px rgba(0,0,0,.2); animation:jcalToast .25s ease; white-space:nowrap; }
        @keyframes jcalToast { from{opacity:0;transform:translateX(-50%) translateY(12px)}to{opacity:1;transform:translateX(-50%) translateY(0)} }
        .jcal-detail-overlay { position:fixed; inset:0; background:rgba(15,23,42,.35); backdrop-filter:blur(5px); display:flex; align-items:center; justify-content:center; z-index:9999; }
        .jcal-detail-box { background:#fff; border-radius:16px; width:360px; max-width:95vw; padding:24px; box-shadow:0 20px 60px rgba(0,0,0,.18); animation:jcalPop .2s cubic-bezier(.34,1.56,.64,1); }
        @keyframes jcalPop { from{transform:scale(.94);opacity:0}to{transform:scale(1);opacity:1} }
      `}</style>

      <div style={{ padding:"16px 16px 20px" }}>
        <div className="jcal-root">
          {/* Header */}
          <div className="jcal-header">
            <button className="jcal-nav" onClick={prev}>‹</button>
            <span className="jcal-title">
              {fmt(current, { month:"long", year:"numeric" })}
            </span>
            <span className="jcal-readonly-badge">📅 Consultation uniquement</span>
            <button className="jcal-nav" onClick={next}>›</button>
          </div>

          {/* DOW row */}
          <div className="jcal-dow-row">
            {["Lun","Mar","Mer","Jeu","Ven","Sam","Dim"].map(d => (
              <div key={d} className="jcal-dow">{d}</div>
            ))}
          </div>

          {/* Grid */}
          <div className="jcal-grid">
            {days.map((day, i) => {
              const evs = eventsOfDay(day);
              const sel = isSel(day);
              const tod = isToday(day);
              const inM = inMonth(day);
              return (
                <div key={i} className={`jcal-cell${sel ? " sel" : ""}`}
                  style={{ opacity: inM ? 1 : 0.3 }}
                  onClick={() => {
                    setSelected(new Date(day));
                    if (!evs.length) showTeamToast();
                  }}>
                  <div className={`jcal-day-num${tod ? " today" : ""}`}
                    style={{ color: !tod ? (inM ? "#1A2340" : "#94A3B8") : undefined }}>
                    {day.getDate()}
                  </div>
                  {evs.slice(0,2).map((ev, j) => {
                    const col = CAL_CAT_COLORS_J[ev.category] || CAL_CAT_COLORS_J.Personnel;
                    return (
                      <div key={j} className="jcal-ev-chip"
                        style={{ background:col.bg, color:"#fff" }}
                        onClick={e => { e.stopPropagation(); setDetailEv(ev); }}>
                        {ev.title}
                      </div>
                    );
                  })}
                  {evs.length > 2 && <div className="jcal-more">+{evs.length-2} autres</div>}
                </div>
              );
            })}
          </div>

          {/* Selected day events */}
          <div className="jcal-side">
            <div className="jcal-side-title">
              {fmt(selected, { weekday:"long", day:"numeric", month:"long" })}
            </div>
            {selEvs.length === 0 ? (
              <div className="jcal-empty">Aucun événement ce jour-là</div>
            ) : selEvs.map((ev, i) => {
              const col = CAL_CAT_COLORS_J[ev.category] || CAL_CAT_COLORS_J.Personnel;
              return (
                <div key={i} className="jcal-ev-row"
                  style={{ cursor:"pointer" }}
                  onClick={() => setDetailEv(ev)}>
                  <div className="jcal-ev-dot" style={{ background:col.bg }} />
                  <div>
                    <div className="jcal-ev-name">{ev.title}</div>
                    {ev.time && <div className="jcal-ev-time">🕐 {ev.time}</div>}
                    {ev.isActive && (
                      <span style={{ background:"#EF4444", color:"#fff", fontSize:9, padding:"1px 5px", borderRadius:4, fontWeight:800 }}>EN DIRECT</span>
                    )}
                  </div>
                  <span style={{ marginLeft:"auto", fontSize:10, color:col.bg, fontWeight:700, background:col.light, padding:"2px 8px", borderRadius:10 }}>
                    {ev.category === "Enquete" ? "Enquête" : ev.category === "Evenement" ? "Événement" : ev.category}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Toast */}
      {toast && <div className="jcal-toast">{toast}</div>}

      {/* Detail popup */}
      {detailEv && (
        <div className="jcal-detail-overlay" onClick={() => setDetailEv(null)}>
          <div className="jcal-detail-box" onClick={e => e.stopPropagation()}>
            <div style={{ display:"flex", gap:10, alignItems:"flex-start", marginBottom:14 }}>
              <div style={{ width:10, height:10, borderRadius:"50%", background:(CAL_CAT_COLORS_J[detailEv.category]||CAL_CAT_COLORS_J.Personnel).bg, marginTop:5, flexShrink:0 }} />
              <div style={{ flex:1 }}>
                <p style={{ fontSize:16, fontWeight:700, color:"#1A2340", fontFamily:"Poppins,sans-serif", marginBottom:4 }}>{detailEv.title}</p>
                {detailEv.time && <p style={{ fontSize:12, color:"#94A3B8", marginBottom:4 }}>🕐 {detailEv.time}</p>}
                {detailEv.text && <p style={{ fontSize:12, color:"#4A5568", lineHeight:1.5 }}>{detailEv.text}</p>}
                {detailEv.isActive && <span style={{ background:"#EF4444", color:"#fff", fontSize:10, padding:"2px 8px", borderRadius:6, fontWeight:800 }}>EN DIRECT</span>}
              </div>
            </div>
            <div style={{ background:"#FEF3C7", borderRadius:10, padding:"10px 14px", marginBottom:14, fontSize:12, color:"#78350F", display:"flex", gap:8, alignItems:"flex-start" }}>
              <span>ℹ️</span>
              <span>Cet événement est géré par l'équipe Swafy. Pour toute question, contactez-nous via la messagerie.</span>
            </div>
            <div style={{ display:"flex", justifyContent:"flex-end" }}>
              <button onClick={() => setDetailEv(null)}
                style={{ padding:"8px 20px", border:"none", borderRadius:8, background:"#0ABFAA", color:"#fff", fontSize:13, fontWeight:700, cursor:"pointer", fontFamily:"Poppins,sans-serif" }}>
                Fermer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════
   MAIN COMPONENT
═══════════════════════════════════════════════════════════ */
const JeuneLayout = () => {
  const [user] = useState(() => {
    try { return JSON.parse(localStorage.getItem("user")) || null; }
    catch { return null; }
  });
  const navigate = useNavigate();

  /* UI */
  const [activePage,    setActivePage]    = useState(PAGES.HOME);
  const [sidebarOpen,   setSidebarOpen]   = useState(true);
  const [mobileOpen,    setMobileOpen]    = useState(false);
  const [modalKey,      setModalKey]      = useState(null);

  /* data */
  const [publications,  setPublications]  = useState([]);
  const [loading,       setLoading]       = useState(true);
  const [highlightedPub,setHighlightedPub]= useState(null);
  const [unreadMessages,setUnreadMessages]= useState(0);
  const [unreadNotifs,  setUnreadNotifs]  = useState(0);
  const [notifications, setNotifications] = useState([]);

  /* publish form */
  const [pubTitle, setPubTitle] = useState("");
  const [pubBody,  setPubBody]  = useState("");
  const [pubCat,   setPubCat]   = useState("");
  const [pubVis,   setPubVis]   = useState("public");
  const [pubBusy,  setPubBusy]  = useState(false);

  const [cbInput, setCbInput] = useState("");
  const [cbMsgs,  setCbMsgs]  = useState([
    { from:"bot", text:"👋 Salam ! Je suis l'assistant Swafy. Posez-moi vos questions sur la plateforme, les événements, ou tout autre sujet !" },
  ]);
  const cbEndRef = useRef(null);

  /* ── LIVE STATE (pour notification + chatbot) ── */
  const [activeLiveLink, setActiveLiveLink] = useState(null); // viewerLink du live actif
  const [liveNotifToast, setLiveNotifToast] = useState(null); // toast notification live

  /* ── SOCKET ── ✅ FIX: useRef pour éviter le loop connect/disconnect */
  const socketRef = useRef(null);

  useEffect(() => {
    // ✅ FIX: si socket déjà créé, ne pas en créer un autre
    if (socketRef.current) return;

    const token = localStorage.getItem("token");
    if (!token) return;

    socketRef.current = io(BACKEND, {
      auth: { token },
      transports: ["websocket"],
      reconnectionAttempts: 5,     
      reconnectionDelay: 3000,     
    });

    socketRef.current.on("connect_error", (e) => console.error("Socket:", e.message));
    socketRef.current.on("new_message", () => setUnreadMessages((n) => n + 1));

    // ✅ Notification générale (publication, commentaire, réaction, enquête, live)
    socketRef.current.on("new_notification", (notif) => {
      const type = notif?.type_notification;
      // live_started géré séparément via "live-started" event
      if (type === "live_started") return;
      setNotifications((prev) => {
        if (prev.some(n => n.id_notification === notif.id_notification)) return prev;
        return [{ ...notif, is_read: false }, ...prev];
      });
      setUnreadNotifs((n) => n + 1);
    });

    // ✅ Notification live en temps réel
    socketRef.current.on("live-started", (data) => {
      const { viewerLink, title, roomCode } = data;
      if (viewerLink) {
        localStorage.setItem("currentLiveViewerLink", viewerLink);
        setActiveLiveLink(viewerLink);
      }
      // Afficher toast notification
      setLiveNotifToast({ title: title || "Live en cours", viewerLink, roomCode });
      setUnreadNotifs((n) => n + 1);
      // Ajouter dans la liste des notifications
      setNotifications((prev) => [{
        id_notification: Date.now(),
        type_notification: "live_started",
        message: `🔴 Live démarré — "${title || "Live en cours"}" — Cliquez pour rejoindre`,
        is_read: false,
        created_at: new Date().toISOString(),
        _liveLink: viewerLink,
        _roomCode: roomCode,
      }, ...prev]);
      // Auto-hide toast après 15s
      setTimeout(() => setLiveNotifToast(null), 15000);
    });

    socketRef.current.on("live-ended", () => {
      setActiveLiveLink(null);
      setLiveNotifToast(null);
    });

    return () => {
      socketRef.current?.disconnect();
      socketRef.current = null;
    };
  }, []); // ✅ dependency array vide = une seule fois

  // ✅ Charger le live actif au démarrage
  useEffect(() => {
    const stored = localStorage.getItem("currentLiveViewerLink");
    if (stored) setActiveLiveLink(stored);
    // Vérifier depuis l'API aussi
    API.get("/lives").then(res => {
      const list = Array.isArray(res.data) ? res.data : [];
      const active = list.find(l => l.is_active === 1 || l.is_active === true);
      if (active?.stream_link) {
        setActiveLiveLink(active.stream_link);
        localStorage.setItem("currentLiveViewerLink", active.stream_link);
      }
    }).catch(() => {});
  }, []);

  /* ── FETCH ── */
  const fetchPublications = useCallback(async (silent = false) => {
    try {
      if (!silent) setLoading(true);
      const res = await API.get("/publications");
      setPublications(Array.isArray(res.data) ? res.data : []);
    } catch { setPublications([]); }
    finally   { if (!silent) setLoading(false); }
  }, []);

  const fetchNotifications = useCallback(async () => {
    try {
      const res  = await API.get("/notifications");
      const list = Array.isArray(res.data) ? res.data : [];
      setNotifications(list);
      setUnreadNotifs(list.filter((n) => !n.is_read).length);
    } catch {}
  }, []);

  useEffect(() => {
    fetchPublications();
    fetchNotifications();
    const params = new URLSearchParams(window.location.search);
    const pubId  = params.get("publication");
    if (pubId) {
      setHighlightedPub(parseInt(pubId));
      setTimeout(() => {
        document.getElementById(`pub-${pubId}`)
          ?.scrollIntoView({ behavior:"smooth", block:"center" });
      }, 900);
    }
  }, []);

  useEffect(() => { cbEndRef.current?.scrollIntoView({ behavior:"smooth" }); }, [cbMsgs]);

  /* ── ACTIONS ── */
  const handleLogout = () => {
    socketRef.current?.disconnect();
    socketRef.current = null;
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    window.location.href = "/login";
  };

  const goTo = (page) => {
    setActivePage(page);
    setMobileOpen(false);
  };

  const markNotifRead = async (notif) => {
    // Support both old format (id only) and new format (object with _liveLink)
    const id = typeof notif === "object" ? notif.id_notification : notif;
    const liveLink = typeof notif === "object" ? notif._liveLink : null;
    const roomCode = typeof notif === "object" ? notif._roomCode : null;
    try { await API.put(`/notifications/${id}/read`); fetchNotifications(); } catch {}
    // Si c'est une notif live → naviguer vers le live
    if (liveLink) {
      try {
        const url = new URL(liveLink);
        const parts = url.pathname.split("/").filter(Boolean);
        const rc = parts[parts.length - 1];
        const vt = url.searchParams.get("vt");
        if (rc && vt) { navigate(`/meet/${rc}?vt=${vt}`); return; }
      } catch {}
    }
    if (roomCode) navigate(`/meet/${roomCode}`);
  };

  const handlePublier = async (e) => {
    e.preventDefault();
    if (!pubTitle.trim() || !pubBody.trim()) return;
    try {
      setPubBusy(true);
      await API.post("/publications", {
        titre_publication   : pubTitle,
        contenu_publication : pubBody,
        categorie           : pubCat,
        visibilite          : pubVis,
      });
      setPubTitle(""); setPubBody(""); setPubCat(""); setPubVis("public");
      goTo(PAGES.HOME); // ← va à HOME
      await fetchPublications(); // ← refresh le feed (moch navigate lel dashboard)
    } catch (err) { console.error(err); }
    finally { setPubBusy(false); }
  };

  const [cbLoading, setCbLoading] = useState(false);

  const sendCb = async () => {
    const text = cbInput.trim();
    if (!text || cbLoading) return;

    const userMsg = { from:"user", text };
    setCbMsgs((m) => [...m, userMsg]);
    setCbInput("");
    setCbLoading(true);

    // Construire l'historique pour le contexte (exclure le msg de bienvenue initial)
    const history = cbMsgs
      .filter(m => m.from === "user" || m.from === "bot")
      .map(m => ({ sender: m.from === "user" ? "user" : "bot", text: m.text }));

    try {
      const res = await API.post("/chatbot", {
        message: text,
        history,
        context: activeLiveLink ? `Un live est actuellement en cours sur la plateforme Swafy.` : "",
      });
      const reply = res.data.reply || "Je n'ai pas compris. Pouvez-vous reformuler ?";
      setCbMsgs((m) => [...m, { from:"bot", text: reply }]);
    } catch (err) {
      const fallback = err?.response?.data?.reply || "❌ Erreur de connexion. Réessayez dans un instant.";
      setCbMsgs((m) => [...m, { from:"bot", text: fallback }]);
    } finally {
      setCbLoading(false);
    }
  };

  /* ── NAV ── */
  const NAV = [
    { icon:"home",     label:"Accueil",        page:PAGES.HOME },
    { icon:"message",  label:"Messages",        page:PAGES.MESSAGES,  badge:unreadMessages||null },
    { icon:"calendar", label:"Calendrier",      page:PAGES.CALENDAR },
    { icon:"radio",    label:"Live",            page:PAGES.LIVE,      live:true },
    { icon:"pencil",   label:"Enquêtes",        page:PAGES.ENQUETE },
    { icon:"bell",     label:"Notifications",   page:PAGES.NOTIFS,    badge:unreadNotifs||null },
    
  ];

  /* ── MODAL ── */
  const openModal = (key) => setModalKey(key);
  const closeModal = () => setModalKey(null);
  const modalDef  = modalKey ? MODAL_MAP[modalKey] : null;

  /* ═══════════════════════════════════════════════════════
     PAGE CONTENT
  ═══════════════════════════════════════════════════════ */
  const renderContent = () => {
    switch (activePage) {

      /* ── MESSAGES ── */
      case PAGES.MESSAGES:
        return (
          <div className="jl-page">
            <JeuneContact />
          </div>
        );

      /* ── NOTIFICATIONS ── */
      case PAGES.NOTIFS: {
        const BACK_URL = BACKEND;
        const getNotifIcon = (type) => ({
          new_post:             "📢",
          publication_comment:  "💬",
          publication_reaction: "❤️",
          debat_vote:           "⚖️",
          comment_reaction:     "👍",
          live_started:         "🔴",
          enquete_response:     "📋",
          new_enquete:          "📋",
        }[type] || "🔔");

        const getNotifBg = (type, isRead) => {
          if (type === "live_started") return isRead ? "#fff9f0" : "#fff3e0";
          return isRead ? "white" : "#f0f3ff";
        };

        const timeAgoFmt = (date) => {
          const diff = Date.now() - new Date(date).getTime();
          const mins  = Math.floor(diff / 60000);
          const hours = Math.floor(diff / 3600000);
          const days  = Math.floor(diff / 86400000);
          if (mins < 1)   return "À l'instant";
          if (mins < 60)  return `Il y a ${mins} min`;
          if (hours < 24) return `Il y a ${hours}h`;
          return `Il y a ${days}j`;
        };

        const handleNotifClick = async (n) => {
          const notifId = n.id_notification;
          const type    = n.type_notification;

          // Marquer comme lu immédiatement (UX)
          if (!n.is_read && notifId && !String(notifId).startsWith("live-")) {
            setNotifications(prev => prev.map(x =>
              x.id_notification === notifId ? { ...x, is_read: 1 } : x
            ));
            setUnreadNotifs(c => Math.max(0, c - 1));
            try { await API.put(`/notifications/${notifId}/read`); } catch {}
          }

          // 1. LIVE → naviguer vers le live
          if (type === "live_started" || n._liveLink || n._roomCode) {
            if (n._liveLink) {
              try {
                const url   = new URL(n._liveLink);
                const parts = url.pathname.split("/").filter(Boolean);
                const rc    = parts[parts.length - 1];
                const vt    = url.searchParams.get("vt");
                if (rc && vt) { navigate(`/meet/${rc}?vt=${vt}`); return; }
              } catch {}
            }
            if (n._roomCode) { navigate(`/meet/${n._roomCode}`); return; }
            // Chercher live actif depuis API
            try {
              const res = await API.get("/lives");
              const live = Array.isArray(res.data) ? res.data.find(l => l.is_active) : null;
              if (live?.stream_link) {
                const url   = new URL(live.stream_link);
                const parts = url.pathname.split("/").filter(Boolean);
                const rc    = parts[parts.length - 1];
                const vt    = url.searchParams.get("vt");
                if (rc && vt) { navigate(`/meet/${rc}?vt=${vt}`); return; }
              }
              if (live?.room_code) { navigate(`/meet/${live.room_code}`); return; }
            } catch {}
            goTo(PAGES.LIVE);
            return;
          }

          // 2. ENQUÊTE → page enquêtes (réponse admin ou nouvelle enquête)
          if (type === "enquete_response" || type === "new_enquete") {
            goTo(PAGES.ENQUETE);
            return;
          }

          // 3. PUBLICATION / COMMENTAIRE / RÉACTION / VOTE
          // → naviguer vers la page publication dédiée (route /jeune/publication/:id)
          const isPubType = [
            "new_post", "publication_comment",
            "publication_reaction", "debat_vote", "comment_reaction"
          ].includes(type);

          if (isPubType && n.entity_id) {
            navigate(`/jeune/publication/${n.entity_id}`);
            return;
          }

          // Fallback : rester sur HOME avec scroll
          if (n.entity_id) {
            goTo(PAGES.HOME);
            const pubId = String(n.entity_id);
            const tryScroll = (attempts = 0) => {
              const el = document.getElementById(`pub-${pubId}`);
              if (el) {
                el.scrollIntoView({ behavior: "smooth", block: "center" });
                el.style.transition   = "box-shadow .4s";
                el.style.boxShadow    = "0 0 0 3px #7c3aed";
                el.style.borderRadius = "16px";
                setTimeout(() => { el.style.boxShadow = ""; }, 2500);
              } else if (attempts < 10) {
                setTimeout(() => tryScroll(attempts + 1), 300);
              }
            };
            setTimeout(() => tryScroll(), 350);
          }
        };

        return (
          <div className="jl-page">
            {/* Header */}
            <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:20, flexWrap:"wrap", gap:10 }}>
              <h2 className="jl-section-title" style={{ margin:0 }}>
                <Icon name="bell" size={18}/> Notifications
                {unreadNotifs > 0 && (
                  <span style={{ marginLeft:10, background:"#7c3aed", color:"white", borderRadius:20, padding:"2px 10px", fontSize:13, fontWeight:600 }}>
                    {unreadNotifs}
                  </span>
                )}
              </h2>
              {unreadNotifs > 0 && (
                <button
                  onClick={async () => {
                    try { await API.put("/notifications/read-all"); await fetchNotifications(); } catch {}
                  }}
                  style={{ background:"none", border:"1px solid #7c3aed", borderRadius:20, padding:"6px 14px", color:"#7c3aed", cursor:"pointer", fontSize:13, fontWeight:500 }}>
                  Tout lire
                </button>
              )}
            </div>

            {/* Liste */}
            {notifications.length === 0 ? (
              <div className="jl-empty">
                <span className="jl-empty-icon">🔔</span>
                <p>Aucune notification pour le moment</p>
                <p style={{ fontSize:13, color:"#aaa" }}>Vous serez notifié des nouvelles activités</p>
              </div>
            ) : (
              <div style={{ background:"white", borderRadius:16, boxShadow:"0 2px 12px rgba(0,0,0,.07)", overflow:"hidden" }}>
                {notifications.map((n, i) => (
                  <div
                    key={n.id_notification}
                    onClick={() => handleNotifClick(n)}
                    style={{
                      display:"flex", alignItems:"center", gap:13, padding:"15px 18px",
                      cursor:"pointer",
                      background: getNotifBg(n.type_notification, n.is_read),
                      borderBottom: i < notifications.length - 1 ? "1px solid #f0f0f0" : "none",
                      transition:"background .2s",
                      borderLeft: n.type_notification === "live_started" ? "3px solid #ef4444" : "3px solid transparent",
                      animationDelay:`${i * 0.05}s`,
                    }}
                    onMouseEnter={e => e.currentTarget.style.background="#f8f5ff"}
                    onMouseLeave={e => e.currentTarget.style.background=getNotifBg(n.type_notification, n.is_read)}
                  >
                    {/* Avatar */}
                    <div style={{ position:"relative", flexShrink:0 }}>
                      {n.type_notification === "live_started" ? (
                        <div style={{ width:44, height:44, borderRadius:"50%", background:"linear-gradient(135deg,#7c3aed,#ef4444)", display:"flex", alignItems:"center", justifyContent:"center", fontSize:18 }}>
                          🔴
                        </div>
                      ) : (
                        <img
                          src={n.photo_user ? `${BACK_URL}/${n.photo_user}` : "https://randomuser.me/api/portraits/lego/1.jpg"}
                          alt="user"
                          style={{ width:44, height:44, borderRadius:"50%", objectFit:"cover", border:"2px solid #e8e8f0" }}
                          onError={e => e.target.src="https://randomuser.me/api/portraits/lego/1.jpg"}
                        />
                      )}
                      <span style={{ position:"absolute", bottom:-2, right:-2, background:"white", borderRadius:"50%", width:19, height:19, display:"flex", alignItems:"center", justifyContent:"center", fontSize:11, boxShadow:"0 1px 4px rgba(0,0,0,.15)" }}>
                        {getNotifIcon(n.type_notification)}
                      </span>
                    </div>

                    {/* Texte */}
                    <div style={{ flex:1, minWidth:0 }}>
                      <p style={{ margin:0, fontSize:14, color:"#1a1a2e", lineHeight:1.4 }}>
                        {n.nom_user && <strong>{n.nom_user} {n.prenom_user} </strong>}
                        <span style={{ color:"#555" }}>{n.message}</span>
                      </p>
                      <div style={{ display:"flex", alignItems:"center", gap:8, marginTop:4 }}>
                        <span style={{ fontSize:12, color:"#999" }}>{timeAgoFmt(n.created_at)}</span>
                        {n.type_notification === "live_started" && (
                          <span style={{ fontSize:11, background:"#fef2f2", color:"#ef4444", padding:"2px 7px", borderRadius:20, fontWeight:700 }}>
                            🔴 LIVE
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Dot non lu */}
                    {!n.is_read && (
                      <div style={{ width:10, height:10, borderRadius:"50%", background:"#7c3aed", flexShrink:0 }}/>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        );
      }

      /* ── PUBLIER ── */
      case PAGES.PUBLIER:
        return (
          <PublierPage
            onBack={async () => {
              goTo(PAGES.HOME);              // go HOME first (instant)
              await fetchPublications(true); // then silent refresh
            }}
          />
        );

      /* ── CALENDAR ── Read-only for Jeune, fed by admin notes in localStorage ── */
      case PAGES.CALENDAR:
        return <JeuneCalendarView />;


      /* ── LIVE ── */
      case PAGES.LIVE:
        return (
          <div className="jl-page" style={{ padding: 0 }}>
            <LiveSection activeLiveLink={activeLiveLink} onLiveLinkReceived={(link) => {
              if (link) {
                setActiveLiveLink(link);
                localStorage.setItem("currentLiveViewerLink", link);
              }
            }} />
          </div>
        );

      /* ── ENQUETE ── ✅ */
      case PAGES.ENQUETE:
        return <JeuneEnquete />;

      /* ── SETTINGS ── */
      case PAGES.SETTINGS:
        return (
          <div className="jl-page">
            <h2 className="jl-section-title"><Icon name="settings" size={18}/> Paramètres</h2>
            {[
              { ico:"👤", label:"Informations personnelles", sub:"Nom, photo, bio",       bg:"rgba(90,63,160,0.1)", key:"profile" },
              { ico:"🔔", label:"Notifications",            sub:"Email, push, SMS",       bg:"rgba(59,130,246,0.1)", key:"notif" },
              { ico:"🔒", label:"Confidentialité",          sub:"Visibilité du profil",   bg:"rgba(16,185,129,0.1)", key:"priv" },
              { ico:"🎨", label:"Apparence",                sub:"Thème, langue",          bg:"rgba(236,72,153,0.1)", key:"app" },
              { ico:"🛡️", label:"Sécurité",                 sub:"Mot de passe, 2FA",      bg:"rgba(245,158,11,0.1)", key:"sec" },
            ].map((s, i) => (
              <div key={i} className="jl-settings-item"
                style={{ animationDelay:`${i*0.07}s` }}
                onClick={() => openModal(s.key)}>
                <div className="jl-settings-ico" style={{ background:s.bg, border:"1px solid rgba(0,0,0,0.06)" }}>
                  {s.ico}
                </div>
                <div>
                  <p className="jl-settings-label">{s.label}</p>
                  <p className="jl-settings-sub">{s.sub}</p>
                </div>
                <span className="jl-settings-arr"><Icon name="chevron" size={18}/></span>
              </div>
            ))}
          </div>
        );

      /* ── HOME ── */
      default:
        return (
          <div className="jl-page">
            {/* Welcome */}
            <section className="jl-welcome">
              <div>
                <p className="jl-welcome-tag">Tableau de bord</p>
                <h1 className="jl-welcome-h1">
                  Bonjour, <span className="jl-welcome-name">{user?.prenom_user || "Jeune"}</span> 👋
                </h1>
                <p className="jl-welcome-sub">Explorez, publiez, débattez avec la communauté.</p>
              </div>
              <div className="jl-welcome-art">
                <div className="jl-ring"/><div className="jl-ring"/><div className="jl-ring"/>
                <div className="jl-ring-center">
                  <Icon name="sparkles" size={28}/>
                </div>
              </div>
            </section>

            {/* Stats */}
            <div className="jl-stats">
              {[
                { label:"Mon profil",    sub:"Compte actif",                               icon:"user",    color:"#5a3fa0", action:() => openModal("profile") },
                { label:"Publications",  sub:`${publications?.length||0} posts`,           icon:"pencil",  color:"#3b82f6", action:() => goTo(PAGES.PUBLIER) },
                { label:"Live",          sub:"Débats en direct",                           icon:"radio",   color:"#ec4899", action:() => goTo(PAGES.LIVE) },
                { label:"Messages",      sub:unreadMessages ? `${unreadMessages} non lus` : "Aucun message",
                                                                                           icon:"message", color:"#10b981", action:() => goTo(PAGES.MESSAGES) },
              ].map((c, i) => (
                <div key={i} className="jl-stat" style={{ "--ac":c.color, animationDelay:`${i*0.08}s` }} onClick={c.action}>
                  <div className="jl-stat-icon"><Icon name={c.icon} size={22}/></div>
                  <p className="jl-stat-label">{c.label}</p>
                  <p className="jl-stat-sub">{c.sub}</p>
                </div>
              ))}
            </div>

            {/* Banners */}
            <div className="jl-banners">
              <div className="jl-banner jl-ban-live">
                <div className="jl-banner-body">
                  <span className="jl-banner-tag">En Direct</span>
                  <h2>Sessions Live<br/>Interactives</h2>
                  <button className="jl-banner-btn" onClick={() => goTo(PAGES.LIVE)}>
                    <Icon name="play" size={12}/>Rejoindre
                  </button>
                </div>
                <img src="https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=300&q=80"
                  alt="live" className="jl-banner-img"
                  onError={(e) => { e.target.style.display="none"; }}/>
              </div>
              <div className="jl-banner jl-ban-enquete">
                <div className="jl-banner-body">
                  <span className="jl-banner-tag">Nouveau</span>
                  <h2>Participez aux<br/>Enquêtes</h2>
                  <button className="jl-banner-btn" onClick={() => goTo(PAGES.ENQUETE)}>
                    <Icon name="chevron" size={12}/>Participer
                  </button>
                </div>
                <img src="https://images.unsplash.com/photo-1606326608606-aa0b62935f2b?w=300&q=80"
                  alt="enquete" className="jl-banner-img"
                  onError={(e) => { e.target.style.display="none"; }}/>
              </div>
            </div>

            {/* Feed */}
            <h2 className="jl-section-title"><Icon name="dots" size={18}/> Fil d'actualité</h2>
            {loading ? (
              <div className="jl-spinner-wrap"><div className="jl-spinner"/></div>
            ) : publications.length === 0 ? (
              <div className="jl-empty">
                <span className="jl-empty-icon">✦</span>
                <p>Aucune publication pour le moment</p>
              </div>
            ) : publications.map((pub) => (
              <div key={pub.id_publication}
                id={`pub-${pub.id_publication}`}
                className={highlightedPub===pub.id_publication ? "jl-highlighted" : ""}>
                <PublicationCard publication={pub} onUpdate={()=>fetchPublications(true)}/>
              </div>
            ))}
          </div>
        );
    }
  };

  /* ═══════════════════════════════════════════════════════
     RENDER
  ═══════════════════════════════════════════════════════ */
  return (
    <div className="jl-root">
      {/* orbs */}
      <div className="jl-orb jl-orb1" aria-hidden="true"/>
      <div className="jl-orb jl-orb2" aria-hidden="true"/>
      <div className="jl-orb jl-orb3" aria-hidden="true"/>

      {/* mobile overlay */}
      {mobileOpen && <div className="jl-overlay" onClick={() => setMobileOpen(false)}/>}

      {/* ══ SIDEBAR ══ */}
      <aside className={[
        "jl-sidebar",
        sidebarOpen ? "" : "collapsed",
        mobileOpen  ? "mobile-open" : "",
      ].join(" ")}>

        {/* Logo */}
        <div className="jl-logo" onClick={() => {
          if (window.innerWidth < 860) setMobileOpen((o) => !o);
          else setSidebarOpen((o) => !o);
        }}>
          <div className="jl-logo-icon">S</div>
          <span className="jl-logo-text">Swafy</span>
        </div>

        {/* Menu btn */}
        <button className="jl-menu-btn" onClick={() => {
          if (window.innerWidth < 860) setMobileOpen((o) => !o);
          else setSidebarOpen((o) => !o);
        }}>
          <Icon name="menu" size={18}/>
          <span className="jl-menu-label">Menu</span>
        </button>

        {/* Nav */}
        <nav className="jl-nav">
          {NAV.map((item, idx) => (
            <button key={idx}
              className={`jl-nav-item${activePage===item.page ? " active" : ""}`}
              onClick={() => goTo(item.page)}>
              <span className="jl-nav-icon"><Icon name={item.icon} size={20}/></span>
              <span className="jl-nav-label">{item.label}</span>
              {item.badge && <span className="jl-badge">{item.badge}</span>}
              {item.live  && <span className="jl-badge-live">LIVE</span>}
            </button>
          ))}
        </nav>

        {/* Exit */}
        <button className="jl-exit-btn" onClick={handleLogout}>
          <span className="jl-nav-icon"><Icon name="logout" size={20}/></span>
          <span className="jl-exit-label">Déconnexion</span>
        </button>
      </aside>

      {/* ══ MAIN ══ */}
      <main className={`jl-main ${sidebarOpen ? "ml-open" : "ml-col"}`}>

        {/* Topbar */}
        <div className="jl-topbar">
          <button className="jl-burger" aria-label="Menu" onClick={() => {
            if (window.innerWidth < 860) setMobileOpen((o) => !o);
            else setSidebarOpen((o) => !o);
          }}>
            <Icon name="menu" size={20}/>
          </button>
          <span className="jl-topbar-title" style={{cursor:"pointer"}} onClick={()=>{
            goTo(PAGES.HOME);
            fetchPublications();
            fetchNotifications();
          }}>Swafy</span>
          <div style={{display:"flex",alignItems:"center",gap:8}}>
            <button
              title="Actualiser"
              onClick={()=>{ fetchPublications(); fetchNotifications(); }}
              style={{background:"none",border:"none",cursor:"pointer",color:"#9080b8",display:"flex",alignItems:"center",padding:"6px",borderRadius:"50%",transition:"background .2s"}}
              onMouseEnter={e=>e.currentTarget.style.background="rgba(90,63,160,0.1)"}
              onMouseLeave={e=>e.currentTarget.style.background="none"}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="23 4 23 10 17 10"/><polyline points="1 20 1 14 7 14"/>
                <path d="M3.51 9a9 9 0 0114.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0020.49 15"/>
              </svg>
            </button>
            <div className="jl-topbar-avatar" onClick={() => openModal("profile")}>
              <img src={getAvatar(user?.photo_user, user?.sexe)} alt="avatar"
                onError={(e) => { e.target.src="https://randomuser.me/api/portraits/men/44.jpg"; }}/>
            </div>
          </div>
        </div>

        {/* Content */}
        {activePage === PAGES.MESSAGES ? (
          <div className="jl-messages-full"><JeuneContact/></div>
        ) : (
          <div className="jl-scroll">{renderContent()}</div>
        )}
      </main>

      {/* ══ RIGHT SIDEBAR — sticky ══ */}
      {activePage !== PAGES.MESSAGES && (
        <aside className="jl-right">
          <div className="jl-right-scroll">

            {/* Profile card */}
            <div className="jl-profile-card" onClick={() => openModal("profile")}>
              <div className="jl-p-row">
                <img className="jl-p-ava"
                  src={getAvatar(user?.photo_user, user?.sexe)} alt="avatar"
                  onError={(e) => { e.target.src="https://randomuser.me/api/portraits/men/44.jpg"; }}/>
                <div style={{ flex:1, minWidth:0 }}>
                  <p className="jl-p-name">{user?.prenom_user} {user?.nom_user}</p>
                  <p className="jl-p-email">{user?.email_user}</p>
                </div>
                <span className="jl-p-arr"><Icon name="chevron" size={16}/></span>
              </div>
              <span className="jl-p-role">
                <Icon name="star" size={11}/> Jeune membre · Swafy
              </span>
            </div>

        

            {/* Live widget */}
            <LiveEvWidget goToLive={() => goTo(PAGES.LIVE)} activeLiveLink={activeLiveLink} />

            {/* Live notification toast */}
            {liveNotifToast && (
              <div style={{
                background: "linear-gradient(135deg,#7c3aed,#3b82f6)",
                borderRadius: 14, padding: "14px 16px", marginBottom: 12,
                border: "1px solid rgba(255,255,255,.15)",
                animation: "jlFadeIn .4s ease",
                cursor: "pointer",
              }} onClick={() => {
                if (liveNotifToast.viewerLink) {
                  try {
                    const url = new URL(liveNotifToast.viewerLink);
                    const parts = url.pathname.split("/").filter(Boolean);
                    const rc = parts[parts.length - 1];
                    const vt = url.searchParams.get("vt");
                    if (rc && vt) { navigate(`/meet/${rc}?vt=${vt}`); return; }
                  } catch {}
                }
              }}>
                <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:6 }}>
                  <span style={{ width:9, height:9, borderRadius:"50%", background:"#f87171", display:"inline-block", animation:"jlPulse 1s infinite" }}/>
                  <span style={{ color:"#fff", fontWeight:800, fontSize:12, letterSpacing:1, textTransform:"uppercase" }}>🔴 LIVE EN COURS</span>
                  <button onClick={(e) => { e.stopPropagation(); setLiveNotifToast(null); }}
                    style={{ marginLeft:"auto", background:"rgba(255,255,255,.2)", border:"none", color:"#fff", borderRadius:6, width:22, height:22, cursor:"pointer", fontSize:12, display:"flex", alignItems:"center", justifyContent:"center" }}>✕</button>
                </div>
                <p style={{ color:"rgba(255,255,255,.9)", fontSize:13, fontWeight:600, margin:"0 0 10px" }}>
                  {liveNotifToast.title}
                </p>
                <button style={{ width:"100%", background:"rgba(255,255,255,.2)", border:"1px solid rgba(255,255,255,.3)", borderRadius:10, padding:"8px", color:"#fff", fontWeight:700, fontSize:13, cursor:"pointer" }}>
                  ▶ Rejoindre le Live
                </button>
              </div>
            )}

            {/* Chatbot — always visible, context changes with live */}
            <div className="jl-cb">
              <div className="jl-cb-head">
                <div className="jl-cb-icon"><Icon name="robot" size={14}/></div>
                <div>
                  <p className="jl-cb-title">Assistant Swafy</p>
                  <p className="jl-cb-sub">{activeLiveLink ? "Actif pendant le live" : "Toujours disponible"}</p>
                </div>
                {activeLiveLink ? (
                  <span style={{ background:"#ef4444", color:"#fff", fontSize:9, fontWeight:800, padding:"2px 7px", borderRadius:10, animation:"jlPulse 1.2s infinite" }}>🔴 LIVE</span>
                ) : (
                  <span className="jl-cb-online">● En ligne</span>
                )}
              </div>
              <div className="jl-cb-msgs">
                {cbMsgs.map((m, i) => (
                  <div key={i} className={`jl-cb-msg ${m.from==="bot" ? "jl-cb-bot" : "jl-cb-user"}`}
                    style={{ whiteSpace:"pre-wrap" }}>
                    {m.text}
                  </div>
                ))}
                {cbLoading && (
                  <div className="jl-cb-msg jl-cb-bot jl-cb-typing">
                    <span/><span/><span/>
                  </div>
                )}
                <div ref={cbEndRef}/>
              </div>
              <div className="jl-cb-bar">
                <input className="jl-cb-input" placeholder="Écrire…"
                  value={cbInput} onChange={(e) => setCbInput(e.target.value)}
                  onKeyDown={(e) => e.key==="Enter" && sendCb()}
                  disabled={cbLoading}/>
                <button className="jl-cb-send" onClick={sendCb} aria-label="Envoyer"
                  disabled={cbLoading || !cbInput.trim()}
                  style={{ opacity: (cbLoading || !cbInput.trim()) ? 0.5 : 1 }}>
                  <Icon name="send" size={13}/>
                </button>
              </div>
            </div>

          </div>
        </aside>
      )}

      {/* ══ MODAL ══ */}
      {modalDef && (
        <div className="jl-modal-bg" onClick={(e) => e.target===e.currentTarget && closeModal()}>
          <div className="jl-modal">
            <div className="jl-modal-head">
              <span className="jl-modal-title">{modalDef.title}</span>
              <button className="jl-modal-close" onClick={closeModal} aria-label="Fermer">
                <Icon name="close" size={15}/>
              </button>
            </div>
            <div className="jl-modal-body">
              <modalDef.Body/>
            </div>
            {modalDef.hasFoot && (
              <div className="jl-modal-foot">
                <button className="jl-m-cancel" onClick={closeModal}>Annuler</button>
                <button className="jl-m-save" onClick={closeModal}>
                  <Icon name="check" size={14}/>Enregistrer
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default JeuneLayout;