import db from "@/db";

export const USERNAME = "testuser";
export const PASSWORD = "4FeetTallRisith?45!";

export async function id() {
  const user = await db.user.findUniqueOrThrow({
    where: { username: USERNAME },
    select: { id: true },
  });
  return user.id;
}
