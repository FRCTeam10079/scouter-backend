import cron from "node-cron";
import { createApp, Logger } from "./app";
import prisma from "./db";

const EVERY_TUESDAY_AT_2AM = "0 2 * * TUE";

if (process.env.NODE_ENV === "production") {
  cron.schedule(EVERY_TUESDAY_AT_2AM, async () => {
    await prisma.refreshToken.deleteMany({
      where: { expiresAt: { lt: new Date() } },
    });
  });
}

const logger =
  process.env.NODE_ENV === "development" ? Logger.DEV : Logger.PROD;
const app = await createApp(logger);

try {
  await app.listen({ port: 8000 });
} catch (error) {
  app.log.error(error);
  process.exit(1);
}
