import type App from "@/app";
import report from "./route";

export default async function route(app: App) {
  await app.register(report);
}
