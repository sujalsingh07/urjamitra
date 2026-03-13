const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const http = require("http");
const { Server } = require("socket.io");
require("dotenv").config();

// Load routes carefully
let authRoutes;
try {
  authRoutes = require("./routes/authRoutes");
  console.log("✅ authRoutes loaded");
} catch (err) {
  console.error("❌ Error loading authRoutes:", err.message);
}

const app = express();
const server = http.createServer(app);

// Socket.IO setup
const io = new Server(server, {
  cors: {
    origin: "http://localhost:3000",
    methods: ["GET", "POST"]
  }
});

// Middleware
app.use(cors());
app.use(express.json());

// Debug middleware
app.use((req, res, next) => {
  console.log(`📨 Incoming: ${req.method} ${req.path}`);
  next();
});

// Routes
app.get("/", (req, res) => {
  console.log("Handling GET /");
  res.json({
    message: "⚡ Urjamitra Backend is Running!",
    status: "success"
  });
});

if (authRoutes) {
  app.use("/api/auth", authRoutes);
}
/* ============================
   SOCKET.IO EVENTS
============================ */

io.on("connection", (socket) => {

  console.log("⚡ User connected:", socket.id);

  // Receive message from client
  socket.on("send_message", (data) => {

    console.log("📩 Message received:", data);

    // Send message to all connected users
    io.emit("receive_message", data);

  });

  socket.on("disconnect", () => {
    console.log("❌ User disconnected:", socket.id);
  });

});

/* ============================
   DATABASE CONNECTION
============================ */

mongoose.connect(process.env.MONGODB_URI)
  .then(() => {
    console.log("✅ MongoDB Connected Successfully");

    server.listen(process.env.PORT, () => {
      console.log(`⚡ Urjamitra running on port ${process.env.PORT}`);
    });

  })
  .catch((error) => {
    console.log("❌ MongoDB Connection Error:", error);
  });