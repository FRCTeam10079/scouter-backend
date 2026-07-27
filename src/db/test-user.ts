import * as argon2 from "@node-rs/argon2";
import db, { users } from "@/db";

export const USERNAME = "testuser";
export const PASSWORD = "4FeetTallRisith?45!";

const userData = {
  username: USERNAME,
  passwordHash: await argon2.hash(PASSWORD),
  firstName: "Risith",
  lastName: "Kankanamge",
};

// Pass in the database instead of using the global variable to avoid `db`
// being undefined because of the circular import.
export async function ensureExists(database: typeof db) {
  // TODO: Maybe update instead of doing nothing
  await database.insert(users).values(userData).onConflictDoNothing();
}

export async function id() {
  const user = await db.query.users.findFirst({
    where: { username: USERNAME },
    columns: { id: true },
  });
  if (!user) {
    throw new Error("Failed to find test user in database 😭");
  }
  return user.id;
}
