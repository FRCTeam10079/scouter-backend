import z from "zod";
import type App from "@/app";
import db, { reports } from "@/db";
import * as report from "./schemas";

const GetSchema = {
  response: {
    200: z.array(report.Data),
  },
};

const PostSchema = {
  body: z.array(report.Data.extend({ userId: z.int().positive() })),
  response: {
    201: z.null(),
  },
};

export default async function route(app: App) {
  app.get("/reports/data", { schema: GetSchema }, async () => {
    const reports = await db.query.reports.findMany({
      columns: { userId: false },
    });
    return reports.map((r) => report.dbToData(r));
  });

  app.post("/reports/data", { schema: PostSchema }, async (req, reply) => {
    await db
      .insert(reports)
      .values(req.body.map((r) => report.dataToDb(r, r.userId)));
    reply.status(201);
  });
}
