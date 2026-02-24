// middleware/authMiddleware.js
const jwt = require("jsonwebtoken");
const ElderlyUser = require("../models/ElderlyUser");

const protect = async (req, res, next) => {
  try {
    // Get token from header
    const token = req.headers.authorization?.split(" ")[1];

    if (!token) {
      return res.status(401).json({ 
        success: false,
        message: "No token provided, authorization denied" 
      });
    }

    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET || "your_secret_key");
    
    // Get full user data from database (not just the decoded token)
    const user = await ElderlyUser.findById(decoded.id).select("-password");
    
    if (!user) {
      return res.status(401).json({ 
        success: false,
        message: "User not found" 
      });
    }

    // Attach full user object to request
    req.user = user;
    next();
  } catch (error) {
    console.error("Auth middleware error:", error);
    
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({ 
        success: false,
        message: "Invalid token" 
      });
    }
    
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ 
        success: false,
        message: "Token expired, please login again" 
      });
    }
    
    return res.status(500).json({ 
      success: false,
      message: "Server error" 
    });
  }
};

module.exports = protect;