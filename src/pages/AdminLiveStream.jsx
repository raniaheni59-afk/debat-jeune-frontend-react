import { useState, useEffect, useRef } from "react";
import { io } from "socket.io-client";
import API from "../services/api";
import { useNavigate, useLocation } from "react-router-dom";
export default function AdminLiveStream() {

  const user = JSON.parse(localStorage.getItem("user"));
  const navigate = useNavigate();
  const location = useLocation();
  const recentLive = location.state?.recentLive;

 const SOCKET_URL = "https://swafy-backend.onrender.com";
  const socket = useRef(null);
  const [messages, setMessages] = useState([]);
  const [chatInput, setChatInput] = useState("");
  // ✅ States Live sécurisés
  const [liveCode, setLiveCode] = useState("");
  const [liveLink, setLiveLink] = useState("");
  const [hostAccessToken, setHostAccessToken] = useState("");
  const [copied, setCopied] = useState(false);
  const [sessionLoading, setSessionLoading] = useState(false);

  // ✅ States Media
  const [isCamOn, setIsCamOn] = useState(false);
  const [camError, setCamError] = useState("");
  const [isMicOn, setIsMicOn] = useState(true);
  const [isRecording, setIsRecording] = useState(false);
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [recordTime, setRecordTime] = useState(0);
  const [showChat, setShowChat] = useState(true);
 
 useEffect(() => {
  if (!liveCode || !hostAccessToken) return;

  if (!socket.current) {
    socket.current = io(SOCKET_URL, {
      transports: ["websocket"],
    });

    socket.current.on("receive-message", (msg) => {
      setMessages((prev) => [...prev, msg]);
    });
  }

  socket.current.emit("join-room", {
    roomCode: liveCode,
    userName: user?.nom_user || "Admin",
    role: "host",
    accessToken: hostAccessToken,
  });

  return () => {
    socket.current?.off("receive-message");
  };
}, [liveCode, hostAccessToken]);



  // ✅ Refs
  const videoRef = useRef(null);
  const screenRef = useRef(null);
  const streamRef = useRef(null);
  const screenStreamRef = useRef(null);
  const recIntervalRef = useRef(null);
  const chatEndRef = useRef(null);


  // ════════════════════════════════════════
  // ✅ Création / rotation session sécurisée
  // ════════════════════════════════════════
 const createSecureSession = async () => {
  try {
    const res = await API.post(
      "/lives/session/create",
      { liveId: recentLive.id }
    );

    console.log("✅ SESSION CREATED:", res.data);

    setLiveCode(res.data.roomCode);
    setLiveLink(res.data.viewerLink);
    setHostAccessToken(res.data.hostAccessToken);
  } catch (err) {
    console.error("❌ CREATE SESSION ERROR:", err);
  }
};

useEffect(() => {
  if (!recentLive || !recentLive.id) {
    alert("❌ لازم تختار Live من Calendar قبل ما تبدأ Session");
    navigate("/calendar");
    return;
  }
  createSecureSession(false);
  // eslint-disable-next-line react-hooks/exhaustive-deps
}, []);


  // ════════════════════════════════════════
  // ✅ Copier le lien
  // ════════════════════════════════════════
  const copyLink = async () => {
    if (!liveLink) return;
    try {
      await navigator.clipboard.writeText(liveLink);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      alert("Impossible de copier le lien");
    }
  };

  // ✅ Nouveau lien
  const newLiveLink = async () => {
    if (!window.confirm("تأكد؟ باش اللينك القديم يبطل والجديد يخدم.")) return;
    await createSecureSession(true);
  };

  // ✅ Entrer en tant que host
  const openHostRoom = () => {
    if (!liveCode || !hostAccessToken) return;
    navigate(`/live/${liveCode}?at=${encodeURIComponent(hostAccessToken)}`);
  };

  // ════════════════════════════════════════
  // ✅ Camera / Micro
  // ════════════════════════════════════════
  const startCamera = async () => {
    setCamError("");
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "user" },
        audio: true,
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }
      setIsCamOn(true);
    } catch (err) {
      console.error("Camera Error:", err.name, err.message);
      setCamError(err.name + ": " + err.message);
      setIsCamOn(false);
    }
  };

  useEffect(() => {
    startCamera();
    return () => {
      streamRef.current?.getTracks().forEach((t) => t.stop());
      screenStreamRef.current?.getTracks().forEach((t) => t.stop());
      if (recIntervalRef.current) clearInterval(recIntervalRef.current);
    };
  }, []);

  const toggleMic = () => {
    const t = streamRef.current?.getAudioTracks()[0];
    if (t) {
      t.enabled = !t.enabled;
      setIsMicOn(t.enabled);
    }
  };

  const toggleCam = async () => {
    if (!streamRef.current || streamRef.current.getVideoTracks().length === 0) {
      await startCamera();
      return;
    }
    const track = streamRef.current.getVideoTracks()[0];
    track.enabled = !track.enabled;
    setIsCamOn(track.enabled);
  };

  const toggleScreen = async () => {
    if (isScreenSharing) {
      screenStreamRef.current?.getTracks().forEach((t) => t.stop());
      screenStreamRef.current = null;
      setIsScreenSharing(false);

      if (streamRef.current && videoRef.current) {
        videoRef.current.srcObject = streamRef.current;
        await videoRef.current.play();
      }
      return;
    }

    try {
      const screenStream = await navigator.mediaDevices.getDisplayMedia({ video: true });
      screenStreamRef.current = screenStream;
      if (screenRef.current) screenRef.current.srcObject = screenStream;
      setIsScreenSharing(true);

      screenStream.getVideoTracks()[0].onended = () => setIsScreenSharing(false);
    } catch (err) {
      console.error("Screen share error:", err);
    }
  };

  const toggleRec = () => {
    if (isRecording) {
      clearInterval(recIntervalRef.current);
      setIsRecording(false);
      setRecordTime(0);
    } else {
      setRecordTime(0);
      recIntervalRef.current = setInterval(() => setRecordTime((t) => t + 1), 1000);
      setIsRecording(true);
    }
  };

  const endCall = async () => {
  try {
    if (liveCode) {
      await API.post(`/lives/session/end/${liveCode}`);
    }
  } catch (err) {
    console.error(err);
  }

  socket.current?.emit("leave-room");
  socket.current?.disconnect();
  socket.current = null;

  streamRef.current?.getTracks().forEach((t) => t.stop());
  screenStreamRef.current?.getTracks().forEach((t) => t.stop());
  if (recIntervalRef.current) clearInterval(recIntervalRef.current);

  navigate("/");
};

