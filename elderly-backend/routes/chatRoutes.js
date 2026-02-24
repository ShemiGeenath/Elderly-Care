// backend/routes/chatRoutes.js
const express = require('express');
const router = express.Router();
const chatController = require('../controllers/chatController');
const protect = require('../middleware/authMiddleware');

// Get all chats for current user
router.get('/chats', protect, chatController.getUserChats);

// Get or create chat with another user
router.get('/chat/:userId', protect, chatController.getOrCreateChat);

// Get messages for a specific chat
router.get('/messages/:chatId', protect, chatController.getChatMessages);

// Send a message
router.post('/message/:chatId', protect, chatController.sendMessage);

// Delete a message
router.delete('/message/:messageId', protect, chatController.deleteMessage);

// Mark messages as delivered
router.put('/delivered/:chatId', protect, chatController.markAsDelivered);

module.exports = router;