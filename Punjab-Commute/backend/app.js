// Importing required dependencies
const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const path = require('path');
const helmet = require('helmet');

// Import the database connection function
const connectDB = require('./config/db');

// Import routes
const busRoutes = require('./routes/busRoutes');
const routeRoutes = require('./routes/routeRoutes');
const authRoutes = require('./routes/authRoutes');

// Initialize the Express app
const app = express();

// Middleware to handle CORS (Cross-Origin Resource Sharing)
app.use(cors());

// Middleware for parsing incoming request bodies
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Middleware for added security
app.use(helmet());

// Use routes for the API endpoints
app.use('/api/bus', busRoutes);
app.use('/api/routes', routeRoutes);
app.use('/api/auth', authRoutes);

// Connect to the database
connectDB();

// Set up a default route for testing
app.get('/', (req, res) => {
  res.send('Welcome to Punjab Commute Backend');
});

// 404 handler for non-existent routes
app.use((req, res, next) => {
  const error = new Error('Not Found');
  error.status = 404;
  next(error);
});

// Error handler middleware
app.use((err, req, res, next) => {
  res.status(err.status || 500).json({
    message: err.message,
    error: err.stack,
  });
});

// Export the app to be used in `server.js`
module.exports = app;
