// routes/adminRoutes.js
const express = require('express');
const router = express.Router();
const { protect, adminOnly } = require('../middleware/authMiddleware');
const { setAdminKey } = require('../controllers/adminController');

// All admin routes below require logged-in admin
router.use(protect, adminOnly);

// Set / change personal admin secret key
router.post('/set-key', setAdminKey);

module.exports = router;
