import assert from "node:assert/strict";
import { after, describe, it } from "node:test";
import TypeCompiler from "typebox/compile";
import createApp from "@/app";
import { TestUser } from "@/db";
import { AuthTokensResponse, issueAuthTokens } from "@/routes/auth";

const AuthTokensValidator = TypeCompiler.Compile(AuthTokensResponse[201]);

const app = createApp();

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
    const refreshResponse = await request(authTokens.refreshToken);
    const newAuthTokens = refreshResponse.json();
    assert(AuthTokensValidator.Check(newAuthTokens));
    assert.notStrictEqual(authTokens.refreshToken, newAuthTokens.refreshToken);
  });

  it("Returns an error if the refresh token is invalid", async () => {
    const invalidRefreshToken = crypto.randomUUID();
    const response = await request(invalidRefreshToken);
    assert.strictEqual(response.statusCode, 401);
    assert.strictEqual(response.json().code, "INVALID_REFRESH_TOKEN");
  });
});

after(async () => {
  await app.close();
});
