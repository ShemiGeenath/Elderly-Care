// controllers/helpController.js
const HelpRequest = require("../models/HelpRequest");
const ItemExchange = require("../models/ItemExchange");
const ElderlyUser = require("../models/ElderlyUser");

// ================= HELP REQUESTS =================

// Create a new help request
exports.createHelpRequest = async (req, res) => {
  try {
    const {
      type,
      title,
      description,
      location,
      urgency,
      scheduledDate,
      estimatedHours,
      itemsNeeded,
      itemsOffered,
      tags,
    } = req.body;

    const helpRequest = await HelpRequest.create({
      user: req.user.id,
      type,
      title,
      description,
      location,
      urgency,
      scheduledDate,
      estimatedHours,
      itemsNeeded: itemsNeeded || [],
      itemsOffered: itemsOffered || [],
      tags: tags || [],
      status: "pending",
    });

    // Populate user info
    const populatedRequest = await HelpRequest.findById(helpRequest._id)
      .populate("user", "firstName lastName profilePhoto city state")
      .populate("volunteer", "firstName lastName profilePhoto");

    res.status(201).json({
      success: true,
      message: "Help request created successfully",
      helpRequest: populatedRequest,
    });
  } catch (err) {
    console.error("Create help request error:", err);
    res.status(500).json({
      success: false,
      message: "Error creating help request",
    });
  }
};

// Get all help requests (with filters)
exports.getAllHelpRequests = async (req, res) => {
  try {
    const {
      type,
      status,
      urgency,
      location,
      user,
      page = 1,
      limit = 20,
      sortBy = "createdAt",
      sortOrder = "desc",
    } = req.query;

    const filter = {};
    if (type) filter.type = type;
    if (status) filter.status = status;
    if (urgency) filter.urgency = urgency;
    if (location) filter.location = { $regex: location, $options: "i" };
    if (user) filter.user = user;
    
    // Don't show user's own requests in general feed (for volunteer view)
    if (req.query.excludeMine === "true") {
      filter.user = { $ne: req.user.id };
    }

    const skip = (page - 1) * limit;
    const sort = { [sortBy]: sortOrder === "desc" ? -1 : 1 };

    const helpRequests = await HelpRequest.find(filter)
      .populate("user", "firstName lastName profilePhoto city state")
      .populate("volunteer", "firstName lastName profilePhoto")
      .sort(sort)
      .skip(skip)
      .limit(parseInt(limit));

    const total = await HelpRequest.countDocuments(filter);

    res.json({
      success: true,
      helpRequests,
      total,
      page: parseInt(page),
      pages: Math.ceil(total / limit),
    });
  } catch (err) {
    console.error("Get help requests error:", err);
    res.status(500).json({
      success: false,
      message: "Error fetching help requests",
    });
  }
};

// Get my help requests
exports.getMyHelpRequests = async (req, res) => {
  try {
    const { status } = req.query;
    const filter = { user: req.user.id };
    if (status) filter.status = status;

    const helpRequests = await HelpRequest.find(filter)
      .populate("user", "firstName lastName profilePhoto")
      .populate("volunteer", "firstName lastName profilePhoto")
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      helpRequests,
    });
  } catch (err) {
    console.error("Get my help requests error:", err);
    res.status(500).json({
      success: false,
      message: "Error fetching your help requests",
    });
  }
};

// Get help requests I'm volunteering for
exports.getMyVolunteering = async (req, res) => {
  try {
    const { status } = req.query;
    const filter = { volunteer: req.user.id };
    if (status) filter.status = status;

    const helpRequests = await HelpRequest.find(filter)
      .populate("user", "firstName lastName profilePhoto city state")
      .populate("volunteer", "firstName lastName profilePhoto")
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      helpRequests,
    });
  } catch (err) {
    console.error("Get my volunteering error:", err);
    res.status(500).json({
      success: false,
      message: "Error fetching volunteering tasks",
    });
  }
};

