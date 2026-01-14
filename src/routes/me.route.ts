import * as argon2 from "@node-rs/argon2";
import Type from "typebox";
import type App from "@/app";
import prisma, { User } from "@/db";
import ErrorResponse from "@/error-response";

const MeGetSchema = {
  response: {
    200: Type.Object({
      username: Type.String(),
      firstName: Type.String(),
      lastName: Type.String(),
    }),
    "4xx": ErrorResponse,
  },
};

const MePatchSchema = {
  body: Type.Object({
    username: Type.Optional(User.Username),
    password: Type.Optional(User.Password),
    firstName: Type.Optional(User.FirstName),
    lastName: Type.Optional(User.LastName),
  }),
  response: {
    204: Type.Null(),
    "4xx": ErrorResponse,
  },
};

const MeDeleteSchema = {
  response: {
    204: Type.Null(),
  },
};

export default async function me(app: App) {
  app.get("/me", { schema: MeGetSchema }, async (req, reply) => {
    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      select: { username: true, firstName: true, lastName: true },
    });
    if (!user) {
      return reply.code(410).send({ code: "DELETED_ACCOUNT" });
    }
    return user;
  });

  app.patch("/me", { schema: MePatchSchema }, async (req, reply) => {
    const user = await prisma.user.update({
      where: { id: req.user.id },
      data: {
        username: req.body.username,
        passwordHash:
          req.body.password && (await argon2.hash(req.body.password)),
        firstName: req.body.firstName,
        lastName: req.body.lastName,
      },
    });
    if (!user) {
      return reply.code(410).send({ code: "DELETED_ACCOUNT" });
    }
    reply.code(204).send();
  });

  app.delete("/me", { schema: MeDeleteSchema }, async (req, reply) => {
    await prisma.user.delete({ where: { id: req.user.id } });
    reply.code(204).send();
  });
}
