// models/routeModel.js
const mongoose = require('mongoose');

// Define the schema for a bus route
const routeSchema = new mongoose.Schema(
  {
    routeName: {
      type: String,
      required: true,
      unique: true, // Ensure route names are unique
      trim: true,
    },

    // Multiple stops along the route
    stops: [
      {
        name: {
          type: String,
          required: true,
          trim: true,
        },
        // Static scheduled time at this stop (optional, format "HH:mm" or similar)
        arrivalTime: {
          type: String,
          default: null,
        },
        // GeoJSON point for the stop
        location: {
          type: {
            type: String,
            enum: ['Point'],
            default: 'Point',
            required: true,
          },
          coordinates: {
            type: [Number], // [longitude, latitude]
            required: true,
            validate: {
              validator: function (v) {
                return (
                  Array.isArray(v) &&
                  v.length === 2 &&
                  v[0] >= -180 &&
                  v[0] <= 180 &&
                  v[1] >= -90 &&
                  v[1] <= 90
                );
              },
              message:
                'Stop coordinates must be [longitude, latitude] in valid ranges.',
            },
          },
        },
        // Optional order index along the route (0, 1, 2, ...)
        sequence: {
          type: Number,
          default: 0,
        },
      },
    ],

    // Free-text directions or description of the route
    directions: {
      type: String,
      required: true,
      trim: true,
    },
  },
  {
    timestamps: true, // createdAt, updatedAt
  }
);

// Create a geospatial index for querying route stops
routeSchema.index({ 'stops.location': '2dsphere' });

// Create the Route model
const Route = mongoose.model('Route', routeSchema);

module.exports = Route;
