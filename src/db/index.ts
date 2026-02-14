import { PrismaPg } from "@prisma/adapter-pg";
import testUser from "test/user";
import { reportTypes } from "@/report";
import { PrismaClient } from "./prisma/client";

const adapter = new PrismaPg({
  connectionString: `${process.env.DATABASE_URL}`,
});
const db = new PrismaClient({ adapter })
  .$extends(reportTypes)
  .$extends(testUser);
export default db;
