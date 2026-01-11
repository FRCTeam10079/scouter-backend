import assert from "node:assert/strict";
import test from "node:test";
import * as argon2 from "@node-rs/argon2";
import createApp from "@/app";
import prisma, { TestUser } from "@/db";
import { issueAuthTokens } from "@/routes/auth";

const UPDATES = { firstName: "Pranav", password: "mcdonalds" };

test("PATCH /me updates the user", async () => {
  const app = await createApp();
  await app.ready();
  const userId = await TestUser.getId();
  const { accessToken } = await issueAuthTokens(app, userId);
  const response = await app.inject({
    method: "PATCH",
    url: "/me",
    body: UPDATES,
    headers: { authorization: `Bearer ${accessToken}` },
  });
  assert.strictEqual(response.statusCode, 204);
  const user = await prisma.user.findUniqueOrThrow({
    where: { id: userId },
    select: { firstName: true, passwordHash: true },
  });
  assert.strictEqual(user.firstName, UPDATES.firstName);
  assert(await argon2.verify(user.passwordHash, UPDATES.password));
  await app.close();
});
