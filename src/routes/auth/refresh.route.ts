import type App from "@/app";
import prisma from "@/db";
import * as auth from ".";

const RefreshSchema = {
  body: auth.RefreshToken,
  response: auth.AuthTokensResponse,
};

export default async function refresh(app: App) {
  app.post("/refresh", { schema: RefreshSchema }, async (req, reply) => {
    const storedRefreshToken = await prisma.refreshToken.findUnique({
      where: { value: req.body },
      select: { expiresAt: true, userId: true },
    });
    if (!storedRefreshToken) {
      return reply.status(401).send({ code: "INVALID_REFRESH_TOKEN" });
    }
    if (storedRefreshToken.expiresAt < new Date()) {
      return reply.status(401).send({ code: "EXPIRED_REFRESH_TOKEN" });
    }
    await prisma.refreshToken.delete({ where: { value: req.body } });
    reply
      .code(201)
      .send(await auth.issueAuthTokens(app, storedRefreshToken.userId));
  });
}
