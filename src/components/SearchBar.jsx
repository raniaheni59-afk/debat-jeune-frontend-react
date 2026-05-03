import { useEffect, useState } from "react";
import API from "../services/api";

export default function SearchBar({ onSelect }) {
  const [q, setQ] = useState("");
  const [data, setData] = useState({ users: [], publications: [] });
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const t = setTimeout(async () => {
      if (!q.trim()) {
        setData({ users: [], publications: [] });
        return;
      }
      const res = await API.get(`/search?q=${encodeURIComponent(q)}&limit=5`);
      setData(res.data);
      setOpen(true);
    }, 250);

    return () => clearTimeout(t);
  }, [q]);

  return (
    <div style={{ position: "relative", width: "100%" }}>
      <input
        value={q}
        onChange={(e) => setQ(e.target.value)}
        placeholder="Rechercher personnes / publications..."
        style={{ width: "100%", padding: 10, borderRadius: 10, border: "1px solid #ddd" }}
        onFocus={() => setOpen(true)}
      />

      {open && (data.users.length > 0 || data.publications.length > 0) && (
        <div style={{
          position: "absolute", top: 45, left: 0, right: 0,
          background: "#fff", border: "1px solid #eee", borderRadius: 10,
          padding: 10, zIndex: 50
        }}>
          <div style={{ fontWeight: 700, marginBottom: 6 }}>Utilisateurs</div>
          {data.users.map(u => (
            <div key={u.id_user}
              style={{ padding: 8, cursor: "pointer" }}
              onClick={() => { onSelect?.({ type: "user", item: u }); setOpen(false); }}
            >
              {u.nom_user} — {u.email_user}
            </div>
          ))}

          <div style={{ fontWeight: 700, margin: "10px 0 6px" }}>Publications</div>
          {data.publications.map(p => (
            <div key={p.id_publication}
              style={{ padding: 8, cursor: "pointer" }}
              onClick={() => { onSelect?.({ type: "publication", item: p }); setOpen(false); }}
            >
              {(p.titre_publication || p.question_debat || "Publication")} #{p.id_publication}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}