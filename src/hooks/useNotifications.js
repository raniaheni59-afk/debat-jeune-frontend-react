import { useState, useEffect, useCallback } from "react";
import API from "../services/api";

export function useNotifications() {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount]     = useState(0);

  // ── Fetch depuis le backend ──
  const fetchNotifications = useCallback(async () => {
    try {
      const res  = await API.get("/notifications");
      const list = Array.isArray(res.data) ? res.data : [];
      setNotifications(list);
      setUnreadCount(list.filter(n => n.is_read == 0).length);
    } catch {}
  }, []);

  // ── Fetch au montage ──
  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  // ── Ecouter les nouvelles notifications (événement global) ──
  useEffect(() => {
    const handler = (e) => {
      const notif = e.detail;
      setNotifications(prev => [notif, ...prev]);
      setUnreadCount(c => c + 1);
    };
    window.addEventListener("new_notification", handler);
    return () => window.removeEventListener("new_notification", handler);
  }, []);

  // ── Marquer une notification comme lue ──
  const markRead = useCallback(async (id) => {
    setNotifications(prev => {
      const notif = prev.find(n => n.id_notification === id);
      if (notif && notif.is_read == 0) {
        setUnreadCount(c => Math.max(0, c - 1));
      }
      return prev.map(n =>
        n.id_notification === id ? { ...n, is_read: 1 } : n
      );
    });
    try { await API.put(`/notifications/${id}/read`); } catch {}
  }, []);

  // ── Marquer tout comme lu ──
  const markAllRead = useCallback(async () => {
    setNotifications(prev => prev.map(n => ({ ...n, is_read: 1 })));
    setUnreadCount(0);
    try { await API.put("/notifications/read-all"); } catch {}
  }, []);

  return { notifications, unreadCount, markRead, markAllRead, refresh: fetchNotifications };
}