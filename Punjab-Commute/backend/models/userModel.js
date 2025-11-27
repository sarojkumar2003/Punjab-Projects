// models/userModel.js
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

// Define the schema for a user
const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },

  email: {
    type: String,
    required: true,
    unique: true,
    match: [/^\S+@\S+\.\S+$/, 'Please use a valid email address'],
  },

  password: {
    type: String,
    required: true,
  },

  role: {
    type: String,
    enum: ['commuter', 'admin'],
    default: 'commuter',
  },

  // Per-admin secret key (hashed) – ONLY used for admins
  adminKeyHash: {
    type: String,
    default: null,
  },

  lastLogin: {
    type: Date,
  },
});

// Hash password before saving (if modified)
userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) {
    return next();
  }

  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (err) {
    next(err);
  }
});

// Method to check password validity
userSchema.methods.matchPassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

// Set / update admin personal secret key (hash it)
userSchema.methods.setAdminKey = async function (plainKey) {
  const salt = await bcrypt.genSalt(10);
  this.adminKeyHash = await bcrypt.hash(plainKey, salt);
};

// Check admin personal secret key
userSchema.methods.checkAdminKey = async function (plainKey) {
  if (!this.adminKeyHash) return false;
  return await bcrypt.compare(plainKey, this.adminKeyHash);
};

const User = mongoose.model('User', userSchema);

module.exports = User;
