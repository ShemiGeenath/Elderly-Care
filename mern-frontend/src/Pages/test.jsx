// db.js

const mongoose = require("mongoose");
const { db } = require("../models/ElderlyUser");

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("✅ MongoDB Connected");
  } catch (error) {
    console.error("❌ MongoDB Error:", error.message);
    process.exit(1);
  }
};

module.exports = connectDB;



// backend/controllers/chatController.js
const Chat = require('../models/Chat');
const Message = require('../models/Message');
const ElderlyUser = require('../models/ElderlyUser');

// Get all chats for current user
exports.getUserChats = async (req, res) => {
  try {
    const userId = req.user.id;
    
    const chats = await Chat.find({
      participants: userId
    })
    .populate('participants', 'firstName lastName profilePhoto')
    .populate('lastMessage')
    .sort({ updatedAt: -1 });

    // Get unread counts
    const chatsWithDetails = chats.map(chat => {
      const chatObj = chat.toObject();
      const otherParticipants = chat.participants.filter(
        p => p._id.toString() !== userId
      );
      
      // Get unread count for this user
      const unreadCount = chat.unreadCount?.get(userId) || 0;
      
      return {
        ...chatObj,
        otherParticipants,
        unreadCount,
        isGroupChat: chat.isGroupChat
      };
    });

    res.json({
      success: true,
      chats: chatsWithDetails
    });
  } catch (err) {
    console.error('Get user chats error:', err);
    res.status(500).json({
      success: false,
      message: 'Error fetching chats'
    });
  }
};

// Get or create a chat with another user
exports.getOrCreateChat = async (req, res) => {
  try {
    const currentUserId = req.user.id;
    const { userId } = req.params;

    if (currentUserId === userId) {
      return res.status(400).json({
        success: false,
        message: 'Cannot chat with yourself'
      });
    }

    // Check if user exists
    const otherUser = await ElderlyUser.findById(userId);
    if (!otherUser) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Find existing chat
    let chat = await Chat.findOne({
      participants: { $all: [currentUserId, userId] },
      isGroupChat: false
    }).populate('participants', 'firstName lastName profilePhoto');

    if (!chat) {
      // Create new chat
      chat = await Chat.create({
        participants: [currentUserId, userId],
        unreadCount: new Map([[currentUserId, 0], [userId, 0]])
      });
      
      chat = await Chat.findById(chat._id)
        .populate('participants', 'firstName lastName profilePhoto');
    }

    res.json({
      success: true,
      chat
    });
  } catch (err) {
    console.error('Get or create chat error:', err);
    res.status(500).json({
      success: false,
      message: 'Error creating chat'
    });
  }
};

// Get messages for a chat
exports.getChatMessages = async (req, res) => {
  try {
    const { chatId } = req.params;
    const userId = req.user.id;
    const { page = 1, limit = 50 } = req.query;
    const skip = (page - 1) * limit;

    // Check if user is participant
    const chat = await Chat.findOne({
      _id: chatId,
      participants: userId
    });

    if (!chat) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to view this chat'
      });
    }

    // Get messages
    const messages = await Message.find({
      chat: chatId,
      deletedFor: { $ne: userId }
    })
    .populate('sender', 'firstName lastName profilePhoto')
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(parseInt(limit));

    const total = await Message.countDocuments({
      chat: chatId,
      deletedFor: { $ne: userId }
    });

    // Mark messages as read
    await Message.updateMany(
      {
        chat: chatId,
        sender: { $ne: userId },
        'readBy.user': { $ne: userId }
      },
      {
        $push: { readBy: { user: userId, readAt: new Date() } }
      }
    );

    // Reset unread count for this user
    chat.unreadCount.set(userId, 0);
    await chat.save();

    res.json({
      success: true,
      messages: messages.reverse(),
      total,
      page: parseInt(page),
      pages: Math.ceil(total / limit)
    });
  } catch (err) {
    console.error('Get chat messages error:', err);
    res.status(500).json({
      success: false,
      message: 'Error fetching messages'
    });
  }
};

// Send a message
exports.sendMessage = async (req, res) => {
  try {
    const { chatId } = req.params;
    const { content } = req.body;
    const userId = req.user.id;

    const chat = await Chat.findOne({
      _id: chatId,
      participants: userId
    });

    if (!chat) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to send message in this chat'
      });
    }

    const message = await Message.create({
      chat: chatId,
      sender: userId,
      content,
      deliveredTo: [userId]
    });

    const populatedMessage = await Message.findById(message._id)
      .populate('sender', 'firstName lastName profilePhoto');

    // Update chat's last message
    chat.lastMessage = message._id;
    chat.updatedAt = new Date();
    
    // Increment unread count for other participants
    chat.participants.forEach(participantId => {
      if (participantId.toString() !== userId) {
        const currentCount = chat.unreadCount.get(participantId.toString()) || 0;
        chat.unreadCount.set(participantId.toString(), currentCount + 1);
      }
    });
    
    await chat.save();

    res.status(201).json({
      success: true,
      message: populatedMessage
    });
  } catch (err) {
    console.error('Send message error:', err);
    res.status(500).json({
      success: false,
      message: 'Error sending message'
    });
  }
};

// Delete a message
exports.deleteMessage = async (req, res) => {
  try {
    const { messageId } = req.params;
    const userId = req.user.id;

    const message = await Message.findById(messageId);
    if (!message) {
      return res.status(404).json({
        success: false,
        message: 'Message not found'
      });
    }

    // Check if user is sender
    if (message.sender.toString() === userId) {
      // Soft delete for everyone
      message.isDeleted = true;
    } else {
      // Delete only for this user
      message.deletedFor.push(userId);
    }

    await message.save();

    res.json({
      success: true,
      message: 'Message deleted'
    });
  } catch (err) {
    console.error('Delete message error:', err);
    res.status(500).json({
      success: false,
      message: 'Error deleting message'
    });
  }
};

// Mark messages as delivered
exports.markAsDelivered = async (req, res) => {
  try {
    const { chatId } = req.params;
    const userId = req.user.id;

    await Message.updateMany(
      {
        chat: chatId,
        sender: { $ne: userId },
        deliveredTo: { $ne: userId }
      },
      {
        $push: { deliveredTo: userId }
      }
    );

    res.json({
      success: true,
      message: 'Messages marked as delivered'
    });
  } catch (err) {
    console.error('Mark as delivered error:', err);
    res.status(500).json({
      success: false,
      message: 'Error marking messages as delivered'
    });
  }
};


// controllers/elderlyController.js
const ElderlyUser = require("../models/ElderlyUser");
const Post = require("../models/Post");
const jwt = require("jsonwebtoken");
const axios = require('axios');
const nlpMatcher = require('../utils/nlpMatcher');

const generateUserToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET || "your_secret_key", {
    expiresIn: "7d",
  });
};

// ================= AUTH =================
// In controllers/elderlyController.js - Add this as a temporary fix
// In controllers/elderlyController.js - UPDATED VERSION
exports.registerElderly = async (req, res) => {
  try {
    console.log("Registration request received:", req.body);
    
    // Extract ALL fields properly
    const { 
      firstName, 
      lastName, 
      email, 
      password,
      birthDate, // Make sure this is properly extracted
      phone,
      address,
      city,
      state,
      zipCode,
      emergencyContact,
      emergencyPhone,
      hobbies,
      helpNeeded,
      mobility,
      acceptTerms,
      acceptPrivacy
    } = req.body;
    
    // Log all extracted fields to debug
    console.log("Extracted fields:", {
      firstName, lastName, email, 
      password: password ? "***" : "missing",
      birthDate, acceptTerms
    });
    
    // Validate required fields
    if (!firstName || !lastName || !email || !password) {
      return res.status(400).json({ 
        success: false, 
        message: "Please fill in all required fields: First Name, Last Name, Email, and Password" 
      });
    }
    
    if (!acceptTerms) {
      return res.status(400).json({ 
        success: false, 
        message: "You must accept the terms and conditions" 
      });
    }
    
    // Check if user exists
    const userExists = await ElderlyUser.findOne({ 
      email: email.toLowerCase().trim() 
    });
    
    if (userExists) {
      return res.status(400).json({ 
        success: false, 
        message: "User already exists with this email" 
      });
    }
    
    // Create user object with ALL fields
    const userData = {
      firstName,
      lastName,
      email: email.toLowerCase().trim(),
      password, // Will be hashed by middleware
      acceptTerms: true, // Force true since we validated
      acceptPrivacy: acceptPrivacy || false
    };
    
    // Add optional fields only if provided
    if (birthDate) userData.birthDate = birthDate;
    if (phone) userData.phone = phone;
    if (address) userData.address = address;
    if (city) userData.city = city;
    if (state) userData.state = state;
    if (zipCode) userData.zipCode = zipCode;
    if (emergencyContact) userData.emergencyContact = emergencyContact;
    if (emergencyPhone) userData.emergencyPhone = emergencyPhone;
    if (hobbies && Array.isArray(hobbies)) userData.hobbies = hobbies;
    if (helpNeeded && Array.isArray(helpNeeded)) userData.helpNeeded = helpNeeded;
    if (mobility) userData.mobility = mobility;
    
    console.log("Creating user with data:", userData);
    
    // Create user
    const user = await ElderlyUser.create(userData);
    
    console.log("User created successfully:", user._id);
    
    // Generate token
    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET || "your_secret_key", {
      expiresIn: "7d",
    });
    
    res.status(201).json({ 
      success: true, 
      message: "Registration successful",
      token,
      user: {
        id: user._id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        profilePhoto: user.profilePhoto
      }
    });
    
  } catch (err) { 
    console.error("Registration error details:", err);
    console.error("Error name:", err.name);
    console.error("Error message:", err.message);
    
    // Handle specific errors
    if (err.name === 'ValidationError') {
      const messages = Object.values(err.errors).map(e => e.message);
      return res.status(400).json({
        success: false,
        message: messages.join(', ')
      });
    }
    
    if (err.code === 11000) {
      return res.status(400).json({
        success: false,
        message: "Email already exists"
      });
    }
    
    res.status(500).json({ 
      success: false, 
      message: "Server error: " + (err.message || "Unknown error")
    }); 
  }
};

exports.loginElderly = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: "Email and password are required",
      });
    }

    const user = await ElderlyUser.findOne({
      email: email.toLowerCase().trim(),
    });

    if (!user) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password",
      });
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password",
      });
    }

    const token = generateUserToken(user._id);

    res.json({
      success: true,
      message: "Login successful",
      token,
      user: {
        id: user._id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        profilePhoto: user.profilePhoto,
      },
    });
  } catch (err) {
    console.error("Login error:", err);
    res.status(500).json({
      success: false,
      message: "Server error during login",
    });
  }
};

// ================= PROFILE =================
exports.getElderlyProfile = async (req, res) => {
  try {
    const user = await ElderlyUser.findById(req.params.id)
      .select("-password");
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found"
      });
    }
    
    res.json({
      success: true,
      user
    });
  } catch (err) {
    console.error("Get profile error:", err);
    res.status(500).json({
      success: false,
      message: "Error fetching profile"
    });
  }
};

