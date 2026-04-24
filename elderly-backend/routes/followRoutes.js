// routes/followRoutes.js
const express = require("express");
const router = express.Router();
const followController = require("../controllers/followController");
const protect = require("../middleware/authMiddleware");

// Follow/Unfollow routes
router.post("/follow/:userId", protect, followController.followUser);
router.delete("/unfollow/:userId", protect, followController.unfollowUser);

// Get followers/following lists
router.get("/followers/:userId", protect, followController.getFollowers);
router.get("/following/:userId", protect, followController.getFollowing);

// Check follow status
router.get("/status/:userId", protect, followController.checkFollowStatus);

// Get feed posts (from followed users)
router.get("/feed", protect, followController.getFeedPosts);

module.exports = router;