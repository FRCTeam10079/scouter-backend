import z from "zod";
import type App from "@/app";
import db from "@/db";
import { AutoClimb, MatchType, StartingPosition } from "@/db/prisma/enums";
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
    maxSecondsIncapacitated: CoercedInt.positive().optional(),
    overBump: z.boolean().optional(),
    underTrench: z.boolean().optional(),
    startingPosition: z
      .union([z.enum(StartingPosition), z.array(z.enum(StartingPosition))])
      .optional(),

    autoMinHubScores: CoercedInt.min(1).optional(),
    autoMaxHubMisses: CoercedInt.positive().optional(),
    autoLevel1: z.boolean().optional(),
    autoCollectDepot: z.boolean().optional(),
    autoCollectNeutral: z.boolean().optional(),
    autoCollectOutpost: z.boolean().optional(),
    autoDidNotDisruptNz: z.boolean().optional(),
    autoMinPasses: CoercedInt.min(1).optional(),

    teleopMinHubScores: CoercedInt.min(1).optional(),
    teleopMaxHubMisses: CoercedInt.positive().optional(),
    teleopMinLevel: CoercedInt.min(1).optional(),
    teleopClimbSucceeded: z.boolean().optional(),

    endgameMinLevel: CoercedInt.min(1).optional(),
    endgameClimbSucceeded: z.boolean().optional(),

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
        secondsIncapacitated: { lte: req.query.maxSecondsIncapacitated },
        overBump: req.query.overBump,
        underTrench: req.query.underTrench,
        startingPosition:
          typeof req.query.startingPosition === "string"
            ? req.query.startingPosition
            : { in: req.query.startingPosition },

        autoHubScores: { gte: req.query.autoMinHubScores },
        autoHubMisses: { lte: req.query.autoMaxHubMisses },
        autoClimb: req.query.autoLevel1 ? AutoClimb.LEVEL1 : undefined,
        autoCollectDepot: req.query.autoCollectDepot,
        autoCollectNeutral: req.query.autoCollectNeutral,
        autoCollectOutpost: req.query.autoCollectOutpost,
        autoDisruptNz: req.query.autoDidNotDisruptNz,
        autoPasses: { gte: req.query.autoMinPasses },

        teleopHubScores: { gte: req.query.teleopMinHubScores },
        teleopHubMisses: { lte: req.query.teleopMaxHubMisses },
        teleopLevel: { gte: req.query.teleopMinLevel },
        teleopClimbFailed:
          req.query.teleopClimbSucceeded !== undefined
            ? !req.query.teleopClimbSucceeded
            : undefined,

        endgameLevel: { gte: req.query.endgameMinLevel },
        endgameClimbFailed:
          req.query.endgameClimbSucceeded !== undefined
            ? !req.query.endgameClimbSucceeded
            : undefined,
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
