const Report = require("../models/Report");
const ElderlyUser = require("../models/ElderlyUser");
const Post = require("../models/Post");
const Admin = require("../models/Admin");

// @desc    Get All Reports with Filters
// @route   GET /api/admin/reports
// @access  Private (Admin with canManageReports permission)
exports.getAllReports = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 20,
      status = "pending",
      priority = "all",
      type = "all",
      category = "all",
      sortBy = "createdAt",
      sortOrder = "desc"
    } = req.query;

    const query = {};

    // Status filter
    if (status !== 'all') {
      query.status = status;
    }

    // Priority filter
    if (priority !== 'all') {
      query.priority = priority;
    }

    // Type filter
    if (type !== 'all') {
      query.reportType = type;
    }

    // Category filter
    if (category !== 'all') {
      query.category = category;
    }

    // If admin is not super admin, only show reports assigned to them or unassigned
    if (req.admin.role !== 'super_admin') {
      query.$or = [
        { assignedTo: req.admin._id },
        { assignedTo: { $exists: false } },
        { assignedTo: null }
      ];
    }

    const sort = {};
    sort[sortBy] = sortOrder === 'desc' ? -1 : 1;

    const reports = await Report.find(query)
      .populate('reporter', 'firstName lastName email profilePhoto')
      .populate('reportedUser', 'firstName lastName email profilePhoto')
      .populate('reportedPost', 'content postType')
      .populate('assignedTo', 'username fullName')
      .sort(sort)
      .skip((page - 1) * limit)
      .limit(parseInt(limit));

    const total = await Report.countDocuments(query);

    // Get statistics
    const stats = await Report.aggregate([
      {
        $group: {
          _id: "$status",
          count: { $sum: 1 }
        }
      }
    ]);

    res.json({
      success: true,
      reports,
      stats: stats.reduce((acc, curr) => {
        acc[curr._id] = curr.count;
        return acc;
      }, {}),
      pagination: {
        total,
        page: parseInt(page),
        pages: Math.ceil(total / limit),
        limit: parseInt(limit)
      }
    });

  } catch (error) {
    console.error("Get all reports error:", error);
    res.status(500).json({
      success: false,
      message: "Server error fetching reports"
    });
  }
};

// @desc    Get Report Details
// @route   GET /api/admin/reports/:id
// @access  Private (Admin with canManageReports permission)
exports.getReportDetails = async (req, res) => {
  try {
    const report = await Report.findById(req.params.id)
      .populate('reporter', 'firstName lastName email profilePhone phone city state')
      .populate('reportedUser', 'firstName lastName email profilePhoto posts friends')
      .populate('reportedPost')
      .populate('assignedTo', 'username fullName profileImage')
      .populate('resolution.resolvedBy', 'username fullName');

    if (!report) {
      return res.status(404).json({
        success: false,
        message: "Report not found"
      });
    }

    // Get additional data based on report type
    let additionalData = {};
    
    if (report.reportedUser) {
      const [userPosts, userReports, userFriends] = await Promise.all([
        Post.find({ user: report.reportedUser._id }).limit(5).sort({ createdAt: -1 }),
        Report.find({ reportedUser: report.reportedUser._id }).countDocuments(),
        ElderlyUser.findById(report.reportedUser._id).select('friends').populate('friends', 'firstName lastName')
      ]);
      
      additionalData.reportedUserDetails = {
        posts: userPosts,
        totalReports: userReports,
        friends: userFriends?.friends || []
      };
    }

    if (report.reportedPost) {
      const postWithComments = await Post.findById(report.reportedPost._id)
        .populate('user', 'firstName lastName')
        .populate('comments.user', 'firstName lastName');
      
      additionalData.postDetails = postWithComments;
    }

    res.json({
      success: true,
      report: {
        ...report.toObject(),
        ...additionalData
      }
    });

  } catch (error) {
    console.error("Get report details error:", error);
    res.status(500).json({
      success: false,
      message: "Server error fetching report details"
    });
  }
};

