// models/Admin.js - COMPLETE FIX
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const AdminSchema = new mongoose.Schema({
  username: { 
    type: String, 
    required: true, 
    unique: true 
  },
  email: { 
    type: String, 
    required: true, 
    unique: true,
    lowercase: true 
  },
  password: { 
    type: String, 
    required: true 
  },
  fullName: { 
    type: String, 
    required: true 
  },
  role: { 
    type: String, 
    enum: ['super_admin', 'admin', 'moderator'],
    default: 'admin' 
  },
  profileImage: {
    type: String,
    default: 'https://via.placeholder.com/150'
  },
  permissions: [{
    module: String,
    canView: Boolean,
    canCreate: Boolean,
    canEdit: Boolean,
    canDelete: Boolean
  }],
  isActive: { 
    type: Boolean, 
    default: true 
  },
  lastLogin: Date,
  createdAt: { 
    type: Date, 
    default: Date.now 
  },
  updatedAt: { 
    type: Date, 
    default: Date.now 
  }
});

// Hash password before saving - FIXED VERSION with proper function signature
AdminSchema.pre('save', function(next) {
  // Only hash if password is modified
  if (!this.isModified('password')) {
    return next();
  }
  
  try {
    const salt = bcrypt.genSaltSync(10);
    this.password = bcrypt.hashSync(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// Method to compare password
AdminSchema.methods.comparePassword = async function(candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

// Method to return safe object (without password)
AdminSchema.methods.toSafeObject = function() {
  const obj = this.toObject();
  delete obj.password;
  return obj;
};

module.exports = mongoose.model("Admin", AdminSchema);