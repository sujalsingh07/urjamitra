const express    = require("express");
const http       = require("http");
const { Server } = require("socket.io");
const mongoose   = require("mongoose");
const cors       = require("cors");
const path       = require("path");
const fs         = require("fs");
require("dotenv").config();

// ── Auto-create .env if missing ───────────────────────────────────────────────
const envPath = path.join(__dirname, ".env");
if (!fs.existsSync(envPath)) {
  fs.writeFileSync(envPath, "PORT=5001\nJWT_SECRET=urjamitra_demo_secret_key_2024\nMONGODB_URI=\n");
  require("dotenv").config();
}

// ── Ensure JWT_SECRET always has a value ──────────────────────────────────────
if (!process.env.JWT_SECRET) {
  process.env.JWT_SECRET = "urjamitra_demo_secret_key_2024";
}

// ── Services ──────────────────────────────────────────────────────────────────
const smartMeter = require("./services/smartMeterSimulator");

// ── Routes ────────────────────────────────────────────────────────────────────
const tryLoad = (name, p) => {
  try   { const m = require(p); console.log(`✅ ${name}`); return m; }
  catch (e) { console.error(`❌ ${name}: ${e.message}`); return null; }
};

const authRoutes        = tryLoad("authRoutes",        "./routes/authRoutes");
const userRoutes        = tryLoad("userRoutes",        "./routes/userRoutes");
const listingRoutes     = tryLoad("listingRoutes",     "./routes/listingRoutes");
const transactionRoutes = tryLoad("transactionRoutes", "./routes/transactionRoutes");
const messageRoutes     = tryLoad("messageRoutes",     "./routes/messageRoutes");
const iesRoutes         = tryLoad("iesRoutes",         "./routes/iesRoutes");

// ── App ───────────────────────────────────────────────────────────────────────
const app    = express();
const server = http.createServer(app);
const io     = new Server(server, { cors: { origin: "*", methods: ["GET","POST","PUT","DELETE"] } });

app.set("io", io);
app.use(cors({ origin: "*" }));
app.use(express.json());
app.use((req, _, next) => { console.log(`📨 ${req.method} ${req.path}`); next(); });

app.get("/",      (_, res) => res.json({ message: "⚡ Urjamitra P2P Energy Marketplace", status: "ok" }));
app.get("/health",(_, res) => res.json({ status: "ok", timestamp: new Date().toISOString() }));

if (authRoutes)        app.use("/api/auth",        authRoutes);
if (userRoutes)        app.use("/api/users",        userRoutes);
if (listingRoutes)     app.use("/api/listings",     listingRoutes);
if (transactionRoutes) app.use("/api/transactions", transactionRoutes);
if (messageRoutes)     app.use("/api/messages",     messageRoutes);
if (iesRoutes)         app.use("/api/ies",          iesRoutes);

// ── Socket.IO ─────────────────────────────────────────────────────────────────
const Message     = require("./models/Message");
const User        = require("./models/user");
const userSockets = new Map();

io.on("connection", (socket) => {
  console.log("⚡ Socket connected:", socket.id);

  socket.on("register", async (userId) => {
    if (!userId) return;
    userSockets.set(userId, socket.id);
    socket.join(`user:${userId}`);
    if (!smartMeter.getMeterState(userId)) {
      const meterId = `MTR-${userId.toString().substring(0,8).toUpperCase()}-99`;
      let snapshot = null;
      try {
        const dbUser = await User.findById(userId).select('meterSnapshot').lean();
        snapshot = dbUser?.meterSnapshot || null;
      } catch {
        snapshot = null;
      }
      smartMeter.registerMeter(userId, meterId, false, snapshot);
    }
    io.emit("offlineStatus", Array.from(userSockets.keys()));
    const s = smartMeter.getMeterState(userId);
    if (s) socket.emit("telemetry:init", { meters: { [userId]: s } });
  });

  socket.on("meter:setProsumer", ({ userId, generationKw, consumptionKw }) => {
    if (!userId) return;
    if (!smartMeter.getMeterState(userId)) {
      smartMeter.registerMeter(userId, `MTR-${userId.substring(0,8).toUpperCase()}-99`, true);
    }
    smartMeter.seedMeterForDemo(userId, generationKw || 8, consumptionKw || 3);
  });

  socket.on("sendMessage", async (data) => {
    try {
      const { senderId, receiverId, content } = data;
      const msg = new Message({ senderId, receiverId, content });
      await msg.save();
      const rid = userSockets.get(receiverId);
      if (rid) io.to(rid).emit("receiveMessage", msg);
      socket.emit("messageSent", msg);
    } catch (err) { console.error("msg error:", err); }
  });

  socket.on("userTyping", (data) => {
    const rid = userSockets.get(data.receiverId);
    if (rid) io.to(rid).emit("userTyping", { senderId: data.senderId });
  });

  socket.on("disconnect", () => {
    for (const [uid, sid] of userSockets.entries()) {
      if (sid === socket.id) { userSockets.delete(uid); break; }
    }
    io.emit("offlineStatus", Array.from(userSockets.keys()));
  });
});

// ── MongoDB: auto-use in-memory DB if no URI provided ────────────────────────
async function connectDB() {
  const uri = process.env.MONGODB_URI && process.env.MONGODB_URI.trim();

  if (uri) {
    // Use provided URI (Atlas or local)
    console.log("🔌 Connecting to MongoDB...");
    await mongoose.connect(uri);
    console.log("✅ MongoDB connected (external)");
  } else {
    // Zero-config: spin up an in-memory MongoDB automatically
    console.log("🔌 No MONGODB_URI found — starting built-in in-memory database...");
    const { MongoMemoryServer } = require("mongodb-memory-server");
    const mongod = await MongoMemoryServer.create();
    const memUri = mongod.getUri();
    await mongoose.connect(memUri);
    console.log("✅ MongoDB connected (in-memory, zero config — data resets on restart)");
  }
}

// ── Start ─────────────────────────────────────────────────────────────────────
connectDB()
  .then(() => {
    smartMeter.startSimulator(io);

    const PORT = process.env.PORT || 5001;
    server.listen(PORT, () => {
      console.log("");
      console.log("╔══════════════════════════════════════════════════╗");
      console.log("║   ⚡  Urjamitra Backend is LIVE!                  ║");
      console.log(`║   API    →  http://localhost:${PORT}/api           ║`);
      console.log(`║   Socket →  ws://localhost:${PORT}                ║`);
      console.log("╠══════════════════════════════════════════════════╣");
      console.log("║   Open http://localhost:3000                     ║");
      console.log("╚══════════════════════════════════════════════════╝");
      console.log("");
    });
  })
  .catch((err) => {
    console.error("❌ Failed to start:", err.message);
    process.exit(1);
  });
