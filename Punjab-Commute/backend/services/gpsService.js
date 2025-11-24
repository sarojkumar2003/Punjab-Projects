const Bus = require('../models/busModel');  // Import the Bus model

/**
 * Service to update the bus location.
 * @param {String} busId - The ID of the bus whose location is being updated.
 * @param {Object} location - The new location of the bus (latitude, longitude).
 */
const updateBusLocation = async (busId, location) => {
  try {
    // Validate incoming location data
    if (!location || !location.latitude || !location.longitude) {
      throw new Error('Invalid location data');
    }

    // Update the bus location in the database
    const updatedBus = await Bus.findByIdAndUpdate(
      busId,  // Find bus by its ID
      { currentLocation: { type: 'Point', coordinates: [location.longitude, location.latitude] } },
      { new: true }  // Return the updated document
    );

    if (!updatedBus) {
      throw new Error('Bus not found');
    }

    // Return the updated bus data (location)
    return updatedBus;
  } catch (error) {
    console.error('Error updating bus location:', error);
    throw error;  // Propagate error for further handling
  }
};

/**
 * Service to get the current location of a bus.
 * @param {String} busId - The ID of the bus whose location is being fetched.
 * @returns {Object} - The bus's current location and status.
 */
const getBusLocation = async (busId) => {
  try {
    // Fetch the bus from the database
    const bus = await Bus.findById(busId);

    if (!bus) {
      throw new Error('Bus not found');
    }

    // Return the bus location and other relevant data
    return {
      busId: bus._id,
      location: bus.currentLocation,
      status: bus.status,
      lastUpdated: bus.lastUpdated,
    };
  } catch (error) {
    console.error('Error fetching bus location:', error);
    throw error;
  }
};

/**
 * Service to get the nearby buses based on a user's location.
 * @param {Object} userLocation - The user's location (latitude, longitude).
 * @param {Number} radius - The radius (in meters) to search for nearby buses.
 * @returns {Array} - A list of nearby buses within the given radius.
 */
const getNearbyBuses = async (userLocation, radius = 1000) => {
  try {
    // Find nearby buses within the specified radius
    const nearbyBuses = await Bus.find({
      currentLocation: {
        $near: {
          $geometry: {
            type: 'Point',
            coordinates: [userLocation.longitude, userLocation.latitude],
          },
          $maxDistance: radius,  // Radius in meters
        },
      },
    });

    return nearbyBuses;
  } catch (error) {
    console.error('Error fetching nearby buses:', error);
    throw error;
  }
};

module.exports = {
  updateBusLocation,
  getBusLocation,
  getNearbyBuses,
};
