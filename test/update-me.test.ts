import assert from "node:assert/strict";
import fs from "node:fs";
import { after, test } from "node:test";
import * as testUser from "@test-user";
import { createApp, Logger } from "@/app";
import * as auth from "@/auth/schemas";
import db from "@/db";

const PORT = 8000;
const NEW_FIRST_NAME = "Kiet";

const app = await createApp(Logger.TEST);
const userId = await testUser.id();

test("PATCH /me updates the user", async () => {
  // `app.inject()` doesn't work for some reason, so a real server has to be
  // run. It could just be that I don't know how to send form data correctly.
  await app.listen({ port: PORT });
  await app.ready();
  const { accessToken } = await auth.issueTokens(app, userId);

  const formData = new FormData();
  formData.set("firstName", NEW_FIRST_NAME);
  formData.set(
    "avatar",
    new Blob([fs.readFileSync(`${import.meta.dirname}/chelsea.webp`)], {
      type: "image/webp",
    }),
  );

  const response = await fetch(`http://localhost:${PORT}/me`, {
    method: "PATCH",
    headers: { authorization: `Bearer ${accessToken}` },
    body: formData,
  });
  assert.strictEqual(response.status, 204);
  const user = await db.user.findUniqueOrThrow({
    where: { id: userId },
    select: { firstName: true, passwordHash: true, avatarId: true },
  });
  assert.strictEqual(user.firstName, NEW_FIRST_NAME);
  assert(fs.existsSync(`img/${user.avatarId}`));
});

after(async () => {
  const user = await db.user.findUniqueOrThrow({
    where: { id: userId },
    select: { avatarId: true },
  });
  fs.rmSync(`img/${user.avatarId}`, { force: true });
  return app.close();
});
