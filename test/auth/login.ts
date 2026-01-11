import assert from "node:assert/strict";
import { after, describe, it } from "node:test";
import createApp from "@/app";
import { TestUser } from "@/db";

const app = await createApp();

async function request(username: string, password: string) {
  return await app.inject({
    method: "POST",
    url: "/auth/login",
    body: { username, password },
  });
}

describe("POST /auth/login", () => {
  it("Returns an error if the user doesn't exist", async () => {
    const response = await request("pranavhari123", "woooo");
    assert.strictEqual(response.statusCode, 401);
    assert.strictEqual(response.json().code, "NO_SUCH_USER");
  });

  it("Returns an error if the password is incorrect", async () => {
    const response = await request(TestUser.USERNAME, "panda_express123");
    assert.strictEqual(response.statusCode, 401);
    assert.strictEqual(response.json().code, "INCORRECT_PASSWORD");
  });
});

after(async () => {
  await app.close();
});
