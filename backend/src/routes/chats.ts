import { Router } from "express";
import { z } from "zod";
import { prisma } from "../lib/prisma";
import { requireAuth } from "../middleware/auth";
import { getIO } from "../lib/socketRegistry";
import { sendExpoPush } from "../lib/push";

export const chatsRouter = Router();
chatsRouter.use(requireAuth);

function chatRoom(chatId: number) {
  return `chat:${chatId}`;
}

// List the current user's conversations, newest activity first.
chatsRouter.get("/", async (req, res) => {
  const userId = req.session!.userId;
  const chats = await prisma.chat.findMany({
    where: { OR: [{ userAId: userId }, { userBId: userId }] },
    include: {
      userA: { select: { id: true, username: true, name: true, photoUrl: true } },
      userB: { select: { id: true, username: true, name: true, photoUrl: true } },
      messages: { orderBy: { sentAt: "desc" }, take: 1 },
    },
  });
  const result = chats
    .map((c) => ({
      id: c.id,
      otherUser: c.userAId === userId ? c.userB : c.userA,
      lastMessage: c.messages[0] ?? null,
    }))
    .sort((a, b) => {
      const at = a.lastMessage?.sentAt.getTime() ?? 0;
      const bt = b.lastMessage?.sentAt.getTime() ?? 0;
      return bt - at;
    });
  res.json({ chats: result });
});

const startChatSchema = z.object({ otherUserId: z.number().int() });

// Get-or-create the 1:1 chat between the current user and another donor.
chatsRouter.post("/", async (req, res) => {
  const parsed = startChatSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.flatten() });
    return;
  }
  const userId = req.session!.userId;
  const otherUserId = parsed.data.otherUserId;
  if (otherUserId === userId) {
    res.status(400).json({ error: "Cannot start a chat with yourself" });
    return;
  }

  const other = await prisma.user.findUnique({ where: { id: otherUserId } });
  if (!other || other.status === "banned") {
    res.status(404).json({ error: "User not found" });
    return;
  }
  if (!other.allowChat) {
    res.status(403).json({ error: "This donor has chat turned off" });
    return;
  }

  const [userAId, userBId] = userId < otherUserId ? [userId, otherUserId] : [otherUserId, userId];
  const chat = await prisma.chat.upsert({
    where: { userAId_userBId: { userAId, userBId } },
    create: { userAId, userBId },
    update: {},
  });
  res.json({ chat });
});

async function assertParticipant(chatId: number, userId: number) {
  const chat = await prisma.chat.findUnique({ where: { id: chatId } });
  if (!chat || (chat.userAId !== userId && chat.userBId !== userId)) return null;
  return chat;
}

chatsRouter.get("/:id/messages", async (req, res) => {
  const chatId = Number(req.params.id);
  const chat = await assertParticipant(chatId, req.session!.userId);
  if (!chat) {
    res.status(404).json({ error: "Chat not found" });
    return;
  }
  const messages = await prisma.message.findMany({
    where: { chatId },
    orderBy: { sentAt: "asc" },
    take: 200,
  });
  res.json({ messages });
});

const sendMessageSchema = z.object({ body: z.string().min(1).max(2000) });

chatsRouter.post("/:id/messages", async (req, res) => {
  const chatId = Number(req.params.id);
  const chat = await assertParticipant(chatId, req.session!.userId);
  if (!chat) {
    res.status(404).json({ error: "Chat not found" });
    return;
  }
  const parsed = sendMessageSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.flatten() });
    return;
  }

  const message = await prisma.message.create({
    data: { chatId, senderId: req.session!.userId, body: parsed.data.body },
  });

  getIO().to(chatRoom(chatId)).emit("message:new", message);
  res.status(201).json({ message });

  const recipientId = chat.userAId === req.session!.userId ? chat.userBId : chat.userAId;
  const [sender, recipientTokens] = await Promise.all([
    prisma.user.findUnique({ where: { id: req.session!.userId }, select: { name: true } }),
    prisma.deviceToken.findMany({ where: { userId: recipientId } }),
  ]);
  await sendExpoPush(
    recipientTokens.map((t) => ({
      to: t.expoPushToken,
      title: sender?.name ?? "New message",
      body: parsed.data.body,
      data: { type: "chat", chatId },
    }))
  );
});
