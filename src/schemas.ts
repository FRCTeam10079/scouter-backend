import z from "zod";

export const Response4xx = z.object({ code: z.string() });

export const CoercedInt = z.coerce.number<string>().int();
