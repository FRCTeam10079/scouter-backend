import db from "@/db";
import { Prisma } from "@/db/prisma/client";

namespace TestUser {
  export const USERNAME = "testuser";
  export const PASSWORD = "4FeetTallRisith?45!";
}

const testUser = Prisma.defineExtension({
  name: "testUser",
  model: {
    user: {
      test: {
        username: TestUser.USERNAME,
        password: TestUser.PASSWORD,
        async id() {
          const user = await db.user.findUniqueOrThrow({
            where: { username: TestUser.USERNAME },
            select: { id: true },
          });
          return user.id;
        },
      },
    },
  },
});
export default testUser;
