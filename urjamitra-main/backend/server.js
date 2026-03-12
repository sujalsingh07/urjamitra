const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const http = require("http");
const { Server } = require("socket.io");
require("dotenv").config();
const chatRoutes = require("./routes/chatRoutes");
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
app.use("/api/chat", chatRoutes);
// Test route
app.get("/", (req, res) => {
  res.json({
    message: "⚡ Urjamitra Backend is Running!",
    status: "success"
  });
});

// API Routes
app.use("/api/auth", require("./routes/authRoutes"));
app.use("/api/listings", require("./routes/listingRoutes"));
app.use("/api/transactions", require("./routes/transactionRoutes"));
app.use("/api/users", require("./routes/userRoutes"));

/* ============================
   SOCKET.IO EVENTS
============================ */

io.on("connection", (socket) => {
  console.log("⚡ User connected:", socket.id);

  // Send message
  socket.on("send_message", (data) => {
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