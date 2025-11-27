// controllers/authController.js
const User = require('../models/userModel');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const dotenv = require('dotenv');

dotenv.config();

// Helper to generate JWT
const generateToken = (user) => {
  return jwt.sign(
    { id: user._id, role: user.role },
    process.env.JWT_SECRET || 'devsecret',
    { expiresIn: process.env.JWT_EXPIRATION || '1h' }
  );
};

// =============== NORMAL USER REGISTER (commuter) =================
const registerUser = async (req, res) => {
  const { name, email, password, role } = req.body;

  try {
    const emailRegex = /^\S+@\S+\.\S+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ message: 'Invalid email format' });
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res
        .status(400)
        .json({ message: 'User already exists with this email' });
    }

    // userModel pre-save hook will hash password
    const newUser = new User({
      name,
      email,
      password,
      role: role || 'commuter',
    });

    await newUser.save();

    return res.status(201).json({ message: 'User registered successfully' });
  } catch (error) {
    console.error('Error registering user:', error);
    return res.status(500).json({ message: 'Server Error', error });
  }
};

// =============== ADMIN REGISTER (with personal adminKey) ==========
const registerAdmin = async (req, res) => {
  const { name, email, password, adminKey } = req.body;

  try {
    if (!adminKey || adminKey.length < 4) {
      return res
        .status(400)
        .json({ message: 'Admin secret key must be at least 4 characters' });
    }

    const emailRegex = /^\S+@\S+\.\S+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ message: 'Invalid email format' });
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res
        .status(400)
        .json({ message: 'User already exists with this email' });
    }

    // Create admin, password will be hashed by pre-save
    const newAdmin = new User({
      name,
      email,
      password,
      role: 'admin',
    });

    // Set personal admin secret key (hash)
    await newAdmin.setAdminKey(adminKey);

    await newAdmin.save();

    return res.status(201).json({ message: 'Admin registered successfully' });
  } catch (error) {
    console.error('Error registering admin:', error);
    return res.status(500).json({ message: 'Server Error', error });
  }
};

// =============== NORMAL USER LOGIN (commuter) =====================
const loginUser = async (req, res) => {
  const { email, password } = req.body;

  try {
    const user = await User.findOne({ email });

    if (!user || user.role !== 'commuter') {
      return res.status(400).json({ message: 'Commuter account not found' });
    }

    const isMatch = await user.matchPassword(password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Incorrect password' });
    }

    const token = generateToken(user);

    res.cookie('authToken', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      maxAge: 3600000,
      sameSite: 'strict',
    });

    return res.status(200).json({
      message: 'Commuter login successful',
      token,
      role: user.role,
    });
  } catch (error) {
    console.error('Error logging in commuter:', error);
    return res.status(500).json({ message: 'Server Error', error });
  }
};

// =============== ADMIN LOGIN (email + password + adminKey) ========
const loginAdmin = async (req, res) => {
  const { email, password, adminKey } = req.body;

  try {
    // 1. Find admin user
    const user = await User.findOne({ email });

    if (!user || user.role !== 'admin') {
      return res.status(400).json({ message: 'Admin account not found' });
    }

    // 2. Check password
    const isMatch = await user.matchPassword(password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Incorrect password' });
    }

    // 3. Check admin personal secret key
    const keyMatch = await user.checkAdminKey(adminKey);
    if (!keyMatch) {
      return res.status(401).json({ message: 'Invalid admin secret key' });
    }

    // 4. Generate token
    const token = generateToken(user);

    res.cookie('authToken', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      maxAge: 3600000,
      sameSite: 'strict',
    });

    return res.status(200).json({
      message: 'Admin login successful',
      token,
      role: user.role,
    });
  } catch (error) {
    console.error('Error logging in admin:', error);
    return res.status(500).json({ message: 'Server Error', error });
  }
};

// =============== LOGOUT ===========================================
const logoutUser = (req, res) => {
  try {
    res.clearCookie('authToken');
    return res.status(200).json({ message: 'Logged out successfully' });
  } catch (error) {
    console.error('Error logging out user:', error);
    return res.status(500).json({ message: 'Server Error', error });
  }
};

module.exports = {
  registerUser,
  registerAdmin,
  loginUser,
  loginAdmin,
  logoutUser,
};
