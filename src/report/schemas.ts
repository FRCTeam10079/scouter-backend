import z from "zod";
import { Level, MatchType } from "@/db/prisma/enums";
import type { ReportUncheckedCreateInput } from "@/db/prisma/models";
import { CoercedInt } from "@/schemas";

export const EventCode = z.string().length(5);
export const MatchNumber = z.int().min(1).max(200);
export const CoercedMatchNumber = CoercedInt.min(1).max(200);
export const TeamNumber = z.int().min(1).max(20000);
export const CoercedTeamNumber = CoercedInt.min(1).max(20000);
export const Notes = z.string().max(400);

export const Auto = z.object({
  notes: Notes,
  movement: z.boolean(),
  hubScore: z.int().positive(),
  hubMisses: z.int().positive(),
  level1: z.boolean(),
});

export const Teleop = z.object({
  notes: Notes,
  hubScore: z.int().positive(),
  hubMisses: z.int().positive(),
  level: z.union([z.enum(Level), z.null()]),
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
  auto: Auto,
  teleop: Teleop,
  endgame: Teleop,
});

export type Data = z.infer<typeof Data>;

export function dataToDb(
  data: Data,
  userId: number,
): ReportUncheckedCreateInput {
  return {
    userId,
    createdAt: data.createdAt,
    eventCode: data.eventCode,
    matchType: data.matchType,
    matchNumber: data.matchNumber,
    teamNumber: data.teamNumber,
    notes: data.notes,
    minorFouls: data.minorFouls,
    majorFouls: data.majorFouls,
    autoNotes: data.auto.notes,
    autoMovement: data.auto.movement,
    autoHubScore: data.auto.hubScore,
    autoHubMisses: data.auto.hubMisses,
    autoLevel1: data.auto.level1,
    teleopNotes: data.teleop.notes,
    teleopHubScore: data.teleop.hubScore,
    teleopHubMisses: data.teleop.hubMisses,
    teleopLevel: data.teleop.level,
    endgameNotes: data.endgame.notes,
    endgameHubScore: data.endgame.hubScore,
    endgameHubMisses: data.endgame.hubMisses,
    endgameLevel: data.endgame.level,
  };
}
