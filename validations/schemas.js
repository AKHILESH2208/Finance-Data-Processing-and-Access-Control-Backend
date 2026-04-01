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

export const createRecordSchema = z.object({
  amount: z.number().positive("Amount must be a positive number"),
  type: z.enum(["INCOME", "EXPENSE"]),
  category: z.string().min(1, "Category cannot be empty"),
  date: z.string().refine((val) => new Date(val).getTime() <= Date.now(), {
    message: "Date cannot be in the future"
  }),
  notesEncrypted: z.string().optional()
});