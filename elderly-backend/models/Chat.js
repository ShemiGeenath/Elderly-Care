// backend/models/Chat.js
const mongoose = require('mongoose');

const ChatSchema = new mongoose.Schema({
  participants: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'ElderlyUser',
    required: true
  }],
  lastMessage: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Message'
  },
  unreadCount: {
    type: Map,
    of: Number,
    default: new Map()
  },
  isGroupChat: {
    type: Boolean,
    default: false
  },
  groupName: String,
  groupAvatar: String,
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Ensure unique chat for two participants (for 1-on-1 chats)
ChatSchema.index({ participants: 1 }, { unique: true, partialFilterExpression: { isGroupChat: false } });

module.exports = mongoose.model('Chat', ChatSchema);