// Simple test server to debug
const express = require("express");
const cors = require("cors");

const app = express();
app.use(cors());
app.use(express.json());

app.get("/", (req, res) => {
  res.json({ status: "OK", message: "Simple test server" });
});

app.post("/test-otp", (req, res) => {
  const { email } = req.body;
  const otp = Math.floor(100000 + Math.random() * 900000).toString();
  console.log(`Generated OTP: ${otp}`);
  res.json({ success: true, otp, email });
});

app.listen(5002, () => {
  console.log("Test server running on port 5002");
});
