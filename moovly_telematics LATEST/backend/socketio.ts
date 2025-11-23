import { Server } from "socket.io";
import type { Server as HttpServer } from "http";
import { storage } from "./storage";

export function setupSocketIO(httpServer: HttpServer) {
  const io = new Server(httpServer, {
    cors: {
      origin: "*",
      methods: ["GET", "POST"]
    },
    path: "/socket.io/"
  });

  // Store connected users
  const connectedUsers = new Map<string, { userId: number; role: string; socketId: string }>();

  io.on("connection", (socket) => {
    console.log(`Socket connected: ${socket.id}`);

    // Handle user joining
    socket.on("join", ({ userId, role }: { userId: number; role: string }) => {
      console.log(`User ${userId} (${role}) joined with socket ${socket.id}`);
      
      // Store user connection
      connectedUsers.set(socket.id, { userId, role, socketId: socket.id });
      
      // Join user to their own room
      socket.join(`user_${userId}`);
      
      // Join role-based rooms
      socket.join(`role_${role}`);
      
      // Send welcome message
      socket.emit("connected", { message: "Successfully connected to Moovly Telematics" });
    });

    // Handle sending messages
    socket.on("sendMessage", async ({ toUserId, fromUserId, message, messageType = "text", entityType, entityId }) => {
      try {
        // Store message in database
        const newMessage = await storage.createMessage({
          fromUserId,
          toUserId,
          message,
          messageType,
          entityType,
          entityId,
          isRead: false
        });

        // Send message to recipient
        io.to(`user_${toUserId}`).emit("newMessage", {
          id: newMessage.id,
          from: fromUserId,
          to: toUserId,
          message: newMessage.message,
          messageType: newMessage.messageType,
          entityType: newMessage.entityType,
          entityId: newMessage.entityId,
          timestamp: newMessage.createdAt,
          isRead: false
        });

        // Confirm delivery to sender
        socket.emit("messageDelivered", { messageId: newMessage.id, status: "delivered" });
      } catch (error) {
        console.error("Error sending message:", error);
        socket.emit("messageError", { error: "Failed to send message" });
      }
    });

    // Handle job notifications
    socket.on("jobAssigned", ({ driverId, jobId, jobNumber }) => {
      io.to(`user_${driverId}`).emit("jobNotification", {
        type: "job_assigned",
        message: `New job assigned: ${jobNumber}`,
        jobId,
        timestamp: new Date()
      });
    });

    // Handle carry-over notifications
    socket.on("jobCarryOver", ({ driverId, jobId, jobNumber }) => {
      io.to(`user_${driverId}`).emit("jobNotification", {
        type: "job_carry_over",
        message: `Job ${jobNumber} carried over to your next shift`,
        jobId,
        timestamp: new Date()
      });
    });

    // Handle system alerts
    socket.on("systemAlert", ({ targetRole, message, alertType, severity }) => {
      io.to(`role_${targetRole}`).emit("systemAlert", {
        type: alertType,
        message,
        severity,
        timestamp: new Date()
      });
    });

    // Handle MoovScore updates
    socket.on("moovScoreUpdate", ({ driverId, newScore, tripId }) => {
      io.to(`user_${driverId}`).emit("moovScoreUpdate", {
        score: newScore,
        tripId,
        timestamp: new Date()
      });
    });

    // Handle message read receipts
    socket.on("markMessageRead", async ({ messageId }) => {
      try {
        await storage.markMessageAsRead(messageId);
        const userInfo = connectedUsers.get(socket.id);
        if (userInfo) {
          socket.emit("messageReadConfirm", { messageId, status: "read" });
        }
      } catch (error) {
        console.error("Error marking message as read:", error);
      }
    });

    // Handle disconnect
    socket.on("disconnect", () => {
      const userInfo = connectedUsers.get(socket.id);
      if (userInfo) {
        console.log(`User ${userInfo.userId} disconnected`);
        connectedUsers.delete(socket.id);
      }
    });
  });

  return io;
}

// Helper function to broadcast system-wide notifications
export function broadcastNotification(io: Server, message: string, type: string = "info") {
  io.emit("systemNotification", {
    message,
    type,
    timestamp: new Date()
  });
}

// Helper function to notify specific user
export function notifyUser(io: Server, userId: number, message: string, type: string = "info") {
  io.to(`user_${userId}`).emit("notification", {
    message,
    type,
    timestamp: new Date()
  });
}