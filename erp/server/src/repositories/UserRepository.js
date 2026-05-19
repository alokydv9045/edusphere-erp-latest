const prisma = require('../config/database');

class UserRepository {
    async findMany({ where, skip, take, orderBy, select }) {
        return prisma.user.findMany({
            where,
            skip,
            take,
            orderBy,
            select
        });
    }

    async count(where) {
        return prisma.user.count({ where });
    }

    async findById(id, select) {
        return prisma.user.findUnique({
            where: { id },
            select
        });
    }

    async findByEmailOrUsername(email, username) {
        return prisma.user.findFirst({
            where: {
                OR: [
                    { email: email?.toLowerCase() },
                    { username: username?.toLowerCase() }
                ]
            }
        });
    }

    async create(data) {
        return prisma.user.create({ data });
    }

    async update(id, data, select) {
        return prisma.user.update({
            where: { id },
            data,
            select
        });
    }

    async softDelete(id) {
        return prisma.user.update({
            where: { id },
            data: { isActive: false }
        });
    }
}

module.exports = new UserRepository();
