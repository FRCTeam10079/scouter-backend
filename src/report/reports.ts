import z from "zod";
import type App from "@/app";
import db from "@/db";
import { MatchType } from "@/db/prisma/enums";
import { CoercedInt } from "@/schemas";
import * as user from "@/user/schemas";
import * as report from "./schemas";

const GetSchema = {
  querystring: z.object({
    userId: CoercedInt.positive().optional(),
    eventCode: report.EventCode.optional(),
    matchType: z.enum(MatchType).optional(),
    minMatchNumber: report.CoercedMatchNumber.optional(),
    maxMatchNumber: report.CoercedMatchNumber.optional(),
    teamNumber: report.CoercedTeamNumber.optional(),
    maxMinorFouls: CoercedInt.positive().optional(),
    maxMajorFouls: CoercedInt.positive().optional(),
    autoMovement: z.boolean().optional(),
    autoMinHubScore: CoercedInt.min(1).optional(),
    autoMaxHubMisses: CoercedInt.positive().optional(),
    autoLevel1: z.boolean().optional(),
    teleopMinHubScore: CoercedInt.min(1).optional(),
    teleopMaxHubMisses: CoercedInt.positive().optional(),
    endgameMinHubScore: CoercedInt.min(1).optional(),
    endgameMaxHubMisses: CoercedInt.positive().optional(),
    take: CoercedInt.positive(),
    skip: CoercedInt.positive(),
  }),
  response: {
    200: z.array(
      z.object({
        id: z.int().positive(),
        teamNumber: report.TeamNumber,
        user: z.union([user.Display, z.null()]),
      }),
    ),
  },
};

const PostSchema = {
  body: z.array(report.Data),
  response: {
    201: z.null(),
  },
};

export default async function route(app: App) {
  app.get("/reports", { schema: GetSchema }, async (req) => {
    return await db.report.findMany({
      where: {
        userId: req.query.userId,
        eventCode: req.query.eventCode,
        matchType: req.query.matchType,
        matchNumber: {
          gte: req.query.minMatchNumber,
          lte: req.query.maxMatchNumber,
        },
        teamNumber: req.query.teamNumber,
        minorFouls: { lte: req.query.maxMinorFouls },
        majorFouls: { lte: req.query.maxMajorFouls },
        autoMovement: req.query.autoMovement,
        autoHubScore: { gte: req.query.autoMinHubScore },
        autoHubMisses: { lte: req.query.autoMaxHubMisses },
        autoLevel1: req.query.autoLevel1,
        teleopHubScore: { gte: req.query.teleopMinHubScore },
        teleopHubMisses: { lte: req.query.teleopMaxHubMisses },
        endgameHubScore: { gte: req.query.endgameMinHubScore },
        endgameHubMisses: { lte: req.query.endgameMaxHubMisses },
      },
      select: {
        id: true,
        teamNumber: true,
        user: { select: { id: true, firstName: true, lastName: true } },
      },
      orderBy: { createdAt: "desc" },
      take: req.query.take,
      skip: req.query.skip,
    });
  });

  app.post("/reports", { schema: PostSchema }, async (req, reply) => {
    await db.report.createMany({
      data: req.body.map((r) => report.dataToDb(r, req.user.id)),
    });
    reply.status(201);
  });
}