// Accept a help request (volunteer)
exports.acceptHelpRequest = async (req, res) => {
  try {
    const { id } = req.params;

    const helpRequest = await HelpRequest.findById(id);
    if (!helpRequest) {
      return res.status(404).json({
        success: false,
        message: "Help request not found",
      });
    }

    if (helpRequest.status !== "pending") {
      return res.status(400).json({
        success: false,
        message: "Help request is no longer available",
      });
    }

    helpRequest.status = "accepted";
    helpRequest.volunteer = req.user.id;
    helpRequest.assignedAt = new Date();
    await helpRequest.save();

    const populatedRequest = await HelpRequest.findById(id)
      .populate("user", "firstName lastName profilePhoto city state phone")
      .populate("volunteer", "firstName lastName profilePhoto");

    res.json({
      success: true,
      message: "Help request accepted successfully",
      helpRequest: populatedRequest,
    });
  } catch (err) {
    console.error("Accept help request error:", err);
    res.status(500).json({
      success: false,
      message: "Error accepting help request",
    });
  }
};

// Update help request status
exports.updateHelpRequestStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const validStatuses = ["in_progress", "completed", "cancelled"];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: "Invalid status",
      });
    }

    const helpRequest = await HelpRequest.findById(id);
    if (!helpRequest) {
      return res.status(404).json({
        success: false,
        message: "Help request not found",
      });
    }

    // Check permissions
    const isOwner = helpRequest.user.toString() === req.user.id;
    const isVolunteer = helpRequest.volunteer?.toString() === req.user.id;

    if (!isOwner && !isVolunteer) {
      return res.status(403).json({
        success: false,
        message: "Not authorized to update this request",
      });
    }

    helpRequest.status = status;
    if (status === "completed") {
      helpRequest.completedAt = new Date();
    }
    await helpRequest.save();

    const populatedRequest = await HelpRequest.findById(id)
      .populate("user", "firstName lastName profilePhoto")
      .populate("volunteer", "firstName lastName profilePhoto");

    res.json({
      success: true,
      message: "Help request updated successfully",
      helpRequest: populatedRequest,
    });
  } catch (err) {
    console.error("Update help request error:", err);
    res.status(500).json({
      success: false,
      message: "Error updating help request",
    });
  }
};

// ================= ITEM EXCHANGE =================

// Create item listing
exports.createItemListing = async (req, res) => {
  try {
    const {
      type,
      category,
      title,
      description,
      location,
      condition,
      quantity,
      expiryDate,
      pickupLocation,
      contactMethod,
      tags,
    } = req.body;

    const itemListing = await ItemExchange.create({
      user: req.user.id,
      type,
      category,
      title,
      description,
      location,
      condition,
      quantity,
      expiryDate,
      pickupLocation,
      contactMethod,
      tags: tags || [],
      status: "available",
    });

    const populatedListing = await ItemExchange.findById(itemListing._id)
      .populate("user", "firstName lastName profilePhoto city state")
      .populate("receiver", "firstName lastName profilePhoto");

    res.status(201).json({
      success: true,
      message: "Item listing created successfully",
      itemListing: populatedListing,
    });
  } catch (err) {
    console.error("Create item listing error:", err);
    res.status(500).json({
      success: false,
      message: "Error creating item listing",
    });
  }
};

// Get all item listings
exports.getAllItemListings = async (req, res) => {
  try {
    const {
      type,
      category,
      status,
      location,
      user,
      page = 1,
      limit = 20,
    } = req.query;

    const filter = {};
    if (type) filter.type = type;
    if (category) filter.category = category;
    if (status) filter.status = status;
    if (location) filter.location = { $regex: location, $options: "i" };
    if (user) filter.user = user;
    
    // Don't show user's own listings in general feed
    if (req.query.excludeMine === "true") {
      filter.user = { $ne: req.user.id };
    }

    const skip = (page - 1) * limit;

    const itemListings = await ItemExchange.find(filter)
      .populate("user", "firstName lastName profilePhoto city state")
      .populate("receiver", "firstName lastName profilePhoto")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await ItemExchange.countDocuments(filter);

    res.json({
      success: true,
      itemListings,
      total,
      page: parseInt(page),
      pages: Math.ceil(total / limit),
    });
  } catch (err) {
    console.error("Get item listings error:", err);
    res.status(500).json({
      success: false,
      message: "Error fetching item listings",
    });
  }
};

