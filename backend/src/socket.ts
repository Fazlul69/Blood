import type { Server as HttpServer } from "http";
import { Server } from "socket.io";
import { verifySession } from "./lib/jwt";
import { prisma } from "./lib/prisma";
import { setIO } from "./lib/socketRegistry";

export function createSocketServer(httpServer: HttpServer) {
  const io = new Server(httpServer, { cors: { origin: "*" } });

  io.use((socket, next) => {
    const token = socket.handshake.auth?.token as string | undefined;
    if (!token) return next(new Error("Missing auth token"));
    try {
      socket.data.session = verifySession(token);
      next();
    } catch {
      next(new Error("Invalid or expired token"));
    }
  });

  io.on("connection", (socket) => {
    const userId = socket.data.session.userId as number;

    // Join every chat room the user is a participant in, so message:new events reach them.
    prisma.chat
      .findMany({ where: { OR: [{ userAId: userId }, { userBId: userId }] }, select: { id: true } })
      .then((chats) => {
        for (const chat of chats) socket.join(`chat:${chat.id}`);
      });

    socket.on("chat:join", (chatId: number) => {
      socket.join(`chat:${chatId}`);
    });
  });

  setIO(io);
  return io;
}
