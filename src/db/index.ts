import { PrismaPg } from "@prisma/adapter-pg";
import { reportTypes } from "@/report";
import { PrismaClient } from "./prisma/client";

const adapter = new PrismaPg({
  connectionString: `${process.env.DATABASE_URL}`,
});
const db = new PrismaClient({ adapter }).$extends(reportTypes);
export default db;

export namespace TestUser {
  export const USERNAME = "testuser";
  export const PASSWORD = "4FeetTallRisith?45!";

  export async function getId() {
    const user = await db.user.findUniqueOrThrow({
      where: { username: USERNAME },
      select: { id: true },
    });
    return user.id;
  }
}
