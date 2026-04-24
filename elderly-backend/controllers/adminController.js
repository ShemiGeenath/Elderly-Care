// backend/controllers/adminController.js

const AdminUser = require("../models/Admin");
const ElderlyUser = require("../models/ElderlyUser");
const Post = require("../models/Post");
const Report = require("../models/Report");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

// Generate JWT Token for admin
const generateAdminToken = (id, role) => {
  return jwt.sign(
    { id, role, type: 'admin' },
    process.env.JWT_ADMIN_SECRET || "admin_secret_key",
    { expiresIn: "12h" }
  );
};

// @desc    Admin login
// @route   POST /api/admin/login
// @access  Public
exports.adminLogin = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Check if admin exists
    const admin = await AdminUser.findOne({ email: email.toLowerCase() });
    if (!admin) {
      return res.status(401).json({
        success: false,
        message: "Invalid credentials"
      });
    }

    // Check if admin is active
    if (!admin.isActive) {
      return res.status(401).json({
        success: false,
        message: "Account is deactivated"
      });
    }

    // Check password
    const isPasswordValid = await bcrypt.compare(password, admin.password);
    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: "Invalid credentials"
      });
    }

    // Update last login
    admin.lastLogin = new Date();
    await admin.save();

    // Generate token
    const token = generateAdminToken(admin._id, admin.role);

    res.json({
      success: true,
      message: "Login successful",
      token,
      admin: {
        id: admin._id,
        username: admin.username,
        email: admin.email,
        role: admin.role,
        fullName: admin.fullName,
        profileImage: admin.profileImage,
        permissions: admin.permissions
      }
    });

  } catch (error) {
    console.error("Admin login error:", error);
    res.status(500).json({
      success: false,
      message: "Server error during login",
      error: error.message
    });
  }
};

// @desc    Get admin profile
// @route   GET /api/admin/profile
// @access  Private (Admin)
exports.getAdminProfile = async (req, res) => {
  try {
    const admin = await AdminUser.findById(req.admin._id).select('-password');
    res.json({
      success: true,
      admin
    });
  } catch (error) {
    console.error("Get admin profile error:", error);
    res.status(500).json({
      success: false,
      message: "Server error fetching profile"
    });
  }
};

// @desc    Get all elderly users with filters
// @route   GET /api/admin/users
// @access  Private (Admin)
exports.getAllUsers = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 20,
      search = "",
      status = "",
      sortBy = "createdAt",
      sortOrder = "desc"
    } = req.query;

    const query = {};
    
    // Search filter
    if (search) {
      query.$or = [
        { firstName: { $regex: search, $options: "i" } },
        { lastName: { $regex: search, $options: "i" } },
        { email: { $regex: search, $options: "i" } },
        { city: { $regex: search, $options: "i" } },
        { state: { $regex: search, $options: "i" } }
      ];
    }

    // Status filter
    if (status) {
      query.isActive = status === 'active';
    }

    const sort = {};
    sort[sortBy] = sortOrder === "desc" ? -1 : 1;

    const users = await ElderlyUser.find(query)
      .select("-password")
      .sort(sort)
      .skip((page - 1) * limit)
      .limit(parseInt(limit));

    const total = await ElderlyUser.countDocuments(query);

    res.json({
      success: true,
      users,
      total,
      page: parseInt(page),
      pages: Math.ceil(total / limit)
    });
  } catch (error) {
    console.error("Get all users error:", error);
    res.status(500).json({
      success: false,
      message: "Server error fetching users"
    });
  }
};

// @desc    Get user details
// @route   GET /api/admin/users/:id
// @access  Private (Admin)
exports.getUserDetails = async (req, res) => {
  try {
    const user = await ElderlyUser.findById(req.params.id)
      .select("-password");

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found"
      });
    }

    // Get user's posts count
    const postsCount = await Post.countDocuments({ user: user._id });

    res.json({
      success: true,
      user: {
        ...user.toObject(),
        stats: {
          posts: postsCount
        }
      }
    });
  } catch (error) {
    console.error("Get user details error:", error);
    res.status(500).json({
      success: false,
      message: "Server error fetching user details"
    });
  }
};

