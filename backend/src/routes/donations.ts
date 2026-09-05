import { Router } from "express";
import { z } from "zod";
import { prisma } from "../lib/prisma";
import { requireAuth } from "../middleware/auth";

export const donationsRouter = Router();
donationsRouter.use(requireAuth);

donationsRouter.get("/", async (req, res) => {
  const history = await prisma.donationHistory.findMany({
    where: { userId: req.session!.userId },
    orderBy: { donationDate: "desc" },
  });
  res.json({ history, count: history.length });
});

const recordSchema = z.object({ donationDate: z.coerce.date() });

/**
 * Confirms a new donation: updates the user's lastDonationDate (which drives
 * the 120-day eligibility clock) and appends a row to DonationHistory so the
 * user can see how many times they've donated in total.
 */
donationsRouter.post("/", async (req, res) => {
  const parsed = recordSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.flatten() });
    return;
  }
  if (parsed.data.donationDate.getTime() > Date.now()) {
    res.status(400).json({ error: "Donation date cannot be in the future" });
    return;
  }

  const [, historyEntry] = await prisma.$transaction([
    prisma.user.update({
      where: { id: req.session!.userId },
      data: { lastDonationDate: parsed.data.donationDate },
    }),
    prisma.donationHistory.create({
      data: { userId: req.session!.userId, donationDate: parsed.data.donationDate },
    }),
  ]);

  res.status(201).json({ historyEntry });
});
