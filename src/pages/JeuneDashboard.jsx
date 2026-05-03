import { useEffect } from "react";
import { useNavigate } from "react-router-dom";

export default function AdminDashboard() {
  const user = JSON.parse(localStorage.getItem("user"));
  const navigate = useNavigate();

  // Admin → redirection automatique vers LiveStream
  useEffect(() => {
    if (user?.role === "admin") {
      navigate("/admin/live");
    }
  }, [user, navigate]);

  const logout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    navigate("/");
  };

  return (
    <div className="dashboard-page">
      <div className="dashboard-card">
        <h1>Espace Admin</h1>
        <p>Bienvenue {user?.nom_user}</p>
        <p>Redirection vers le Live...</p>
        <button onClick={logout}>Déconnexion</button>
      </div>
    </div>
  );
}