// Reserve/claim an item
exports.reserveItem = async (req, res) => {
  try {
    const { id } = req.params;

    const itemListing = await ItemExchange.findById(id);
    if (!itemListing) {
      return res.status(404).json({
        success: false,
        message: "Item listing not found",
      });
    }

    if (itemListing.status !== "available") {
      return res.status(400).json({
        success: false,
        message: "Item is no longer available",
      });
    }

    itemListing.status = "reserved";
    itemListing.receiver = req.user.id;
    await itemListing.save();

    const populatedListing = await ItemExchange.findById(id)
      .populate("user", "firstName lastName profilePhoto phone")
      .populate("receiver", "firstName lastName profilePhoto");

    res.json({
      success: true,
      message: "Item reserved successfully",
      itemListing: populatedListing,
    });
  } catch (err) {
    console.error("Reserve item error:", err);
    res.status(500).json({
      success: false,
      message: "Error reserving item",
    });
  }
};

// Complete item exchange
exports.completeItemExchange = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body; // "given" or "received"

    const itemListing = await ItemExchange.findById(id);
    if (!itemListing) {
      return res.status(404).json({
        success: false,
        message: "Item listing not found",
      });
    }

    // Check permissions
    const isOwner = itemListing.user.toString() === req.user.id;
    const isReceiver = itemListing.receiver?.toString() === req.user.id;

    if (!isOwner && !isReceiver) {
      return res.status(403).json({
        success: false,
        message: "Not authorized to update this listing",
      });
    }

    if (status === "given" && isOwner) {
      itemListing.status = "given";
    } else if (status === "received" && isReceiver) {
      itemListing.status = "received";
    } else {
      return res.status(400).json({
        success: false,
        message: "Invalid status or permission",
      });
    }

    await itemListing.save();

    const populatedListing = await ItemExchange.findById(id)
      .populate("user", "firstName lastName profilePhoto")
      .populate("receiver", "firstName lastName profilePhoto");

    res.json({
      success: true,
      message: "Item exchange completed",
      itemListing: populatedListing,
    });
  } catch (err) {
    console.error("Complete item exchange error:", err);
    res.status(500).json({
      success: false,
      message: "Error completing item exchange",
    });
  }
};

// Get nearby help requests and items (for volunteer dashboard)
exports.getNearbyOpportunities = async (req, res) => {
  try {
    const currentUser = await ElderlyUser.findById(req.user.id);
    if (!currentUser) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    const [helpRequests, itemListings] = await Promise.all([
      HelpRequest.find({
        user: { $ne: req.user.id },
        status: "pending",
        location: { $regex: currentUser.city, $options: "i" },
      })
        .populate("user", "firstName lastName profilePhoto city state")
        .limit(10)
        .sort({ urgency: -1, createdAt: -1 }),

      ItemExchange.find({
        user: { $ne: req.user.id },
        status: "available",
        location: { $regex: currentUser.city, $options: "i" },
      })
        .populate("user", "firstName lastName profilePhoto city state")
        .limit(10)
        .sort({ createdAt: -1 }),
    ]);

    res.json({
      success: true,
      helpRequests,
      itemListings,
    });
  } catch (err) {
    console.error("Get nearby opportunities error:", err);
    res.status(500).json({
      success: false,
      message: "Error fetching nearby opportunities",
    });
  }
};

// Add to helpController.js
exports.getMyItemListings = async (req, res) => {
  try {
    const itemListings = await ItemExchange.find({ user: req.user.id })
      .populate("user", "firstName lastName profilePhoto city state")
      .populate("receiver", "firstName lastName profilePhoto")
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      itemListings,
    });
  } catch (err) {
    console.error("Get my item listings error:", err);
    res.status(500).json({
      success: false,
      message: "Error fetching your item listings",
    });
  }
};

// Add these to your existing helpController.js

// Get single help request by ID
exports.getHelpRequestById = async (req, res) => {
  try {
    const { id } = req.params;
    
    const helpRequest = await HelpRequest.findById(id)
      .populate("user", "firstName lastName profilePhoto phone email city state")
      .populate("volunteer", "firstName lastName profilePhoto phone email");
    
    if (!helpRequest) {
      return res.status(404).json({
        success: false,
        message: "Help request not found"
      });
    }
    
    res.json({
      success: true,
      helpRequest
    });
  } catch (err) {
    console.error("Get help request error:", err);
    res.status(500).json({
      success: false,
      message: "Error fetching help request"
    });
  }
};

