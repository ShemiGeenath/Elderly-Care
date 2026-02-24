// routes/elderlyRoutes.js
const express = require("express");
const router = express.Router();
const elderlyController = require("../controllers/elderlyController");
const protect = require("../middleware/authMiddleware");
const { uploadProfilePhoto, uploadCoverPhoto, uploadPostMedia } = require("../config/cloudinary");

/* ================= REGISTER ================= */
router.post("/register", elderlyController.registerElderly);

/* ================= LOGIN ================= */
router.post("/login", elderlyController.loginElderly);

/* ================= PROFILE ================= */
router.get("/profile/:id", protect, elderlyController.getElderlyProfile);
router.put("/profile/:id", protect, elderlyController.updateElderlyProfile);
router.post("/profile/:id/photo", protect, uploadProfilePhoto.single('profilePhoto'), elderlyController.uploadProfilePhoto);
router.post("/profile/:id/cover", protect, uploadCoverPhoto.single('coverPhoto'), elderlyController.uploadCoverPhoto);
router.delete("/profile/:id/cover", protect, elderlyController.removeCoverPhoto);
router.get("/me", protect, elderlyController.getCurrentUser);

/* ================= POSTS ================= */
router.post("/posts", protect, uploadPostMedia.single('media'), elderlyController.createPost);
router.get("/posts", protect, elderlyController.getAllPosts);
router.get("/posts/user/:id", protect, elderlyController.getUserPosts);
router.get("/posts/:id", protect, elderlyController.getPostById);
router.put("/posts/:id", protect, elderlyController.editPost);
router.delete("/posts/:id", protect, elderlyController.deletePost);
router.post("/posts/:postId/like", protect, elderlyController.likePost);
router.post("/posts/:postId/comment", protect, elderlyController.addComment);
router.post("/posts/:id/share", protect, elderlyController.sharePost);

/* ================= FRIENDS/COMMUNITY ================= */
router.get("/users/all", protect, elderlyController.getAllUsers);
router.get("/users/search", protect, elderlyController.searchUsers);
router.get("/users/suggested/nlp", protect, elderlyController.getNLPSuggestedFriends);
router.get("/users/suggested", protect, elderlyController.getSuggestedFriends);

module.exports = router;