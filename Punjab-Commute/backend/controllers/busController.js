const Bus = require('../models/busModel');

// CREATE — add a new bus
const createBus = async (req, res) => {
  try {
    const { busNumber, route, coordinates, status } = req.body;

    // basic validation
    if (!busNumber || !route || !coordinates || !Array.isArray(coordinates) || coordinates.length !== 2) {
      return res.status(400).json({
        message: "Required: busNumber, route (Route _id), coordinates [lng, lat]. Optional: status"
      });
    }

    const [lng, lat] = coordinates;
    if (isNaN(lng) || isNaN(lat) || lng < -180 || lng > 180 || lat < -90 || lat > 90) {
      return res.status(400).json({ message: "coordinates must be [lng, lat] in valid ranges" });
    }

    const bus = await Bus.create({
      busNumber,
      route,
      currentLocation: { type: 'Point', coordinates: [lng, lat] },
      status: status || 'On Time',
    });

    return res.status(201).json(bus);
  } catch (error) {
    // duplicate busNumber, etc.
    if (error?.code === 11000) {
      return res.status(409).json({ message: "busNumber already exists" });
    }
    console.error('Error creating bus:', error);
    res.status(500).json({ message: 'Server Error - Unable to create bus', error });
  }
};

// (you already have these)
const getAllBuses = async (req, res) => { /* ... as in your code ... */ };
const getBusById   = async (req, res) => { /* ... as in your code ... */ };

// UPDATE current location (you already have it)
const updateBusLocation = async (req, res) => { /* ... as in your code ... */ };

// Optional: update status only
const updateBusStatus = async (req, res) => {
  try {
    const { status } = req.body; // 'On Time' | 'Delayed' | 'Arrived'
    if (!['On Time', 'Delayed', 'Arrived'].includes(status)) {
      return res.status(400).json({ message: 'Invalid status' });
    }
    const bus = await Bus.findByIdAndUpdate(
      req.params.id,
      { $set: { status, lastUpdated: Date.now() } },
      { new: true }
    );
    if (!bus) return res.status(404).json({ message: 'Bus not found' });
    res.status(200).json(bus);
  } catch (error) {
    console.error(`Error updating status for bus ${req.params.id}:`, error);
    res.status(500).json({ message: 'Server Error - Unable to update status', error });
  }
};

// Optional: delete a bus
const deleteBus = async (req, res) => {
  try {
    const bus = await Bus.findByIdAndDelete(req.params.id);
    if (!bus) return res.status(404).json({ message: 'Bus not found' });
    res.status(200).json({ message: 'Bus deleted' });
  } catch (error) {
    console.error(`Error deleting bus ${req.params.id}:`, error);
    res.status(500).json({ message: 'Server Error - Unable to delete bus', error });
  }
};

module.exports = {
  createBus,
  getAllBuses,
  getBusById,
  updateBusLocation,
  updateBusStatus,   // optional
  deleteBus          // optional
};
