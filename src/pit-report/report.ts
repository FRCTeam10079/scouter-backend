import fs from "node:fs";
import { Readable } from "node:stream";
import { pipeline } from "node:stream/promises";
import z from "zod";
import type App from "@/app";
import db, { pitReports } from "@/db";
import { Drivetrain, Indexer, Shooter } from "@/db/enums";
import * as report from "@/report/schemas";
import { CoercedInt, PositiveDecimal, Response4xx } from "@/schemas";
import * as pitReport from "./schemas";

const Creation = z.object({
  createdAt: z.iso.datetime(),
  eventCode: report.EventCode,
  teamNumber: report.CoercedTeamNumber,
  drivetrain: z.enum(Drivetrain),
  shooter: z.enum(Shooter),
  estimatedBps: z.union([PositiveDecimal, z.string().length(0)]),
  indexer: z.enum(Indexer),
  hopperCapacity: CoercedInt.positive(),
  climbLevel: report.CoercedLevel,
  canPass: z.coerce.boolean<string>(),
  canDefend: z.coerce.boolean<string>(),
  canCrossBump: z.coerce.boolean<string>(),
  canCrossTrench: z.coerce.boolean<string>(),
  autoRoutines: z.array(z.string()),
  driverEvents: CoercedInt.nonnegative(),
  weightLbs: PositiveDecimal,
  notes: z.string(),
  photo: z.union([
    z.object({
      file: z.instanceof(Readable),
      mimetype: z.string().startsWith("image/"),
    }),
    z.string().length(0),
  ]),
});

const GetSchema = {
  params: z.object({
    id: CoercedInt.positive(),
  }),
  response: {
    200: pitReport.Report,
    404: Response4xx,
  },
};

const PostSchema = {
  response: {
    201: z.null(),
    "4xx": Response4xx,
  },
};

export default async function route(app: App) {
  app.get("/pit-report/:id", { schema: GetSchema }, async (req, reply) => {
    const report = await db.query.pitReports.findFirst({
      where: { id: req.params.id },
      with: {
        user: {
          columns: {
            id: true,
            firstName: true,
            lastName: true,
            avatarId: true,
          },
        },
        autoRoutines: true,
      },
    });
    if (!report) {
      return reply.code(404).send({ code: "REPORT_NOT_FOUND" });
    }
    return {
      ...report,
      createdAt: report.createdAt.toISOString(),
    };
  });

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
    const autoRoutines: pitReport.AutoRoutine[] = [];
    for (const routine of data.autoRoutines) {
      const parsedRoutine = JSON.parse(routine);
      const routineResult = pitReport.AutoRoutine.safeParse(parsedRoutine);
      if (routineResult.error) {
        return reply.status(422).send({ code: "INVALID_FORM_DATA" });
      }
      autoRoutines.push(routineResult.data);
    }
    await db.transaction(async (tx) => {
      let photoId: string | undefined;
      if (typeof data.photo !== "string") {
        photoId = crypto.randomUUID();
        await pipeline(data.photo.file, fs.createWriteStream(`img/${photoId}`));
      }
      await tx.insert(pitReports).values({
        ...data,
        createdAt: new Date(data.createdAt),
        userId: req.user.id,
        photoId,
      });
    });
    reply.code(201);
  });
}
