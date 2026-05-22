import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import API from "../services/api";
import PublicationCard from "../components/PublicationCard";

export default function PublicationDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [publication, setPublication] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetch = async () => {
      try {
        const res = await API.get(`/publications/${id}`);
        setPublication(res.data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetch();
  }, [id]);

  if (loading) return (
    <div style={{textAlign:'center', padding:'60px', color:'#9080b8'}}>
      Chargement...
    </div>
  );
  if (!publication) return (
    <div style={{textAlign:'center', padding:'60px', color:'#9080b8'}}>
      Publication introuvable
    </div>
  );

  return (
    <div style={{
      maxWidth: 680,
      margin: "0 auto",
      padding: "24px 16px 80px",
      boxSizing: "border-box",
    }}>
      <button
        onClick={() => navigate(-1)}
        style={{
          marginBottom: 20,
          background: 'rgba(90,63,160,0.08)',
          border: 'none',
          cursor: 'pointer',
          fontSize: 14,
          fontWeight: 600,
          color: '#5a3fa0',
          padding: '8px 16px',
          borderRadius: 10,
          display: 'flex',
          alignItems: 'center',
          gap: 6,
        }}
      >
        ← Retour
      </button>
      <PublicationCard
        publication={publication}
        onUpdate={() => {}}
        defaultShowComments={true}
      />
    </div>
  );
}