// Update help request
exports.updateHelpRequest = async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;
    
    const helpRequest = await HelpRequest.findById(id);
    if (!helpRequest) {
      return res.status(404).json({
        success: false,
        message: "Help request not found"
      });
    }
    
    // Check if user owns this request
    if (helpRequest.user.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: "Not authorized to update this request"
      });
    }
    
    // Don't allow updating if already accepted/completed
    if (helpRequest.status !== 'pending') {
      return res.status(400).json({
        success: false,
        message: "Cannot update request that is already accepted or completed"
      });
    }
    
    const updatedRequest = await HelpRequest.findByIdAndUpdate(
      id,
      updates,
      { new: true, runValidators: true }
    ).populate("user", "firstName lastName profilePhoto");
    
    res.json({
      success: true,
      message: "Help request updated successfully",
      helpRequest: updatedRequest
    });
  } catch (err) {
    console.error("Update help request error:", err);
    res.status(500).json({
      success: false,
      message: "Error updating help request"
    });
  }
};

// Delete help request
exports.deleteHelpRequest = async (req, res) => {
  try {
    const { id } = req.params;
    
    const helpRequest = await HelpRequest.findById(id);
    if (!helpRequest) {
      return res.status(404).json({
        success: false,
        message: "Help request not found"
      });
    }
    
    // Check if user owns this request
    if (helpRequest.user.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: "Not authorized to delete this request"
      });
    }
    
    // Don't allow deleting if already accepted/completed
    if (helpRequest.status !== 'pending') {
      return res.status(400).json({
        success: false,
        message: "Cannot delete request that is already accepted or completed"
      });
    }
    
    await helpRequest.deleteOne();
    
    res.json({
      success: true,
      message: "Help request deleted successfully"
    });
  } catch (err) {
    console.error("Delete help request error:", err);
    res.status(500).json({
      success: false,
      message: "Error deleting help request"
    });
  }
};

// Cancel help request (by owner or volunteer)
exports.cancelHelpRequest = async (req, res) => {
  try {
    const { id } = req.params;
    
    const helpRequest = await HelpRequest.findById(id);
    if (!helpRequest) {
      return res.status(404).json({
        success: false,
        message: "Help request not found"
      });
    }
    
    // Check permissions
    const isOwner = helpRequest.user.toString() === req.user.id;
    const isVolunteer = helpRequest.volunteer?.toString() === req.user.id;
    
    if (!isOwner && !isVolunteer) {
      return res.status(403).json({
        success: false,
        message: "Not authorized to cancel this request"
      });
    }
    
    // Can only cancel if not completed
    if (helpRequest.status === 'completed') {
      return res.status(400).json({
        success: false,
        message: "Cannot cancel completed request"
      });
    }
    
    helpRequest.status = 'cancelled';
    await helpRequest.save();
    
    res.json({
      success: true,
      message: "Help request cancelled successfully"
    });
  } catch (err) {
    console.error("Cancel help request error:", err);
    res.status(500).json({
      success: false,
      message: "Error cancelling help request"
    });
  }
};

// Get all help requests (public feed)
exports.getPublicHelpRequests = async (req, res) => {
  try {
    const {
      type,
      urgency,
      location,
      page = 1,
      limit = 10,
      search
    } = req.query;

    const filter = { status: 'pending' };
    
    if (type) filter.type = type;
    if (urgency) filter.urgency = urgency;
    if (location) filter.location = { $regex: location, $options: "i" };
    if (search) {
      filter.$or = [
        { title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } }
      ];
    }

    const skip = (page - 1) * limit;

    const helpRequests = await HelpRequest.find(filter)
      .populate("user", "firstName lastName profilePhoto city state")
      .sort({ urgency: -1, createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await HelpRequest.countDocuments(filter);

    res.json({
      success: true,
      helpRequests,
      total,
      page: parseInt(page),
      pages: Math.ceil(total / limit)
    });
  } catch (err) {
    console.error("Get public help requests error:", err);
    res.status(500).json({
      success: false,
      message: "Error fetching help requests"
    });
  }
};

// ================= NEW CRUD FUNCTIONS =================

// Get single help request by ID
exports.getHelpRequestById = async (req, res) => {
  try {
    const { id } = req.params;
    
    const helpRequest = await HelpRequest.findById(id)
      .populate("user", "firstName lastName profilePhoto phone email city state")
      .populate("volunteer", "firstName lastName profilePhoto phone email");
    
    if (!helpRequest) {
      return res.status(404).json({
        success: false,
        message: "Help request not found"
      });
    }
    
    res.json({
      success: true,
      helpRequest
    });
  } catch (err) {
    console.error("Get help request error:", err);
    res.status(500).json({
      success: false,
      message: "Error fetching help request"
    });
  }
};

// Update help request
exports.updateHelpRequest = async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;
    
    const helpRequest = await HelpRequest.findById(id);
    if (!helpRequest) {
      return res.status(404).json({
        success: false,
        message: "Help request not found"
      });
    }
    
    // Check if user owns this request
    if (helpRequest.user.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: "Not authorized to update this request"
      });
    }
    
    // Don't allow updating if already accepted/completed
    if (helpRequest.status !== 'pending') {
      return res.status(400).json({
        success: false,
        message: "Cannot update request that is already accepted or completed"
      });
    }
    
    const updatedRequest = await HelpRequest.findByIdAndUpdate(
      id,
      updates,
      { new: true, runValidators: true }
    ).populate("user", "firstName lastName profilePhoto");
    
    res.json({
      success: true,
      message: "Help request updated successfully",
      helpRequest: updatedRequest
    });
  } catch (err) {
    console.error("Update help request error:", err);
    res.status(500).json({
      success: false,
      message: "Error updating help request"
    });
  }
};

