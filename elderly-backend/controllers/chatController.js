// backend/controllers/chatController.js
const Chat = require('../models/Chat');
const Message = require('../models/Message');
const ElderlyUser = require('../models/ElderlyUser');
const { cloudinary } = require('../config/cloudinary');

// Get all chats for current user
exports.getUserChats = async (req, res) => {
  try {
    const userId = req.user.id;
    
    const chats = await Chat.find({
      participants: userId
    })
    .populate('participants', 'firstName lastName profilePhoto')
    .populate('lastMessage')
    .sort({ updatedAt: -1 });

    // Get unread counts
    const chatsWithDetails = chats.map(chat => {
      const chatObj = chat.toObject();
      const otherParticipants = chat.participants.filter(
        p => p._id.toString() !== userId
      );
      
      // Get unread count for this user
      const unreadCount = chat.unreadCount?.get(userId) || 0;
      
      return {
        ...chatObj,
        otherParticipants,
        unreadCount,
        isGroupChat: chat.isGroupChat
      };
    });

    res.json({
      success: true,
      chats: chatsWithDetails
    });
  } catch (err) {
    console.error('Get user chats error:', err);
    res.status(500).json({
      success: false,
      message: 'Error fetching chats'
    });
  }
};

// Get or create a chat with another user
exports.getOrCreateChat = async (req, res) => {
  try {
    const currentUserId = req.user.id;
    const { userId } = req.params;

    if (currentUserId === userId) {
      return res.status(400).json({
        success: false,
        message: 'Cannot chat with yourself'
      });
    }

    // Check if user exists
    const otherUser = await ElderlyUser.findById(userId);
    if (!otherUser) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Find existing chat
    let chat = await Chat.findOne({
      participants: { $all: [currentUserId, userId] },
      isGroupChat: false
    }).populate('participants', 'firstName lastName profilePhoto');

    if (!chat) {
      // Create new chat
      chat = await Chat.create({
        participants: [currentUserId, userId],
        unreadCount: new Map([[currentUserId, 0], [userId, 0]])
      });
      
      chat = await Chat.findById(chat._id)
        .populate('participants', 'firstName lastName profilePhoto');
    }

    res.json({
      success: true,
      chat
    });
  } catch (err) {
    console.error('Get or create chat error:', err);
    res.status(500).json({
      success: false,
      message: 'Error creating chat'
    });
  }
};

// Get messages for a chat
exports.getChatMessages = async (req, res) => {
  try {
    const { chatId } = req.params;
    const userId = req.user.id;
    const { page = 1, limit = 50 } = req.query;
    const skip = (page - 1) * limit;

    // Check if user is participant
    const chat = await Chat.findOne({
      _id: chatId,
      participants: userId
    });

    if (!chat) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to view this chat'
      });
    }

    // Get messages
    const messages = await Message.find({
      chat: chatId,
      deletedFor: { $ne: userId }
    })
    .populate('sender', 'firstName lastName profilePhoto')
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(parseInt(limit));

    const total = await Message.countDocuments({
      chat: chatId,
      deletedFor: { $ne: userId }
    });

    // Mark messages as read
    await Message.updateMany(
      {
        chat: chatId,
        sender: { $ne: userId },
        'readBy.user': { $ne: userId }
      },
      {
        $push: { readBy: { user: userId, readAt: new Date() } }
      }
    );

    // Reset unread count for this user
    chat.unreadCount.set(userId, 0);
    await chat.save();

    res.json({
      success: true,
      messages: messages.reverse(),
      total,
      page: parseInt(page),
      pages: Math.ceil(total / limit)
    });
  } catch (err) {
    console.error('Get chat messages error:', err);
    res.status(500).json({
      success: false,
      message: 'Error fetching messages'
    });
  }
};

// Send a text message
exports.sendMessage = async (req, res) => {
  try {
    const { chatId } = req.params;
    const { content } = req.body;
    const userId = req.user.id;

    const chat = await Chat.findOne({
      _id: chatId,
      participants: userId
    });

    if (!chat) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to send message in this chat'
      });
    }

    const message = await Message.create({
      chat: chatId,
      sender: userId,
      content,
      messageType: 'text',
      deliveredTo: [userId]
    });

    const populatedMessage = await Message.findById(message._id)
      .populate('sender', 'firstName lastName profilePhoto');

    // Update chat's last message
    chat.lastMessage = message._id;
    chat.updatedAt = new Date();
    
    // Increment unread count for other participants
    chat.participants.forEach(participantId => {
      if (participantId.toString() !== userId) {
        const currentCount = chat.unreadCount.get(participantId.toString()) || 0;
        chat.unreadCount.set(participantId.toString(), currentCount + 1);
      }
    });
    
    await chat.save();

    res.status(201).json({
      success: true,
      message: populatedMessage
    });
  } catch (err) {
    console.error('Send message error:', err);
    res.status(500).json({
      success: false,
      message: 'Error sending message'
    });
  }
};

