const Route = require('../models/routeModel');

// Get all routes
const getAllRoutes = async (req, res) => {
  try {
    const routes = await Route.find();
    res.status(200).json(routes);
  } catch (error) {
    console.error('Error fetching all routes:', error);
    res.status(500).json({ message: 'Server Error - Unable to fetch routes', error });
  }
};

// Get route by ID
const getRouteById = async (req, res) => {
  try {
    const route = await Route.findById(req.params.id);
    if (!route) {
      return res.status(404).json({ message: 'Route not found' });
    }
    res.status(200).json(route);
  } catch (error) {
    console.error(`Error fetching route with ID ${req.params.id}:`, error);
    res.status(500).json({ message: 'Server Error - Unable to fetch route by ID', error });
  }
};

// Create a new route
const createRoute = async (req, res) => {
  const { routeName, stops, directions } = req.body;

  // Validate the input data
  if (!routeName || !stops || !Array.isArray(stops) || stops.length === 0 || !directions) {
    return res.status(400).json({ message: 'Bad Request - Missing required fields: routeName, stops, directions' });
  }

  try {
    // Create a new route object
    const newRoute = new Route({ routeName, stops, directions });

    // Save the new route to the database
    await newRoute.save();

    // Return the created route
    res.status(201).json(newRoute);
  } catch (error) {
    console.error('Error creating new route:', error);
    res.status(500).json({ message: 'Server Error - Unable to create route', error });
  }
};

module.exports = { getAllRoutes, getRouteById, createRoute };
