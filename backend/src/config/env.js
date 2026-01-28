import 'dotenv/config';
import { z } from 'zod';

const schema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().int().min(1).max(65535).default(3000),
  MONGO_URI: z.string().min(1),
  LOG_LEVEL: z.enum(['fatal', 'error', 'warn', 'info', 'debug', 'trace']).default('info'),
  CORS_ORIGINS: z.string().default(''),
  JWT_SECRET: z.string().min(20),
  JWT_EXPIRES_IN: z.string().default("30d"),
  APP_BASE_URL: z.string().default("http://localhost:3000"),
  EMAIL_MODE: z.enum(["log", "smtp"]).default("log"),
});

const parsed = schema.safeParse(process.env);
if (!parsed.success) {
  console.error('❌ Invalid environment variables:', parsed.error.flatten().fieldErrors);
  process.exit(1);
}

export const env = {
  ...parsed.data,
  CORS_ORIGINS: parsed.data.CORS_ORIGINS
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean)
};
