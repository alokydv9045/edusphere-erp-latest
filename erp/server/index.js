require('dotenv').config();

// ── Validate critical environment variables ──────────────────────────────
const REQUIRED_ENV = ['JWT_SECRET', 'DATABASE_URL'];
const missing = REQUIRED_ENV.filter((key) => !process.env[key]);
if (missing.length > 0) {
  console.error(`\n❌ Missing required environment variables: ${missing.join(', ')}`);
  console.error('   Please check your .env file.\n');
  process.exit(1);
}

const express = require('express');
const http = require('http');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const compression = require('compression');
const rateLimit = require('express-rate-limit');
const logger = require('./src/config/logger');
const cookieParser = require('cookie-parser');

// Routes
const authRoutes = require('./src/routes/authRoutes');
const studentRoutes = require('./src/routes/studentRoutes');
const teacherRoutes = require('./src/routes/teacherRoutes');
const attendanceRoutes = require('./src/routes/attendanceRoutes');
const academicRoutes = require('./src/routes/academicRoutes');
const feeRoutes = require('./src/routes/feeRoutes');
const examRoutes = require('./src/routes/examRoutes');
const libraryRoutes = require('./src/routes/libraryRoutes');
const inventoryRoutes = require('./src/routes/inventoryRoutes');
const announcementRoutes = require('./src/routes/announcementRoutes');
const dashboardRoutes = require('./src/routes/dashboard');
const userRoutes = require('./src/routes/userRoutes');
const serviceRoutes = require('./src/routes/serviceRoutes');
const hrRoutes = require('./src/routes/hrRoutes');
const payrollRoutes = require('./src/routes/payrollRoutes');
const termRoutes = require('./src/routes/termRoutes');
const gradeScaleRoutes = require('./src/routes/gradeScaleRoutes');
const reportCardRoutes = require('./src/routes/reportCardRoutes');
const paymentRoutes = require('./src/routes/paymentRoutes');
const schoolConfigRoutes = require('./src/routes/schoolConfigRoutes');
const enquiryRoutes = require('./src/routes/enquiryRoutes');
const scannerRoutes = require('./src/routes/scannerRoutes');
const assignmentRoutes = require('./src/routes/assignmentRoutes');
const transportRoutes = require('./src/routes/transportRoutes');
const calendarRoutes = require('./src/routes/calendarRoutes');
const timetableRoutes = require('./src/routes/timetableRoutes');
const backupRoutes = require('./src/routes/backupRoutes');
const aiRoutes = require('./src/routes/AiRoutes');
const notificationRoutes = require('./src/routes/notificationRoutes');
const { initSocket } = require('./src/services/socketService');
const { initScheduler } = require('./src/config/scheduler');
const errorHandler = require('./src/middleware/errorHandler');

// Notification scheduler & queue (loaded eagerly so failures are visible at startup)
let notificationScheduler, notificationQueueWorker;
try {
  notificationScheduler = require('./src/notifications/notificationScheduler');
  notificationQueueWorker = require('./src/notifications/notificationQueue');
} catch (err) {
  console.warn('⚠️  Notification modules not available:', err.message);
}

// Initialize app
const app = express();
const server = http.createServer(app);
const PORT = process.env.PORT || 5001;

// Trust proxy for Render's load balancer (needed for rate limiting and secure cookies)
app.set('trust proxy', 1);

// Security middleware
app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" }
}));

// CORS configuration
const corsOptions = {
  origin: (origin, callback) => {
    const allowed = process.env.ALLOWED_ORIGINS 
      ? process.env.ALLOWED_ORIGINS.split(',').map(o => o.trim().replace(/\/$/, '')) 
      : [];
    
    // Allow if origin is in list, or if no origin (like mobile apps/curl), or if ALLOWED_ORIGINS is not set (dev mode)
    if (!origin || !process.env.ALLOWED_ORIGINS || allowed.indexOf(origin.replace(/\/$/, '')) !== -1) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  optionsSuccessStatus: 200 // some legacy browsers (IE11, various SmartTVs) choke on 204
};
app.use(cors(corsOptions));

// Initialize Socket.io
const io = initSocket(server, corsOptions);
app.set('io', io);

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(cookieParser(process.env.COOKIE_SECRET));

// Compression
app.use(compression());

// Static files (uploaded PDFs, images, etc.)
const path = require('path');
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Logging
const morganStream = {
  write: (message) => logger.http(message.trim())
};
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev', { stream: morganStream }));
} else {
  app.use(morgan('combined', { stream: morganStream }));
}

// Rate limiting — always enabled for security
const globalLimiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 900000, // 15 minutes
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 200,
  message: { success: false, error: 'Too many requests from this IP, please try again later.' },
  standardHeaders: true,
  legacyHeaders: false,
});
app.use('/api/', globalLimiter);

// Strict rate limiter for auth endpoints (brute-force protection)
const authLimiter = rateLimit({
  windowMs: 900000, // 15 minutes
  max: 10, // 10 login attempts per 15 min
  message: { success: false, error: 'Too many login attempts. Please try again after 15 minutes.' },
  standardHeaders: true,
  legacyHeaders: false,
});
app.use('/api/auth/login', authLimiter);

