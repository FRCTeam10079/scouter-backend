import Type from "typebox";
import type App from "@/app";
import prisma from "@/db";
import { RefreshToken } from ".";

const LogoutSchema = {
  body: RefreshToken,
  response: {
    204: Type.Null(),
  },
};

export default async function logout(app: App) {
  app.delete("/logout", { schema: LogoutSchema }, async (req, reply) => {
    await prisma.refreshToken.delete({ where: { value: req.body } });
    reply.code(204).send();
  });
}