// Delete help request
exports.deleteHelpRequest = async (req, res) => {
  try {
    const { id } = req.params;
    
    const helpRequest = await HelpRequest.findById(id);
    if (!helpRequest) {
      return res.status(404).json({
        success: false,
        message: "Help request not found"
      });
    }
    
    // Check if user owns this request
    if (helpRequest.user.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: "Not authorized to delete this request"
      });
    }
    
    // Don't allow deleting if already accepted/completed
    if (helpRequest.status !== 'pending') {
      return res.status(400).json({
        success: false,
        message: "Cannot delete request that is already accepted or completed"
      });
    }
    
    await helpRequest.deleteOne();
    
    res.json({
      success: true,
      message: "Help request deleted successfully"
    });
  } catch (err) {
    console.error("Delete help request error:", err);
    res.status(500).json({
      success: false,
      message: "Error deleting help request"
    });
  }
};

// Cancel help request (by owner or volunteer)
exports.cancelHelpRequest = async (req, res) => {
  try {
    const { id } = req.params;
    
    const helpRequest = await HelpRequest.findById(id);
    if (!helpRequest) {
      return res.status(404).json({
        success: false,
        message: "Help request not found"
      });
    }
    
    // Check permissions
    const isOwner = helpRequest.user.toString() === req.user.id;
    const isVolunteer = helpRequest.volunteer?.toString() === req.user.id;
    
    if (!isOwner && !isVolunteer) {
      return res.status(403).json({
        success: false,
        message: "Not authorized to cancel this request"
      });
    }
    
    // Can only cancel if not completed
    if (helpRequest.status === 'completed') {
      return res.status(400).json({
        success: false,
        message: "Cannot cancel completed request"
      });
    }
    
    helpRequest.status = 'cancelled';
    await helpRequest.save();
    
    res.json({
      success: true,
      message: "Help request cancelled successfully"
    });
  } catch (err) {
    console.error("Cancel help request error:", err);
    res.status(500).json({
      success: false,
      message: "Error cancelling help request"
    });
  }
};

// Get all help requests (public feed for volunteers)
exports.getPublicHelpRequests = async (req, res) => {
  try {
    const {
      type,
      urgency,
      location,
      search,
      page = 1,
      limit = 10
    } = req.query;

    const filter = { 
      status: 'pending',
      user: { $ne: req.user.id } // Exclude user's own requests
    };
    
    if (type) filter.type = type;
    if (urgency) filter.urgency = urgency;
    if (location) filter.location = { $regex: location, $options: "i" };
    if (search) {
      filter.$or = [
        { title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } }
      ];
    }

    const skip = (page - 1) * limit;

    const helpRequests = await HelpRequest.find(filter)
      .populate("user", "firstName lastName profilePhoto city state")
      .sort({ urgency: -1, createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await HelpRequest.countDocuments(filter);

    res.json({
      success: true,
      helpRequests,
      total,
      page: parseInt(page),
      pages: Math.ceil(total / limit)
    });
  } catch (err) {
    console.error("Get public help requests error:", err);
    res.status(500).json({
      success: false,
      message: "Error fetching help requests"
    });
  }
};