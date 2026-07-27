import {
  and,
  avg,
  eq,
  getColumns,
  gt,
  lt,
  not,
  type SQL,
  sql,
  sum,
} from "drizzle-orm";
import z from "zod";
import db, { AutoClimb, reports } from "@/db";
import { Drivetrain, Indexer, Shooter } from "@/db/enums";
import { PositiveDecimal } from "@/schemas";
import type App from "../app";
import * as report from "../report/schemas";

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
      weightLbs: z.union([PositiveDecimal, z.null()]),
      epa: z.union([Epa, z.null()]),
    }),
  },
};

export default async function route(app: App) {
  app.get("/team/:number", { schema: GetSchema }, async (req) => {
    const base = db
      .select({
        ...getColumns(reports),
        hubScores:
          sql<number>`${reports.autoHubScores} + ${reports.teleopHubScores}`.as(
            "hub_scores",
          ),
        hubMisses:
          sql<number>`${reports.autoHubMisses} + ${reports.teleopHubMisses}`.as(
            "hub_misses",
          ),
        passes: sql<number>`${reports.autoPasses} + ${reports.teleopPasses}`.as(
          "passes",
        ),
        // A match is 150 seconds
        inlier: (
          and(reports.inMatch, lt(reports.secondsIncapacitated, 150)) as SQL
        ).as("inlier"),
      })
      .from(reports)
      .as("base");
    const [stats] = (await db
      .select({
        avgHubScores: sql<number>`${avg(base.hubScores)} FILTER (WHERE ${base.inlier})`,
        hubScoresStdev: sql<number>`STDDEV_POP(${base.hubScores}) FILTER (WHERE ${base.inlier})`,
        avgHubAccuracy: sql<number>`AVG(${base.hubScores} / NULLIF(${base.hubScores} + ${base.hubMisses}, 0)) FILTER WHERE (inlier)`,
        avgPasses: sql<number>`${avg(base.passes)} FILTER (WHERE ${base.inlier})`,
        passesStdev: sql<number>`STDDEV_POP(${base.passes}) FILTER (WHERE ${base.inlier})`,
        avgAutoHubScores: sql<number>`${avg(base.autoHubScores)} FILTER (WHERE ${base.inlier})`,
        avgAutoLevel: sql<number>`AVG(${eq(base.autoClimb, AutoClimb.Level1)}::INT) FILTER (WHERE ${base.inlier})`,
        avgAutoPasses: sql<number>`${avg(base.autoPasses)} FILTER (WHERE ${base.inlier})`,
        avgTeleopHubScores: sql<number>`${avg(base.teleopHubScores)} FILTER (WHERE ${base.inlier})`,
        teleopHubScoresStdev: sql<number>`STDDEV_POP(${base.teleopHubScores}) FILTER (WHERE ${base.inlier})`,
        avgTeleopHubScoresWhenDefended: sql<number>`${avg(base.teleopHubScores)} FILTER (WHERE ${and(base.teleopWasDefended, base.inlier)})`,
        avgTeleopPasses: sql<number>`${avg(base.teleopPasses)} FILTER (WHERE ${base.inlier})`,
        teleopPassesStdev: sql<number>`STDDEV_POP(${base.teleopPasses}) FILTER (WHERE ${base.inlier})`,
        avgTeleopDefended: sql<number>`AVG(${base.teleopDefended}::INT) FILTER (WHERE ${base.inlier})`,
        avgEndgameLevel: sql<number>`${avg(base.endgameLevel)} FILTER (WHERE ${base.inlier})`,
        avgMinorFouls: sql<number>`${avg(base.minorFouls)} FILTER (WHERE ${base.inlier})`,
        avgMajorFouls: sql<number>`${avg(base.majorFouls)} FILTER (WHERE ${base.inlier})`,
        matchesIn: sum(sql<number>`${base.inMatch}::INT`),
        matchesMissed: sum(sql<number>`${not(base.inMatch)}::INT`),
        matchesIncapacitated: sum(
          sql<number>`${gt(base.secondsIncapacitated, 0)}::INT`,
        ),
        entireMatchesIncapacitated: sum(
          sql<number>`${eq(base.secondsIncapacitated, 150)}::INT`,
        ),
      })
      .from(base)
      .where(
        and(
          eq(base.teamNumber, req.params.number),
          eq(base.eventCode, req.query.eventCode),
        ),
      )) as [Stats];

    const dbPitInfo = await db.query.pitReports.findFirst({
      where: {
        teamNumber: req.params.number,
        eventCode: req.query.eventCode,
      },
      orderBy: { createdAt: "desc" },
      columns: {
        drivetrain: true,
        shooter: true,
        indexer: true,
        climbLevel: true,
        driverEvents: true,
        weightLbs: true,
      },
    });
    const pitInfo = dbPitInfo ?? {
      drivetrain: null,
      shooter: null,
      indexer: null,
      climbLevel: null,
      driverEvents: null,
      weightLbs: null,
    };

    let epa: Epa | null = null;
    const statboticsUrl = `https://api.statbotics.io/v3/team_event/${req.params.number}/2026${req.query.eventCode}`;
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
      ...pitInfo,
      epa,
    };
  });
}
