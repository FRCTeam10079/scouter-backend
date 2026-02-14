import type App from "@/app";
import { Prisma } from "@/db/prisma/client";
import rankings from "./rankings";
import reports from "./reports";
import report from "./route";

export default async function route(app: App) {
  await app.register(rankings);
  await app.register(report);
  await app.register(reports);
}

export const reportTypes = Prisma.defineExtension({
  name: "reportTypes",
  result: {
    report: {
      auto: {
        needs: {
          autoNotes: true,
          autoMovement: true,
          autoHubScore: true,
          autoHubMisses: true,
          autoLevel1: true,
        },
        compute(report) {
          return {
            notes: report.autoNotes,
            movement: report.autoMovement,
            hubScore: report.autoHubScore,
            hubMisses: report.autoHubMisses,
            level1: report.autoLevel1,
          };
        },
      },
      teleop: {
        needs: {
          teleopNotes: true,
          teleopHubScore: true,
          teleopHubMisses: true,
          teleopLevel: true,
        },
        compute(report) {
          return {
            notes: report.teleopNotes,
            hubScore: report.teleopHubScore,
            hubMisses: report.teleopHubMisses,
            level: report.teleopLevel,
          };
        },
      },
      endgame: {
        needs: {
          endgameNotes: true,
          endgameHubScore: true,
          endgameHubMisses: true,
          endgameLevel: true,
        },
        compute(report) {
          return {
            notes: report.endgameNotes,
            hubScore: report.endgameHubScore,
            hubMisses: report.endgameHubMisses,
            level: report.endgameLevel,
          };
        },
      },
    },
  },
});
