import "dotenv/config";
import { drizzle } from "drizzle-orm/node-postgres";
import relations from "./relations";
import * as testUser from "./test-user";

export * from "./enums";
export * from "./schema";
export * as testUser from "./test-user";

const db = drizzle(process.env.DATABASE_URL as string, { relations });

if (process.env.NODE_ENV !== "production") {
  await testUser.ensureExists(db);
}

export default db;
