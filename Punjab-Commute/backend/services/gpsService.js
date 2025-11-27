// services/gpsService.js  (or src/services/gpsService.js)
// Adjust path based on your folder structure

const Bus = require('../models/busModel');

/**
 * Update a bus's live location and optional telemetry data.
 *
 * @param {String} busId
 * @param {Object} payload
 * @param {Number} payload.latitude
 * @param {Number} payload.longitude
 * @param {Number} [payload.speed]          - optional, in km/h
 * @param {Boolean} [payload.emergency]     - optional
 * @param {String} [payload.issueNote]      - optional
 * @param {String} [payload.lastStopName]   - optional
 * @param {Date|String} [payload.lastStopTime] - optional
 *
 * @returns {Promise<Bus>} updated bus
 */
const updateBusLocation = async (busId, payload) => {
  const {
    latitude,
    longitude,
    speed,
    emergency,
    issueNote,
    lastStopName,
    lastStopTime,
  } = payload || {};

  if (
    typeof latitude !== 'number' ||
    typeof longitude !== 'number' ||
    Number.isNaN(latitude) ||
    Number.isNaN(longitude)
  ) {
    throw new Error('Latitude and longitude must be numbers');
  }

  if (longitude < -180 || longitude > 180 || latitude < -90 || latitude > 90) {
    throw new Error('Latitude/longitude out of range');
  }

  const update = {
    currentLocation: {
      type: 'Point',
      coordinates: [longitude, latitude], // [lng, lat]
    },
    lastUpdated: new Date(),
  };

  if (typeof speed === 'number' && !Number.isNaN(speed)) {
    update.speed = speed;
  }

  if (typeof emergency === 'boolean') {
    update.emergency = emergency;
  }

  if (typeof issueNote === 'string') {
    update.issueNote = issueNote;
  }

  if (typeof lastStopName === 'string') {
    update.lastStopName = lastStopName;
  }

  if (lastStopTime) {
    update.lastStopTime = new Date(lastStopTime);
  }

  const updatedBus = await Bus.findByIdAndUpdate(
    busId,
    { $set: update },
    { new: true }
  )
    .populate('route')
    .populate('driver');

  return updatedBus;
};

/**
 * Get the current location of a bus.
 * @param {String} busId
 */
const getBusLocation = async (busId) => {
  const bus = await Bus.findById(busId).select(
    'busNumber currentLocation lastUpdated status route driverName driverPhone'
  ).populate('route');

  if (!bus) {
    throw new Error('Bus not found');
  }

  return bus;
};

/**
 * Find buses near a given point.
 *
 * @param {Object} params
 * @param {Number} params.latitude
 * @param {Number} params.longitude
 * @param {Number} [params.maxDistanceMeters=3000]
 */
const getNearbyBuses = async ({ latitude, longitude, maxDistanceMeters = 3000 }) => {
  if (
    typeof latitude !== 'number' ||
    typeof longitude !== 'number' ||
    Number.isNaN(latitude) ||
    Number.isNaN(longitude)
  ) {
    throw new Error('Latitude and longitude must be numbers');
  }

  const nearbyBuses = await Bus.find({
    currentLocation: {
      $near: {
        $geometry: {
          type: 'Point',
          coordinates: [longitude, latitude],
        },
        $maxDistance: maxDistanceMeters,
      },
    },
  })
    .select(
      'busNumber currentLocation status driverName driverPhone route lastUpdated'
    )
    .populate('route');

  return nearbyBuses;
};

module.exports = {
  updateBusLocation,
  getBusLocation,
  getNearbyBuses,
};
