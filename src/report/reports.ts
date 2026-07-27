import z from "zod";
import type App from "@/app";
import db, { reports } from "@/db";
import * as report from "./schemas";

const PostSchema = {
  body: z.array(report.Data),
  response: {
    201: z.null(),
  },
};

export default async function route(app: App) {
  app.post("/reports", { schema: PostSchema }, async (req, reply) => {
    await db
      .insert(reports)
      .values(req.body.map((r) => report.dataToDb(r, req.user.id)));
    reply.status(201);
  });
}
