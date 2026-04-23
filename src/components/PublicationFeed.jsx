import React, { useEffect, useState } from "react";
import api from "../services/api";
import PublicationCard from "./PublicationCard";
import "./PublicationFeed.css";

export default function PublicationFeed() {
  const [publications, setPublications] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchPublications = async () => {
    try {
      const res = await api.get('/publications');
      setPublications(res.data);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPublications();
  }, []);

  if (loading) {
    return <div className="loading">Chargement...</div>;
  }

  return (
    <div className="publication-feed">
      {publications.length === 0 ? (
        <div className="empty-state">
          <p>Aucune publication pour le moment</p>
        </div>
      ) : (
        publications.map(pub => (
          <PublicationCard
            key={pub.id_publication}
            publication={pub}
            onUpdate={fetchPublications}
          />
        ))
      )}
    </div>
  );
}