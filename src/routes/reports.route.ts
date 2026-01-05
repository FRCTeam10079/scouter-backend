import {
  type FastifyPluginAsyncTypebox,
  Type,
} from "@fastify/type-provider-typebox";
import prisma, { Report, User } from "@/db";
import { MatchType } from "@/db/prisma/enums";

const ReportsSchema = {
  querystring: Type.Object({
    userId: Type.Optional(Type.Integer()),
    year: Type.Optional(Type.Integer({ minimum: 2000, maximum: 3000 })),
    eventCode: Type.Optional(Report.EventCode),
    matchType: Type.Optional(Type.Enum(MatchType)),
    teamNumber: Type.Optional(Report.TeamNumber),
    robotMovedDuringAuto: Type.Optional(Type.Boolean()),
    take: Type.Integer(),
    skip: Type.Integer(),
  }),
  response: {
    200: Type.Array(
      Type.Object({
        id: Type.Integer(),
        teamNumber: Type.Integer(),
        user: Type.Union([User.Display, Type.Null()]),
      })
    ),
  },
};

const reports: FastifyPluginAsyncTypebox = async (app) => {
  app.get("/reports", { schema: ReportsSchema }, async (req) => {
    const createdAt =
      req.query.year === undefined
        ? undefined
        : {
            gte: new Date(req.query.year, 0),
            lt: new Date(req.query.year + 1, 0),
          };
    return await prisma.report.findMany({
      where: {
        userId: req.query.userId,
        createdAt,
        eventCode: req.query.eventCode,
        matchType: req.query.matchType,
        teamNumber: req.query.teamNumber,
        didRobotMoveDuringAuto: req.query.robotMovedDuringAuto,
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
