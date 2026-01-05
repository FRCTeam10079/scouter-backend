import { PrismaPg } from "@prisma/adapter-pg";
import Type from "typebox";
import { PrismaClient } from "./prisma/client";

const adapter = new PrismaPg({
  connectionString: `${process.env.DATABASE_URL}`,
});
const prisma = new PrismaClient({ adapter });
export default prisma;

export namespace User {
  export const Username = Type.String({ minLength: 1, maxLength: 30 });
  export const Password = Type.String({ minLength: 1, maxLength: 50 });
  export const FirstName = Type.String({ minLength: 1, maxLength: 50 });
  export const LastName = Type.String({ maxLength: 50 });
  export const Display = Type.Object({
    id: Type.Integer(),
    firstName: Type.String(),
    lastName: Type.String(),
  });
}

export namespace Report {
  export const EventCode = Type.String({ minLength: 5, maxLength: 5 });
  export const TeamNumber = Type.Integer({ minimum: 1, maximum: 20000 });
}

export namespace TestUser {
  export const USERNAME = "testuser";
  export const PASSWORD = "4FeetTallRisith?45!";

  export async function getId() {
    const user = await prisma.user.findUniqueOrThrow({
      where: { username: USERNAME },
      select: { id: true },
    });
    return user.id;
  }
}
