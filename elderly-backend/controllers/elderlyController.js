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

// controllers/elderlyController.js
// controllers/elderlyController.js
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

    // Return ALL user fields in the response
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
        coverPhoto: user.coverPhoto,
        phone: user.phone,
        address: user.address,
        city: user.city,
        state: user.state,
        zipCode: user.zipCode,
        emergencyContact: user.emergencyContact,
        emergencyPhone: user.emergencyPhone,
        emergencyEmail: user.emergencyEmail,
        hobbies: user.hobbies,
        helpNeeded: user.helpNeeded,
        mobility: user.mobility,
        birthDate: user.birthDate
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

// controllers/elderlyController.js
exports.getCurrentUser = async (req, res) => {
  try {
    // Make sure to select ALL fields except password
    const user = await ElderlyUser.findById(req.user.id).select("-password");
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    console.log("Current user fetched with ALL fields:", {
      id: user._id,
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      emergencyPhone: user.emergencyPhone, // This should now show
      emergencyContact: user.emergencyContact
    });

    res.json({
      success: true,
      user: {
        id: user._id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        profilePhoto: user.profilePhoto,
        coverPhoto: user.coverPhoto,
        phone: user.phone,
        address: user.address,
        city: user.city,
        state: user.state,
        zipCode: user.zipCode,
        emergencyContact: user.emergencyContact,
        emergencyPhone: user.emergencyPhone,
        emergencyEmail: user.emergencyEmail,
        hobbies: user.hobbies,
        helpNeeded: user.helpNeeded,
        mobility: user.mobility,
        birthDate: user.birthDate
      },
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

// Update in controllers/elderlyController.js
// Replace the existing getAllPosts with this:

exports.getAllPosts = async (req, res) => {
  try {
    const currentUserId = req.user.id;
    const { page = 1, limit = 10 } = req.query;
    const skip = (page - 1) * limit;

    // Get current user with following list
    const currentUser = await ElderlyUser.findById(currentUserId);
    
    // Get posts from followed users AND own posts
    const followingIds = [...currentUser.following, currentUserId];

    const posts = await Post.find({ 
      user: { $in: followingIds },
      privacy: "public"
    })
      .populate("user", "firstName lastName profilePhoto")
      .populate("comments.user", "firstName lastName profilePhoto")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Post.countDocuments({ 
      user: { $in: followingIds },
      privacy: "public"
    });

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


// ================= ADMIN CRUD OPERATIONS =================

// Delete user (for admin)
exports.deleteElderlyUser = async (req, res) => {
  try {
    const user = await ElderlyUser.findById(req.params.id);
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found"
      });
    }

    // Check if user is authorized (admin or self)
    // For now, we'll allow if they're the same user or if they're an admin
    // You might want to add proper admin role checking later
    if (req.user.id !== user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: "Not authorized to delete this user"
      });
    }

    await user.deleteOne();
    
    res.json({
      success: true,
      message: "User deleted successfully"
    });
  } catch (err) {
    console.error("Delete user error:", err);
    res.status(500).json({
      success: false,
      message: "Error deleting user"
    });
  }
};

// Get single user by ID (for admin)
exports.getUserById = async (req, res) => {
  try {
    const user = await ElderlyUser.findById(req.params.id).select("-password");
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found"
      });
    }
    
    // Get user stats
    const postCount = await Post.countDocuments({ user: user._id });
    const chatCount = await Chat.countDocuments({ participants: user._id });
    
    res.json({
      success: true,
      user: {
        ...user.toObject(),
        stats: {
          posts: postCount,
          chats: chatCount
        }
      }
    });
  } catch (err) {
    console.error("Get user by ID error:", err);
    res.status(500).json({
      success: false,
      message: "Error fetching user"
    });
  }
};

// Toggle user active status (for admin)
exports.toggleUserStatus = async (req, res) => {
  try {
    const { isActive } = req.body;
    
    const user = await ElderlyUser.findById(req.params.id);
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found"
      });
    }

    user.isActive = isActive !== undefined ? isActive : !user.isActive;
    await user.save();
    
    res.json({
      success: true,
      message: `User ${user.isActive ? 'activated' : 'deactivated'} successfully`,
      isActive: user.isActive
    });
  } catch (err) {
    console.error("Toggle user status error:", err);
    res.status(500).json({
      success: false,
      message: "Error updating user status"
    });
  }
};

// Get all posts (admin version - no filters, all posts)
exports.getAllPostsAdmin = async (req, res) => {
  try {
    const posts = await Post.find({})
      .populate("user", "firstName lastName profilePhoto email")
      .populate("comments.user", "firstName lastName profilePhoto")
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      posts
    });
  } catch (err) {
    console.error("Get all posts admin error:", err);
    res.status(500).json({
      success: false,
      message: "Error fetching posts"
    });
  }
};

// Add this to your existing elderlyController.js

// Google OAuth success handler
// Google OAuth success handler - REPLACE THIS ENTIRE FUNCTION
exports.googleAuthSuccess = async (req, res) => {
  try {
    console.log("🔐 Google auth success callback triggered");
    console.log("req.user:", req.user);
    
    if (!req.user) {
      console.error("❌ No user in request");
      return res.redirect('http://localhost:5173/login?error=auth_failed');
    }
    
    // Generate JWT token
    const token = generateUserToken(req.user._id);
    
    // Get FULL user data with ALL fields
    const user = await ElderlyUser.findById(req.user._id).select("-password").lean();
    
    console.log("✅ Google auth successful for user:", user.email);
    console.log("📋 User data being sent:", {
      id: user._id,
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      profilePhoto: user.profilePhoto,
      emergencyPhone: user.emergencyPhone,
      hobbies: user.hobbies
    });
    
    // Encode user data for URL parameters
    const redirectUrl = `http://localhost:5173/auth/google/callback?token=${token}&userId=${user._id}&firstName=${encodeURIComponent(user.firstName || '')}&lastName=${encodeURIComponent(user.lastName || '')}&email=${encodeURIComponent(user.email || '')}&profilePhoto=${encodeURIComponent(user.profilePhoto || '')}&phone=${encodeURIComponent(user.phone || '')}&emergencyPhone=${encodeURIComponent(user.emergencyPhone || '')}`;
    
    console.log("🔄 Redirecting to frontend");
    res.redirect(redirectUrl);
  } catch (err) {
    console.error('❌ Google auth success error:', err);
    res.redirect('http://localhost:5173/login?error=server_error');
  }
};

// Get user by Google ID (for session restoration)
exports.getUserByGoogleId = async (req, res) => {
  try {
    const { googleId } = req.params;
    const user = await ElderlyUser.findOne({ googleId }).select('-password');
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }
    
    res.json({
      success: true,
      user
    });
  } catch (err) {
    console.error('Get user by Google ID error:', err);
    res.status(500).json({
      success: false,
      message: 'Error fetching user'
    });
  }
};


// Update your existing getSuggestedFriends to use NLP
exports.getSuggestedFriends = exports.getNLPSuggestedFriends;