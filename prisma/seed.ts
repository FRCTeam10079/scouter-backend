import * as argon2 from "@node-rs/argon2";
import db from "@/db";

const testUserData = {
  username: db.user.test.username,
  passwordHash: await argon2.hash(db.user.test.password),
  firstName: "Risith",
  lastName: "Kankanamge",
};

try {
  // Ensure that a test user exists in the database.
  await db.user.upsert({
    where: { username: db.user.test.username },
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
