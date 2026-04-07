import type App from "@/app";
import me from "./me";
import users from "./users";

export default async function route(app: App) {
  await app.register(me);
  await app.register(users);
}
