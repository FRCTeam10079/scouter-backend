import { desc } from "drizzle-orm";
import z from "zod";
import type App from "@/app";
import db, { pitReports } from "@/db";
import * as report from "@/report/schemas";
import * as user from "@/user/schemas";

const PostSchema = {
  body: z.object({
    take: z.int().positive(),
    skip: z.int().nonnegative(),
  }),
  response: {
    200: z.array(
      z.object({
        id: z.int().positive(),
        eventCode: report.EventCode,
        teamNumber: report.TeamNumber,
        user: z.union([user.Display, z.null()]),
      }),
    ),
  },
};

export default async function route(app: App) {
  app.post("/get-pit-reports", { schema: PostSchema }, async (req) => {
    return await db.query.pitReports.findMany({
      orderBy: () => desc(pitReports.createdAt),
      limit: req.body.take,
      offset: req.body.skip,
      columns: {
        id: true,
        eventCode: true,
        teamNumber: true,
      },
      with: {
        user: {
          columns: {
            id: true,
            firstName: true,
            lastName: true,
            avatarId: true,
          },
        },
      },
    });
  });
}