exports.updateElderlyProfile = async (req, res) => {
  try {
    const updates = req.body;
    const user = await ElderlyUser.findByIdAndUpdate(
      req.params.id,
      updates,
      { new: true, runValidators: true }
    ).select("-password");
    
    res.json({
      success: true,
      message: "Profile updated",
      user
    });
  } catch (err) {
    console.error("Update profile error:", err);
    res.status(500).json({
      success: false,
      message: "Error updating profile"
    });
  }
};

exports.uploadProfilePhoto = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: "No file uploaded"
      });
    }
    
    const user = await ElderlyUser.findById(req.params.id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found"
      });
    }
    
    user.profilePhoto = `/uploads/${req.file.filename}`;
    await user.save();
    
    res.json({
      success: true,
      message: "Profile photo updated",
      profilePhoto: user.profilePhoto
    });
  } catch (err) {
    console.error("Upload photo error:", err);
    res.status(500).json({
      success: false,
      message: "Error uploading photo"
    });
  }
};

exports.getCurrentUser = async (req, res) => {
  try {
    const user = await ElderlyUser.findById(req.user.id).select("-password");
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    res.json({
      success: true,
      user,
    });
  } catch (error) {
    console.error("Get current user error:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching user data",
    });
  }
};

// ================= POSTS =================
exports.createPost = async (req, res) => {
  try {
    const { content, tags, privacy } = req.body;

    if (!content) {
      return res.status(400).json({
        success: false,
        message: "Post content is required",
      });
    }

    const post = await Post.create({
      user: req.user.id,
      content,
      tags: tags || [],
      privacy: privacy || "public",
    });

    const populatedPost = await Post.findById(post._id)
      .populate("user", "firstName lastName profilePhoto");

    res.status(201).json({
      success: true,
      message: "Post created successfully",
      post: populatedPost,
    });
  } catch (err) {
    console.error("Create post error:", err);
    res.status(500).json({
      success: false,
      message: "Error creating post",
    });
  }
};

exports.getAllPosts = async (req, res) => {
  try {
    const { page = 1, limit = 10 } = req.query;
    const skip = (page - 1) * limit;

    const posts = await Post.find({ privacy: "public" })
      .populate("user", "firstName lastName profilePhoto")
      .populate("comments.user", "firstName lastName profilePhoto")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Post.countDocuments({ privacy: "public" });

    res.json({
      success: true,
      posts,
      total,
      page: parseInt(page),
      pages: Math.ceil(total / limit),
    });
  } catch (err) {
    console.error("Get all posts error:", err);
    res.status(500).json({
      success: false,
      message: "Error fetching posts",
    });
  }
};

exports.getUserPosts = async (req, res) => {
  try {
    const { id } = req.params;
    const { page = 1, limit = 10 } = req.query;
    const skip = (page - 1) * limit;

    const filter = { user: id };
    
    // If viewing own profile, show all posts including private ones
    if (req.user.id !== id) {
      filter.privacy = { $in: ["public", "friends"] };
    }

    const posts = await Post.find(filter)
      .populate("user", "firstName lastName profilePhoto")
      .populate("comments.user", "firstName lastName profilePhoto")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Post.countDocuments(filter);

    res.json({
      success: true,
      posts,
      total,
      page: parseInt(page),
      pages: Math.ceil(total / limit),
    });
  } catch (err) {
    console.error("Get user posts error:", err);
    res.status(500).json({
      success: false,
      message: "Error fetching user posts",
    });
  }
};

exports.getPostById = async (req, res) => {
  try {
    const { id } = req.params;

    const post = await Post.findById(id)
      .populate("user", "firstName lastName profilePhoto")
      .populate("comments.user", "firstName lastName profilePhoto")
      .populate("likes", "firstName lastName profilePhoto");

    if (!post) {
      return res.status(404).json({
        success: false,
        message: "Post not found",
      });
    }

    // Check privacy
    if (post.privacy === "private" && post.user._id.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: "Not authorized to view this post",
      });
    }

    res.json({
      success: true,
      post,
    });
  } catch (err) {
    console.error("Get post by ID error:", err);
    res.status(500).json({
      success: false,
      message: "Error fetching post",
    });
  }
};

exports.editPost = async (req, res) => {
  try {
    const { id } = req.params;
    const { content, tags, privacy } = req.body;

    const post = await Post.findById(id);
    if (!post) {
      return res.status(404).json({
        success: false,
        message: "Post not found",
      });
    }

    // Check if user owns the post
    if (post.user.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: "Not authorized to edit this post",
      });
    }

    post.content = content || post.content;
    post.tags = tags || post.tags;
    post.privacy = privacy || post.privacy;
    await post.save();

    const populatedPost = await Post.findById(id)
      .populate("user", "firstName lastName profilePhoto");

    res.json({
      success: true,
      message: "Post updated successfully",
      post: populatedPost,
    });
  } catch (err) {
    console.error("Edit post error:", err);
    res.status(500).json({
      success: false,
      message: "Error updating post",
    });
  }
};

exports.deletePost = async (req, res) => {
  try {
    const { id } = req.params;

    const post = await Post.findById(id);
    if (!post) {
      return res.status(404).json({
        success: false,
        message: "Post not found",
      });
    }

    // Check if user owns the post
    if (post.user.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: "Not authorized to delete this post",
      });
    }

    await post.deleteOne();

    res.json({
      success: true,
      message: "Post deleted successfully",
    });
  } catch (err) {
    console.error("Delete post error:", err);
    res.status(500).json({
      success: false,
      message: "Error deleting post",
    });
  }
};

exports.likePost = async (req, res) => {
  try {
    const post = await Post.findById(req.params.postId);
    if (!post) {
      return res.status(404).json({
        success: false,
        message: "Post not found"
      });
    }
    
    const userId = req.user.id;
    const likeIndex = post.likes.indexOf(userId);
    
    if (likeIndex === -1) {
      // Add like
      post.likes.push(userId);
    } else {
      // Remove like
      post.likes.splice(likeIndex, 1);
    }
    
    await post.save();
    
    res.json({
      success: true,
      likes: post.likes.length,
      isLiked: likeIndex === -1
    });
  } catch (err) {
    console.error("Like post error:", err);
    res.status(500).json({
      success: false,
      message: "Error liking post"
    });
  }
};

exports.addComment = async (req, res) => {
  try {
    const { content } = req.body;
    const post = await Post.findById(req.params.postId);
    
    if (!post) {
      return res.status(404).json({
        success: false,
        message: "Post not found"
      });
    }
    
    const comment = {
      user: req.user.id,
      content,
      createdAt: new Date()
    };
    
    post.comments.push(comment);
    await post.save();
    
    // Populate user info for the new comment
    const populatedPost = await Post.findById(post._id)
      .populate('comments.user', 'firstName lastName profilePhoto');
    
    res.json({
      success: true,
      message: "Comment added",
      comments: populatedPost.comments
    });
  } catch (err) {
    console.error("Add comment error:", err);
    res.status(500).json({
      success: false,
      message: "Error adding comment"
    });
  }
};

exports.sharePost = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const post = await Post.findById(id);
    if (!post) {
      return res.status(404).json({
        success: false,
        message: "Post not found",
      });
    }

    // Check if already shared
    if (!post.shares.includes(userId)) {
      post.shares.push(userId);
      await post.save();
    }

    res.json({
      success: true,
      message: "Post shared successfully",
      shares: post.shares.length,
    });
  } catch (err) {
    console.error("Share post error:", err);
    res.status(500).json({
      success: false,
      message: "Error sharing post",
    });
  }
};

// ================= FRIENDS/COMMUNITY =================
exports.getAllUsers = async (req, res) => {
  try {
    const currentUserId = req.user.id;
    
    // Get current user's data for comparison
    const currentUser = await ElderlyUser.findById(currentUserId)
      .select('hobbies helpNeeded city state mobility');
    
    // Get all other users
    const users = await ElderlyUser.find({ _id: { $ne: currentUserId } })
      .select('firstName lastName profilePhoto hobbies helpNeeded city state mobility')
      .sort({ createdAt: -1 });
    
    // Calculate matching percentage for each user
    const usersWithMatch = users.map(user => {
      const matchPercentage = calculateMatchPercentage(currentUser, user);
      return {
        ...user.toObject(),
        matchPercentage,
        commonHobbies: findCommonItems(currentUser.hobbies || [], user.hobbies || []),
        commonHelp: findCommonItems(currentUser.helpNeeded || [], user.helpNeeded || [])
      };
    });
    
    // Sort by match percentage (highest first)
    usersWithMatch.sort((a, b) => b.matchPercentage - a.matchPercentage);
    
    res.json({
      success: true,
      users: usersWithMatch,
      currentUserId
    });
  } catch (err) {
    console.error("Get all users error:", err);
    res.status(500).json({
      success: false,
      message: "Error fetching users"
    });
  }
};

// Calculate match percentage between two users
const calculateMatchPercentage = (user1, user2) => {
  let score = 0;
  let totalWeight = 0;
  
  // 1. Hobbies (Weight: 40%)
  const hobbyWeight = 40;
  totalWeight += hobbyWeight;
  const commonHobbies = findCommonItems(user1.hobbies || [], user2.hobbies || []);
  const hobbyScore = user1.hobbies?.length > 0 
    ? (commonHobbies.length / Math.max(user1.hobbies.length, user2.hobbies.length)) * hobbyWeight 
    : 0;
  score += hobbyScore;
  
  // 2. Help Needed (Weight: 30%)
  const helpWeight = 30;
  totalWeight += helpWeight;
  const commonHelp = findCommonItems(user1.helpNeeded || [], user2.helpNeeded || []);
  const helpScore = user1.helpNeeded?.length > 0
    ? (commonHelp.length / Math.max(user1.helpNeeded.length, user2.helpNeeded.length)) * helpWeight
    : 0;
  score += helpScore;
  
  // 3. Location (Weight: 20%)
  const locationWeight = 20;
  totalWeight += locationWeight;
  const locationScore = (user1.city === user2.city && user1.state === user2.state) 
    ? locationWeight 
    : (user1.state === user2.state ? locationWeight * 0.5 : 0);
  score += locationScore;
  
  // 4. Mobility (Weight: 10%)
  const mobilityWeight = 10;
  totalWeight += mobilityWeight;
  const mobilityScore = user1.mobility === user2.mobility ? mobilityWeight : 0;
  score += mobilityScore;
  
  // Calculate percentage
  const percentage = totalWeight > 0 ? Math.round((score / totalWeight) * 100) : 0;
  
  return percentage;
};

// Helper function to find common items
const findCommonItems = (arr1, arr2) => {
  return arr1.filter(item => arr2.includes(item));
};

