import cron from "node-cron";
import { createApp } from "./app";
import prisma from "./db";

const EVERY_TUESDAY_AT_2AM = "0 2 * * TUE";

if (process.env.NODE_ENV === "production") {
  cron.schedule(EVERY_TUESDAY_AT_2AM, async () => {
    await prisma.refreshToken.deleteMany({
      where: { expiresAt: { lt: new Date() } },
    });
  });
}

const app = await createApp({
  logger: process.env.NODE_ENV === "development" && {
    transport: {
      // Pretty logging
      target: "pino-pretty",
      options: {
        translateTime: "SYS:hh:MM:ss", // 12-hour clock with local time
        ignore: "req.host,req.remoteAddress,req.remotePort,pid,hostname,reqId",
      },
    },
  },
});

try {
  await app.listen({ port: 8000 });
} catch (error) {
  app.log.error(error);
  process.exit(1);
}
