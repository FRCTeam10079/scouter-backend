import type App from "@/app";
import team from "./team";

export default async function route(app: App) {
  await app.register(team);
}