exports.searchUsers = async (req, res) => {
  try {
    const currentUserId = req.user.id;
    const { query } = req.query;
    
    const currentUser = await ElderlyUser.findById(currentUserId)
      .select('hobbies helpNeeded city state mobility');
    
    const users = await ElderlyUser.find({
      _id: { $ne: currentUserId },
      $or: [
        { firstName: { $regex: query, $options: 'i' } },
        { lastName: { $regex: query, $options: 'i' } },
        { hobbies: { $regex: query, $options: 'i' } },
        { helpNeeded: { $regex: query, $options: 'i' } }
      ]
    }).select('firstName lastName profilePhoto hobbies helpNeeded city state mobility');
    
    const usersWithMatch = users.map(user => {
      const matchPercentage = calculateMatchPercentage(currentUser, user);
      return {
        ...user.toObject(),
        matchPercentage,
        commonHobbies: findCommonItems(currentUser.hobbies || [], user.hobbies || []),
        commonHelp: findCommonItems(currentUser.helpNeeded || [], user.helpNeeded || [])
      };
    });
    
    usersWithMatch.sort((a, b) => b.matchPercentage - a.matchPercentage);
    
    res.json({
      success: true,
      users: usersWithMatch
    });
  } catch (err) {
    console.error("Search users error:", err);
    res.status(500).json({
      success: false,
      message: "Error searching users"
    });
  }
};

exports.getSuggestedFriends = async (req, res) => {
  try {
    const currentUserId = req.user.id;
    const limit = parseInt(req.query.limit) || 5;
    
    const currentUser = await ElderlyUser.findById(currentUserId)
      .select('hobbies helpNeeded city state mobility');
    
    const users = await ElderlyUser.find({ _id: { $ne: currentUserId } })
      .select('firstName lastName profilePhoto hobbies helpNeeded city state mobility')
      .limit(limit);
    
    const usersWithMatch = users.map(user => {
      const matchPercentage = calculateMatchPercentage(currentUser, user);
      return {
        ...user.toObject(),
        matchPercentage,
        commonHobbies: findCommonItems(currentUser.hobbies || [], user.hobbies || []).slice(0, 3),
        commonHelp: findCommonItems(currentUser.helpNeeded || [], user.helpNeeded || []).slice(0, 3)
      };
    });
    
    usersWithMatch.sort((a, b) => b.matchPercentage - a.matchPercentage);
    
    res.json({
      success: true,
      users: usersWithMatch
    });
  } catch (err) {
    console.error("Get suggested friends error:", err);
    res.status(500).json({
      success: false,
      message: "Error fetching suggested friends"
    });
  }
};

// controllers/elderlyController.js (add these new functions)

// Upload profile photo
exports.uploadProfilePhoto = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: "No file uploaded"
      });
    }

    const user = await ElderlyUser.findById(req.params.id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found"
      });
    }

    // Check if user owns this profile
    if (user._id.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: "Not authorized to update this profile"
      });
    }

    // Update profile photo with Cloudinary URL
    user.profilePhoto = req.file.path;
    await user.save();

    res.json({
      success: true,
      message: "Profile photo updated successfully",
      profilePhoto: user.profilePhoto
    });
  } catch (err) {
    console.error("Upload profile photo error:", err);
    res.status(500).json({
      success: false,
      message: "Error uploading profile photo"
    });
  }
};

// Upload cover photo
exports.uploadCoverPhoto = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: "No file uploaded"
      });
    }

    const user = await ElderlyUser.findById(req.params.id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found"
      });
    }

    // Check if user owns this profile
    if (user._id.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: "Not authorized to update this profile"
      });
    }

    // Update cover photo with Cloudinary URL
    user.coverPhoto = req.file.path;
    await user.save();

    res.json({
      success: true,
      message: "Cover photo updated successfully",
      coverPhoto: user.coverPhoto
    });
  } catch (err) {
    console.error("Upload cover photo error:", err);
    res.status(500).json({
      success: false,
      message: "Error uploading cover photo"
    });
  }
};

// Remove photo
exports.removeCoverPhoto = async (req, res) => {
  try {
    const user = await ElderlyUser.findById(req.params.id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found"
      });
    }

    // Check if user owns this profile
    if (user._id.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: "Not authorized to update this profile"
      });
    }

    // Reset to default cover photo
    user.coverPhoto = 'https://res.cloudinary.com/your-cloud-name/image/upload/v1/eldercare/defaults/default-cover.jpg';
    await user.save();

    res.json({
      success: true,
      message: "Cover photo removed",
      coverPhoto: user.coverPhoto
    });
  } catch (err) {
    console.error("Remove cover photo error:", err);
    res.status(500).json({
      success: false,
      message: "Error removing cover photo"
    });
  }
};

// Add this new function for NLP-based suggestions
exports.getNLPSuggestedFriends = async (req, res) => {
  try {
    const currentUserId = req.user.id;
    const limit = parseInt(req.query.limit) || 10;
    
    // Call Python NLP service
    const pythonServiceUrl = process.env.PYTHON_SERVICE_URL || 'http://localhost:5001';
    
    const response = await axios.post(`${pythonServiceUrl}/api/match-users`, {
      userId: currentUserId,
      limit: limit
    });
    
    if (response.data.success) {
      return res.json({
        success: true,
        users: response.data.users
      });
    } else {
      // Fallback to traditional matching if NLP service fails
      console.log('NLP service failed, using fallback matching');
      return await getSuggestedFriendsFallback(req, res);
    }
  } catch (error) {
    console.error("NLP suggestion error:", error);
    // Fallback to traditional matching
    return await getSuggestedFriendsFallback(req, res);
  }
};

// Fallback method using traditional matching
const getSuggestedFriendsFallback = async (req, res) => {
  try {
    const currentUserId = req.user.id;
    const limit = parseInt(req.query.limit) || 5;
    
    const currentUser = await ElderlyUser.findById(currentUserId)
      .select('hobbies helpNeeded city state mobility');
    
    const users = await ElderlyUser.find({ _id: { $ne: currentUserId } })
      .select('firstName lastName profilePhoto hobbies helpNeeded city state mobility')
      .limit(limit * 2); // Get more for better filtering
    
    const usersWithMatch = users.map(user => {
      const matchPercentage = calculateMatchPercentage(currentUser, user);
      return {
        ...user.toObject(),
        matchPercentage,
        commonHobbies: findCommonItems(currentUser.hobbies || [], user.hobbies || []).slice(0, 3),
        commonHelp: findCommonItems(currentUser.helpNeeded || [], user.helpNeeded || []).slice(0, 3)
      };
    });
    
    usersWithMatch.sort((a, b) => b.matchPercentage - a.matchPercentage);
    
    res.json({
      success: true,
      users: usersWithMatch.slice(0, limit)
    });
  } catch (err) {
    console.error("Fallback suggestion error:", err);
    res.status(500).json({
      success: false,
      message: "Error fetching suggestions"
    });
  }
};
exports.getNLPSuggestedFriends = async (req, res) => {
  try {
    const currentUserId = req.user.id;
    const limit = parseInt(req.query.limit) || 5;
    
    const currentUser = await ElderlyUser.findById(currentUserId)
      .select('firstName lastName profilePhoto hobbies helpNeeded city state mobility');
    
    const users = await ElderlyUser.find({ _id: { $ne: currentUserId } })
      .select('firstName lastName profilePhoto hobbies helpNeeded city state mobility')
      .limit(limit * 2);
    
    const usersWithMatch = users.map(user => {
      const matchPercentage = nlpMatcher.calculateEnhancedMatch(
        currentUser.toObject(),
        user.toObject()
      );
      
      return {
        ...user.toObject(),
        matchPercentage,
        commonHobbies: findCommonItems(currentUser.hobbies || [], user.hobbies || []).slice(0, 3),
        commonHelp: findCommonItems(currentUser.helpNeeded || [], user.helpNeeded || []).slice(0, 3)
      };
    });
    
    usersWithMatch.sort((a, b) => b.matchPercentage - a.matchPercentage);
    
    res.json({
      success: true,
      users: usersWithMatch.slice(0, limit)
    });
  } catch (err) {
    console.error("NLP suggestion error:", err);
    res.status(500).json({
      success: false,
      message: "Error fetching suggestions"
    });
  }
};
// Update your existing getSuggestedFriends to use NLP
exports.getSuggestedFriends = exports.getNLPSuggestedFriends;


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


// backend/models/Chat.js
const mongoose = require('mongoose');

const ChatSchema = new mongoose.Schema({
  participants: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'ElderlyUser',
    required: true
  }],
  lastMessage: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Message'
  },
  unreadCount: {
    type: Map,
    of: Number,
    default: new Map()
  },
  isGroupChat: {
    type: Boolean,
    default: false
  },
  groupName: String,
  groupAvatar: String,
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Ensure unique chat for two participants (for 1-on-1 chats)
ChatSchema.index({ participants: 1 }, { unique: true, partialFilterExpression: { isGroupChat: false } });

module.exports = mongoose.model('Chat', ChatSchema);


// models/ElderlyUser.js
const mongoose = require("mongoose");
const bcrypt = require('bcryptjs');

const ElderlyUserSchema = new mongoose.Schema(
  {
    firstName: { type: String, required: true },
    lastName: { type: String, required: true },
    email: { type: String, required: true, unique: true, lowercase: true },
    password: { type: String, required: true },
    birthDate: { 
      type: Date,
      set: function(value) {
        if (!value) return null;
        return new Date(value);
      }
    },
    phone: String,
    address: String,
    city: String,
    state: String,
    zipCode: String,
    emergencyContact: String,
    emergencyPhone: String,
    hobbies: [String],
    helpNeeded: [String],
    mobility: { type: String, default: "independent" },
    profilePhoto: { 
      type: String, 
      default: 'https://res.cloudinary.com/your-cloud-name/image/upload/v1/eldercare/defaults/default-avatar.png'
    },
    coverPhoto: { 
      type: String, 
      default: 'https://res.cloudinary.com/your-cloud-name/image/upload/v1/eldercare/defaults/default-cover.jpg'
    },
    acceptTerms: { type: Boolean, required: true, default: false },
    acceptPrivacy: { type: Boolean, default: false }
  },
  { timestamps: true }
);

// Hash password middleware
ElderlyUserSchema.pre('save', async function () {
  if (!this.isModified('password')) return;
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
});

// Compare password method
ElderlyUserSchema.methods.comparePassword = async function(candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

module.exports = mongoose.model("ElderlyUser", ElderlyUserSchema);


// backend/models/Message.js
const mongoose = require('mongoose');

const MessageSchema = new mongoose.Schema({
  chat: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Chat',
    required: true
  },
  sender: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'ElderlyUser',
    required: true
  },
  content: {
    type: String,
    required: true
  },
  attachments: [{
    type: {
      type: String,
      enum: ['image', 'file']
    },
    url: String,
    filename: String,
    size: Number
  }],
  readBy: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'ElderlyUser'
    },
    readAt: {
      type: Date,
      default: Date.now
    }
  }],
  deliveredTo: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'ElderlyUser'
  }],
  isDeleted: {
    type: Boolean,
    default: false
  },
  deletedFor: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'ElderlyUser'
  }],
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Message', MessageSchema);



// backend/routes/chatRoutes.js
const express = require('express');
const router = express.Router();
const chatController = require('../controllers/chatController');
const protect = require('../middleware/authMiddleware');

// Get all chats for current user
router.get('/chats', protect, chatController.getUserChats);

