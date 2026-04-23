import { useNavigate } from "react-router-dom";

export default function JeuneDashboard() {
  const user = JSON.parse(localStorage.getItem("user"));
  const navigate = useNavigate();

  const logout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    navigate("/");
  };

  return (
    <div className="dashboard-page">
      <div className="dashboard-card">
        <h1>Espace Jeune</h1>
        <p>Bienvenue {user?.nom_user}</p>
        <button onClick={logout}>Déconnexion</button>
      </div>
    </div>
  );
}