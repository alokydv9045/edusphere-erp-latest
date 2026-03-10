const prisma = require('../config/database');
const { uploadToCloudinary, deleteFromCloudinary } = require('../config/cloudinary');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Configure multer for temporary storage before Cloudinary upload
const upload = multer({
    dest: 'uploads/temp/',
    limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
}).single('file');

/**
 * Upload a student document
 * POST /api/students/:id/documents
 */
const uploadDocument = async (req, res) => {
    upload(req, res, async (err) => {
        try {
            if (err) return res.status(400).json({ error: err.message });
            if (!req.file) return res.status(400).json({ error: 'No file uploaded' });

            const { id: studentId } = req.params;
            const { documentType, documentName } = req.body;

            if (!documentType || !documentName) {
                // Clean up temp file
                fs.unlinkSync(req.file.path);
                return res.status(400).json({ error: 'documentType and documentName are required' });
            }

            // Verify student exists
            const student = await prisma.student.findUnique({ where: { id: studentId } });
            if (!student) {
                fs.unlinkSync(req.file.path);
                return res.status(404).json({ error: 'Student not found' });
            }

            // Upload to Cloudinary
            const folder = `edusphere/students/${studentId}/documents`;
            const result = await uploadToCloudinary(req.file.path, folder);

            // Save metadata to database
            const document = await prisma.studentDocument.create({
                data: {
                    studentId,
                    documentType,
                    documentName,
                    fileUrl: result.secure_url,
                    fileSize: req.file.size,
                    mimeType: req.file.mimetype,
                    uploadedBy: req.user.id,
                },
            });

            // Clean up temp file
            fs.unlinkSync(req.file.path);

            res.status(201).json({
                message: 'Document uploaded successfully',
                document,
            });
        } catch (error) {
            console.error('Upload document error:', error);
            if (req.file && fs.existsSync(req.file.path)) {
                fs.unlinkSync(req.file.path);
            }
            res.status(500).json({ error: 'Internal server error' });
        }
    });
};

/**
 * Get all documents for a student
 * GET /api/students/:id/documents
 */
const getStudentDocuments = async (req, res) => {
    try {
        const { id: studentId } = req.params;

        // Check permissions: Student can see own, Admin/Teacher can see any
        if (req.user.role === 'STUDENT') {
            const student = await prisma.student.findUnique({ where: { userId: req.user.id } });
            if (!student || student.id !== studentId) {
                return res.status(403).json({ error: 'Access denied' });
            }
        }

        const documents = await prisma.studentDocument.findMany({
            where: { studentId },
            orderBy: { uploadedAt: 'desc' },
        });

        res.json({ documents });
    } catch (error) {
        console.error('Get documents error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

/**
 * Delete a student document
 * DELETE /api/students/documents/:documentId
 */
const deleteDocument = async (req, res) => {
    try {
        const { documentId } = req.params;

        const document = await prisma.studentDocument.findUnique({
            where: { id: documentId },
            include: { student: true },
        });

        if (!document) {
            return res.status(404).json({ error: 'Document not found' });
        }

        // Permissions: Only owner (if student) or Admin can delete
        if (req.user.role === 'STUDENT') {
            if (document.student.userId !== req.user.id) {
                return res.status(403).json({ error: 'Access denied' });
            }
        } else if (req.user.role !== 'SUPER_ADMIN' && req.user.role !== 'ADMIN') {
            return res.status(403).json({ error: 'Access denied' });
        }

        // Extract public ID from Cloudinary URL
        // Example: https://res.cloudinary.com/cloudname/image/upload/v12345/edusphere/students/id/documents/filename.jpg
        const parts = document.fileUrl.split('/');
        const fileNameWithExt = parts[parts.length - 1];
        const publicId = `edusphere/students/${document.studentId}/documents/${fileNameWithExt.split('.')[0]}`;

        // Delete from Cloudinary
        await deleteFromCloudinary(publicId);

        // Delete from database
        await prisma.studentDocument.delete({ where: { id: documentId } });

        res.json({ message: 'Document deleted successfully' });
    } catch (error) {
        console.error('Delete document error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

module.exports = {
    uploadDocument,
    getStudentDocuments,
    deleteDocument,
};