// Send a message with media (image, video, voice, file)
exports.sendMediaMessage = async (req, res) => {
  try {
    const { chatId } = req.params;
    const { content, messageType, duration } = req.body;
    const userId = req.user.id;

    const chat = await Chat.findOne({
      _id: chatId,
      participants: userId
    });

    if (!chat) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to send message in this chat'
      });
    }

    let messageData = {
      chat: chatId,
      sender: userId,
      content: content || '',
      messageType: messageType || 'file',
      deliveredTo: [userId]
    };

    // Handle file upload if present
    if (req.file) {
      messageData.mediaUrl = req.file.path;
      messageData.mediaPublicId = req.file.filename;
      
      // Parse duration if it exists and is valid
      let parsedDuration = undefined;
      if (duration && duration !== 'undefined' && duration !== 'null') {
        const numDuration = parseFloat(duration);
        if (!isNaN(numDuration) && numDuration > 0) {
          parsedDuration = numDuration;
        }
      }
      
      // Add to attachments array
      messageData.attachments = [{
        type: messageType,
        url: req.file.path,
        publicId: req.file.filename,
        filename: req.file.originalname,
        size: req.file.size,
        duration: parsedDuration
      }];

      // If it's a voice message, set duration
      if (messageType === 'voice' && parsedDuration) {
        messageData.duration = parsedDuration;
      }
    }

    const message = await Message.create(messageData);

    const populatedMessage = await Message.findById(message._id)
      .populate('sender', 'firstName lastName profilePhoto');

    // Update chat's last message
    chat.lastMessage = message._id;
    chat.updatedAt = new Date();
    
    // Increment unread count for other participants
    chat.participants.forEach(participantId => {
      if (participantId.toString() !== userId) {
        const currentCount = chat.unreadCount.get(participantId.toString()) || 0;
        chat.unreadCount.set(participantId.toString(), currentCount + 1);
      }
    });
    
    await chat.save();

    res.status(201).json({
      success: true,
      message: populatedMessage
    });
  } catch (err) {
    console.error('Send media message error:', err);
    res.status(500).json({
      success: false,
      message: 'Error sending message',
      error: err.message
    });
  }
};
// Delete a message
exports.deleteMessage = async (req, res) => {
  try {
    const { messageId } = req.params;
    const userId = req.user.id;

    const message = await Message.findById(messageId);
    if (!message) {
      return res.status(404).json({
        success: false,
        message: 'Message not found'
      });
    }

    // Check if user is sender
    if (message.sender.toString() === userId) {
      // Soft delete for everyone
      message.isDeleted = true;
    } else {
      // Delete only for this user
      message.deletedFor.push(userId);
    }

    await message.save();

    res.json({
      success: true,
      message: 'Message deleted'
    });
  } catch (err) {
    console.error('Delete message error:', err);
    res.status(500).json({
      success: false,
      message: 'Error deleting message'
    });
  }
};

// Mark messages as delivered
exports.markAsDelivered = async (req, res) => {
  try {
    const { chatId } = req.params;
    const userId = req.user.id;

    await Message.updateMany(
      {
        chat: chatId,
        sender: { $ne: userId },
        deliveredTo: { $ne: userId }
      },
      {
        $push: { deliveredTo: userId }
      }
    );

    res.json({
      success: true,
      message: 'Messages marked as delivered'
    });
  } catch (err) {
    console.error('Mark as delivered error:', err);
    res.status(500).json({
      success: false,
      message: 'Error marking messages as delivered'
    });
  }
};

// Delete media from Cloudinary (optional - for cleanup)
exports.deleteMedia = async (req, res) => {
  try {
    const { publicId } = req.params;
    const userId = req.user.id;

    // Verify the user owns this media
    const message = await Message.findOne({
      'attachments.publicId': publicId,
      sender: userId
    });

    if (!message) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to delete this media'
      });
    }

    // Delete from Cloudinary
    const result = await cloudinary.uploader.destroy(publicId);

    res.json({
      success: true,
      message: 'Media deleted successfully',
      result
    });
  } catch (err) {
    console.error('Delete media error:', err);
    res.status(500).json({
      success: false,
      message: 'Error deleting media'
    });
  }
};