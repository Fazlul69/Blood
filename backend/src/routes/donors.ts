import { Router } from "express";
import { z } from "zod";
import { Prisma } from "@prisma/client";
import { prisma } from "../lib/prisma";
import { requireAuth } from "../middleware/auth";
import { getEligibilitySettings, computeIsActive, nextEligibleDate } from "../lib/eligibility";

export const donorsRouter = Router();
donorsRouter.use(requireAuth);

const searchSchema = z.object({
  lat: z.coerce.number().min(-90).max(90).optional(),
  lng: z.coerce.number().min(-180).max(180).optional(),
  radiusKm: z.coerce.number().positive().max(500).optional(),
  bloodGroup: z.enum(["A_POS", "A_NEG", "B_POS", "B_NEG", "AB_POS", "AB_NEG", "O_POS", "O_NEG"]).optional(),
  username: z.string().max(30).optional(),
  activeOnly: z.coerce.boolean().optional(),
});

type DonorRow = {
  id: number;
  username: string;
  name: string;
  bloodGroup: string;
  photoUrl: string | null;
  lat: number | null;
  lng: number | null;
  addressText: string | null;
  showPhone: boolean;
  allowChat: boolean;
  phone: string;
  lastDonationDate: Date | null;
  lastAntibioticDate: Date | null;
  distanceKm: number | null;
};

/**
 * Search/filter donors for the map and list views. Supports:
 * - radius search (lat/lng/radiusKm) using MySQL's ST_Distance_Sphere
 * - blood group filter
 * - username search
 * - activeOnly, to only return donors currently eligible (green)
 */
donorsRouter.get("/", async (req, res) => {
  const parsed = searchSchema.safeParse(req.query);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.flatten() });
    return;
  }
  const { lat, lng, radiusKm, bloodGroup, username, activeOnly } = parsed.data;
  const selfId = req.session!.userId;

  const conditions: Prisma.Sql[] = [Prisma.sql`u.id != ${selfId}`, Prisma.sql`u.status = 'active'`];
  if (bloodGroup) conditions.push(Prisma.sql`u.bloodGroup = ${bloodGroup}`);
  if (username) conditions.push(Prisma.sql`u.username LIKE ${`%${username}%`}`);

  const hasGeoFilter = lat !== undefined && lng !== undefined;
  const distanceExpr = hasGeoFilter
    ? Prisma.sql`ST_Distance_Sphere(POINT(u.lng, u.lat), POINT(${lng}, ${lat})) / 1000`
    : Prisma.sql`NULL`;

  if (hasGeoFilter) {
    conditions.push(Prisma.sql`u.lat IS NOT NULL AND u.lng IS NOT NULL`);
    if (radiusKm !== undefined) {
      conditions.push(Prisma.sql`${distanceExpr} <= ${radiusKm}`);
    }
  }

  const whereClause = Prisma.join(conditions, " AND ");
  const orderClause = hasGeoFilter ? Prisma.sql`ORDER BY distanceKm ASC` : Prisma.sql`ORDER BY u.username ASC`;

  const rows = await prisma.$queryRaw<DonorRow[]>`
    SELECT
      u.id, u.username, u.name, u.bloodGroup, u.photoUrl, u.lat, u.lng, u.addressText,
      u.showPhone, u.allowChat, u.phone, u.lastDonationDate, u.lastAntibioticDate,
      ${distanceExpr} AS distanceKm
    FROM User u
    WHERE ${whereClause}
    ${orderClause}
    LIMIT 200
  `;

  const settings = await getEligibilitySettings();
  const donors = rows
    .map((row) => ({
      id: row.id,
      username: row.username,
      name: row.name,
      bloodGroup: row.bloodGroup,
      photoUrl: row.photoUrl,
      lat: row.lat,
      lng: row.lng,
      addressText: row.addressText,
      allowChat: row.allowChat,
      phone: row.showPhone ? row.phone : null,
      lastDonationDate: row.lastDonationDate,
      distanceKm: row.distanceKm === null ? null : Number(row.distanceKm),
      isActive: computeIsActive(row.lastDonationDate, row.lastAntibioticDate, settings),
      nextEligibleDate: nextEligibleDate(row.lastDonationDate, row.lastAntibioticDate, settings),
    }))
    .filter((d) => !activeOnly || d.isActive);

  res.json({ donors });
});

donorsRouter.get("/:id", async (req, res) => {
  const id = Number(req.params.id);
  const donor = await prisma.user.findUnique({ where: { id } });
  if (!donor || donor.status === "banned") {
    res.status(404).json({ error: "Donor not found" });
    return;
  }
  const donationCount = await prisma.donationHistory.count({ where: { userId: donor.id } });
  const settings = await getEligibilitySettings();
  res.json({
    donor: {
      id: donor.id,
      username: donor.username,
      name: donor.name,
      bloodGroup: donor.bloodGroup,
      photoUrl: donor.photoUrl,
      lat: donor.lat,
      lng: donor.lng,
      addressText: donor.addressText,
      allowChat: donor.allowChat,
      phone: donor.showPhone ? donor.phone : null,
      lastDonationDate: donor.lastDonationDate,
      donationCount,
      isActive: computeIsActive(donor.lastDonationDate, donor.lastAntibioticDate, settings),
      nextEligibleDate: nextEligibleDate(donor.lastDonationDate, donor.lastAntibioticDate, settings),
    },
  });
});
