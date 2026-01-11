import {
  type FastifyPluginAsyncTypebox,
  Type,
} from "@fastify/type-provider-typebox";
import prisma, { Report, User } from "@/db";
import { MatchType, TrenchOrBump } from "@/db/prisma/enums";

const ReportsSchema = {
  querystring: Type.Object({
    userId: Type.Optional(Type.Integer({ minimum: 0 })),
    eventCode: Type.Optional(Report.EventCode),
    matchType: Type.Optional(Type.Enum(MatchType)),
    teamNumber: Type.Optional(Report.TeamNumber),
    trenchOrBump: Type.Optional(Type.Enum(TrenchOrBump)),
    noMinorFouls: Type.Optional(Type.Boolean()),
    noMajorFouls: Type.Optional(Type.Boolean()),
    autoMovement: Type.Optional(Type.Boolean()),
    take: Type.Integer({ minimum: 0 }),
    skip: Type.Integer({ minimum: 0 }),
  }),
  response: {
    200: Type.Array(
      Type.Object({
        id: Type.Integer(),
        teamNumber: Report.TeamNumber,
        user: Type.Union([User.Display, Type.Null()]),
      })
    ),
  },
};

const reports: FastifyPluginAsyncTypebox = async (app) => {
  app.get("/reports", { schema: ReportsSchema }, async (req) => {
    return await prisma.report.findMany({
      where: {
        userId: req.query.userId,
        eventCode: req.query.eventCode,
        matchType: req.query.matchType,
        teamNumber: req.query.teamNumber,
        trenchOrBump: req.query.trenchOrBump,
        minorFouls: req.query.noMinorFouls ? 0 : undefined,
        majorFouls: req.query.noMajorFouls ? 0 : undefined,
        autoMovement: req.query.autoMovement,
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
};

export default reports;
