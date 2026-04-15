const { Server } = require('socket.io');
const logger = require('../config/logger');
let io;

const initSocket = (server, corsOptions) => {
  io = new Server(server, {
    cors: {
      ...corsOptions,
      methods: ["GET", "POST"]
    }
  });

  io.on('connection', (socket) => {
    logger.info(`New client connected: ${socket.id}`);

    // Join room based on role
    socket.on('join_dashboard', (role) => {
      socket.join(`dashboard_${role}`);
      logger.info(`Socket ${socket.id} joined dashboard_${role}`);
    });

    // Join specific entity room (e.g., student ID or class ID)
    socket.on('join_room', (roomName) => {
      socket.join(roomName);
      logger.info(`Socket ${socket.id} joined ${roomName}`);
    });

    socket.on('join_trip', (data) => {
      const roomName = `trip_${data.tripId}`;
      socket.join(roomName);
      logger.info(`Socket ${socket.id} joined ${roomName}`);
    });

    socket.on('leave_room', (roomName) => {
      socket.leave(roomName);
      logger.info(`Socket ${socket.id} left ${roomName}`);
    });

    socket.on('leave_trip', (data) => {
      const roomName = `trip_${data.tripId}`;
      socket.leave(roomName);
      logger.info(`Socket ${socket.id} left ${roomName}`);
    });

    socket.on('disconnect', () => {
      logger.info(`Client disconnected: ${socket.id}`);
    });
  });

  return io;
};

const getIO = () => {
  if (!io) {
    throw new Error('Socket.io not initialized');
  }
  return io;
};

const emitEvent = (event, data, target = null) => {
  if (!io) return;
  
  if (target) {
    if (target.startsWith('dashboard_') || target.startsWith('class_') || target.startsWith('student_')) {
      io.to(target).emit(event, data);
    } else {
      io.to(`dashboard_${target}`).emit(event, data);
    }

    // Also emit to SUPER_ADMIN and ADMIN by default for most events
    if (target !== 'SUPER_ADMIN' && target !== 'ADMIN') {
        io.to('dashboard_SUPER_ADMIN').emit(event, data);
        io.to('dashboard_ADMIN').emit(event, data);
    }
  } else {
    io.emit(event, data);
  }
};

module.exports = {
  initSocket,
  getIO,
  emitEvent
};
