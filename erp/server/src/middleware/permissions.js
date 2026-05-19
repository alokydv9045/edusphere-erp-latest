const { requireRole } = require('./auth');

// ─────────────────────────────────────────────────────────────
// CQ-8: Extended RBAC permission map covering ALL modules
// Previously only transport module was mapped.
// ─────────────────────────────────────────────────────────────

const PERMISSION_ROLES = {
  // ─── Transport Module ───
  'transport.view': ['SUPER_ADMIN', 'ADMIN', 'TRANSPORT_MANAGER', 'ADMISSION_MANAGER'],
  'transport.vehicle.create': ['SUPER_ADMIN', 'ADMIN', 'TRANSPORT_MANAGER'],
  'transport.vehicle.update': ['SUPER_ADMIN', 'ADMIN', 'TRANSPORT_MANAGER'],
  'transport.vehicle.delete': ['SUPER_ADMIN', 'ADMIN'],
  'transport.route.create': ['SUPER_ADMIN', 'ADMIN', 'TRANSPORT_MANAGER'],
  'transport.route.update': ['SUPER_ADMIN', 'ADMIN', 'TRANSPORT_MANAGER'],
  'transport.assign.student': ['SUPER_ADMIN', 'ADMIN', 'TRANSPORT_MANAGER', 'ADMISSION_MANAGER'],
  'transport.manage.drivers': ['SUPER_ADMIN', 'ADMIN', 'TRANSPORT_MANAGER'],
  'transport.view.reports': ['SUPER_ADMIN', 'ADMIN', 'TRANSPORT_MANAGER', 'ACCOUNTANT'],
  'transport.send.notifications': ['SUPER_ADMIN', 'ADMIN', 'TRANSPORT_MANAGER', 'NOTIFICATION_MANAGER'],
  'transport.manage.settings': ['SUPER_ADMIN', 'ADMIN', 'TRANSPORT_MANAGER'],

  // ─── Fee & Finance Module ───
  'fee.view': ['SUPER_ADMIN', 'ADMIN', 'ACCOUNTANT', 'ADMISSION_MANAGER'],
  'fee.create': ['SUPER_ADMIN', 'ADMIN', 'ACCOUNTANT'],
  'fee.update': ['SUPER_ADMIN', 'ADMIN', 'ACCOUNTANT'],
  'fee.delete': ['SUPER_ADMIN', 'ADMIN'],
  'fee.collect': ['SUPER_ADMIN', 'ADMIN', 'ACCOUNTANT'],
  'fee.refund': ['SUPER_ADMIN', 'ADMIN'],
  'fee.reports': ['SUPER_ADMIN', 'ADMIN', 'ACCOUNTANT'],
  'fee.structure.manage': ['SUPER_ADMIN', 'ADMIN', 'ACCOUNTANT'],

  // ─── Student Module ───
  'student.view': ['SUPER_ADMIN', 'ADMIN', 'TEACHER', 'ADMISSION_MANAGER', 'ACCOUNTANT'],
  'student.create': ['SUPER_ADMIN', 'ADMIN', 'ADMISSION_MANAGER'],
  'student.update': ['SUPER_ADMIN', 'ADMIN', 'ADMISSION_MANAGER'],
  'student.delete': ['SUPER_ADMIN', 'ADMIN'],
  'student.promote': ['SUPER_ADMIN', 'ADMIN'],

  // ─── HR Module ───
  'hr.view': ['SUPER_ADMIN', 'ADMIN', 'HR_MANAGER'],
  'hr.create': ['SUPER_ADMIN', 'ADMIN', 'HR_MANAGER'],
  'hr.update': ['SUPER_ADMIN', 'ADMIN', 'HR_MANAGER'],
  'hr.delete': ['SUPER_ADMIN', 'ADMIN'],
  'hr.leave.approve': ['SUPER_ADMIN', 'ADMIN', 'HR_MANAGER'],
  'hr.payroll.manage': ['SUPER_ADMIN', 'ADMIN', 'HR_MANAGER', 'ACCOUNTANT'],
  'hr.payroll.approve': ['SUPER_ADMIN', 'ADMIN'],

  // ─── Exam Module ───
  'exam.view': ['SUPER_ADMIN', 'ADMIN', 'TEACHER', 'STUDENT', 'PARENT'],
  'exam.create': ['SUPER_ADMIN', 'ADMIN', 'TEACHER'],
  'exam.update': ['SUPER_ADMIN', 'ADMIN', 'TEACHER'],
  'exam.delete': ['SUPER_ADMIN', 'ADMIN'],
  'exam.results.enter': ['SUPER_ADMIN', 'ADMIN', 'TEACHER'],
  'exam.results.approve': ['SUPER_ADMIN', 'ADMIN'],
  'exam.results.view': ['SUPER_ADMIN', 'ADMIN', 'TEACHER', 'STUDENT', 'PARENT'],

  // ─── Attendance Module ───
  'attendance.view': ['SUPER_ADMIN', 'ADMIN', 'TEACHER', 'STUDENT', 'PARENT'],
  'attendance.mark': ['SUPER_ADMIN', 'ADMIN', 'TEACHER'],
  'attendance.reports': ['SUPER_ADMIN', 'ADMIN', 'TEACHER'],

  // ─── Library Module ───
  'library.view': ['SUPER_ADMIN', 'ADMIN', 'LIBRARIAN', 'TEACHER', 'STUDENT'],
  'library.manage': ['SUPER_ADMIN', 'ADMIN', 'LIBRARIAN'],
  'library.issue': ['SUPER_ADMIN', 'ADMIN', 'LIBRARIAN'],
  'library.return': ['SUPER_ADMIN', 'ADMIN', 'LIBRARIAN'],

  // ─── Inventory Module ───
  'inventory.view': ['SUPER_ADMIN', 'ADMIN', 'INVENTORY_MANAGER', 'ACCOUNTANT'],
  'inventory.create': ['SUPER_ADMIN', 'ADMIN', 'INVENTORY_MANAGER'],
  'inventory.update': ['SUPER_ADMIN', 'ADMIN', 'INVENTORY_MANAGER'],
  'inventory.delete': ['SUPER_ADMIN', 'ADMIN'],
  'inventory.stock.move': ['SUPER_ADMIN', 'ADMIN', 'INVENTORY_MANAGER'],

  // ─── Notification Module ───
  'notification.view': ['SUPER_ADMIN', 'ADMIN', 'NOTIFICATION_MANAGER'],
  'notification.send': ['SUPER_ADMIN', 'ADMIN', 'NOTIFICATION_MANAGER'],
  'notification.template.manage': ['SUPER_ADMIN', 'ADMIN', 'NOTIFICATION_MANAGER'],
  'notification.settings': ['SUPER_ADMIN', 'ADMIN'],

  // ─── Announcement Module ───
  'announcement.view': ['SUPER_ADMIN', 'ADMIN', 'TEACHER', 'STUDENT', 'PARENT'],
  'announcement.create': ['SUPER_ADMIN', 'ADMIN', 'TEACHER'],
  'announcement.update': ['SUPER_ADMIN', 'ADMIN'],
  'announcement.delete': ['SUPER_ADMIN', 'ADMIN'],

  // ─── Calendar Module ───
  'calendar.view': ['SUPER_ADMIN', 'ADMIN', 'TEACHER', 'STUDENT', 'PARENT'],
  'calendar.manage': ['SUPER_ADMIN', 'ADMIN'],

  // ─── Timetable Module ───
  'timetable.view': ['SUPER_ADMIN', 'ADMIN', 'TEACHER', 'STUDENT', 'PARENT'],
  'timetable.manage': ['SUPER_ADMIN', 'ADMIN'],

  // ─── Report Card Module ───
  'reportcard.view': ['SUPER_ADMIN', 'ADMIN', 'TEACHER', 'STUDENT', 'PARENT'],
  'reportcard.generate': ['SUPER_ADMIN', 'ADMIN', 'TEACHER'],
  'reportcard.approve': ['SUPER_ADMIN', 'ADMIN'],
  'reportcard.template.manage': ['SUPER_ADMIN', 'ADMIN'],

  // ─── Academic (Class/Section/Subject) Module ───
  'academic.view': ['SUPER_ADMIN', 'ADMIN', 'TEACHER'],
  'academic.manage': ['SUPER_ADMIN', 'ADMIN'],

  // ─── Enquiry Module ───
  'enquiry.view': ['SUPER_ADMIN', 'ADMIN', 'ADMISSION_MANAGER'],
  'enquiry.create': ['SUPER_ADMIN', 'ADMIN', 'ADMISSION_MANAGER'],
  'enquiry.update': ['SUPER_ADMIN', 'ADMIN', 'ADMISSION_MANAGER'],
  'enquiry.delete': ['SUPER_ADMIN', 'ADMIN'],

  // ─── Scanner Module ───
  'scanner.view': ['SUPER_ADMIN', 'ADMIN'],
  'scanner.manage': ['SUPER_ADMIN', 'ADMIN'],

  // ─── Backup & System ───
  'system.backup': ['SUPER_ADMIN', 'ADMIN'],
  'system.settings': ['SUPER_ADMIN', 'ADMIN'],
  'system.users.manage': ['SUPER_ADMIN', 'ADMIN'],

  // ─── AI Module ───
  'ai.chat': ['SUPER_ADMIN', 'ADMIN', 'TEACHER'],
  'ai.generate': ['SUPER_ADMIN', 'ADMIN', 'TEACHER'],
};

/**
 * Middleware to check if the user has a specific granular permission.
 * It maps the permission string to a list of allowed roles and uses requireRole.
 * @param {string} permission - The granular permission string (e.g., 'transport.view')
 */
const requirePermission = (permission) => {
  const allowedRoles = PERMISSION_ROLES[permission];
  if (!allowedRoles) {
    throw new Error(`Permission '${permission}' is not mapped to any roles. Add it to PERMISSION_ROLES in middleware/permissions.js`);
  }
  return requireRole(...allowedRoles);
};

module.exports = {
  PERMISSION_ROLES,
  requirePermission,
};
