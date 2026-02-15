import * as argon2 from "@node-rs/argon2";
import z from "zod";
import type App from "@/app";
import db from "@/db";
import * as user from "@/user/schemas";
import * as auth from "./schemas";

export const TEAM_PASSWORD = "AlexaIsOurScoutingLead!";

const LoginSchema = {
  body: z.object({
    username: user.Username,
    password: user.Password,
  }),
  response: auth.TokensResponse,
};

const LogoutSchema = {
  body: auth.RefreshToken,
  response: {
    204: z.null(),
  },
};

const RefreshSchema = {
  body: auth.RefreshToken,
  response: auth.TokensResponse,
};

const SignUpSchema = {
  body: z.object({
    username: user.Username,
    password: user.Password,
    firstName: user.FirstName,
    lastName: user.LastName,
    teamPassword: z.string().min(1),
  }),
  response: auth.TokensResponse,
};

export default function route(app: App) {
  app.post("/login", { schema: LoginSchema }, async (req, reply) => {
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
    reply.code(201).send(await auth.issueTokens(app, user.id));
  });

  app.delete("/logout", { schema: LogoutSchema }, async (req, reply) => {
    await db.refreshToken.delete({ where: { value: req.body } });
    reply.code(204);
  });

  app.post("/refresh", { schema: RefreshSchema }, async (req, reply) => {
    const storedRefreshToken = await db.refreshToken.findUnique({
      where: { value: req.body },
      select: { expiresAt: true, userId: true },
    });
    if (!storedRefreshToken) {
      return reply.status(401).send({ code: "INVALID_REFRESH_TOKEN" });
    }
    if (storedRefreshToken.expiresAt < new Date()) {
      return reply.status(401).send({ code: "EXPIRED_REFRESH_TOKEN" });
    }
    await db.refreshToken.delete({ where: { value: req.body } });
    reply
      .code(201)
      .send(await auth.issueTokens(app, storedRefreshToken.userId));
  });

  app.post("/sign-up", { schema: SignUpSchema }, async (req, reply) => {
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
    reply.code(201).send(await auth.issueTokens(app, user.id));
  });
}
