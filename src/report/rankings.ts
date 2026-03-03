import OpenAi from "openai";
import { zodTextFormat } from "openai/helpers/zod";
import z from "zod";
import type App from "@/app";
import db from "@/db";
import { AutoClimb } from "@/db/prisma/enums";
import * as report from "./schemas";

const PROMPT = `\
You are an AI scouting analyst for a FIRST Robotics Competition team. You will be given scouting data as a JSON array, where each element represents a single team's performance record from a match. Multiple teams may share the same 'matchNumber', indicating they played in the same match. Your task is to evaluate teams for alliance selection and match strategy using only the information contained in this JSON array. You must assess both expected team value and the reliability of that assessment based strictly on the provided data while minimizing bias caused by random alliance compositions.

All numeric evaluations must be normalized to a 0-1 scale, where higher values indicate stronger performance or greater reliability. These normalized values are intended to be displayed as percentages in the user interface but must be treated internally as normalized values. Expected team value and reliability must remain conceptually separate and must not be conflated.

Alliances score by delivering game pieces into their alliance HUB during Autonomous and Teleoperated periods and by climbing the TOWER during Endgame. Autonomous actions are high impact because they occur without driver input and influence early match momentum. Teleoperated play accounts for the majority of scoring volume. Endgame climbs are among the highest-value actions in the game and frequently determine match outcomes. Fouls award points to the opposing alliance and can significantly swing close matches.

The input data is a JSON array. Each object includes fields such as 'createdAt', 'matchNumber', 'teamNumber', 'notes', 'minorFouls', 'majorFouls', 'secondsIncapacitated', 'auto', 'teleop', and 'endgame'. All evaluations must be based strictly on the fields present in the input JSON array. Capabilities or behaviors must not be inferred if they are not supported by the data. The 'createdAt' value is an ISO 8601 date-time and may be used to detect broad temporal trends, but performance should generally be treated as stable unless sustained directional change is clearly supported by data.

To reduce bias from random alliances, you must consider match context using 'matchNumber'. When evaluating a team's scoring output, analyze other teams that share the same 'matchNumber' to detect contextual effects. If a team's scoring appears elevated due to high passing volume from alliance partners or other facilitation, avoid attributing the full scoring output to independent capability unless supported by consistent performance across multiple matches. If scoring output is reduced in matches where 'teleop.defended' is true, interpret that as defensive pressure rather than lack of intrinsic ability, especially if performance is stronger in other matches. Adjust confidence before heavily adjusting expected team value when contextual influence is uncertain.

Reliability is a primary factor in evaluation. The 'secondsIncapacitated' value represents total time a robot was unable to function due to mechanical or operational problems and should strongly reduce reliability and moderately reduce expected team value when high. Frequent 'majorFouls' significantly reduce reliability and indicate playoff risk. Repeated 'minorFouls' reduce reliability and may indicate driver or field awareness issues.

Autonomous performance must be evaluated using 'auto.hubScores', 'auto.hubMisses', 'auto.climb', 'auto.disruptNz', and 'auto.passes'. Consistent autonomous scoring increases expected team value. High miss counts reduce reliability. Successful autonomous climbs increase value. 'auto.disruptNz' may indicate defensive or strategic influence and should contribute modestly to expected value when consistent. 'auto.passes' indicate cooperative play and role specialization and should increase expected value when they contribute meaningfully to alliance scoring. 'auto.notes' should be used to interpret context not reflected in numeric data.

Teleoperated performance must be evaluated using 'teleop.hubScores', 'teleop.hubMisses', 'teleop.level', 'teleop.climbFailed', 'teleop.defended', and 'teleop.passes'. Sustained scoring throughput increases expected team value. Efficiency should be considered, with excessive misses reducing reliability. A non-null 'teleop.level' indicates a successful climb attempt during Teleoperated play and should increase expected value. A true 'teleop.climbFailed' significantly reduces reliability. If 'teleop.defended' is true and scoring output is reduced, treat this as defensive pressure rather than reduced intrinsic capability. 'teleop.passes' indicate facilitation and role flexibility and should increase expected team value when they meaningfully support alliance scoring, even if direct hub scoring is lower.

Endgame performance must be evaluated using 'endgame.level' and 'endgame.climbFailed'. Endgame climb level is a high-impact factor and should heavily influence expected team value. Consistent successful climbs increase both value and reliability. A true 'endgame.climbFailed' significantly reduces reliability. 'endgame.notes' should be used to interpret situational factors such as strategic decisions or partial climb attempts.

The score represents a normalized estimate of expected independent match impact relative to other teams based solely on the provided data while accounting for contextual influences from shared 'matchNumber' performance. Confidence represents a normalized measure of how reliable that estimate is. Confidence must reflect mechanical reliability, scoring consistency across matches, efficiency stability, foul discipline, and robustness across different alliance contexts. Confidence should increase when performance remains stable across varying 'matchNumber' groupings and alliance compositions. Confidence should decrease when performance varies significantly depending on alliance partners, passing volume, or defensive conditions, unless that role-based dependency is consistent and predictable. Facilitation roles indicated by sustained 'teleop.passes' or 'auto.passes' are not inherently low-confidence if they are consistent across matches. Confidence must not be incorporated into the score itself.

Favor consistent, repeatable performance across varying match conditions over isolated peak matches. Penalize volatility, frequent breakdowns, repeated penalties, and unreliable climbs. When data is limited or heavily context-dependent, reduce confidence rather than aggressively altering expected team value. All evaluations must be derived strictly from the provided JSON data, and missing information must not be invented.\
`;

