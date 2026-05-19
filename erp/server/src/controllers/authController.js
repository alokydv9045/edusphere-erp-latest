const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const prisma = require('../config/database');
const asyncHandler = require('../utils/asyncHandler');
const { validateAndNormalizeRoles } = require('../utils/userUtils');

const generateToken = (user) => {
  return jwt.sign(
    {
      userId: user.id,
      email: user.email,
      role: user.role,
      roles: (user.roles && user.roles.length > 0) ? user.roles : [user.role],
    },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || '15m' }
  );
};

const generateRefreshToken = async (userId) => {
  const token = crypto.randomBytes(40).toString('hex');
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

  await prisma.refreshToken.create({
    data: {
      token,
      userId,
      expiresAt,
    },
  });

  return token;
};

const setAuthCookies = (res, accessToken, refreshToken) => {
  const isProduction = process.env.NODE_ENV === 'production';
  const cookieOptions = (maxAge) => ({
    httpOnly: true,
    secure: isProduction,
    sameSite: isProduction ? 'none' : 'lax',
    maxAge,
    path: '/',
  });

  res.cookie('auth_token', accessToken, cookieOptions(15 * 60 * 1000)); // 15 mins
  if (refreshToken) {
    res.cookie('refresh_token', refreshToken, cookieOptions(7 * 24 * 60 * 60 * 1000)); // 7 days
  }
};

const register = asyncHandler(async (req, res) => {
  const { email, password, firstName, lastName, role, roles: rolesFromBody, phone } = req.body;

  if (!email || !password || !firstName || !lastName || !role) {
    return res.status(400).json({ error: 'All fields are required' });
  }

  const roleCheck = validateAndNormalizeRoles(rolesFromBody || [role], role);
  if (!roleCheck.valid) {
    return res.status(400).json({ error: roleCheck.message });
  }

  const { roles: rolesArray } = roleCheck;

  const existingUser = await prisma.user.findUnique({
    where: { email },
  });

  if (existingUser) {
    return res.status(400).json({ error: 'User already exists with this email' });
  }

  const hashedPassword = await bcrypt.hash(password, 10);

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

  const accessToken = generateToken(user);
  const refreshTokenStr = await generateRefreshToken(user.id);
  setAuthCookies(res, accessToken, refreshTokenStr);

  res.status(201).json({
    success: true,
    message: 'User registered successfully',
    token: accessToken,
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

  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required' });
  }

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

  if (!user || !user.isActive) {
    return res.status(401).json({ error: 'Invalid email or password' });
  }

  const validPassword = await bcrypt.compare(password, user.password);

  if (!validPassword) {
    return res.status(401).json({ error: 'Invalid email or password' });
  }

  let effectiveRoles = user.roles || [user.role];
  const parentAccess = [];

  if (user.student && user.student.parents && user.student.parents.length > 0) {
    if (!effectiveRoles.includes('PARENT')) {
      effectiveRoles = [...effectiveRoles, 'PARENT'];
    }

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

  await prisma.user.update({
    where: { id: user.id },
    data: { lastLogin: new Date() },
  });

  const userForToken = { ...user, roles: effectiveRoles };
  const accessToken = generateToken(userForToken);
  const refreshTokenStr = await generateRefreshToken(user.id);
  setAuthCookies(res, accessToken, refreshTokenStr);

  res.status(200).json({
    success: true,
    message: 'Login successful',
    token: accessToken,
    user: {
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      role: user.role,
      roles: effectiveRoles,
      teacher: user.teacher,
      staff: user.staff,
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

const refreshToken = asyncHandler(async (req, res) => {
  const tokenStr = req.cookies.refresh_token || req.body.refreshToken;

  if (!tokenStr) {
    return res.status(401).json({ error: 'Refresh token required' });
  }

  const existingToken = await prisma.refreshToken.findUnique({
    where: { token: tokenStr },
    include: { user: true }
  });

  if (!existingToken) {
    return res.status(401).json({ error: 'Invalid refresh token' });
  }

  if (existingToken.revoked) {
    await prisma.refreshToken.updateMany({
      where: { userId: existingToken.userId },
      data: { revoked: true }
    });
    return res.status(401).json({ error: 'Security alert: Invalid token reuse detected. All sessions revoked. Please log in again.' });
  }

  if (new Date() > existingToken.expiresAt) {
    return res.status(401).json({ error: 'Refresh token expired. Please log in again.' });
  }

  await prisma.refreshToken.update({
    where: { id: existingToken.id },
    data: { revoked: true }
  });

  if (!existingToken.user.isActive) {
    return res.status(403).json({ error: 'Account is disabled' });
  }

  const newAccessToken = generateToken(existingToken.user);
  const newRefreshToken = await generateRefreshToken(existingToken.user.id);

  setAuthCookies(res, newAccessToken, newRefreshToken);

  res.status(200).json({
    success: true,
    token: newAccessToken
  });
});

const logout = asyncHandler(async (req, res) => {
  const tokenStr = req.cookies.refresh_token || req.body.refreshToken;
  if (tokenStr) {
    await prisma.refreshToken.updateMany({
      where: { token: tokenStr },
      data: { revoked: true }
    });
  }

  const isProduction = process.env.NODE_ENV === 'production';
  const cookieOptions = {
    httpOnly: true,
    secure: isProduction,
    sameSite: isProduction ? 'none' : 'lax',
    path: '/',
  };
  res.clearCookie('auth_token', cookieOptions);
  res.clearCookie('refresh_token', cookieOptions);
  res.status(200).json({ success: true, message: 'Logged out successfully' });
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
      roles: true,
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

  const userWithRoles = {
    ...user,
    roles: (user.roles && user.roles.length > 0) ? user.roles : [user.role]
  };

  res.status(200).json({ 
    success: true, 
    user: userWithRoles 
  });
});

module.exports = { register, login, refreshToken, getMe, logout };
