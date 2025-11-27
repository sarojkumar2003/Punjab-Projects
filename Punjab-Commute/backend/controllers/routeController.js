// controllers/routeController.js
const Route = require('../models/routeModel');

// Small helper to normalize & validate stops array from request
function normalizeStops(stops) {
  if (!Array.isArray(stops) || stops.length === 0) {
    throw new Error('At least one stop is required');
  }

  return stops.map((stop, idx) => {
    if (
      !stop.name ||
      !stop.coordinates ||
      !Array.isArray(stop.coordinates) ||
      stop.coordinates.length !== 2
    ) {
      throw new Error(
        `Invalid stop at index ${idx}: requires name and coordinates [lng, lat]`
      );
    }

    const [lng, lat] = stop.coordinates;

    if (
      isNaN(lng) ||
      isNaN(lat) ||
      lng < -180 ||
      lng > 180 ||
      lat < -90 ||
      lat > 90
    ) {
      throw new Error(
        `Stop "${stop.name}" has invalid coordinates [${lng}, ${lat}]`
      );
    }

    return {
      name: stop.name,
      arrivalTime: stop.arrivalTime || null,
      location: {
        type: 'Point',
        coordinates: [lng, lat],
      },
      sequence: typeof stop.sequence === 'number' ? stop.sequence : idx,
    };
  });
}

// GET /api/routes - Get all routes
const getAllRoutes = async (req, res) => {
  try {
    const routes = await Route.find().sort({ routeName: 1 });
    res.status(200).json(routes);
  } catch (error) {
    console.error('Error fetching all routes:', error);
    res
      .status(500)
      .json({ message: 'Server Error - Unable to fetch routes', error });
  }
};

// GET /api/routes/:id - Get route by ID
const getRouteById = async (req, res) => {
  try {
    const route = await Route.findById(req.params.id);
    if (!route) {
      return res.status(404).json({ message: 'Route not found' });
    }
    res.status(200).json(route);
  } catch (error) {
    console.error(`Error fetching route with ID ${req.params.id}:`, error);
    res.status(500).json({
      message: 'Server Error - Unable to fetch route by ID',
      error,
    });
  }
};

// POST /api/routes - Create a new route with multiple stops
// Expected body:
// {
//   "routeName": "City Center Loop",
//   "directions": "Clockwise loop.",
//   "stops": [
//     { "name": "Bus Stand", "arrivalTime": "09:00", "coordinates": [75.34, 31.52] },
//     { "name": "University Gate", "arrivalTime": "09:10", "coordinates": [75.36, 31.54] }
//   ]
// }
const createRoute = async (req, res) => {
  const { routeName, stops, directions } = req.body;

  if (!routeName || !directions) {
    return res.status(400).json({
      message: 'Bad Request - Missing required fields: routeName, directions',
    });
  }

  if (!stops) {
    return res.status(400).json({
      message: 'Bad Request - Missing stops array',
    });
  }

  try {
    const normalizedStops = normalizeStops(stops);

    const newRoute = new Route({
      routeName,
      directions,
      stops: normalizedStops,
    });

    await newRoute.save();

    res.status(201).json(newRoute);
  } catch (error) {
    console.error('Error creating new route:', error);

    if (error.message && (error.message.startsWith('Invalid stop') || error.message.startsWith('Stop "'))) {
      return res.status(400).json({ message: error.message });
    }

    res.status(500).json({
      message: 'Server Error - Unable to create route',
      error,
    });
  }
};

// PUT /api/routes/:id - Update route (name, directions, and/or stops)
const updateRoute = async (req, res) => {
  const { routeName, directions, stops } = req.body;

  try {
    const route = await Route.findById(req.params.id);
    if (!route) {
      return res.status(404).json({ message: 'Route not found' });
    }

    if (routeName) route.routeName = routeName;
    if (directions) route.directions = directions;

    // If stops is provided, replace the whole stops array
    if (stops) {
      const normalizedStops = normalizeStops(stops);
      route.stops = normalizedStops;
    }

    await route.save();

    res.status(200).json(route);
  } catch (error) {
    console.error(`Error updating route ${req.params.id}:`, error);

    if (error.message && (error.message.startsWith('Invalid stop') || error.message.startsWith('Stop "'))) {
      return res.status(400).json({ message: error.message });
    }

    res.status(500).json({
      message: 'Server Error - Unable to update route',
      error,
    });
  }
};

// DELETE /api/routes/:id - Delete route
const deleteRoute = async (req, res) => {
  try {
    const deleted = await Route.findByIdAndDelete(req.params.id);
    if (!deleted) {
      return res.status(404).json({ message: 'Route not found' });
    }
    res.status(200).json({ message: 'Route deleted successfully' });
  } catch (error) {
    console.error(`Error deleting route ${req.params.id}:`, error);
    res.status(500).json({
      message: 'Server Error - Unable to delete route',
      error,
    });
  }
};

module.exports = {
  getAllRoutes,
  getRouteById,
  createRoute,
  updateRoute,
  deleteRoute,
};
