import { PrismaPg } from "@prisma/adapter-pg";
import { reportTypes } from "@/report";
import { PrismaClient } from "./generated/client";

const adapter = new PrismaPg({
  connectionString: `${process.env.DATABASE_URL}`,
});
const db = new PrismaClient({ adapter }).$extends(reportTypes);
export default db;