const AiRanking = z.object({
  score: z
    .number()
    .nonnegative()
    .max(1)
    .describe(
      "Normalized team value score in the range 0-1 representing expected match impact relative to other teams in the provided dataset.",
    ),
  confidence: z
    .number()
    .nonnegative()
    .max(1)
    .describe(
      "A normalized 0-1 measure of how reliable and stable the team's score estimate is. Higher values indicate consistent performance and robustness across matches and alliance contexts; lower values indicate volatility, breakdown risk, or context-dependent performance.",
    ),
  overview: z
    .string()
    .describe(
      "Markdown-formatted summary explaining the evaluation. Should include a brief paragraph overview followed by bullet points describing key strengths, weaknesses, reliability factors, and notable performance patterns. Use standard Markdown syntax only.",
    ),
});

const AiRankings = z
  .record(
    report.TeamNumber.describe(
      "FRC team number. Positive integer uniquely identifying the team.",
    ),
    AiRanking,
  )
  .describe(
    "Object mapping each team number to its evaluation. Each key is a team number represented as a string, and each value contains that team's normalized score, confidence, and qualitative overview. Key order is not meaningful and should not be interpreted as ranking.",
  );

const EndgameAvg = z.object({
  level: z.number().nonnegative().max(3),
  climbFailed: z.number().nonnegative().max(1),
});

const Rankings = z.record(
  report.TeamNumber,
  AiRanking.extend({
    avg: z.object({
      minorFouls: z.number().nonnegative(),
      majorFouls: z.number().nonnegative(),
      secondsIncapacitated: z.number().nonnegative(),
      overBump: z.number().nonnegative().max(1),
      underTrench: z.number().nonnegative().max(1),
      auto: z.object({
        hubScores: z.number().nonnegative(),
        hubMisses: z.number().nonnegative(),
        climb: z.object({
          none: z.number().nonnegative().max(1),
          level1: z.number().nonnegative().max(1),
          failed: z.number().nonnegative().max(1),
        }),
        collectDepot: z.number().nonnegative().max(1),
        collectNeutral: z.number().nonnegative().max(1),
        collectOutpost: z.number().nonnegative().max(1),
        disruptNz: z.number().nonnegative().max(1),
        passes: z.number().nonnegative(),
      }),
      teleop: EndgameAvg.extend({
        hubScores: z.number().nonnegative(),
        hubMisses: z.number().nonnegative(),
      }),
      endgame: EndgameAvg,
    }),
  }),
);

type Rankings = z.infer<typeof Rankings>;

const GetSchema = {
  response: {
    200: Rankings,
    502: z.null(),
  },
};

type Cache = {
  reportId: number;
  rankings: Rankings;
};

const openai = new OpenAi();
let cache: Cache | null = null;

