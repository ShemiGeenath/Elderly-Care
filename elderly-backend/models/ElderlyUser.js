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