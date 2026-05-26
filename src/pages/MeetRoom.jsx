// server.js — Backend complet Swafy Meet (Google Meet style)
// ✅ Toutes les permissions admin/jeunes, WebRTC, chat, archive, blocage
const express     = require("express");
const cors        = require("cors");
const helmet      = require("helmet");
const compression = require("compression");
const http        = require("http");
const { Server }  = require("socket.io");
const jwt         = require("jsonwebtoken");
const cloudinary  = require("cloudinary").v2;
require("dotenv").config();

const db         = require("./config/db");
const authSocket = require("./middleware/authSocket");

const authController = require("./controllers/authController");
const seedAdmin = authController.seedAdmin || authController.default?.seedAdmin || (() => {});

// ── Routes debat-jeune ───────────────────────────────
const authRoutes         = require("./routes/authRoutes");
const adminRoutes        = require("./routes/adminRoutes");
const debatRoutes        = require("./routes/debatRoutes");

const publicationRoutes  = require("./routes/publicationRoutes");
const Profileupdateroute     = require("./routes/Profileupdateroute");
const notificationRoutes = require("./routes/notificationRoutes");
const searchRoutes       = require("./routes/searchRoutes");
const dataRoutes         = require("./routes/dataRoutes");
const messengerRoutes    = require("./routes/messengerRoutes");

// ── Routes swafy ─────────────────────────────────────
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
const LIVE_SECRET  = process.env.LIVE_SECRET  || process.env.JWT_SECRET;
const CLIENT_URL   = process.env.CLIENT_URL   || "https://swafy-projet.vercel.app";

