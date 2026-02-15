import z from "zod";
import type App from "@/app";
import db from "@/db";
import { CoercedInt, Response4xx } from "@/schemas";
import * as user from "@/user/schemas";
import * as report from "./schemas";

const GetSchema = {
  params: z.object({
    id: CoercedInt.positive(),
  }),
  response: {
    200: report.Data.extend({
      user: z.union([user.Display, z.null()]),
    }),
    "4xx": Response4xx,
  },
};

const PostSchema = {
  body: report.Data,
  response: {
    201: z.null(),
  },
};

export default async function route(app: App) {
  app.get("/report/:id", { schema: GetSchema }, async (req, reply) => {
    const report = await db.report.findUnique({
      where: { id: req.params.id },
      select: {
        user: { select: { id: true, firstName: true, lastName: true } },
        createdAt: true,
        eventCode: true,
        matchType: true,
        matchNumber: true,
        teamNumber: true,
        notes: true,
        minorFouls: true,
        majorFouls: true,
        auto: true,
        teleop: true,
        endgame: true,
      },
    });
    if (!report) {
      return reply.code(404).send({ code: "REPORT_NOT_FOUND" });
    }
    return {
      ...report,
      createdAt: report.createdAt.toISOString(),
    };
  });

  app.post("/report", { schema: PostSchema }, async (req, reply) => {
    await db.report.create({
      data: report.dataToDb(req.body, req.user.id),
    });
    reply.code(201);
  });
}
