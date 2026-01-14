import Type from "typebox";
import type App from "@/app";
import prisma, { Report, TeamNumber, User } from "@/db";
import { MatchType, TrenchOrBump } from "@/db/prisma/enums";
import ErrorResponse from "@/error-response";

const ReportGetSchema = {
  params: Type.Object({
    id: Type.Integer({ minimum: 0 }),
  }),
  response: {
    200: Type.Object({
      user: Type.Union([User.Display, Type.Null()]),
      createdAt: Type.String({ format: "date-time" }),
      eventCode: Type.String(),
      matchType: Type.Enum(MatchType),
      matchNumber: Report.MatchNumber,
      teamNumber: TeamNumber,
      notes: Type.String(),
      trenchOrBump: Type.Enum(TrenchOrBump),
      minorFouls: Type.Integer({ minimum: 0 }),
      majorFouls: Type.Integer({ minimum: 0 }),
      auto: Report.Auto,
      teleop: Report.Teleop,
      endgame: Report.Teleop,
    }),
    "4xx": ErrorResponse,
  },
};

const ReportPostSchema = {
  body: Type.Object({
    createdAt: Type.String({ format: "date-time" }),
    eventCode: Report.EventCode,
    matchType: Type.Enum(MatchType),
    matchNumber: Type.Integer({ minimum: 1, maximum: 200 }),
    teamNumber: TeamNumber,
    notes: Type.String({ maxLength: 400 }),
    trenchOrBump: Type.Enum(TrenchOrBump),
    minorFouls: Type.Integer({ minimum: 0 }),
    majorFouls: Type.Integer({ minimum: 0 }),
    auto: Report.Auto,
    teleop: Report.Teleop,
    endgame: Report.Teleop,
  }),
  response: {
    201: Type.Null(),
  },
};

export default async function report(app: App) {
  app.get("/report/:id", { schema: ReportGetSchema }, async (req, reply) => {
    const report = await prisma.report.findUnique({
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
      trenchOrBump: report.trenchOrBump,
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
    await prisma.report.create({
      data: {
        userId: req.user.id,
        createdAt: req.body.createdAt,
        eventCode: req.body.eventCode,
        matchType: req.body.matchType,
        matchNumber: req.body.matchNumber,
        teamNumber: req.body.teamNumber,
        notes: req.body.notes,
        trenchOrBump: req.body.trenchOrBump,
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
