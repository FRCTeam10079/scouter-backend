import * as argon2 from "@node-rs/argon2";
import prisma, { TestUser } from "@/db";

const testUserData = {
  username: TestUser.USERNAME,
  passwordHash: await argon2.hash(TestUser.PASSWORD),
  firstName: "Risith",
  lastName: "Kankanamge",
};

try {
  // Ensure that a test user exists in the database.
  await prisma.user.upsert({
    where: { username: TestUser.USERNAME },
    create: testUserData,
    update: {
      passwordHash: testUserData.passwordHash,
      firstName: testUserData.firstName,
      lastName: testUserData.lastName,
    },
  });

  await prisma.$disconnect();
  console.log("Successfully seeded database");
} catch (error) {
  console.log(`Failed to seed database: ${error}`);
  await prisma.$disconnect();
  process.exit(1);
}
