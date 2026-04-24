// routes/sosRoutes.js
const express = require("express");
const router = express.Router();
const sosController = require("../controllers/sosController");
const protect = require("../middleware/authMiddleware");

// Send SOS alert
router.post("/send", protect, sosController.sendSOS);

// Get SOS history
router.get("/history", protect, sosController.getSOSHistory);
router.get("/check-creds", protect, sosController.checkCredentials);

// Test endpoint
router.get("/test", protect, sosController.testTwilio);

module.exports = router;