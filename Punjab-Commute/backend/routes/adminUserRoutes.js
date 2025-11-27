// routes/adminUserRoutes.js
const express = require('express');
const router = express.Router();
const {
  getAllUsers,
  createUserByAdmin,
  updateUserByAdmin,
  deleteUserByAdmin,
} = require('../controllers/adminUserController');

// If you already have middleware, you can protect like this:
// const { protect, adminOnly } = require('../middleware/authMiddleware');

// For now I’ll leave them open; you can wrap them with protect/adminOnly later.

// GET all users
router.get('/', /*protect, adminOnly,*/ getAllUsers);

// CREATE user
router.post('/', /*protect, adminOnly,*/ createUserByAdmin);

// UPDATE user
router.put('/:id', /*protect, adminOnly,*/ updateUserByAdmin);

// DELETE user
router.delete('/:id', /*protect, adminOnly,*/ deleteUserByAdmin);

module.exports = router;
