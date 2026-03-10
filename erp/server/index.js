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
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const compression = require('compression');
const rateLimit = require('express-rate-limit');
const logger = require('./src/config/logger');

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

// Initialize app
const app = express();
const PORT = process.env.PORT || 5001;

// Security middleware
app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" }
}));

// CORS configuration
const corsOptions = {
  origin: process.env.ALLOWED_ORIGINS ? process.env.ALLOWED_ORIGINS.split(',') : true,
  credentials: true,
};
app.use(cors(corsOptions));

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Compression
app.use(compression());

// Static files (uploaded PDFs, images, etc.)
const path = require('path');
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Logging
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
} else {
  app.use(morgan('combined'));
}

// Rate limiting
if (process.env.RATE_LIMIT_ENABLED === 'true') {
  const limiter = rateLimit({
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 900000,
    max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 200,
    message: 'Too many requests from this IP, please try again later.',
  });
  app.use('/api/', limiter);
}

// Health check
app.get('/health', (req, res) => {
  res.json({
    status: 'OK',
    service: 'EduSphere School ERP',
    schoolId: process.env.SCHOOL_ID,
    schoolName: process.env.SCHOOL_NAME,
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV,
  });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/students', studentRoutes);
app.use('/api/teachers', teacherRoutes);
app.use('/api/attendance', attendanceRoutes);
app.use('/api/academic', academicRoutes);
app.use('/api/fees', feeRoutes);
app.use('/api/exams', examRoutes);
app.use('/api/library', libraryRoutes);
app.use('/api/inventory', inventoryRoutes);
app.use('/api/announcements', announcementRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/users', userRoutes);
app.use('/api/services', serviceRoutes);
app.use('/api/hr', hrRoutes);
app.use('/api/payroll', payrollRoutes);
app.use('/api/terms', termRoutes);
app.use('/api/grade-scales', gradeScaleRoutes);
app.use('/api/report-cards', reportCardRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/school-config', schoolConfigRoutes);
app.use('/api/enquiries', enquiryRoutes);
app.use('/api/scanners', scannerRoutes);

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

// Error handler
app.use((err, req, res, next) => {
  logger.error('Unhandled Error:', err);

  const statusCode = err.statusCode || 500;
  const message = err.message || 'Internal server error';

  res.status(statusCode).json({
    error: message,
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`\n🚀 School ERP Server running on http://localhost:${PORT}`);
  console.log(`🏫 School: ${process.env.SCHOOL_NAME} (${process.env.SCHOOL_ID})`);
  console.log(`📊 Environment: ${process.env.NODE_ENV}`);
  console.log(`🏥 Health check: http://localhost:${PORT}/health\n`);
});
