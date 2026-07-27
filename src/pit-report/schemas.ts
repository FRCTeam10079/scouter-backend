import z from "zod";
import {
  AutoAction,
  Drivetrain,
  Indexer,
  Shooter,
  StartingPosition,
} from "@/db/enums";
import * as report from "@/report/schemas";
import { PositiveDecimal } from "@/schemas";
import * as user from "@/user/schemas";

export const AutoRoutine = z.object({
  startingPosition: z.enum(StartingPosition),
  actions: z.array(z.enum(AutoAction)),
  expectedHubScores: z.int().nonnegative(),
});

export type AutoRoutine = z.infer<typeof AutoRoutine>;

export const Report = z.object({
  user: z.union([user.Display, z.null()]),
  eventCode: report.EventCode,
  teamNumber: report.TeamNumber,
  drivetrain: z.enum(Drivetrain),
  shooter: z.enum(Shooter),
  estimatedBps: z.union([PositiveDecimal, z.null()]),
  indexer: z.enum(Indexer),
  hopperCapacity: z.int().positive(),
  climbLevel: report.Level,
  canPass: z.boolean(),
  canDefend: z.boolean(),
  canCrossBump: z.boolean(),
  canCrossTrench: z.boolean(),
  autoRoutines: z.array(AutoRoutine),
  driverEvents: z.int().nonnegative(),
  weightLbs: PositiveDecimal,
  notes: report.Notes,
  photoId: z.union([z.uuidv7(), z.null()]),
});

export type Report = z.infer<typeof Report>;
