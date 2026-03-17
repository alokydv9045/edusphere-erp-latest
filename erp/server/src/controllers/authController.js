const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const prisma = require('../config/database');
const asyncHandler = require('../utils/asyncHandler');
const { VALID_ROLES } = require('../constants');

const generateToken = (user) => {
  return jwt.sign(
    {
      userId: user.id,
      email: user.email,
      role: user.role,
      roles: user.roles || [user.role], // Include all roles in token
    },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
  );
};

const register = asyncHandler(async (req, res) => {
  const { email, password, firstName, lastName, role, roles: rolesFromBody, phone } = req.body;

  // Validate input
  if (!email || !password || !firstName || !lastName || !role) {
    return res.status(400).json({ error: 'All fields are required' });
  }

  // Build roles array — merge primary role with any additional roles provided
  let rolesArray = Array.isArray(rolesFromBody) && rolesFromBody.length > 0
    ? rolesFromBody
    : [role];

  // Always ensure the primary role is included
  if (!rolesArray.includes(role)) {
    rolesArray = [role, ...rolesArray];
  }

  // Remove duplicates and validate each role
  rolesArray = [...new Set(rolesArray)];
  const invalidRole = rolesArray.find(r => !VALID_ROLES.includes(r));
  if (invalidRole) {
    return res.status(400).json({ error: `Invalid role: ${invalidRole}` });
  }

  // Students cannot have multiple roles
  if (role === 'STUDENT' && rolesArray.length > 1) {
    return res.status(400).json({ error: 'Students cannot have multiple roles' });
  }

  // Check if user exists
  const existingUser = await prisma.user.findUnique({
    where: { email },
  });

  if (existingUser) {
    return res.status(400).json({ error: 'User already exists with this email' });
  }

  // Hash password
  const hashedPassword = await bcrypt.hash(password, 10);

  // Create user with merged roles array
  const user = await prisma.user.create({
    data: {
      email,
      password: hashedPassword,
      firstName,
      lastName,
      phone: phone || null,
      role,
      roles: rolesArray,
    },
  });

  // Generate token
  const token = generateToken(user);

  res.status(201).json({
    message: 'User registered successfully',
    token,
    user: {
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      role: user.role,
      roles: user.roles,
    },
  });
});

const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  // Validate input
  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required' });
  }

  // Find user with Student relationship and parent linkages
  const user = await prisma.user.findUnique({
    where: { email },
    include: {
      student: {
        include: {
          parents: {
            include: {
              parent: true
            }
          }
        }
      },
      teacher: { select: { id: true, assignedScannerId: true } },
      staff: { select: { id: true, assignedScannerId: true } }
    }
  });

  if (!user) {
    return res.status(401).json({ error: 'Invalid email or password' });
  }

  // Check if user is active
  if (!user.isActive) {
    return res.status(403).json({ error: 'Account is disabled' });
  }

  // Verify password
  const validPassword = await bcrypt.compare(password, user.password);

  if (!validPassword) {
    return res.status(401).json({ error: 'Invalid email or password' });
  }

  // SINGLE IDENTITY: Student + Parent share same credentials
  // If user is a Student with linked parents, they get PARENT role access
  let effectiveRoles = user.roles || [user.role];
  const parentAccess = [];

  // Check if this student has parent relationships
  if (user.student && user.student.parents && user.student.parents.length > 0) {
    // Grant PARENT role for parent access
    if (!effectiveRoles.includes('PARENT')) {
      effectiveRoles = [...effectiveRoles, 'PARENT'];
    }

    // Store parent info for display
    user.student.parents.forEach(sp => {
      parentAccess.push({
        id: sp.parent.id,
        name: `${sp.parent.firstName} ${sp.parent.lastName}`,
        relationship: sp.relationship,
        email: sp.parent.email,
        phone: sp.parent.phone
      });
    });
  }

  // Update last login
  await prisma.user.update({
    where: { id: user.id },
    data: { lastLogin: new Date() },
  });

  // Generate token with effective roles
  const token = generateToken({
    ...user,
    roles: effectiveRoles
  });

  res.json({
    message: 'Login successful',
    token,
    user: {
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      role: user.role,
      roles: effectiveRoles,
      teacher: user.teacher,
      staff: user.staff,
      // Include parent access info if applicable
      ...(parentAccess.length > 0 && {
        parentAccess,
        credentialSharing: {
          type: 'STUDENT_PARENT_SHARED',
          message: 'This account provides access to both student and parent features'
        }
      })
    },
  });
});

const getMe = asyncHandler(async (req, res) => {
  const user = await prisma.user.findUnique({
    where: { id: req.user.userId },
    select: {
      id: true,
      email: true,
      firstName: true,
      lastName: true,
      role: true,
      roles: true, // Include all roles
      phone: true,
      avatar: true,
      isActive: true,
      emailVerified: true,
      createdAt: true,
      teacher: { select: { id: true, assignedScannerId: true } },
      staff: { select: { id: true, assignedScannerId: true } }
    },
  });

  if (!user) {
    return res.status(404).json({ error: 'User not found' });
  }

  // Ensure roles field exists for backward compatibility
  const userWithRoles = {
    ...user,
    roles: user.roles && user.roles.length > 0 ? user.roles : [user.role]
  };

  res.json({ user: userWithRoles });
});

module.exports = { register, login, getMe };
