import mongoose from 'mongoose';
import { env } from './env.js';

let connecting = null;

export async function connectDb() {
  if (mongoose.connection.readyState === 1) return mongoose.connection;
  if (connecting) return connecting;
  const uri = env('MONGODB_URI', 'mongodb://127.0.0.1:27017/samity_cms');
  mongoose.set('strictQuery', true);
  connecting = mongoose.connect(uri).then(() => {
    connecting = null;
    return mongoose.connection;
  });
  return connecting;
}
