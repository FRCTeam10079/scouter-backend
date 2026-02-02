import { PrismaPg } from "@prisma/adapter-pg";
import z from "zod";
import { CoercedInt } from "@/schemas";
import { Level, PrismaClient } from "./prisma/client";

const adapter = new PrismaPg({
  connectionString: `${process.env.DATABASE_URL}`,
});
const db = new PrismaClient({ adapter });
export default db;

export namespace User {
  export const Username = z.string().min(1).max(30);
  export const Password = z.string().min(1).max(50);
  export const FirstName = z.string().min(1).max(50);
  export const LastName = z.string().min(1).max(50);

  export const Display = z.object({
    id: z.int().positive(),
    firstName: z.string(),
    lastName: z.string(),
  });
}

export const TeamNumber = z.int().min(1).max(20000);

export namespace Report {
  export const EventCode = z.string().length(5);
  export const MatchNumber = z.int().min(1).max(200);
  export const CoercedMatchNumber = CoercedInt.min(1).max(200);
  export const Notes = z.string().max(400);

  export const Auto = z.object({
    notes: Notes,
    movement: z.boolean(),
    hubScore: z.int().positive(),
    hubMisses: z.int().positive(),
    level1: z.boolean(),
  });

  export const Teleop = z.object({
    notes: Notes,
    hubScore: z.int().positive(),
    hubMisses: z.int().positive(),
    level: z.union([z.enum(Level), z.null()]),
  });
}

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
