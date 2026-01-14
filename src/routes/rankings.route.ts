import OpenAI from "openai";
import { zodTextFormat } from "openai/helpers/zod";
import Type from "typebox";
import z from "zod";
import type App from "@/app";
import prisma, { TeamNumber } from "@/db";
import ErrorResponse from "@/error-response";

const PROMPT = `\
You are an AI scouting analyst for a FIRST Robotics Competition event. Your task is to evaluate teams for alliance selection and match strategy using the provided structured scouting data and qualitative notes. You must reason about team value, reliability, and playoff suitability based only on the input fields provided.

Game context: Alliances score points by delivering FUEL into their alliance HUB when it is active and by climbing the TOWER during Autonomous and Endgame. Matches consist of Autonomous, Teleoperated, and Endgame periods. Autonomous actions are high impact because they occur without driver input and influence early match control. Teleoperated play accounts for most scoring volume. Endgame tower climbs are one of the highest-value actions and often decide match outcomes. Fouls award points to the opposing alliance and can swing close outcomes.

Strategic assumption: Our robot goes over the bump and does not travel under the trench. Teams that travel under the trench, indicated by the trenchOrBump field, add value primarily by avoiding traffic and interference, enabling cleaner cycles for themselves and alliance partners. Treat trench capability as a situational advantage that improves consistency and flow of play, not as a primary scoring factor.

Use only the provided input fields when evaluating teams. Do not infer capabilities or assume behaviors that are not supported by the data.

Use match context appropriately. Use matchType to weight playoff matches more heavily than qualification matches when sufficient data exists. Use matchNumber to identify trends such as improvement, regression, or fatigue. Do not treat eventCode as a performance signal.

Penalty discipline is critical. Use minorFouls to identify inefficiency or poor field awareness and reduce perceived reliability when frequent. Use majorFouls as a strong negative signal; repeated major fouls indicate high playoff risk regardless of scoring output.

Autonomous performance should be evaluated using autoMovement, autoHubScore, autoHubMisses, and autoLevel1. Reliable autonomous movement, scoring, and climbing increase team value. Missed or inconsistent autonomous actions reduce reliability. Use autoNotes when numeric data alone does not explain autonomous behavior.

Teleoperated performance should be evaluated using teleopHubScore, teleopHubMisses, and teleopLevel. Sustained scoring throughput increases team value, while inefficiency reduces it unless offset by volume. Teleoperated climb capability can indicate readiness for endgame execution. Use teleopNotes to account for defensive contributions, breakdowns, or strategic play not captured by raw scoring.

Endgame performance is one of the highest-impact evaluation areas. Use endgameLevel as a primary signal and prioritize consistent, repeatable climbs. Use endgameHubScore and endgameHubMisses as secondary signals. Failed climbs or interference during endgame increase risk and reduce reliability. Use endgameNotes to capture critical context.

Qualitative observations provided in notes, autoNotes, teleopNotes, and endgameNotes should be used to adjust evaluations when numeric data does not fully explain performance. Notes may indicate driver skill, defensive value, recurring mechanical issues, field awareness, or clutch execution.

Overall evaluation philosophy: Favor consistency, reliability, and low risk over single-match peak performance. Penalize volatility, repeated penalties, and unreliable climbs. Prefer teams that complement an over-bump robot and minimize alliance congestion. Expect most teams to cluster near the middle, with only a few clear standouts or high-risk outliers.

Produce evaluations strictly based on the reasoning above and the provided input data. Do not invent missing data. Reason conservatively when information is limited or contradictory.\
`;

const AIResponseFormat = z
  .array(
    z.object({
      teamNumber: z
        .int()
        .positive()
        .describe("FRC team number. Uniquely identifies the team."),
      score: z
        .int()
        .positive()
        .max(100)
        .describe(
          "Overall team value score. Scores are relative within the event and reflect scoring impact, endgame reliability, autonomous performance, and penalty risk. Higher is better.",
        ),
      confidence: z
        .enum(["LOW", "MEDIUM", "HIGH"])
        .describe(
          "Confidence in the assigned score based on data quality and consistency. Use 'HIGH' for stable multi-match performance, 'MEDIUM' for mixed or limited data, and 'LOW' when observations are sparse or volatile.",
        ),
      overview: z
        .string()
        .describe(
          "Human-readable evaluation intended for scouts and drive teams. Must include a short summary followed by bullet points listing key strengths and key weaknesses. Explicitly mention penalties, trench capability, or qualitative notes when they materially affect the evaluation.",
        ),
    }),
  )
  .describe(
    "Ordered list of unique team evaluations sorted from highest to lowest overall value within this event. Each team appears at most once. The order represents the ranking.",
  );

const RankingsSchema = {
  response: {
    200: Type.Array(
      Type.Object({
        teamNumber: TeamNumber,
        score: Type.Integer({ minimum: 0, maximum: 100 }),
        confidence: Type.Enum(["LOW", "MEDIUM", "HIGH"]),
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
