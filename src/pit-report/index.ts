import type App from "@/app";
import getReports from "./get-reports";
import report from "./report";

export default async function route(app: App) {
  await app.register(getReports);
  await app.register(report);
}
