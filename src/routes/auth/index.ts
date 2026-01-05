import type { FastifyInstance, FastifyReply, FastifyRequest } from "fastify";
import Type from "typebox";
import { Response4xx } from "@/.";
import prisma from "@/db";

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

const THIRTY_DAYS_MS = 30 * 24 * 60 * 60 * 1000;

export async function issueAuthTokens(app: FastifyInstance, userId: number) {
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

export const RefreshToken = Type.String({ format: "uuid" });

export const AuthTokensResponse = {
  201: Type.Object({
    accessToken: Type.String(),
    refreshToken: RefreshToken,
  }),
  "4xx": Response4xx,
};
