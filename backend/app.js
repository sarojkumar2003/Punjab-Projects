// src/app.js
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const cookieParser = require('cookie-parser');

const connectDB = require('./config/db');

const busRoutes = require('./routes/busRoutes');
const routeRoutes = require('./routes/routeRoutes');
const authRoutes = require('./routes/authRoutes');
const adminRoutes = require('./routes/adminRoutes');
const adminUserRoutes = require('./routes/adminUserRoutes');
const driverRoutes = require('./routes/driverRoutes');

const app = express();

// If behind a proxy (Render etc.) so secure cookies work
app.set('trust proxy', 1);

// Security
app.use(helmet());

// Body parsing
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Cookie parser
app.use(cookieParser());

// === CORS (hard-coded origins, no env var) ===
const allowedOrigins = [
  'http://localhost:5173',
  'http://localhost:5174',
  
];

app.use((req, res, next) => {
  const origin = req.headers.origin;

  // Allow non-browser tools (curl/postman) that don't send Origin
  if (!origin) {
    return cors({ origin: true, credentials: true })(req, res, next);
  }

  // If origin is allowed, apply CORS with that origin
  if (allowedOrigins.includes(origin)) {
    return cors({ origin, credentials: true })(req, res, next);
  }

  // If not allowed, respond with 403 for clarity
  res.status(403).json({ message: `CORS policy: origin ${origin} not allowed` });
});

// === Routes (after CORS) ===
app.use('/api/bus', busRoutes);
app.use('/api/routes', routeRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/admin/users', adminUserRoutes);
app.use('/api/drivers', driverRoutes);

// Connect DB
connectDB();

// Health / root
app.get('/', (req, res) => {
  res.send('Welcome to Punjab Commute Backend');
});

// 404 handler
app.use((req, res, next) => {
  res.status(404).json({ message: 'Not Found' });
});

// Error handler (hide stack in production)
app.use((err, req, res, next) => {
  console.error(err);
  res.status(err.status || 500).json({
    message: err.message || 'Internal Server Error',
    ...(process.env.NODE_ENV === 'production' ? {} : { stack: err.stack })
  });
});

module.exports = app;
