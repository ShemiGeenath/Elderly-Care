// adminRoutes.js

const express = require("express");
const router = express.Router();
const { 
  adminLogin,
  getAdminProfile,
  getAllUsers,
  getUserDetails,
  updateUserStatus,
  getAllPosts,
  deletePost,
  getDashboardStats,
  getAllReports,
  updateReportStatus,
  createInitialAdmin
} = require("../controllers/adminController");
const { adminAuth, requireRole } = require("../middleware/adminAuth");

// Public routes
router.post("/login", adminLogin);
router.post("/init", createInitialAdmin);

// Protected routes - all routes below require authentication
router.use(adminAuth);

// Profile management
router.get("/profile", getAdminProfile);

// Dashboard
router.get("/dashboard/stats", getDashboardStats);

// User management
router.get("/users", getAllUsers);
router.get("/users/:id", getUserDetails);
router.put("/users/:id/status", updateUserStatus);

// Post management
router.get("/posts", getAllPosts);
router.delete("/posts/:id", deletePost);

// Report management
router.get("/reports", getAllReports);
router.put("/reports/:id/status", updateReportStatus);

module.exports = router;