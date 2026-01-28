import pino from 'pino';
import { env } from '../config/env.js';

const isDev = env.NODE_ENV === 'development';

export const logger = pino({
  level: env.LOG_LEVEL,
  redact: {
    paths: ['req.headers.authorization', 'req.headers.cookie'],
    remove: true
  },
  transport: isDev
    ? {
        target: 'pino-pretty',
        options: { translateTime: 'SYS:standard', singleLine: true }
      }
    : undefined
});
