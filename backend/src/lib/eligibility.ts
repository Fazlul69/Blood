import { prisma } from "./prisma";

const DEFAULT_DONATION_CYCLE_DAYS = 120;
const DEFAULT_ANTIBIOTIC_GAP_DAYS = 10;

let settingsCache: { donationCycleDays: number; antibioticGapDays: number; loadedAt: number } | null = null;
const CACHE_TTL_MS = 60_000;

export async function getEligibilitySettings() {
  if (settingsCache && Date.now() - settingsCache.loadedAt < CACHE_TTL_MS) {
    return settingsCache;
  }
  const rows = await prisma.appSetting.findMany({
    where: { key: { in: ["donation_cycle_days", "antibiotic_gap_days"] } },
  });
  const map = Object.fromEntries(rows.map((r) => [r.key, r.value]));
  settingsCache = {
    donationCycleDays: Number(map.donation_cycle_days ?? DEFAULT_DONATION_CYCLE_DAYS),
    antibioticGapDays: Number(map.antibiotic_gap_days ?? DEFAULT_ANTIBIOTIC_GAP_DAYS),
    loadedAt: Date.now(),
  };
  return settingsCache;
}

function daysBetween(from: Date, to: Date) {
  return Math.floor((to.getTime() - from.getTime()) / (1000 * 60 * 60 * 24));
}

/**
 * A donor is "active" (eligible to donate again) only once the full cycle has
 * passed since their last donation AND they're clear of the post-antibiotic gap.
 */
export function computeIsActive(
  lastDonationDate: Date | null,
  lastAntibioticDate: Date | null,
  settings: { donationCycleDays: number; antibioticGapDays: number },
  now: Date = new Date()
): boolean {
  if (lastDonationDate && daysBetween(lastDonationDate, now) < settings.donationCycleDays) {
    return false;
  }
  if (lastAntibioticDate && daysBetween(lastAntibioticDate, now) < settings.antibioticGapDays) {
    return false;
  }
  return true;
}

export function nextEligibleDate(
  lastDonationDate: Date | null,
  lastAntibioticDate: Date | null,
  settings: { donationCycleDays: number; antibioticGapDays: number }
): Date | null {
  const candidates: Date[] = [];
  if (lastDonationDate) {
    candidates.push(new Date(lastDonationDate.getTime() + settings.donationCycleDays * 86_400_000));
  }
  if (lastAntibioticDate) {
    candidates.push(new Date(lastAntibioticDate.getTime() + settings.antibioticGapDays * 86_400_000));
  }
  if (candidates.length === 0) return null;
  return new Date(Math.max(...candidates.map((d) => d.getTime())));
}
