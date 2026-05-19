const userRepository = require('../repositories/UserRepository');
const bcrypt = require('bcrypt');
const { generateUserQR } = require('../utils/qrGenerator');
const { VALID_ROLES } = require('../constants');
const logger = require('../config/logger');
const { validateAndNormalizeRoles } = require('../utils/userUtils');
const { uploadToCloudinary } = require('../config/cloudinary');
const AppError = require('../utils/AppError');
const fs = require('fs');

const PASSWORD_REGEX = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/;

class UserService {
    async getAllUsers(queryParams) {
        const {
            page = 1,
            limit = 20,
            role,
            search,
            isActive,
            sortBy = 'createdAt',
            sortOrder = 'desc'
        } = queryParams;

        const skip = (parseInt(page) - 1) * parseInt(limit);
        const take = parseInt(limit);

        const where = {};
        const andConditions = [];

        if (role) {
            andConditions.push({
                OR: [
                    { role: role },
                    { roles: { has: role } }
                ]
            });
        }

        if (search) {
            andConditions.push({
                OR: [
                    { email: { contains: search, mode: 'insensitive' } },
                    { firstName: { contains: search, mode: 'insensitive' } },
                    { lastName: { contains: search, mode: 'insensitive' } },
                    { username: { contains: search, mode: 'insensitive' } }
                ]
            });
        }

        if (isActive !== undefined) {
            where.isActive = isActive === 'true';
        }

        if (andConditions.length > 0) {
            where.AND = andConditions;
        }

        const select = {
            id: true,
            email: true,
            username: true,
            firstName: true,
            lastName: true,
            phone: true,
            avatar: true,
            role: true,
            roles: true,
            isActive: true,
            emailVerified: true,
            lastLogin: true,
            createdAt: true,
            updatedAt: true,
            student: {
                select: {
                    id: true,
                    admissionNumber: true,
                    status: true,
                    parents: {
                        select: {
                            id: true,
                            relationship: true,
                            parent: {
                                select: {
                                    id: true,
                                    email: true,
                                    firstName: true,
                                    lastName: true
                                }
                            }
                        }
                    }
                }
            },
            teacher: {
                select: {
                    id: true,
                    employeeId: true
                }
            },
            staff: {
                select: {
                    id: true,
                    employeeId: true,
                    designation: true
                }
            }
        };

        const [users, total] = await Promise.all([
            userRepository.findMany({
                where,
                skip,
                take,
                orderBy: { [sortBy]: sortOrder },
                select
            }),
            userRepository.count(where)
        ]);

        const usersWithRoles = users.map(user => {
            const baseUser = {
                ...user,
                roles: user.roles && user.roles.length > 0 ? user.roles : [user.role]
            };

            const relationships = [];

            if (user.student && user.student.parents && user.student.parents.length > 0) {
                relationships.push({
                    type: 'HAS_PARENT',
                    count: user.student.parents.length,
                    details: user.student.parents.map(sp => ({
                        parentId: sp.parent.id,
                        relationship: sp.relationship,
                        parentName: `${sp.parent.firstName} ${sp.parent.lastName}`,
                        parentEmail: sp.parent.email,
                        sharedCredentials: true
                    }))
                });
            }

            if (relationships.length > 0) {
                baseUser.relationships = relationships;
            }

            return baseUser;
        });

        return {
            users: usersWithRoles,
            pagination: {
                total,
                page: parseInt(page),
                limit: parseInt(limit),
                totalPages: Math.ceil(total / parseInt(limit))
            }
        };
    }

    async getUserById(id, requester) {
        const userRoles = requester.roles || [requester.role];
        const isAdmin = userRoles.some(r => ['SUPER_ADMIN', 'ADMIN'].includes(r));
        
        if (!isAdmin && requester.userId !== id) {
            throw new AppError('Access denied: You can only view your own profile', 403);
        }

        const select = {
            id: true,
            email: true,
            username: true,
            firstName: true,
            lastName: true,
            phone: true,
            avatar: true,
            dateOfBirth: true,
            gender: true,
            bloodGroup: true,
            address: true,
            role: true,
            roles: true,
            isActive: true,
            emailVerified: true,
            lastLogin: true,
            lastPasswordChange: true,
            createdAt: true,
            updatedAt: true,
            qrCode: true,
            student: {
                include: {
                    currentClass: true,
                    section: true,
                    academicYear: true
                }
            },
            teacher: {
                include: {
                    subjects: {
                        include: {
                            subject: true
                        }
                    }
                }
            },
            staff: true
        };

        const user = await userRepository.findById(id, select);
        if (!user) {
            throw new AppError('User not found', 404);
        }

        return user;
    }

