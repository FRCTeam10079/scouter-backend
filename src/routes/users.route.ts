import {
  type FastifyPluginAsyncTypebox,
  Type,
} from "@fastify/type-provider-typebox";
import { Response4xx } from "@/.";
import prisma, { User } from "@/db";

const UserSchema = {
  response: {
    200: Type.Array(User.Display),
    "4xx": Response4xx,
  },
};

const user: FastifyPluginAsyncTypebox = async (app) => {
  app.get("/users", { schema: UserSchema }, () => {
    return prisma.user.findMany({
      select: { id: true, firstName: true, lastName: true },
    });
  });
};

export default user;
