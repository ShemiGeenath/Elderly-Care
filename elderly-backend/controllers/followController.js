// controllers/followController.js
const ElderlyUser = require("../models/ElderlyUser");
const Post = require("../models/Post");

// Follow a user
exports.followUser = async (req, res) => {
  try {
    const { userId } = req.params; // User to follow
    const currentUserId = req.user.id;

    if (userId === currentUserId) {
      return res.status(400).json({
        success: false,
        message: "You cannot follow yourself"
      });
    }

    const userToFollow = await ElderlyUser.findById(userId);
    const currentUser = await ElderlyUser.findById(currentUserId);

    if (!userToFollow) {
      return res.status(404).json({
        success: false,
        message: "User not found"
      });
    }

    // Check if already following
    if (currentUser.following.includes(userId)) {
      return res.status(400).json({
        success: false,
        message: "Already following this user"
      });
    }

    // Add to following array of current user
    await ElderlyUser.findByIdAndUpdate(currentUserId, {
      $push: { following: userId }
    });

    // Add to followers array of target user
    await ElderlyUser.findByIdAndUpdate(userId, {
      $push: { followers: currentUserId }
    });

    res.json({
      success: true,
      message: `You are now following ${userToFollow.firstName} ${userToFollow.lastName}`,
      isFollowing: true
    });
  } catch (err) {
    console.error("Follow user error:", err);
    res.status(500).json({
      success: false,
      message: "Error following user"
    });
  }
};

// Unfollow a user
exports.unfollowUser = async (req, res) => {
  try {
    const { userId } = req.params; // User to unfollow
    const currentUserId = req.user.id;

    if (userId === currentUserId) {
      return res.status(400).json({
        success: false,
        message: "You cannot unfollow yourself"
      });
    }

    const userToUnfollow = await ElderlyUser.findById(userId);
    const currentUser = await ElderlyUser.findById(currentUserId);

    if (!userToUnfollow) {
      return res.status(404).json({
        success: false,
        message: "User not found"
      });
    }

    // Check if following
    if (!currentUser.following.includes(userId)) {
      return res.status(400).json({
        success: false,
        message: "You are not following this user"
      });
    }

    // Remove from following array of current user
    await ElderlyUser.findByIdAndUpdate(currentUserId, {
      $pull: { following: userId }
    });

    // Remove from followers array of target user
    await ElderlyUser.findByIdAndUpdate(userId, {
      $pull: { followers: currentUserId }
    });

    res.json({
      success: true,
      message: `You have unfollowed ${userToUnfollow.firstName} ${userToUnfollow.lastName}`,
      isFollowing: false
    });
  } catch (err) {
    console.error("Unfollow user error:", err);
    res.status(500).json({
      success: false,
      message: "Error unfollowing user"
    });
  }
};

// Get followers list for a user
exports.getFollowers = async (req, res) => {
  try {
    const { userId } = req.params;
    
    const user = await ElderlyUser.findById(userId)
      .populate('followers', 'firstName lastName profilePhoto city state hobbies');

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found"
      });
    }

    res.json({
      success: true,
      followers: user.followers,
      count: user.followers.length
    });
  } catch (err) {
    console.error("Get followers error:", err);
    res.status(500).json({
      success: false,
      message: "Error fetching followers"
    });
  }
};

// Get following list for a user
exports.getFollowing = async (req, res) => {
  try {
    const { userId } = req.params;
    
    const user = await ElderlyUser.findById(userId)
      .populate('following', 'firstName lastName profilePhoto city state hobbies');

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found"
      });
    }

    res.json({
      success: true,
      following: user.following,
      count: user.following.length
    });
  } catch (err) {
    console.error("Get following error:", err);
    res.status(500).json({
      success: false,
      message: "Error fetching following"
    });
  }
};

// Check follow status
exports.checkFollowStatus = async (req, res) => {
  try {
    const { userId } = req.params;
    const currentUserId = req.user.id;

    const currentUser = await ElderlyUser.findById(currentUserId);

    const isFollowing = currentUser.following.includes(userId);

    res.json({
      success: true,
      isFollowing
    });
  } catch (err) {
    console.error("Check follow status error:", err);
    res.status(500).json({
      success: false,
      message: "Error checking follow status"
    });
  }
};

// Get feed posts (only from followed users)
exports.getFeedPosts = async (req, res) => {
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
      privacy: "public" // You can modify this based on your privacy settings
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
      followingCount: currentUser.following.length
    });
  } catch (err) {
    console.error("Get feed posts error:", err);
    res.status(500).json({
      success: false,
      message: "Error fetching feed posts"
    });
  }
};