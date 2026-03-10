const prisma = require('../config/database');
const { generateReportCardPDF } = require('../utils/reportCardGenerator');

// Generate report cards for students
const generateReportCards = async (req, res) => {
    try {
        const { examId, studentIds } = req.body;

        if (!examId || !studentIds || !Array.isArray(studentIds) || studentIds.length === 0) {
            return res.status(400).json({ error: 'Required: examId and studentIds (non-empty array)' });
        }

        const exam = await prisma.exam.findUnique({
            where: { id: examId },
            include: { examResults: { select: { studentId: true } } },
        });

        if (!exam) {
            return res.status(404).json({ error: 'Exam not found' });
        }

        const generatedBy = req.user.id;
        const created = [];
        const errors = [];

        for (const studentId of studentIds) {
            try {
                // Check if exam result exists for this student
                const hasResult = exam.examResults.some(r => r.studentId === studentId);
                if (!hasResult) {
                    errors.push({ studentId, reason: 'No exam result found for this student' });
                    continue;
                }

                const reportCard = await prisma.reportCard.upsert({
                    where: { examId_studentId: { examId, studentId } },
                    create: {
                        examId,
                        studentId,
                        generatedBy,
                        status: 'DRAFT',
                    },
                    update: {
                        generatedBy,
                        status: 'DRAFT',
                        submittedAt: null,
                        approvedBy: null,
                        approvedAt: null,
                        rejectionRemark: null,
                    },
                });
                created.push(reportCard);
            } catch (err) {
                errors.push({ studentId, reason: err.message });
            }
        }

        res.status(201).json({
            message: `Generated ${created.length} report cards`,
            created: created.length,
            errors,
        });
    } catch (error) {
        console.error('Generate report cards error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

// Get report cards (with filters)
const getReportCards = async (req, res) => {
    try {
        const { examId, status, classId, studentId: queryStudentId } = req.query;

        const where = {};
        if (examId) where.examId = examId;
        if (status) where.status = status;

        // Data isolation: Students only see their own published report cards
        if (req.user.role === 'STUDENT') {
            const student = await prisma.student.findFirst({ where: { userId: req.user.id } });
            if (!student) return res.status(404).json({ error: 'Student profile not found' });
            where.studentId = student.id;
            where.status = 'PUBLISHED'; // Force status for students
        } else if (queryStudentId) {
            where.studentId = queryStudentId;
        }

        if (classId) {
            where.exam = { classId };
        }

        const reportCards = await prisma.reportCard.findMany({
            where,
            include: {
                exam: {
                    include: {
                        academicYear: { select: { name: true } },
                        term: { select: { name: true } }
                    }
                },
                student: {
                    include: {
                        user: { select: { firstName: true, lastName: true } },
                        section: { select: { name: true } },
                    },
                },
            },
            orderBy: { createdAt: 'desc' },
        });

        res.json({ reportCards });
    } catch (error) {
        console.error('Get report cards error:', error.message || error);
        res.status(500).json({ error: error.message || 'Internal server error' });
    }
};

// Submit report card for approval (class teacher → principal)
const submitReportCard = async (req, res) => {
    try {
        const { id } = req.params;

        const reportCard = await prisma.reportCard.findUnique({ where: { id } });
        if (!reportCard) {
            return res.status(404).json({ error: 'Report card not found' });
        }

        if (reportCard.status !== 'DRAFT' && reportCard.status !== 'REJECTED') {
            return res.status(400).json({ error: 'Only DRAFT or REJECTED report cards can be submitted' });
        }

        const updated = await prisma.reportCard.update({
            where: { id },
            data: {
                status: 'SUBMITTED',
                submittedAt: new Date(),
                rejectionRemark: null,
            },
        });

        res.json({ message: 'Report card submitted for approval', reportCard: updated });
    } catch (error) {
        console.error('Submit report card error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

// Bulk submit report cards
const bulkSubmitReportCards = async (req, res) => {
    try {
        const { reportCardIds } = req.body;

        if (!reportCardIds || !Array.isArray(reportCardIds) || reportCardIds.length === 0) {
            return res.status(400).json({ error: 'Required: reportCardIds (non-empty array)' });
        }

        const result = await prisma.reportCard.updateMany({
            where: {
                id: { in: reportCardIds },
                status: { in: ['DRAFT', 'REJECTED'] },
            },
            data: {
                status: 'SUBMITTED',
                submittedAt: new Date(),
                rejectionRemark: null,
            },
        });

        res.json({ message: `${result.count} report cards submitted for approval` });
    } catch (error) {
        console.error('Bulk submit error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

// Approve report card (principal)
const approveReportCard = async (req, res) => {
    try {
        const { id } = req.params;

        const reportCard = await prisma.reportCard.findUnique({ where: { id } });
        if (!reportCard) {
            return res.status(404).json({ error: 'Report card not found' });
        }

        if (reportCard.status !== 'SUBMITTED') {
            return res.status(400).json({ error: 'Only SUBMITTED report cards can be approved' });
        }

        const updated = await prisma.reportCard.update({
            where: { id },
            data: {
                status: 'APPROVED',
                approvedBy: req.user.id,
                approvedAt: new Date(),
            },
        });

        res.json({ message: 'Report card approved', reportCard: updated });
    } catch (error) {
        console.error('Approve report card error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

// Bulk approve
const bulkApproveReportCards = async (req, res) => {
    try {
        const { reportCardIds } = req.body;

        if (!reportCardIds || !Array.isArray(reportCardIds) || reportCardIds.length === 0) {
            return res.status(400).json({ error: 'Required: reportCardIds (non-empty array)' });
        }

        const result = await prisma.reportCard.updateMany({
            where: {
                id: { in: reportCardIds },
                status: 'SUBMITTED',
            },
            data: {
                status: 'APPROVED',
                approvedBy: req.user.id,
                approvedAt: new Date(),
            },
        });

        res.json({ message: `${result.count} report cards approved` });
    } catch (error) {
        console.error('Bulk approve error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

// Reject report card (principal)
const rejectReportCard = async (req, res) => {
    try {
        const { id } = req.params;
        const { remark } = req.body;

        if (!remark) {
            return res.status(400).json({ error: 'Rejection remark is required' });
        }

        const reportCard = await prisma.reportCard.findUnique({ where: { id } });
        if (!reportCard) {
            return res.status(404).json({ error: 'Report card not found' });
        }

        if (reportCard.status !== 'SUBMITTED') {
            return res.status(400).json({ error: 'Only SUBMITTED report cards can be rejected' });
        }

        const updated = await prisma.reportCard.update({
            where: { id },
            data: {
                status: 'REJECTED',
                rejectionRemark: remark,
            },
        });

        res.json({ message: 'Report card rejected', reportCard: updated });
    } catch (error) {
        console.error('Reject report card error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

// Download report card as PDF
const downloadReportCard = async (req, res) => {
    try {
        const { id } = req.params;

        const reportCard = await prisma.reportCard.findUnique({
            where: { id },
            include: {
                student: {
                    include: {
                        user: { select: { firstName: true, lastName: true } },
                        section: { select: { name: true } },
                        class: { select: { name: true } },
                    },
                },
                exam: {
                    include: {
                        academicYear: { select: { name: true } },
                        term: { select: { name: true } },
                        examSubjects: {
                            include: { subject: { select: { name: true } } },
                        },
                    },
                },
            },
        });

        if (!reportCard) {
            return res.status(404).json({ error: 'Report card not found' });
        }

        // Fetch detailed marks for this student and exam
        const examResults = await prisma.examMark.findMany({
            where: {
                studentId: reportCard.studentId,
                examSubject: { examId: reportCard.examId },
            },
            include: {
                examSubject: {
                    include: { subject: { select: { name: true } } },
                },
            },
        });

        // Prepare data for PDF generator
        // Fetch school branding config
        const brandingEntries = await prisma.schoolBranding.findMany();
        const brandingMap = {};
        brandingEntries.forEach(e => { brandingMap[e.key] = e.value; });

        const pdfData = {
            student: {
                name: `${reportCard.student.user.firstName} ${reportCard.student.user.lastName}`,
                admissionNo: reportCard.student.admissionNo,
            },
            exam: {
                name: reportCard.exam.name,
            },
            term: reportCard.exam.term?.name || '-',
            class: reportCard.student.class?.name || '-',
            section: reportCard.student.section?.name || '-',
            academicYear: reportCard.exam.academicYear?.name || '-',
            results: examResults.map(m => ({
                subjectName: m.examSubject.subject.name,
                theoryObtained: m.theoryObtained,
                practicalObtained: m.practicalObtained,
                internalObtained: m.internalObtained,
                obtainedMarks: m.obtainedMarks,
                totalMarks: m.examSubject.totalMarks,
                passMarks: m.examSubject.passMarks,
                grade: m.grade,
                isAbsent: m.isAbsent,
                absenceType: m.absenceType,
            })),
            template: await prisma.reportTemplate.findFirst({ where: { isDefault: true } }) || {},
            schoolConfig: {
                schoolName: brandingMap.school_name || process.env.SCHOOL_NAME,
                logoPath: brandingMap.school_logo || null,
            },
        };

        const pdfBuffer = await generateReportCardPDF(pdfData);

        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename=ReportCard_${pdfData.student.admissionNo}.pdf`);
        res.send(pdfBuffer);
    } catch (error) {
        console.error('Download report card error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

// Bulk publish report cards
const bulkPublishReportCards = async (req, res) => {
    try {
        const { reportCardIds } = req.body;

        if (!reportCardIds || !Array.isArray(reportCardIds) || reportCardIds.length === 0) {
            return res.status(400).json({ error: 'Required: reportCardIds (non-empty array)' });
        }

        const result = await prisma.reportCard.updateMany({
            where: {
                id: { in: reportCardIds },
                status: 'APPROVED',
            },
            data: {
                status: 'PUBLISHED',
            },
        });

        res.json({ message: `${result.count} report cards published successfully` });
    } catch (error) {
        console.error('Bulk publish error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

// --- Report Template Controllers ---

const getReportTemplates = async (req, res) => {
    try {
        const templates = await prisma.reportTemplate.findMany({
            orderBy: { createdAt: 'desc' }
        });
        res.json({ templates });
    } catch (error) {
        console.error('Get templates error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

const createReportTemplate = async (req, res) => {
    try {
        const templateData = req.body;
        if (templateData.isDefault) {
            await prisma.reportTemplate.updateMany({ data: { isDefault: false } });
        }
        const template = await prisma.reportTemplate.create({ data: templateData });
        res.status(201).json({ template });
    } catch (error) {
        console.error('Create template error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

const updateReportTemplate = async (req, res) => {
    try {
        const { id } = req.params;
        const updates = req.body;
        if (updates.isDefault) {
            await prisma.reportTemplate.updateMany({
                where: { id: { not: id } },
                data: { isDefault: false }
            });
        }
        const template = await prisma.reportTemplate.update({
            where: { id },
            data: updates
        });
        res.json({ template });
    } catch (error) {
        console.error('Update template error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

module.exports = {
    generateReportCards,
    getReportCards,
    submitReportCard,
    bulkSubmitReportCards,
    approveReportCard,
    bulkApproveReportCards,
    rejectReportCard,
    downloadReportCard,
    bulkPublishReportCards,
    getReportTemplates,
    createReportTemplate,
    updateReportTemplate,
};
