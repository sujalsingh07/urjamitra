const express = require("express");
const router = express.Router();
const Message = require("../models/Message");

/* =============================
   SEND MESSAGE
============================= */

router.post("/send", async (req, res) => {
  try {

    const { senderId, receiverId, message } = req.body;

    const newMessage = new Message({
      senderId,
      receiverId,
      message
    });

    await newMessage.save();

    res.json({
      success: true,
      message: newMessage
    });

  } catch (error) {

    res.status(500).json({
      success: false,
      error: error.message
    });

  }
});


/* =============================
   GET CONVERSATION
============================= */

router.get("/conversation/:user1/:user2", async (req, res) => {

  try {

    const { user1, user2 } = req.params;

    const messages = await Message.find({
      $or: [
        { senderId: user1, receiverId: user2 },
        { senderId: user2, receiverId: user1 }
      ]
    }).sort({ timestamp: 1 });

    res.json({
      success: true,
      messages
    });

  } catch (error) {

    res.status(500).json({
      success: false,
      error: error.message
    });

  }

});

module.exports = router;