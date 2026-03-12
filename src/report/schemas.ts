import z from "zod";
import { AutoClimb, MatchType, StartingPosition } from "@/db/prisma/enums";
import type { ReportCreateInput } from "@/db/prisma/models";
import { CoercedInt } from "@/schemas";

export const EventCode = z.string().length(5);
export const MatchNumber = z.int().min(1).max(200);
export const CoercedMatchNumber = CoercedInt.min(1).max(200);
export const TeamNumber = z.int().min(1).max(20000);
export const CoercedTeamNumber = CoercedInt.min(1).max(20000);
const Notes = z.string().max(400);

const Endgame = z.object({
  notes: Notes,
  level: z.int().nonnegative().max(3),
  climbFailed: z.boolean(),
});

export const Data = z.object({
  createdAt: z.iso.datetime(),
  eventCode: EventCode,
  matchType: z.enum(MatchType),
  matchNumber: MatchNumber,
  teamNumber: TeamNumber,
  notes: Notes,
  minorFouls: z.int().nonnegative(),
  majorFouls: z.int().nonnegative(),
  secondsIncapacitated: z.int().nonnegative(),
  overBump: z.boolean(),
  underTrench: z.boolean(),
  startingPosition: z.enum(StartingPosition),
  auto: z.object({
    notes: Notes,
    hubScores: z.int().nonnegative(),
    hubMisses: z.int().nonnegative(),
    climb: z.enum(AutoClimb),
    passes: z.int().nonnegative(),
    collectDepot: z.boolean(),
    collectNeutral: z.boolean(),
    collectOutpost: z.boolean(),
    disruptNz: z.boolean(),
  }),
  teleop: Endgame.extend({
    hubScores: z.int().nonnegative(),
    hubMisses: z.int().nonnegative(),
    defended: z.boolean(),
    passes: z.int().nonnegative(),
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
    autoPasses: data.auto.passes,
    autoCollectDepot: data.auto.collectDepot,
    autoCollectNeutral: data.auto.collectNeutral,
    autoCollectOutpost: data.auto.collectOutpost,
    autoDisruptNz: data.auto.disruptNz,

    teleopNotes: data.teleop.notes,
    teleopHubScores: data.teleop.hubScores,
    teleopHubMisses: data.teleop.hubMisses,
    teleopLevel: data.teleop.level,
    teleopClimbFailed: data.teleop.climbFailed,
    teleopDefended: data.teleop.defended,
    teleopPasses: data.teleop.passes,

    endgameNotes: data.endgame.notes,
    endgameLevel: data.endgame.level,
    endgameClimbFailed: data.endgame.climbFailed,
  };
}
