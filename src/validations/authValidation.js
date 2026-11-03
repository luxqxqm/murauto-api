import { z } from 'zod';

const EMAIL_ERROR = 'Введіть коректний email';
const PASSWORD_ERROR = 'Невірний email або пароль';

const emailSchema = z
  .string({ error: EMAIL_ERROR })
  .trim()
  .toLowerCase()
  .pipe(z.email({ error: EMAIL_ERROR }));

// Login: only "required", rules for a new password must not hint at anything
export const loginSchema = z.object({
  email: emailSchema,
  password: z.string({ error: PASSWORD_ERROR }).min(1, PASSWORD_ERROR),
});

// Creating a password (seed): 8–64 chars, at least 1 letter and 1 digit
export const newPasswordSchema = z
  .string({ error: PASSWORD_ERROR })
  .min(8, PASSWORD_ERROR)
  .max(64, PASSWORD_ERROR)
  .regex(/\p{L}/u, PASSWORD_ERROR)
  .regex(/\d/, PASSWORD_ERROR);

export const adminSchema = z.object({
  email: emailSchema,
  password: newPasswordSchema,
});
