import type { Decimal } from "@prisma/client/runtime/client";
import z from "zod";
import { Drivetrain, Indexer, Shooter } from "@/db/generated/enums";
import type App from "./app";
import db from "./db";
import * as report from "./report/schemas";

const StatboticsTeamEvent = z.object({
  // biome-ignore-start lint/style/useNamingConvention: Statbotics naming convention
  epa: z.object({
    breakdown: z.object({
      total_points: z.number(),
      auto_points: z.number(),
      teleop_points: z.number(),
      endgame_points: z.number(),
      auto_fuel: z.number(),
      auto_tower: z.number(),
      teleop_fuel: z.number(),
      endgame_fuel: z.number(),
      endgame_tower: z.number(),
    }),
  }),
  // biome-ignore-end lint/style/useNamingConvention: Statbotics naming convention
});

type Stats = {
  avgHubScores: number | null;
  hubScoresStdev: number | null;
  avgHubAccuracy: number | null;
  avgPasses: number | null;
  passesStdev: number | null;
  avgAutoHubScores: number | null;
  avgAutoLevel: number | null;
  avgAutoPasses: number | null;
  avgTeleopHubScores: number | null;
  teleopHubScoresStdev: number | null;
  avgTeleopHubScoresWhenDefended: number | null;
  avgTeleopPasses: number | null;
  teleopPassesStdev: number | null;
  avgTeleopDefended: number | null;
  avgEndgameLevel: number | null;
  avgMinorFouls: number | null;
  avgMajorFouls: number | null;
  matchesIn: number | null;
  matchesMissed: number | null;
  matchesIncapacitated: number | null;
  entireMatchesIncapacitated: number | null;
};

type Robot = {
  drivetrain: Drivetrain | null;
  shooter: Shooter | null;
  indexer: Indexer | null;
  climbLevel: number | null;
  driverEvents: number | null;
  weightLbs: Decimal | null;
};

const Epa = z.object({
  total: z.number(),
  auto: z.number(),
  autoHub: z.number(),
  autoTower: z.number(),
  teleop: z.number(),
  teleopHub: z.number(),
  endgameTower: z.number(),
});

type Epa = z.infer<typeof Epa>;

const GetSchema = {
  params: z.object({
    number: report.CoercedTeamNumber,
  }),
  querystring: z.object({
    eventCode: report.EventCode,
  }),
  response: {
    200: z.object({
      hub: z.object({
        scores: z.object({
          avg: z.union([z.number().nonnegative(), z.null()]),
          stdev: z.union([z.number().nonnegative(), z.null()]),
        }),
        avgAccuracy: z.union([z.number(), z.null()]),
      }),
      passes: z.object({
        avg: z.union([z.number().nonnegative(), z.null()]),
        stdev: z.union([z.number().nonnegative(), z.null()]),
      }),
      auto: z.object({
        avgHubScores: z.union([z.number().nonnegative(), z.null()]),
        avgLevel: z.union([z.number().nonnegative().max(1), z.null()]),
        avgPasses: z.union([z.number().nonnegative(), z.null()]),
      }),
      teleop: z.object({
        hubScores: z.object({
          avg: z.union([z.number().nonnegative(), z.null()]),
          stdev: z.union([z.number().nonnegative(), z.null()]),
          avgWhenDefended: z.union([z.number().nonnegative(), z.null()]),
        }),
        passes: z.object({
          avg: z.union([z.number().nonnegative(), z.null()]),
          stdev: z.union([z.number().nonnegative(), z.null()]),
        }),
        avgDefended: z.union([z.number().nonnegative().max(1), z.null()]),
      }),
      avgEndgameLevel: z.union([report.Level, z.null()]),
      avgMinorFouls: z.union([z.number().nonnegative(), z.null()]),
      avgMajorFouls: z.union([z.number().nonnegative(), z.null()]),
      matchesIn: z.union([z.number().nonnegative(), z.null()]),
      matchesMissed: z.union([z.number().nonnegative(), z.null()]),
      matchesIncapacitated: z.union([z.number().nonnegative(), z.null()]),
      entireMatchesIncapacitated: z.union([z.number().nonnegative(), z.null()]),
      drivetrain: z.union([z.enum(Drivetrain), z.null()]),
      shooter: z.union([z.enum(Shooter), z.null()]),
      indexer: z.union([z.enum(Indexer), z.null()]),
      climbLevel: z.union([report.Level, z.null()]),
      driverEvents: z.union([z.int().nonnegative(), z.null()]),
      weightLbs: z.union([z.number().positive(), z.null()]),
      epa: z.union([Epa, z.null()]),
    }),
  },
};

