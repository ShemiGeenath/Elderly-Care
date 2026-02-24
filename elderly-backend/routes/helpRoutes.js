const express = require("express");
const router = express.Router();
const helpController = require("../controllers/helpController");
const protect = require("../middleware/authMiddleware");

// ================= HELP REQUESTS =================
// Create new help request
router.post("/help-requests", protect, helpController.createHelpRequest);

// Get all help requests (with filters) - KEEP EXISTING
router.get("/help-requests", protect, helpController.getAllHelpRequests);

// NEW: Get public help requests for volunteers (with filters)
router.get("/help-requests/public", protect, helpController.getPublicHelpRequests);

// Get my help requests
router.get("/help-requests/my", protect, helpController.getMyHelpRequests);

// Get help requests I'm volunteering for
router.get("/help-requests/volunteering", protect, helpController.getMyVolunteering);

// NEW: Get single help request by ID
router.get("/help-requests/:id", protect, helpController.getHelpRequestById);

// Accept a help request (volunteer)
router.put("/help-requests/:id/accept", protect, helpController.acceptHelpRequest);

// Update help request status (in_progress, completed)
router.put("/help-requests/:id/status", protect, helpController.updateHelpRequestStatus);

// NEW: Update help request (owner only, pending requests)
router.put("/help-requests/:id", protect, helpController.updateHelpRequest);

// NEW: Cancel help request (owner or volunteer)
router.put("/help-requests/:id/cancel", protect, helpController.cancelHelpRequest);

// NEW: Delete help request (owner only, pending requests)
router.delete("/help-requests/:id", protect, helpController.deleteHelpRequest);

// ================= ITEM EXCHANGE =================
router.post("/items", protect, helpController.createItemListing);
router.get("/items", protect, helpController.getAllItemListings);
router.get("/items/user/me", protect, helpController.getMyItemListings);
router.put("/items/:id/reserve", protect, helpController.reserveItem);
router.put("/items/:id/complete", protect, helpController.completeItemExchange);

// ================= DASHBOARD =================
router.get("/nearby-opportunities", protect, helpController.getNearbyOpportunities);

module.exports = router;