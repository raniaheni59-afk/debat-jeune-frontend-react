// داخل VerifyEmail.jsx
import { useLocation, useNavigate } from "react-router-dom";

export default function VerifyEmail() {
  const location = useLocation();
  const navigate = useNavigate();
  const email = location.state?.email || ""; // نجيبو الإيميل اللي تبعث من الـ Register
  const [code, setCode] = useState("");

  const handleVerify = async (e) => {
    e.preventDefault();
    try {
      const res = await API.post("/auth/verify-code", {
        email_user: email,
        code: code
      });

      if (res.data.success) {
        // أهم مرحلة: التخزين
        localStorage.setItem("token", res.data.token);
        localStorage.setItem("user", JSON.stringify(res.data.user));
        
        // دخول مباشر
        alert("Compte activé ! Bienvenue.");
        navigate("/jeune"); 
      }
    } catch (err) {
      alert(err.response?.data?.message || "Code incorrect");
    }
  };

  return (
    <form onSubmit={handleVerify}>
      <input 
        value={code} 
        onChange={(e) => setCode(e.target.value)} 
        placeholder="Entrez le code" 
      />
      <button type="submit">Vérifier et Entrer</button>
    </form>
  );
}