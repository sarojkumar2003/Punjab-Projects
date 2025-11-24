const User = require('../models/userModel');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const dotenv = require('dotenv');

dotenv.config(); // Load environment variables from .env

// Register a new user
const registerUser = async (req, res) => {
  const { name, email, password, role } = req.body;
  
  try {
    // Validate email format using regular expression
    const emailRegex = /^\S+@\S+\.\S+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ message: 'Invalid email format' });
    }

    // Check if the user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: 'User already exists' });
    }

    // Hash the password before saving it
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Create a new user
    const newUser = new User({
      name,
      email,
      password: hashedPassword, // Save hashed password
      role: role || 'commuter',  // Default to commuter if no role is provided
    });

    await newUser.save();
    res.status(201).json({ message: 'User registered successfully' });
  } catch (error) {
    console.error('Error registering user:', error);
    res.status(500).json({ message: 'Server Error', error });
  }
};

// Login a user
const loginUser = async (req, res) => {
  const { email, password } = req.body;

  try {
    // Check if the user exists
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ message: 'User not found' });
    }

    // Compare the provided password with the stored hashed password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    // Generate a JWT token
    const token = jwt.sign(
      { id: user._id, role: user.role },  // Payload: user ID and role
      process.env.JWT_SECRET,  // JWT secret from environment variable
      { expiresIn: process.env.JWT_EXPIRATION || '1h' }  // JWT expiration time (1 hour by default)
    );

    // Store token in cookies
    res.cookie('authToken', token, {
      httpOnly: true,  // Ensures the cookie is only accessible by the server
      secure: process.env.NODE_ENV === 'production',  // Set to true for HTTPS in production
      maxAge: 3600000,  // Token expires in 1 hour
      sameSite: 'strict',
    });

    res.status(200).json({ message: 'Login successful', token });
  } catch (error) {
    console.error('Error logging in user:', error);
    res.status(500).json({ message: 'Server Error', error });
  }
};

// Logout user (clear cookie)
const logoutUser = (req, res) => {
  try {
    res.clearCookie('authToken');  // Clear the authToken cookie
    res.status(200).json({ message: 'Logged out successfully' });
  } catch (error) {
    console.error('Error logging out user:', error);
    res.status(500).json({ message: 'Server Error', error });
  }
};

module.exports = { registerUser, loginUser, logoutUser };
