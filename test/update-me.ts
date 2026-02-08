import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { after, test } from "node:test";
import { createApp, Logger } from "@/app";
import * as auth from "@/auth/schemas";
import { TestUser } from "@/db";

const PORT = 8000;

const app = await createApp(Logger.TEST);
const userId = await TestUser.getId();
const avatarPath = path.join("avatars", String(userId));

test("PATCH /me updates the user", async () => {
  // `app.inject()` doesn't work for some reason, so a real server has to be
  // run. It could just be that I don't know how to send form data correctly.
  await app.listen({ port: PORT });
  await app.ready();
  const { accessToken } = await auth.issueTokens(app, userId);

  const formData = new FormData();
  formData.set("firstName", "Kiet");
  formData.set(
    "avatar",
    new Blob(
      [fs.readFileSync(path.join(import.meta.dirname, "chelsea.webp"))],
      { type: "image/webp" },
    ),
  );

  const response = await fetch(`http://localhost:${PORT}/me`, {
    method: "PATCH",
    headers: { authorization: `Bearer ${accessToken}` },
    body: formData,
  });
  assert.strictEqual(response.status, 204);
  assert(fs.existsSync(avatarPath));
});

after(() => {
  fs.rmSync(avatarPath, { force: true });
  return app.close();
});
