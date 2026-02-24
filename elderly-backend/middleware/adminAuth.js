// middleware/adminAuth.js
const jwt = require("jsonwebtoken");
const AdminUser = require("../models/Admin");

const adminAuth = async (req, res, next) => {
  try {
    // Get token from header
    const token = req.header("Authorization")?.replace("Bearer ", "");
    
    if (!token) {
      return res.status(401).json({
        success: false,
        message: "No authentication token, access denied"
      });
    }

    // Verify token
    const decoded = jwt.verify(
      token,
      process.env.JWT_ADMIN_SECRET || "admin_secret_key"
    );

    // Check if token is admin type
    if (decoded.type !== 'admin') {
      return res.status(401).json({
        success: false,
        message: "Invalid token type"
      });
    }

    // Find admin user
    const admin = await AdminUser.findById(decoded.id).select("-password");
    
    if (!admin) {
      return res.status(401).json({
        success: false,
        message: "Admin not found"
      });
    }

    // Check if admin is active
    if (!admin.isActive) {
      return res.status(401).json({
        success: false,
        message: "Admin account is deactivated"
      });
    }

    // Attach admin to request
    req.admin = admin;
    next();
  } catch (error) {
    console.error("Admin auth error:", error);
    res.status(401).json({
      success: false,
      message: "Token is not valid"
    });
  }
};

// Middleware to check admin role
const requireRole = (...roles) => {
  return (req, res, next) => {
    if (!req.admin) {
      return res.status(401).json({
        success: false,
        message: "Authentication required"
      });
    }

    if (!roles.includes(req.admin.role)) {
      return res.status(403).json({
        success: false,
        message: "Insufficient permissions"
      });
    }

    next();
  };
};

module.exports = { adminAuth, requireRole };