import type App from "@/app";
import { Prisma } from "@/db/prisma/client";
import data from "./data";
import rankings from "./rankings";
import reports from "./reports";
import report from "./route";

export default async function route(app: App) {
  await app.register(data);
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
          autoHubScores: true,
          autoHubMisses: true,
          autoClimb: true,
          autoPasses: true,
          autoCollectDepot: true,
          autoCollectNeutral: true,
          autoCollectOutpost: true,
          autoDisruptNz: true,
        },
        compute(report) {
          return {
            notes: report.autoNotes,
            hubScores: report.autoHubScores,
            hubMisses: report.autoHubMisses,
            climb: report.autoClimb,
            passes: report.autoPasses,
            collectDepot: report.autoCollectDepot,
            collectNeutral: report.autoCollectNeutral,
            collectOutpost: report.autoCollectOutpost,
            disruptNz: report.autoDisruptNz,
          };
        },
      },
      teleop: {
        needs: {
          teleopNotes: true,
          teleopHubScores: true,
          teleopHubMisses: true,
          teleopLevel: true,
          teleopClimbFailed: true,
          teleopDefended: true,
          teleopPasses: true,
        },
        compute(report) {
          return {
            notes: report.teleopNotes,
            hubScores: report.teleopHubScores,
            hubMisses: report.teleopHubMisses,
            level: report.teleopLevel,
            climbFailed: report.teleopClimbFailed,
            defended: report.teleopDefended,
            passes: report.teleopPasses,
          };
        },
      },
      endgame: {
        needs: {
          endgameNotes: true,
          endgameLevel: true,
          endgameClimbFailed: true,
        },
        compute(report) {
          return {
            notes: report.endgameNotes,
            level: report.endgameLevel,
            climbFailed: report.endgameClimbFailed,
          };
        },
      },
    },
  },
});
