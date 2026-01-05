import {
  type FastifyPluginAsyncTypebox,
  Type,
} from "@fastify/type-provider-typebox";
import { Response4xx } from "@/.";
import prisma, { Report, User } from "@/db";
import { MatchType } from "@/db/prisma/enums";

const ReportGetSchema = {
  params: Type.Object({
    id: Type.Integer(),
  }),
  response: {
    200: Type.Object({
      user: Type.Union([User.Display, Type.Null()]),
      createdAt: Type.String({ format: "date-time" }),
      eventCode: Type.String(),
      matchType: Type.Enum(MatchType),
      matchNumber: Type.Integer(),
      teamNumber: Type.Integer(),
      notes: Type.String(),
      autoNotes: Type.String(),
      didRobotMoveDuringAuto: Type.Boolean(),
      teleopNotes: Type.String(),
      endgameNotes: Type.String(),
    }),
    "4xx": Response4xx,
  },
};

const ReportPostSchema = {
  body: Type.Object({
    createdAt: Type.String({ format: "date-time" }),
    eventCode: Report.EventCode,
    matchType: Type.Enum(MatchType),
    matchNumber: Type.Integer({ minimum: 1, maximum: 200 }),
    teamNumber: Report.TeamNumber,
    notes: Type.String({ maxLength: 400 }),
    autoNotes: Type.String({ maxLength: 400 }),
    didRobotMoveDuringAuto: Type.Boolean(),
    teleopNotes: Type.String({ maxLength: 400 }),
    endgameNotes: Type.String({ maxLength: 400 }),
  }),
  response: {
    201: Type.Null(),
  },
};

const report: FastifyPluginAsyncTypebox = async (app) => {
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
      autoNotes: report.autoNotes,
      didRobotMoveDuringAuto: report.didRobotMoveDuringAuto,
      teleopNotes: report.teleopNotes,
      endgameNotes: report.endgameNotes,
    };
  });

  app.post("/report", { schema: ReportPostSchema }, async (req, reply) => {
    await prisma.report.create({
      data: { userId: req.user.id, ...req.body },
    });
    reply.code(201).send();
  });
};

export default report;
