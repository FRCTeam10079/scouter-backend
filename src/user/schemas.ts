import z from "zod";

export const Username = z.string().min(1).max(30);
export const Password = z.string().min(1).max(50);
export const FirstName = z.string().min(1).max(50);
export const LastName = z.string().min(1).max(50);

export const Display = z.object({
  id: z.int().positive(),
  firstName: z.string(),
  lastName: z.string(),
});