// Get or create chat with another user
router.get('/chat/:userId', protect, chatController.getOrCreateChat);

// Get messages for a specific chat
router.get('/messages/:chatId', protect, chatController.getChatMessages);

// Send a message
router.post('/message/:chatId', protect, chatController.sendMessage);

// Delete a message
router.delete('/message/:messageId', protect, chatController.deleteMessage);

// Mark messages as delivered
router.put('/delivered/:chatId', protect, chatController.markAsDelivered);

module.exports = router;


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



.env

PORT=5000
MONGO_URI=mongodb://127.0.0.1:27017/eldercare
JWT_SECRET=eldercare_super_secret_key

PYTHON_SERVICE_URL=http://localhost:5001

CLOUDINARY_CLOUD_NAME=dfr4ompqk
CLOUDINARY_API_KEY=574172548571731
CLOUDINARY_API_SECRET=TjbpQZGkUXU3wPASZozmd-rs9_4


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

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: "http://localhost:5173", // Your frontend URL
    methods: ["GET", "POST"],
    credentials: true
  }
});

// Middleware
app.use(cors());
app.use(express.json());

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

// Routes
app.use("/api/elderly", elderlyRoutes);
app.use("/api/help", helpRoutes);
app.use("/api/chat", chatRoutes);

// Test route
app.get("/", (req, res) => {
  res.send("Eldercare API Running");
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, () =>
  console.log(`🚀 Server running on http://localhost:${PORT}`)
);



// axiosConfig.js

import axios from 'axios';

const axiosInstance = axios.create({
  baseURL: 'http://localhost:5000/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add token
axiosInstance.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('elderlyToken'); // Changed from 'token'
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor for error handling
axiosInstance.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('elderlyToken');
      localStorage.removeItem('elderlyUser');
      window.location.href = '/login'; // Make sure this matches your route
    }
    return Promise.reject(error);
  }
);

export default axiosInstance;


// frontend/src/components/Chat/ChatInterface.jsx
import React, { useState, useEffect } from 'react';
import { useChat } from '../../context/ChatContext';
import ChatList from './ChatList';
import ChatWindow from './ChatWindow';

const ChatInterface = ({ currentUser, onClose }) => {
  const [activeChat, setActiveChat] = useState(null);
  const [showMobileList, setShowMobileList] = useState(true);
  const { setActiveChat: setGlobalActiveChat } = useChat();

  useEffect(() => {
    setGlobalActiveChat(activeChat);
  }, [activeChat]);

  const handleSelectChat = (chat) => {
    setActiveChat(chat);
    setShowMobileList(false);
    setGlobalActiveChat(chat);
  };

  const handleBackToList = () => {
    setShowMobileList(true);
  };

  return (
    <div className="flex h-full bg-white rounded-xl shadow-xl overflow-hidden">
      {/* Chat List - Hidden on mobile when chat is active */}
      <div className={`${
        showMobileList ? 'block' : 'hidden'
      } lg:block w-full lg:w-80`}>
        <ChatList
          currentUser={currentUser}
          onSelectChat={handleSelectChat}
          activeChatId={activeChat?._id}
        />
      </div>

      {/* Chat Window - Hidden on mobile when list is showing */}
      <div className={`${
        !showMobileList ? 'block' : 'hidden'
      } lg:block flex-1`}>
        <ChatWindow
          chat={activeChat}
          currentUser={currentUser}
          onClose={handleBackToList}
        />
      </div>
    </div>
  );
};

export default ChatInterface;


// frontend/src/components/Chat/ChatList.jsx
import React, { useEffect, useState } from 'react';
import { useChat } from '../../context/ChatContext';
import { formatDistanceToNow } from 'date-fns';
import {
  Search,
  Plus,
  MessageCircle,
  Check,
  CheckCheck,
  Users,
  MoreVertical
} from 'lucide-react';

const ChatList = ({ currentUser, onSelectChat, activeChatId }) => {
  const { chats, loading, fetchChats, unreadCount } = useChat();
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredChats, setFilteredChats] = useState([]);

  useEffect(() => {
    fetchChats();
  }, []);

  useEffect(() => {
    if (searchQuery.trim()) {
      const filtered = chats.filter(chat => {
        if (chat.isGroupChat) {
          return chat.groupName?.toLowerCase().includes(searchQuery.toLowerCase());
        }
        const otherUser = chat.participants.find(p => p._id !== currentUser.id);
        return otherUser && 
          `${otherUser.firstName} ${otherUser.lastName}`
            .toLowerCase()
            .includes(searchQuery.toLowerCase());
      });
      setFilteredChats(filtered);
    } else {
      setFilteredChats(chats);
    }
  }, [chats, searchQuery, currentUser]);

  const formatLastSeen = (date) => {
    if (!date) return '';
    try {
      return formatDistanceToNow(new Date(date), { addSuffix: true });
    } catch {
      return '';
    }
  };

  const getChatName = (chat) => {
    if (chat.isGroupChat) {
      return chat.groupName || 'Group Chat';
    }
    const otherUser = chat.participants.find(p => p._id !== currentUser.id);
    return otherUser ? `${otherUser.firstName} ${otherUser.lastName}` : 'Chat';
  };

  const getChatAvatar = (chat) => {
    if (chat.isGroupChat) {
      return chat.groupAvatar || '/group-avatar.png';
    }
    const otherUser = chat.participants.find(p => p._id !== currentUser.id);
    return otherUser?.profilePhoto || '/default-avatar.png';
  };

  const getLastMessagePreview = (chat) => {
    if (!chat.lastMessage) return 'No messages yet';
    
    const isOwnMessage = chat.lastMessage.sender === currentUser.id;
    const prefix = isOwnMessage ? 'You: ' : '';
    
    if (chat.lastMessage.content) {
      return `${prefix}${chat.lastMessage.content.substring(0, 30)}${
        chat.lastMessage.content.length > 30 ? '...' : ''
      }`;
    }
    
    if (chat.lastMessage.attachments?.length > 0) {
      return `${prefix}📎 ${chat.lastMessage.attachments.length} attachment(s)`;
    }
    
    return 'No messages yet';
  };

  const getMessageStatus = (chat) => {
    if (!chat.lastMessage) return null;
    
    const isOwnMessage = chat.lastMessage.sender === currentUser.id;
    if (!isOwnMessage) return null;
    
    const allRead = chat.lastMessage.readBy?.length === chat.participants.length - 1;
    
    return allRead ? (
      <CheckCheck className="h-4 w-4 text-blue-500" />
    ) : (
      <Check className="h-4 w-4 text-gray-400" />
    );
  };

  return (
    <div className="w-80 border-r border-gray-200 bg-white flex flex-col h-full">
      {/* Header */}
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-gray-900">Messages</h2>
          <div className="flex items-center space-x-2">
            {unreadCount > 0 && (
              <span className="px-2 py-1 bg-red-500 text-white text-xs rounded-full">
                {unreadCount}
              </span>
            )}
            <button className="p-2 hover:bg-gray-100 rounded-full">
              <Plus className="h-5 w-5 text-gray-600" />
            </button>
          </div>
        </div>
        
        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search messages..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-gray-100 border-0 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>

      {/* Chat List */}
      <div className="flex-1 overflow-y-auto">
        {loading ? (
          <div className="flex items-center justify-center h-32">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        ) : filteredChats.length === 0 ? (
          <div className="text-center py-8">
            <MessageCircle className="h-12 w-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500">No conversations yet</p>
            <button className="mt-4 text-blue-600 hover:text-blue-700 text-sm font-medium">
              Start a new chat
            </button>
          </div>
        ) : (
          filteredChats.map((chat) => {
            const isActive = activeChatId === chat._id;
            const otherParticipants = chat.participants.filter(
              p => p._id !== currentUser.id
            );

            return (
              <button
                key={chat._id}
                onClick={() => onSelectChat(chat)}
                className={`w-full p-4 flex items-start space-x-3 hover:bg-gray-50 transition-colors ${
                  isActive ? 'bg-blue-50' : ''
                } ${chat.unreadCount > 0 ? 'bg-blue-50/50' : ''}`}
              >
                <div className="relative flex-shrink-0">
                  <img
                    src={getChatAvatar(chat)}
                    alt={getChatName(chat)}
                    className="h-12 w-12 rounded-full object-cover"
                  />
                  {chat.unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 min-w-[20px] h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center px-1">
                      {chat.unreadCount > 9 ? '9+' : chat.unreadCount}
                    </span>
                  )}
                </div>
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1">
                    <h3 className="font-medium text-gray-900 truncate">
                      {getChatName(chat)}
                    </h3>
                    {chat.lastMessage && (
                      <span className="text-xs text-gray-500">
                        {formatLastSeen(chat.lastMessage.createdAt)}
                      </span>
                    )}
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <p className="text-sm text-gray-500 truncate max-w-[180px]">
                      {getLastMessagePreview(chat)}
                    </p>
                    <div className="flex items-center space-x-1">
                      {getMessageStatus(chat)}
                      {chat.isGroupChat && (
                        <Users className="h-4 w-4 text-gray-400" />
                      )}
                    </div>
                  </div>

                  {/* Online status for individuals */}
                  {!chat.isGroupChat && otherParticipants.length === 1 && (
                    <p className="text-xs text-green-600 mt-1">
                      {/* You can add online status here */}
                      Active now
                    </p>
                  )}
                </div>
              </button>
            );
          })
        )}
      </div>
    </div>
  );
};

export default ChatList;


// frontend/src/components/Chat/ChatWindow.jsx
import React, { useState, useEffect, useRef } from 'react';
import { useChat } from '../../context/ChatContext';
import { format } from 'date-fns';
import {
  Send,
  Smile,
  Paperclip,
  Image,
  X,
  Check,
  CheckCheck,
  Phone,
  Video,
  MoreVertical,
  ArrowLeft
} from 'lucide-react';

