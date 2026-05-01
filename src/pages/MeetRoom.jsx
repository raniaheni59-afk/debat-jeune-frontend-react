import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import { io } from "socket.io-client";
import API from "../services/api";

const SOCKET_URL = "https://swafy-backend.onrender.com";

function VideoCard({ stream, muted = false, name = "Invité", isOff = false }) {
  const videoRef = useRef(null);

  useEffect(() => {
    if (videoRef.current && stream) {
      videoRef.current.srcObject = stream;
    }
  }, [stream]);

  return (
    <div style={st.videoCard}>
      <video
        ref={videoRef}
        autoPlay
        playsInline
        muted={muted}
        style={{
          ...st.video,
          display: isOff ? "none" : "block",
        }}
      />
      {isOff && <div style={st.videoOff}>📷 Caméra désactivée</div>}
      <div style={st.videoName}>{name}</div>
    </div>
  );
}

export default function MeetRoom() {
  const { roomCode } = useParams();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const [remotePeers, setRemotePeers] = useState([]);
  const [remoteMediaState, setRemoteMediaState] = useState({});
  const [audioEnabled, setAudioEnabled] = useState(false);
  const [videoEnabled, setVideoEnabled] = useState(false);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState("");
  const [authorized, setAuthorized] = useState(false);
  const [loading, setLoading] = useState(true);
  const [roomRole, setRoomRole] = useState("guest");
  const [streamReady, setStreamReady] = useState(false); // ✅ ✅ جديد

  const socketRef = useRef(null);
  const localVideoRef = useRef(null);
  const localStreamRef = useRef(null);
  const peersRef = useRef({});
  const participantNamesRef = useRef({});

  const user =
    JSON.parse(localStorage.getItem("user")) || { nom_user: "Invité" };
  const userName = user?.nom_user || "Invité";

  const accessToken =
    searchParams.get("at") || searchParams.get("vt") || "";

  const requestedRole = searchParams.get("at") ? "host" : "guest";

  const safeShareLink = useMemo(() => {
    if (roomRole === "host") {
      return (
        localStorage.getItem("currentLiveViewerLink") ||
        `${window.location.origin}/live/${roomCode}`
      );
    }
    return window.location.href;
  }, [roomCode, roomRole]);

  // ✅ ✅ ✅ مهم: ربط الـ stream بالـ video بعد render
  useEffect(() => {
    if (localVideoRef.current && localStreamRef.current && streamReady) {
      localVideoRef.current.srcObject = localStreamRef.current;
    }
  }, [streamReady, videoEnabled, loading]);

  const createPeerConnection = (targetSocketId) => {
    const pc = new RTCPeerConnection({
      iceServers: [
        { urls: "stun:stun.l.google.com:19302" },
        { urls: "stun:stun1.l.google.com:19302" },
      ],
    });

    pc.onicecandidate = (event) => {
      if (event.candidate && socketRef.current) {
        socketRef.current.emit("ice-candidate", {
          target: targetSocketId,
          candidate: event.candidate,
        });
      }
    };

    pc.ontrack = (event) => {
      const remoteStream = event.streams[0];

      setRemotePeers((prev) => {
        const exists = prev.find((p) => p.socketId === targetSocketId);
        if (exists) {
          return prev.map((p) =>
            p.socketId === targetSocketId
              ? {
                  ...p,
                  stream: remoteStream,
                  name:
                    participantNamesRef.current[targetSocketId] || "Invité",
                }
              : p
          );
        }
        return [
          ...prev,
          {
            socketId: targetSocketId,
            stream: remoteStream,
            name: participantNamesRef.current[targetSocketId] || "Invité",
          },
        ];
      });
    };

    return pc;
  };

  useEffect(() => {
    let mounted = true;

    const initRoom = async () => {
      try {
        if (!accessToken) {
          setError("Lien invalide : token manquant.");
          setLoading(false);
          return;
        }

// ✅ token موجود = نسمحو بالدخول
setAuthorized(true);
setRoomRole(requestedRole);

        // ✅ ✅ Demander camera + micro
        try {
          const stream = await navigator.mediaDevices.getUserMedia({
            video: true,
            audio: true,
          });

          if (!mounted) {
            stream.getTracks().forEach((t) => t.stop());
            return;
          }

          localStreamRef.current = stream;
          setAudioEnabled(true);
          setVideoEnabled(true);
          setStreamReady(true); // ✅ ✅ trigger useEffect
        } catch (mediaErr) {
          console.warn("⚠️ Media non accordé :", mediaErr);
          setAudioEnabled(false);
          setVideoEnabled(false);
        }

        setLoading(false); // ✅ بعد ما نعمل setStream

        // ✅ ✅ Connexion Socket
        const socket = io(SOCKET_URL, {
          transports: ["websocket"],
        });

        socketRef.current = socket;
        socket.on("connect", () => {
          socket.emit(
            "join-room",
              {
                roomCode,
                userName,
                role: requestedRole,
                accessToken,
              },
              (ack) => {
                if (!ack?.ok) {
                  setError(ack?.message || "Accès refusé");
                }
              }
            );

        });

        socket.on("all-users", async (users) => {
          for (const u of users) {
            participantNamesRef.current[u.socketId] = u.userName || "Invité";
            const pc = createPeerConnection(u.socketId);
            peersRef.current[u.socketId] = pc;

            if (localStreamRef.current) {
              localStreamRef.current.getTracks().forEach((t) => {
                pc.addTrack(t, localStreamRef.current);
              });
            }

            const offer = await pc.createOffer();
            await pc.setLocalDescription(offer);

            socket.emit("offer", { target: u.socketId, sdp: offer });
          }
        });

        socket.on("user-joined", ({ socketId, userName }) => {
          participantNamesRef.current[socketId] = userName || "Invité";
        });

        socket.on("offer", async ({ caller, sdp }) => {
          let pc = peersRef.current[caller];
          if (!pc) {
            pc = createPeerConnection(caller);
            peersRef.current[caller] = pc;
            if (localStreamRef.current) {
              localStreamRef.current.getTracks().forEach((t) => {
                pc.addTrack(t, localStreamRef.current);
              });
            }
          }
          await pc.setRemoteDescription(new RTCSessionDescription(sdp));
          const answer = await pc.createAnswer();
          await pc.setLocalDescription(answer);
          socket.emit("answer", { target: caller, sdp: answer });
        });

        socket.on("answer", async ({ responder, sdp }) => {
          const pc = peersRef.current[responder];
          if (!pc) return;
          await pc.setRemoteDescription(new RTCSessionDescription(sdp));
        });

        socket.on("ice-candidate", async ({ from, candidate }) => {
          const pc = peersRef.current[from];
          if (!pc || !candidate) return;
          try {
            await pc.addIceCandidate(new RTCIceCandidate(candidate));
          } catch (err) {
            console.error("ICE error:", err);
          }
        });

        socket.on("user-left", ({ socketId }) => {
          if (peersRef.current[socketId]) {
            peersRef.current[socketId].close();
            delete peersRef.current[socketId];
          }
          delete participantNamesRef.current[socketId];

          setRemotePeers((prev) =>
            prev.filter((p) => p.socketId !== socketId)
          );
        });

        socket.on("user-media-toggled", ({ socketId, type, enabled }) => {
          setRemoteMediaState((prev) => ({
            ...prev,
            [socketId]: { ...prev[socketId], [type]: enabled },
          }));
        });

      } catch (err) {
        console.error(err);
        setError("Lien invalide ou expiré.");
        setLoading(false);
      }
    };

    initRoom();

    return () => {
      mounted = false;
      if (socketRef.current) {
        socketRef.current.emit("leave-room");
        socketRef.current.disconnect();
      }
      Object.values(peersRef.current).forEach((pc) => pc.close());
      peersRef.current = {};
      if (localStreamRef.current) {
        localStreamRef.current.getTracks().forEach((t) => t.stop());
      }
    };
  }, [roomCode, accessToken, requestedRole, userName]);

  const toggleAudio = () => {
    const stream = localStreamRef.current;
    if (!stream) return;
    const audioTrack = stream.getAudioTracks()[0];
    if (!audioTrack) return;
    audioTrack.enabled = !audioTrack.enabled;
    setAudioEnabled(audioTrack.enabled);
    socketRef.current?.emit("toggle-media", {
      roomCode,
      type: "audio",
      enabled: audioTrack.enabled,
    });
  };

  const toggleVideo = () => {
    const stream = localStreamRef.current;
    if (!stream) return;
    const videoTrack = stream.getVideoTracks()[0];
    if (!videoTrack) return;
    videoTrack.enabled = !videoTrack.enabled;
    setVideoEnabled(videoTrack.enabled);
    socketRef.current?.emit("toggle-media", {
      roomCode,
      type: "video",
      enabled: videoTrack.enabled,
    });
  };

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(safeShareLink);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error(err);
    }
  };

  const leaveMeeting = () => {
    if (socketRef.current) {
      socketRef.current.emit("leave-room");
      socketRef.current.disconnect();
    }
    Object.values(peersRef.current).forEach((pc) => pc.close());
    peersRef.current = {};
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach((t) => t.stop());
    }
    navigate(-1);
  };

  // ✅ ✅ Render
  if (loading) {
    return (
      <div style={st.center}>
        <h2 style={{ color: "white" }}>⏳ Chargement du Live...</h2>
      </div>
    );
  }

  if (!authorized || error) {
    return (
      <div style={st.center}>
        <div style={st.errorBox}>{error || "Accès refusé"}</div>
      </div>
    );
  }

  return (
    <div style={st.page}>
      <div style={st.header}>
        <div>
          <h2 style={{ margin: 0 }}>🎥 Swafy Live</h2>
          <p style={{ margin: 0, fontSize: 13, opacity: 0.7 }}>
            Code : {roomCode} | Rôle : {roomRole}
          </p>
        </div>

        <div style={st.linkBox}>
          <input value={safeShareLink} readOnly style={st.linkInput} />
          <button onClick={copyLink} style={st.copyBtn}>
            {copied ? "✅ Copié" : "📋 Copier"}
          </button>
        </div>
      </div>

      <div style={st.grid}>
        <div style={st.videoCard}>
          {/* ✅ ✅ ✅ Video element TOUJOURS présent */}
          <video
            ref={localVideoRef}
            autoPlay
            playsInline
            muted
            style={{
              ...st.video,
              display: streamReady && videoEnabled ? "block" : "none",
            }}
          />
          {(!streamReady || !videoEnabled) && (
            <div style={st.videoOff}>
              {!streamReady ? "📷 Permission refusée" : "📷 Caméra OFF"}
            </div>
          )}
          <div style={st.videoName}>
            Vous ({userName}) {audioEnabled ? "🎤" : "🔇"}
          </div>
        </div>

        {remotePeers.map((peer) => (
          <VideoCard
            key={peer.socketId}
            stream={peer.stream}
            name={`${peer.name} ${
              remoteMediaState[peer.socketId]?.audio === false ? "🔇" : ""
            }`}
            isOff={remoteMediaState[peer.socketId]?.video === false}
          />
        ))}
      </div>

      <div style={st.controls}>
        <button onClick={toggleAudio} style={st.btn} disabled={!streamReady}>
          {audioEnabled ? "🎤 Couper micro" : "🔇 Activer micro"}
        </button>
        <button onClick={toggleVideo} style={st.btn} disabled={!streamReady}>
          {videoEnabled ? "📷 Couper caméra" : "📹 Activer caméra"}
        </button>
        <button onClick={copyLink} style={st.btnSecondary}>
          📋 Partager
        </button>
        <button onClick={leaveMeeting} style={st.btnDanger}>
          🚪 Quitter
        </button>
      </div>
    </div>
  );
}

