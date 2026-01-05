declare module "@fastify/jwt" {
  interface FastifyJWT {
    payload: { id: number };
  }
}

import { Type } from "typebox";

export const Response4xx = Type.Object({ code: Type.String() });
