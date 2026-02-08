import assert from "node:assert/strict";
import { after, describe, it } from "node:test";
import * as argon2 from "@node-rs/argon2";
import { createApp, Logger } from "@/app";
import { TEAM_PASSWORD } from "@/auth/route";
import prisma, { TestUser } from "@/db";

const NEW_USER = {
  username: "mr.snuggles",
  password: "flibblejuffle",
  firstName: "Pranav",
  lastName: "Gibberjabber",
};

const app = await createApp(Logger.TEST);

describe("POST /auth/sign-up", () => {
  it("Creates a new user", async () => {
    const response = await app.inject({
      method: "POST",
      url: "/auth/sign-up",
      body: { ...NEW_USER, teamPassword: TEAM_PASSWORD },
    });
    assert.strictEqual(response.statusCode, 201);
    const user = await prisma.user.findUnique({
      where: { username: NEW_USER.username },
    });
    assert(user);
    assert(await argon2.verify(user.passwordHash, NEW_USER.password));
    assert.strictEqual(user.firstName, NEW_USER.firstName);
    assert.strictEqual(user.lastName, NEW_USER.lastName);
  });

  it("Returns an error if the username is taken", async () => {
    const response = await app.inject({
      method: "POST",
      url: "/auth/sign-up",
      body: {
        username: TestUser.USERNAME,
        password: "food",
        firstName: "John",
        lastName: "Doe",
        teamPassword: TEAM_PASSWORD,
      },
    });
    assert.strictEqual(response.statusCode, 409);
    assert.strictEqual(response.json().code, "USERNAME_TAKEN");
  });
});

after(() => app.close());
