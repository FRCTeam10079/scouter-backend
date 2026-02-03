import * as argon2 from "@node-rs/argon2";
import z from "zod";
import type App from "@/app";
import db, { User } from "@/db";
import { AuthTokensResponse, issueAuthTokens } from ".";

const PostSchema = {
  body: z.object({
    username: User.Username,
    password: User.Password,
  }),
  response: AuthTokensResponse,
};

export default async function login(app: App) {
  app.post("/login", { schema: PostSchema }, async (req, reply) => {
    const user = await db.user.findUnique({
      where: { username: req.body.username },
      select: { id: true, passwordHash: true },
    });
    if (!user) {
      return reply.code(401).send({ code: "NO_SUCH_USER" });
    }
    if (!(await argon2.verify(user.passwordHash, req.body.password))) {
      return reply.code(401).send({ code: "INCORRECT_PASSWORD" });
    }
    reply.code(201).send(await issueAuthTokens(app, user.id));
  });
}
