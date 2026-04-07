import fs from "node:fs";
import { Readable } from "node:stream";
import { pipeline } from "node:stream/promises";
import z from "zod";
import type App from "@/app";
import db from "@/db";
import {
  AutoAction,
  Drivetrain,
  Shooter,
  StartingPosition,
} from "@/db/generated/enums";
import * as report from "@/report/schemas";
import { CoercedInt, Response4xx } from "@/schemas";

const Creation = z.object({
  createdAt: z.iso.datetime(),
  eventCode: report.EventCode,
  teamNumber: report.CoercedTeamNumber,
  drivetrain: z.enum(Drivetrain),
  shooter: z.enum(Shooter),
  estimatedBps: z.coerce.number<string>().positive(),
  hopperCapacity: CoercedInt.positive(),
  climbLevel: report.CoercedLevel,
  canPass: z.coerce.boolean<string>(),
  canDefend: z.coerce.boolean<string>(),
  canCrossBump: z.coerce.boolean<string>(),
  canCrossTrench: z.coerce.boolean<string>(),
  autoRoutines: z.array(z.string()),
  driverEvents: CoercedInt.nonnegative(),
  weightLbs: z.coerce.number<string>().positive(),
  notes: z.string(),
  photo: z.union([
    z.object({
      file: z.instanceof(Readable),
      mimetype: z.string().startsWith("image/"),
    }),
    z.string().length(0),
  ]),
});

const AutoRoutine = z.object({
  startingPosition: z.enum(StartingPosition),
  actions: z.array(z.enum(AutoAction)),
  expectedHubScores: z.int().nonnegative(),
});

type AutoRoutine = z.infer<typeof AutoRoutine>;

const PostSchema = {
  response: {
    204: z.null(),
    "4xx": Response4xx,
  },
};

export default async function route(app: App) {
  app.post("/pit-report", { schema: PostSchema }, async (req, reply) => {
    // Convert the request parts into a format that Zod can parse.
    const parts: Record<string, unknown> = {};
    for await (const part of req.parts()) {
      if (parts[part.fieldname] === undefined) {
        parts[part.fieldname] = part.type === "field" ? part.value : part;
      } else if (part.type === "field") {
        if (typeof parts[part.fieldname] === "string") {
          parts[part.fieldname] = [parts[part.fieldname], part.value];
        } else {
          (parts[part.fieldname] as unknown[]).push(part.value);
        }
      }
    }
    const dataResult = Creation.safeParse(parts);
    if (dataResult.error) {
      return reply.status(400).send({ code: "INVALID_FORM_DATA" });
    }
    const data = dataResult.data;
    // Parse the AUTO routines.
    const autoRoutines: AutoRoutine[] = [];
    for (const routine of data.autoRoutines) {
      const routineResult = AutoRoutine.safeParse(JSON.parse(routine));
      if (routineResult.error) {
        return reply.status(400).send({ code: "INVALID_FORM_DATA" });
      }
      autoRoutines.push(routineResult.data);
    }
    await db.$transaction(async (tx) => {
      let photoId: string | undefined;
      if (typeof data.photo !== "string") {
        photoId = crypto.randomUUID();
        await pipeline(data.photo.file, fs.createWriteStream(`img/${photoId}`));
      }
      await tx.pitReport.create({
        data: {
          user: { connect: { id: req.user.id } },
          ...data,
          autoRoutines: { create: autoRoutines },
          photoId,
        },
      });
    });
    reply.code(201);
  });
}
