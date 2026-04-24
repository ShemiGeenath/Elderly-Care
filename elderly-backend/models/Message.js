// backend/models/Message.js
const mongoose = require('mongoose');

const MessageSchema = new mongoose.Schema({
  chat: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Chat',
    required: true
  },
  sender: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'ElderlyUser',
    required: true
  },
  content: {
    type: String,
    default: ''
  },
  messageType: {
    type: String,
    enum: ['text', 'image', 'video', 'voice', 'file'],
    default: 'text'
  },
  mediaUrl: {
    type: String
  },
  mediaPublicId: {
    type: String // For Cloudinary
  },
  duration: {
    type: Number // For voice messages (in seconds)
  },
  attachments: [{
    type: {
      type: String,
      enum: ['image', 'video', 'file', 'voice']
    },
    url: String,
    publicId: String,
    filename: String,
    size: Number,
    duration: Number // For voice/video
  }],
  readBy: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'ElderlyUser'
    },
    readAt: {
      type: Date,
      default: Date.now
    }
  }],
  deliveredTo: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'ElderlyUser'
  }],
  isDeleted: {
    type: Boolean,
    default: false
  },
  deletedFor: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'ElderlyUser'
  }]
}, {
  timestamps: true
});

module.exports = mongoose.model('Message', MessageSchema);