// controllers/busController.js

const Bus = require('../models/busModel');
const {
  updateBusLocation: gpsUpdateBusLocation,
} = require('../services/gpsService'); // adjust path if gpsService.js is somewhere else

// CREATE — add a new bus
const createBus = async (req, res) => {
  try {
    const { busNumber, route, coordinates, status } = req.body;

    // coordinates expected as [lng, lat]
    if (
      !busNumber ||
      !route ||
      !coordinates ||
      !Array.isArray(coordinates) ||
      coordinates.length !== 2
    ) {
      return res.status(400).json({
        message:
          'Required: busNumber, route (Route _id), coordinates [lng, lat]. Optional: status',
      });
    }

    const [lng, lat] = coordinates;
    if (
      Number.isNaN(lng) ||
      Number.isNaN(lat) ||
      lng < -180 ||
      lng > 180 ||
      lat < -90 ||
      lat > 90
    ) {
      return res
        .status(400)
        .json({ message: 'coordinates must be [lng, lat] in valid ranges' });
    }

    const bus = await Bus.create({
      busNumber,
      route,
      currentLocation: { type: 'Point', coordinates: [lng, lat] },
      status: status || 'On Time',
    });

    const populated = await Bus.findById(bus._id)
      .populate('route')
      .populate('driver');

    return res.status(201).json(populated);
  } catch (error) {
    if (error?.code === 11000) {
      return res.status(409).json({ message: 'busNumber already exists' });
    }
    console.error('Error creating bus:', error);
    res
      .status(500)
      .json({ message: 'Server Error - Unable to create bus', error });
  }
};

// READ — all buses
const getAllBuses = async (req, res) => {
  try {
    const buses = await Bus.find()
      .populate('route')
      .populate('driver')
      .sort({ busNumber: 1 });

    res.status(200).json(buses);
  } catch (error) {
    console.error('Error fetching all buses:', error);
    res
      .status(500)
      .json({ message: 'Server Error - Unable to fetch buses', error });
  }
};

// READ — bus by ID
const getBusById = async (req, res) => {
  try {
    const bus = await Bus.findById(req.params.id)
      .populate('route')
      .populate('driver');

    if (!bus) {
      return res.status(404).json({ message: 'Bus not found' });
    }
    res.status(200).json(bus);
  } catch (error) {
    console.error(`Error fetching bus ${req.params.id}:`, error);
    res
      .status(500)
      .json({ message: 'Server Error - Unable to fetch bus by ID', error });
  }
};

/**
 * LIVE UPDATE — current location & telemetry
 *
 * This is what your driver app / GPS device should call.
 * Supports both:
 *  - { latitude, longitude, speed, emergency, issueNote, lastStopName, lastStopTime }
 *  - or { coordinates: [lng, lat] } plus optional extras
 */
const updateBusLocation = async (req, res) => {
  try {
    const busId = req.params.id;
    const {
      latitude,
      longitude,
      speed,
      emergency,
      issueNote,
      lastStopName,
      lastStopTime,
      coordinates,
    } = req.body;

    let lat = latitude;
    let lng = longitude;

    // Allow coordinates: [lng, lat] format too
    if (
      (!lat || !lng) &&
      coordinates &&
      Array.isArray(coordinates) &&
      coordinates.length === 2
    ) {
      lng = Number(coordinates[0]);
      lat = Number(coordinates[1]);
    }

    const updatedBus = await gpsUpdateBusLocation(busId, {
      latitude: Number(lat),
      longitude: Number(lng),
      speed: typeof speed !== 'undefined' ? Number(speed) : undefined,
      emergency,
      issueNote,
      lastStopName,
      lastStopTime,
    });

    if (!updatedBus) {
      return res.status(404).json({ message: 'Bus not found' });
    }

    res.status(200).json(updatedBus);
  } catch (error) {
    console.error(`Error updating location for bus ${req.params.id}:`, error);
    res.status(400).json({
      message: error.message || 'Unable to update bus location',
      error,
    });
  }
};

// UPDATE — status only
const updateBusStatus = async (req, res) => {
  try {
    const { status } = req.body; // 'On Time' | 'Delayed' | 'Arrived' | 'Inactive' | 'Running'
    const allowed = ['On Time', 'Delayed', 'Arrived', 'Inactive', 'Running'];
    if (!allowed.includes(status)) {
      return res.status(400).json({ message: 'Invalid status' });
    }
    const bus = await Bus.findByIdAndUpdate(
      req.params.id,
      { $set: { status, lastUpdated: Date.now() } },
      { new: true }
    )
      .populate('route')
      .populate('driver');

    if (!bus) return res.status(404).json({ message: 'Bus not found' });
    res.status(200).json(bus);
  } catch (error) {
    console.error(`Error updating status for bus ${req.params.id}:`, error);
    res
      .status(500)
      .json({ message: 'Server Error - Unable to update status', error });
  }
};

// DELETE — remove a bus
const deleteBus = async (req, res) => {
  try {
    const bus = await Bus.findByIdAndDelete(req.params.id);
    if (!bus) return res.status(404).json({ message: 'Bus not found' });
    res.status(200).json({ message: 'Bus deleted' });
  } catch (error) {
    console.error(`Error deleting bus ${req.params.id}:`, error);
    res
      .status(500)
      .json({ message: 'Server Error - Unable to delete bus', error });
  }
};

module.exports = {
  createBus,
  getAllBuses,
  getBusById,
  updateBusLocation, // LIVE GPS UPDATE
  updateBusStatus,
  deleteBus,
};
