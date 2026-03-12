import * as argon2 from "@node-rs/argon2";
import * as testUser from "test/user";
import db from "@/db";

const testUserData = {
  username: testUser.USERNAME,
  passwordHash: await argon2.hash(testUser.PASSWORD),
  firstName: "Risith",
  lastName: "Kankanamge",
};

try {
  // Ensure that a test user exists in the database.
  await db.user.upsert({
    where: { username: testUser.USERNAME },
    create: testUserData,
    update: {
      passwordHash: testUserData.passwordHash,
      firstName: testUserData.firstName,
      lastName: testUserData.lastName,
    },
  });

  await db.$disconnect();
  console.log("Successfully seeded database");
} catch (error) {
  console.log(`Failed to seed database: ${error}`);
  await db.$disconnect();
  process.exit(1);
}
