import assert from "node:assert/strict";
import { after, describe, it } from "node:test";
import { createApp, Logger } from "@/app";
import * as auth from "@/auth/schemas";
import { testUser } from "@/db";

const app = await createApp(Logger.TEST);

async function request(refreshToken: string) {
  return await app.inject({
    method: "POST",
    url: "/auth/refresh",
    body: JSON.stringify(refreshToken),
    headers: { "content-type": "application/json" },
  });
}

describe("POST /auth/refresh", () => {
  it("Returns an access token and a rotated refresh token", async () => {
    await app.ready();
    const userId = await testUser.id();
    const authTokens = await auth.issueTokens(app, userId);
    const response = await request(authTokens.refreshToken);
    assert.strictEqual(response.statusCode, 201);
    const newAuthTokens = auth.Tokens.parse(response.json());
    assert.notStrictEqual(authTokens.refreshToken, newAuthTokens.refreshToken);
  });

  it("Returns an error if the refresh token is invalid", async () => {
    const invalidRefreshToken = "019f243e-13cb-7767-abfb-402e3467eb3d";
    const response = await request(invalidRefreshToken);
    assert.strictEqual(response.statusCode, 401);
    assert.strictEqual(response.json().code, "INVALID_REFRESH_TOKEN");
  });
});

after(() => app.close());