// @desc    Assign Report to Admin
// @route   PUT /api/admin/reports/:id/assign
// @access  Private (Admin with canManageReports permission)
exports.assignReport = async (req, res) => {
  try {
    const { id } = req.params;
    const { assignTo } = req.body;

    const report = await Report.findById(id);
    if (!report) {
      return res.status(404).json({
        success: false,
        message: "Report not found"
      });
    }

    // Check if report is already assigned
    if (report.assignedTo && report.assignedTo.toString() !== assignTo) {
      return res.status(400).json({
        success: false,
        message: "Report is already assigned to another admin"
      });
    }

    // Verify the assignee exists and is active
    const assigneeAdmin = await Admin.findOne({ _id: assignTo, isActive: true });
    if (!assigneeAdmin) {
      return res.status(404).json({
        success: false,
        message: "Assigned admin not found or inactive"
      });
    }

    report.assignedTo = assignTo;
    report.assignedAt = new Date();
    
    if (report.status === 'pending') {
      report.status = 'under_review';
    }

    await report.save();

    const populatedReport = await Report.findById(id)
      .populate('assignedTo', 'username fullName profileImage');

    res.json({
      success: true,
      message: "Report assigned successfully",
      report: populatedReport
    });

  } catch (error) {
    console.error("Assign report error:", error);
    res.status(500).json({
      success: false,
      message: "Server error assigning report"
    });
  }
};

// @desc    Update Report Status
// @route   PUT /api/admin/reports/:id/status
// @access  Private (Admin with canManageReports permission)
exports.updateReportStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, notes } = req.body;

    const validStatuses = ['pending', 'under_review', 'resolved', 'dismissed', 'archived'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: "Invalid status"
      });
    }

    const report = await Report.findById(id);
    if (!report) {
      return res.status(404).json({
        success: false,
        message: "Report not found"
      });
    }

    // Check if admin is assigned to this report (unless super admin)
    if (req.admin.role !== 'super_admin' && 
        report.assignedTo && 
        report.assignedTo.toString() !== req.admin._id.toString()) {
      return res.status(403).json({
        success: false,
        message: "You are not assigned to this report"
      });
    }

    report.status = status;
    
    // If resolving, add resolution details
    if (status === 'resolved' || status === 'dismissed') {
      report.resolution = {
        ...report.resolution,
        resolvedBy: req.admin._id,
        resolvedAt: new Date(),
        notes: notes || report.resolution?.notes
      };
    }

    await report.save();

    const updatedReport = await Report.findById(id)
      .populate('assignedTo', 'username fullName')
      .populate('resolution.resolvedBy', 'username fullName');

    res.json({
      success: true,
      message: `Report marked as ${status}`,
      report: updatedReport
    });

  } catch (error) {
    console.error("Update report status error:", error);
    res.status(500).json({
      success: false,
      message: "Server error updating report status"
    });
  }
};

