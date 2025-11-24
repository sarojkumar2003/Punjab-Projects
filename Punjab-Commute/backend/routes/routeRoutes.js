const express = require('express');
const router = express.Router();
const { getAllRoutes, getRouteById, createRoute } = require('../controllers/routeController');

// Get all routes
router.get('/', getAllRoutes);

// Get a specific route by ID
router.get('/:id', getRouteById);

// Create a new route
router.post('/', createRoute);

module.exports = router;
