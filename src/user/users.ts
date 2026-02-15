import type { FastifySchema } from "fastify";
import z from "zod";
import type App from "@/app";
import db from "@/db";
import { Response4xx } from "@/schemas";
import * as user from "./schemas";

const GetSchema: FastifySchema = {
  response: {
    200: z.array(user.Display),
    "4xx": Response4xx,
  },
};

export default async function route(app: App) {
  app.get("/users", { schema: GetSchema }, () => {
    return db.user.findMany({
      select: { id: true, firstName: true, lastName: true },
    });
  });
}
