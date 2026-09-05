import { Router } from "express";
import { z } from "zod";
import { prisma } from "../lib/prisma";
import { requireAuth, requireAdmin } from "../middleware/auth";
import { getEligibilitySettings, computeIsActive } from "../lib/eligibility";

export const adminRouter = Router();
adminRouter.use(requireAuth, requireAdmin);

adminRouter.get("/users", async (req, res) => {
  const query = typeof req.query.query === "string" ? req.query.query : undefined;
  const users = await prisma.user.findMany({
    where: query
      ? { OR: [{ username: { contains: query } }, { phone: { contains: query } }, { name: { contains: query } }] }
      : undefined,
    orderBy: { createdAt: "desc" },
    take: 200,
  });
  res.json({ users });
});

const updateUserSchema = z.object({
  status: z.enum(["active", "banned"]).optional(),
  role: z.enum(["user", "admin"]).optional(),
});

adminRouter.patch("/users/:id", async (req, res) => {
  const parsed = updateUserSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.flatten() });
    return;
  }
  const user = await prisma.user.update({ where: { id: Number(req.params.id) }, data: parsed.data });
  res.json({ user });
});

adminRouter.get("/donors", async (req, res) => {
  const users = await prisma.user.findMany({ orderBy: { username: "asc" }, take: 500 });
  const settings = await getEligibilitySettings();
  const donors = users.map((u) => ({
    ...u,
    isActive: computeIsActive(u.lastDonationDate, u.lastAntibioticDate, settings),
  }));
  res.json({ donors });
});

adminRouter.get("/stats", async (_req, res) => {
  const [totalUsers, totalDonations, bannedUsers] = await Promise.all([
    prisma.user.count(),
    prisma.donationHistory.count(),
    prisma.user.count({ where: { status: "banned" } }),
  ]);
  res.json({ totalUsers, totalDonations, bannedUsers });
});

adminRouter.get("/settings", async (_req, res) => {
  const settings = await prisma.appSetting.findMany();
  res.json({ settings });
});

const settingsSchema = z.object({
  donation_cycle_days: z.coerce.number().int().positive().optional(),
  antibiotic_gap_days: z.coerce.number().int().positive().optional(),
});

adminRouter.patch("/settings", async (req, res) => {
  const parsed = settingsSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.flatten() });
    return;
  }
  const entries = Object.entries(parsed.data) as [string, number][];
  await prisma.$transaction(
    entries.map(([key, value]) =>
      prisma.appSetting.upsert({
        where: { key },
        create: { key, value: String(value) },
        update: { value: String(value) },
      })
    )
  );
  res.json({ ok: true });
});
