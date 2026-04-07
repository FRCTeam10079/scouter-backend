import z from "zod";

export const Username = z.string().min(1).max(30);
export const Password = z.string().min(1).max(50);
export const Name = z.string().min(1).max(50);

export const Display = z.object({
  id: z.int().nonnegative(),
  firstName: Name,
  lastName: Name,
  avatarId: z.union([z.uuidv4(), z.null()]),
});
