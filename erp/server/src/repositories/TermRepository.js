const prisma = require('../config/database');

class TermRepository {
    async findTerms(where) {
        return prisma.term.findMany({
            where,
            include: {
                academicYear: { select: { name: true } },
                _count: { select: { exams: true } },
            },
            orderBy: { order: 'asc' },
        });
    }

    async findTermById(id, include = {}) {
        return prisma.term.findUnique({
            where: { id },
            include,
        });
    }

    async createTerm(data) {
        return prisma.term.create({
            data,
            include: {
                academicYear: { select: { name: true } },
            },
        });
    }

    async updateTerm(id, data) {
        return prisma.term.update({
            where: { id },
            data,
            include: {
                academicYear: { select: { name: true } },
            },
        });
    }

    async deleteTerm(id) {
        return prisma.term.delete({ where: { id } });
    }
}

module.exports = new TermRepository();
