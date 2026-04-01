import { z } from "zod";

export const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  role: z.enum(["VIEWER", "ANALYST", "ADMIN"]).optional()
});

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8)
});