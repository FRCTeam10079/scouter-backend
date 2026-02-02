import fs from "node:fs";
import { rm as deleteFile } from "node:fs/promises";
import path from "node:path";
import { Readable } from "node:stream";
import { pipeline } from "node:stream/promises";
import fastifyMultipart from "@fastify/multipart";
import * as argon2 from "@node-rs/argon2";
import sharp from "sharp";
import z from "zod";
import type App from "@/app";
import db, { User } from "@/db";
import { Response4xx } from "@/schemas";
import { AVATAR_STORED_SIZE } from "./avatar.route";

const MeGetSchema = {
  response: {
    200: z.object({
      username: z.string(),
      firstName: z.string(),
      lastName: z.string(),
    }),
    "4xx": Response4xx,
  },
};

const MeUpdate = z.object({
  username: User.Username.optional(),
  password: User.Password.optional(),
  firstName: User.FirstName.optional(),
  lastName: User.LastName.optional(),
  avatar: z
    .object({
      file: z.instanceof(Readable),
      mimetype: z.string().startsWith("image/"),
    })
    .optional(),
});

const MePatchSchema = {
  response: {
    204: z.null(),
    "4xx": Response4xx,
  },
};

const MeDeleteSchema = {
  response: {
    204: z.null(),
  },
};

export default async function me(app: App) {
  await app.register(fastifyMultipart);

  app.get("/me", { schema: MeGetSchema }, async (req, reply) => {
    const user = await db.user.findUnique({
      where: { id: req.user.id },
      select: { username: true, firstName: true, lastName: true },
    });
    if (!user) {
      return reply.code(410).send({ code: "DELETED_ACCOUNT" });
    }
    return user;
  });

  app.patch("/me", { schema: MePatchSchema }, async (req, reply) => {
    throw "bad";
    const parts: Record<string, unknown> = {};
    for await (const part of req.parts()) {
      if (parts[part.fieldname] === undefined) {
        parts[part.fieldname] = part.type === "field" ? part.value : part;
      }
    }
    const dataResult = MeUpdate.safeParse(parts);
    if (dataResult.error) {
      return reply.status(400).send({ code: "INVALID_FORM_DATA" });
    }
    const data = dataResult.data;
    const user = await db.user.update({
      where: { id: req.user.id },
      data: {
        username: data.username,
        passwordHash: data.password && (await argon2.hash(data.password)),
        firstName: data.firstName,
        lastName: data.lastName,
      },
    });
    if (!user) {
      return reply.code(410).send({ code: "DELETED_ACCOUNT" });
    }
    if (data.avatar) {
      await pipeline(
        data.avatar.file,
        sharp()
          .resize({
            width: AVATAR_STORED_SIZE,
            height: AVATAR_STORED_SIZE,
            withoutEnlargement: true,
          })
          .webp(),
        fs.createWriteStream(path.join("avatars", String(req.user.id))),
      );
    }
    reply.code(204);
  });

  app.delete("/me", { schema: MeDeleteSchema }, async (req, reply) => {
    await db.user.delete({ where: { id: req.user.id } });
    const avatarPath = path.join("avatars", String(req.user.id));
    await deleteFile(avatarPath, { force: true });
    reply.code(204);
  });
}
