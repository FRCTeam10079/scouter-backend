import * as argon2 from "@node-rs/argon2";
import z from "zod";
import type App from "@/app";
import db, { User } from "@/db";
import { AuthTokensResponse, issueAuthTokens } from ".";

const PostSchema = {
  body: z.object({
    username: User.Username,
    password: User.Password,
    firstName: User.FirstName,
    lastName: User.LastName,
    teamPassword: z.string().min(1),
  }),
  response: AuthTokensResponse,
};

export const TEAM_PASSWORD = "AlexaIsOurScoutingLead!";

export default async function signUp(app: App) {
  app.post("/sign-up", { schema: PostSchema }, async (req, reply) => {
    if (req.body.teamPassword !== TEAM_PASSWORD) {
      return reply.code(401).send({ code: "INCORRECT_TEAM_PASSWORD" });
    }
    const existingUser = await db.user.findUnique({
      where: { username: req.body.username },
    });
    if (existingUser) {
      return reply.code(409).send({ code: "USERNAME_TAKEN" });
    }
    const user = await db.user.create({
      data: {
        username: req.body.username,
        passwordHash: await argon2.hash(req.body.password),
        firstName: req.body.firstName,
        lastName: req.body.lastName,
      },
      select: { id: true },
    });
    reply.code(201).send(await issueAuthTokens(app, user.id));
  });
}
