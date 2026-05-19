const multer = require('multer');
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');

const ALLOWED_MIME_TYPES = {
  image: ['image/jpeg', 'image/png', 'image/webp', 'image/svg+xml'],
  pdf: ['application/pdf'],
  document: ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'],
  all: ['image/jpeg', 'image/png', 'image/webp', 'image/svg+xml', 'application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document']
};

const createUploader = ({ folder = 'temp', type = 'all', maxSizeBytes = 5 * 1024 * 1024 }) => {
  const uploadDir = path.resolve(__dirname, '..', '..', 'uploads', folder);

  const storage = multer.diskStorage({
    destination: (req, file, cb) => {
      if (!fs.existsSync(uploadDir)) {
        fs.mkdirSync(uploadDir, { recursive: true });
      }
      cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
      const randomHex = crypto.randomBytes(16).toString('hex');
      const ext = path.extname(file.originalname).toLowerCase();
      const cleanExt = ext.replace(/[^a-z0-9.]/g, '');
      cb(null, `${file.fieldname}-${Date.now()}-${randomHex}${cleanExt}`);
    }
  });

  const fileFilter = (req, file, cb) => {
    const allowedTypes = ALLOWED_MIME_TYPES[type] || ALLOWED_MIME_TYPES.all;
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error(`Invalid file type. Allowed MIME types: ${allowedTypes.join(', ')}`), false);
    }
  };

  return multer({
    storage,
    limits: { fileSize: maxSizeBytes },
    fileFilter
  });
};

module.exports = { createUploader, ALLOWED_MIME_TYPES };
