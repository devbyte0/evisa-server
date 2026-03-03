// server.js

require('dotenv').config(); // MUST be first

const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const path = require('path');

// Force cloudinary config to load early
require('./config/cloudinary');

const connectDB = require('./config/db');

// Import routes
const visaRoutes = require('./routes/visaRoutes');
const uploadRoutes = require('./routes/uploadRoutes');

const app = express();

// =============================
// Connect Database
// =============================
connectDB();

// =============================
// Security Middleware
// =============================
app.use(
  helmet({
    crossOriginResourcePolicy: { policy: 'cross-origin' }
  })
);

// =============================
// CORS Configuration (FIXED)
// =============================
const allowedOrigins = [
  'https://evisa-fawn.vercel.app',
  process.env.FRONTEND_URL
].filter(Boolean);

app.use(
  cors({
    origin: function (origin, callback) {
      // Allow requests with no origin (like Postman)
      if (!origin) return callback(null, true);

      if (allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error('Not allowed by CORS'));
      }
    },
    credentials: true
  })
);

// =============================
// Body Parsers
// =============================
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

app.use(morgan('dev'));

// =============================
// Static Files
// =============================
app.use('/images', express.static(path.join(__dirname, 'public/images')));

// =============================
// Routes
// =============================
app.use('/api/visa', visaRoutes);
app.use('/api/upload', uploadRoutes);

// =============================
// Health Check
// =============================
app.get('/api/health', (req, res) => {
  res.json({
    success: true,
    status: 'OK',
    timestamp: new Date(),
    environment: process.env.NODE_ENV || 'development',
    mongoDB: mongoose.connection.readyState === 1 ? 'Connected' : 'Disconnected'
  });
});

// =============================
// Root Route
// =============================
app.get('/', (req, res) => {
  res.json({
    message: 'Visa Verification API',
    endpoints: {
      verifyVisa: 'POST /api/visa/verify',
      getAllVisas: 'GET /api/visa/all',
      getVisaById: 'GET /api/visa/:id',
      createVisa: 'POST /api/visa/create',
      uploadPhoto: 'POST /api/upload/visa-photo',
      health: 'GET /api/health'
    }
  });
});

// =============================
// 404 Handler
// =============================
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    message: 'Route not found'
  });
});

// =============================
// Global Error Handler
// =============================
app.use((err, req, res, next) => {
  console.error('❌ Error:', err.message);

  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Internal Server Error'
  });
});

// =============================
// Server Start
// =============================
const PORT = process.env.PORT || 5000;

const server = app.listen(PORT, () => {
  console.log(`\n🚀 Server running in ${process.env.NODE_ENV || 'development'} mode`);
  console.log(`🌐 http://localhost:${PORT}`);
  console.log(`📸 Upload: http://localhost:${PORT}/api/upload/visa-photo`);
  console.log(`🗄️  MongoDB: Connected\n`);
});

// =============================
// Graceful Shutdown
// =============================
process.on('unhandledRejection', (err) => {
  // Log but do not crash the server on unhandled promise rejections
  console.error('❌ UNHANDLED REJECTION:', err);
});

process.on('SIGTERM', () => {
  console.log('👋 SIGTERM received. Shutting down gracefully...');
  server.close(() => {
    mongoose.connection.close(false, () => {
      process.exit(0);
    });
  });
});