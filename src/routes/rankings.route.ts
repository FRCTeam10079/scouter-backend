import OpenAI from "openai";
import { zodTextFormat } from "openai/helpers/zod";
import z from "zod";
import type App from "@/app";
import db, { Report } from "@/db";

// TODO: Cache AI output

const PROMPT = `\
You are an AI scouting analyst for a FIRST Robotics Competition team. You will be given scouting data as a JSON array, where each element represents a single team's performance record from a specific match. Your task is to evaluate teams for alliance selection and match strategy using only the information contained in this JSON array. You must assess both expected team value and the reliability of that assessment based strictly on the provided data.

All numeric evaluations must be normalized to a 0-1 scale, where higher values indicate stronger performance or greater reliability. These normalized values are intended to be displayed as percentages in the user interface but must be treated internally as normalized values. Expected team value and reliability must remain conceptually separate and must not be conflated.

Alliances score by delivering game pieces into their alliance HUB during Autonomous and Teleoperated periods and by climbing the TOWER during Endgame. Autonomous actions are high impact because they occur without driver input and influence early match momentum. Teleoperated play accounts for the majority of scoring volume. Endgame tower climbs are among the highest-value actions in the game and frequently determine match outcomes. Fouls award points to the opposing alliance and can significantly swing close matches.

All evaluations must be based strictly on the fields present in the input JSON array. Capabilities or behaviors must not be inferred if they are not supported by the data. The 'matchType' value should be used to weight playoff matches more heavily than qualification matches when sufficient data exists. The 'matchNumber' value may be used to identify trends such as improvement, regression, or fatigue within a single event.

When multiple events exist for the same team, event-level recency may be considered using the 'createdAt' value, which is an ISO 8601 date-time. However, because significant improvements between events are uncommon, recent events should not strongly override earlier data. Performance across events should generally be treated as stable, with recency used only to detect clear regressions, recoveries from breakdowns, or sustained directional changes. Disagreement between events should primarily reduce reliability rather than substantially alter expected team value.

Penalty discipline is a critical component of evaluation. 'minorFouls' should be used to identify inefficiency or lack of field awareness and should reduce reliability when frequent. 'majorFouls' are a strong negative signal, as repeated major fouls indicate high playoff risk regardless of scoring output.

Autonomous performance should be evaluated using 'autoMovement', 'autoHubScore', 'autoHubMisses', and 'autoLevel1'. Reliable autonomous movement, scoring, and climbing increase expected team value, while missed shots or inconsistent autonomous behavior reduce reliability. 'autoNotes' should be used to capture context not fully represented by numeric data.

Teleoperated performance should be evaluated using 'teleopHubScore', 'teleopHubMisses', and 'teleopLevel'. Sustained scoring throughput and efficiency increase team value. Teleoperated climb capability can indicate readiness for Endgame execution. 'teleopNotes' should be used to account for defense, mechanical issues, strategic play, or non-scoring contributions not captured by raw metrics.

Endgame performance is one of the highest-impact factors in evaluation. 'endgameLevel' should be treated as a primary signal, with priority given to consistency and repeatability. 'endgameHubScore' and 'endgameHubMisses' provide secondary context. Failed climbs or repeated Endgame issues significantly reduce reliability. 'endgameNotes' should be used to capture critical contextual information.

The 'notes', 'autoNotes', 'teleopNotes', and 'endgameNotes' values should be used to adjust evaluations when numeric data alone does not fully explain performance. Qualitative observations may indicate driver skill, mechanical reliability, defensive value, field awareness, or clutch execution that materially affects expected team value.

The score represents a normalized estimate of expected match impact relative to other teams based on the provided data. Confidence represents a normalized measure of how reliable that estimate is, based on data volume, consistency across matches and events, and agreement between quantitative metrics and qualitative notes. Confidence must not be incorporated into the score itself. Favor consistency, reliability, and low risk over single-match peak performance. Penalize volatility, repeated penalties, and unreliable climbs. When data is limited or contradictory, reason conservatively and reflect lower confidence. All evaluations must be derived strictly from the provided JSON data, and missing information must not be invented.\
`;

const Rankings = z
  .array(
    z.object({
      teamNumber: Report.TeamNumber.describe(
        "FRC team number. Positive integer uniquely identifying the team.",
      ),
      score: z
        .number()
        .positive()
        .max(1)
        .describe(
          "Normalized team value score in the range 0-1 representing expected match impact relative to other teams at this event. Intended to be displayed as a percentage in the UI.",
        ),
      confidence: z
        .number()
        .positive()
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

const GetSchema = {
  response: {
    200: Rankings,
    502: z.null(),
  },
};

const openai = new OpenAI();

export default async function rankings(app: App) {
  app.get("/rankings", { schema: GetSchema }, async (_, reply) => {
    const reports = await db.report.findMany({
      select: {
        createdAt: true,
        matchType: true,
        matchNumber: true,
        teamNumber: true,
        notes: true,
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
        format: zodTextFormat(Rankings, "rankings"),
      },
    });
    if (!response.output_parsed) {
      return reply.code(502);
    }
    return response.output_parsed;
  });
}
