import { Server } from "socket.io";

let io;

export const initSocket = (server) => {
  io = new Server(server, {
    cors: {
      origin: process.env.FRONTEND_URL, // FE URL
      methods: ["GET", "POST"],
    },
    transports: ["websocket", "polling"],
  });

  io.on("connection", (socket) => {
    console.log("User connected:", socket.id);

    // User join room theo userId
    socket.on("joinRoom", (userId) => {
      if (userId) {
        socket.join(userId);
        console.log(`Socket ${socket.id} joined room ${userId}`);
      }
    });

    socket.on("disconnect", () => {
      console.log("User disconnected:", socket.id);
    });
  });

  return io;
};

// Hàm gửi notification khi admin update order
export const sendOrderStatusUpdate = (userId, notification) => {
  if (!io) return;
  io.to(userId).emit("orderStatusUpdate", notification);
};
