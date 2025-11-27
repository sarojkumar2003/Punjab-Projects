// models/busModel.js
const mongoose = require('mongoose');

// Define schema for a bus
const busSchema = new mongoose.Schema(
  {
    busNumber: {
      type: String,
      required: [true, 'Bus number is required'],
      unique: true,
      trim: true,
    },

    route: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Route',
      required: [true, 'Route ID is required'],
    },

    // Link to Driver document (optional)
    driver: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Driver',
      default: null,
    },

    // Denormalized driver info (for quick access)
    driverName: {
      type: String,
      trim: true,
      default: null,
    },

    driverPhone: {
      type: String,
      trim: true,
      default: null,
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
          message: 'Coordinates must be in the form [longitude, latitude].',
        },
      },
    },

    status: {
      type: String,
      enum: ['On Time', 'Delayed', 'Arrived', 'Inactive', 'Running'],
      default: 'On Time',
    },

    // Optional live fields
    speed: {
      type: Number,
      default: 0,
    },

    emergency: {
      type: Boolean,
      default: false,
    },

    issueNote: {
      type: String,
      default: null, // e.g. "GPS not responding", "Route blocked"
    },

    lastStopName: {
      type: String,
      default: null,
    },

    lastStopTime: {
      type: Date,
      default: null,
    },

    lastUpdated: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true, // createdAt & updatedAt
  }
);

// Geospatial index for real-time map queries
busSchema.index({ currentLocation: '2dsphere' });

const Bus = mongoose.model('Bus', busSchema);
module.exports = Bus;
