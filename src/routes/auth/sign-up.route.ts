import {
  type FastifyPluginAsyncTypebox,
  Type,
} from "@fastify/type-provider-typebox";
import * as argon2 from "@node-rs/argon2";
import prisma, { User } from "@/db";
import { AuthTokensResponse, issueAuthTokens } from ".";

const SignUpSchema = {
  body: Type.Object({
    username: User.Username,
    password: User.Password,
    firstName: User.FirstName,
    lastName: User.LastName,
    teamPassword: Type.String({ minLength: 1 }),
  }),
  response: AuthTokensResponse,
};

export const TEAM_PASSWORD = "AlexaIsOurScoutingLead!";

const signUp: FastifyPluginAsyncTypebox = async (app) => {
  app.post("/sign-up", { schema: SignUpSchema }, async (req, reply) => {
    if (req.body.teamPassword !== TEAM_PASSWORD) {
      return reply.code(401).send({ code: "INCORRECT_TEAM_PASSWORD" });
    }
    const existingUser = await prisma.user.findUnique({
      where: { username: req.body.username },
    });
    if (existingUser) {
      return reply.code(409).send({ code: "USERNAME_TAKEN" });
    }
    const user = await prisma.user.create({
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
};

export default signUp;
