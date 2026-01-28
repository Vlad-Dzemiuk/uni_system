import { z } from "zod";
import { USER_ROLES } from "../users/user.model.js";

const passwordPolicy = z
  .string()
  .min(8, "Пароль повинен складатися щонайменше з 8 символів")
  .max(72, "Пароль занадто довгий")
  .regex(/[a-z]/, "Пароль повинен містити малу літеру.")
  .regex(/[A-Z]/, "Пароль повинен містити велику літеру")
  .regex(/[0-9]/, "Пароль повинен містити цифру")
  .regex(/[^A-Za-z0-9]/, "Пароль повинен містити символ");

export const registerSchema = z.object({
  body: z.object({
    email: z.string().email(),
    password: passwordPolicy,
    fullName: z.string().min(3).max(120),
    role: z.enum(USER_ROLES),
  }),
  params: z.object({}).optional(),
  query: z.object({}).optional(),
});

export const loginSchema = z.object({
  body: z.object({
    email: z.string().email(),
    password: z.string().min(1),
  }),
  params: z.object({}).optional(),
  query: z.object({}).optional(),
});

export const verifyEmailSchema = z.object({
  body: z.object({
    token: z.string().min(10),
  }),
  params: z.object({}).optional(),
  query: z.object({}).optional(),
});

export const resendVerifyEmailSchema = z.object({
  body: z.object({
    email: z.string().email(),
  }),
  params: z.object({}).optional(),
  query: z.object({}).optional(),
});
