const mongoose = require('mongoose');
const Message = require('../models/Message');
const User = require('../models/user');

// Get all conversations for a user (list of unique users they chatted with + last message)
exports.getConversations = async (req, res) => {
  try {
    const userId = req.userId;
    const userObjId = new mongoose.Types.ObjectId(userId);

    // Aggregate to find unique conversational partners and the latest message
    const conversations = await Message.aggregate([
      {
        $match: {
          $or: [{ senderId: userObjId }, { receiverId: userObjId }]
        }
      },
      {
        $sort: { createdAt: -1 }
      },
      {
        $group: {
          _id: {
            $cond: [
              { $eq: ["$senderId", userObjId] },
              "$receiverId",
              "$senderId"
            ]
          },
          lastMessage: { $first: "$$ROOT" }
        }
      }
    ]);

    // Populate the other user's info
    const populatedConvos = await User.populate(conversations, {
      path: '_id',
      select: 'name email profilePicture' // Add any other fields you want to show
    });

    res.json({
      success: true,
      conversations: populatedConvos.map(c => ({
        user: c._id, // The other user's populated data
        lastMessage: c.lastMessage
      }))
    });
  } catch (error) {
    console.error('Error fetching conversations:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// Get chat history with a specific user
exports.getChatHistory = async (req, res) => {
  try {
    const userId = req.userId;
    const otherUserId = req.params.userId;

    const messages = await Message.find({
      $or: [
        { senderId: userId, receiverId: otherUserId },
        { senderId: otherUserId, receiverId: userId }
      ]
    }).sort({ createdAt: 1 }); // Oldest to newest

    res.json({ success: true, messages });
  } catch (error) {
    console.error('Error fetching chat history:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// Mark messages from a specific user as read
exports.markAsRead = async (req, res) => {
    try {
        const userId = req.userId;
        const otherUserId = req.params.userId;

        await Message.updateMany(
            { senderId: otherUserId, receiverId: userId, read: false },
            { $set: { read: true } }
        );

        res.json({ success: true });
    } catch (error) {
        console.error('Error marking messages as read:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
}
