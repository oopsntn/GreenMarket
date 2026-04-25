import { Server as SocketIOServer, Socket } from "socket.io";
import { Server as HTTPServer } from "http";
import jwt from "jsonwebtoken";
import { JWTUserPayload } from "../dtos/auth.ts";

const JWT_SECRET = process.env.JWT_SECRET || "fallback_secret_key";

// Map to store userId -> Set of socketIds (a user can have multiple tabs open)
const userSockets = new Map<number, Set<string>>();

let io: SocketIOServer | null = null;

export const initSocket = (server: HTTPServer): SocketIOServer => {
  io = new SocketIOServer(server, {
    cors: {
      origin: "*", // In production, we should specify actual origins
      methods: ["GET", "POST"],
    },
  });

  io.use((socket: Socket, next) => {
    const token = socket.handshake.auth.token || socket.handshake.headers.authorization;
    
    if (!token) {
      // Allow unauthenticated connections for QR login
      return next();
    }

    const cleanToken = token.startsWith("Bearer ") ? token.slice(7) : token;

    try {
      const decoded = jwt.verify(cleanToken, JWT_SECRET) as JWTUserPayload;
      (socket as any).user = decoded;
      next();
    } catch (err) {
      // If token is invalid, we still allow connection but without user data
      // (Or we could return error if we want strictness, but for QR web client, we need them to connect)
      next();
    }
  });

  io.on("connection", (socket: Socket) => {
    const user = (socket as any).user as JWTUserPayload;
    if (user && user.id) {
      const userId = user.id;
      if (!userSockets.has(userId)) {
        userSockets.set(userId, new Set());
      }
      userSockets.get(userId)?.add(socket.id);
      
      console.log(`User ${userId} connected via socket ${socket.id}`);

      // Handle Admin joining a special room for system alerts
      const roleCodes = user.roleCodes || [];
      if (roleCodes.includes("ROLE_ADMIN") || roleCodes.includes("ROLE_SUPER_ADMIN")) {
        socket.join("admin-room");
        console.log(`Admin ${userId} joined admin-room`);
      }
    }

    // QR Login: Web client joins a room based on sessionId
    socket.on("join-qr-session", (sessionId: string) => {
      socket.join(`qr-session-${sessionId}`);
      console.log(`Socket ${socket.id} joined QR session room: qr-session-${sessionId}`);
    });

    socket.on("disconnect", () => {
      if (user && user.id) {
        const userId = user.id;
        userSockets.get(userId)?.delete(socket.id);
        if (userSockets.get(userId)?.size === 0) {
          userSockets.delete(userId);
        }
        console.log(`User ${userId} disconnected. Socket ${socket.id} removed.`);
      }
    });
  });

  return io;
};

export const getIO = (): SocketIOServer => {
  if (!io) {
    throw new Error("Socket.io not initialized!");
  }
  return io;
};

export const sendToUser = (userId: number, event: string, data: any) => {
  const socketIds = userSockets.get(userId);
  if (socketIds && io) {
    socketIds.forEach((id) => {
      io!.to(id).emit(event, data);
    });
    return true;
  }
  return false;
};

export const emitToQRSession = (sessionId: string, event: string, data: any) => {
  if (io) {
    io.to(`qr-session-${sessionId}`).emit(event, data);
    return true;
  }
  return false;
};

export const broadcastToAdmins = (event: string, data: any) => {
  if (io) {
    io.to("admin-room").emit(event, data);
    return true;
  }
  return false;
};
