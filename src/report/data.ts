import z from "zod";
import type App from "@/app";
import db from "@/db";
import * as report from "./schemas";

const GetSchema = {
  response: {
    200: z.array(report.Data),
  },
};

const PostSchema = {
  body: z.array(report.Data.extend({ userId: z.int().positive() })),
  response: {
    201: z.null(),
  },
};

export default async function route(app: App) {
  app.get("/reports/data", { schema: GetSchema }, async () => {
    const reports = await db.report.findMany({
      select: {
        createdAt: true,
        eventCode: true,
        matchType: true,
        matchNumber: true,
        teamNumber: true,
        notes: true,
        minorFouls: true,
        majorFouls: true,
        secondsIncapacitated: true,
        overBump: true,
        underTrench: true,
        startingPosition: true,
        auto: true,
        teleop: true,
        endgame: true,
      },
    });
    return reports.map((report) => ({
      ...report,
      createdAt: report.createdAt.toISOString(),
    }));
  });

  app.post("/reports/data", { schema: PostSchema }, async (req, reply) => {
    await db.report.createMany({
      data: req.body.map((r) => report.dataToDb(r, r.userId)),
    });
    reply.status(201);
  });
}