const sendMessage = () => {
  if (!chatInput.trim() || !socket.current || !liveCode) return;

  socket.current.emit("send-message", {
    roomCode: liveCode,
    message: chatInput,
  });

  setChatInput("");
};

  

  const fmt = (s) => {
    const h = String(Math.floor(s / 3600)).padStart(2, "0");
    const m = String(Math.floor((s % 3600) / 60)).padStart(2, "0");
    const sec = String(s % 60).padStart(2, "0");
    return `${h}:${m}:${sec}`;
  };

  const now = new Date();
  const dateStr = now.toLocaleDateString("fr-FR", { year: "numeric", month: "long", day: "numeric" });
  const timeStr = now.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" });

  // ✅ Bouton Control
  const CB = ({ icon, active, danger, onClick, title }) => (
    <button
      onClick={onClick}
      title={title}
      style={{
        width: 48, height: 48, borderRadius: "50%", border: "none", fontSize: 20,
        cursor: "pointer", background: danger ? "#ea4335" : active ? "#4285f4" : "#e8f0fe",
        color: danger ? "white" : active ? "white" : "#4285f4",
      }}
    >
      {icon}
    </button>
  );
 

  // ════════════════════════════════════════
  // ✅ RENDER
  // ════════════════════════════════════════
  return (
    <div style={st.page}>
      {isRecording && (
        <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 3, background: "#ea4335", zIndex: 100 }} />
      )}

      <div style={st.topBar}>
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <div style={st.logo}>📹</div>
          <div>
            <h2 style={{ fontSize: 15, fontWeight: 600, margin: 0 }}>
              [Admin] Live - {user?.nom_user}
            </h2>
            <p style={{ fontSize: 12, color: "#9e9e9e", margin: 0 }}>
              {dateStr} | {timeStr}
            </p>
          </div>
        </div>

        {/* ✅ Boutons Live sécurisé */}
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <span style={st.badge}>ADMIN</span>

          <div style={st.linkBadge} onClick={copyLink}>
            🔗 {liveCode || "..."}{" "}
            {copied && <span style={{ color: "#16a34a", fontWeight: 800 }}>COPIED</span>}
          </div>

          <button style={st.newLinkBtn} onClick={newLiveLink} disabled={sessionLoading}>
            {sessionLoading ? "..." : "Nouveau lien"}
          </button>

          <button
            style={st.startBtn}
            onClick={openHostRoom}
            disabled={!liveCode || !hostAccessToken}
          >
            Entrer comme host
          </button>
        </div>
      </div>

      <div style={{ display: "flex", flex: 1, overflow: "hidden" }}>
        <div style={st.videoSection}>
          <div style={st.videoBox} data-video-container>
            <video
              ref={videoRef}
              autoPlay
              muted
              playsInline
              style={{
                width: "100%",
                height: "100%",
                objectFit: "cover",
                borderRadius: 18,
                transform: isCamOn && !isScreenSharing ? "scaleX(-1)" : "none",
                display: isCamOn && !isScreenSharing ? "block" : "none",
              }}
            />

            {isScreenSharing && (
              <video
                ref={screenRef}
                autoPlay
                playsInline
                style={{ width: "100%", height: "100%", objectFit: "contain", borderRadius: 18 }}
              />
            )}

            {!isCamOn && !isScreenSharing && (
              <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 10, color: "white" }}>
                <span style={{ fontSize: 64, opacity: 0.4 }}>📷</span>
                <p>Camera off</p>
                {camError && <p style={{ fontSize: 13, color: "#ff6b6b" }}>{camError}</p>}
                <button
                  onClick={startCamera}
                  style={{ padding: "10px 20px", background: "#4285f4", color: "white", border: "none", borderRadius: 8, marginTop: 10 }}
                >
                  Retry Camera
                </button>
              </div>
            )}

            {isRecording && (
              <div style={st.recBadge}>
                <div style={{ width: 10, height: 10, background: "#ea4335", borderRadius: "50%", animation: "recBlink 1.2s infinite" }} />
                <span>{fmt(recordTime)}</span>
              </div>
            )}

            <button
              style={st.fsBtn}
              onClick={() => document.querySelector("[data-video-container]")?.requestFullscreen()}
            >
              ⛶
            </button>

            <div style={st.speaker}>{user?.nom_user || "Admin"}</div>
            <div style={st.audioInd}>
              {[6, 14, 10, 16, 8].map((h, i) => (
                <div
                  key={i}
                  style={{
                    width: 3, height: isMicOn ? h : 4, background: "white",
                    borderRadius: 3,
                    animation: isMicOn ? `audioWave 0.8s infinite ${i * 0.15}s` : "none",
                  }}
                />
              ))}
            </div>
          </div>

          <div style={st.controls}>
            <div style={{ display: "flex", gap: 10 }}>
              <CB icon={isMicOn ? "🎤" : "🔇"} active={isMicOn} onClick={toggleMic} title="Mic" />
              <CB icon={isCamOn ? "📹" : "📷"} active={isCamOn} onClick={toggleCam} title="Camera" />
              <CB icon="🖥️" active={isScreenSharing} onClick={toggleScreen} title="Screen" />
              <CB icon={isRecording ? "⏹" : "🔴"} danger={isRecording} onClick={toggleRec} title="Record" />
              <CB icon="💬" active={showChat} onClick={() => setShowChat(!showChat)} title="Chat" />
            </div>
            <button style={st.endCall} onClick={endCall}>📞 End Call</button>
          </div>
        </div>

        {showChat && (
          <div style={st.chatPanel}>
            <div style={{ padding: 18, borderBottom: "1px solid #eee" }}>
              <h3 style={{ fontSize: 15, fontWeight: 600, margin: 0 }}>Chats</h3>
            </div>
            <div style={{ flex: 1, overflowY: "auto", padding: 16 }}>
  {messages.map((m, i) => (
  <div key={i} style={{ display: "flex", gap: 10, marginBottom: 14 }}>
    <div
      style={{
        width: 36,
        height: 36,
        borderRadius: "50%",
        background: "#4285f4",
        color: "white",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontSize: 12,
        fontWeight: 600,
      }}
    >
      {(m.user || "U").substring(0, 2)}
    </div>
    <div>
      <div style={{ fontSize: 12, fontWeight: 600 }}>
        {m.user || "User"}
        <span style={{ fontSize: 10, color: "#aaa", marginLeft: 6 }}>
          {m.time || ""}
        </span>
      </div>
      <div
        style={{
          background: "#f1f3f4",
          padding: "10px 14px",
          borderRadius: "12px 12px 12px 4px",
          marginTop: 4,
          fontSize: 13,
        }}
      >
        {m.text}
      </div>
    </div>
  </div>
))}

  {/* ✅ هذا السطر هو القلب */}
  <div ref={chatEndRef} />
</div>
             
            <div style={{ padding: "14px 16px", borderTop: "1px solid #eee", display: "flex", gap: 8 }}>
              <input
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && sendMessage()}
                style={st.chatInput}
              />
             <button onClick={sendMessage} style={st.sendBtn}>➤</button>
            </div>
          </div>
        )}
      </div>

      <style>{`
        @keyframes audioWave { 0%,100%{transform:scaleY(1)} 50%{transform:scaleY(0.4)} }
        @keyframes recBlink { 0%,100%{opacity:1} 50%{opacity:0.3} }
      `}</style>
    </div>
  );
}

