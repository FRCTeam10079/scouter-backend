import z from "zod";
import type App from "@/app";
import db, { User } from "@/db";
import { Response4xx } from "@/schemas";

const UserSchema = {
  response: {
    200: z.array(User.Display),
    "4xx": Response4xx,
  },
};

export default async function user(app: App) {
  app.get("/users", { schema: UserSchema }, () => {
    return db.user.findMany({
      select: { id: true, firstName: true, lastName: true },
    });
  });
}
