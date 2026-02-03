import z from "zod";
import type App from "@/app";
import db from "@/db";
import { RefreshToken } from ".";

const PostSchema = {
  body: RefreshToken,
  response: {
    204: z.null(),
  },
};

export default async function logout(app: App) {
  app.delete("/logout", { schema: PostSchema }, async (req, reply) => {
    await db.refreshToken.delete({ where: { value: req.body } });
    reply.code(204);
  });
}