const st = {
  page: {
    minHeight: "100vh",
    background: "linear-gradient(135deg, #6a4dab, #5a3fa0)",
    color: "white",
    padding: 20,
    fontFamily: "'Poppins', sans-serif",
  },
  center: {
    minHeight: "100vh",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    background: "#1a1a2e",
  },
  header: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 20,
    flexWrap: "wrap",
    gap: 10,
  },
  linkBox: { display: "flex", gap: 8 },
  linkInput: {
    padding: 10,
    border: "none",
    borderRadius: 8,
    width: 280,
    fontSize: 12,
  },
  copyBtn: {
    padding: "10px 16px",
    background: "white",
    color: "#6a4dab",
    border: "none",
    borderRadius: 8,
    fontWeight: 600,
    cursor: "pointer",
  },
  grid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))",
    gap: 16,
    marginBottom: 20,
  },
  videoCard: {
    background: "#000",
    borderRadius: 12,
    overflow: "hidden",
    position: "relative",
    aspectRatio: "16/9",
  },
  video: {
    width: "100%",
    height: "100%",
    objectFit: "cover",
  },
  videoOff: {
    position: "absolute",
    inset: 0,
    background: "#1a1a2e",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: 16,
  },
  videoName: {
    position: "absolute",
    bottom: 8,
    left: 8,
    background: "rgba(0,0,0,.6)",
    padding: "4px 10px",
    borderRadius: 8,
    fontSize: 12,
    zIndex: 2,
  },
  controls: {
    display: "flex",
    gap: 10,
    justifyContent: "center",
    flexWrap: "wrap",
  },
  btn: {
    padding: "12px 20px",
    background: "white",
    color: "#6a4dab",
    border: "none",
    borderRadius: 10,
    fontWeight: 600,
    cursor: "pointer",
  },
  btnSecondary: {
    padding: "12px 20px",
    background: "rgba(255,255,255,0.2)",
    color: "white",
    border: "1px solid white",
    borderRadius: 10,
    cursor: "pointer",
  },
  btnDanger: {
    padding: "12px 20px",
    background: "#ea4335",
    color: "white",
    border: "none",
    borderRadius: 10,
    fontWeight: 600,
    cursor: "pointer",
  },
  errorBox: {
    background: "white",
    color: "#ea4335",
    padding: 30,
    borderRadius: 12,
    fontSize: 16,
    fontWeight: 600,
  },
};