import assert from "node:assert/strict";
import { after, describe, it } from "node:test";
import { createApp, Logger } from "@/app";
import { TestUser } from "@/db";
import { AuthTokens, issueAuthTokens } from "@/routes/auth";

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
    const authTokens = await issueAuthTokens(app, await TestUser.getId());
    const response = await request(authTokens.refreshToken);
    assert.strictEqual(response.statusCode, 201);
    const newAuthTokens = AuthTokens.parse(response.json());
    assert.notStrictEqual(authTokens.refreshToken, newAuthTokens.refreshToken);
  });

  it("Returns an error if the refresh token is invalid", async () => {
    const invalidRefreshToken = crypto.randomUUID();
    const response = await request(invalidRefreshToken);
    assert.strictEqual(response.statusCode, 401);
    assert.strictEqual(response.json().code, "INVALID_REFRESH_TOKEN");
  });
});

after(() => app.close());