// SEC-6: CSRF Protection (only enforced in production)
const { generateCsrfToken, validateCsrf } = require('./src/middleware/csrf');
app.get('/api/csrf-token', generateCsrfToken);
app.use('/api/', validateCsrf);

// Welcome route
app.get('/', (req, res) => {
  res.json({
    message: '🚀 EduSphere School ERP API is running',
    version: '1.0.0',
    documentation: 'Contact system administrator for API documentation',
    healthCheck: '/health'
  });
});

const prisma = require('./src/config/database');
const { getQueueStatus, shutdownNotificationQueue } = require('./src/notifications/notificationQueue');

// Deep Health Check
const healthCheckHandler = async (req, res) => {
  const dbHealth = await prisma.checkDatabaseHealth();
  const queueStatus = getQueueStatus();
  const memoryUsage = process.memoryUsage();

  const isHealthy = dbHealth.status === 'up';

  res.status(isHealthy ? 200 : 503).json({
    status: isHealthy ? 'OK' : 'DEGRADED',
    service: 'EduSphere School ERP',
    schoolId: process.env.SCHOOL_ID,
    schoolName: process.env.SCHOOL_NAME,
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV,
    uptimeSeconds: process.uptime(),
    components: {
      database: dbHealth,
      queue: queueStatus,
    },
    system: {
      memoryUsageMb: {
        rss: Math.round(memoryUsage.rss / 1024 / 1024),
        heapTotal: Math.round(memoryUsage.heapTotal / 1024 / 1024),
        heapUsed: Math.round(memoryUsage.heapUsed / 1024 / 1024),
      }
    }
  });
};

app.get('/health', healthCheckHandler);
app.get('/api/health', healthCheckHandler);

// API Version 1 Router
const v1Router = express.Router();
v1Router.use('/auth', authRoutes);
v1Router.use('/students', studentRoutes);
v1Router.use('/teachers', teacherRoutes);
v1Router.use('/attendance', attendanceRoutes);
v1Router.use('/academic', academicRoutes);
v1Router.use('/fees', feeRoutes);
v1Router.use('/exams', examRoutes);
v1Router.use('/library', libraryRoutes);
v1Router.use('/inventory', inventoryRoutes);
v1Router.use('/announcements', announcementRoutes);
v1Router.use('/dashboard', dashboardRoutes);
v1Router.use('/users', userRoutes);
v1Router.use('/services', serviceRoutes);
v1Router.use('/hr', hrRoutes);
v1Router.use('/payroll', payrollRoutes);
v1Router.use('/terms', termRoutes);
v1Router.use('/grade-scales', gradeScaleRoutes);
v1Router.use('/report-cards', reportCardRoutes);
v1Router.use('/payments', paymentRoutes);
v1Router.use('/school-config', schoolConfigRoutes);
v1Router.use('/enquiries', enquiryRoutes);
v1Router.use('/scanners', scannerRoutes);
v1Router.use('/assignments', assignmentRoutes);
v1Router.use('/transport', transportRoutes);
v1Router.use('/calendar', calendarRoutes);
v1Router.use('/timetables', timetableRoutes);
v1Router.use('/admin/backups', backupRoutes);
v1Router.use('/ai', aiRoutes);
v1Router.use('/notifications', notificationRoutes);

// Mount versioned API and legacy fallback
app.use('/api/v1', v1Router);
app.use('/api', v1Router);

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

// Error handler
app.use(errorHandler);

// Start server
server.listen(PORT, () => {
  logger.info(`🚀 School ERP Server running on http://localhost:${PORT}`);
  logger.info(`🏫 School: ${process.env.SCHOOL_NAME} (${process.env.SCHOOL_ID})`);
  logger.info(`📊 Environment: ${process.env.NODE_ENV}`);
  logger.info(`🏥 Health check: http://localhost:${PORT}/health`);

  // Start Backup Scheduler
  initScheduler();

  // Start notification scheduler and queue worker
  if (notificationScheduler && notificationQueueWorker) {
    notificationQueueWorker.startQueueWorker();
    notificationScheduler.startScheduler();
    logger.info('🔔 Notification scheduler & queue worker started');
  }
});

// Graceful shutdown handling
const gracefulShutdown = async (signal) => {
  logger.info(`🛑 Received ${signal}. Starting graceful shutdown...`);

  server.close(async () => {
    logger.info('HTTP server closed.');
    try {
      await shutdownNotificationQueue();
      await prisma.$disconnect();
      logger.info('Database and queues disconnected successfully.');
      process.exit(0);
    } catch (err) {
      logger.error('Error during graceful shutdown:', err);
      process.exit(1);
    }
  });

  // Force shutdown after 10s if graceful fails
  setTimeout(() => {
    logger.error('🚨 Graceful shutdown timed out. Forcing process exit.');
    process.exit(1);
  }, 10000);
};

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));
