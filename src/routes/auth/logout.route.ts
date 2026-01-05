import {
  type FastifyPluginAsyncTypebox,
  Type,
} from "@fastify/type-provider-typebox";
import prisma from "@/db";
import { RefreshToken } from ".";

const LogoutSchema = {
  body: RefreshToken,
  response: {
    204: Type.Null(),
  },
};

const refresh: FastifyPluginAsyncTypebox = async (app) => {
  app.delete("/logout", { schema: LogoutSchema }, async (req, reply) => {
    await prisma.refreshToken.delete({ where: { value: req.body } });
    reply.code(204).send();
  });
};

export default refresh;