const st = {
  page: { display: "flex", flexDirection: "column", height: "100vh", background: "white", borderRadius: 20, margin: 10, overflow: "hidden", boxShadow: "0 10px 60px rgba(0,0,0,0.08)", fontFamily: "'Poppins',sans-serif", position: "relative" },
  topBar: { display: "flex", alignItems: "center", justifyContent: "space-between", padding: "14px 24px", background: "white", borderBottom: "1px solid #f1f3f4", minHeight: 68 },
  logo: { width: 44, height: 44, background: "#4285f4", borderRadius: 12, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20 },
  badge: { padding: "4px 12px", background: "#e8f0fe", color: "#4285f4", borderRadius: 20, fontSize: 11, fontWeight: 700 },
  linkBadge: { padding: "8px 16px", background: "#f1f3f4", borderRadius: 25, fontSize: 12, color: "#666", cursor: "pointer", display: "flex", alignItems: "center", gap: 8 },
  newLinkBtn: { padding: "8px 12px", background: "#ffffff", border: "1px solid #ddd", borderRadius: 10, fontSize: 12, cursor: "pointer" },
  startBtn: { padding: "8px 14px", background: "#4285f4", color: "white", border: "none", borderRadius: 10, fontSize: 12, cursor: "pointer" },
  videoSection: { flex: 1, display: "flex", flexDirection: "column", background: "#7c5cbf" },
  videoBox: { flex: 1, position: "relative", margin: 14, borderRadius: 18, background: "#1a1a2e", overflow: "hidden", display: "flex", alignItems: "center", justifyContent: "center" },
  recBadge: { position: "absolute", top: 18, left: 22, display: "flex", alignItems: "center", gap: 8, padding: "8px 16px", background: "rgba(0,0,0,0.55)", borderRadius: 10, color: "white", fontSize: 13, zIndex: 10 },
  fsBtn: { position: "absolute", top: 18, right: 22, width: 40, height: 40, background: "rgba(0,0,0,0.45)", border: "none", borderRadius: 10, color: "white", fontSize: 18, cursor: "pointer", zIndex: 10 },
  speaker: { position: "absolute", bottom: 18, left: 22, padding: "7px 16px", background: "rgba(0,0,0,0.5)", borderRadius: 8, color: "white", fontSize: 13, zIndex: 10 },
  audioInd: { position: "absolute", bottom: 18, right: 22, display: "flex", gap: 2, alignItems: "flex-end", height: 24, zIndex: 10 },
  controls: { display: "flex", alignItems: "center", justifyContent: "space-between", padding: "16px 24px", background: "white", borderTop: "1px solid #f1f3f4" },
  endCall: { padding: "12px 28px", background: "#ea4335", color: "white", border: "none", borderRadius: 12, fontWeight: 600, cursor: "pointer" },
  chatPanel: { width: 340, borderLeft: "1px solid #f1f3f4", display: "flex", flexDirection: "column", background: "white" },
  chatInput: { flex: 1, padding: "10px 16px", background: "#f1f3f4", border: "none", borderRadius: 25, outline: "none" },
  sendBtn: { width: 38, height: 38, borderRadius: "50%", background: "#4285f4", color: "white", border: "none", cursor: "pointer" },
};