const ChatWindow = ({ chat, currentUser, onClose }) => {
  const [message, setMessage] = useState('');
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [attachments, setAttachments] = useState([]);
  const [isTyping, setIsTyping] = useState(false);
  const typingTimeoutRef = useRef();
  const messagesEndRef = useRef(null);
  const fileInputRef = useRef(null);
  
  const { messages, sendMessage, sendTyping, typingUsers } = useChat();
  const chatMessages = messages[chat?._id]?.messages || [];

  // Scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages]);

  // Handle typing indicator - FIXED with null check
  useEffect(() => {
    // Add null check for chat
    if (!chat) return;
    
    if (message.trim()) {
      if (!isTyping) {
        setIsTyping(true);
        sendTyping(chat._id, true);
      }

      clearTimeout(typingTimeoutRef.current);
      typingTimeoutRef.current = setTimeout(() => {
        setIsTyping(false);
        sendTyping(chat._id, false);
      }, 1000);
    } else {
      setIsTyping(false);
      sendTyping(chat._id, false);
    }

    return () => {
      clearTimeout(typingTimeoutRef.current);
    };
  }, [message, chat]); // Add chat to dependency array

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!chat || (!message.trim() && attachments.length === 0)) return; // Add null check

    try {
      await sendMessage(chat._id, message);
      setMessage('');
      setAttachments([]);
    } catch (err) {
      console.error('Error sending message:', err);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage(e);
    }
  };

  const handleFileSelect = (type) => {
    fileInputRef.current.accept = type === 'image' ? 'image/*' : '*/*';
    fileInputRef.current.click();
  };

  const handleFileChange = (e) => {
    const files = Array.from(e.target.files);
    setAttachments(prev => [...prev, ...files]);
  };

  const removeAttachment = (index) => {
    setAttachments(prev => prev.filter((_, i) => i !== index));
  };

  const formatMessageTime = (date) => {
    return format(new Date(date), 'HH:mm');
  };

  const formatMessageDate = (date) => {
    const messageDate = new Date(date);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (messageDate.toDateString() === today.toDateString()) {
      return 'Today';
    } else if (messageDate.toDateString() === yesterday.toDateString()) {
      return 'Yesterday';
    } else {
      return format(messageDate, 'MMM dd, yyyy');
    }
  };

  const getOtherParticipants = () => {
    if (!chat) return [];
    return chat.participants?.filter(p => p._id !== currentUser.id) || [];
  };

  const getChatName = () => {
    if (!chat) return 'Chat';
    if (chat.isGroupChat) {
      return chat.groupName || 'Group Chat';
    }
    const other = getOtherParticipants()[0];
    return other ? `${other.firstName} ${other.lastName}` : 'Chat';
  };

  const getChatAvatar = () => {
    if (!chat) return '/default-avatar.png';
    if (chat.isGroupChat) {
      return chat.groupAvatar || '/group-avatar.png';
    }
    const other = getOtherParticipants()[0];
    return other?.profilePhoto || '/default-avatar.png';
  };

  const isUserTyping = () => {
    if (!chat) return false;
    const otherParticipants = getOtherParticipants();
    return otherParticipants.some(p => typingUsers[p._id]);
  };

  const getTypingText = () => {
    if (!chat) return '';
    const typingUsersList = getOtherParticipants()
      .filter(p => typingUsers[p._id])
      .map(p => p.firstName);
    
    if (typingUsersList.length === 1) {
      return `${typingUsersList[0]} is typing...`;
    } else if (typingUsersList.length === 2) {
      return `${typingUsersList[0]} and ${typingUsersList[1]} are typing...`;
    } else if (typingUsersList.length > 2) {
      return 'Several people are typing...';
    }
    return '';
  };

  if (!chat) {
    return (
      <div className="flex-1 flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="w-24 h-24 bg-gray-200 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-12 h-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
          </div>
          <h3 className="text-xl font-medium text-gray-900 mb-2">Your Messages</h3>
          <p className="text-gray-500">Select a chat to start messaging</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col bg-white">
      {/* Chat Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 bg-white">
        <div className="flex items-center space-x-3">
          {onClose && (
            <button
              onClick={onClose}
              className="lg:hidden p-2 hover:bg-gray-100 rounded-full"
            >
              <ArrowLeft className="h-5 w-5 text-gray-600" />
            </button>
          )}
          <div className="relative">
            <img
              src={getChatAvatar()}
              alt={getChatName()}
              className="h-12 w-12 rounded-full object-cover"
            />
            <div className="absolute -bottom-1 -right-1 h-4 w-4 bg-green-500 rounded-full border-2 border-white"></div>
          </div>
          <div>
            <h2 className="text-lg font-semibold text-gray-900">{getChatName()}</h2>
            <p className="text-sm text-gray-500">
              {isUserTyping() ? (
                <span className="text-green-600">{getTypingText()}</span>
              ) : (
                'Active now'
              )}
            </p>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <button className="p-2 hover:bg-gray-100 rounded-full">
            <Phone className="h-5 w-5 text-gray-600" />
          </button>
          <button className="p-2 hover:bg-gray-100 rounded-full">
            <Video className="h-5 w-5 text-gray-600" />
          </button>
          <button className="p-2 hover:bg-gray-100 rounded-full">
            <MoreVertical className="h-5 w-5 text-gray-600" />
          </button>
        </div>
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-6 bg-gray-50">
        {chatMessages.length === 0 ? (
          <div className="h-full flex items-center justify-center">
            <div className="text-center">
              <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-10 h-10 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                No messages yet
              </h3>
              <p className="text-gray-500">
                Send a message to start the conversation
              </p>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {chatMessages.map((msg, index) => {
              const isOwnMessage = msg.sender._id === currentUser.id;
              const showDate = index === 0 || 
                formatMessageDate(msg.createdAt) !== formatMessageDate(chatMessages[index - 1]?.createdAt);

              return (
                <React.Fragment key={msg._id}>
                  {showDate && (
                    <div className="flex justify-center my-4">
                      <span className="px-3 py-1 bg-gray-200 text-gray-600 rounded-full text-xs">
                        {formatMessageDate(msg.createdAt)}
                      </span>
                    </div>
                  )}
                  <div className={`flex ${isOwnMessage ? 'justify-end' : 'justify-start'}`}>
                    <div className={`flex max-w-[70%] ${isOwnMessage ? 'flex-row-reverse' : 'flex-row'}`}>
                      {!isOwnMessage && (
                        <img
                          src={msg.sender.profilePhoto || '/default-avatar.png'}
                          alt={msg.sender.firstName}
                          className="h-8 w-8 rounded-full object-cover mt-1"
                        />
                      )}
                      <div className={`mx-2 ${isOwnMessage ? 'mr-2' : 'ml-2'}`}>
                        <div
                          className={`rounded-2xl px-4 py-2 ${
                            isOwnMessage
                              ? 'bg-blue-600 text-white'
                              : 'bg-white text-gray-900 border border-gray-200'
                          }`}
                        >
                          <p className="text-sm whitespace-pre-wrap break-words">
                            {msg.content}
                          </p>
                          {msg.attachments?.map((att, idx) => (
                            <div key={idx} className="mt-2">
                              {att.type === 'image' ? (
                                <img
                                  src={att.url}
                                  alt="Attachment"
                                  className="max-w-full rounded-lg cursor-pointer hover:opacity-90"
                                  onClick={() => window.open(att.url, '_blank')}
                                />
                              ) : (
                                <a
                                  href={att.url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="flex items-center space-x-2 p-2 bg-gray-100 rounded-lg hover:bg-gray-200"
                                >
                                  <Paperclip className="h-4 w-4" />
                                  <span className="text-sm">{att.filename}</span>
                                </a>
                              )}
                            </div>
                          ))}
                        </div>
                        <div className={`flex items-center space-x-1 mt-1 text-xs ${
                          isOwnMessage ? 'justify-end' : 'justify-start'
                        }`}>
                          <span className="text-gray-500">
                            {formatMessageTime(msg.createdAt)}
                          </span>
                          {isOwnMessage && (
                            <span className="text-gray-400">
                              {msg.readBy?.length > 0 ? (
                                <CheckCheck className="h-3 w-3 text-blue-500" />
                              ) : (
                                <Check className="h-3 w-3" />
                              )}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </React.Fragment>
              );
            })}
            {isUserTyping() && (
              <div className="flex items-center space-x-2 text-gray-500">
                <div className="flex space-x-1">
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.4s' }}></div>
                </div>
                <span className="text-sm">{getTypingText()}</span>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      {/* Message Input */}
      <div className="px-6 py-4 border-t border-gray-200 bg-white">
        {attachments.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-3">
            {attachments.map((file, index) => (
              <div key={index} className="relative group">
                <div className="h-16 w-16 bg-gray-100 rounded-lg flex items-center justify-center border border-gray-200">
                  {file.type.startsWith('image/') ? (
                    <img
                      src={URL.createObjectURL(file)}
                      alt="Attachment preview"
                      className="h-full w-full object-cover rounded-lg"
                    />
                  ) : (
                    <Paperclip className="h-6 w-6 text-gray-400" />
                  )}
                </div>
                <button
                  onClick={() => removeAttachment(index)}
                  className="absolute -top-2 -right-2 p-1 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition"
                >
                  <X className="h-3 w-3" />
                </button>
              </div>
            ))}
          </div>
        )}

        <form onSubmit={handleSendMessage} className="flex items-end space-x-2">
          <div className="flex-1 bg-gray-100 rounded-2xl px-4 py-2">
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              onKeyDown={handleKeyPress}
              placeholder="Type a message..."
              rows="1"
              className="w-full bg-transparent border-0 focus:ring-0 text-sm resize-none max-h-32"
              style={{ minHeight: '40px' }}
            />
          </div>

          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            className="hidden"
            multiple
          />

          <div className="flex items-center space-x-1">
            <button
              type="button"
              onClick={() => handleFileSelect('image')}
              className="p-2 hover:bg-gray-100 rounded-full"
            >
              <Image className="h-5 w-5 text-gray-600" />
            </button>
            <button
              type="button"
              onClick={() => handleFileSelect('file')}
              className="p-2 hover:bg-gray-100 rounded-full"
            >
              <Paperclip className="h-5 w-5 text-gray-600" />
            </button>
            <button
              type="button"
              onClick={() => setShowEmojiPicker(!showEmojiPicker)}
              className="p-2 hover:bg-gray-100 rounded-full"
            >
              <Smile className="h-5 w-5 text-gray-600" />
            </button>
            <button
              type="submit"
              disabled={!message.trim() && attachments.length === 0}
              className="p-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 text-white rounded-full transition"
            >
              <Send className="h-5 w-5" />
            </button>
          </div>
        </form>

        {/* Emoji Picker - You can add an emoji picker library here */}
        {showEmojiPicker && (
          <div className="absolute bottom-20 right-6">
            {/* Add your emoji picker component here */}
          </div>
        )}
      </div>
    </div>
  );
};

export default ChatWindow;


// Navbar.jsx - Complete corrected version
import React, { useState, useEffect, useRef } from "react";
import { FaSearch, FaChevronDown, FaBell, FaEnvelope, FaUser, FaCog, FaQuestionCircle, FaSignOutAlt } from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import { useChat } from '../context/ChatContext';
import { formatDistanceToNow } from 'date-fns';

