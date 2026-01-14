import Type from "typebox";
import type App from "@/app";
import prisma, { Report, TeamNumber, User } from "@/db";
import { MatchType, TrenchOrBump } from "@/db/prisma/enums";

const ReportsSchema = {
  querystring: Type.Object({
    userId: Type.Optional(Type.Integer({ minimum: 0 })),
    eventCode: Type.Optional(Report.EventCode),
    matchType: Type.Optional(Type.Enum(MatchType)),
    teamNumber: Type.Optional(TeamNumber),
    trenchOrBump: Type.Optional(Type.Enum(TrenchOrBump)),
    noMinorFouls: Type.Optional(Type.Boolean()),
    noMajorFouls: Type.Optional(Type.Boolean()),
    autoMovement: Type.Optional(Type.Boolean()),
    autoLevel1: Type.Optional(Type.Boolean()),
    take: Type.Integer({ minimum: 0 }),
    skip: Type.Integer({ minimum: 0 }),
  }),
  response: {
    200: Type.Array(
      Type.Object({
        id: Type.Integer(),
        teamNumber: TeamNumber,
        user: Type.Union([User.Display, Type.Null()]),
      }),
    ),
  },
};

export default async function reports(app: App) {
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
        autoLevel1: req.query.autoLevel1,
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
