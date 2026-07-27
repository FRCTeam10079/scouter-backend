import { drizzle } from "drizzle-orm/node-postgres";
import { reset } from "drizzle-seed";
import * as schema from "@/db/schema";

console.log("Resetting database...");
const db = drizzle(process.env.DATABASE_URL as string);
await reset(db, schema);
