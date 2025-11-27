// routes/authRoutes.js
const express = require('express');
const router = express.Router();
const {
  registerUser,
  registerAdmin,
  loginUser,
  loginAdmin,
  logoutUser,
} = require('../controllers/authController');

// Commuter (optional)
router.post('/register', registerUser);
router.post('/login', loginUser);

// Admin
router.post('/admin/register', registerAdmin);
router.post('/admin/login', loginAdmin);

// Logout
router.post('/logout', logoutUser);

module.exports = router;
