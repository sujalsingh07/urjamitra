const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const mongoose = require("mongoose");
const cors = require("cors");
require("dotenv").config();

// Load routes carefully
let authRoutes;
let userRoutes;
let listingRoutes;
let transactionRoutes;
let messageRoutes;
try {
  authRoutes = require("./routes/authRoutes");
  console.log("✅ authRoutes loaded");
} catch (err) {
  console.error("❌ Error loading authRoutes:", err.message);
}

try {
  userRoutes = require("./routes/userRoutes");
  console.log("✅ userRoutes loaded");
} catch (err) {
  console.error("❌ Error loading userRoutes:", err.message);
}

try {
  listingRoutes = require("./routes/listingRoutes");
  console.log("✅ listingRoutes loaded");
} catch (err) {
  console.error("❌ Error loading listingRoutes:", err.message);
}

try {
  messageRoutes = require("./routes/messageRoutes");
  console.log("✅ messageRoutes loaded");
} catch (err) {
  console.error("❌ Error loading messageRoutes:", err.message);
}

try {
  transactionRoutes = require("./routes/transactionRoutes");
  console.log("✅ transactionRoutes loaded");
} catch (err) {
  console.error("❌ Error loading transactionRoutes:", err.message);
}

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "*", // Adjust depending on frontend URL
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

if (userRoutes) {
  app.use("/api/users", userRoutes);
}

if (listingRoutes) {
  app.use("/api/listings", listingRoutes);
}

if (transactionRoutes) {
  app.use("/api/transactions", transactionRoutes);
}

if (messageRoutes) {
  app.use("/api/messages", messageRoutes);
}

// Socket.io Setup
const Message = require("./models/Message"); // required for saving
// Map to keep track of user sockets: { userId: socketId }
const userSockets = new Map();

io.on("connection", (socket) => {
  console.log("⚡ New Socket Connection:", socket.id);

  socket.on("register", (userId) => {
    if (userId) {
      userSockets.set(userId, socket.id);
      console.log(`User ${userId} registered with socket ${socket.id}`);
      io.emit("offlineStatus", Array.from(userSockets.keys()));
    }
  });

  socket.on("sendMessage", async (data) => {
    try {
      const { senderId, receiverId, content } = data;
      // Save message to database
      const newMessage = new Message({ senderId, receiverId, content });
      await newMessage.save();

      // Send to receiver if online
      const receiverSocketId = userSockets.get(receiverId);
      if (receiverSocketId) {
        io.to(receiverSocketId).emit("receiveMessage", newMessage);
      }
      
      // Also emit back to sender so they know it was processed successfully
      socket.emit("messageSent", newMessage);

    } catch (err) {
      console.error("Socket send message error:", err);
    }
  });

  socket.on("userTyping", (data) => {
     const receiverSocketId = userSockets.get(data.receiverId);
     if (receiverSocketId) {
         io.to(receiverSocketId).emit("userTyping", { senderId: data.senderId });
     }
  });

  socket.on("disconnect", () => {
    console.log("Socket Disconnected:", socket.id);
    let disconnectedUserId = null;
    for (const [userId, socketId] of userSockets.entries()) {
      if (socketId === socket.id) {
        disconnectedUserId = userId;
        userSockets.delete(userId);
        break;
      }
    }
    if (disconnectedUserId) {
        io.emit("offlineStatus", Array.from(userSockets.keys()));
    }
  });
});

/* ============================
   DATABASE CONNECTION
============================ */

mongoose.connect(process.env.MONGODB_URI)
  .then(() => {
    console.log("✅ MongoDB Connected Successfully");

    server.listen(process.env.PORT, () => {
      console.log(`⚡ Urjamitra server running on port ${process.env.PORT}`);
    });

  })
  .catch((error) => {
    console.log("❌ MongoDB Connection Error:", error);
  });