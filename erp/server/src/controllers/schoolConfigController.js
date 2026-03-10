const prisma = require('../config/database');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Configure multer for logo uploads
const logoDir = path.join(__dirname, '../../uploads/logo');
if (!fs.existsSync(logoDir)) {
    fs.mkdirSync(logoDir, { recursive: true });
}

const storage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, logoDir),
    filename: (req, file, cb) => {
        const ext = path.extname(file.originalname);
        cb(null, `school_logo_${Date.now()}${ext}`);
    },
});

const upload = multer({
    storage,
    limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
    fileFilter: (req, file, cb) => {
        const allowed = ['.png', '.jpg', '.jpeg', '.svg', '.webp'];
        const ext = path.extname(file.originalname).toLowerCase();
        if (allowed.includes(ext)) {
            cb(null, true);
        } else {
            cb(new Error('Only PNG, JPG, SVG, and WebP images are allowed'));
        }
    },
}).single('logo');

/**
 * Get all school config key-value pairs
 * GET /api/school-config
 */
const getConfig = async (req, res) => {
    try {
        const configs = await prisma.schoolBranding.findMany();

        // Also include school name from env as fallback
        const configMap = {};
        configs.forEach((c) => {
            configMap[c.key] = c.value;
        });

        if (!configMap.school_name) {
            configMap.school_name = process.env.SCHOOL_NAME || 'EduSphere School';
        }

        res.json({ config: configMap });
    } catch (error) {
        console.error('Get school config error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

/**
 * Upload school logo
 * POST /api/school-config/logo
 */
const uploadLogo = async (req, res) => {
    upload(req, res, async (err) => {
        try {
            if (err) {
                return res.status(400).json({ error: err.message });
            }
            if (!req.file) {
                return res.status(400).json({ error: 'No file uploaded' });
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
                    fs.unlinkSync(path.join(logoDir, file));
                }
            });

            res.json({
                message: 'Logo uploaded successfully',
                logoUrl: logoPath,
            });
        } catch (error) {
            console.error('Upload logo error:', error);
            res.status(500).json({ error: 'Failed to upload logo' });
        }
    });
};

/**
 * Update a school config key-value pair
 * PUT /api/school-config
 * Body: { key, value }
 */
const updateConfig = async (req, res) => {
    try {
        const { key, value } = req.body;

        if (!key || value === undefined) {
            return res.status(400).json({ error: 'key and value are required' });
        }

        const config = await prisma.schoolBranding.upsert({
            where: { key },
            create: { key, value: String(value) },
            update: { value: String(value) },
        });

        res.json({ message: 'Config updated', config });
    } catch (error) {
        console.error('Update config error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

module.exports = { getConfig, uploadLogo, updateConfig };
