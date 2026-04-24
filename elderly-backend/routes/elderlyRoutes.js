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
router.get("/me", protect, elderlyController.getCurrentUser);
router.get("/profile/:id", protect, elderlyController.getElderlyProfile);
router.put("/profile/:id", protect, elderlyController.updateElderlyProfile);
router.post("/profile/:id/photo", protect, uploadProfilePhoto.single('profilePhoto'), elderlyController.uploadProfilePhoto);
router.post("/profile/:id/cover", protect, uploadCoverPhoto.single('coverPhoto'), elderlyController.uploadCoverPhoto);
router.delete("/profile/:id/cover", protect, elderlyController.removeCoverPhoto);


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

// Add these to your elderlyRoutes.js

// DELETE user
router.delete("/profile/:id", protect, elderlyController.deleteElderlyUser);

// Get single user
router.get("/user/:id", protect, elderlyController.getUserById);

// Toggle user status
router.put("/user/:id/status", protect, elderlyController.toggleUserStatus);

// Get all posts (admin version - no filters)
router.get("/posts/all", protect, elderlyController.getAllPostsAdmin);
// Add these imports at the top
const session = require('express-session');
const { passport, generateToken } = require('../middleware/googleAuth');

// Add session middleware before passport (only for OAuth routes)
router.use(
  session({
    secret: process.env.SESSION_SECRET || 'eldercare_session_secret',
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: process.env.NODE_ENV === 'production',
      maxAge: 24 * 60 * 60 * 1000, // 24 hours
    },
  })
);

// Initialize passport
router.use(passport.initialize());
router.use(passport.session());

// Google OAuth routes
router.get(
  '/google',
  passport.authenticate('google', {
    scope: ['profile', 'email'],
    prompt: 'select_account',
  })
);

router.get(
  '/google/callback',
  passport.authenticate('google', {
    failureRedirect: 'http://localhost:5173/login?error=google_auth_failed',
    session: true,
  }),
  elderlyController.googleAuthSuccess
);

// Add this route to your existing routes
router.get('/user/google/:googleId', protect, elderlyController.getUserByGoogleId);

module.exports = router;