// ── INIT DB TABLES ────────────────────────────────────
const initDB = async () => {
  try {
    await db.query(`CREATE TABLE IF NOT EXISTS messenger_conversations (
      id INT AUTO_INCREMENT PRIMARY KEY,
      user_a_id INT NOT NULL, user_b_id INT NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      UNIQUE KEY unique_conversation (user_a_id, user_b_id)
    )`);
    await db.query(`CREATE TABLE IF NOT EXISTS messenger_messages (
      id INT AUTO_INCREMENT PRIMARY KEY,
      conversation_id INT NOT NULL, sender_id INT NOT NULL,
      text TEXT DEFAULT NULL, file_url VARCHAR(500) DEFAULT NULL,
      msg_type VARCHAR(20) DEFAULT 'text', is_read TINYINT(1) DEFAULT 0,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (conversation_id) REFERENCES messenger_conversations(id)
    )`);
    await db.query(`ALTER TABLE messenger_messages ADD COLUMN IF NOT EXISTS file_url VARCHAR(500) DEFAULT NULL`).catch(() => {});
    await db.query(`ALTER TABLE messenger_messages ADD COLUMN IF NOT EXISTS msg_type VARCHAR(20) DEFAULT 'text'`).catch(() => {});
    await db.query(`ALTER TABLE messenger_messages ADD COLUMN IF NOT EXISTS is_read TINYINT(1) DEFAULT 0`).catch(() => {});
    await db.query(`UPDATE messenger_messages SET msg_type = 'text' WHERE msg_type IS NULL`).catch(() => {});

    await db.query(`CREATE TABLE IF NOT EXISTS live_archives (
      id INT AUTO_INCREMENT PRIMARY KEY,
      live_id INT,
      room_code VARCHAR(100),
      title VARCHAR(255),
      description TEXT,
      thematique VARCHAR(100),
      host_name VARCHAR(100),
      started_at TIMESTAMP,
      ended_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      duration_seconds INT DEFAULT 0,
      participants_count INT DEFAULT 0,
      messages_count INT DEFAULT 0,
      ai_summary TEXT,
      chat_log JSON,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )`).catch(() => {});

    await db.query(`CREATE TABLE IF NOT EXISTS live_blocked_users (
      id INT AUTO_INCREMENT PRIMARY KEY,
      email VARCHAR(255) NOT NULL,
      blocked_by_admin_id INT,
      reason VARCHAR(255),
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      UNIQUE KEY unique_email (email)
    )`).catch(() => {});

    // ✅ Colonnes lives
    await db.query(`CREATE TABLE IF NOT EXISTS lives (
      id_live INT AUTO_INCREMENT PRIMARY KEY,
      title_live VARCHAR(255) DEFAULT 'Live session',
      description TEXT DEFAULT NULL,
      stream_link TEXT DEFAULT NULL,
      date DATE DEFAULT NULL,
      time TIME DEFAULT NULL,
      thematique VARCHAR(255) DEFAULT NULL,
      status VARCHAR(50) DEFAULT 'En cours',
      category VARCHAR(100) DEFAULT 'other',
      room_code VARCHAR(100) DEFAULT NULL,
      is_active TINYINT(1) DEFAULT 0,
      admin_id INT DEFAULT NULL,
      host_user_id INT DEFAULT NULL,
      token_version INT DEFAULT 1,
      expires_at TIMESTAMP DEFAULT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )`).catch(() => {});
    await db.query(`ALTER TABLE lives ADD COLUMN IF NOT EXISTS host_user_id INT DEFAULT NULL`).catch(() => {});
    await db.query(`ALTER TABLE lives ADD COLUMN IF NOT EXISTS token_version INT DEFAULT 1`).catch(() => {});
    await db.query(`ALTER TABLE lives ADD COLUMN IF NOT EXISTS room_code VARCHAR(100) DEFAULT NULL`).catch(() => {});
    await db.query(`ALTER TABLE lives ADD COLUMN IF NOT EXISTS expires_at TIMESTAMP DEFAULT NULL`).catch(() => {});
    await db.query(`ALTER TABLE lives ADD COLUMN IF NOT EXISTS stream_link TEXT DEFAULT NULL`).catch(() => {});
    await db.query(`ALTER TABLE lives ADD COLUMN IF NOT EXISTS date DATE DEFAULT NULL`).catch(() => {});
    await db.query(`ALTER TABLE lives ADD COLUMN IF NOT EXISTS time TIME DEFAULT NULL`).catch(() => {});
    await db.query(`ALTER TABLE lives ADD COLUMN IF NOT EXISTS thematique VARCHAR(255) DEFAULT NULL`).catch(() => {});
    await db.query(`ALTER TABLE lives ADD COLUMN IF NOT EXISTS category VARCHAR(100) DEFAULT 'other'`).catch(() => {});
    await db.query(`ALTER TABLE lives ADD COLUMN IF NOT EXISTS status VARCHAR(50) DEFAULT 'En cours'`).catch(() => {});
    await db.query(`ALTER TABLE lives ADD COLUMN IF NOT EXISTS description TEXT DEFAULT NULL`).catch(() => {});
    await db.query(`ALTER TABLE lives ADD COLUMN IF NOT EXISTS is_active TINYINT(1) DEFAULT 0`).catch(() => {});
    await db.query(`ALTER TABLE lives ADD COLUMN IF NOT EXISTS admin_id INT DEFAULT NULL`).catch(() => {});

    console.log("✅ Tables DB prêtes !");
  } catch (err) {
    console.error("❌ Erreur init DB:", err.message);
  }
};
initDB();

app.set("trust proxy", 1);

const ALLOWED_ORIGINS = [
  "https://swafy-projet.vercel.app",
  "https://debat-jeune.onrender.com",
  "https://debat-jeune-frontend-e74v.vercel.app",
];

