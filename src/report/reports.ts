import z from "zod";
import type App from "@/app";
import db from "@/db";
import { AutoClimb, MatchType, StartingPosition } from "@/db/prisma/enums";
import { CoercedInt } from "@/schemas";
import * as user from "@/user/schemas";
import * as report from "./schemas";

const GetSchema = {
  querystring: z.object({
    userId: CoercedInt.nonnegative().optional(),
    eventCode: z
      .union([report.EventCode, z.array(report.EventCode)])
      .optional(),
    matchType: z.enum(MatchType).optional(),
    minMatchNumber: report.CoercedMatchNumber.optional(),
    maxMatchNumber: report.CoercedMatchNumber.optional(),
    teamNumber: report.CoercedTeamNumber.optional(),
    maxMinorFouls: CoercedInt.nonnegative().optional(),
    maxMajorFouls: CoercedInt.nonnegative().optional(),
    maxSecondsIncapacitated: CoercedInt.nonnegative().optional(),
    overBump: z.boolean().optional(),
    underTrench: z.boolean().optional(),
    startingPosition: z
      .union([z.enum(StartingPosition), z.array(z.enum(StartingPosition))])
      .optional(),

    autoMinHubScores: CoercedInt.positive().optional(),
    autoMaxHubMisses: CoercedInt.nonnegative().optional(),
    autoLevel1: z.boolean().optional(),
    autoMinPasses: CoercedInt.positive().optional(),
    autoCollectDepot: z.boolean().optional(),
    autoCollectNeutral: z.boolean().optional(),
    autoCollectOutpost: z.boolean().optional(),
    autoDidNotDisruptNz: z.boolean().optional(),

    teleopMinHubScores: CoercedInt.positive().optional(),
    teleopMaxHubMisses: CoercedInt.nonnegative().optional(),
    teleopMinLevel: CoercedInt.min(1).optional(),
    teleopClimbSucceeded: z.boolean().optional(),
    teleopDefended: z.boolean().optional(),
    teleopMinPasses: CoercedInt.positive().optional(),

    endgameMinLevel: CoercedInt.min(1).optional(),
    endgameClimbSucceeded: z.boolean().optional(),

    take: CoercedInt.nonnegative(),
    skip: CoercedInt.nonnegative(),
  }),
  response: {
    200: z.array(
      z.object({
        id: z.int().nonnegative(),
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
        eventCode:
          typeof req.query.eventCode === "string"
            ? req.query.eventCode
            : { in: req.query.eventCode },
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
        teleopDefended: req.query.teleopDefended,
        teleopPasses: { gte: req.query.teleopMinPasses },

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
