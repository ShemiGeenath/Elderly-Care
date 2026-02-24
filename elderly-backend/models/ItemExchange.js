// models/ItemExchange.js
const mongoose = require("mongoose");

const ItemExchangeSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "ElderlyUser",
      required: true,
    },
    type: {
      type: String,
      enum: ["give", "need"],
      required: true,
    },
    category: {
      type: String,
      enum: ["furniture", "clothing", "medical", "food", "books", "electronics", "other"],
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
    condition: {
      type: String,
      enum: ["new", "like_new", "good", "fair", "poor"],
      default: "good",
    },
    status: {
      type: String,
      enum: ["available", "reserved", "given", "received", "cancelled"],
      default: "available",
    },
    receiver: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "ElderlyUser",
    },
    quantity: String,
    photos: [String],
    tags: [String],
    expiryDate: Date, // For perishable items
    pickupLocation: String,
    contactMethod: String,
  },
  { timestamps: true }
);

module.exports = mongoose.model("ItemExchange", ItemExchangeSchema);