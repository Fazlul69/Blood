import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  await prisma.appSetting.upsert({
    where: { key: "donation_cycle_days" },
    create: { key: "donation_cycle_days", value: "120" },
    update: {},
  });
  await prisma.appSetting.upsert({
    where: { key: "antibiotic_gap_days" },
    create: { key: "antibiotic_gap_days", value: "10" },
    update: {},
  });

  // Seed admin user. Change the phone number below to whichever number should have
  // admin access — it can then log in through the normal phone-OTP flow like anyone else.
  await prisma.user.upsert({
    where: { username: "admin" },
    create: {
      phone: "+10000000000",
      username: "admin",
      name: "Admin",
      bloodGroup: "O_POS",
      role: "admin",
    },
    update: {},
  });

  console.log("Seed complete.");
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
