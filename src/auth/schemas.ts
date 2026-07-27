import type { FastifyInstance } from "fastify";
import z from "zod";
import db, { refreshTokens } from "@/db";
import { Response4xx } from "@/schemas";

export const RefreshToken = z.uuidv7();

export const Tokens = z.object({
  accessToken: z.string(),
  refreshToken: RefreshToken,
});

export type Tokens = z.infer<typeof Tokens>;

export const TokensResponse = {
  201: Tokens,
  "4xx": Response4xx,
};

const THIRTY_DAYS_MS = 30 * 24 * 60 * 60 * 1000;

export async function issueTokens(
  app: FastifyInstance,
  userId: number,
): Promise<Tokens> {
  const refreshToken = await db
    .insert(refreshTokens)
    .values({
      userId,
      expiresAt: new Date(Date.now() + THIRTY_DAYS_MS),
    })
    .returning({ value: refreshTokens.value });
  return {
    accessToken: app.jwt.sign({ id: userId }, { expiresIn: "30m" }),
    refreshToken: refreshToken[0]?.value as string,
  };
}
