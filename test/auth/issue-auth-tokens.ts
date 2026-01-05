import assert from "node:assert/strict";
import test from "node:test";
import createApp from "@/app";
import prisma, { TestUser } from "@/db";
import { issueAuthTokens } from "@/routes/auth";

test("issueAuthTokens() returns valid authentication tokens", async () => {
  const app = createApp();
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
  await app.close();
});
