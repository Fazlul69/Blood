import cron from "node-cron";
import { prisma } from "./prisma";
import { getEligibilitySettings, nextEligibleDate } from "./eligibility";
import { sendExpoPush } from "./push";

function isSameDay(a: Date, b: Date) {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}

/** Once a day, notify donors who just crossed back into "eligible to donate again". */
async function runEligibilityReminderJob() {
  const settings = await getEligibilitySettings();
  const today = new Date();
  const users = await prisma.user.findMany({
    where: { lastDonationDate: { not: null }, status: "active" },
    include: { deviceTokens: true },
  });

  const messages = users
    .filter((u) => {
      const eligible = nextEligibleDate(u.lastDonationDate, u.lastAntibioticDate, settings);
      return eligible && isSameDay(eligible, today);
    })
    .flatMap((u) =>
      u.deviceTokens.map((token) => ({
        to: token.expoPushToken,
        title: "You're eligible to donate again",
        body: "It's been a while — you're now active and visible to donors searching nearby.",
        data: { type: "eligibility" },
      }))
    );

  await sendExpoPush(messages);
}

export function startCronJobs() {
  // Every day at 08:00 server time.
  cron.schedule("0 8 * * *", () => {
    runEligibilityReminderJob().catch((err) => console.error("Eligibility reminder job failed:", err));
  });
}
