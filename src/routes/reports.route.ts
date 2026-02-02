import z from "zod";
import type App from "@/app";
import db, { Report, TeamNumber, User } from "@/db";
import { MatchType } from "@/db/prisma/enums";
import { CoercedInt } from "@/schemas";

const ReportsSchema = {
  querystring: z.object({
    userId: CoercedInt.positive().optional(),
    eventCode: Report.EventCode.optional(),
    matchType: z.enum(MatchType).optional(),
    minMatchNumber: Report.CoercedMatchNumber.optional(),
    maxMatchNumber: Report.CoercedMatchNumber.optional(),
    teamNumber: TeamNumber.optional(),
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
    take: z.int().positive(),
    skip: z.int().positive(),
  }),
  response: {
    200: z.array(
      z.object({
        id: z.int(),
        teamNumber: TeamNumber,
        user: z.union([User.Display, z.null()]),
      }),
    ),
  },
};

export default async function reports(app: App) {
  app.get("/reports", { schema: ReportsSchema }, async (req) => {
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
}
