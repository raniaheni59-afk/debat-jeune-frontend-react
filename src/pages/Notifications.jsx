import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import "./Notifications.css";
import API from "../services/api";  // ← استعمل API بدل axios مباشرة

const Notifications = () => {
  const [notifications, setNotifications] = useState([]);
  const token = localStorage.getItem("token");
  const backendUrl = import.meta.env.VITE_API_URL || "https://debat-jeune-production.up.railway.app";

  useEffect(() => {
    const fetchNotifs = async () => {
      try {
        const res = await API.get("/notifications");
        setNotifications(res.data.notifications || []);
      } catch (err) {
        console.error("Erreur", err);
      }
    };
    fetchNotifs();
  }, []);
  const navigate = useNavigate();
  const handleClick = async (n) => {
  if (!n.is_read) {
    await API.put(`/notifications/${n.id_notification}/read`);
  }
  if (n.entity_id && n.entity_type === 'publication') {
    navigate(`/publication/${n.entity_id}`);
  }
};

  return (
    <div className="notif-page-container">
      <div className="notif-card">
        <div className="notif-header">
          <h2>Notifications</h2>
        </div>
        <div className="notif-list">
          {notifications.length === 0 && <p style={{textAlign:'center', color:'#999'}}>Aucune notification</p>}
          {notifications.map((n) => (
            <div 
              key={n.id_notification} 
              className={`notif-item ${n.is_read ? "read" : "unread"}`}
              onClick={() => handleClick(n)}
              style={{cursor: 'pointer'}}
            >
              <img 
                src={n.photo_user ? `${backendUrl}/${n.photo_user}` : "/default-avatar.png"} 
                alt="user" 
                className="notif-img"
              />
              <div className="notif-text">
                <p><strong>{n.nom_user}</strong> {n.message}</p>
                <span className="notif-date">{new Date(n.created_at).toLocaleString()}</span>
              </div>
              {!n.is_read && <div className="blue-dot"></div>}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Notifications;