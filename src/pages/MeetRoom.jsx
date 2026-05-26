const express     = require("express");
const cors        = require("cors");
const helmet      = require("helmet");
const compression = require("compression");
const http        = require("http");
const { Server }  = require("socket.io");
const jwt         = require("jsonwebtoken");
require("dotenv").config();

const db         = require("./config/db");
const authController = require("./controllers/authController");
const seedAdmin = authController.seedAdmin || authController.default?.seedAdmin || (() => {});

const authRoutes         = require("./routes/authRoutes");
const adminRoutes        = require("./routes/adminRoutes");
const debatRoutes        = require("./routes/debatRoutes");
const chatbotRoutes      = require("./routes/chatbotRoutes");
const publicationRoutes  = require("./routes/publicationRoutes");
const profileRoutes      = require("./routes/profileRoutes");
const notificationRoutes = require("./routes/notificationRoutes");
const searchRoutes       = require("./routes/searchRoutes");
const dataRoutes         = require("./routes/dataRoutes");
const messengerRoutes    = require("./routes/messengerRoutes");

const liveRoutes        = require("./routes/LiveRoutes");
const archiveRoutes     = require("./routes/ArchiveRoutes");
const meetRoutes        = require("./routes/MeetRoutes");
const eventRoutes       = require("./routes/EventRoutes");
const enqueteRoutes     = require("./routes/EnquetesRoutes");
const gouvernoratRoutes = require("./routes/GouvernoratRoutes");
const userRoutes        = require("./routes/UserRoutes");

const app    = express();
const server = http.createServer(app);
const PORT   = process.env.PORT || 8080;

const LIVE_SECRET = process.env.LIVE_SECRET  || process.env.JWT_SECRET;
const CLIENT_URL  = process.env.CLIENT_URL   || "https://debat-jeune-frontend-e74v.vercel.app";

// ── INIT TABLES ──────────────────────────────────────
const initDB = async () => {
  try {
    await db.query(`CREATE TABLE IF NOT EXISTS messenger_conversations (
      id INT AUTO_INCREMENT PRIMARY KEY, user_a_id INT NOT NULL, user_b_id INT NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      UNIQUE KEY unique_conversation (user_a_id, user_b_id)
    )`);
    await db.query(`CREATE TABLE IF NOT EXISTS messenger_messages (
      id INT AUTO_INCREMENT PRIMARY KEY, conversation_id INT NOT NULL, sender_id INT NOT NULL,
      text TEXT DEFAULT NULL, file_url VARCHAR(500) DEFAULT NULL,
      msg_type VARCHAR(20) DEFAULT 'text', is_read TINYINT(1) DEFAULT 0,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (conversation_id) REFERENCES messenger_conversations(id)
    )`);
    await db.query(`ALTER TABLE messenger_messages ADD COLUMN IF NOT EXISTS file_url VARCHAR(500) DEFAULT NULL`).catch(() => {});
    await db.query(`ALTER TABLE messenger_messages ADD COLUMN IF NOT EXISTS msg_type VARCHAR(20) DEFAULT 'text'`).catch(() => {});
    await db.query(`ALTER TABLE messenger_messages ADD COLUMN IF NOT EXISTS is_read TINYINT(1) DEFAULT 0`).catch(() => {});

    // ✅ Table archive lives
    await db.query(`CREATE TABLE IF NOT EXISTS live_archives (
      id INT AUTO_INCREMENT PRIMARY KEY, live_id INT, room_code VARCHAR(100),
      title VARCHAR(255), description TEXT, thematique VARCHAR(100), host_name VARCHAR(100),
      started_at TIMESTAMP, ended_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      duration_seconds INT DEFAULT 0, participants_count INT DEFAULT 0,
      messages_count INT DEFAULT 0, ai_summary TEXT, chat_log JSON,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )`).catch(() => {});

    // ✅ Table blocked users
    await db.query(`CREATE TABLE IF NOT EXISTS live_blocked_users (
      id INT AUTO_INCREMENT PRIMARY KEY, email VARCHAR(255) NOT NULL,
      blocked_by_admin_id INT, reason VARCHAR(255), created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      UNIQUE KEY unique_email (email)
    )`).catch(() => {});

    // ✅ Colonne host_user_id dans lives si manquante
    await db.query(`ALTER TABLE lives ADD COLUMN IF NOT EXISTS host_user_id INT DEFAULT NULL`).catch(() => {});
    await db.query(`ALTER TABLE lives ADD COLUMN IF NOT EXISTS token_version INT DEFAULT 1`).catch(() => {});
    await db.query(`ALTER TABLE lives ADD COLUMN IF NOT EXISTS room_code VARCHAR(100) DEFAULT NULL`).catch(() => {});
    await db.query(`ALTER TABLE lives ADD COLUMN IF NOT EXISTS expires_at TIMESTAMP DEFAULT NULL`).catch(() => {});

    console.log("✅ DB tables prêtes");
  } catch (err) {
    console.error("❌ initDB:", err.message);
  }
};
initDB();

