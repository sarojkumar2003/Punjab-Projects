const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/userModel');  // Import the User model to interact with the database

/**
 * Registers a new user and hashes their password before saving to the database.
 * @param {Object} userData - The data of the user (name, email, password, role).
 * @returns {Object} - The newly created user object.
 */
const registerUser = async (userData) => {
  try {
    const { name, email, password, role } = userData;

    // Check if the email already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      throw new Error('User already exists with this email');
    }

    // Hash the password before saving to the database
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Create the new user object and save it to the database
    const newUser = new User({
      name,
      email,
      password: hashedPassword,
      role: role || 'commuter',  // Default role is 'commuter' if not provided
    });

    await newUser.save();
    return newUser;  // Return the newly created user
  } catch (error) {
    console.error('Error registering user:', error);
    throw error;
  }
};

/**
 * Logs in a user by verifying their email and password.
 * @param {String} email - The user's email.
 * @param {String} password - The user's password.
 * @returns {Object} - The authenticated user and JWT token.
 */
const loginUser = async (email, password) => {
  try {
    // Check if the user exists in the database
    const user = await User.findOne({ email });
    if (!user) {
      throw new Error('Invalid credentials');
    }

    // Compare the password provided with the hashed password in the database
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      throw new Error('Invalid credentials');
    }

    // Generate a JWT token with the user ID and role
    const token = jwt.sign(
      { id: user._id, role: user.role },  // Payload: user ID and role
      process.env.JWT_SECRET,  // JWT secret key (from environment variables)
      { expiresIn: '1h' }  // Token expires in 1 hour
    );

    return { user, token };  // Return the authenticated user and token
  } catch (error) {
    console.error('Error logging in user:', error);
    throw error;
  }
};

/**
 * Verifies a JWT token to check if the user is authenticated.
 * @param {String} token - The JWT token.
 * @returns {Object} - The decoded user data if the token is valid.
 */
const verifyToken = async (token) => {
  try {
    if (!token) {
      throw new Error('No token provided');
    }

    // Verify the JWT token using the secret key
    const decoded = jwt.verify(token, process.env.JWT_SECRET);  // JWT secret key

    return decoded;  // Return the decoded user data (id, role)
  } catch (error) {
    console.error('Error verifying token:', error);
    throw new Error('Invalid or expired token');
  }
};

/**
 * Logs out the user by clearing the session or invalidating the token.
 * @returns {String} - A message indicating successful logout.
 */
const logoutUser = () => {
  try {
    // On the client side, clear the JWT token (remove from cookies or localStorage)
    return 'User logged out successfully';
  } catch (error) {
    console.error('Error logging out user:', error);
    throw error;
  }
};

module.exports = {
  registerUser,
  loginUser,
  verifyToken,
  logoutUser,
};
