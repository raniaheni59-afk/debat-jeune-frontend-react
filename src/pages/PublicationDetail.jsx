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

  if (loading) return <div style={{textAlign:'center', padding:'60px'}}>Chargement...</div>;
  if (!publication) return <div style={{textAlign:'center', padding:'60px'}}>Publication introuvable</div>;

  return (
    <div style={{ maxWidth: 700, margin: "40px auto", padding: "0 16px" }}>
      <button 
  onClick={() => navigate(-1)}
  style={{ 
    marginBottom: 20, 
    background: 'none', 
    border: 'none', 
    cursor: 'pointer', 
    fontSize: 16, 
    color: '#6f5ccf' 
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