// @desc    Update user status (activate/deactivate)
// @route   PUT /api/admin/users/:id/status
// @access  Private (Admin)
exports.updateUserStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { isActive } = req.body;

    const user = await ElderlyUser.findByIdAndUpdate(
      id,
      { isActive },
      { new: true }
    ).select("-password");

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found"
      });
    }

    res.json({
      success: true,
      message: `User ${isActive ? 'activated' : 'deactivated'} successfully`,
      user
    });
  } catch (error) {
    console.error("Update user status error:", error);
    res.status(500).json({
      success: false,
      message: "Server error updating user status"
    });
  }
};

// @desc    Get all posts with filters
// @route   GET /api/admin/posts
// @access  Private (Admin)
exports.getAllPosts = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 20,
      search = "",
      postType = "",
      sortBy = "createdAt",
      sortOrder = "desc"
    } = req.query;

    const query = {};
    
    // Search filter
    if (search) {
      query.content = { $regex: search, $options: "i" };
    }

    // Post type filter
    if (postType) {
      query.postType = postType;
    }

    const sort = {};
    sort[sortBy] = sortOrder === "desc" ? -1 : 1;

    const posts = await Post.find(query)
      .populate('user', 'firstName lastName email profilePhoto')
      .sort(sort)
      .skip((page - 1) * limit)
      .limit(parseInt(limit));

    const total = await Post.countDocuments(query);

    res.json({
      success: true,
      posts,
      total,
      page: parseInt(page),
      pages: Math.ceil(total / limit)
    });
  } catch (error) {
    console.error("Get all posts error:", error);
    res.status(500).json({
      success: false,
      message: "Server error fetching posts"
    });
  }
};

// @desc    Delete post (admin)
// @route   DELETE /api/admin/posts/:id
// @access  Private (Admin)
exports.deletePost = async (req, res) => {
  try {
    const { id } = req.params;

    const post = await Post.findByIdAndDelete(id);
    
    if (!post) {
      return res.status(404).json({
        success: false,
        message: "Post not found"
      });
    }

    res.json({
      success: true,
      message: "Post deleted successfully"
    });
  } catch (error) {
    console.error("Delete post error:", error);
    res.status(500).json({
      success: false,
      message: "Server error deleting post"
    });
  }
};

// @desc    Get dashboard statistics
// @route   GET /api/admin/dashboard/stats
// @access  Private (Admin)
exports.getDashboardStats = async (req, res) => {
  try {
    const [
      totalUsers,
      activeUsers,
      totalPosts,
      newUsersToday,
      newPostsToday,
      recentUsers,
      popularPosts
    ] = await Promise.all([
      ElderlyUser.countDocuments(),
      ElderlyUser.countDocuments({ isActive: true }),
      Post.countDocuments(),
      ElderlyUser.countDocuments({
        createdAt: { $gte: new Date(new Date().setHours(0, 0, 0, 0)) }
      }),
      Post.countDocuments({
        createdAt: { $gte: new Date(new Date().setHours(0, 0, 0, 0)) }
      }),
      ElderlyUser.find().sort({ createdAt: -1 }).limit(5).select('firstName lastName email profilePhoto isActive'),
      Post.find()
        .populate('user', 'firstName lastName profilePhoto')
        .sort({ likes: -1 })
        .limit(5)
    ]);

    res.json({
      success: true,
      stats: {
        totalUsers,
        activeUsers,
        totalPosts,
        newUsersToday,
        newPostsToday,
        recentUsers,
        popularPosts
      }
    });
  } catch (error) {
    console.error("Get dashboard stats error:", error);
    res.status(500).json({
      success: false,
      message: "Server error fetching dashboard stats"
    });
  }
};

// @desc    Get all reports
// @route   GET /api/admin/reports
// @access  Private (Admin)
exports.getAllReports = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 20,
      status = "",
      sortBy = "createdAt",
      sortOrder = "desc"
    } = req.query;

    const query = {};
    
    // Status filter
    if (status) {
      query.status = status;
    }

    const sort = {};
    sort[sortBy] = sortOrder === "desc" ? -1 : 1;

    const reports = await Report.find(query)
      .populate('reporter', 'firstName lastName email profilePhoto')
      .sort(sort)
      .skip((page - 1) * limit)
      .limit(parseInt(limit));

    const total = await Report.countDocuments(query);

    res.json({
      success: true,
      reports,
      total,
      page: parseInt(page),
      pages: Math.ceil(total / limit)
    });
  } catch (error) {
    console.error("Get all reports error:", error);
    res.status(500).json({
      success: false,
      message: "Server error fetching reports"
    });
  }
};

