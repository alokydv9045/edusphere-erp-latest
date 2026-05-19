const TermRepository = require('../repositories/TermRepository');
const AppError = require('../utils/AppError');

class TermService {
    async getTerms(query) {
        const { academicYearId } = query;
        const where = {};
        if (academicYearId) where.academicYearId = academicYearId;

        return await TermRepository.findTerms(where);
    }

    async createTerm(data) {
        const { name, termType, academicYearId, startDate, endDate, weightage, order } = data;

        if (!name || !termType || !academicYearId || !startDate || !endDate) {
            throw new AppError('Required fields: name, termType, academicYearId, startDate, endDate', 400);
        }

        try {
            return await TermRepository.createTerm({
                name,
                termType,
                academicYearId,
                startDate: new Date(startDate),
                endDate: new Date(endDate),
                weightage: parseFloat(weightage) || 100,
                order: parseInt(order) || 1,
            });
        } catch (error) {
            if (error.code === 'P2002') {
                throw new AppError('A term with this name already exists for this academic year', 409);
            }
            throw error;
        }
    }

    async updateTerm(id, data) {
        const { name, termType, startDate, endDate, weightage, order } = data;

        const existing = await TermRepository.findTermById(id);
        if (!existing) {
            throw new AppError('Term not found', 404);
        }

        const updateData = {};
        if (name) updateData.name = name;
        if (termType) updateData.termType = termType;
        if (startDate) updateData.startDate = new Date(startDate);
        if (endDate) updateData.endDate = new Date(endDate);
        if (weightage !== undefined) updateData.weightage = parseFloat(weightage);
        if (order !== undefined) updateData.order = parseInt(order);

        return await TermRepository.updateTerm(id, updateData);
    }

    async deleteTerm(id) {
        const existing = await TermRepository.findTermById(id, { _count: { select: { exams: true } } });

        if (!existing) {
            throw new AppError('Term not found', 404);
        }

        if (existing._count?.exams > 0) {
            throw new AppError(`Cannot delete term with ${existing._count.exams} linked exams. Remove exams first.`, 400);
        }

        return await TermRepository.deleteTerm(id);
    }
}

module.exports = new TermService();
