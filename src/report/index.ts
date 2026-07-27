import type App from "@/app";
import data from "./data";
import getReports from "./get-reports";
import report from "./report";
import reports from "./reports";

export default async function route(app: App) {
  await app.register(data);
  await app.register(getReports);
  await app.register(report);
  await app.register(reports);
}