    async createUser(data) {
        const { email, password, firstName, lastName, phone, username, role, roles = [] } = data;

        if (!email || !password || !firstName || !lastName || !role) {
            throw new AppError('Email, password, firstName, lastName, and role are required', 400);
        }

        const roleCheck = validateAndNormalizeRoles(roles, role);
        if (!roleCheck.valid) {
            throw new AppError(roleCheck.message, 400);
        }

        const existingUser = await userRepository.findByEmailOrUsername(email, username);
        if (existingUser) {
            throw new AppError(existingUser.email.toLowerCase() === email.toLowerCase() ? 'Email already exists' : 'Username already exists', 400);
        }

        if (!PASSWORD_REGEX.test(password)) {
            throw new AppError('Password must be at least 8 characters with uppercase, lowercase, and a number', 400);
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        const user = await userRepository.create({
            email,
            password: hashedPassword,
            firstName,
            lastName,
            phone,
            username,
            role,
            roles: roleCheck.roles
        });

        try {
            const qrCode = await generateUserQR(user.id);
            await userRepository.update(user.id, { qrCode });
            user.qrCode = qrCode;
        } catch (qrErr) {
            logger.error(`QR generation failed (non-fatal): ${qrErr.message}`);
        }

        delete user.password;
        return user;
    }

    async updateUser(id, data) {
        const existingUser = await userRepository.findById(id, { id: true, role: true, roles: true, student: true });
        if (!existingUser) {
            throw new AppError('User not found', 404);
        }

        const updateData = {};
        const { firstName, lastName, phone, username, dateOfBirth, gender, bloodGroup, address, role, roles, isActive, emailVerified } = data;

        if (firstName !== undefined) updateData.firstName = firstName;
        if (lastName !== undefined) updateData.lastName = lastName;
        if (phone !== undefined) updateData.phone = phone;
        if (username !== undefined) updateData.username = username;
        if (dateOfBirth !== undefined) updateData.dateOfBirth = new Date(dateOfBirth);
        if (gender !== undefined) updateData.gender = gender;
        if (bloodGroup !== undefined) updateData.bloodGroup = bloodGroup;
        if (address !== undefined) updateData.address = address;
        if (isActive !== undefined) updateData.isActive = isActive;
        if (emailVerified !== undefined) updateData.emailVerified = emailVerified;

        if (role !== undefined || roles !== undefined) {
            const newPrimaryRole = role || existingUser.role;
            const newRoles = roles || existingUser.roles || [newPrimaryRole];

            const roleCheck = validateAndNormalizeRoles(roles || [newPrimaryRole], newPrimaryRole);
            if (!roleCheck.valid) {
                throw new AppError(roleCheck.message, 400);
            }

            if (existingUser.student && newRoles.length > 1) {
                throw new AppError('Students cannot have multiple roles', 400);
            }

            updateData.role = newPrimaryRole;
            updateData.roles = newRoles;
        }

        const select = {
            id: true,
            email: true,
            username: true,
            firstName: true,
            lastName: true,
            phone: true,
            avatar: true,
            dateOfBirth: true,
            gender: true,
            bloodGroup: true,
            address: true,
            role: true,
            roles: true,
            isActive: true,
            emailVerified: true,
            lastLogin: true,
            createdAt: true,
            updatedAt: true
        };

        return userRepository.update(id, updateData, select);
    }

    async deleteUser(id) {
        const user = await userRepository.findById(id, { id: true });
        if (!user) {
            throw new AppError('User not found', 404);
        }
        await userRepository.softDelete(id);
    }

    async updateUserRoles(id, { roles, primaryRole }) {
        if (!roles || !Array.isArray(roles) || roles.length === 0) {
            throw new AppError('Roles array is required and must not be empty', 400);
        }

        const existingUser = await userRepository.findById(id, { id: true, student: true });
        if (!existingUser) {
            throw new AppError('User not found', 404);
        }

        const newPrimaryRole = primaryRole || roles[0];
        const roleCheck = validateAndNormalizeRoles(roles, newPrimaryRole);
        if (!roleCheck.valid) {
            throw new AppError(roleCheck.message, 400);
        }

        if (existingUser.student && (roles.length > 1 || roles[0] !== 'STUDENT')) {
            throw new AppError('Students can only have the STUDENT role', 400);
        }

        return userRepository.update(id, { role: newPrimaryRole, roles: roleCheck.roles }, {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
            role: true,
            roles: true
        });
    }

    async getUsersByRole(role) {
        if (!VALID_ROLES.includes(role)) {
            throw new AppError('Invalid role', 400);
        }

        return userRepository.findMany({
            where: {
                OR: [
                    { role: role },
                    { roles: { has: role } }
                ],
                isActive: true
            },
            select: {
                id: true,
                email: true,
                firstName: true,
                lastName: true,
                phone: true,
                role: true,
                roles: true,
                createdAt: true
            },
            orderBy: {
                firstName: 'asc'
            }
        });
    }

    async resetPassword(id, password) {
        if (!password || !PASSWORD_REGEX.test(password)) {
            throw new AppError('Password must be at least 8 characters with uppercase, lowercase, and a number', 400);
        }

        const hashedPassword = await bcrypt.hash(password, 10);
        await userRepository.update(id, {
            password: hashedPassword,
            lastPasswordChange: new Date()
        });
    }

    async changePassword(id, { oldPassword, newPassword, confirmPassword }) {
        if (!oldPassword || !newPassword || !confirmPassword) {
            throw new AppError('All password fields are required', 400);
        }

        if (newPassword !== confirmPassword) {
            throw new AppError('New passwords do not match', 400);
        }

        if (!PASSWORD_REGEX.test(newPassword)) {
            throw new AppError('Password must be at least 8 characters with uppercase, lowercase, and a number', 400);
        }

        const user = await userRepository.findById(id, { password: true });
        if (!user) {
            throw new AppError('User not found', 404);
        }

        const isMatched = await bcrypt.compare(oldPassword, user.password);
        if (!isMatched) {
            throw new AppError('Invalid current password', 400);
        }

        const hashedPassword = await bcrypt.hash(newPassword, 10);
        await userRepository.update(id, {
            password: hashedPassword,
            lastPasswordChange: new Date()
        });
        logger.info(`Password changed for user ${id}`);
    }

    async updateProfilePicture(id, file, requester) {
        if (!file) {
            throw new AppError('No image uploaded', 400);
        }

        const userRoles = requester.roles || [requester.role];
        const isAdminRole = userRoles.some(r => ['SUPER_ADMIN', 'ADMIN'].includes(r));
        if (!isAdminRole && requester.userId !== id) {
            if (fs.existsSync(file.path)) fs.unlinkSync(file.path);
            throw new AppError('Access denied', 403);
        }

        const user = await userRepository.findById(id, { id: true });
        if (!user) {
            if (fs.existsSync(file.path)) fs.unlinkSync(file.path);
            throw new AppError('User not found', 404);
        }

        const folder = `edusphere/users/${id}/avatar`;
        const result = await uploadToCloudinary(file.path, folder);

        const updatedUser = await userRepository.update(id, { avatar: result.secure_url }, {
            id: true, email: true, firstName: true, lastName: true, avatar: true
        });

        if (fs.existsSync(file.path)) fs.unlinkSync(file.path);
        return updatedUser;
    }

    async getUserQR(id, requester) {
        const userRoles = requester.roles || [requester.role];
        const isAdmin = userRoles.some(r => ['SUPER_ADMIN', 'ADMIN'].includes(r));
        if (!isAdmin && requester.userId !== id) {
            throw new AppError('Access denied', 403);
        }

        const user = await userRepository.findById(id, { id: true, firstName: true, lastName: true, role: true, qrCode: true });
        if (!user) {
            throw new AppError('User not found', 404);
        }

        if (!user.qrCode) {
            const qrCode = await generateUserQR(id);
            await userRepository.update(id, { qrCode });
            user.qrCode = qrCode;
        }

        return {
            qrCode: user.qrCode,
            user: { id: user.id, firstName: user.firstName, lastName: user.lastName, role: user.role }
        };
    }

    async regenerateUserQR(id, requester) {
        const userRoles = requester.roles || [requester.role];
        const isAdmin = userRoles.some(r => ['SUPER_ADMIN', 'ADMIN'].includes(r));
        if (!isAdmin) {
            throw new AppError('Only administrators can regenerate QR codes', 403);
        }

        const user = await userRepository.findById(id, { id: true, qrIssued: true });
        if (!user) {
            throw new AppError('User not found', 404);
        }

        if (user.qrIssued) {
            throw new AppError('This Digital ID is marked as "Issued" and cannot be regenerated. Please unlock it first.', 403);
        }

        const qrCode = await generateUserQR(id);
        await userRepository.update(id, { qrCode });
        return qrCode;
    }

    async toggleQRIssued(id, issued, requester) {
        const userRoles = requester.roles || [requester.role];
        const isAdmin = userRoles.some(r => ['SUPER_ADMIN', 'ADMIN'].includes(r));
        if (!isAdmin) {
            throw new AppError('Only administrators can toggle Digital ID status', 403);
        }

        const user = await userRepository.findById(id, { id: true });
        if (!user) {
            throw new AppError('User not found', 404);
        }

        return userRepository.update(id, {
            qrIssued: issued,
            qrIssuedAt: issued ? new Date() : null
        }, { id: true, qrIssued: true, qrIssuedAt: true });
    }
}

module.exports = new UserService();
