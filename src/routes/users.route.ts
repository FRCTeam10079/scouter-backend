import Type from "typebox";
import type App from "@/app";
import prisma, { User } from "@/db";
import ErrorResponse from "@/error-response";

const UserSchema = {
  response: {
    200: Type.Array(User.Display),
    "4xx": ErrorResponse,
  },
};

export default async function user(app: App) {
  app.get("/users", { schema: UserSchema }, () => {
    return prisma.user.findMany({
      select: { id: true, firstName: true, lastName: true },
    });
  });
}