// @desc    Take Action on Report
// @route   POST /api/admin/reports/:id/action
// @access  Private (Admin with canManageReports permission)
exports.takeReportAction = async (req, res) => {
  try {
    const { id } = req.params;
    const { 
      action, 
      notes, 
      suspensionDays, 
      banReason,
      contentRemoval,
      notifyUser,
      notifyReporter 
    } = req.body;

    const report = await Report.findById(id)
      .populate('reportedUser')
      .populate('reportedPost');

    if (!report) {
      return res.status(404).json({
        success: false,
        message: "Report not found"
      });
    }

    // Check if admin is assigned to this report (unless super admin)
    if (req.admin.role !== 'super_admin' && 
        report.assignedTo && 
        report.assignedTo.toString() !== req.admin._id.toString()) {
      return res.status(403).json({
        success: false,
        message: "You are not assigned to this report"
      });
    }

    let userActionTaken = false;
    let postActionTaken = false;

    // Handle actions based on report category
    switch (action) {
      case 'warn_user':
        if (report.reportedUser) {
          // Add warning to user profile
          await ElderlyUser.findByIdAndUpdate(report.reportedUser._id, {
            $push: {
              warnings: {
                reason: notes || `Report: ${report.reportType}`,
                issuedBy: req.admin._id,
                issuedAt: new Date(),
                reportId: report._id
              }
            }
          });
          userActionTaken = true;
        }
        break;

      case 'suspend_user':
        if (report.reportedUser) {
          const suspendedUntil = suspensionDays 
            ? new Date(Date.now() + suspensionDays * 24 * 60 * 60 * 1000)
            : null;

          await ElderlyUser.findByIdAndUpdate(report.reportedUser._id, {
            isSuspended: true,
            suspensionReason: notes || `Report: ${report.reportType}`,
            suspendedUntil,
            suspendedBy: req.admin._id,
            suspendedAt: new Date()
          });
          userActionTaken = true;
        }
        break;

      case 'ban_user':
        if (report.reportedUser) {
          await ElderlyUser.findByIdAndUpdate(report.reportedUser._id, {
            isBanned: true,
            banReason: banReason || notes || `Report: ${report.reportType}`,
            bannedBy: req.admin._id,
            bannedAt: new Date()
          });
          userActionTaken = true;
        }
        break;

      case 'remove_content':
        if (report.reportedPost) {
          await Post.findByIdAndUpdate(report.reportedPost._id, {
            isHidden: true,
            hiddenReason: notes || `Report: ${report.reportType}`,
            hiddenBy: req.admin._id,
            hiddenAt: new Date()
          });
          postActionTaken = true;
        }
        break;

      case 'remove_comment':
        // You'll need to implement comment removal logic
        // This depends on how comments are stored
        break;

      case 'no_action':
        // No action needed, just resolve
        break;

      default:
        return res.status(400).json({
          success: false,
          message: "Invalid action"
        });
    }

    // Update report with resolution
    report.status = 'resolved';
    report.resolution = {
      action,
      notes,
      resolvedBy: req.admin._id,
      resolvedAt: new Date(),
      suspensionDays: suspensionDays || null,
      banReason: banReason || null,
      contentRemoved: contentRemoval || false
    };

    // Mark as reviewed
    report.reviewedBy = req.admin._id;
    report.reviewedAt = new Date();

    await report.save();

    // TODO: Send notifications if requested
    // if (notifyUser && report.reportedUser) {
    //   // Send notification to reported user
    // }
    
    // if (notifyReporter && report.reporter) {
    //   // Send notification to reporter
    // }

    const updatedReport = await Report.findById(id)
      .populate('reportedUser', 'firstName lastName email')
      .populate('resolution.resolvedBy', 'username fullName');

    res.json({
      success: true,
      message: `Action '${action}' taken successfully`,
      report: updatedReport,
      actions: {
        user: userActionTaken,
        post: postActionTaken
      }
    });

  } catch (error) {
    console.error("Take report action error:", error);
    res.status(500).json({
      success: false,
      message: "Server error taking action on report"
    });
  }
};

// @desc    Get Report Statistics
// @route   GET /api/admin/reports/stats
// @access  Private (Admin with canManageReports permission)
exports.getReportStats = async (req, res) => {
  try {
    const { period = '7days' } = req.query;
    
    let dateFilter = {};
    const now = new Date();
    
    switch (period) {
      case '24hours':
        dateFilter = { createdAt: { $gte: new Date(now.setHours(now.getHours() - 24)) } };
        break;
      case '7days':
        dateFilter = { createdAt: { $gte: new Date(now.setDate(now.getDate() - 7)) } };
        break;
      case '30days':
        dateFilter = { createdAt: { $gte: new Date(now.setDate(now.getDate() - 30)) } };
        break;
      case '90days':
        dateFilter = { createdAt: { $gte: new Date(now.setDate(now.getDate() - 90)) } };
        break;
    }

    const [
      totalReports,
      pendingReports,
      resolvedReports,
      reportsByType,
      reportsByStatus,
      reportsByPriority,
      dailyReports,
      topReportedUsers
    ] = await Promise.all([
      Report.countDocuments(dateFilter),
      Report.countDocuments({ ...dateFilter, status: 'pending' }),
      Report.countDocuments({ ...dateFilter, status: 'resolved' }),
      Report.aggregate([
        { $match: dateFilter },
        { $group: { _id: "$reportType", count: { $sum: 1 } } },
        { $sort: { count: -1 } }
      ]),
      Report.aggregate([
        { $match: dateFilter },
        { $group: { _id: "$status", count: { $sum: 1 } } }
      ]),
      Report.aggregate([
        { $match: dateFilter },
        { $group: { _id: "$priority", count: { $sum: 1 } } }
      ]),
      Report.aggregate([
        { $match: dateFilter },
        {
          $group: {
            _id: {
              year: { $year: "$createdAt" },
              month: { $month: "$createdAt" },
              day: { $dayOfMonth: "$createdAt" }
            },
            count: { $sum: 1 }
          }
        },
        { $sort: { "_id.year": 1, "_id.month": 1, "_id.day": 1 } },
        { $limit: 30 }
      ]),
      Report.aggregate([
        { $match: { ...dateFilter, reportedUser: { $exists: true } } },
        { $group: { _id: "$reportedUser", count: { $sum: 1 } } },
        { $sort: { count: -1 } },
        { $limit: 10 },
        {
          $lookup: {
            from: "elderlyusers",
            localField: "_id",
            foreignField: "_id",
            as: "user"
          }
        },
        { $unwind: "$user" },
        {
          $project: {
            userId: "$_id",
            firstName: "$user.firstName",
            lastName: "$user.lastName",
            email: "$user.email",
            reportCount: "$count"
          }
        }
      ])
    ]);

    // Calculate average resolution time
    const resolutionStats = await Report.aggregate([
      { $match: { status: 'resolved', 'resolution.resolvedAt': { $exists: true } } },
      {
        $project: {
          resolutionTime: {
            $divide: [
              { $subtract: ["$resolution.resolvedAt", "$createdAt"] },
              1000 * 60 * 60 // Convert to hours
            ]
          }
        }
      },
      {
        $group: {
          _id: null,
          avgResolutionTime: { $avg: "$resolutionTime" },
          minResolutionTime: { $min: "$resolutionTime" },
          maxResolutionTime: { $max: "$resolutionTime" }
        }
      }
    ]);

    res.json({
      success: true,
      stats: {
        totalReports,
        pendingReports,
        resolvedReports,
        resolutionRate: totalReports > 0 ? (resolvedReports / totalReports * 100).toFixed(2) : 0,
        reportsByType,
        reportsByStatus,
        reportsByPriority,
        dailyReports,
        topReportedUsers,
        resolutionTime: resolutionStats[0] || {
          avgResolutionTime: 0,
          minResolutionTime: 0,
          maxResolutionTime: 0
        }
      }
    });

  } catch (error) {
    console.error("Get report stats error:", error);
    res.status(500).json({
      success: false,
      message: "Server error fetching report statistics"
    });
  }
};

