import { useEffect, useState } from "react";
import API from "../services/api";

export default function Notifications() {
  const [list, setList] = useState([]);
  const [unread, setUnread] = useState(0);

  const load = async () => {
    const res = await API.get("/notifications");
    setList(res.data.notifications);
    setUnread(res.data.unread_count);
  };

  useEffect(() => {
    load().then(() => API.put("/notifications/read-all"));
  }, []);

  return (
    <div style={{ padding: 20 }}>
      <h2>Notifications ({unread} non lues)</h2>
      {list.length === 0 ? <p>Aucune notification</p> : (
        list.map(n => (
          <div key={n.id_notification}
            style={{
              padding: 12, borderRadius: 10, marginBottom: 10,
              background: n.is_read ? "#fafafa" : "#eef2ff",
              border: "1px solid #eee"
            }}
          >
            <div style={{ fontWeight: 700 }}>{n.message}</div>
            <small>{new Date(n.created_at).toLocaleString("fr-FR")}</small>
          </div>
        ))
      )}
    </div>
  );
}