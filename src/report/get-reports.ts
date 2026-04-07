import z from "zod";
import type App from "@/app";
import db from "@/db";
import {
  Alliance,
  AutoClimb,
  MatchType,
  StartingPosition,
} from "@/db/prisma/enums";
import * as report from "./schemas";

const PostSchema = {
  body: z.object({
    userIds: z.array(z.int().nonnegative()).min(1).optional(),
    eventCodes: z.array(report.EventCode).min(1).optional(),
    matchType: z.enum(MatchType).optional(),
    matchNumbers: z.array(report.MatchNumber).min(1).optional(),
    alliance: z.enum(Alliance).optional(),
    teamNumbers: z.array(report.TeamNumber).min(1).optional(),
    inMatch: z.boolean().optional(),
    minorFouls: z
      .object({
        min: z.int().min(1).optional(),
        max: z.int().nonnegative().optional(),
      })
      .optional(),
    majorFouls: z
      .object({
        min: z.int().min(1).optional(),
        max: z.int().nonnegative().optional(),
      })
      .optional(),
    secondsIncapacitated: z
      .object({
        min: z.int().min(1).optional(),
        max: z.int().nonnegative().optional(),
      })
      .optional(),
    shootingConfidence: z
      .object({
        min: z.int().min(1).optional(),
        max: z.int().nonnegative().max(5).optional(),
      })
      .optional(),
    crossBump: z.boolean().optional(),
    crossTrench: z.boolean().optional(),
    startingPositions: z.array(z.enum(StartingPosition)).min(1).optional(),
    auto: z
      .object({
        hubScores: z
          .object({
            min: z.int().min(1).optional(),
            max: z.int().nonnegative().optional(),
          })
          .optional(),
        hubMisses: z
          .object({
            min: z.int().min(1).optional(),
            max: z.int().nonnegative().optional(),
          })
          .optional(),
        level1: z.boolean().optional(),
        passes: z
          .object({
            min: z.int().min(1).optional(),
            max: z.int().nonnegative().optional(),
          })
          .optional(),
        collectDepot: z.boolean().optional(),
        collectNeutral: z.boolean().optional(),
        collectOutpost: z.boolean().optional(),
      })
      .optional(),
    teleop: z
      .object({
        hubScores: z
          .object({
            min: z.int().min(1).optional(),
            max: z.int().nonnegative().optional(),
          })
          .optional(),
        hubMisses: z
          .object({
            min: z.int().min(1).optional(),
            max: z.int().nonnegative().optional(),
          })
          .optional(),
        passes: z
          .object({
            min: z.int().min(1).optional(),
            max: z.int().nonnegative().optional(),
          })
          .optional(),
        defended: z.boolean().optional(),
        wasDefended: z.boolean().optional(),
      })
      .optional(),
    endgame: z
      .object({
        level: z
          .object({
            min: report.Level.min(1).optional(),
            max: report.Level.optional(),
          })
          .optional(),
        climbFailed: z.boolean().optional(),
      })
      .optional(),
    take: z.int().nonnegative(),
    skip: z.int().nonnegative(),
  }),
  response: {
    200: z.array(
      z.object({
        id: z.int().nonnegative(),
        matchType: z.enum(MatchType),
        matchNumber: report.MatchNumber,
        teamNumber: report.TeamNumber,
      }),
    ),
  },
};

export default function route(app: App) {
  app.post("/get-reports", { schema: PostSchema }, async (req) => {
    return await db.report.findMany({
      where: {
        userId: { in: req.body.userIds },
        eventCode: { in: req.body.eventCodes },
        matchType: req.body.matchType,
        matchNumber: { in: req.body.matchNumbers },
        alliance: req.body.alliance,
        teamNumber: { in: req.body.teamNumbers },
        inMatch: req.body.inMatch,
        minorFouls: req.body.minorFouls && {
          gte: req.body.minorFouls.min,
          lte: req.body.minorFouls.max,
        },
        majorFouls: req.body.majorFouls && {
          gte: req.body.majorFouls.min,
          lte: req.body.majorFouls.max,
        },
        secondsIncapacitated: req.body.secondsIncapacitated && {
          gte: req.body.secondsIncapacitated.min,
          lte: req.body.secondsIncapacitated.max,
        },
        shootingConfidence: req.body.shootingConfidence && {
          gte: req.body.shootingConfidence.min,
          lte: req.body.shootingConfidence.max,
        },
        crossBump: req.body.crossBump,
        crossTrench: req.body.crossTrench,
        startingPosition: req.body.startingPositions && {
          in: req.body.startingPositions,
        },
        autoHubScores: req.body.auto?.hubScores && {
          gte: req.body.auto.hubScores.min,
          lte: req.body.auto.hubScores.max,
        },
        autoHubMisses: req.body.auto?.hubMisses && {
          gte: req.body.auto.hubMisses.min,
          lte: req.body.auto.hubMisses.max,
        },
        autoClimb:
          req.body.auto?.level1 !== undefined
            ? req.body.auto.level1
              ? AutoClimb.LEVEL1
              : { not: AutoClimb.LEVEL1 }
            : undefined,
        autoPasses: req.body.auto?.passes && {
          gte: req.body.auto.passes.min,
          lte: req.body.auto.passes.max,
        },
        autoCollectDepot: req.body.auto?.collectDepot,
        autoCollectNeutral: req.body.auto?.collectNeutral,
        autoCollectOutpost: req.body.auto?.collectOutpost,
        teleopHubScores: req.body.teleop?.hubScores && {
          gte: req.body.teleop.hubScores.min,
          lte: req.body.teleop.hubScores.max,
        },
        teleopHubMisses: req.body.teleop?.hubMisses && {
          gte: req.body.teleop.hubMisses.min,
          lte: req.body.teleop.hubMisses.max,
        },
        teleopPasses: req.body.teleop?.passes && {
          gte: req.body.teleop.passes.min,
          lte: req.body.teleop.passes.max,
        },
        teleopDefended: req.body.teleop?.defended,
        teleopWasDefended: req.body.teleop?.wasDefended,
        endgameLevel: req.body.endgame?.level && {
          gte: req.body.endgame.level.min,
          lte: req.body.endgame.level.max,
        },
        endgameClimbFailed: req.body.endgame?.climbFailed,
      },
      select: {
        id: true,
        matchType: true,
        matchNumber: true,
        teamNumber: true,
      },
      orderBy: { createdAt: "desc" },
      take: req.body.take,
      skip: req.body.skip,
    });
  });
}
