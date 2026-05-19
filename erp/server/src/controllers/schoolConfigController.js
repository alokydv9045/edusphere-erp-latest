const prisma = require('../config/database');
const { createUploader } = require('../utils/fileUpload');
const path = require('path');
const fs = require('fs');
const asyncHandler = require('../utils/asyncHandler');
const logger = require('../config/logger');

const logoDir = path.join(__dirname, '../../uploads/logo');
if (!fs.existsSync(logoDir)) {
    fs.mkdirSync(logoDir, { recursive: true });
}

const upload = createUploader({
    folder: 'logo',
    type: 'image',
    maxSizeBytes: 5 * 1024 * 1024, // 5MB
}).single('logo');

/**
 * Get all school config key-value pairs
 * GET /api/school-config
 */
const getConfig = asyncHandler(async (req, res) => {
    const configs = await prisma.schoolBranding.findMany();

    // Also include school name from env as fallback
    const configMap = {};
    configs.forEach((c) => {
        configMap[c.key] = c.value;
    });

    if (!configMap.school_name) {
        configMap.school_name = process.env.SCHOOL_NAME || '';
    }

    res.status(200).json({ 
        success: true,
        config: configMap 
    });
});

/**
 * Upload school logo
 * POST /api/school-config/logo
 */
const uploadLogo = asyncHandler(async (req, res) => {
    return new Promise((resolve, reject) => {
        upload(req, res, async (err) => {
            if (err) {
                return res.status(400).json({ 
                    success: false,
                    message: err.message 
                });
            }
            
            try {
                if (!req.file) {
                    return res.status(400).json({ 
                        success: false,
                        message: 'No file uploaded' 
                    });
                }

                // Store relative path for serving via static middleware
                const logoPath = `/uploads/logo/${req.file.filename}`;

                // Upsert the school_logo config
                await prisma.schoolBranding.upsert({
                    where: { key: 'school_logo' },
                    create: { key: 'school_logo', value: logoPath },
                    update: { value: logoPath },
                });

                // Clean up old logos (keep only the latest)
                const files = fs.readdirSync(logoDir);
                files.forEach((file) => {
                    if (file !== req.file.filename) {
                        const oldPath = path.join(logoDir, file);
                        if (fs.existsSync(oldPath)) fs.unlinkSync(oldPath);
                    }
                });

                res.status(200).json({
                    success: true,
                    message: 'Logo uploaded successfully',
                    logoUrl: logoPath,
                });
                resolve();
            } catch (error) {
                logger.error('Upload logo error:', error);
                res.status(500).json({ 
                    success: false,
                    message: 'Failed to upload logo' 
                });
                resolve();
            }
        });
    });
});

/**
 * Update a school config key-value pair
 * PUT /api/school-config
 * Body: { key, value }
 */
const updateConfig = asyncHandler(async (req, res) => {
    const { key, value } = req.body;

    if (!key || value === undefined) {
        return res.status(400).json({ 
            success: false,
            message: 'key and value are required' 
        });
    }

    const config = await prisma.schoolBranding.upsert({
        where: { key },
        create: { key, value: String(value) },
        update: { value: String(value) },
    });

    res.status(200).json({ 
        success: true,
        message: 'Config updated', 
        config 
    });
});

module.exports = { getConfig, uploadLogo, updateConfig };
