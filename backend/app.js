const express = require('express');
const cors = require('cors');
const path = require('path');
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

// Modern body parsing
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Security & cookies
app.use(helmet());
app.use(cookieParser());

// CORS (dynamic, from env)
const allowedOrigins = (process.env.ALLOWED_ORIGINS || 'http://localhost:5173')
  .split(',')
  .map(o => o.trim());

app.use(cors({
  origin: (origin, callback) => {
    if (!origin) return callback(null, true); // allow tools like curl
    if (allowedOrigins.includes(origin)) return callback(null, true);
    callback(new Error(`CORS policy: origin ${origin} not allowed`), false);
  },
  credentials: true,
  methods: ['GET','POST','PUT','DELETE','OPTIONS'],
  allowedHeaders: ['Content-Type','Authorization','X-Requested-With']
}));
app.options('*', cors());

// Routes
app.use('/api/bus', busRoutes);
app.use('/api/routes', routeRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/admin/users', adminUserRoutes);
app.use('/api/drivers', driverRoutes);

connectDB();

app.get('/', (req, res) => {
  res.send('Welcome to Punjab Commute Backend');
});

app.use((req, res, next) => {
  const error = new Error('Not Found');
  error.status = 404;
  next(error);
});

app.use((err, req, res, next) => {
  console.error(err); // log it
  res.status(err.status || 500).json({
    message: err.message,
    error: process.env.NODE_ENV === 'production' ? {} : err.stack,
  });
});

module.exports = app;
