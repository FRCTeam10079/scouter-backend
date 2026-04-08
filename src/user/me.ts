import fs from "node:fs";
import { rm as deleteFile } from "node:fs/promises";
import { Readable } from "node:stream";
import { pipeline } from "node:stream/promises";
import * as argon2 from "@node-rs/argon2";
import sharp from "sharp";
import z from "zod";
import type App from "@/app";
import db from "@/db";
import { Response4xx } from "@/schemas";
import * as user from "./schemas";

const Update = z.object({
  username: user.Username.optional(),
  password: user.Password.optional(),
  firstName: user.Name.optional(),
  lastName: user.Name.optional(),
  avatar: z.union([
    z
      .object({
        file: z.instanceof(Readable),
        mimetype: z.string().startsWith("image/"),
      })
      .optional(),
    // Form data doesn't have anything similar to `null`, so an empty string is
    // used instead. This is for if the user wants to delete their avatar.
    z.string().length(0),
  ]),
});

const GetSchema = {
  response: {
    200: z.object({
      username: user.Username,
      firstName: user.Name,
      lastName: user.Name,
      avatarId: z.union([z.uuidv4(), z.null()]),
    }),
    "4xx": Response4xx,
  },
};

const PatchSchema = {
  response: {
    204: z.null(),
    "4xx": Response4xx,
  },
};

const DeleteSchema = {
  response: {
    204: z.null(),
  },
};

export default async function route(app: App) {
  app.get("/me", { schema: GetSchema }, async (req, reply) => {
    const user = await db.user.findUnique({
      where: { id: req.user.id },
      select: {
        username: true,
        firstName: true,
        lastName: true,
        avatarId: true,
      },
    });
    if (!user) {
      return reply.code(410).send({ code: "DELETED_ACCOUNT" });
    }
    return user;
  });

  app.patch("/me", { schema: PatchSchema }, async (req, reply) => {
    // Convert the request parts into a format that Zod can parse.
    const parts: Record<string, unknown> = {};
    for await (const part of req.parts()) {
      if (parts[part.fieldname] === undefined) {
        parts[part.fieldname] = part.type === "field" ? part.value : part;
      }
    }
    const dataResult = Update.safeParse(parts);
    if (dataResult.error) {
      return reply.status(422).send({ code: "INVALID_FORM_DATA" });
    }
    const data = dataResult.data;
    await db.$transaction(async (tx) => {
      const user = await tx.user.findUnique({
        where: { id: req.user.id },
        select: { avatarId: true },
      });
      if (!user) {
        return reply.code(410).send({ code: "DELETED_ACCOUNT" });
      }
      let newAvatarId: string | null | undefined;
      if (data.avatar !== undefined) {
        if (typeof data.avatar === "string") {
          if (user.avatarId !== null) {
            await deleteFile(`img/${user.avatarId}`);
            newAvatarId = null;
          }
        } else {
          let avatarId: string;
          if (user.avatarId === null) {
            newAvatarId = crypto.randomUUID();
            avatarId = newAvatarId;
          } else {
            avatarId = user.avatarId;
          }
          await pipeline(
            data.avatar.file,
            sharp()
              .resize({
                width: 512,
                height: 512,
                withoutEnlargement: true,
              })
              .webp(),
            fs.createWriteStream(`img/${avatarId}`),
          );
        }
      }
      await tx.user.update({
        where: { id: req.user.id },
        data: {
          username: data.username,
          passwordHash:
            data.password !== undefined
              ? await argon2.hash(data.password)
              : undefined,
          firstName: data.firstName,
          lastName: data.lastName,
          avatarId: newAvatarId,
        },
      });
    });
    reply.code(204);
  });

  app.delete("/me", { schema: DeleteSchema }, async (req, reply) => {
    await db.$transaction(async (tx) => {
      const user = await tx.user.delete({
        where: { id: req.user.id },
        select: { avatarId: true },
      });
      if (user.avatarId) {
        await deleteFile(`img/${user.avatarId}`);
      }
    });
    reply.code(204);
  });
}
