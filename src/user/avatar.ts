import fs from "node:fs";
import path from "node:path";
import sharp from "sharp";
import z from "zod";
import type App from "@/app";
import { CoercedInt } from "@/schemas";

export const MAX_AVATAR_SIZE = 512;

const GetSchema = {
  params: z.object({
    userId: CoercedInt.positive(),
  }),
  querystring: z.object({
    size: CoercedInt.min(32).max(MAX_AVATAR_SIZE),
  }),
};

export default function route(app: App) {
  app.get("/avatar/:userId", { schema: GetSchema }, async (req, reply) => {
    // Stream the image while resizing it.
    const stream = fs
      .createReadStream(path.join("avatars", String(req.params.userId)))
      .pipe(sharp().resize(req.query.size, req.query.size))
      .on("error", (error: NodeJS.ErrnoException) => {
        // ENOENT means the file doesn't exist.
        if (error.code === "ENOENT") {
          return reply.status(404).send({ code: "NO_SUCH_AVATAR" });
        }
        reply.status(500);
        app.log.error(error);
      });
    return reply.type("image/webp").send(stream);
  });
}
