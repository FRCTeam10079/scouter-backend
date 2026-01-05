import {
  type FastifyPluginAsyncTypebox,
  Type,
} from "@fastify/type-provider-typebox";
import * as argon2 from "@node-rs/argon2";
import prisma, { User } from "@/db";
import { AuthTokensResponse, issueAuthTokens } from ".";

const LoginSchema = {
  body: Type.Object({
    username: User.Username,
    password: User.Password,
  }),
  response: AuthTokensResponse,
};

const login: FastifyPluginAsyncTypebox = async (app) => {
  app.post("/login", { schema: LoginSchema }, async (req, reply) => {
    const user = await prisma.user.findUnique({
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
};

export default login;