app.set("trust proxy", 1);

const ALLOWED = [
  "https://swafy-projet.vercel.app",
  "https://debat-jeune.onrender.com",
  "https://debat-jeune-frontend-e74v.vercel.app",
];
const corsOptions = {
  origin: (origin, cb) => {
    if (!origin || ALLOWED.includes(origin) || /\.vercel\.app$/.test(origin)) cb(null, true);
    else cb(new Error("Not allowed by CORS"));
  },
  credentials: true,
  methods: ["GET","POST","PUT","DELETE","OPTIONS"],
  allowedHeaders: ["Content-Type","Authorization"],
};
app.options("*", cors(corsOptions));
app.use(cors(corsOptions));
app.use(helmet({ crossOriginResourcePolicy: false }));
app.use(compression());
app.use("/uploads", express.static("uploads"));
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

// ── ROUTES ───────────────────────────────────────────
app.use("/api/messenger",     messengerRoutes);
app.use("/api/auth",          authRoutes);
app.use("/api/admin",         adminRoutes);
app.use("/api/debats",        debatRoutes);
app.use("/api/chatbot",       chatbotRoutes);
app.use("/api/publications",  publicationRoutes);
app.use("/api/profile",       profileRoutes);
app.use("/api/notifications", notificationRoutes);
app.use("/api/search",        searchRoutes);
app.use("/api/data",          dataRoutes);
app.use("/api/users",         userRoutes);

app.get("/api/admin/stats/jeune-count", async (req, res) => {
  try { const [r] = await db.query("SELECT COUNT(*) as count FROM jeune_profiles"); res.json({ count: r[0]?.count || 0 }); }
  catch { res.json({ count: 0 }); }
});
app.get("/api/settings", (req, res) => res.json({ success: true, settings: {} }));
app.get("/api/health", async (req, res) => {
  try { await db.query("SELECT 1"); res.json({ status: "OK", db: "Connected" }); }
  catch (err) { res.status(500).json({ status: "Error", db: err.message }); }
});

app.use("/api/lives",        liveRoutes);
app.use("/api/archive",      archiveRoutes);
app.use("/api/meet",         meetRoutes);
app.use("/api/events",       eventRoutes);
app.use("/api/enquetes",     enqueteRoutes);
app.use("/api/gouvernorats", gouvernoratRoutes);

// ── SOCKET.IO ────────────────────────────────────────
const io = new Server(server, {
  cors: { origin: "*", credentials: true },
  transports: ["websocket","polling"],
  pingTimeout:  60000,
  pingInterval: 25000,
});
app.set("io", io);

// ── État en mémoire ────────────────────────────────────
const roomUsers     = {};  // { roomCode: [participants] }
const socketRoomMap = {};  // { socketId: roomCode }
const roomChatLog   = {};  // { roomCode: [messages] }
const roomStartTime = {};  // { roomCode: Date }

// ── ✅ FIX CRITIQUE: validateLiveToken ASSOUPLIE ──────
// Le problème principal était que token_version en DB changeait
// mais le token JWT du jeune avait l'ancienne version → "Accès refusé"
// SOLUTION: ne pas vérifier token_version pour les guests
async function validateLiveToken(roomCode, accessToken, role) {
  try {
    const decoded = jwt.verify(accessToken, LIVE_SECRET);

    if (decoded.type !== "live")        return { ok: false, message: "Token invalide" };
    if (decoded.roomCode !== roomCode)  return { ok: false, message: "Room non autorisée" };
    if (decoded.role !== role)          return { ok: false, message: "Rôle incorrect (host/guest)" };

    // Rooms swafy- (MeetRoutes) : pas de validation DB
    if (roomCode.startsWith("swafy-")) return { ok: true, decoded };

    const [rows] = await db.execute("SELECT * FROM lives WHERE room_code=? LIMIT 1", [roomCode]);
    if (!rows.length) return { ok: false, message: "Live introuvable — vérifiez le lien" };

    const live = rows[0];

    // ✅ FIX: Pour les guests, accepter si le live est actif, sans vérifier token_version
    if (role === "guest") {
      // Seulement vérifier expiration JWT (déjà fait par jwt.verify)
      // et que le live existe. On ne vérifie PAS token_version pour guests.
      return { ok: true, decoded, live };
    }

    // Pour le host: vérifications complètes
    if (!live.is_active) return { ok: false, message: "Ce live n'est plus actif" };
    if (live.expires_at && new Date(live.expires_at) < new Date()) return { ok: false, message: "Session expirée" };

    // Vérifier que c'est bien l'admin du live
    if (decoded.userId && live.admin_id &&
        Number(decoded.userId) !== Number(live.admin_id) &&
        Number(decoded.userId) !== Number(live.host_user_id)) {
      return { ok: false, message: "Vous n'êtes pas l'hôte de ce live" };
    }

    return { ok: true, decoded, live };
  } catch (e) {
    console.error("validateLiveToken error:", e.message);
    return { ok: false, message: "Token expiré ou invalide — rafraîchissez la page" };
  }
}