// @desc    Update report status
// @route   PUT /api/admin/reports/:id/status
// @access  Private (Admin)
exports.updateReportStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, resolution } = req.body;
    const adminId = req.admin?._id;

    const report = await Report.findById(id);
    
    if (!report) {
      return res.status(404).json({
        success: false,
        message: "Report not found"
      });
    }

    report.status = status;
    
    if (status === 'resolved' || status === 'dismissed') {
      report.resolution = resolution;
      report.resolvedBy = adminId;
      report.resolvedAt = new Date();
    }

    await report.save();

    res.json({
      success: true,
      message: `Report ${status} successfully`,
      report
    });
  } catch (error) {
    console.error("Update report status error:", error);
    res.status(500).json({
      success: false,
      message: "Server error updating report status"
    });
  }
};


exports.adminLogin = async (req, res) => {
  try {
    const { email, password } = req.body;
    
    console.log('========== LOGIN ATTEMPT ==========');
    console.log('Email:', email);
    console.log('Password received:', password ? 'Yes' : 'No');
    
    // Check if admin exists
    const admin = await AdminUser.findOne({ email: email.toLowerCase() });
    console.log('Admin found in DB:', admin ? 'Yes' : 'No');
    
    if (!admin) {
      console.log('❌ Admin not found with email:', email);
      return res.status(401).json({
        success: false,
        message: "Invalid credentials"
      });
    }

    console.log('Admin ID:', admin._id);
    console.log('Admin username:', admin.username);
    console.log('Admin isActive:', admin.isActive);
    
    // Check if admin is active
    if (!admin.isActive) {
      console.log('❌ Admin account is deactivated');
      return res.status(401).json({
        success: false,
        message: "Account is deactivated"
      });
    }

    // Check password
    console.log('Comparing passwords...');
    console.log('Stored hashed password:', admin.password.substring(0, 20) + '...');
    
    const isPasswordValid = await bcrypt.compare(password, admin.password);
    console.log('Password valid:', isPasswordValid);
    
    if (!isPasswordValid) {
      console.log('❌ Password mismatch');
      return res.status(401).json({
        success: false,
        message: "Invalid credentials"
      });
    }

    console.log('✅ Login successful for:', admin.email);
    console.log('====================================');
    
    // Update last login
    admin.lastLogin = new Date();
    await admin.save();

    // Generate token
    const token = generateAdminToken(admin._id, admin.role);

    res.json({
      success: true,
      message: "Login successful",
      token,
      admin: {
        id: admin._id,
        username: admin.username,
        email: admin.email,
        role: admin.role,
        fullName: admin.fullName,
        profileImage: admin.profileImage,
        permissions: admin.permissions
      }
    });

  } catch (error) {
    console.error("Admin login error:", error);
    res.status(500).json({
      success: false,
      message: "Server error during login",
      error: error.message
    });
  }
};

// @desc    Create initial admin user (run once)
// @route   POST /api/admin/init
// @access  Public
exports.createInitialAdmin = async (req, res) => {
  try {
    // Check if admin already exists
    const adminExists = await AdminUser.findOne();
    if (adminExists) {
      return res.status(400).json({
        success: false,
        message: "Admin already exists"
      });
    }

    const adminData = {
      username: "superadmin",
      email: "ss@gmail.com",
      password: "Admin123",
      role: "super_admin",
      fullName: "Super Administrator",
      permissions: [
        { module: 'users', canView: true, canCreate: true, canEdit: true, canDelete: true },
        { module: 'posts', canView: true, canCreate: true, canEdit: true, canDelete: true },
        { module: 'reports', canView: true, canCreate: true, canEdit: true, canDelete: true }
      ]
    };

    const admin = new AdminUser(adminData);
    await admin.save();

    res.status(201).json({
      success: true,
      message: "Initial admin created successfully",
      admin: {
        id: admin._id,
        username: admin.username,
        email: admin.email,
        role: admin.role
      }
    });
  } catch (error) {
    console.error("Create initial admin error:", error);
    res.status(500).json({
      success: false,
      message: "Server error creating initial admin"
    });
  }
};