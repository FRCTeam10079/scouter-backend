declare module "@fastify/jwt" {
  interface FastifyJWT {
    payload: { id: number };
  }
}

import type { FastifyInstance, FastifyReply, FastifyRequest } from "fastify";
import { type Static, Type } from "typebox";
import prisma from "@/db";
import ErrorResponse from "@/error-response";

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

export const RefreshToken = Type.String({ format: "uuid" });

export const AuthTokensResponse = {
  201: Type.Object({
    accessToken: Type.String(),
    refreshToken: RefreshToken,
  }),
  "4xx": ErrorResponse,
};

export type AuthTokensResponse = Static<(typeof AuthTokensResponse)[201]>;

const THIRTY_DAYS_MS = 30 * 24 * 60 * 60 * 1000;

export async function issueAuthTokens(
  app: FastifyInstance,
  userId: number,
): Promise<AuthTokensResponse> {
  const refreshToken = await prisma.refreshToken.create({
    data: {
      userId,
      expiresAt: new Date(Date.now() + THIRTY_DAYS_MS),
    },
    select: { value: true },
  });
  return {
    accessToken: app.jwt.sign({ id: userId }, { expiresIn: "30m" }),
    refreshToken: refreshToken.value,
  };
}
