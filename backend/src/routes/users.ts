import { Router } from "express";
import multer from "multer";
import { z } from "zod";
import { prisma } from "../lib/prisma";
import { requireAuth } from "../middleware/auth";
import { saveProfilePhoto } from "../lib/storage";
import { getEligibilitySettings, computeIsActive, nextEligibleDate } from "../lib/eligibility";

export const usersRouter = Router();
usersRouter.use(requireAuth);

const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 5 * 1024 * 1024 } });

usersRouter.get("/me", async (req, res) => {
  const user = await prisma.user.findUniqueOrThrow({ where: { id: req.session!.userId } });
  const donationCount = await prisma.donationHistory.count({ where: { userId: user.id } });
  const settings = await getEligibilitySettings();
  res.json({
    user,
    donationCount,
    isActive: computeIsActive(user.lastDonationDate, user.lastAntibioticDate, settings),
    nextEligibleDate: nextEligibleDate(user.lastDonationDate, user.lastAntibioticDate, settings),
  });
});

const updateSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  gender: z.string().max(20).optional(),
  bloodGroup: z.enum(["A_POS", "A_NEG", "B_POS", "B_NEG", "AB_POS", "AB_NEG", "O_POS", "O_NEG"]).optional(),
  lat: z.number().min(-90).max(90).optional(),
  lng: z.number().min(-180).max(180).optional(),
  addressText: z.string().max(255).optional(),
  showPhone: z.boolean().optional(),
  allowChat: z.boolean().optional(),
  lastAntibioticDate: z.coerce.date().optional(),
});

usersRouter.patch("/me", async (req, res) => {
  const parsed = updateSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.flatten() });
    return;
  }
  const user = await prisma.user.update({ where: { id: req.session!.userId }, data: parsed.data });
  res.json({ user });
});

usersRouter.post("/me/photo", upload.single("photo"), async (req, res) => {
  if (!req.file) {
    res.status(400).json({ error: "No photo file uploaded (field name: photo)" });
    return;
  }
  const photoUrl = await saveProfilePhoto(req.file.buffer, req.file.mimetype, req.session!.userId);
  const user = await prisma.user.update({ where: { id: req.session!.userId }, data: { photoUrl } });
  res.json({ user });
});
