import z from "zod";
import { AutoClimb, MatchType, StartingPosition } from "@/db/prisma/enums";
import type { ReportCreateInput } from "@/db/prisma/models";
import { CoercedInt } from "@/schemas";
import * as user from "@/user/schemas";

export const EventCode = z.string().length(5);
export const MatchNumber = z.int().min(1).max(200);
export const CoercedMatchNumber = CoercedInt.min(1).max(200);
export const TeamNumber = z.int().min(1).max(20000);
export const CoercedTeamNumber = CoercedInt.min(1).max(20000);
export const Notes = z.string().max(400);

export const Endgame = z.object({
  notes: Notes,
  level: z.int().positive().max(3),
  climbFailed: z.boolean(),
});

export const Data = z.object({
  createdAt: z.iso.datetime(),
  eventCode: EventCode,
  matchType: z.enum(MatchType),
  matchNumber: MatchNumber,
  teamNumber: TeamNumber,
  notes: Notes,
  minorFouls: z.int().positive(),
  majorFouls: z.int().positive(),
  secondsIncapacitated: z.int().positive(),
  overBump: z.boolean(),
  underTrench: z.boolean(),
  startingPosition: z.enum(StartingPosition),
  auto: z.object({
    notes: Notes,
    hubScores: z.int().positive(),
    hubMisses: z.int().positive(),
    climb: z.enum(AutoClimb),
    collectDepot: z.boolean(),
    collectNeutral: z.boolean(),
    collectOutpost: z.boolean(),
    disruptNz: z.boolean(),
    passes: z.int().positive(),
  }),
  teleop: Endgame.extend({
    hubScores: z.int().positive(),
    hubMisses: z.int().positive(),
  }),
  endgame: Endgame,
});

export type Data = z.infer<typeof Data>;

export function dataToDb(data: Data, userId: number): ReportCreateInput {
  return {
    user: { connect: { id: userId } },
    createdAt: data.createdAt,
    eventCode: data.eventCode,
    matchType: data.matchType,
    matchNumber: data.matchNumber,
    teamNumber: data.teamNumber,
    notes: data.notes,
    minorFouls: data.minorFouls,
    majorFouls: data.majorFouls,
    secondsIncapacitated: data.secondsIncapacitated,
    overBump: data.overBump,
    underTrench: data.underTrench,
    startingPosition: data.startingPosition,

    autoNotes: data.auto.notes,
    autoHubScores: data.auto.hubScores,
    autoHubMisses: data.auto.hubMisses,
    autoClimb: data.auto.climb,
    autoCollectDepot: data.auto.collectDepot,
    autoCollectNeutral: data.auto.collectNeutral,
    autoCollectOutpost: data.auto.collectOutpost,
    autoDisruptNz: data.auto.disruptNz,
    autoPasses: data.auto.passes,

    teleopNotes: data.teleop.notes,
    teleopHubScores: data.teleop.hubScores,
    teleopHubMisses: data.teleop.hubMisses,
    teleopLevel: data.teleop.level,
    teleopClimbFailed: data.teleop.climbFailed,

    endgameNotes: data.endgame.notes,
    endgameLevel: data.endgame.level,
    endgameClimbFailed: data.endgame.climbFailed,
  };
}

export const Report = Data.extend({
  user: z.union([user.Display, z.null()]),
});
