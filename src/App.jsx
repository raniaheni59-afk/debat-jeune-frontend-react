import React, { useEffect } from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import { io } from "socket.io-client";
import Login from "./pages/login";
import Register from "./pages/Register";
import VerifyCode from "./pages/VerifyCode";
import JeuneLayout from "./pages/JeuneLayout";
import Profile from "./pages/Profile";
import AdminLogin from "./pages/AdminLogin";
import AdminDashboard from "./pages/AdminDashboard";
import PublierPage from "./pages/PublierPage";
import Notifications from "./pages/Notifications";
import Navbar from "./components/Navbar";
import ProtectedRoute from "./components/ProtectedRoute";
import PublicationDetail from "./pages/PublicationDetail";
import Accueil from "./pages/Accueil";
import Swafy from "./pages/Swafy";
import "./index.css";
import Settings from "./pages/Settings";
import JeuneContact from "./pages/JeuneContact"; 

const BACKEND = "https://debat-jeune-production.up.railway.app";

const ProtectedAdminRoute = ({ children }) => {
  const token = localStorage.getItem("token");
  const userStr = localStorage.getItem("user");
  if (!token || !userStr) return <Navigate to="/admin/login" replace />;
  try {
    const user = JSON.parse(userStr);
    if (user.role !== "admin") return <Navigate to="/login" replace />;
  } catch {
    return <Navigate to="/admin/login" replace />;
  }
  return children;
};

function App() {
  
  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) return;

    const socket = io(BACKEND, {
      auth: { token },
      transports: ["websocket"],
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 3000,
    });

    socket.on("new_notification", (notif) => {
      window.dispatchEvent(new CustomEvent("new_notification", { detail: notif }));
    });

    socket.on("connect_error", (err) =>
      console.error("Socket error:", err.message)
    );

    return () => socket.disconnect();
  }, []); 

  return (
    <Routes>
      {/* Routes Publiques */}
      <Route path="/" element={<Accueil />} />
      <Route path="/swafy" element={<Swafy />} />
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/verify-code" element={<VerifyCode />} />

      {/* Espace Jeune */}
      <Route path="/jeune" element={
        <ProtectedRoute><JeuneLayout /></ProtectedRoute>
      } />
      <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
      <Route path="/profile/:id" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
      <Route path="/publier" element={
        <ProtectedRoute><PublierPage /></ProtectedRoute>
      } />
      <Route path="/notifications" element={
        <ProtectedRoute><Notifications /></ProtectedRoute>
      } />
      <Route path="/publication/:id" element={<ProtectedRoute><PublicationDetail /></ProtectedRoute>} />

     
      <Route path="/contact" element={
        <ProtectedRoute><JeuneContact /></ProtectedRoute>
      } />

      {/* Espace Admin */}
      <Route path="/admin/login" element={<AdminLogin />} />
      <Route path="/admin/dashboard" element={<AdminDashboard />} />
      <Route path="/settings" element={
        <ProtectedRoute><Settings /></ProtectedRoute>
      } />
      <Route path="/admin" element={<Navigate to="/admin/dashboard" replace />} />

      {/* 404 */}
      <Route path="*" element={<h2>404 - Page non trouvée</h2>} />
    </Routes>
  );
}

export default App;
