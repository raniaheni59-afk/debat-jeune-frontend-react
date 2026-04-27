import React, { useEffect, useState } from "react";
import api from "../services/api";
import { useNavigate, useParams } from "react-router-dom";

const BACKEND = "https://debat-jeune-production.up.railway.app";

const getAvatar = (photo, sexe) => {
  if (photo) return photo.startsWith("http") ? photo : `${BACKEND}/${photo}`;
  return sexe === "femme" 
    ? "https://randomuser.me/api/portraits/women/44.jpg"
    : "https://randomuser.me/api/portraits/men/44.jpg";
};

export default function Profile() {
  const navigate = useNavigate();
  const { id } = useParams();
  const currentUser = JSON.parse(localStorage.getItem("user") || "{}");
  const isMe = !id || parseInt(id) === currentUser.id_user;

  const [profile, setProfile] = useState(null);
  const [publications, setPublications] = useState([]);
  const [activeTab, setActiveTab] = useState("publications");
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({});
  const [loading, setLoading] = useState(true);
  const [imageModal, setImageModal] = useState(null);

  useEffect(() => {
    fetchData();
  }, [id]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const userId = id || currentUser.id_user;
      const [profileRes, pubRes] = await Promise.all([
        isMe ? api.get("/profile/me") : api.get(`/profile/${userId}`),
        api.get(`/profile/${userId}/publications`)
      ]);
      setProfile(profileRes.data);
      setForm(profileRes.data);
      setPublications(pubRes.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      await api.put("/profile/update", form);
      const res = await api.get("/profile/me");
      setProfile(res.data);
      localStorage.setItem("user", JSON.stringify(res.data));
      setEditing(false);
      alert("✅ Profil mis à jour !");
    } catch (err) {
      alert("Erreur mise à jour");
    }
  };

  const handleAvatarUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const fd = new FormData();
    fd.append("avatar", file);
    await api.put("/profile/avatar", fd);
    fetchData();
  };

  if (loading) return (
    <div style={{display:'flex',alignItems:'center',justifyContent:'center',height:'100vh',background:'#f0f2f5'}}>
      <div style={{textAlign:'center'}}>
        <div style={{fontSize:40,marginBottom:10}}>⏳</div>
        <p style={{color:'#65676b'}}>Chargement du profil...</p>
      </div>
    </div>
  );

  if (!profile) return <div>Profil introuvable</div>;

  const photos = publications.flatMap(p => p.medias?.filter(m => m.type_media === 'photo') || []);
  const videos = publications.flatMap(p => p.medias?.filter(m => m.type_media === 'video') || []);
  const pdfs = publications.flatMap(p => p.medias?.filter(m => m.type_media === 'pdf') || []);

  return (
    <div style={{background:'#f0f2f5', minHeight:'100vh', fontFamily:'system-ui, sans-serif'}}>
      
      {/* Cover + Avatar */}
      <div style={{background:'white', boxShadow:'0 2px 4px rgba(0,0,0,0.1)', marginBottom:16}}>
        
        {/* Cover Photo */}
        <div style={{
          height: 300,
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          position: 'relative',
          borderRadius: '0 0 8px 8px'
        }}>
          <button 
            onClick={() => navigate(-1)}
            style={{
              position:'absolute', top:16, left:16,
              background:'rgba(255,255,255,0.9)',
              border:'none', borderRadius:20,
              padding:'8px 16px', cursor:'pointer',
              fontWeight:600, fontSize:14
            }}
          >
            ← Retour
          </button>
        </div>

        {/* Profile Info */}
        <div style={{maxWidth:1000, margin:'0 auto', padding:'0 16px'}}>
          <div style={{display:'flex', alignItems:'flex-end', gap:16, marginTop:-60, paddingBottom:16, flexWrap:'wrap'}}>
            
            {/* Avatar */}
            <div style={{position:'relative'}}>
              <img
                src={getAvatar(profile.photo_user, profile.sexe)}
                alt="avatar"
                style={{
                  width:160, height:160, borderRadius:'50%',
                  border:'4px solid white',
                  objectFit:'cover',
                  boxShadow:'0 4px 12px rgba(0,0,0,0.2)'
                }}
                onError={e => e.target.src = "https://randomuser.me/api/portraits/men/44.jpg"}
              />
              {isMe && (
                <label style={{
                  position:'absolute', bottom:8, right:8,
                  background:'#e4e6eb', borderRadius:'50%',
                  width:36, height:36, display:'flex',
                  alignItems:'center', justifyContent:'center',
                  cursor:'pointer', fontSize:16,
                  boxShadow:'0 2px 4px rgba(0,0,0,0.2)'
                }}>
                  📷
                  <input type="file" accept="image/*" onChange={handleAvatarUpload} style={{display:'none'}} />
                </label>
              )}
            </div>

            {/* Name + Info */}
            <div style={{flex:1, paddingBottom:8}}>
              <h1 style={{margin:'0 0 4px', fontSize:28, fontWeight:700, color:'#1c1e21'}}>
                {profile.nom_user} {profile.prenom_user}
              </h1>
              <p style={{margin:'0 0 4px', color:'#65676b', fontSize:15}}>
                {profile.statut} {profile.etablissement ? `• ${profile.etablissement}` : ''}
              </p>
              <p style={{margin:0, color:'#65676b', fontSize:14}}>
                📍 {[profile.ville_jeune, profile.gouvernorat_jeune].filter(Boolean).join(', ') || 'Tunisie'}
              </p>
            </div>

            {/* Buttons */}
            {isMe && (
              <div style={{display:'flex', gap:8, paddingBottom:8}}>
                <button
                  onClick={() => setEditing(!editing)}
                  style={{
                    background: editing ? '#e4e6eb' : '#1877f2',
                    color: editing ? '#1c1e21' : 'white',
                    border:'none', borderRadius:6,
                    padding:'8px 16px', cursor:'pointer',
                    fontWeight:600, fontSize:14
                  }}
                >
                  {editing ? '✕ Annuler' : '✏️ Modifier le profil'}
                </button>
              </div>
            )}
          </div>

          {/* Tabs */}
          <div style={{display:'flex', borderTop:'1px solid #e4e6eb', gap:4}}>
            {['publications', 'photos', 'videos', 'pdfs', 'infos'].map(tab => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                style={{
                  background:'none', border:'none',
                  padding:'12px 16px', cursor:'pointer',
                  fontWeight: activeTab === tab ? 700 : 500,
                  color: activeTab === tab ? '#1877f2' : '#65676b',
                  borderBottom: activeTab === tab ? '3px solid #1877f2' : '3px solid transparent',
                  fontSize:15, textTransform:'capitalize'
                }}
              >
                {tab === 'publications' ? '📝 Publications' :
                 tab === 'photos' ? `📷 Photos (${photos.length})` :
                 tab === 'videos' ? `🎥 Vidéos (${videos.length})` :
                 tab === 'pdfs' ? `📄 PDFs (${pdfs.length})` :
                 'ℹ️ Infos'}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Content */}
      <div style={{maxWidth:1000, margin:'0 auto', padding:'0 16px'}}>

        {/* Edit Form */}
        {editing && isMe && (
          <div style={{background:'white', borderRadius:8, padding:24, marginBottom:16, boxShadow:'0 2px 4px rgba(0,0,0,0.1)'}}>
            <h3 style={{marginTop:0, color:'#1c1e21'}}>Modifier le profil</h3>
            <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:16}}>
              {[
                {label:'Nom', key:'nom_user'},
                {label:'Prénom', key:'prenom_user'},
                {label:'Email', key:'email_user', type:'email'},
                {label:'Téléphone', key:'telephone_user'},
                {label:'Ville', key:'ville_jeune'},
                {label:'Établissement', key:'etablissement'},
              ].map(f => (
                <div key={f.key}>
                  <label style={{display:'block', fontWeight:600, marginBottom:6, color:'#1c1e21', fontSize:14}}>{f.label}</label>
                  <input
                    type={f.type || 'text'}
                    value={form[f.key] || ''}
                    onChange={e => setForm(prev => ({...prev, [f.key]: e.target.value}))}
                    style={{width:'100%', padding:'10px 12px', border:'1px solid #ccd0d5', borderRadius:6, fontSize:15, boxSizing:'border-box'}}
                  />
                </div>
              ))}
            </div>
            <button
              onClick={handleSave}
              style={{
                marginTop:16, background:'#1877f2', color:'white',
                border:'none', borderRadius:6, padding:'10px 24px',
                cursor:'pointer', fontWeight:600, fontSize:15
              }}
            >
              💾 Enregistrer
            </button>
          </div>
        )}

        {/* Publications Tab */}
        {activeTab === 'publications' && (
          <div style={{display:'flex', flexDirection:'column', gap:16}}>
            {publications.length === 0 ? (
              <div style={{background:'white', borderRadius:8, padding:40, textAlign:'center', color:'#65676b'}}>
                <div style={{fontSize:40, marginBottom:10}}>📝</div>
                <p>Aucune publication</p>
              </div>
            ) : publications.map(pub => (
              <div key={pub.id_publication} style={{background:'white', borderRadius:8, padding:20, boxShadow:'0 2px 4px rgba(0,0,0,0.05)'}}>
                <div style={{display:'flex', alignItems:'center', gap:12, marginBottom:12}}>
                  <img src={getAvatar(profile.photo_user, profile.sexe)} alt="" style={{width:40,height:40,borderRadius:'50%',objectFit:'cover'}} />
                  <div>
                    <p style={{margin:0, fontWeight:600, color:'#1c1e21'}}>{profile.nom_user} {profile.prenom_user}</p>
                    <p style={{margin:0, fontSize:12, color:'#65676b'}}>
                      {new Date(pub.date_publication).toLocaleDateString('fr-FR', {day:'2-digit',month:'long',year:'numeric', hour:'2-digit', minute:'2-digit'})}
                    </p>
                  </div>
                </div>
                {pub.titre_publication && <h4 style={{margin:'0 0 8px', color:'#1c1e21'}}>{pub.titre_publication}</h4>}
                {pub.contenu && <p style={{margin:'0 0 12px', color:'#1c1e21', lineHeight:1.5}}>{pub.contenu}</p>}
                {pub.medias?.map(media => (
                  <div key={media.id_media} style={{marginTop:8}}>
                    {media.type_media === 'photo' && (
                      <img 
                        src={media.url_media} alt="" 
                        style={{width:'100%', maxHeight:400, objectFit:'cover', borderRadius:8, cursor:'pointer'}}
                        onClick={() => setImageModal(media.url_media)}
                      />
                    )}
                    {media.type_media === 'video' && (
                      <video controls style={{width:'100%', maxHeight:400, borderRadius:8}}>
                        <source src={media.url_media} />
                      </video>
                    )}
                    {media.type_media === 'pdf' && (
                      <a href={`https://docs.google.com/viewer?url=${encodeURIComponent(media.url_media)}&embedded=true`} target="_blank" rel="noopener noreferrer"
                        style={{display:'flex', alignItems:'center', gap:8, background:'#f0f2f5', padding:'12px 16px', borderRadius:8, textDecoration:'none', color:'#1c1e21'}}>
                        <span style={{fontSize:24}}>📄</span>
                        <span>{media.nom_original || 'Document PDF'}</span>
                      </a>
                    )}
                  </div>
                ))}
              </div>
            ))}
          </div>
        )}

        {/* Photos Tab */}
        {activeTab === 'photos' && (
          <div style={{background:'white', borderRadius:8, padding:20, boxShadow:'0 2px 4px rgba(0,0,0,0.05)'}}>
            {photos.length === 0 ? (
              <div style={{textAlign:'center', padding:40, color:'#65676b'}}>
                <div style={{fontSize:40}}>📷</div>
                <p>Aucune photo</p>
              </div>
            ) : (
              <div style={{display:'grid', gridTemplateColumns:'repeat(3, 1fr)', gap:4}}>
                {photos.map(photo => (
                  <img
                    key={photo.id_media}
                    src={photo.url_media}
                    alt=""
                    style={{width:'100%', aspectRatio:'1', objectFit:'cover', borderRadius:4, cursor:'pointer'}}
                    onClick={() => setImageModal(photo.url_media)}
                  />
                ))}
              </div>
            )}
          </div>
        )}

        {/* Videos Tab */}
        {activeTab === 'videos' && (
          <div style={{background:'white', borderRadius:8, padding:20, boxShadow:'0 2px 4px rgba(0,0,0,0.05)'}}>
            {videos.length === 0 ? (
              <div style={{textAlign:'center', padding:40, color:'#65676b'}}>
                <div style={{fontSize:40}}>🎥</div>
                <p>Aucune vidéo</p>
              </div>
            ) : (
              <div style={{display:'grid', gridTemplateColumns:'repeat(2, 1fr)', gap:12}}>
                {videos.map(video => (
                  <video key={video.id_media} controls style={{width:'100%', borderRadius:8}}>
                    <source src={video.url_media} />
                  </video>
                ))}
              </div>
            )}
          </div>
        )}

        {/* PDFs Tab */}
        {activeTab === 'pdfs' && (
          <div style={{background:'white', borderRadius:8, padding:20, boxShadow:'0 2px 4px rgba(0,0,0,0.05)'}}>
            {pdfs.length === 0 ? (
              <div style={{textAlign:'center', padding:40, color:'#65676b'}}>
                <div style={{fontSize:40}}>📄</div>
                <p>Aucun PDF</p>
              </div>
            ) : (
              <div style={{display:'flex', flexDirection:'column', gap:12}}>
                {pdfs.map(pdf => (
                  <a
                    key={pdf.id_media}
                    href={`https://docs.google.com/viewer?url=${encodeURIComponent(pdf.url_media)}&embedded=true`}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{
                      display:'flex', alignItems:'center', gap:12,
                      background:'#f0f2f5', padding:'16px', borderRadius:8,
                      textDecoration:'none', color:'#1c1e21',
                      boxShadow:'0 1px 2px rgba(0,0,0,0.1)'
                    }}
                  >
                    <span style={{fontSize:32}}>📄</span>
                    <span style={{fontWeight:500}}>{pdf.nom_original || 'Document PDF'}</span>
                  </a>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Infos Tab */}
        {activeTab === 'infos' && (
          <div style={{background:'white', borderRadius:8, padding:24, boxShadow:'0 2px 4px rgba(0,0,0,0.05)'}}>
            <h3 style={{marginTop:0, color:'#1c1e21'}}>Informations</h3>
            {[
              {icon:'👤', label:'Nom complet', value:`${profile.nom_user} ${profile.prenom_user || ''}`},
              {icon:'📧', label:'Email', value:profile.email_user},
              {icon:'📱', label:'Téléphone', value:profile.telephone_user},
              {icon:'🎂', label:'Âge', value:profile.age},
              {icon:'⚧', label:'Sexe', value:profile.sexe},
              {icon:'🎓', label:'Statut', value:profile.statut},
              {icon:'🏫', label:'Établissement', value:profile.etablissement},
              {icon:'🗺️', label:'Gouvernorat', value:profile.gouvernorat_jeune},
              {icon:'📍', label:'Délégation', value:profile.delegation_jeune},
              {icon:'🏙️', label:'Ville', value:profile.ville_jeune},
            ].filter(i => i.value).map(info => (
              <div key={info.label} style={{display:'flex', alignItems:'center', gap:12, padding:'12px 0', borderBottom:'1px solid #f0f2f5'}}>
                <span style={{fontSize:20}}>{info.icon}</span>
                <div>
                  <p style={{margin:0, fontSize:12, color:'#65676b'}}>{info.label}</p>
                  <p style={{margin:0, fontWeight:500, color:'#1c1e21'}}>{info.value}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Image Modal */}
      {imageModal && (
        <div 
          onClick={() => setImageModal(null)}
          style={{position:'fixed', inset:0, background:'rgba(0,0,0,0.9)', zIndex:1000, display:'flex', alignItems:'center', justifyContent:'center'}}
        >
          <button onClick={() => setImageModal(null)} style={{position:'absolute', top:16, right:16, background:'none', border:'none', color:'white', fontSize:30, cursor:'pointer'}}>✕</button>
          <img src={imageModal} alt="" style={{maxWidth:'90vw', maxHeight:'90vh', objectFit:'contain'}} />
        </div>
      )}
    </div>
  );
}