declare module "@fastify/jwt" {
  interface FastifyJWT {
    payload: { id: number };
  }
}

import type { FastifyReply, FastifyRequest } from "fastify";
import type App from "@/app";
import auth from "./route";

export default async function route(app: App) {
  await app.register(auth, { prefix: "/auth" });
}

/** Verifies that the request has a valid bearer token in the Authentication
 * header. Upon success, `req.user.id` is set to the user's id. Upon failure,
 * a 401 status code is returned. */
export async function authenticate(req: FastifyRequest, reply: FastifyReply) {
  if (req.method === "POST" && req.url.startsWith("/auth/")) {
    return;
  }
  try {
    await req.jwtVerify();
  } catch (error) {
    reply.send(error);
  }
}
