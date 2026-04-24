const mongoose = require("mongoose");

const ActivityLogSchema = new mongoose.Schema({
  admin: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Admin',
    required: true
  },
  action: {
    type: String,
    required: true,
    enum: ['CREATE', 'UPDATE', 'DELETE', 'VIEW', 'LOGIN', 'LOGOUT', 'EXPORT']
  },
  targetType: {
    type: String,
    enum: ['user', 'post', 'report', 'admin', 'settings', 'sos', 'chat'],
    required: true
  },
  targetId: mongoose.Schema.Types.ObjectId,
  details: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  },
  ipAddress: String,
  userAgent: String,
  timestamp: {
    type: Date,
    default: Date.now
  }
});

// Index for faster queries
ActivityLogSchema.index({ admin: 1, timestamp: -1 });
ActivityLogSchema.index({ targetType: 1, targetId: 1 });
ActivityLogSchema.index({ timestamp: -1 });

module.exports = mongoose.model("ActivityLog", ActivityLogSchema);