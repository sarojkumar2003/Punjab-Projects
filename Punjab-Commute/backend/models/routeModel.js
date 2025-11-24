const mongoose = require('mongoose');

// Define the schema for a bus route
const routeSchema = new mongoose.Schema({
  routeName: {
    type: String,
    required: true,
    unique: true,  // Ensure route names are unique
  },
  stops: [{
    name: {
      type: String,
      required: true,
    },
    location: {
      type: {
        type: String,
        enum: ['Point'],
        required: true,
      },
      coordinates: {
        type: [Number], // [longitude, latitude]
        required: true,
      },
    },
  }],
  directions: {
    type: String,
    required: true,
  },
});

// Create a geospatial index for querying route stops
routeSchema.index({ 'stops.location': '2dsphere' });

// Create the Route model
const Route = mongoose.model('Route', routeSchema);

module.exports = Route;