export default async function route(app: App) {
  app.get("/rankings", { schema: GetSchema }, async (_, reply) => {
    const newestReport = await db.report.findFirst({
      select: { id: true },
      orderBy: { id: "desc" },
    });
    if (!newestReport) {
      return [];
    }
    // Check if a report has been created since the rankings were last updated.
    if (cache?.reportId === newestReport.id) {
      return cache.rankings;
    }
    const reports = await db.report.findMany({
      where: { id: { lte: newestReport.id } },
      select: {
        createdAt: true,
        matchNumber: true,
        teamNumber: true,
        notes: true,
        minorFouls: true,
        majorFouls: true,
        secondsIncapacitated: true,
        overBump: true,
        underTrench: true,
        startingPosition: true,
        auto: true,
        teleop: true,
        endgame: true,
      },
    });
    // Remove data the AI does not need to rank teams.
    const aiReports = reports.map((report) => ({
      createdAt: report.createdAt,
      matchNumber: report.matchNumber,
      teamNumber: report.teamNumber,
      notes: report.notes,
      minorFouls: report.minorFouls,
      majorFouls: report.majorFouls,
      secondsIncapacitated: report.secondsIncapacitated,
      auto: {
        notes: report.auto.notes,
        hubScores: report.auto.hubScores,
        hubMisses: report.auto.hubMisses,
        climb: report.auto.climb,
        disruptNz: report.auto.disruptNz,
        passes: report.auto.passes,
      },
      teleop: report.teleop,
      endgame: report.endgame,
    }));
    const response = await openai.responses.parse({
      model: "gpt-5.2-pro",
      reasoning: { effort: "xhigh" },
      temperature: 0,
      input: [
        { role: "system", content: PROMPT },
        { role: "user", content: JSON.stringify(aiReports) },
      ],
      text: {
        format: zodTextFormat(AiRankings, "rankings"),
      },
    });
    if (!response.output_parsed) {
      return reply.code(502);
    }
    const rankings = Object.fromEntries(
      Object.entries(response.output_parsed).map(([teamNumber, ranking]) => [
        teamNumber,
        {
          ...ranking,
          avg: {
            minorFouls: 0,
            majorFouls: 0,
            secondsIncapacitated: 0,
            overBump: 0,
            underTrench: 0,
            auto: {
              hubScores: 0,
              hubMisses: 0,
              climb: {
                none: 0,
                level1: 0,
                failed: 0,
              },
              passes: 0,
              collectDepot: 0,
              collectNeutral: 0,
              collectOutpost: 0,
              disruptNz: 0,
            },
            teleop: {
              hubScores: 0,
              hubMisses: 0,
              level: 0,
              climbFailed: 0,
              defended: 0,
              passes: 0,
            },
            endgame: {
              level: 0,
              climbFailed: 0,
            },
          },
          reports: 0,
        },
      ]),
    );
    // Sum up the stats.
    for (const report of reports) {
      const ranking = rankings[report.teamNumber];
      if (!ranking) {
        return reply.code(502);
      }
      ranking.avg.minorFouls += report.minorFouls;
      ranking.avg.majorFouls += report.majorFouls;
      ranking.avg.secondsIncapacitated += report.secondsIncapacitated;
      ranking.avg.overBump += report.overBump as unknown as number;
      ranking.avg.underTrench += report.underTrench as unknown as number;

      ranking.avg.auto.hubScores += report.auto.hubScores;
      ranking.avg.auto.hubMisses += report.auto.hubMisses;
      switch (report.auto.climb) {
        case AutoClimb.NONE:
          ranking.avg.auto.climb.none++;
          break;
        case AutoClimb.LEVEL1:
          ranking.avg.auto.climb.level1++;
          break;
        case AutoClimb.FAILED:
          ranking.avg.auto.climb.failed++;
      }
      ranking.avg.auto.passes += report.auto.passes;
      ranking.avg.auto.collectDepot += report.auto
        .collectDepot as unknown as number;
      ranking.avg.auto.collectNeutral += report.auto
        .collectNeutral as unknown as number;
      ranking.avg.auto.collectOutpost += report.auto
        .collectOutpost as unknown as number;
      ranking.avg.auto.disruptNz += report.auto.disruptNz as unknown as number;

      ranking.avg.teleop.hubScores += report.teleop.hubScores;
      ranking.avg.teleop.hubMisses += report.teleop.hubMisses;
      ranking.avg.teleop.level += report.teleop.level;
      ranking.avg.teleop.climbFailed += report.teleop
        .climbFailed as unknown as number;
      ranking.avg.teleop.defended += report.teleop
        .defended as unknown as number;
      ranking.avg.teleop.passes += report.teleop.passes;

      ranking.avg.endgame.level += report.endgame.level;
      ranking.avg.endgame.climbFailed += report.endgame
        .climbFailed as unknown as number;

      ranking.reports++;
    }
    // Divide to get the average.
    for (const ranking of Object.values(rankings)) {
      ranking.avg.minorFouls /= ranking.reports;
      ranking.avg.majorFouls /= ranking.reports;
      ranking.avg.secondsIncapacitated /= ranking.reports;
      ranking.avg.overBump /= ranking.reports;
      ranking.avg.underTrench /= ranking.reports;

      ranking.avg.auto.hubScores /= ranking.reports;
      ranking.avg.auto.hubMisses /= ranking.reports;
      ranking.avg.auto.climb.none /= ranking.reports;
      ranking.avg.auto.climb.level1 /= ranking.reports;
      ranking.avg.auto.climb.failed /= ranking.reports;
      ranking.avg.auto.passes /= ranking.reports;
      ranking.avg.auto.collectDepot /= ranking.reports;
      ranking.avg.auto.collectNeutral /= ranking.reports;
      ranking.avg.auto.collectOutpost /= ranking.reports;
      ranking.avg.auto.disruptNz /= ranking.reports;

      ranking.avg.teleop.hubScores /= ranking.reports;
      ranking.avg.teleop.hubMisses /= ranking.reports;
      ranking.avg.teleop.level /= ranking.reports;
      ranking.avg.teleop.climbFailed /= ranking.reports;
      ranking.avg.teleop.defended /= ranking.reports;
      ranking.avg.teleop.passes /= ranking.reports;

      ranking.avg.endgame.level /= ranking.reports;
      ranking.avg.endgame.climbFailed /= ranking.reports;
    }
    cache = {
      reportId: newestReport.id,
      rankings,
    };
    return rankings;
  });
}
