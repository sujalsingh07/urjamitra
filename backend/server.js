const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
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
   DATABASE CONNECTION
============================ */

mongoose.connect(process.env.MONGODB_URI)
  .then(() => {
    console.log("✅ MongoDB Connected Successfully");

    app.listen(process.env.PORT, () => {
      console.log(`⚡ Urjamitra running on port ${process.env.PORT}`);
    });

  })
  .catch((error) => {
    console.log("❌ MongoDB Connection Error:", error);
  });