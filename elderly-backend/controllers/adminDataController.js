// controllers/adminDataController.js
const ElderlyUser = require("../models/ElderlyUser");
const Post = require("../models/Post");
const Chat = require("../models/Chat");
const Message = require("../models/Message");
const SOSAlert = require("../models/SOSAlert");
const HelpRequest = require("../models/HelpRequest");
const fs = require('fs');
const path = require('path');
const os = require('os');

// Get system stats and logs
exports.getSystemStats = async (req, res) => {
  try {
    // Get counts from database
    const totalUsers = await ElderlyUser.countDocuments();
    const totalPosts = await Post.countDocuments();
    const totalChats = await Chat.countDocuments();
    const totalMessages = await Message.countDocuments();
    const totalSOS = await SOSAlert.countDocuments();
    const totalHelpRequests = await HelpRequest.countDocuments();

    // Get users registered today
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const usersToday = await ElderlyUser.countDocuments({
      createdAt: { $gte: today }
    });

    // Get posts created today
    const postsToday = await Post.countDocuments({
      createdAt: { $gte: today }
    });

    // Get active users (users who posted in last 7 days)
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);
    const activeUsers = await Post.distinct('user', {
      createdAt: { $gte: weekAgo }
    }).then(users => users.length);

    // System info
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
    console.error("Error getting system stats:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching system stats"
    });
  }
};

// Get all users with details
exports.getAllUsers = async (req, res) => {
  try {
    const users = await ElderlyUser.find({})
      .select('-password')
      .sort({ createdAt: -1 });

    // Get post count for each user
    const usersWithStats = await Promise.all(users.map(async (user) => {
      const postCount = await Post.countDocuments({ user: user._id });
      const chatCount = await Chat.countDocuments({ participants: user._id });
      
      return {
        ...user.toObject(),
        stats: {
          posts: postCount,
          chats: chatCount
        }
      };
    }));

    res.json({
      success: true,
      users: usersWithStats
    });
  } catch (error) {
    console.error("Error fetching users:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching users"
    });
  }
};

// Get all posts with details
exports.getAllPosts = async (req, res) => {
  try {
    const posts = await Post.find({})
      .populate('user', 'firstName lastName email profilePhoto')
      .populate('comments.user', 'firstName lastName')
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      posts
    });
  } catch (error) {
    console.error("Error fetching posts:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching posts"
    });
  }
};

// Get all SOS alerts
exports.getSOSAlerts = async (req, res) => {
  try {
    const alerts = await SOSAlert.find({})
      .populate('user', 'firstName lastName email phone emergencyContact')
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      alerts
    });
  } catch (error) {
    console.error("Error fetching SOS alerts:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching SOS alerts"
    });
  }
};

// Get all help requests
exports.getHelpRequests = async (req, res) => {
  try {
    const requests = await HelpRequest.find({})
      .populate('user', 'firstName lastName email')
      .populate('helper', 'firstName lastName email')
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      requests
    });
  } catch (error) {
    console.error("Error fetching help requests:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching help requests"
    });
  }
};

// Get chat analytics
exports.getChatAnalytics = async (req, res) => {
  try {
    const chats = await Chat.find({})
      .populate('participants', 'firstName lastName')
      .populate('lastMessage')
      .sort({ updatedAt: -1 });

    const totalMessages = await Message.countDocuments();
    
    // Messages per day (last 7 days)
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
    console.error("Error fetching chat analytics:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching chat analytics"
    });
  }
};

// Get application logs
exports.getLogs = async (req, res) => {
  try {
    const logType = req.query.type || 'all';
    const lines = parseInt(req.query.lines) || 100;
    
    const logs = [];
    
    // Function to read log file
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

    // Check different log locations
    const logPaths = {
      error: path.join(__dirname, '../logs/error.log'),
      combined: path.join(__dirname, '../logs/combined.log'),
      access: path.join(__dirname, '../logs/access.log')
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

    // Sort by timestamp if possible (simple reverse chronological)
    logs.sort((a, b) => {
      const timeA = a.message.match(/\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/);
      const timeB = b.message.match(/\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/);
      if (timeA && timeB) {
        return new Date(timeB[0]) - new Date(timeA[0]);
      }
      return 0;
    });

    res.json({
      success: true,
      logs: logs.slice(0, lines)
    });
  } catch (error) {
    console.error("Error fetching logs:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching logs"
    });
  }
};

// Get NLP service status
exports.getNLPServiceStatus = async (req, res) => {
  try {
    const axios = require('axios');
    const pythonServiceUrl = process.env.PYTHON_SERVICE_URL || 'http://localhost:5001';
    
    let nlpStatus = 'unknown';
    let nlpInfo = null;
    
    try {
      const response = await axios.get(`${pythonServiceUrl}/api/status`, { timeout: 3000 });
      if (response.data) {
        nlpStatus = 'running';
        nlpInfo = response.data;
      }
    } catch (error) {
      nlpStatus = 'stopped';
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
    console.error("Error checking NLP service:", error);
    res.status(500).json({
      success: false,
      message: "Error checking NLP service"
    });
  }
};