import React, { useEffect, useState, useCallback } from "react";
import api from "../services/api";
import PublicationCard, { PublicationSearchBar } from "./PublicationCard";
import "./PublicationFeed.css";

export default function PublicationFeed() {
  const [publications, setPublications] = useState([]);
  const [filtered,     setFiltered]     = useState(null); // null = no filter active
  const [loading,      setLoading]      = useState(true);

  const fetchPublications = useCallback(async () => {
    try {
      const res = await api.get('/publications');
      setPublications(res.data);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPublications();
  }, [fetchPublications]);

  // called when a card is updated/deleted — re-fetch silently
  const handleUpdate = useCallback(() => {
    fetchPublications();
  }, [fetchPublications]);

  // called when search result is clicked
  const handleSearchResult = (pub) => {
    setFiltered([pub]);
  };

  const displayed = filtered !== null ? filtered : publications;

  if (loading) {
    return <div className="loading">Chargement...</div>;
  }

  return (
    <div className="publication-feed">
      {/* Search bar passes all pubs for local filtering */}
      <PublicationSearchBar
        publications={publications}
        onResult={(pub) => handleSearchResult(pub)}
      />
      {filtered !== null && (
        <div style={{ textAlign: "center", marginBottom: 12 }}>
          <button
            onClick={() => setFiltered(null)}
            style={{
              background: "rgba(90,63,160,0.1)",
              border: "none",
              cursor: "pointer",
              padding: "6px 16px",
              borderRadius: 20,
              fontSize: 13,
              color: "#5a3fa0",
              fontWeight: 600,
            }}
          >
            ✕ Effacer la recherche
          </button>
        </div>
      )}
      {displayed.length === 0 ? (
        <div className="empty-state">
          <p>Aucune publication pour le moment</p>
        </div>
      ) : (
        displayed.map(pub => (
          <PublicationCard
            key={pub.id_publication}
            publication={pub}
            onUpdate={handleUpdate}
          />
        ))
      )}
    </div>
  );
}