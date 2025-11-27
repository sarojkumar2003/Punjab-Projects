// Importing required dependencies
const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const path = require('path');
const helmet = require('helmet');
const cookieParser = require('cookie-parser');

// Import the database connection function
const connectDB = require('./config/db');

// Import routes
const busRoutes = require('./routes/busRoutes');
const routeRoutes = require('./routes/routeRoutes');
const authRoutes = require('./routes/authRoutes');
const adminRoutes = require('./routes/adminRoutes');
const adminUserRoutes = require('./routes/adminUserRoutes'); 
const driverRoutes = require('./routes/driverRoutes');



// Initialize the Express app
const app = express();

// Middleware to handle CORS (Cross-Origin Resource Sharing)
app.use(
  cors({
    // origin: 'http://localhost:5173', // your React app URL
    origin: 'https://punjab-admin.onrender.com', // your React app URL
    credentials: true,               // allow cookies & credentials
  })
);

// Middleware for parsing incoming request bodies
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Middleware for added security
app.use(helmet());
// Middleware to parse cookies
app.use(cookieParser()); 

// Use routes for the API endpoints
app.use('/api/bus', busRoutes);
app.use('/api/routes', routeRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/admin/users', adminUserRoutes);
app.use('/api/drivers', driverRoutes);



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
