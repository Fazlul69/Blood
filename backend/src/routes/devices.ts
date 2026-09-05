import { Router } from "express";
import { z } from "zod";
import { prisma } from "../lib/prisma";
import { requireAuth } from "../middleware/auth";

export const devicesRouter = Router();
devicesRouter.use(requireAuth);

const registerSchema = z.object({ expoPushToken: z.string().min(1) });

// Registers/refreshes this device's Expo push token for the current user.
devicesRouter.post("/", async (req, res) => {
  const parsed = registerSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.flatten() });
    return;
  }
  await prisma.deviceToken.upsert({
    where: { expoPushToken: parsed.data.expoPushToken },
    create: { userId: req.session!.userId, expoPushToken: parsed.data.expoPushToken },
    update: { userId: req.session!.userId },
  });
  res.status(201).json({ ok: true });
});
