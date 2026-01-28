import { z } from 'zod';

export const createUserSchema = z.object({
  body: z.object({
    email: z.string().email(),
    name: z.string().min(2).max(80)
  }),
  params: z.object({}).optional(),
  query: z.object({}).optional()
});
