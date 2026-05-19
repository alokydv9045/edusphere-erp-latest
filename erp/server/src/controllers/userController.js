const userService = require('../services/UserService');
const asyncHandler = require('../utils/asyncHandler');
const { createUploader } = require('../utils/fileUpload');

const upload = createUploader({
    folder: 'temp',
    type: 'image',
    maxSizeBytes: 5 * 1024 * 1024, // 5MB
}).single('avatar');

const uploadProfilePicture = (req, res, next) => {
    upload(req, res, (err) => {
        if (err) return res.status(400).json({ success: false, message: err.message });
        next();
    });
};

const getAllUsers = asyncHandler(async (req, res) => {
    const result = await userService.getAllUsers(req.query);
    res.json({ success: true, ...result });
});

const getUserById = asyncHandler(async (req, res) => {
    const user = await userService.getUserById(req.params.id, req.user);
    res.json({ success: true, user });
});

const createUser = asyncHandler(async (req, res) => {
    const user = await userService.createUser(req.body);
    res.status(201).json({ success: true, message: 'User created successfully', user });
});

const updateUser = asyncHandler(async (req, res) => {
    const user = await userService.updateUser(req.params.id, req.body);
    res.json({ success: true, message: 'User updated successfully', user });
});

const deleteUser = asyncHandler(async (req, res) => {
    await userService.deleteUser(req.params.id);
    res.json({ success: true, message: 'User deactivated successfully' });
});

const updateUserRoles = asyncHandler(async (req, res) => {
    const user = await userService.updateUserRoles(req.params.id, req.body);
    res.json({ success: true, message: 'User roles updated successfully', user });
});

const getUsersByRole = asyncHandler(async (req, res) => {
    const users = await userService.getUsersByRole(req.params.role);
    res.json({ success: true, users, count: users.length });
});

const resetPassword = asyncHandler(async (req, res) => {
    await userService.resetPassword(req.params.id, req.body.password);
    res.json({ success: true, message: 'Password reset successfully' });
});

const changePassword = asyncHandler(async (req, res) => {
    await userService.changePassword(req.user.userId, req.body);
    res.json({ success: true, message: 'Password changed successfully' });
});

const updateProfilePicture = asyncHandler(async (req, res) => {
    const user = await userService.updateProfilePicture(req.params.id, req.file, req.user);
    res.json({ success: true, message: 'Profile picture updated successfully', user });
});

const getUserQR = asyncHandler(async (req, res) => {
    const result = await userService.getUserQR(req.params.id, req.user);
    res.json({ success: true, ...result });
});

const regenerateUserQR = asyncHandler(async (req, res) => {
    const qrCode = await userService.regenerateUserQR(req.params.id, req.user);
    res.json({ success: true, message: 'QR code regenerated successfully', qrCode });
});

const toggleQRIssued = asyncHandler(async (req, res) => {
    const result = await userService.toggleQRIssued(req.params.id, req.body.issued, req.user);
    res.json({
        success: true,
        message: `Digital ID ${req.body.issued ? 'locked (marked as issued)' : 'unlocked'} successfully`,
        qrIssued: result.qrIssued,
        qrIssuedAt: result.qrIssuedAt
    });
});

module.exports = {
    getAllUsers,
    getUserById,
    createUser,
    updateUser,
    deleteUser,
    updateUserRoles,
    getUsersByRole,
    resetPassword,
    changePassword,
    updateProfilePicture,
    uploadProfilePicture,
    getUserQR,
    regenerateUserQR,
    toggleQRIssued,
};
