import type App from "@/app";
import db from "@/db";
import { AuthTokensResponse, issueAuthTokens, RefreshToken } from ".";

const PostSchema = {
  body: RefreshToken,
  response: AuthTokensResponse,
};

export default async function refresh(app: App) {
  app.post("/refresh", { schema: PostSchema }, async (req, reply) => {
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
    reply.code(201).send(await issueAuthTokens(app, storedRefreshToken.userId));
  });
}
