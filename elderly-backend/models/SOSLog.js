const mongoose = require("mongoose");

const SOSLogSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "ElderlyUser",
      required: true
    },
    timestamp: {
      type: Date,
      default: Date.now
    },
    location: {
      lat: Number,
      lng: Number,
      address: String
    },
    message: String,
    results: [{
      method: String,
      success: Boolean,
      recipient: String,
      provider: String,
      messageId: String,
      error: String
    }],
    status: {
      type: String,
      enum: ['sent', 'failed', 'partial'],
      default: 'sent'
    }
  },
  { timestamps: true }
);

module.exports = mongoose.model("SOSLog", SOSLogSchema);