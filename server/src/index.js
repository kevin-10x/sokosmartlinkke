require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const { PrismaClient } = require('@prisma/client');

// Routes
const searchRoutes = require('./routes/search');
const businessRoutes = require('./routes/business');
const matatuRoutes = require('./routes/matatu');
const submissionRoutes = require('./routes/submission');
const adminRoutes = require('./routes/admin');
const cityRoutes = require('./routes/city');
const placesRoutes = require('./routes/places');

// Middleware
const errorHandler = require('./middleware/errorHandler');
const { logger } = require('./utils/logger');

const app = express();
const prisma = new PrismaClient();
const PORT = process.env.PORT || 3001;

// Security middleware
app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" }
}));
app.use(cors({
  origin: process.env.ALLOWED_ORIGINS?.split(',') || ['http://localhost:3000', 'http://localhost:3002'],
  credentials: true
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: process.env.NODE_ENV === 'production' ? 100 : 1000,
  message: { error: 'Too many requests, please try again later.' }
});
app.use('/api/', limiter);

// Body parsing & logging
app.use(compression());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(morgan('combined', { stream: { write: msg => logger.info(msg.trim()) } }));

// Root route
app.get('/', (req, res) => {
  res.json({ name: 'Smart Soko API', version: '1.0.0', status: 'running', docs: '/health' });
});

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString(), version: '1.0.0' });
});

// API Routes
app.use('/api/v1/search', searchRoutes);
app.use('/api/v1/businesses', businessRoutes);
app.use('/api/v1/matatu', matatuRoutes);
app.use('/api/v1/submissions', submissionRoutes);
app.use('/api/v1/admin', adminRoutes);
app.use('/api/v1/cities', cityRoutes);
app.use('/api/v1/places', placesRoutes);

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Endpoint not found', path: req.path });
});

// Error handler
app.use(errorHandler);

// Graceful shutdown
process.on('SIGTERM', async () => {
  logger.info('SIGTERM received, shutting down gracefully');
  await prisma.$disconnect();
  process.exit(0);
});

app.listen(PORT, () => {
  logger.info(`🚀 Smart Soko API running on port ${PORT}`);
  logger.info(`📊 Environment: ${process.env.NODE_ENV || 'development'}`);
});

module.exports = app;
