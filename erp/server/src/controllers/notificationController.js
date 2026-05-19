'use strict';

const prisma = require('../config/database');
const notifService = require('../notifications/notificationService');
const notificationService = require('../services/NotificationService');
const asyncHandler = require('../utils/asyncHandler');
const logger = require('../config/logger');

// ─────────────────────────────────────────────────────────────
// In-app notifications (header bell)
// ─────────────────────────────────────────────────────────────

const getNotifications = asyncHandler(async (req, res) => {
  const result = await notificationService.getNotifications(req.user.userId);
  res.status(200).json({
    success: true,
    ...result,
  });
});

const markAsRead = asyncHandler(async (req, res) => {
  const { id } = req.params;
  await notificationService.markAsRead(id, req.user.userId);
  res.status(200).json({
    success: true,
    message: 'Notification marked as read',
  });
});

const markAllRead = asyncHandler(async (req, res) => {
  await notificationService.markAllRead(req.user.userId);
  res.status(200).json({
    success: true,
    message: 'All notifications marked as read',
  });
});

// ─────────────────────────────────────────────────────────────
// Settings
// ─────────────────────────────────────────────────────────────

/** GET /api/notifications/settings */
const getSettings = asyncHandler(async (req, res) => {
  const settings = await notifService.getSettings();
  res.json({ success: true, settings });
});

/** PUT /api/notifications/settings  (ADMIN only) */
const updateSettings = asyncHandler(async (req, res) => {
  const settings = await notifService.updateSettings(req.body, req.user.userId);
  res.json({ success: true, message: 'Settings updated', settings });
});

// ─────────────────────────────────────────────────────────────
// Templates
// ─────────────────────────────────────────────────────────────

/** GET /api/notifications/templates */
const getTemplates = asyncHandler(async (req, res) => {
  const { type, isActive } = req.query;
  const where = {};
  if (type) where.templateType = type;
  if (isActive !== undefined) where.isActive = isActive === 'true';

  const templates = await prisma.notificationTemplate.findMany({
    where,
    orderBy: { createdAt: 'desc' },
  });
  res.json({ success: true, templates });
});

/** POST /api/notifications/templates */
const createTemplate = asyncHandler(async (req, res) => {
  const { templateName, templateType, messageBody, variables } = req.body;
  if (!templateName || !templateType || !messageBody) {
    return res.status(400).json({ success: false, message: 'templateName, templateType and messageBody are required' });
  }

  const template = await prisma.notificationTemplate.create({
    data: {
      templateName,
      templateType,
      messageBody,
      variables: variables || [],
      createdBy: req.user.userId,
    },
  });
  res.status(201).json({ success: true, message: 'Template created', template });
});

/** PUT /api/notifications/templates/:id */
const updateTemplate = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { templateName, messageBody, variables, isActive } = req.body;

  const existing = await prisma.notificationTemplate.findUnique({ where: { id } });
  if (!existing) return res.status(404).json({ success: false, message: 'Template not found' });

  const template = await prisma.notificationTemplate.update({
    where: { id },
    data: {
      ...(templateName !== undefined && { templateName }),
      ...(messageBody !== undefined && { messageBody }),
      ...(variables !== undefined && { variables }),
      ...(isActive !== undefined && { isActive }),
    },
  });
  res.json({ success: true, message: 'Template updated', template });
});

/** DELETE /api/notifications/templates/:id  (ADMIN only) */
const deleteTemplate = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const existing = await prisma.notificationTemplate.findUnique({ where: { id } });
  if (!existing) {
    return res.status(404).json({ success: false, message: 'Template not found' });
  }
  await prisma.notificationTemplate.delete({ where: { id } });
  res.json({ success: true, message: 'Template deleted' });
});

// ─────────────────────────────────────────────────────────────
// Bulk / Custom Send
// ─────────────────────────────────────────────────────────────

/**
 * POST /api/notifications/bulk-send
 * Body: { target, classId?, sectionId?, studentId?, message, notifType, scheduledAt? }
 * target: 'ALL_STUDENTS' | 'CLASS' | 'SECTION' | 'INDIVIDUAL'
 */
const bulkSend = asyncHandler(async (req, res) => {
  const { target, classId, sectionId, studentId, message, notifType = 'CUSTOM', scheduledAt } = req.body;

  if (!target || !message) {
    return res.status(400).json({ success: false, message: 'target and message are required' });
  }

  const sendAt = scheduledAt ? new Date(scheduledAt) : new Date(Date.now() + 5000);

  const count = await notifService.enqueueBulkNotif(
    { target, classId, sectionId, studentId },
    message,
    notifType,
    sendAt
  );

  res.status(201).json({
    success: true,
    message: `${count} message(s) queued for delivery`,
    queued: count,
  });
});

// ─────────────────────────────────────────────────────────────
// Queue / Logs
// ─────────────────────────────────────────────────────────────

/** GET /api/notifications/queue?status=&page=&limit= */
const getQueue = asyncHandler(async (req, res) => {
  const { status, page = 1, limit = 25 } = req.query;
  const where = {};
  if (status) where.status = status;

  const skip = (parseInt(page) - 1) * parseInt(limit);
  const [items, total] = await Promise.all([
    prisma.notificationQueue.findMany({
      where,
      orderBy: { scheduledAt: 'desc' },
      skip,
      take: parseInt(limit),
    }),
    prisma.notificationQueue.count({ where }),
  ]);

  res.json({
    success: true,
    queue: items,
    pagination: { total, page: parseInt(page), limit: parseInt(limit), totalPages: Math.ceil(total / parseInt(limit)) },
  });
});

/** GET /api/notifications/logs?page=&limit=&deliveryStatus= */
const getLogs = asyncHandler(async (req, res) => {
  const { deliveryStatus, notifType, page = 1, limit = 25 } = req.query;
  const where = {};
  if (deliveryStatus) where.deliveryStatus = deliveryStatus;
  if (notifType) where.notifType = notifType;

  const skip = (parseInt(page) - 1) * parseInt(limit);
  const [logs, total] = await Promise.all([
    prisma.notificationLog.findMany({
      where,
      orderBy: { sentAt: 'desc' },
      skip,
      take: parseInt(limit),
    }),
    prisma.notificationLog.count({ where }),
  ]);

  res.json({
    success: true,
    logs,
    pagination: { total, page: parseInt(page), limit: parseInt(limit), totalPages: Math.ceil(total / parseInt(limit)) },
  });
});

// ─────────────────────────────────────────────────────────────
// Dashboard stats
// ─────────────────────────────────────────────────────────────

/** GET /api/notifications/dashboard */
const getDashboard = asyncHandler(async (req, res) => {
  const stats = await notifService.getDashboardStats();
  const settings = await notifService.getSettings();
  res.json({ success: true, stats, settings });
});

// ─────────────────────────────────────────────────────────────
// Retry failed messages (admin utility)
// ─────────────────────────────────────────────────────────────

/** POST /api/notifications/retry — reset FAILED → PENDING so scheduler picks them up */
const retryFailed = asyncHandler(async (req, res) => {
  const result = await prisma.notificationQueue.updateMany({
    where: { status: 'FAILED' },
    data: { status: 'PENDING', scheduledAt: new Date(), failureReason: null },
  });
  res.json({ success: true, message: `${result.count} failed message(s) reset for retry` });
});

module.exports = {
  getNotifications,
  markAsRead,
  markAllRead,
  getSettings,
  updateSettings,
  getTemplates,
  createTemplate,
  updateTemplate,
  deleteTemplate,
  bulkSend,
  getQueue,
  getLogs,
  getDashboard,
  retryFailed,
};
