import mongoose from 'mongoose';
import { env } from './env.js';
import { logger } from '../logger/index.js';

export async function connectDb() {
  mongoose.set('strictQuery', true);

  await mongoose.connect(env.MONGO_URI, {
    autoIndex: env.NODE_ENV !== 'production'
  });

  logger.info({ mongo: 'connected', uri: maskMongoUri(env.MONGO_URI) }, 'MongoDB connected');
}

function maskMongoUri(uri) {
  return uri.replace(/\/\/(.*)@/, '//***@');
}
