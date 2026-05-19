const winston = require('winston');
require('winston-daily-rotate-file');

const auditLogger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    winston.format.json()
  ),
  transports: [
    new winston.transports.DailyRotateFile({
      filename: 'logs/audit-%DATE%.log',
      datePattern: 'YYYY-MM-DD',
      maxFiles: '90d', // Store financial/sensitive audit logs for 90 days for compliance
      maxSize: '20m',
    }),
  ],
});

const auditMiddleware = (actionType) => (req, res, next) => {
  const sanitizeBody = (body) => {
    if (!body) return {};
    const copy = { ...body };
    if (copy.password) copy.password = '[HIDDEN]';
    if (copy.cardNumber) copy.cardNumber = '[HIDDEN]';
    if (copy.cvv) copy.cvv = '[HIDDEN]';
    return copy;
  };

  res.on('finish', () => {
    auditLogger.info({
      action: actionType || `${req.method} ${req.originalUrl}`,
      userId: req.user ? req.user.id : 'anonymous',
      role: req.user ? req.user.role : 'unauthenticated',
      ip: req.ip,
      method: req.method,
      url: req.originalUrl,
      status: res.statusCode,
      body: sanitizeBody(req.body),
    });
  });

  next();
};

module.exports = { auditLogger, auditMiddleware };
