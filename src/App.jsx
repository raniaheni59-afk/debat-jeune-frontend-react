import React, { useEffect } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { io } from "socket.io-client";

// ── Pages debat-jeune (existantes) ──────────────────
import Login          from "./pages/login";
import Register       from "./pages/Register";
import VerifyCode     from "./pages/VerifyCode";
import JeuneLayout    from "./pages/JeuneLayout";
import Profile        from "./pages/Profile";
import AdminLogin     from "./pages/AdminLogin";
import AdminDashboard from "./pages/AdminDashboard";
import PublierPage    from "./pages/PublierPage";
import Notifications  from "./pages/Notifications";
import PublicationDetail from "./pages/PublicationDetail";
import Accueil        from "./pages/Accueil";
import Swafy          from "./pages/Swafy";
import JeuneContact   from "./pages/JeuneContact";
import Settings       from "./pages/Settings";

// ── Pages swafy (nouvelles) ─────────────────────────
import Swafy_Meet     from "./pages/Swafy_Meet";
import MeetRoom       from "./pages/MeetRoom";
import LiveViewer     from "./pages/LiveViewer";
import NewLive        from "./pages/NewLive";
import CalendarPage   from "./pages/CalendarPage";
import ArchivePage    from "./pages/ArchivePage";
import AdminLiveStream from "./pages/AdminLiveStream";

// ── Guards ──────────────────────────────────────────
import ProtectedRoute from "./components/ProtectedRoute";
import "./index.css";

const BACKEND =
  import.meta.env.VITE_BACKEND_URL ||
  "https://debat-jeune-production.up.railway.app";

const ProtectedAdminRoute = ({ children }) => {
  const token   = localStorage.getItem("token");
  const userStr = localStorage.getItem("user");
  if (!token || !userStr) return <Navigate to="/admin/login" replace />;
  try {
    const user = JSON.parse(userStr);
    if (user.role !== "admin" && user.role !== "superadmin")
      return <Navigate to="/login" replace />;
  } catch {
    return <Navigate to="/admin/login" replace />;
  }
  return children;
};

// ── App ──────────────────────────────────────────────
export default function App() {
  // Theme
  useEffect(() => {
    const user = JSON.parse(localStorage.getItem("user") || "{}");
    document.documentElement.setAttribute(
      "data-theme",
      user.role === "admin" || user.role === "superadmin" ? "admin" : "jeune"
    );
  }, []);

  // Socket global — notifications + live-started
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

    // Notifications existantes
    socket.on("new_notification", (notif) => {
      window.dispatchEvent(new CustomEvent("new_notification", { detail: notif }));
    });

    // ✅ NOUVEAU — live démarré par admin → notifier toute l'app
    socket.on("live-started", (data) => {
      window.dispatchEvent(new CustomEvent("live-started", { detail: data }));
    });

    socket.on("live-ended", (data) => {
      window.dispatchEvent(new CustomEvent("live-ended", { detail: data }));
    });

    socket.on("connect_error", (err) => console.error("Socket error:", err.message));

    return () => socket.disconnect();
  }, []);

  return (
    <BrowserRouter>
      <Routes>

        {/* ══ PUBLIQUES ══════════════════════════════ */}
        <Route path="/"              element={<Accueil />} />
        <Route path="/swafy"         element={<Swafy />} />
        <Route path="/login"         element={<Login />} />
        <Route path="/register"      element={<Register />} />
        <Route path="/verify-code"   element={<VerifyCode />} />
        <Route path="/admin/login"   element={<AdminLogin />} />

        {/* Live viewer — public (token dans URL) */}
        <Route path="/live/:roomCode" element={<LiveViewer />} />

        {/* ══ ESPACE JEUNE ═══════════════════════════ */}
        <Route path="/jeune" element={<ProtectedRoute><JeuneLayout /></ProtectedRoute>} />

        <Route path="/profile"    element={<ProtectedRoute><Profile /></ProtectedRoute>} />
        <Route path="/profile/:id" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
        <Route path="/publier"    element={<ProtectedRoute><PublierPage /></ProtectedRoute>} />
        <Route path="/notifications" element={<ProtectedRoute><Notifications /></ProtectedRoute>} />
        <Route path="/publication/:id" element={<ProtectedRoute><PublicationDetail /></ProtectedRoute>} />
        <Route path="/settings"   element={<ProtectedRoute><Settings /></ProtectedRoute>} />
        <Route path="/contact"    element={<ProtectedRoute><JeuneContact /></ProtectedRoute>} />

        {/* ══ MEET / LIVE (jeune + admin) ════════════ */}
        <Route path="/meet"           element={<ProtectedRoute><Swafy_Meet /></ProtectedRoute>} />
        <Route path="/meet/:roomCode" element={<ProtectedRoute><MeetRoom /></ProtectedRoute>} />
        <Route path="/calendar"       element={<ProtectedRoute><CalendarPage /></ProtectedRoute>} />

        {/* ══ ESPACE ADMIN ═══════════════════════════ */}
        <Route path="/admin" element={<Navigate to="/admin/dashboard" replace />} />

        <Route path="/admin/dashboard"
          element={<ProtectedAdminRoute><AdminDashboard /></ProtectedAdminRoute>} />

        <Route path="/admin/live"
          element={<ProtectedAdminRoute><AdminLiveStream /></ProtectedAdminRoute>} />

        <Route path="/new-live"
          element={<ProtectedAdminRoute><NewLive /></ProtectedAdminRoute>} />

        <Route path="/archive"
          element={<ProtectedAdminRoute><ArchivePage /></ProtectedAdminRoute>} />

        {/* ══ 404 ════════════════════════════════════ */}
        <Route path="*" element={<h2 style={{ textAlign: "center", marginTop: 80 }}>404 — Page non trouvée</h2>} />

      </Routes>
    </BrowserRouter>
  );
}