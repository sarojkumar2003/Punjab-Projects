// routes/routeRoutes.js
const express = require('express');
const router = express.Router();
const {
  getAllRoutes,
  getRouteById,
  createRoute,
  updateRoute,
  deleteRoute,
} = require('../controllers/routeController');

const { protect, adminOnly } = require('../middleware/authMiddleware');

// Public
router.get('/', getAllRoutes);
router.get('/:id', getRouteById);

// Admin-only modifications
router.post('/', protect, adminOnly, createRoute);
router.put('/:id', protect, adminOnly, updateRoute);
router.delete('/:id', protect, adminOnly, deleteRoute);

module.exports = router;
