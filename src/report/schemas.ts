import z from "zod";
import {
  Alliance,
  AutoClimb,
  MatchType,
  StartingPosition,
} from "@/db/prisma/enums";
import type { ReportCreateInput } from "@/db/prisma/models";

export const EventCode = z.string().length(5);
export const MatchNumber = z.int().min(1).max(200);
export const TeamNumber = z.int().min(1).max(20000);
export const Level = z.int().nonnegative().max(3);
const Notes = z.string().max(400);

export const Data = z.object({
  createdAt: z.iso.datetime(),
  eventCode: EventCode,
  matchType: z.enum(MatchType),
  matchNumber: MatchNumber,
  alliance: z.enum(Alliance),
  teamNumber: TeamNumber,
  inMatch: z.boolean(),
  notes: Notes,
  minorFouls: z.int().nonnegative(),
  majorFouls: z.int().nonnegative(),
  secondsIncapacitated: z.int().nonnegative(),
  shootingConfidence: z.int().nonnegative().max(5),
  crossBump: z.boolean(),
  crossTrench: z.boolean(),
  startingPosition: z.enum(StartingPosition),
  auto: z.object({
    hubScores: z.int().nonnegative(),
    hubMisses: z.int().nonnegative(),
    climb: z.enum(AutoClimb),
    passes: z.int().nonnegative(),
    collectDepot: z.boolean(),
    collectNeutral: z.boolean(),
    collectOutpost: z.boolean(),
    notes: Notes,
  }),
  teleop: z.object({
    hubScores: z.int().nonnegative(),
    hubMisses: z.int().nonnegative(),
    passes: z.int().nonnegative(),
    defended: z.boolean(),
    wasDefended: z.boolean(),
    notes: Notes,
  }),
  endgame: z.object({
    level: Level,
    climbFailed: z.boolean(),
    notes: Notes,
  }),
});

export type Data = z.infer<typeof Data>;

export function dataToDb(data: Data, userId: number): ReportCreateInput {
  return {
    user: { connect: { id: userId } },
    createdAt: data.createdAt,
    eventCode: data.eventCode,
    matchType: data.matchType,
    matchNumber: data.matchNumber,
    alliance: data.alliance,
    teamNumber: data.teamNumber,
    inMatch: data.inMatch,
    notes: data.notes,
    minorFouls: data.minorFouls,
    majorFouls: data.majorFouls,
    secondsIncapacitated: data.secondsIncapacitated,
    shootingConfidence: data.shootingConfidence,
    crossBump: data.crossBump,
    crossTrench: data.crossTrench,
    startingPosition: data.startingPosition,

    autoHubScores: data.auto.hubScores,
    autoHubMisses: data.auto.hubMisses,
    autoClimb: data.auto.climb,
    autoPasses: data.auto.passes,
    autoCollectDepot: data.auto.collectDepot,
    autoCollectNeutral: data.auto.collectNeutral,
    autoCollectOutpost: data.auto.collectOutpost,
    autoNotes: data.auto.notes,

    teleopHubScores: data.teleop.hubScores,
    teleopHubMisses: data.teleop.hubMisses,
    teleopPasses: data.teleop.passes,
    teleopDefended: data.teleop.defended,
    teleopWasDefended: data.teleop.wasDefended,
    teleopNotes: data.teleop.notes,

    endgameLevel: data.endgame.level,
    endgameClimbFailed: data.endgame.climbFailed,
    endgameNotes: data.endgame.notes,
  };
}
