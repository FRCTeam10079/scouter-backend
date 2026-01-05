import path from "node:path";
import fastifyAutoload from "@fastify/autoload";
import fastifyJwt from "@fastify/jwt";
import type { TypeBoxTypeProvider } from "@fastify/type-provider-typebox";
import fastify, { type FastifyServerOptions } from "fastify";
import { authenticate } from "./routes/auth";

export default function createApp(options: FastifyServerOptions = {}) {
  if (!process.env.JWT_SECRET) {
    console.error("JWT_SECRET environment variable has not been set");
    process.exit(1);
  }

  const app = fastify(options).withTypeProvider<TypeBoxTypeProvider>();

  app.register(fastifyJwt, { secret: process.env.JWT_SECRET });
  app.addHook("onRequest", authenticate);

  app.register(fastifyAutoload, {
    dir: path.join(import.meta.dirname, "routes"),
    // Ignore index files because they cause other plugins in the same directory
    // to be ignored.
    indexPattern: /$^/,
    matchFilter: /\.route\.(ts|js)$/,
    forceESM: true,
  });

  return app;
}
