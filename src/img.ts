import fs from "node:fs";
import sharp from "sharp";
import z from "zod";
import type App from "./app";
import { CoercedInt } from "./schemas";

const GetSchema = {
  params: z.object({
    id: z.uuidv7(),
  }),
  querystring: z.object({
    width: CoercedInt.nonnegative().optional(),
    height: CoercedInt.nonnegative().optional(),
  }),
};

export default function route(app: App) {
  app.get("/img/:id", { schema: GetSchema }, async (req, reply) => {
    // Stream the image while resizing it.
    const stream = fs
      .createReadStream(`img/${req.params.id}`)
      .pipe(sharp().resize(req.query.width, req.query.height))
      .on("error", (error: NodeJS.ErrnoException) => {
        // ENOENT means the file doesn't exist.
        if (error.code === "ENOENT") {
          return reply.status(404).send({ code: "IMAGE_NOT_FOUND" });
        }
        reply.status(500);
        app.log.error(error);
      });
    return reply.type("image/webp").send(stream);
  });
}
