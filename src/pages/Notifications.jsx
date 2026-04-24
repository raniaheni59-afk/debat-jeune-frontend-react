import React, { useEffect, useState } from "react";
import axios from "axios";
import "./Notifications.css";

const Notifications = () => {
  const [notifications, setNotifications] = useState([]);
  const token = localStorage.getItem("token");

  useEffect(() => {
    const fetchNotifs = async () => {
      try {
        const res = await axios.get("http://localhost:5000/api/notifications", {
          headers: { Authorization: `Bearer ${token}` }
        });
        setNotifications(res.data.notifications);
      } catch (err) {
        console.error("Erreur", err);
      }
    };
    fetchNotifs();
  }, []);

  return (
    <div className="notif-page-container">
      <div className="notif-card">
        <div className="notif-header">
          <h2>Notifications</h2>
        </div>
        <div className="notif-list">
          {notifications.map((n) => (
            <div key={n.id_notification} className={`notif-item ${n.is_read ? "read" : "unread"}`}>
              <img 
                src={n.photo_user ? `http://localhost:5000/${n.photo_user}` : "/default-avatar.png"} 
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