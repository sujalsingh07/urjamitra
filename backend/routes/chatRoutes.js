const express = require("express");
const router = express.Router();

let messages = [];

/* ======================
   GET CHAT HISTORY
====================== */

router.get("/history", (req, res) => {
  res.json({
    success: true,
    messages
  });
});

/* ======================
   SEND MESSAGE
====================== */

router.post("/", (req, res) => {
  const { message } = req.body;

  if (!message) {
    return res.status(400).json({
      success: false,
      reply: "Message required"
    });
  }

  const userMsg = { role: "user", content: message };

  const botReply = {
    role: "assistant",
    content: `⚡ Energy Assistant: I received your message "${message}".`
  };

  messages.push(userMsg);
  messages.push(botReply);

  res.json({
    success: true,
    reply: botReply.content
  });
});

module.exports = router;