export default async function route(app: App) {
  app.get("/team/:number", { schema: GetSchema }, async (req) => {
    const [stats] = await db.$queryRaw<[Stats]>`
SELECT
  AVG(hub_scores) FILTER (WHERE inlier) AS "avgHubScores",
  STDDEV_POP(hub_scores) FILTER (WHERE inlier) AS "hubScoresStdev",
  AVG(hub_scores / NULLIF(hub_scores + hub_misses, 0)) FILTER (WHERE inlier) AS "avgHubAccuracy",
  AVG(passes) FILTER (WHERE inlier) AS "avgPasses",
  STDDEV_POP(passes) FILTER (WHERE inlier) AS "passesStdev",
  AVG("autoHubScores") FILTER (WHERE inlier) AS "avgAutoHubScores",
  AVG(("autoClimb" = 'LEVEL1')::INT) FILTER (WHERE inlier) AS "avgAutoLevel",
  AVG("autoPasses") FILTER (WHERE inlier) AS "avgAutoPasses",
  AVG("teleopHubScores") FILTER (WHERE inlier) AS "avgTeleopHubScores",
  STDDEV_POP("teleopHubScores") FILTER (WHERE inlier) AS "teleopHubScoresStdev",
  AVG("teleopHubScores") FILTER (WHERE "teleopWasDefended" AND inlier) AS "avgTeleopHubScoresWhenDefended",
  AVG("teleopPasses") FILTER (WHERE inlier) AS "avgTeleopPasses",
  STDDEV_POP("teleopPasses") FILTER (WHERE inlier) AS "teleopPassesStdev",
  AVG("teleopDefended"::INT) FILTER (WHERE inlier) AS "avgTeleopDefended",
  AVG("endgameLevel") FILTER (WHERE inlier) AS "avgEndgameLevel",
  AVG("minorFouls") FILTER (WHERE inlier) AS "avgMinorFouls",
  AVG("majorFouls") FILTER (WHERE inlier) AS "avgMajorFouls",
  SUM("inMatch"::INT) AS "matchesIn",
  SUM((NOT "inMatch")::INT) AS "matchesMissed",
  SUM(("secondsIncapacitated" > 0)::INT) AS "matchesIncapacitated",
  SUM(("secondsIncapacitated" = 150)::INT) AS "entireMatchesIncapacitated"
FROM (
  SELECT
    *,
    "autoHubScores" + "teleopHubScores" AS hub_scores,
    "autoHubMisses" + "teleopHubMisses" AS hub_misses,
    "autoPasses" + "teleopPasses" AS passes,
    -- A match is 150 seconds.
    "inMatch" AND "secondsIncapacitated" <> 150 AS inlier
  FROM "Report"
)
WHERE "teamNumber" = ${req.params.number}
  AND "eventCode" = ${req.query.eventCode}
`;

    let [robot] = await db.$queryRaw<[Robot] | []>`
SELECT
  drivetrain,
  shooter,
  indexer,
  "climbLevel",
  "driverEvents",
  "weightLbs"
FROM "PitReport"
WHERE "teamNumber" = ${req.params.number}
  AND "eventCode" = ${req.query.eventCode}
LIMIT 1
`;
    if (!robot) {
      robot = {
        drivetrain: null,
        shooter: null,
        indexer: null,
        climbLevel: null,
        driverEvents: null,
        weightLbs: null,
      };
    }

    let epa: Epa | null = null;
    const statboticsUrl = `https://api.statbotics.io/v3/team_event/${req.params.number}/2026${req.query.eventCode.toLowerCase()}`;
    const statboticsRes = await fetch(statboticsUrl);
    if (statboticsRes.ok) {
      const json = await statboticsRes.json();
      const teamEventResult = StatboticsTeamEvent.safeParse(json);
      if (teamEventResult.success) {
        const epaBreakdown = teamEventResult.data.epa.breakdown;
        epa = {
          total: epaBreakdown.total_points,
          auto: epaBreakdown.auto_points,
          autoHub: epaBreakdown.auto_fuel,
          autoTower: epaBreakdown.auto_tower,
          teleop: epaBreakdown.teleop_points + epaBreakdown.endgame_points,
          teleopHub: epaBreakdown.teleop_fuel + epaBreakdown.endgame_fuel,
          endgameTower: epaBreakdown.endgame_tower,
        };
      }
    }

    return {
      hub: {
        scores: {
          avg: stats.avgHubScores,
          stdev: stats.hubScoresStdev,
        },
        avgAccuracy: stats.avgHubAccuracy,
      },
      passes: {
        avg: stats.avgPasses,
        stdev: stats.passesStdev,
      },
      auto: {
        avgHubScores: stats.avgAutoHubScores,
        avgLevel: stats.avgAutoLevel,
        avgPasses: stats.avgAutoPasses,
      },
      teleop: {
        hubScores: {
          avg: stats.avgTeleopHubScores,
          stdev: stats.teleopHubScoresStdev,
          avgWhenDefended: stats.avgTeleopHubScoresWhenDefended,
        },
        passes: {
          avg: stats.avgPasses,
          stdev: stats.passesStdev,
        },
        avgDefended: stats.avgTeleopDefended,
      },
      avgEndgameLevel: stats.avgEndgameLevel,
      avgMinorFouls: stats.avgMinorFouls,
      avgMajorFouls: stats.avgMajorFouls,
      matchesIn: stats.matchesIn,
      matchesMissed: stats.matchesMissed,
      matchesIncapacitated: stats.matchesIncapacitated,
      entireMatchesIncapacitated: stats.entireMatchesIncapacitated,
      ...robot,
      weightLbs: robot.weightLbs ? robot.weightLbs.toNumber() : null,
      epa,
    };
  });
}
