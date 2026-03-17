const express = require('express');
const router = express.Router();
const messageController = require('../controllers/messageController');
const jwt = require('jsonwebtoken');

// Middleware to verify token
const authenticateToken = (req, res, next) => {
  const token = req.headers['authorization']?.split(' ')[1];
  if (!token) return res.status(401).json({ success: false, message: 'No token provided' });
  
  jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
    if (err) return res.status(403).json({ success: false, message: 'Invalid token' });
    req.userId = decoded.id;
    next();
  });
};

router.get('/conversations', authenticateToken, messageController.getConversations);
router.get('/history/:userId', authenticateToken, messageController.getChatHistory);
router.put('/read/:userId', authenticateToken, messageController.markAsRead);
router.delete('/conversation/:userId', authenticateToken, messageController.deleteConversation);

module.exports = router;
