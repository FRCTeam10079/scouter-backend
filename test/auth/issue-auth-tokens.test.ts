import assert from "node:assert/strict";
import { after, test } from "node:test";
import { createApp, Logger } from "@/app";
import * as auth from "@/auth/schemas";
import db, { testUser } from "@/db";

const app = await createApp(Logger.TEST);

test("issueAuthTokens() returns valid authentication tokens", async () => {
  await app.ready();
  const storedUserId = await testUser.id();

  const tokens = await auth.issueTokens(app, storedUserId);
  const user = app.jwt.verify<{ id: number }>(tokens.accessToken);
  assert.strictEqual(user.id, storedUserId);

  const storedRefreshToken = await db.query.refreshTokens.findFirst({
    where: { value: tokens.refreshToken },
    columns: { userId: true },
  });
  assert(storedRefreshToken);
  assert.strictEqual(storedRefreshToken.userId, user.id);
});

after(() => app.close());
