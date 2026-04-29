import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import axios from 'axios';
import "./Setting.css";

export default function ProfilePage() {
  const { id } = useParams();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    fetchUser();
  }, [id]);

  async function fetchUser() {
    try {
      const res = await axios.get(`http://localhost:5000/api/users/${id}`);
      setUser(res.data);
    } catch (e) {
      console.error(e);
      // fallback demo data si backend pas encore up
      setUser({
        id,
        name: 'Nom Prénom',
        title: 'UI/UX Designer',
        email: 'nom@example.com',
        photo: '/uploads/default-profile.png',
        bio: 'Agency profile in Tunis.',
        website: '#'
      });
    }
    setLoading(false);
  }

  async function onUpload(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    const formData = new FormData();
    formData.append('photo', file);
    setUploading(true);
    try {
      const res = await axios.post(`http://localhost:5000/api/upload/${id}`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      setUser((u) => ({ ...u, photo: res.data.photo }));
    } catch (err) {
      console.error(err);
    }
    setUploading(false);
  }

  if (loading || !user) return <div className="loading">Loading...</div>;

  return (
    <div className="page-shell">
      <aside className="sidebar">
        <div className="brand">
          <strong>Agence Swafy</strong>
          <div style={{ fontSize: 12, opacity: 0.7 }}>DÉBAT DE JEUNE - TUNIS</div>
        </div>
        <ul>
          <li className="active">Account</li>
          <li>Notifications</li>
          <li>Privacy</li>
          <li>Help</li>
        </ul>
      </aside>

      <main className="content">
        <header className="topbar" aria-label="Top Bar">
          <nav className="nav" style={{ display: 'flex', gap: 16 }}>
            <span>Home</span>
            <span>Explore</span>
            <span>Pricing</span>
            <span>About</span>
          </nav>
          <img src={user.photo} alt="avatar" className="avatar" />
        </header>

        <section className="card" aria-label="Account Settings">
          <h1>Account Settings</h1>
          <div className="grid">
            <div className="left" style={{ textAlign: 'center' }}>
              <div className="section-title" style={{ fontWeight: 600, marginBottom: 8 }}>Profile Picture</div>
              <img src={user.photo} alt="Profile" style={{ width: 140, height: 140, borderRadius: '50%', objectFit: 'cover', border: '4px solid #fff', boxShadow: '0 6px 20px rgba(0,0,0,.15)' }} />
              <div style={{ marginTop: 8 }}>
                <label htmlFor="photo-upload" className="upload-btn" role="button" style={{
                  cursor: 'pointer', display: 'inline-block', padding: '8px 12px', borderRadius: 6, border: '1px solid #6f56f5', color: '#6f56f5'
                }}>
                  Upload new picture
                </label>
                <input id="photo-upload" type="file" accept="image/*" onChange={onUpload} style={{ display: 'none' }} />
              </div>
              {uploading && <div style={{ color: '#555', fontSize: 12, marginTop: 6 }}>Uploading...</div>}
            </div>

            <div className="middle" style={{ alignSelf: 'start' }}>
              <div className="item" style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid #eee' }}>
                <span>Name</span>
                <strong>{user.name || ''}</strong>
              </div>
              <div className="item" style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid #eee' }}>
                <span>Title</span>
                <strong>{user.title}</strong>
              </div>
              <div className="item" style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid #eee' }}>
                <span>Email</span>
                <strong>{user.email}</strong>
              </div>
            </div>

            <div className="right" style={{ alignSelf: 'start' }}>
              <div className="widget" aria-label="Side Widget" style={{ minWidth: 260 }}>
                <div className="widget-title" style={{ color: '#6a4bd8' }}>Espace Débat Jeune</div>
                <ul style={{ paddingLeft: 16 }}>
                  <li>Prochains tournois</li>
                  <li>Mes équipes</li>
                  <li>Tableau de bord orateur</li>
                </ul>
              </div>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}