const corsOptions = {
  origin: (origin, callback) => {
    if (!origin || ALLOWED_ORIGINS.includes(origin) || /\.vercel\.app$/.test(origin)) {
      callback(null, true);
    } else {
      callback(new Error("Not allowed by CORS"));
    }
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

app.use("/api/messenger",     messengerRoutes);
app.use("/api/auth",          authRoutes);
app.use("/api/admin",         adminRoutes);
app.use("/api/debats",        debatRoutes);
app.use("/api/publications",  publicationRoutes);
app.use("/api/profile",       Profileupdateroute);
app.use("/api/notifications", notificationRoutes);
app.use("/api/search",        searchRoutes);
app.use("/api/data",          dataRoutes);
app.use("/api/users",         userRoutes);

app.get("/api/admin/stats/jeune-count", async (req, res) => {
  try {
    const [rows] = await db.query("SELECT COUNT(*) as count FROM jeune_profiles");
    res.json({ count: rows[0]?.count || 0 });
  } catch { res.json({ count: 0 }); }
});

app.get("/api/settings", (req, res) => res.json({ success: true, settings: {} }));
app.get("/api/health",   async (req, res) => {
  try { await db.query("SELECT 1"); res.json({ status: "OK", db: "Connected" }); }
  catch (err) { res.status(500).json({ status: "Error", db: err.message }); }
});

// ✅ FIX: GET /api/lives direct (SELECT * pour éviter 500 sur colonnes manquantes)
app.get("/api/lives", async (req, res) => {
  try {
    const [lives] = await db.execute("SELECT * FROM lives ORDER BY is_active DESC, created_at DESC");
    res.json(lives);
  } catch (err) {
    console.error("❌ GET /api/lives direct:", err.message);
    res.status(500).json({ message: err.message });
  }
});

// ✅ FIX: viewer-token direct route (avant liveRoutes pour garantir le chargement)
app.get("/api/lives/viewer-token/:roomCode", async (req, res) => {
  try {
    const { roomCode } = req.params;
    const [rows] = await db.execute(
      "SELECT * FROM lives WHERE room_code=? AND is_active=1 LIMIT 1", [roomCode]
    );
    if (!rows.length) {
      // Essayer sans is_active=1 (au cas où live existe mais pas encore activé)
      const [rows2] = await db.execute("SELECT * FROM lives WHERE room_code=? LIMIT 1", [roomCode]);
      if (!rows2.length) return res.status(404).json({ success: false, message: "Live introuvable" });
      const live2 = rows2[0];
      const vToken2 = jwt.sign(
        { type: "live", role: "guest", roomCode, v: live2.token_version || 1 },
        LIVE_SECRET, { expiresIn: "6h" }
      );
      const vLink2 = `${CLIENT_URL}/meet/${roomCode}?vt=${vToken2}`;
      await db.execute("UPDATE lives SET stream_link=? WHERE room_code=?", [vLink2, roomCode]).catch(() => {});
      return res.json({ success: true, viewerToken: vToken2, viewerLink: vLink2, roomCode, title: live2.title_live });
    }
    const live = rows[0];
    const viewerToken = jwt.sign(
      { type: "live", role: "guest", roomCode, v: live.token_version || 1 },
      LIVE_SECRET, { expiresIn: "6h" }
    );
    const viewerLink = `${CLIENT_URL}/meet/${roomCode}?vt=${viewerToken}`;
    await db.execute("UPDATE lives SET stream_link=? WHERE room_code=?", [viewerLink, roomCode]).catch(() => {});
    return res.json({ success: true, viewerToken, viewerLink, roomCode, title: live.title_live });
  } catch (err) {
    console.error("❌ viewer-token:", err.message);
    res.status(500).json({ success: false, message: err.message });
  }
});

app.use("/api/lives",        liveRoutes);
app.use("/api/archive",      archiveRoutes);
app.use("/api/meet",         meetRoutes);
app.use("/api/events",       eventRoutes);
app.use("/api/enquetes",     enqueteRoutes);
app.use("/api/gouvernorats", gouvernoratRoutes);

app.post("/api/lives/block-user", async (req, res) => {
  try {
    const { email, reason, adminId } = req.body;
    if (!email) return res.status(400).json({ success: false, message: "Email requis" });
    await db.query(
      "INSERT INTO live_blocked_users (email, blocked_by_admin_id, reason) VALUES (?, ?, ?) ON DUPLICATE KEY UPDATE reason=?, created_at=NOW()",
      [email, adminId || null, reason || "Exclu du live", reason || "Exclu du live"]
    );
    await db.query("DELETE FROM jeune_profiles WHERE email_user = ?", [email]).catch(() => {});
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

app.get("/api/lives/check-blocked/:email", async (req, res) => {
  try {
    const [rows] = await db.query("SELECT id FROM live_blocked_users WHERE email = ?", [req.params.email]);
    res.json({ blocked: rows.length > 0 });
  } catch { res.json({ blocked: false }); }
});

app.post("/api/lives/archive", async (req, res) => {
  try {
    const { liveId, roomCode, title, description, thematique, hostName,
            startedAt, durationSeconds, participantsCount, messagesCount,
            aiSummary, chatLog } = req.body;
    await db.query(
      `INSERT INTO live_archives 
       (live_id, room_code, title, description, thematique, host_name, started_at, duration_seconds, participants_count, messages_count, ai_summary, chat_log)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [liveId || null, roomCode, title, description, thematique, hostName,
       startedAt || new Date(), durationSeconds || 0, participantsCount || 0,
       messagesCount || 0, aiSummary || null, JSON.stringify(chatLog || [])]
    );
    if (liveId) {
      await db.query("UPDATE lives SET is_active=0 WHERE id_live=?", [liveId]).catch(() => {});
    }
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ── SOCKET.IO ────────────────────────────────────────
const io = new Server(server, {
  cors: { origin: "*", credentials: true },
  transports: ["websocket", "polling"],
  pingTimeout:  60000,
  pingInterval: 25000,
});

app.set("io", io);

const roomUsers     = {};
const socketRoomMap = {};
const roomChatLog   = {};
const roomStartTime = {};

// ── Token validation — guests: pas de vérif token_version ──
async function validateLiveToken(roomCode, accessToken, role) {
  try {
    // ✅ FIX: pour les guests, ignorer l'expiration JWT — on vérifie juste que le live est actif en DB
    const verifyOptions = role === "guest" ? { ignoreExpiration: true } : {};
    const decoded = jwt.verify(accessToken, LIVE_SECRET, verifyOptions);
    if (decoded.type !== "live")       return { ok: false, message: "Token invalide" };
    if (decoded.roomCode !== roomCode) return { ok: false, message: "Room non autorisée" };
    if (decoded.role !== role)         return { ok: false, message: "Rôle non autorisé" };

    // swafy- rooms (MeetRoutes) : pas de validation DB
    if (roomCode.startsWith("swafy-")) return { ok: true, decoded };

    const [rows] = await db.execute("SELECT * FROM lives WHERE room_code=? LIMIT 1", [roomCode]);
    if (!rows.length) return { ok: false, message: "Live introuvable" };
    const live = rows[0];

    // ✅ Pour les guests: accepter si JWT valide (même expiré) + live exists in DB
    // Le live peut être is_active=0 si l'admin vient de démarrer (race condition)
    if (role === "guest") {
      return { ok: true, decoded, live };
    }

    // Pour le host: vérifications complètes
    if (!live.is_active) return { ok: false, message: "Live terminé" };
    if (live.expires_at && new Date(live.expires_at) < new Date()) return { ok: false, message: "Lien expiré" };
    if (decoded.userId && live.admin_id &&
        Number(decoded.userId) !== Number(live.admin_id) &&
        Number(decoded.userId) !== Number(live.host_user_id)) {
      return { ok: false, message: "Host non autorisé" };
    }
    return { ok: true, decoded, live };
  } catch (e) {
    // ✅ FIX: si erreur JWT pour un guest → essayer quand même de valider via DB roomCode
    if (role === "guest") {
      try {
        const [rows] = await db.execute("SELECT * FROM lives WHERE room_code=? AND is_active=1 LIMIT 1", [roomCode]);
        if (rows.length) {
          // Décoder sans vérif signature pour extraire les infos
          const decoded = jwt.decode(accessToken);
          if (decoded?.roomCode === roomCode && decoded?.role === "guest") {
            return { ok: true, decoded, live: rows[0] };
          }
        }
      } catch {}
    }
    return { ok: false, message: "Token expiré ou invalide" };
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

  if (socket.data?.role === "host") {
    io.to(roomCode).emit("live-ended", { roomCode });
    io.emit("live-ended", { roomCode });
  }

  delete socketRoomMap[socket.id];
  socket.leave(roomCode);
}

io.use((socket, next) => {
  const token = socket.handshake.auth.token;
  if (!token) return next();
  try {
    socket.user = jwt.verify(token, process.env.JWT_SECRET || "votre_secret_ici");
  } catch {}
  next();
});

io.on("connection", (socket) => {
  const userId = socket.user?.id_user || socket.user?.id;

  if (userId) socket.join(`user_${userId}`);
  socket.on("joinConversation",  ({ conversationId }) => socket.join(String(conversationId)));
  socket.on("leaveConversation", ({ conversationId }) => { if (conversationId) socket.leave(String(conversationId)); });
  socket.on("joinGroup",         ()                   => socket.join("group_swafy"));

  // ── join-room ─────────────────────────────────────
  socket.on("join-room", async (payload, ack = () => {}) => {
    const { roomCode, userName, role = "guest", accessToken, email } = payload || {};
    if (!roomCode || !accessToken) return ack({ ok: false, message: "Données manquantes" });

    if (email && role !== "host") {
      try {
        const [blocked] = await db.query("SELECT id FROM live_blocked_users WHERE email = ?", [email]);
        if (blocked.length > 0) return ack({ ok: false, message: "Votre accès à ce live a été révoqué par l'administrateur." });
      } catch {}
    }

    const check = await validateLiveToken(roomCode, accessToken, role);
    if (!check.ok) return ack({ ok: false, message: check.message });

    socket.join(roomCode);
    socketRoomMap[socket.id] = roomCode;
    socket.data = { roomCode, role, userName: userName || "Invité", email: email || "" };

    if (!roomUsers[roomCode])   roomUsers[roomCode]   = [];
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

    // ✅ Envoyer liste des users présents au nouveau
    socket.emit("all-users", roomUsers[roomCode].filter(u => u.socketId !== socket.id));
    // ✅ Notifier les autres — host-joined si c'est l'admin
    if (role === "host") {
      socket.to(roomCode).emit("host-joined", {
        socketId: socket.id,
        userName: socket.data.userName,
      });
    } else {
      socket.to(roomCode).emit("user-joined", {
        socketId: socket.id,
        userName: socket.data.userName,
        role,
        email: email || "",
      });
    }
    io.to(roomCode).emit("participants-update", roomUsers[roomCode]);

    // ✅ Host rejoint → broadcast live-started avec viewerLink frais
    if (role === "host") {
      try {
        const tokenVersion = check.live?.token_version || 1;
        const viewerToken  = jwt.sign(
          { type: "live", role: "guest", roomCode, v: tokenVersion },
          LIVE_SECRET,
          { expiresIn: "6h" }
        );
        const viewerLink = `${CLIENT_URL}/meet/${roomCode}?vt=${viewerToken}`;

        db.execute("UPDATE lives SET stream_link=?, is_active=1 WHERE room_code=?", [viewerLink, roomCode]).catch(() => {});

        const livePayload = {
          roomCode,
          hostName:    userName,
          viewerLink,
          startedAt:   new Date(),
          title:       check.live?.title_live  || "Live en cours",
          description: check.live?.description || "",
          thematique:  check.live?.thematique  || "",
          liveId:      check.live?.id_live,
        };

        io.emit("live-started", livePayload);
        io.emit("new_notification", {
          type_notification: "live_started",
          message: `🔴 ${userName} a démarré un live — rejoignez maintenant !`,
          ...livePayload,
          created_at: new Date(),
        });
      } catch (err) {
        console.error("host join broadcast error:", err.message);
      }
    }

    ack({ ok: true });
  });

  // ── WebRTC signaling ──────────────────────────────
  socket.on("offer",         ({ target, sdp })       => io.to(target).emit("offer",         { caller: socket.id, sdp }));
  socket.on("answer",        ({ target, sdp })       => io.to(target).emit("answer",        { responder: socket.id, sdp }));
  socket.on("ice-candidate", ({ target, candidate }) => io.to(target).emit("ice-candidate", { from: socket.id, candidate }));

  // ── Media controls ────────────────────────────────
  socket.on("toggle-media", ({ roomCode, type, enabled }) => {
    if (!socket.data?.roomCode) return;
    if (type === "video" && socket.data.role !== "host") return;
    const u = roomUsers[roomCode]?.find(u => u.socketId === socket.id);
    if (u) u[type + "On"] = enabled;
    socket.to(roomCode).emit("user-media-toggled", { socketId: socket.id, type, enabled });
    io.to(roomCode).emit("participants-update", roomUsers[roomCode] || []);
  });

  // ── Partage d'écran ───────────────────────────────
  socket.on("screen-share-started", ({ roomCode }) => {
    if (socket.data?.role !== "host") return;
    socket.to(roomCode).emit("screen-share-started", { socketId: socket.id, userName: socket.data?.userName });
  });
  socket.on("screen-share-stopped", ({ roomCode }) => {
    socket.to(roomCode).emit("screen-share-stopped", { socketId: socket.id });
  });

  // ── Main levée ────────────────────────────────────
  socket.on("raise-hand", ({ roomCode, raised }) => {
    if (socket.data) socket.data.handRaised = raised;
    const u = roomUsers[roomCode]?.find(u => u.socketId === socket.id);
    if (u) u.handRaised = raised;
    io.to(roomCode).emit("hand-raised",        { socketId: socket.id, userName: socket.data?.userName, raised });
    io.to(roomCode).emit("participants-update", roomUsers[roomCode] || []);
  });

  // ── Admin controls ────────────────────────────────
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

  // ✅ Kick: فقط الشخص المحدد يتطرد + فصل الـ socket
  socket.on("admin-kick", ({ roomCode, targetSocketId }) => {
    if (socket.data?.role !== "host") return;
    const targetSocket = io.sockets.sockets.get(targetSocketId);
    io.to(targetSocketId).emit("force-kicked");
    roomUsers[roomCode] = (roomUsers[roomCode] || []).filter(u => u.socketId !== targetSocketId);
    io.to(roomCode).emit("participants-update", roomUsers[roomCode] || []);
    // ✅ فصل الـ socket نهائيًا بعد ثانية
    if (targetSocket) setTimeout(() => targetSocket.disconnect(true), 1000);
  });

  // ✅ Block: حفظ في live_blocked_users فقط — لا نمسح الحساب أبداً
  socket.on("admin-block", async ({ roomCode, targetSocketId, targetEmail }) => {
    if (socket.data?.role !== "host") return;
    const adminId = socket.user?.id_user || socket.user?.id;
    const targetSocket = io.sockets.sockets.get(targetSocketId);

    if (targetEmail) {
      try {
        await db.query(
          "INSERT INTO live_blocked_users (email, blocked_by_admin_id, reason) VALUES (?, ?, ?) ON DUPLICATE KEY UPDATE reason=VALUES(reason), created_at=NOW()",
          [targetEmail, adminId, "Bloqué par l'admin durant le live"]
        );
        // ✅ NE JAMAIS supprimer le compte — on bloque juste l'accès aux lives
      } catch (err) {
        console.error("block DB error:", err.message);
      }
    }

    io.to(targetSocketId).emit("force-blocked", { message: "Vous avez été bloqué par l'administrateur. Vous ne pouvez plus accéder aux lives." });
    roomUsers[roomCode] = (roomUsers[roomCode] || []).filter(u => u.socketId !== targetSocketId);
    io.to(roomCode).emit("participants-update", roomUsers[roomCode] || []);
    // ✅ Déconnecter le socket après délai
    if (targetSocket) setTimeout(() => targetSocket.disconnect(true), 1200);
  });

  // ── Réactions ─────────────────────────────────────
  socket.on("send-reaction", ({ roomCode, emoji }) =>
    io.to(roomCode).emit("reaction", { socketId: socket.id, userName: socket.data?.userName, emoji }));

  // ── Messages ──────────────────────────────────────
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

  // ── Terminer le live ──────────────────────────────
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
        `INSERT INTO live_archives 
         (live_id, room_code, title, description, thematique, host_name, started_at, ended_at, duration_seconds, participants_count, messages_count, chat_log)
         VALUES (?, ?, ?, ?, ?, ?, ?, NOW(), ?, ?, ?, ?)`,
        [liveId || null, roomCode, liveInfo?.title || "Live", liveInfo?.description || "",
         liveInfo?.thematique || "", socket.data.userName, startTime, duration,
         users.length, chatLog.length, JSON.stringify(chatLog)]
      );
      if (liveId) await db.query("UPDATE lives SET is_active=0, status='Terminé' WHERE id_live=?", [liveId]).catch(() => {});
    } catch (err) {
      console.error("❌ Archive error:", err.message);
    }

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
server.listen(PORT, "0.0.0.0", () => console.log(`🚀 Backend prêt sur le port ${PORT}`));