const prisma = require('../config/database');

// Get all announcements
const getAnnouncements = async (req, res) => {
  try {
    const { targetAudience, isPublished, page = 1, limit = 25 } = req.query;

    const where = {};
    if (targetAudience) where.targetAudience = { has: targetAudience };
    if (isPublished !== undefined) where.isPublished = isPublished === 'true';

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const announcements = await prisma.announcement.findMany({
      where,
      skip,
      take: parseInt(limit),
      orderBy: { createdAt: 'desc' },
    });

    const total = await prisma.announcement.count({ where });

    // Map to frontend expected format
    const formattedAnnouncements = announcements.map(a => ({
      ...a,
      isActive: a.isPublished,
      targetAudience: a.targetAudience.length ? a.targetAudience : ['ALL'],
      expiryDate: a.expiresAt
    }));

    res.json({
      announcements: formattedAnnouncements,
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(total / parseInt(limit)),
      },
    });
  } catch (error) {
    console.error('Get announcements error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Get single announcement
const getAnnouncement = async (req, res) => {
  try {
    const { id } = req.params;

    const announcement = await prisma.announcement.findUnique({
      where: { id },
    });

    if (!announcement) {
      return res.status(404).json({ error: 'Announcement not found' });
    }

    res.json({
      announcement: {
        ...announcement,
        isActive: announcement.isPublished,
        targetAudience: announcement.targetAudience.length ? announcement.targetAudience : ['ALL'],
        expiryDate: announcement.expiresAt
      }
    });
  } catch (error) {
    console.error('Get announcement error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Create announcement
const createAnnouncement = async (req, res) => {
  try {
    const {
      title,
      content,
      targetAudience, // 'ALL', 'STUDENTS', 'TEACHERS', 'PARENTS'
      priority,
      expiryDate,
    } = req.body;

    if (!title || !content) {
      return res.status(400).json({ error: 'Required fields (title, content) missing' });
    }

    // Convert targetAudience string to array
    const audienceArray = targetAudience && targetAudience !== 'ALL' ? [targetAudience] : [];

    // Map MEDIUM to NORMAL for the database enum
    const finalPriority = priority === 'MEDIUM' ? 'NORMAL' : (priority || 'NORMAL');

    const announcement = await prisma.announcement.create({
      data: {
        title,
        content,
        targetAudience: audienceArray,
        classIds: [], // Default to empty array as required by schema
        priority: finalPriority,
        isPublished: true, // Auto publish for now
        publishedAt: new Date(),
        expiresAt: expiryDate ? new Date(expiryDate) : null,
        createdBy: req.user.userId || req.user.id,
      },
    });

    res.status(201).json({
      message: 'Announcement created successfully',
      announcement,
    });
  } catch (error) {
    console.error('Create announcement error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Update announcement
const updateAnnouncement = async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    const announcement = await prisma.announcement.findUnique({ where: { id } });

    if (!announcement) {
      return res.status(404).json({ error: 'Announcement not found' });
    }

    const allowedUpdates = [
      'title',
      'content',
      'targetAudience',
      'priority',
      'expiryDate',
      'isActive',
    ];

    const updateData = {};
    Object.keys(updates).forEach((key) => {
      if (allowedUpdates.includes(key)) {
        if (key === 'expiryDate') {
          updateData.expiresAt = updates[key] ? new Date(updates[key]) : null;
        } else if (key === 'targetAudience') {
          updateData.targetAudience = updates[key] && updates[key] !== 'ALL' ? [updates[key]] : [];
        } else if (key === 'isActive') {
          updateData.isPublished = updates[key];
        } else if (key === 'priority') {
          // Map MEDIUM to NORMAL for the database enum
          updateData[key] = updates[key] === 'MEDIUM' ? 'NORMAL' : updates[key];
        } else {
          updateData[key] = updates[key];
        }
      }
    });

    const updatedAnnouncement = await prisma.announcement.update({
      where: { id },
      data: updateData,
    });

    res.json({
      message: 'Announcement updated successfully',
      announcement: updatedAnnouncement,
    });
  } catch (error) {
    console.error('Update announcement error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Delete announcement
const deleteAnnouncement = async (req, res) => {
  try {
    const { id } = req.params;

    await prisma.announcement.delete({
      where: { id },
    });

    res.json({ message: 'Announcement deleted successfully' });
  } catch (error) {
    console.error('Delete announcement error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Get active announcements for user
const getActiveAnnouncementsForUser = async (req, res) => {
  try {
    const userRole = req.user.role; // e.g. 'STUDENT'

    const roleMap = {
      'STUDENT': 'STUDENTS',
      'TEACHER': 'TEACHERS',
      'PARENT': 'PARENTS',
      'ACCOUNTANT': 'STAFF',
      'LIBRARIAN': 'STAFF',
      'HR_MANAGER': 'STAFF',
      'INVENTORY_MANAGER': 'STAFF',
    };

    // Admin/SuperAdmin roles see all announcements
    const isAdminRole = ['ADMIN', 'SUPER_ADMIN', 'ADMISSION_MANAGER'].includes(userRole);
    const mappedRole = roleMap[userRole] || userRole;

    const now = new Date();

    const announcements = await prisma.announcement.findMany({
      where: {
        isPublished: true,
        OR: [
          { expiresAt: null },
          { expiresAt: { gte: now } }
        ],
      },
      orderBy: [
        { priority: 'desc' },
        { createdAt: 'desc' },
      ],
      take: 10,
    });

    const filteredAnnouncements = announcements.filter(a => {
      if (isAdminRole) return true; // Admins see everything
      if (!a.targetAudience || a.targetAudience.length === 0) return true; // 'ALL'
      return a.targetAudience.includes(mappedRole) || a.targetAudience.includes(userRole);
    });

    const formattedAnnouncements = filteredAnnouncements.map(a => ({
      ...a,
      isActive: a.isPublished,
      targetAudience: a.targetAudience.length ? a.targetAudience : ['ALL'],
      expiryDate: a.expiresAt
    }));

    res.json({ announcements: formattedAnnouncements });
  } catch (error) {
    console.error('Get active announcements error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

module.exports = {
  getAnnouncements,
  getAnnouncement,
  createAnnouncement,
  updateAnnouncement,
  deleteAnnouncement,
  getActiveAnnouncementsForUser,
};
