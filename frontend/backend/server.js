const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
require('dotenv').config();

const authRoutes        = require('./routes/auth');
const transactionRoutes = require('./routes/transactions');
const analyticsRoutes   = require('./routes/analytics');
const statementRoutes   = require('./routes/statements');
const categoryRoutes    = require('./routes/categories');
const adminRoutes       = require('./routes/admin');
const userRoutes        = require('./routes/users');

const app = express();

// ── Security middleware ──
app.use(helmet());
app.use(cors({
  origin: process.env.CLIENT_URL || '*',
  credentials: true,
}));

// ── Rate limiting ──
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: { success: false, message: 'Too many requests, please try again later.' },
});
app.use('/api/', limiter);

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: { success: false, message: 'Too many login attempts.' },
});

// ── Body parsing ──
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// ── Logging ──
if (process.env.NODE_ENV !== 'test') {
  app.use(morgan('dev'));
}

// ── Routes ──
app.use('/api/auth',         authLimiter, authRoutes);
app.use('/api/transactions', transactionRoutes);
app.use('/api/analytics',    analyticsRoutes);
app.use('/api/statements',   statementRoutes);
app.use('/api/categories',   categoryRoutes);
app.use('/api/admin',        adminRoutes);
app.use('/api/users',        userRoutes);

// ── Health check ──
app.get('/api/health', (req, res) => {
  res.json({ success: true, message: 'MoneyMate API is running', timestamp: new Date() });
});

// ── 404 handler ──
app.use((req, res) => {
  res.status(404).json({ success: false, message: 'Route not found' });
});

// ── Global error handler ──
app.use((err, req, res, next) => {
  console.error(err.stack);
  const status = err.status || 500;
  res.status(status).json({
    success: false,
    message: err.message || 'Internal server error',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
  });
});

// ── Database + start ──
mongoose.connect(process.env.MONGODB_URI)
  .then(() => {
    console.log('✅ MongoDB connected');
    app.listen(process.env.PORT || 5000, () => {
      console.log(`🚀 Server running on port ${process.env.PORT || 5000}`);
    });
  })
  .catch(err => {
    console.error('❌ MongoDB connection error:', err.message);
    process.exit(1);
  });

module.exports = app;
