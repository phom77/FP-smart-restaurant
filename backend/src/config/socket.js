const { Server } = require('socket.io');

let io;

const initSocket = (httpServer) => {
    io = new Server(httpServer, {
    cors: {
      origin: [
        "http://localhost:5173", // Frontend Local
        "http://127.0.0.1:5173"
      ],
      methods: ["GET", "POST", "PUT", "DELETE"],
      credentials: true
    }
  });

  io.on('connection', (socket) => {
    console.log(`🔌 Client connected: ${socket.id}`);

    // Join Room theo vai trò
    socket.on('join_room', (room) => {
      socket.join(room);
      console.log(`User ${socket.id} joined room: ${room}`);
    });

    socket.on('disconnect', () => {
      console.log(`❌ Client disconnected: ${socket.id}`);
    });
  });

  return io;
};

const getIO = () => {
  if (!io) {
    throw new Error("Socket.io not initialized!");
  }
  return io;
};

module.exports = { initSocket, getIO };