// @desc    User submits a report (for regular users)
// @route   POST /api/reports
// @access  Private (User)
exports.submitReport = async (req, res) => {
  try {
    const {
      reportedUser,
      reportedPost,
      reportedComment,
      reportType,
      title,
      description,
      evidence,
      isAnonymous
    } = req.body;

    // User must be logged in to submit report
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: "You must be logged in to submit a report"
      });
    }

    // Validate at least one of reportedUser, reportedPost, or reportedComment
    if (!reportedUser && !reportedPost && !reportedComment) {
      return res.status(400).json({
        success: false,
        message: "You must report a user, post, or comment"
      });
    }

    // Check if user is reporting themselves
    if (reportedUser && reportedUser === req.user._id.toString()) {
      return res.status(400).json({
        success: false,
        message: "You cannot report yourself"
      });
    }

    // Check for duplicate reports (same user reporting same content within 24 hours)
    const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const duplicateReport = await Report.findOne({
      reporter: req.user._id,
      $or: [
        { reportedUser },
        { reportedPost },
        { reportedComment }
      ],
      createdAt: { $gte: twentyFourHoursAgo }
    });

    if (duplicateReport) {
      return res.status(400).json({
        success: false,
        message: "You have already reported this content recently. Please wait 24 hours."
      });
    }

    const report = new Report({
      reporter: isAnonymous ? null : req.user._id,
      reportedUser: reportedUser || null,
      reportedPost: reportedPost || null,
      reportedComment: reportedComment || null,
      reportType,
      title,
      description,
      evidence: evidence || [],
      isAnonymous,
      category: reportedUser ? 'user' : (reportedPost ? 'post' : 'comment')
    });

    await report.save();

    // TODO: Send notification to admins about new report

    res.status(201).json({
      success: true,
      message: "Thank you for your report. Our team will review it shortly.",
      reportId: report._id
    });

  } catch (error) {
    console.error("Submit report error:", error);
    res.status(500).json({
      success: false,
      message: "Server error submitting report"
    });
  }
};

// @desc    Get user's submitted reports
// @route   GET /api/reports/my-reports
// @access  Private (User)
exports.getMyReports = async (req, res) => {
  try {
    const reports = await Report.find({ reporter: req.user._id })
      .sort({ createdAt: -1 })
      .populate('reportedUser', 'firstName lastName profilePhoto')
      .populate('reportedPost', 'content')
      .populate('assignedTo', 'username');

    res.json({
      success: true,
      reports
    });

  } catch (error) {
    console.error("Get my reports error:", error);
    res.status(500).json({
      success: false,
      message: "Server error fetching your reports"
    });
  }
};