import z from "zod";
import {
  AutoAction,
  Drivetrain,
  Shooter,
  StartingPosition,
} from "@/db/generated/enums";
import * as report from "@/report/schemas";
import * as user from "@/user/schemas";

export const AutoRoutine = z.object({
  startingPosition: z.enum(StartingPosition),
  actions: z.array(z.enum(AutoAction)),
  expectedHubScores: z.int().nonnegative(),
});

export type AutoRoutine = z.infer<typeof AutoRoutine>;

export const Report = z.object({
  user: user.Display,
  eventCode: report.EventCode,
  teamNumber: report.TeamNumber,
  drivetrain: z.enum(Drivetrain),
  shooter: z.enum(Shooter),
  estimatedBps: z.union([z.number().positive(), z.null()]),
  hopperCapacity: z.int().positive(),
  climbLevel: report.Level,
  canPass: z.boolean(),
  canDefend: z.boolean(),
  canCrossBump: z.boolean(),
  canCrossTrench: z.boolean(),
  autoRoutines: z.array(AutoRoutine),
  driverEvents: z.int().nonnegative(),
  weightLbs: z.number().positive(),
  notes: report.Notes,
  photoId: z.union([z.uuidv4(), z.null()]),
});

export type Report = z.infer<typeof Report>;
