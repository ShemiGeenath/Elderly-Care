// routes/adminRoutes.js
const express = require("express");
const router = express.Router();
const { 
  adminLogin,
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
router.post("/init", createInitialAdmin); // Remove this after first use

// Protected routes
router.use(adminAuth);

// Dashboard
router.get("/dashboard/stats", getDashboardStats);

// User management
router.get("/users", getAllUsers);
router.get("/users/:id", getUserDetails);
router.put("/users/:id/status", requireRole('super_admin', 'admin'), updateUserStatus);

// Post management
router.get("/posts", getAllPosts);
router.delete("/posts/:id", requireRole('super_admin', 'admin'), deletePost);

// Report management
router.get("/reports", getAllReports);
router.put("/reports/:id/status", updateReportStatus);

module.exports = router;