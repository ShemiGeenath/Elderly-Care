// models/Report.js
const mongoose = require("mongoose");

const ReportSchema = new mongoose.Schema(
  {
    reporter: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "ElderlyUser",
      required: true
    },
    reportedItem: {
      type: mongoose.Schema.Types.ObjectId,
      required: true
    },
    reportedItemType: {
      type: String,
      enum: ['post', 'comment', 'user'],
      required: true
    },
    reason: {
      type: String,
      required: true
    },
    description: String,
    status: {
      type: String,
      enum: ['pending', 'reviewing', 'resolved', 'dismissed'],
      default: 'pending'
    },
    assignedTo: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "AdminUser"
    },
    resolution: String,
    resolvedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "AdminUser"
    },
    resolvedAt: Date
  },
  { timestamps: true }
);

module.exports = mongoose.model("Report", ReportSchema);