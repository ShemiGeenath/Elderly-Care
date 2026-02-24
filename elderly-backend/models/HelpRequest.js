// models/HelpRequest.js
const mongoose = require("mongoose");

const HelpRequestSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "ElderlyUser",
      required: true,
    },
    type: {
      type: String,
      enum: ["food", "medicine", "transport", "errands", "companionship", "household", "other"],
      required: true,
    },
    title: {
      type: String,
      required: true,
    },
    description: {
      type: String,
      required: true,
    },
    location: {
      type: String,
      required: true,
    },
    urgency: {
      type: String,
      enum: ["low", "medium", "high", "urgent"],
      default: "medium",
    },
    status: {
      type: String,
      enum: ["pending", "accepted", "in_progress", "completed", "cancelled"],
      default: "pending",
    },
    volunteer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "ElderlyUser",
    },
    assignedAt: Date,
    completedAt: Date,
    scheduledDate: Date,
    estimatedHours: Number,
    itemsOffered: [{
      name: String,
      quantity: String,
      description: String,
    }],
    itemsNeeded: [{
      name: String,
      quantity: String,
      description: String,
    }],
    photos: [String],
    tags: [String],
  },
  { timestamps: true }
);

module.exports = mongoose.model("HelpRequest", HelpRequestSchema);