const Navbar = ({ user }) => {
  const [showDropdown, setShowDropdown] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const navigate = useNavigate();
  
  const { 
    unreadCount, 
    notifications, 
    markNotificationsAsRead,
    requestNotificationPermission 
  } = useChat();
  
  const dropdownRef = useRef(null);
  const notificationRef = useRef(null);

  // Handle clicks outside dropdowns
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowDropdown(false);
      }
      if (notificationRef.current && !notificationRef.current.contains(event.target)) {
        setShowNotifications(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Request notification permission on mount
  useEffect(() => {
    requestNotificationPermission();
  }, [requestNotificationPermission]);

  const handleProfileClick = () => {
    setShowDropdown(false);
    navigate(user?.id ? `/profile/${user.id}` : "/profile");
  };

  const handleLogout = () => {
    localStorage.removeItem("elderlyUser");
    localStorage.removeItem("elderlyToken");
    navigate("/");
  };

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/FriendsPage?search=${searchQuery}`);
    }
  };

  const handleNotificationClick = (notification) => {
    markNotificationsAsRead(notification.chatId);
    navigate(`/chat?user=${notification.sender._id}`);
    setShowNotifications(false);
  };

  const handleViewAllMessages = () => {
    navigate('/chat');
    setShowNotifications(false);
  };

  const unreadNotifications = notifications.filter(n => !n.read).length;

  const formatTime = (timestamp) => {
    try {
      return formatDistanceToNow(new Date(timestamp), { addSuffix: true });
    } catch {
      return '';
    }
  };

  return (
    <nav className="bg-gradient-to-r from-gray-900 to-black border-b border-gray-800 shadow-lg">
      <div className="px-4">
        <div className="flex items-center justify-between h-20">

          {/* Left: Logo */}
          <div className="flex items-center gap-4">
            <div className="w-44 h-12 flex items-center justify-center">
              <img
                src="/Liberta_logo.png"
                alt="Liberta Logo"
                className="w-full h-full object-contain"
                onError={(e) => {
                  e.target.onerror = null;
                  e.target.src = 'https://via.placeholder.com/150x50?text=Liberta';
                }}
              />
            </div>
          </div>

          {/* Center: Search */}
          <div className="flex-1 max-w-2xl mx-8">
            <form onSubmit={handleSearch} className="relative">
              <FaSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 text-sm" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search friends, hobbies, or interests..."
                className="w-full pl-12 pr-4 py-3 bg-gray-800/50 border border-gray-700 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent text-sm transition-all"
              />
            </form>
          </div>

          {/* Welcome + SOS + Notifications */}
          <div className="flex items-center gap-4 mr-4">
            {/* Welcome Message */}
            <div className="bg-gradient-to-r from-gray-800 to-gray-900 rounded-xl px-5 py-2.5">
              <p className="text-sm text-gray-300">
                Welcome Back,{" "}
                <span className="font-semibold text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-500">
                  {user?.firstName || "John"}!
                </span>
              </p>
            </div>

            {/* SOS Button */}
            <button className="relative px-6 py-2.5 bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white rounded-xl font-bold shadow-lg hover:shadow-xl transition-all duration-200 group">
              <span className="absolute inset-0 bg-white opacity-0 group-hover:opacity-20 rounded-xl transition-opacity"></span>
              🚨 SOS
            </button>

            {/* Notification Bell */}
            <div className="relative" ref={notificationRef}>
              <button
                onClick={() => setShowNotifications(!showNotifications)}
                className="relative p-3 bg-gray-800/50 hover:bg-gray-700 rounded-xl transition-all duration-200 group"
              >
                <FaBell className={`text-xl transition-colors ${
                  unreadNotifications > 0 ? 'text-yellow-400' : 'text-gray-400 group-hover:text-cyan-400'
                }`} />
                
                {/* Notification Badge */}
                {unreadNotifications > 0 && (
                  <>
                    <span className="absolute -top-1 -right-1 min-w-[20px] h-5 bg-gradient-to-r from-red-500 to-pink-500 text-white text-xs font-bold rounded-full flex items-center justify-center px-1 shadow-lg">
                      {unreadNotifications > 9 ? '9+' : unreadNotifications}
                    </span>
                    <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 rounded-full animate-ping opacity-75"></span>
                  </>
                )}
              </button>

              {/* Notifications Dropdown */}
              {showNotifications && (
                <div className="absolute right-0 mt-3 w-96 bg-gray-900 border border-gray-800 rounded-2xl shadow-2xl overflow-hidden z-50">
                  {/* Header */}
                  <div className="p-5 bg-gradient-to-r from-cyan-600 to-blue-600">
                    <div className="flex items-center justify-between">
                      <h3 className="font-semibold text-white text-lg">Notifications</h3>
                      {unreadNotifications > 0 && (
                        <span className="px-2.5 py-1 bg-white/20 text-white text-xs font-medium rounded-full">
                          {unreadNotifications} new
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-white/80 mt-1">
                      {unreadCount > 0 ? `${unreadCount} unread messages` : 'No new messages'}
                    </p>
                  </div>

                  {/* Notifications List */}
                  <div className="max-h-96 overflow-y-auto">
                    {notifications.length === 0 ? (
                      <div className="p-8 text-center">
                        <div className="w-16 h-16 bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-4">
                          <FaBell className="text-2xl text-gray-600" />
                        </div>
                        <p className="text-gray-400 font-medium">No notifications</p>
                        <p className="text-xs text-gray-500 mt-1">
                          When you get messages, they'll appear here
                        </p>
                      </div>
                    ) : (
                      notifications.map((notification) => (
                        <button
                          key={notification.id}
                          onClick={() => handleNotificationClick(notification)}
                          className={`w-full p-4 text-left hover:bg-gray-800/50 transition-colors border-b border-gray-800 last:border-0 group ${
                            !notification.read ? 'bg-gray-800/30' : ''
                          }`}
                        >
                          <div className="flex items-start space-x-4">
                            {/* Avatar */}
                            <div className="relative flex-shrink-0">
                              <img
                                src={notification.sender.profilePhoto || 'https://via.placeholder.com/40'}
                                alt={notification.sender.firstName}
                                className="h-12 w-12 rounded-full object-cover border-2 border-gray-700 group-hover:border-cyan-500 transition-colors"
                                onError={(e) => {
                                  e.target.onerror = null;
                                  e.target.src = 'https://via.placeholder.com/40';
                                }}
                              />
                              {!notification.read && (
                                <span className="absolute -top-1 -right-1 w-3 h-3 bg-cyan-500 rounded-full"></span>
                              )}
                            </div>

                            {/* Content */}
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center justify-between mb-1">
                                <p className="text-sm font-semibold text-white">
                                  {notification.sender.firstName} {notification.sender.lastName}
                                </p>
                                <p className="text-xs text-gray-500">
                                  {formatTime(notification.timestamp)}
                                </p>
                              </div>
                              <p className="text-sm text-gray-400 truncate max-w-[200px]">
                                {notification.content}
                              </p>
                              <p className="text-xs text-cyan-500 mt-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                Click to reply
                              </p>
                            </div>

                            {/* Icon - FIXED: Changed from FaMessage to FaEnvelope */}
                            <FaEnvelope className="h-4 w-4 text-gray-600 group-hover:text-cyan-500 transition-colors" />
                          </div>
                        </button>
                      ))
                    )}
                  </div>

                  {/* Footer */}
                  {notifications.length > 0 && (
                    <div className="p-4 border-t border-gray-800 bg-gray-900/50">
                      <div className="flex items-center justify-between">
                        <button
                          onClick={handleViewAllMessages}
                          className="text-sm text-cyan-500 hover:text-cyan-400 font-medium transition-colors"
                        >
                          View all messages
                        </button>
                        <span className="text-xs text-gray-600">
                          {unreadCount} unread
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Right: Profile Dropdown */}
          <div className="relative" ref={dropdownRef}>
            <button
              onClick={() => setShowDropdown(!showDropdown)}
              className="flex items-center gap-3 p-2 hover:bg-gray-800/50 rounded-xl transition-all duration-200 group"
            >
              {/* Profile Image with Badge */}
              <div className="relative">
                <div className="w-14 h-14 rounded-full bg-gradient-to-r from-cyan-500 to-blue-600 p-[2px]">
                  <div className="w-full h-full rounded-full bg-gray-900 flex items-center justify-center overflow-hidden">
                    {user?.profilePhoto ? (
                      <img
                        src={user.profilePhoto}
                        alt={user.firstName}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <span className="text-white font-bold text-xl">
                        {user?.firstName?.charAt(0) || "U"}
                      </span>
                    )}
                  </div>
                </div>
                
                {/* Online Status */}
                <div className="absolute bottom-0 right-0 w-4 h-4 bg-green-500 rounded-full border-2 border-gray-900"></div>
              </div>

              {/* User Info */}
              <div className="hidden md:block text-left">
                <p className="text-white font-semibold text-lg">
                  {user?.firstName || "User"} {user?.lastName || ""}
                </p>
                <p className="text-xs text-gray-500">Online</p>
              </div>

              <FaChevronDown className={`text-gray-400 transition-transform duration-200 ${
                showDropdown ? 'rotate-180' : ''
              }`} />
            </button>

            {/* Profile Dropdown Menu */}
            {showDropdown && (
              <div className="absolute right-0 mt-3 w-64 bg-gray-900 border border-gray-800 rounded-xl shadow-2xl overflow-hidden z-50">
                {/* User Summary */}
                <div className="p-5 bg-gradient-to-r from-gray-800 to-gray-900">
                  <p className="text-sm text-gray-400">Signed in as</p>
                  <p className="text-white font-semibold truncate">
                    {user?.email || "user@example.com"}
                  </p>
                </div>

                {/* Menu Items */}
                <div className="py-2">
                  <button
                    onClick={handleProfileClick}
                    className="w-full text-left px-5 py-3 text-sm text-gray-300 hover:bg-gray-800 hover:text-white transition-colors flex items-center space-x-3"
                  >
                    <FaUser className="text-cyan-500" />
                    <span>My Profile</span>
                  </button>

                  <button
                    onClick={() => {
                      setShowDropdown(false);
                      navigate("/settings");
                    }}
                    className="w-full text-left px-5 py-3 text-sm text-gray-300 hover:bg-gray-800 hover:text-white transition-colors flex items-center space-x-3"
                  >
                    <FaCog className="text-blue-500" />
                    <span>Settings</span>
                  </button>

                  <button
                    onClick={() => {
                      setShowDropdown(false);
                      navigate("/HelpPage");
                    }}
                    className="w-full text-left px-5 py-3 text-sm text-gray-300 hover:bg-gray-800 hover:text-white transition-colors flex items-center space-x-3"
                  >
                    <FaQuestionCircle className="text-purple-500" />
                    <span>Help Center</span>
                  </button>

                  <div className="border-t border-gray-800 my-2"></div>

                  <button
                    onClick={handleLogout}
                    className="w-full text-left px-5 py-3 text-sm text-red-400 hover:bg-red-500/10 hover:text-red-300 transition-colors flex items-center space-x-3"
                  >
                    <FaSignOutAlt />
                    <span>Log Out</span>
                  </button>
                </div>
              </div>
            )}
          </div>

        </div>
      </div>
    </nav>
  );
};

export default Navbar;

// frontend/src/components/NotificationBell.jsx
import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useChat } from '../context/ChatContext';
import { FaBell, FaCheckCircle, FaMessage } from 'react-icons/fa';
import { formatDistanceToNow } from 'date-fns';

const NotificationBell = () => {
  const [isOpen, setIsOpen] = useState(false);
  const { notifications, markNotificationsAsRead, unreadCount } = useChat();
  const navigate = useNavigate();
  const dropdownRef = useRef(null);

  const unreadNotifications = notifications.filter(n => !n.read).length;

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleNotificationClick = (notification) => {
    markNotificationsAsRead(notification.chatId);
    navigate(`/chat?user=${notification.sender._id}`);
    setIsOpen(false);
  };

  const formatTime = (timestamp) => {
    try {
      return formatDistanceToNow(new Date(timestamp), { addSuffix: true });
    } catch {
      return '';
    }
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 text-gray-600 hover:text-blue-600 transition-colors"
      >
        <FaBell className="text-xl" />
        {unreadNotifications > 0 && (
          <>
            <span className="absolute top-0 right-0 min-w-[18px] h-[18px] bg-red-500 text-white text-xs rounded-full flex items-center justify-center px-1 animate-pulse">
              {unreadNotifications > 9 ? '9+' : unreadNotifications}
            </span>
            <span className="absolute top-0 right-0 w-2 h-2 bg-red-500 rounded-full animate-ping"></span>
          </>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 bg-white rounded-xl shadow-2xl border border-gray-200 overflow-hidden z-50">
          <div className="p-4 border-b border-gray-200 bg-gradient-to-r from-blue-500 to-purple-600">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-white">Notifications</h3>
              {unreadNotifications > 0 && (
                <span className="px-2 py-1 bg-white/20 text-white text-xs rounded-full">
                  {unreadNotifications} new
                </span>
              )}
            </div>
          </div>

          <div className="max-h-96 overflow-y-auto">
            {notifications.length === 0 ? (
              <div className="p-8 text-center text-gray-500">
                <FaCheckCircle className="h-12 w-12 mx-auto mb-3 text-gray-300" />
                <p>No notifications</p>
              </div>
            ) : (
              notifications.map((notification) => (
                <button
                  key={notification.id}
                  onClick={() => handleNotificationClick(notification)}
                  className={`w-full p-4 text-left hover:bg-gray-50 transition-colors border-b border-gray-100 last:border-0 ${
                    !notification.read ? 'bg-blue-50' : ''
                  }`}
                >
                  <div className="flex items-start space-x-3">
                    <div className="relative flex-shrink-0">
                      <img
                        src={notification.sender.profilePhoto || '/default-avatar.png'}
                        alt={notification.sender.firstName}
                        className="h-10 w-10 rounded-full object-cover"
                      />
                      {!notification.read && (
                        <span className="absolute -top-1 -right-1 w-3 h-3 bg-blue-500 rounded-full"></span>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900">
                        {notification.sender.firstName} {notification.sender.lastName}
                      </p>
                      <p className="text-sm text-gray-600 truncate">
                        {notification.content}
                      </p>
                      <p className="text-xs text-gray-400 mt-1">
                        {formatTime(notification.timestamp)}
                      </p>
                    </div>
                    <FaMessage className="h-4 w-4 text-gray-400" />
                  </div>
                </button>
              ))
            )}
          </div>

          {notifications.length > 0 && (
            <div className="p-3 border-t border-gray-200 bg-gray-50">
              <button
                onClick={() => {
                  navigate('/chat');
                  setIsOpen(false);
                }}
                className="w-full text-center text-sm text-blue-600 hover:text-blue-700 font-medium"
              >
                View all messages
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default NotificationBell;


// Sidebar.jsx
import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useChat } from '../context/ChatContext';
import {
  FaHome,
  FaUser,
  FaUsers,
  FaComment,
  FaFirstAid,
  FaCog,
  FaSignOutAlt
} from "react-icons/fa";

const Sidebar = ({ user, onLogout }) => {
  const navigate = useNavigate();
  const { unreadCount, fetchChats } = useChat();
  const [activePath, setActivePath] = useState(window.location.pathname);

  // Fetch chats periodically to update unread count
  useEffect(() => {
    fetchChats();
    
    // Refresh chats every 30 seconds to get latest unread counts
    const interval = setInterval(() => {
      fetchChats();
    }, 30000);
    
    return () => clearInterval(interval);
  }, [fetchChats]);

  // Update active path when navigating
  useEffect(() => {
    setActivePath(window.location.pathname);
  }, [navigate]);

  const menuItems = [
    { icon: <FaHome />, label: "Home", link: "/liberta-home" },
    {
      icon: <FaUser />,
      label: "Profile",
      link: user?.id ? `/profile/${user.id}` : "/profile"
    },
    { icon: <FaUsers />, label: "Friends", link: "/FriendsPage" },
    { 
      icon: (
        <div className="relative inline-block">
          <FaComment className="text-2xl" />
          {unreadCount > 0 && (
            <span className="absolute -top-2 -right-2 min-w-[20px] h-5 bg-gradient-to-r from-red-500 to-pink-500 text-white text-xs font-bold rounded-full flex items-center justify-center px-1 shadow-lg animate-pulse">
              {unreadCount > 99 ? '99+' : unreadCount}
            </span>
          )}
        </div>
      ), 
      label: "Chat", 
      link: "/chat",
      badge: unreadCount > 0 ? unreadCount : null
    },
    { icon: <FaFirstAid />, label: "Help", link: "/HelpPage" },
    { icon: <FaCog />, label: "Settings", link: "/settings" }
  ];

  const isActive = (link) => {
    if (link === "/liberta-home" && activePath === "/liberta-home") return true;
    if (link.includes("/profile") && activePath.includes("/profile")) return true;
    if (link === "/chat" && activePath.includes("/chat")) return true;
    return activePath === link;
  };

  return (
    <div className="w-32 min-w-32 h-screen bg-gradient-to-b from-gray-900 to-black border-r border-gray-800 shadow-xl">
      <div className="flex flex-col h-full py-4">

        {/* LOGO */}
        <div className="py-6 mb-4 border-b border-gray-800">
          <h2 className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-500 text-center">
            Liberta
          </h2>
        </div>

        {/* MENU */}
        <nav className="flex-1 px-3 space-y-2 overflow-y-auto">
          {menuItems.map((item, index) => (
            <button
              key={index}
              onClick={() => navigate(item.link)}
              className={`relative flex flex-col items-center justify-center w-full px-3 py-4 rounded-xl transition-all duration-200 group ${
                isActive(item.link)
                  ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-white shadow-lg'
                  : 'text-gray-400 hover:text-cyan-400 hover:bg-gray-800/50'
              }`}
            >
              <span className={`text-3xl mb-1 transition-transform group-hover:scale-110 ${
                isActive(item.link) ? 'text-white' : 'text-gray-400'
              }`}>
                {item.icon}
              </span>
              <span className="text-xs font-medium">{item.label}</span>
              
              {/* Extra indicator for chat with unread messages */}
              {item.label === "Chat" && unreadCount > 0 && (
                <div className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full animate-ping"></div>
              )}
            </button>
          ))}
        </nav>

        {/* USER INFO & LOGOUT */}
        <div className="px-3 mt-auto">
          {user && (
            <div className="mb-4 p-3 bg-gray-800/30 rounded-xl">
              <div className="flex items-center justify-center space-x-2 mb-2">
                <img
                  src={user.profilePhoto || '/default-avatar.png'}
                  alt={user.firstName}
                  className="w-10 h-10 rounded-full object-cover border-2 border-cyan-500"
                />
              </div>
              <p className="text-xs text-center text-gray-300 truncate">
                {user.firstName} {user.lastName}
              </p>
            </div>
          )}
          
          <button
            onClick={onLogout}
            className="flex flex-col items-center w-full px-3 py-4 text-gray-400 hover:text-red-400 hover:bg-red-500/10 rounded-xl transition-all duration-200 group"
          >
            <FaSignOutAlt className="text-3xl mb-1 group-hover:scale-110 transition-transform" />
            <span className="text-xs font-medium">Log Out</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default Sidebar;


// frontend/src/context/ChatContext.jsx (updated with better notification handling)
import React, { createContext, useContext, useState, useEffect, useRef, useCallback } from 'react';
import io from 'socket.io-client';
import axiosInstance from '../api/axiosConfig';

const ChatContext = createContext();

export const useChat = () => {
  const context = useContext(ChatContext);
  if (!context) {
    throw new Error('useChat must be used within a ChatProvider');
  }
  return context;
};

export const ChatProvider = ({ children, currentUser }) => {
  const [socket, setSocket] = useState(null);
  const [chats, setChats] = useState([]);
  const [activeChat, setActiveChat] = useState(null);
  const [messages, setMessages] = useState({});
  const [onlineUsers, setOnlineUsers] = useState(new Set());
  const [typingUsers, setTypingUsers] = useState({});
  const [loading, setLoading] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [notifications, setNotifications] = useState([]);
  
  const socketRef = useRef();
  const notificationSoundRef = useRef(null);

  // Initialize notification sound
  useEffect(() => {
    notificationSoundRef.current = new Audio('/notification.mp3'); // Add this sound file to your public folder
  }, []);

  // Initialize socket connection
  useEffect(() => {
    if (!currentUser?.id) return;

    const token = localStorage.getItem('elderlyToken');
    
    const newSocket = io('http://localhost:5000', {
      auth: { token },
      transports: ['websocket'],
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000
    });

    socketRef.current = newSocket;
    setSocket(newSocket);

    newSocket.on('connect', () => {
      console.log('Socket connected');
    });

    newSocket.on('new-message', handleNewMessage);
    newSocket.on('user-typing', handleUserTyping);
    newSocket.on('messages-read', handleMessagesRead);
    newSocket.on('user-online', handleUserOnline);
    newSocket.on('user-offline', handleUserOffline);

    // Request notification permission
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }

    return () => {
      newSocket.disconnect();
    };
  }, [currentUser]);

  // Handle user online status
  const handleUserOnline = useCallback(({ userId }) => {
    setOnlineUsers(prev => new Set(prev).add(userId));
  }, []);

  const handleUserOffline = useCallback(({ userId }) => {
    setOnlineUsers(prev => {
      const newSet = new Set(prev);
      newSet.delete(userId);
      return newSet;
    });
  }, []);

  // Fetch all chats
  const fetchChats = useCallback(async () => {
    try {
      setLoading(true);
      const response = await axiosInstance.get('/chat/chats');
      if (response.data.success) {
        setChats(response.data.chats);
        
        // Calculate total unread count
        const totalUnread = response.data.chats.reduce(
          (acc, chat) => acc + (chat.unreadCount || 0), 
          0
        );
        setUnreadCount(totalUnread);
        
        // Update document title with unread count
        if (totalUnread > 0) {
          document.title = `(${totalUnread}) Liberta Chat`;
        } else {
          document.title = 'Liberta';
        }
      }
    } catch (err) {
      console.error('Error fetching chats:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  // Get or create chat with user
  const getOrCreateChat = useCallback(async (userId) => {
    try {
      const response = await axiosInstance.get(`/chat/chat/${userId}`);
      if (response.data.success) {
        const chat = response.data.chat;
        
        // Add to chats list if not already there
        setChats(prev => {
          const exists = prev.find(c => c._id === chat._id);
          if (exists) return prev;
          return [chat, ...prev];
        });
        
        // Join chat room
        if (socketRef.current) {
          socketRef.current.emit('join-chat', chat._id);
        }
        
        // Fetch messages for this chat
        await fetchMessages(chat._id);
        
        return chat;
      }
    } catch (err) {
      console.error('Error getting/creating chat:', err);
      throw err;
    }
  }, []);

  // Fetch messages for a chat
  const fetchMessages = useCallback(async (chatId, page = 1) => {
    try {
      const response = await axiosInstance.get(`/chat/messages/${chatId}?page=${page}`);
      if (response.data.success) {
        setMessages(prev => ({
          ...prev,
          [chatId]: {
            messages: response.data.messages,
            total: response.data.total,
            page: response.data.page,
            pages: response.data.pages
          }
        }));
        
        // Update unread count in chats list
        setChats(prev => prev.map(chat => 
          chat._id === chatId 
            ? { ...chat, unreadCount: 0 }
            : chat
        ));
        
        // Recalculate total unread
        updateTotalUnread();
      }
    } catch (err) {
      console.error('Error fetching messages:', err);
    }
  }, []);

  // Send a message
  const sendMessage = useCallback(async (chatId, content) => {
    try {
      const response = await axiosInstance.post(`/chat/message/${chatId}`, { content });
      
      if (response.data.success) {
        const newMessage = response.data.message;
        
        // Add to local messages
        setMessages(prev => {
          const chatMessages = prev[chatId] || { messages: [] };
          return {
            ...prev,
            [chatId]: {
              ...chatMessages,
              messages: [...chatMessages.messages, newMessage]
            }
          };
        });
        
        // Emit via socket
        if (socketRef.current) {
          socketRef.current.emit('send-message', {
            chatId,
            message: newMessage
          });
        }
        
        // Update last message in chats list
        setChats(prev => prev.map(chat => 
          chat._id === chatId
            ? { 
                ...chat, 
                lastMessage: newMessage,
                updatedAt: new Date()
              }
            : chat
        ));
        
        return newMessage;
      }
    } catch (err) {
      console.error('Error sending message:', err);
      throw err;
    }
  }, []);

  // Send typing indicator
  const sendTyping = useCallback((chatId, isTyping) => {
    if (socketRef.current) {
      socketRef.current.emit('typing', { chatId, isTyping });
    }
  }, []);

  // Handle new message from socket - IMPROVED NOTIFICATIONS
  const handleNewMessage = useCallback((data) => {
    const { chatId, ...message } = data;
    
    // Check if this is a new message (not from current user)
    const isFromCurrentUser = message.sender._id === currentUser?.id;
    
    // Add message to state
    setMessages(prev => {
      const chatMessages = prev[chatId] || { messages: [] };
      
      // Check if message already exists to avoid duplicates
      const messageExists = chatMessages.messages.some(m => m._id === message._id);
      if (messageExists) return prev;
      
      return {
        ...prev,
        [chatId]: {
          ...chatMessages,
          messages: [...chatMessages.messages, message]
        }
      };
    });
    
    // Update last message and unread count in chats list
    setChats(prev => {
      const updatedChats = prev.map(chat => {
        if (chat._id === chatId) {
          // Increment unread count if not active chat and not from current user
          const isActive = activeChat?._id === chatId;
          const shouldIncrement = !isActive && !isFromCurrentUser;
          const newUnreadCount = shouldIncrement ? (chat.unreadCount || 0) + 1 : chat.unreadCount || 0;
          
          return {
            ...chat,
            lastMessage: message,
            updatedAt: new Date(),
            unreadCount: newUnreadCount
          };
        }
        return chat;
      });
      
      // Sort chats by updatedAt
      return updatedChats.sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));
    });
    
    // Update total unread count
    updateTotalUnread();
    
    // Show notification if message is from someone else and chat is not active
    if (!isFromCurrentUser && activeChat?._id !== chatId) {
      // Play notification sound
      if (notificationSoundRef.current) {
        notificationSoundRef.current.play().catch(e => console.log('Audio play failed:', e));
      }
      
      // Show browser notification
      if ('Notification' in window && Notification.permission === 'granted') {
        const senderName = message.sender.firstName;
        const messagePreview = message.content.length > 50 
          ? message.content.substring(0, 50) + '...' 
          : message.content;
        
        const notification = new Notification(`New message from ${senderName}`, {
          body: messagePreview,
          icon: message.sender.profilePhoto || '/default-avatar.png',
          badge: '/favicon.ico',
          tag: chatId,
          renotify: true
        });
        
        notification.onclick = () => {
          window.focus();
          // Navigate to chat
          window.location.href = '/chat';
        };
      }
      
      // Add to in-app notifications
      setNotifications(prev => [
        {
          id: message._id,
          chatId,
          sender: message.sender,
          content: message.content,
          timestamp: new Date(),
          read: false
        },
        ...prev
      ].slice(0, 10)); // Keep only last 10 notifications
    }
  }, [activeChat, currentUser]);

  // Handle user typing
  const handleUserTyping = useCallback(({ userId, isTyping }) => {
    setTypingUsers(prev => ({
      ...prev,
      [userId]: isTyping
    }));
    
    // Clear typing indicator after 3 seconds if still true
    if (isTyping) {
      setTimeout(() => {
        setTypingUsers(prev => ({
          ...prev,
          [userId]: false
        }));
      }, 3000);
    }
  }, []);

  // Handle messages read
  const handleMessagesRead = useCallback(({ userId, messageIds }) => {
    // Update message read status
    setMessages(prev => {
      const updated = { ...prev };
      Object.keys(updated).forEach(chatId => {
        updated[chatId] = {
          ...updated[chatId],
          messages: updated[chatId].messages.map(msg => {
            if (messageIds.includes(msg._id)) {
              return {
                ...msg,
                readBy: [...(msg.readBy || []), { user: userId, readAt: new Date() }]
              };
            }
            return msg;
          })
        };
      });
      return updated;
    });
  }, []);

  // Update total unread count and document title
  const updateTotalUnread = useCallback(() => {
    setChats(prevChats => {
      const total = prevChats.reduce((acc, chat) => acc + (chat.unreadCount || 0), 0);
      setUnreadCount(total);
      
      // Update document title with unread count
      if (total > 0) {
        document.title = `(${total}) Liberta Chat`;
      } else {
        document.title = 'Liberta';
      }
      
      return prevChats;
    });
  }, []);

  // Mark notifications as read
  const markNotificationsAsRead = useCallback((chatId) => {
    setNotifications(prev => 
      prev.map(notif => 
        notif.chatId === chatId ? { ...notif, read: true } : notif
      )
    );
  }, []);

  // Clear all notifications
  const clearNotifications = useCallback(() => {
    setNotifications([]);
  }, []);

  // Request notification permission
  const requestNotificationPermission = useCallback(async () => {
    if ('Notification' in window) {
      if (Notification.permission === 'granted') {
        return true;
      } else if (Notification.permission !== 'denied') {
        const permission = await Notification.requestPermission();
        return permission === 'granted';
      }
    }
    return false;
  }, []);

  // Join chat room when active chat changes
  useEffect(() => {
    if (activeChat && socketRef.current) {
      socketRef.current.emit('join-chat', activeChat._id);
      // Mark notifications as read for this chat
      markNotificationsAsRead(activeChat._id);
    }
  }, [activeChat, markNotificationsAsRead]);

  // Initial fetch
  useEffect(() => {
    if (currentUser) {
      fetchChats();
    }
  }, [currentUser, fetchChats]);

  return (
    <ChatContext.Provider value={{
      socket,
      chats,
      activeChat,
      messages,
      onlineUsers,
      typingUsers,
      loading,
      unreadCount,
      notifications,
      fetchChats,
      getOrCreateChat,
      fetchMessages,
      sendMessage,
      sendTyping,
      setActiveChat,
      markNotificationsAsRead,
      clearNotifications,
      requestNotificationPermission
    }}>
      {children}
    </ChatContext.Provider>
  );
};


// frontend/src/Pages/ChatPage.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useChat } from '../context/ChatContext';
import ChatInterface from '../components/Chat/ChatInterface';
import Sidebar from '../components/Sidebar';
import Navbar from '../components/Navbar';

const ChatPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [currentUser, setCurrentUser] = useState(null);
  const [initialLoading, setInitialLoading] = useState(true);
  const { getOrCreateChat, setActiveChat } = useChat();

  // Get userId from URL query parameters
  const queryParams = new URLSearchParams(location.search);
  const selectedUserId = queryParams.get('user');

  useEffect(() => {
    const token = localStorage.getItem('elderlyToken');
    const userData = localStorage.getItem('elderlyUser');

    if (!token || !userData) {
      navigate('/login');
      return;
    }

    try {
      const parsedUser = JSON.parse(userData);
      setCurrentUser(parsedUser);
    } catch (err) {
      navigate('/login');
    } finally {
      setInitialLoading(false);
    }
  }, [navigate]);

  // Handle selected user from URL
  useEffect(() => {
    const initializeChat = async () => {
      if (selectedUserId && currentUser && currentUser.id !== selectedUserId) {
        try {
          // Create or get existing chat with the selected user
          const chat = await getOrCreateChat(selectedUserId);
          if (chat) {
            setActiveChat(chat);
          }
        } catch (err) {
          console.error('Error creating chat:', err);
        }
      }
    };

    if (currentUser && selectedUserId) {
      initializeChat();
    }
  }, [selectedUserId, currentUser, getOrCreateChat, setActiveChat]);

  const handleLogout = () => {
    localStorage.clear();
    navigate('/login');
  };

  if (initialLoading || !currentUser) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cyan-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900">
      <div className="flex h-screen">
        <Sidebar user={currentUser} onLogout={handleLogout} />
        
        <div className="flex-1 flex flex-col">
          <Navbar user={currentUser} />
          
          <div className="flex-1 p-4 bg-gray-100">
            <ChatInterface currentUser={currentUser} />
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChatPage;


// App.jsx
import { Routes, Route } from "react-router-dom";
import { ChatProvider } from './context/ChatContext';
import "./App.css";

import ElderlyLoginForm from "./components/ElderlyLoginForm";
import ElderlyRegistrationForm from "./components/ElderlyRegistrationForm";
import LibertaHomePage from "./Pages/LibertaHomePage";
import MyProfilePage from "./Pages/MyProfilePage";
import FriendsPage from "./Pages/FriendsPage";
import HelpPage from "./Pages/HelpPage";
import ChatPage from "./Pages/ChatPage";

function App() {
  return (
    <ChatProvider>
      <Routes>
        <Route path="/login" element={<ElderlyRegistrationForm />} />
        <Route path="/" element={<ElderlyLoginForm />} />
        <Route path="/liberta-home" element={<LibertaHomePage />} />
        <Route path="/profile/:id" element={<MyProfilePage />} />
        <Route path="/FriendsPage" element={<FriendsPage />} />
        <Route path="/HelpPage" element={<HelpPage />} />
        <Route path="/chat" element={<ChatPage />} />
      </Routes>
    </ChatProvider>
  );
}

export default App;


there in this chat part all things ok.. other chat show that each user chat .. now i want to update that, there when get a message from other there show a count how many msges get and blink a red light.. but when i click that chat and when i seen it that count already have same like before. that message amount show already after when i click and seen that message in side bar.. so no i want before i seen that message show that message count in side bar and after i click and seen that message reduse that seen chat amount .. i think u can understand wht i say like whatsapp.  before read show show many message have and after read not want to show that person chat count. beacouse on now that user read that chat.. like whaspp.. userstand it and give me code hopw to fix that