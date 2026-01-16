import OpenAI from "openai";
import { zodTextFormat } from "openai/helpers/zod";
import Type from "typebox";
import z from "zod";
import type App from "@/app";
import prisma, { TeamNumber } from "@/db";
import ErrorResponse from "@/error-response";

// Does it matter when the report was created?

const PROMPT = `\
You are an AI scouting analyst for a FIRST Robotics Competition event. Your task is to evaluate teams for alliance selection and match strategy using the provided structured scouting data and qualitative notes. You must assess both expected team value and the reliability of that assessment using only the input data provided. All numeric evaluations must be normalized to a 0-1 scale, where higher values indicate stronger performance or greater reliability. These normalized values are intended to be displayed as percentages in the user interface but should be treated internally as normalized scores.

Alliances score by delivering game pieces into their alliance HUB during Autonomous and Teleoperated periods and by climbing the TOWER during Endgame. Autonomous actions are high impact because they occur without driver input and influence early match momentum. Teleoperated play accounts for the majority of scoring volume. Endgame tower climbs are among the highest-value actions in the game and frequently determine match outcomes. Fouls award points to the opposing alliance and can significantly swing close matches.

Our robot travels over the bump and does not go under the trench. Teams that travel under the trench, indicated by the trenchOrBump field, add value by avoiding congestion and interference, enabling smoother cycles for themselves and alliance partners. Trench capability should be treated as a situational advantage that improves consistency and traffic flow rather than as a primary scoring factor.

All evaluations must be based strictly on the provided input fields. Capabilities or behaviors must not be inferred if they are not supported by the data. The matchType field should be used to weight playoff matches more heavily than qualification matches when sufficient data exists. The matchNumber field may be used to identify trends such as improvement, regression, or fatigue across an event. The eventCode field provides contextual grouping only and should not be treated as a performance signal.

Penalty discipline is a critical component of evaluation. The minorFouls field should be used to identify inefficiency or lack of field awareness and should reduce reliability when frequent. The majorFouls field is a strong negative signal, as repeated major fouls indicate high playoff risk regardless of scoring output.

Autonomous performance should be evaluated using autoMovement, autoHubScore, autoHubMisses, and autoLevel1. Reliable autonomous movement, scoring, and climbing increase expected team value, while missed shots or inconsistent autonomous behavior reduce reliability. The autoNotes field should be used to capture context that is not fully represented by numeric data.

Teleoperated performance should be evaluated using teleopHubScore, teleopHubMisses, and teleopLevel. Sustained scoring throughput and efficiency increase team value. Teleoperated climb capability can indicate readiness for Endgame execution. The teleopNotes field should be used to account for defense, mechanical issues, strategic play, or non-scoring contributions that are not captured by raw scoring metrics.

Endgame performance is one of the highest-impact factors in evaluation. The endgameLevel field should be treated as a primary signal, with priority given to consistency and repeatability. The endgameHubScore and endgameHubMisses fields provide secondary context. Failed climbs or repeated Endgame issues significantly reduce reliability. The endgameNotes field should be used to capture critical contextual information.

The notes, autoNotes, teleopNotes, and endgameNotes fields should be used to adjust evaluations when numeric data alone does not fully explain performance. Qualitative observations may indicate driver skill, mechanical reliability, defensive value, field awareness, or clutch execution that materially affects team value.

The score represents a normalized estimate of expected match impact relative to other teams at the event. The confidence represents a normalized measure of how reliable that estimate is, based on data volume, consistency across matches, and agreement between quantitative metrics and qualitative notes. Confidence must not be baked into the score. Favor consistency, reliability, and low risk over single-match peak performance. Penalize volatility, repeated penalties, and unreliable climbs. Prefer teams that complement an over-bump robot and reduce alliance congestion. When data is limited or contradictory, reason conservatively and reflect lower confidence. All evaluations must be derived strictly from the provided input data, and missing information must not be invented.\
`;

const AIResponseFormat = z
  .array(
    z.object({
      teamNumber: z
        .number()
        .int()
        .positive()
        .describe(
          "FRC team number. Positive integer uniquely identifying the team.",
        ),
      score: z
        .number()
        .min(0)
        .max(1)
        .describe(
          "Normalized team value score in the range 0-1 representing expected match impact relative to other teams at this event. Intended to be displayed as a percentage in the UI.",
        ),
      confidence: z
        .number()
        .min(0)
        .max(1)
        .describe(
          "Reliability of the score in the range 0-1, reflecting data quality, consistency across matches, and agreement between metrics and qualitative notes. Higher values indicate greater trust in the score.",
        ),
      overview: z
        .string()
        .describe(
          "Human-readable summary of the team evaluation. Should include a brief overview followed by bullet points describing key strengths and weaknesses based on the provided scouting data.",
        ),
    }),
  )
  .describe(
    "Collection of team evaluations for a single event. Each entry represents a unique team and includes a normalized score, confidence, and qualitative overview. Ordering is not guaranteed and should not be relied upon.",
  );

const RankingsSchema = {
  response: {
    200: Type.Array(
      Type.Object({
        teamNumber: TeamNumber,
        score: Type.Number({ minimum: 0, maximum: 1 }),
        confidence: Type.Number({ minimum: 0, maximum: 1 }),
        overview: Type.String(),
      }),
    ),
    502: ErrorResponse,
  },
};

const openai = new OpenAI();

export default async function rankings(app: App) {
  app.get("/rankings", { schema: RankingsSchema }, async (_, reply) => {
    const reports = await prisma.report.findMany({
      select: {
        eventCode: true,
        matchType: true,
        matchNumber: true,
        teamNumber: true,
        notes: true,
        trenchOrBump: true,
        minorFouls: true,
        majorFouls: true,
        autoNotes: true,
        autoMovement: true,
        autoHubScore: true,
        autoHubMisses: true,
        autoLevel1: true,
        teleopNotes: true,
        teleopHubScore: true,
        teleopHubMisses: true,
        teleopLevel: true,
        endgameNotes: true,
        endgameHubScore: true,
        endgameHubMisses: true,
        endgameLevel: true,
      },
    });
    const response = await openai.responses.parse({
      model: "gpt-5",
      temperature: 0.1,
      input: [
        { role: "system", content: PROMPT },
        { role: "user", content: JSON.stringify(reports) },
      ],
      text: {
        format: zodTextFormat(AIResponseFormat, "rankings"),
      },
    });
    if (!response.output_parsed) {
      return reply.code(502).send({ code: "OPENAI_API_FAILED" });
    }
    return response.output_parsed;
  });
}
