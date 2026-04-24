// routes/adminDataRoutes.js
const express = require("express");
const router = express.Router();
const ElderlyUser = require("../models/ElderlyUser");
const Post = require("../models/Post");
const Chat = require("../models/Chat");
const Message = require("../models/Message");
const SOSLog = require("../models/SOSLog"); // Note: Using SOSLog instead of SOSAlert
const HelpRequest = require("../models/HelpRequest");
const fs = require('fs');
const path = require('path');
const os = require('os');
const axios = require('axios');

// Get system stats
router.get("/stats", async (req, res) => {
  try {
    const totalUsers = await ElderlyUser.countDocuments();
    const totalPosts = await Post.countDocuments();
    const totalChats = await Chat.countDocuments();
    const totalMessages = await Message.countDocuments();
    const totalSOS = await SOSLog.countDocuments(); // Using SOSLog
    const totalHelpRequests = await HelpRequest.countDocuments();

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const usersToday = await ElderlyUser.countDocuments({
      createdAt: { $gte: today }
    });

    const postsToday = await Post.countDocuments({
      createdAt: { $gte: today }
    });

    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);
    const activeUsers = await Post.distinct('user', {
      createdAt: { $gte: weekAgo }
    }).then(users => users.length);

    const systemInfo = {
      nodeVersion: process.version,
      platform: process.platform,
      memory: process.memoryUsage(),
      uptime: process.uptime(),
      cpuCount: os.cpus().length,
      loadAverage: os.loadavg(),
      freeMemory: os.freemem(),
      totalMemory: os.totalmem()
    };

    res.json({
      success: true,
      stats: {
        users: {
          total: totalUsers,
          today: usersToday,
          active: activeUsers
        },
        content: {
          posts: totalPosts,
          postsToday: postsToday,
          chats: totalChats,
          messages: totalMessages
        },
        emergency: {
          sos: totalSOS,
          helpRequests: totalHelpRequests
        },
        system: systemInfo
      }
    });
  } catch (error) {
    console.error("Error:", error);
    res.status(500).json({ success: false, message: "Error fetching stats" });
  }
});

// Get all users
router.get("/users", async (req, res) => {
  try {
    const users = await ElderlyUser.find({}).select('-password').sort({ createdAt: -1 });
    
    const usersWithStats = await Promise.all(users.map(async (user) => {
      const postCount = await Post.countDocuments({ user: user._id });
      const chatCount = await Chat.countDocuments({ participants: user._id });
      return {
        ...user.toObject(),
        stats: { posts: postCount, chats: chatCount }
      };
    }));

    res.json({ success: true, users: usersWithStats });
  } catch (error) {
    res.status(500).json({ success: false, message: "Error fetching users" });
  }
});

// Get all posts
router.get("/posts", async (req, res) => {
  try {
    const posts = await Post.find({})
      .populate('user', 'firstName lastName email profilePhoto')
      .populate('comments.user', 'firstName lastName')
      .sort({ createdAt: -1 });

    res.json({ success: true, posts });
  } catch (error) {
    res.status(500).json({ success: false, message: "Error fetching posts" });
  }
});

// Get SOS alerts (using SOSLog)
router.get("/sos", async (req, res) => {
  try {
    const alerts = await SOSLog.find({})
      .populate('user', 'firstName lastName email phone emergencyContact')
      .sort({ createdAt: -1 });

    res.json({ success: true, alerts });
  } catch (error) {
    res.status(500).json({ success: false, message: "Error fetching SOS alerts" });
  }
});

// Get help requests
router.get("/help-requests", async (req, res) => {
  try {
    const requests = await HelpRequest.find({})
      .populate('user', 'firstName lastName email')
      .populate('volunteer', 'firstName lastName email')
      .sort({ createdAt: -1 });

    res.json({ success: true, requests });
  } catch (error) {
    res.status(500).json({ success: false, message: "Error fetching help requests" });
  }
});

// Get chat analytics
router.get("/chat-analytics", async (req, res) => {
  try {
    const chats = await Chat.find({})
      .populate('participants', 'firstName lastName')
      .populate('lastMessage')
      .sort({ updatedAt: -1 });

    const totalMessages = await Message.countDocuments();
    
    const messagesPerDay = [];
    for (let i = 6; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      date.setHours(0, 0, 0, 0);
      
      const nextDate = new Date(date);
      nextDate.setDate(nextDate.getDate() + 1);
      
      const count = await Message.countDocuments({
        createdAt: { $gte: date, $lt: nextDate }
      });
      
      messagesPerDay.push({
        date: date.toISOString().split('T')[0],
        count
      });
    }

    res.json({
      success: true,
      chats: {
        total: chats.length,
        active: chats.filter(c => c.lastMessage).length,
        list: chats
      },
      messages: {
        total: totalMessages,
        perDay: messagesPerDay
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: "Error fetching chat analytics" });
  }
});

// Get logs
router.get("/logs", async (req, res) => {
  try {
    const logType = req.query.type || 'all';
    const lines = parseInt(req.query.lines) || 100;
    
    const logs = [];
    
    const readLogFile = (filePath) => {
      try {
        if (fs.existsSync(filePath)) {
          const content = fs.readFileSync(filePath, 'utf8');
          return content.split('\n').slice(-lines).filter(line => line.trim());
        }
      } catch (err) {
        console.error(`Error reading ${filePath}:`, err);
      }
      return [];
    };

    const logsDir = path.join(__dirname, '../logs');
    const logPaths = {
      error: path.join(logsDir, 'error.log'),
      combined: path.join(logsDir, 'combined.log'),
      access: path.join(logsDir, 'access.log')
    };

    if (logType === 'all' || logType === 'error') {
      logs.push(...readLogFile(logPaths.error).map(line => ({ type: 'error', message: line })));
    }
    if (logType === 'all' || logType === 'combined') {
      logs.push(...readLogFile(logPaths.combined).map(line => ({ type: 'info', message: line })));
    }
    if (logType === 'all' || logType === 'access') {
      logs.push(...readLogFile(logPaths.access).map(line => ({ type: 'access', message: line })));
    }

    res.json({ success: true, logs: logs.slice(0, lines) });
  } catch (error) {
    res.status(500).json({ success: false, message: "Error fetching logs" });
  }
});

// Get NLP status
router.get("/nlp-status", async (req, res) => {
  try {
    const pythonServiceUrl = process.env.PYTHON_SERVICE_URL || 'http://localhost:5001';
    
    let nlpStatus = 'stopped';
    let nlpInfo = null;
    
    try {
      const response = await axios.get(`${pythonServiceUrl}/api/status`, { timeout: 3000 });
      if (response.data) {
        nlpStatus = 'running';
        nlpInfo = response.data;
      }
    } catch (error) {
      console.log('NLP service not reachable');
    }

    res.json({
      success: true,
      nlp: {
        status: nlpStatus,
        info: nlpInfo,
        url: pythonServiceUrl
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: "Error checking NLP service" });
  }
});

module.exports = router;