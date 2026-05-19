const TimetableService = require('../services/TimetableService');
const asyncHandler = require('../utils/asyncHandler');
const { emitEvent } = require('../services/socketService');

/**
 * Timetable & Schedule Management Controller
 */
const getConfig = asyncHandler(async (req, res) => {
    const { classId } = req.query;
    if (!classId) return res.status(400).json({ success: false, message: 'Class ID is required' });

    const academicYear = await TimetableService.getCurrentAcademicYear();
    
    const config = await TimetableService.getOrCreateConfig(classId, academicYear.id);
    res.status(200).json({ 
        success: true,
        config 
    });
});

const updateConfig = asyncHandler(async (req, res) => {
    const { classId } = req.params;
    const config = await TimetableService.getOrCreateConfig(classId, null, req.body);
    res.status(200).json({ 
        success: true,
        message: 'Configuration updated successfully', 
        config 
    });
});

const generateBaseline = asyncHandler(async (req, res) => {
    const { timetableId } = req.params;
    const { configId, classId } = req.body;

    const tId = (timetableId && timetableId.length > 10) ? timetableId : null;

    await TimetableService.generateBaseline(tId, configId, classId);
    
    res.status(200).json({ 
        success: true,
        message: 'Baseline skeleton generated successfully with lunch and breaks' 
    });
});

const updateSlot = asyncHandler(async (req, res) => {
    const { slotId } = req.params;
    const slot = await TimetableService.updateSlot(slotId, req.body);
    
    // Notify affected class/teacher
    emitEvent('TIMETABLE_UPDATE', { slotId, ...req.body }, `class_${slot.sectionId}`);
    
    res.status(200).json({ 
        success: true,
        message: 'Slot updated successfully', 
        slot 
    });
});

const getTeacherSchedule = asyncHandler(async (req, res) => {
    let { teacherId } = req.params;

    if (teacherId === 'me') {
        teacherId = req.user.teacherId;
        if (!teacherId) {
            return res.status(400).json({ 
                success: false,
                message: 'You are not logged in as a teacher' 
            });
        }
    }

    const schedule = await TimetableService.getTeacherSchedule(teacherId);

    res.status(200).json({ 
        success: true,
        schedule 
    });
});

const getStudentSchedule = asyncHandler(async (req, res) => {
    const { sectionId } = req.params;

    const schedule = await TimetableService.getStudentSchedule(sectionId);

    res.status(200).json({ 
        success: true,
        schedule 
    });
});

/**
 * Room Management
 */
const getRooms = asyncHandler(async (req, res) => {
    const rooms = await TimetableService.getRooms();
    res.status(200).json({ 
        success: true,
        rooms 
    });
});

const createRoom = asyncHandler(async (req, res) => {
    const room = await TimetableService.createRoom(req.body);
    res.status(201).json({ 
        success: true,
        message: 'Room created successfully', 
        room 
    });
});

module.exports = {
    getConfig,
    updateConfig,
    generateBaseline,
    updateSlot,
    getTeacherSchedule,
    getStudentSchedule,
    getRooms,
    createRoom
};
