import type App from "@/app";
import { Prisma } from "@/db/generated/client";
import data from "./data";
import reports from "./reports";
import report from "./route";

export default async function route(app: App) {
  await app.register(data);
  await app.register(report);
  await app.register(reports);
}

export const reportTypes = Prisma.defineExtension({
  name: "reportTypes",
  result: {
    report: {
      auto: {
        needs: {
          autoHubScores: true,
          autoHubMisses: true,
          autoClimb: true,
          autoPasses: true,
          autoNotes: true,
        },
        compute(report) {
          return {
            hubScores: report.autoHubScores,
            hubMisses: report.autoHubMisses,
            climb: report.autoClimb,
            passes: report.autoPasses,
            notes: report.autoNotes,
          };
        },
      },
      teleop: {
        needs: {
          teleopHubScores: true,
          teleopHubMisses: true,
          teleopPasses: true,
          teleopDefended: true,
          teleopWasDefended: true,
          teleopNotes: true,
        },
        compute(report) {
          return {
            hubScores: report.teleopHubScores,
            hubMisses: report.teleopHubMisses,
            passes: report.teleopPasses,
            defended: report.teleopDefended,
            wasDefended: report.teleopWasDefended,
            notes: report.teleopNotes,
          };
        },
      },
      endgame: {
        needs: {
          endgameLevel: true,
          endgameClimbFailed: true,
          endgameNotes: true,
        },
        compute(report) {
          return {
            level: report.endgameLevel,
            climbFailed: report.endgameClimbFailed,
            notes: report.endgameNotes,
          };
        },
      },
    },
  },
});
