const mongoose = require('mongoose');

// Define the schema for a bus
const busSchema = new mongoose.Schema({
  busNumber: {
    type: String,
    required: true,
    unique: true,  // Ensure bus numbers are unique
  },
  route: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Route',  // Reference to the Route model
    required: true,
  },
  currentLocation: {
    type: {
      type: String,
      enum: ['Point'], // GeoJSON format
      required: true,
    },
    coordinates: {
      type: [Number], // [longitude, latitude]
      required: true,
    },
  },
  status: {
    type: String,
    enum: ['On Time', 'Delayed', 'Arrived'],
    default: 'On Time',
  },
  lastUpdated: {
    type: Date,
    default: Date.now,
  },
});

// Create a geospatial index for querying bus locations
busSchema.index({ currentLocation: '2dsphere' });

// Create the Bus model
const Bus = mongoose.model('Bus', busSchema);

module.exports = Bus;
