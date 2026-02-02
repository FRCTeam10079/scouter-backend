import z from "zod";
import type App from "@/app";
import db, { Report, TeamNumber, User } from "@/db";
import { MatchType } from "@/db/prisma/enums";
import { Response4xx } from "@/schemas";

const ReportGetSchema = {
  params: z.object({
    id: z.coerce.number().int().positive(),
  }),
  response: {
    200: z.object({
      user: z.union([User.Display, z.null()]),
      createdAt: z.iso.datetime(),
      eventCode: z.string(),
      matchType: z.enum(MatchType),
      matchNumber: Report.MatchNumber,
      teamNumber: TeamNumber,
      notes: z.string(),
      minorFouls: z.int().positive(),
      majorFouls: z.int().positive(),
      auto: Report.Auto,
      teleop: Report.Teleop,
      endgame: Report.Teleop,
    }),
    "4xx": Response4xx,
  },
};

const ReportPostSchema = {
  body: z.object({
    createdAt: z.iso.datetime(),
    eventCode: Report.EventCode,
    matchType: z.enum(MatchType),
    matchNumber: z.int().min(1).max(200),
    teamNumber: TeamNumber,
    notes: z.string().max(400),
    minorFouls: z.int().positive(),
    majorFouls: z.int().positive(),
    auto: Report.Auto,
    teleop: Report.Teleop,
    endgame: Report.Teleop,
  }),
  response: {
    201: z.null(),
  },
};

export default async function report(app: App) {
  app.get("/report/:id", { schema: ReportGetSchema }, async (req, reply) => {
    const report = await db.report.findUnique({
      where: { id: req.params.id },
      include: {
        user: { select: { id: true, firstName: true, lastName: true } },
      },
    });
    if (!report) {
      return reply.code(404).send({ code: "REPORT_NOT_FOUND" });
    }
    return {
      user: report.user,
      createdAt: report.createdAt.toISOString(),
      eventCode: report.eventCode,
      matchType: report.matchType,
      matchNumber: report.matchNumber,
      teamNumber: report.teamNumber,
      notes: report.notes,
      minorFouls: report.minorFouls,
      majorFouls: report.majorFouls,
      auto: {
        notes: report.autoNotes,
        movement: report.autoMovement,
        hubScore: report.autoHubScore,
        hubMisses: report.autoHubMisses,
        level1: report.autoLevel1,
      },
      teleop: {
        notes: report.teleopNotes,
        hubScore: report.teleopHubScore,
        hubMisses: report.teleopHubMisses,
        level: report.teleopLevel,
      },
      endgame: {
        notes: report.endgameNotes,
        hubScore: report.endgameHubScore,
        hubMisses: report.endgameHubMisses,
        level: report.endgameLevel,
      },
    };
  });

  app.post("/report", { schema: ReportPostSchema }, async (req, reply) => {
    await db.report.create({
      data: {
        userId: req.user.id,
        createdAt: req.body.createdAt,
        eventCode: req.body.eventCode,
        matchType: req.body.matchType,
        matchNumber: req.body.matchNumber,
        teamNumber: req.body.teamNumber,
        notes: req.body.notes,
        minorFouls: req.body.minorFouls,
        majorFouls: req.body.majorFouls,
        autoNotes: req.body.auto.notes,
        autoMovement: req.body.auto.movement,
        autoHubScore: req.body.auto.hubScore,
        autoHubMisses: req.body.auto.hubMisses,
        autoLevel1: req.body.auto.level1,
        teleopNotes: req.body.teleop.notes,
        teleopHubScore: req.body.teleop.hubScore,
        teleopHubMisses: req.body.teleop.hubMisses,
        teleopLevel: req.body.teleop.level,
        endgameNotes: req.body.endgame.notes,
        endgameHubScore: req.body.endgame.hubScore,
        endgameHubMisses: req.body.endgame.hubMisses,
        endgameLevel: req.body.endgame.level,
      },
    });
    reply.code(201).send();
  });
}
