import assert from "node:assert/strict";
import { after, test } from "node:test";
import { createApp, Logger } from "@/app";
import prisma, { TestUser } from "@/db";
import { issueAuthTokens } from "@/routes/auth";

const app = await createApp(Logger.TEST);

test("issueAuthTokens() returns valid authentication tokens", async () => {
  await app.ready();
  const storedUserId = await TestUser.getId();

  const tokens = await issueAuthTokens(app, storedUserId);
  const user = app.jwt.verify<{ id: number }>(tokens.accessToken);
  assert.strictEqual(user.id, storedUserId);

  const storedRefreshToken = await prisma.refreshToken.findUnique({
    where: { value: tokens.refreshToken },
    select: { userId: true },
  });
  assert(storedRefreshToken);
  assert.strictEqual(storedRefreshToken.userId, user.id);
});

after(() => app.close());
