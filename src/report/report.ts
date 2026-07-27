import z from "zod";
import type App from "@/app";
import db, { reports } from "@/db";
import { CoercedInt, Response4xx } from "@/schemas";
import * as user from "@/user/schemas";
import * as report from "./schemas";

const GetSchema = {
  params: z.object({
    id: CoercedInt.positive(),
  }),
  response: {
    200: report.Data.extend({
      user: z.union([user.Display, z.null()]),
    }),
    "4xx": Response4xx,
  },
};

const PostSchema = {
  body: report.Data,
  response: {
    201: z.null(),
  },
};

export default async function route(app: App) {
  app.get("/report/:id", { schema: GetSchema }, async (req, reply) => {
    const r = await db.query.reports.findFirst({
      where: { id: req.params.id },
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
    if (!r) {
      return reply.code(404).send({ code: "REPORT_NOT_FOUND" });
    }
    report.dbToData(r);
  });

  app.post("/report", { schema: PostSchema }, async (req, reply) => {
    await db.insert(reports).values(report.dataToDb(req.body, req.user.id));
    reply.code(201);
  });
}
