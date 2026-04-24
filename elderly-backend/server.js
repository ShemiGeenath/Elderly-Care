// server.js (updated with chat routes)
const express = require("express");
const cors = require("cors");
const path = require("path");
const http = require('http');
const socketIo = require('socket.io');
require("dotenv").config();

// Add logger
const logger = require("./utils/logger");

console.log("========== ENVIRONMENT CHECK ==========");
console.log("Current directory:", __dirname);
console.log("TWILIO_ACCOUNT_SID:", process.env.TWILIO_ACCOUNT_SID ? "✅ Loaded" : "❌ NOT LOADED");
console.log("========================================");

const connectDB = require("./config/db");
const elderlyRoutes = require("./routes/elderlyRoutes");
const helpRoutes = require("./routes/helpRoutes");
const adminRoutes = require("./routes/adminRoutes");
const sosRoutes = require("./routes/sosRoutes");
const adminDataRoutes = require("./routes/adminDataRoutes");
const followRoutes = require("./routes/followRoutes");
const chatRoutes = require("./routes/chatRoutes"); // Add this
const session = require('express-session');

const app = express();
const server = http.createServer(app);

// CORS configuration
const io = socketIo(server, {
  cors: {
    origin: ["http://localhost:5173", "http://localhost:5174", "http://localhost:3000"],
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    credentials: true,
    allowedHeaders: ["Content-Type", "Authorization"]
  }
});

// CORS for Express
app.use(cors({
  origin: ["http://localhost:5173", "http://localhost:5174", "http://localhost:3000"],
  credentials: true,
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"]
}));

// Logging middleware
app.use((req, res, next) => {
  logger.access(`${req.method} ${req.url} - ${req.ip}`);
  next();
});

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static files
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Connect DB
connectDB();

// Socket.io setup (simplified for now)
io.on('connection', (socket) => {
  console.log('New client connected');
});

// Make io accessible
app.set('io', io);

// ✅ IMPORTANT: Register ALL routes in the correct order
app.use("/api/admin-data", require("./routes/adminDataRoutes"));
app.use("/api/admin-data", adminDataRoutes);
app.use("/api/elderly", elderlyRoutes);
app.use("/api/help", helpRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/sos", sosRoutes);
app.use("/api/follow", followRoutes);
app.use("/api/chat", chatRoutes); // Add this - THIS IS THE KEY FIX

// Test route
app.get("/", (req, res) => {
  res.json({ 
    message: "Eldercare API Running",
    endpoints: {
      "admin-data": "/api/admin-data/stats, /api/admin-data/users, /api/admin-data/posts",
      elderly: "/api/elderly",
      help: "/api/help",
      admin: "/api/admin",
      sos: "/api/sos",
      follow: "/api/follow",
      chat: "/api/chat/chats, /api/chat/chat/:userId, /api/chat/messages/:chatId" // Add this
    }
  });
});

app.use(session({
  secret: process.env.SESSION_SECRET || 'eldercare_session_secret',
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: process.env.NODE_ENV === 'production',
    maxAge: 24 * 60 * 60 * 1000,
    httpOnly: true,
    sameSite: 'lax'
  }
}));

// 404 handler
app.use((req, res) => {
  logger.error(`404 - Route not found: ${req.method} ${req.url}`);
  res.status(404).json({ 
    success: false, 
    message: `Route not found: ${req.method} ${req.url}` 
  });
});

// Error handler
app.use((err, req, res, next) => {
  logger.error(`Server error: ${err.message}`);
  console.error("Server error:", err);
  res.status(500).json({ 
    success: false, 
    message: "Internal server error" 
  });
});
// In your backend routes file (e.g., server.js or adminRoutes.js)
app.get('/api/test-admin', (req, res) => {
  res.json({ 
    success: true, 
    message: 'Backend is running',
    timestamp: new Date().toISOString()
  });
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, () =>
  console.log(`🚀 Server running on http://localhost:${PORT}`)
);