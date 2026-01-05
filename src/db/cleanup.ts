import cron from "node-cron";
import prisma from ".";

const EVERY_TUESDAY_AT_2AM = "0 2 * * TUE";

cron.schedule(EVERY_TUESDAY_AT_2AM, async () => {
  await prisma.refreshToken.deleteMany({
    where: { expiresAt: { lt: new Date() } },
  });
});
