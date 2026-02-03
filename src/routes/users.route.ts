import z from "zod";
import type App from "@/app";
import db, { User } from "@/db";
import { Response4xx } from "@/schemas";

const GetSchema = {
  response: {
    200: z.array(User.Display),
    "4xx": Response4xx,
  },
};

export default async function users(app: App) {
  app.get("/users", { schema: GetSchema }, () => {
    return db.user.findMany({
      select: { id: true, firstName: true, lastName: true },
    });
  });
}
