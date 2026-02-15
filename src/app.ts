import fastifyCors from "@fastify/cors";
import fastifyJwt from "@fastify/jwt";
import fastify, {
  type FastifyBaseLogger,
  type FastifyInstance,
  type RawReplyDefaultExpression,
  type RawRequestDefaultExpression,
  type RawServerDefault,
} from "fastify";
import type {
  FastifyLoggerOptions,
  PinoLoggerOptions,
} from "fastify/types/logger";
import {
  serializerCompiler,
  validatorCompiler,
  type ZodTypeProvider,
} from "fastify-type-provider-zod";
import auth, { authenticate } from "./auth";
import report from "./report";
import user from "./user";

type App = FastifyInstance<
  RawServerDefault,
  RawRequestDefaultExpression,
  RawReplyDefaultExpression,
  FastifyBaseLogger,
  ZodTypeProvider
>;
export type { App as default };

export async function createApp(logger: Logger): Promise<App> {
  const app = fastify({ logger }).withTypeProvider<ZodTypeProvider>();
  app.setValidatorCompiler(validatorCompiler);
  app.setSerializerCompiler(serializerCompiler);

  if (!process.env.JWT_SECRET) {
    app.log.error("JWT_SECRET environment variable has not been set");
    process.exit(1);
  }
  await app.register(fastifyJwt, { secret: process.env.JWT_SECRET });
  app.addHook("onRequest", authenticate);

  if (process.env.NODE_ENV === "development") {
    // CORS is used since the frontend can be tested in a web browser.
    await app.register(fastifyCors, {
      methods: ["GET", "POST", "PATCH", "DELETE"],
    });
  }

  await app.register(auth);
  await app.register(report);
  await app.register(user);

  return app;
}

export type Logger = FastifyLoggerOptions & PinoLoggerOptions;

export namespace Logger {
  /** Logs everything. */
  export const DEV: Logger = {
    transport: {
      // Pretty logging
      target: "pino-pretty",
      options: {
        translateTime: "SYS:hh:MM:ss", // 12-hour local clock
        ignore: "req.host,req.remoteAddress,req.remotePort,pid,hostname,reqId",
      },
    },
  };

  /** Logs errors and warnings to error.log. */
  export const PROD: Logger = {
    level: "warn",
    file: "error.log",
  };

  /** Logs errors and warnings. */
  export const TEST: Logger = {
    level: "warn",
    ...DEV,
  };
}
