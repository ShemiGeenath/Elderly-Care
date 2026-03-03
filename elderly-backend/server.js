// backend/server.js - Update with socket.io
const express = require("express");
const cors = require("cors");
const path = require("path");
const http = require('http');
const socketIo = require('socket.io');
require("dotenv").config();

const connectDB = require("./config/db");
const elderlyRoutes = require("./routes/elderlyRoutes");
const helpRoutes = require("./routes/helpRoutes");
const chatRoutes = require("./routes/chatRoutes");
const adminRoutes = require("./routes/adminRoutes");

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: ["http://localhost:5173", "http://localhost:3000"],
    methods: ["GET", "POST", "PUT", "DELETE"],
    credentials: true
  }
});

// Middleware
app.use(cors({
  origin: ["http://localhost:5173", "http://localhost:3000"],
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static files
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Connect DB
connectDB();

// Socket.io middleware for authentication
io.use((socket, next) => {
  const token = socket.handshake.auth.token;
  if (!token) {
    return next(new Error('Authentication error'));
  }
  
  try {
    const jwt = require('jsonwebtoken');
    const decoded = jwt.verify(token, process.env.JWT_SECRET || "your_secret_key");
    socket.userId = decoded.id;
    next();
  } catch (err) {
    next(new Error('Authentication error'));
  }
});

// Socket.io connection handling
const userSockets = new Map();

io.on('connection', (socket) => {
  console.log('New client connected:', socket.userId);
  userSockets.set(socket.userId, socket.id);

  // Join user to their personal room
  socket.join(socket.userId);

  // Handle joining a chat room
  socket.on('join-chat', (chatId) => {
    socket.join(chatId);
    console.log(`User ${socket.userId} joined chat ${chatId}`);
  });

  // Handle leaving a chat room
  socket.on('leave-chat', (chatId) => {
    socket.leave(chatId);
  });

  // Handle sending a message
  socket.on('send-message', async (data) => {
    try {
      const { chatId, message } = data;
      
      // Broadcast to all users in the chat room
      io.to(chatId).emit('new-message', {
        ...message,
        chatId
      });

      // Send notifications to offline users
      const Message = require('./models/Message');
      const Chat = require('./models/Chat');
      
      const chat = await Chat.findById(chatId).populate('participants');
      
      chat.participants.forEach(participant => {
        if (participant._id.toString() !== socket.userId) {
          const participantSocketId = userSockets.get(participant._id.toString());
          if (!participantSocketId) {
            // User is offline - send push notification (implement later)
            console.log(`User ${participant._id} is offline`);
          }
        }
      });
    } catch (err) {
      console.error('Socket message error:', err);
    }
  });

  // Handle typing indicators
  socket.on('typing', ({ chatId, isTyping }) => {
    socket.to(chatId).emit('user-typing', {
      userId: socket.userId,
      isTyping
    });
  });

  // Handle read receipts
  socket.on('mark-read', async ({ chatId, messageIds }) => {
    try {
      const Message = require('./models/Message');
      
      await Message.updateMany(
        {
          _id: { $in: messageIds },
          'readBy.user': { $ne: socket.userId }
        },
        {
          $push: { readBy: { user: socket.userId, readAt: new Date() } }
        }
      );

      // Notify other participants
      socket.to(chatId).emit('messages-read', {
        userId: socket.userId,
        messageIds
      });
    } catch (err) {
      console.error('Mark read error:', err);
    }
  });

  // Handle disconnection
  socket.on('disconnect', () => {
    console.log('Client disconnected:', socket.userId);
    userSockets.delete(socket.userId);
  });
});

// Make io accessible to routes
app.set('io', io);

// Routes
app.use("/api/elderly", elderlyRoutes);
app.use("/api/help", helpRoutes);
app.use("/api/chat", chatRoutes);
app.use("/api/admin", adminRoutes);

// Test route
app.get("/", (req, res) => {
  res.json({ 
    message: "Eldercare API Running",
    endpoints: {
      elderly: "/api/elderly",
      help: "/api/help",
      chat: "/api/chat"
    }
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ 
    success: false, 
    message: "Route not found" 
  });
});

// Error handler
app.use((err, req, res, next) => {
  console.error("Server error:", err);
  res.status(500).json({ 
    success: false, 
    message: "Internal server error" 
  });
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, () =>
  console.log(`🚀 Server running on http://localhost:${PORT}`)
);

// Add this TEMPORARY route to server.js - PUT THIS BEFORE OTHER ROUTES
app.post('/api/create-admin-now', async (req, res) => {
  try {
    const mongoose = require('mongoose');
    const bcrypt = require('bcryptjs');
    
    const db = mongoose.connection.db;
    const collection = db.collection('admins');
    
    // Check if admin exists
    const existingAdmin = await collection.findOne({ username: 'admin' });
    if (existingAdmin) {
      return res.json({ 
        success: false, 
        message: 'Admin already exists',
        admin: {
          username: existingAdmin.username,
          email: existingAdmin.email
        }
      });
    }

    // Hash password
    const salt = bcrypt.genSaltSync(10);
    const hashedPassword = bcrypt.hashSync('admin123', salt);

    // Create admin
    const admin = {
      username: 'admin',
      email: 'admin@elderlycommunity.com',
      password: hashedPassword,
      fullName: 'System Administrator',
      role: 'super_admin',
      permissions: [
        { module: 'users', canView: true, canCreate: true, canEdit: true, canDelete: true },
        { module: 'posts', canView: true, canCreate: true, canEdit: true, canDelete: true },
        { module: 'reports', canView: true, canCreate: true, canEdit: true, canDelete: true },
        { module: 'analytics', canView: true, canCreate: false, canEdit: false, canDelete: false },
        { module: 'settings', canView: true, canCreate: true, canEdit: true, canDelete: true }
      ],
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    await collection.insertOne(admin);
    
    res.json({
      success: true,
      message: 'Admin created successfully',
      credentials: {
        username: 'admin',
        password: 'admin123'
      }
    });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
});