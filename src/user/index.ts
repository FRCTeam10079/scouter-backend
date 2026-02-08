import type App from "@/app";
import avatar from "./avatar";
import me from "./me";
import users from "./users";

export default async function route(app: App) {
  await app.register(avatar);
  await app.register(me);
  await app.register(users);
}
