const express = require('express');
const {
  markAttendance,
  getAttendanceByDate,
  handleRFIDScan,
  handleQRScan,
  bulkMarkAttendance,
  getAttendanceReport,
  createSlot,
  getSlots,
  getSlotWithStudents,
  deleteSlot,
  submitSlotAttendance,
  submitStaffAttendance,
} = require('../controllers/attendanceController');
const { authMiddleware, requireRole } = require('../middleware/auth');

const router = express.Router();

router.use(authMiddleware);

// Existing routes
router.post('/mark', requireRole('SUPER_ADMIN', 'ADMIN', 'TEACHER'), markAttendance);
router.get('/date', getAttendanceByDate);
router.post('/rfid-scan', handleRFIDScan);
router.post('/bulk', requireRole('SUPER_ADMIN', 'ADMIN', 'TEACHER'), bulkMarkAttendance);
router.get('/report', getAttendanceReport);

// Slot routes
router.post('/slots', requireRole('SUPER_ADMIN', 'ADMIN', 'TEACHER'), createSlot);
router.get('/slots', requireRole('SUPER_ADMIN', 'ADMIN', 'TEACHER'), getSlots);
router.get('/slots/:id', requireRole('SUPER_ADMIN', 'ADMIN', 'TEACHER'), getSlotWithStudents);
router.delete('/slots/:id', requireRole('SUPER_ADMIN', 'ADMIN', 'TEACHER'), deleteSlot);
router.post('/slots/:id/submit', requireRole('SUPER_ADMIN', 'ADMIN', 'TEACHER'), submitSlotAttendance);
router.post('/staff-batch', requireRole('SUPER_ADMIN', 'ADMIN', 'HR_MANAGER'), submitStaffAttendance);

// QR scan route — kiosk mode, validated by scannerId (no JWT required on this single route)
router.post('/qr-scan', handleQRScan);

module.exports = router;