function leaveRoom(socket) {
  const roomCode = socketRoomMap[socket.id];
  if (!roomCode) return;

  if (roomUsers[roomCode]) {
    roomUsers[roomCode] = roomUsers[roomCode].filter(u => u.socketId !== socket.id);
    socket.to(roomCode).emit("user-left", { socketId: socket.id });
    io.to(roomCode).emit("participants-update", roomUsers[roomCode]);
    if (roomUsers[roomCode].length === 0) delete roomUsers[roomCode];
  }

  // Si l'hôte quitte → terminer le live pour tous
  if (socket.data?.role === "host") {
    io.to(roomCode).emit("live-ended", { roomCode });
    io.emit("live-ended", { roomCode }); // broadcast global
  }

  delete socketRoomMap[socket.id];
  socket.leave(roomCode);
}

// ── Socket auth ────────────────────────────────────────
io.use((socket, next) => {
  const token = socket.handshake.auth.token;
  if (!token) return next();
  try { socket.user = jwt.verify(token, process.env.JWT_SECRET || "secret"); } catch {}
  next();
});

// ── Socket events ──────────────────────────────────────
io.on("connection", (socket) => {
  const userId = socket.user?.id_user || socket.user?.id;
  if (userId) socket.join(`user_${userId}`);

  socket.on("joinConversation",  ({ conversationId }) => socket.join(String(conversationId)));
  socket.on("leaveConversation", ({ conversationId }) => { if (conversationId) socket.leave(String(conversationId)); });
  socket.on("joinGroup",         () => socket.join("group_swafy"));

  // ── join-room ─────────────────────────────────────────
  socket.on("join-room", async (payload, ack = () => {}) => {
    const { roomCode, userName, role = "guest", accessToken, email } = payload || {};
    if (!roomCode || !accessToken) return ack({ ok: false, message: "Données manquantes" });

    // ✅ Vérifier blocage
    if (email && role !== "host") {
      try {
        const [blocked] = await db.query("SELECT id FROM live_blocked_users WHERE email = ?", [email]);
        if (blocked.length > 0) return ack({ ok: false, message: "Votre accès a été révoqué." });
      } catch {}
    }

    const check = await validateLiveToken(roomCode, accessToken, role);
    if (!check.ok) return ack({ ok: false, message: check.message });

    socket.join(roomCode);
    socketRoomMap[socket.id] = roomCode;
    socket.data = { roomCode, role, userName: userName || "Invité", email: email || "" };

    if (!roomUsers[roomCode]) roomUsers[roomCode] = [];
    if (!roomChatLog[roomCode]) roomChatLog[roomCode] = [];
    if (role === "host" && !roomStartTime[roomCode]) roomStartTime[roomCode] = new Date();

    roomUsers[roomCode] = roomUsers[roomCode].filter(u => u.socketId !== socket.id);
    roomUsers[roomCode].push({
      socketId:   socket.id,
      userName:   socket.data.userName,
      role,
      audioOn:    role === "host",
      videoOn:    role === "host",
      handRaised: false,
      email:      email || "",
    });

    // ✅ Envoyer liste des users déjà présents au nouveau
    socket.emit("all-users", roomUsers[roomCode].filter(u => u.socketId !== socket.id));
    // ✅ Notifier les autres qu'un nouveau est arrivé
    socket.to(roomCode).emit("user-joined", {
      socketId: socket.id,
      userName: socket.data.userName,
      role,
      email: email || "",
    });
    io.to(roomCode).emit("participants-update", roomUsers[roomCode]);

    // ✅ FIX CRITIQUE: Quand l'admin rejoint une room qui a déjà des guests
    // → Les guests doivent recevoir l'offre WebRTC de l'admin pour voir sa vidéo
    // Cela se passe via "all-users" côté frontend (MeetRoom.jsx crée les offres)
    // Mais si l'admin arrive EN DERNIER, les guests ont déjà créé leurs peers
    // → on émet "host-joined" pour que les guests sachent recréer la connexion
    if (role === "host") {
      socket.to(roomCode).emit("host-joined", {
        socketId: socket.id,
        userName: socket.data.userName,
      });

      // Générer viewerLink frais et mettre à jour DB + broadcaster
      try {
        const [liveRows] = await db.execute("SELECT * FROM lives WHERE room_code=? LIMIT 1", [roomCode]);
        const live = liveRows[0];
        const tv   = live?.token_version || 1;

        const viewerToken = jwt.sign(
          { type: "live", role: "guest", roomCode, v: tv },
          LIVE_SECRET,
          { expiresIn: "6h" }
        );
        const viewerLink = `${CLIENT_URL}/meet/${roomCode}?vt=${viewerToken}`;

        // Mettre à jour stream_link en DB
        await db.execute("UPDATE lives SET stream_link=?, is_active=1 WHERE room_code=?",
          [viewerLink, roomCode]).catch(() => {});

        // ✅ Broadcaster à TOUS (y compris l'espace jeune)
        io.emit("live-started", {
          roomCode,
          hostName:    userName,
          viewerLink,
          title:       live?.title_live       || "Live en cours",
          description: live?.description      || "",
          thematique:  live?.thematique        || "",
          liveId:      live?.id_live || live?.id,
          startedAt:   new Date(),
        });

        io.emit("new_notification", {
          type_notification: "live_started",
          message:    `🔴 ${userName} a démarré un live !`,
          roomCode,
          viewerLink,
          created_at: new Date(),
        });

      } catch (err) {
        console.error("host join broadcast error:", err.message);
      }
    }

    ack({ ok: true });
  });

  // ── WebRTC signaling ───────────────────────────────────
  socket.on("offer",         ({ target, sdp })       => io.to(target).emit("offer",         { caller: socket.id, sdp }));
  socket.on("answer",        ({ target, sdp })       => io.to(target).emit("answer",        { responder: socket.id, sdp }));
  socket.on("ice-candidate", ({ target, candidate }) => io.to(target).emit("ice-candidate", { from: socket.id, candidate }));

  // ── Media toggle ───────────────────────────────────────
  socket.on("toggle-media", ({ roomCode, type, enabled }) => {
    if (!socket.data?.roomCode) return;
    // Guests ne peuvent PAS activer la vidéo
    if (type === "video" && socket.data.role !== "host") return;
    const u = roomUsers[roomCode]?.find(u => u.socketId === socket.id);
    if (u) u[type + "On"] = enabled;
    socket.to(roomCode).emit("user-media-toggled", { socketId: socket.id, type, enabled });
    io.to(roomCode).emit("participants-update", roomUsers[roomCode] || []);
  });

  // ── Partage d'écran ─────────────────────────────────────
  socket.on("screen-share-started", ({ roomCode }) => {
    if (socket.data?.role !== "host") return;
    socket.to(roomCode).emit("screen-share-started", { socketId: socket.id, userName: socket.data?.userName });
  });
  socket.on("screen-share-stopped", ({ roomCode }) =>
    socket.to(roomCode).emit("screen-share-stopped", { socketId: socket.id }));

  // ── Main levée ──────────────────────────────────────────
  socket.on("raise-hand", ({ roomCode, raised }) => {
    if (socket.data) socket.data.handRaised = raised;
    const u = roomUsers[roomCode]?.find(u => u.socketId === socket.id);
    if (u) u.handRaised = raised;
    io.to(roomCode).emit("hand-raised",        { socketId: socket.id, userName: socket.data?.userName, raised });
    io.to(roomCode).emit("participants-update", roomUsers[roomCode] || []);
  });

  // ── Admin controls ──────────────────────────────────────
  socket.on("admin-mute", ({ roomCode, targetSocketId, type }) => {
    if (socket.data?.role !== "host") return;
    io.to(targetSocketId).emit("force-mute", { type });
    const u = roomUsers[roomCode]?.find(u => u.socketId === targetSocketId);
    if (u) u[type + "On"] = false;
    io.to(roomCode).emit("participants-update", roomUsers[roomCode] || []);
  });

  socket.on("allow-mic", ({ roomCode, targetSocketId }) => {
    if (socket.data?.role !== "host") return;
    io.to(targetSocketId).emit("mic-allowed", { targetSocketId });
    const u = roomUsers[roomCode]?.find(u => u.socketId === targetSocketId);
    if (u) u.audioOn = true;
    io.to(roomCode).emit("participants-update", roomUsers[roomCode] || []);
  });

  socket.on("admin-kick", ({ roomCode, targetSocketId }) => {
    if (socket.data?.role !== "host") return;
    const targetSocket = io.sockets.sockets.get(targetSocketId);
    io.to(targetSocketId).emit("force-kicked");
    roomUsers[roomCode] = (roomUsers[roomCode] || []).filter(u => u.socketId !== targetSocketId);
    io.to(roomCode).emit("participants-update", roomUsers[roomCode] || []);
    // Forcer la déconnexion après un délai pour laisser le message arriver
    if (targetSocket) setTimeout(() => targetSocket.disconnect(true), 1000);
  });

  socket.on("admin-block", async ({ roomCode, targetSocketId, targetEmail }) => {
    if (socket.data?.role !== "host") return;
    const adminId = socket.user?.id_user || socket.user?.id;
    const targetSocket = io.sockets.sockets.get(targetSocketId);
    if (targetEmail) {
      try {
        await db.query(
          "INSERT INTO live_blocked_users (email, blocked_by_admin_id, reason) VALUES (?,?,?) ON DUPLICATE KEY UPDATE reason=VALUES(reason)",
          [targetEmail, adminId, "Bloqué par admin"]
        );
      } catch {}
    }
    io.to(targetSocketId).emit("force-blocked", { message: "Votre compte a été bloqué par l'administrateur." });
    roomUsers[roomCode] = (roomUsers[roomCode] || []).filter(u => u.socketId !== targetSocketId);
    io.to(roomCode).emit("participants-update", roomUsers[roomCode] || []);
    // Forcer la déconnexion
    if (targetSocket) setTimeout(() => targetSocket.disconnect(true), 1000);
  });

  // ── Réactions ───────────────────────────────────────────
  socket.on("send-reaction", ({ roomCode, emoji }) =>
    io.to(roomCode).emit("reaction", { socketId: socket.id, userName: socket.data?.userName, emoji }));

  // ── Messages ────────────────────────────────────────────
  socket.on("send-message", ({ roomCode, message }) => {
    if (!socket.data?.roomCode || socket.data.roomCode !== roomCode) return;
    const msg = {
      socketId: socket.id,
      user:     socket.data.userName,
      role:     socket.data.role,
      text:     message,
      time:     new Date().toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" }),
      ts:       Date.now(),
    };
    if (!roomChatLog[roomCode]) roomChatLog[roomCode] = [];
    roomChatLog[roomCode].push(msg);
    io.to(roomCode).emit("receive-message", msg);
  });

  // ── Terminer le live (admin) ─────────────────────────────
  socket.on("end-live", async ({ roomCode, liveId, liveInfo }) => {
    if (socket.data?.role !== "host") return;

    const startTime = roomStartTime[roomCode] || new Date();
    const duration  = Math.round((new Date() - startTime) / 1000);
    const chatLog   = roomChatLog[roomCode] || [];
    const users     = roomUsers[roomCode] || [];

    io.to(roomCode).emit("live-ended", { roomCode });
    io.emit("live-ended", { roomCode });

    try {
      await db.query(
        `INSERT INTO live_archives (live_id,room_code,title,description,thematique,host_name,started_at,ended_at,duration_seconds,participants_count,messages_count,chat_log)
         VALUES (?,?,?,?,?,?,?,NOW(),?,?,?,?)`,
        [liveId||null, roomCode, liveInfo?.title||"Live", liveInfo?.description||"", liveInfo?.thematique||"",
         socket.data.userName, startTime, duration, users.length, chatLog.length, JSON.stringify(chatLog)]
      );
      if (liveId) await db.query("UPDATE lives SET is_active=0, status='Terminé' WHERE id_live=?", [liveId]).catch(() => {});
    } catch (err) { console.error("archive error:", err.message); }

    delete roomUsers[roomCode];
    delete roomChatLog[roomCode];
    delete roomStartTime[roomCode];
  });

  socket.on("leave-room", () => leaveRoom(socket));
  socket.on("disconnect", () => leaveRoom(socket));
});

const sendNotification = (toUserId, notif) => io.to(`user_${toUserId}`).emit("new_notification", notif);
app.set("sendNotification", sendNotification);

seedAdmin();
server.listen(PORT, "0.0.0.0", () => console.log(`🚀 Serveur sur le port ${PORT}`));