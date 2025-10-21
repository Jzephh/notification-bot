import mongoose, { Connection } from 'mongoose';

const MONGO_URI = process.env.MONGO_URI;
const MONGO_DB = process.env.MONGO_DB;

if (!MONGO_URI) {
  throw new Error('Please define the MONGO_URI environment variable inside .env.local');
}

if (!MONGO_DB) {
  throw new Error('Please define the MONGO_DB environment variable inside .env.local');
}

let cached: { conn: Connection | null; promise: Promise<Connection> | null } =
  (global as any).mongoose || { conn: null, promise: null };

(global as any).mongoose = cached;

export default async function connectDB() {
  if (cached.conn) return cached.conn;
  if (!cached.promise) {
    cached.promise = mongoose
      .connect(MONGO_URI as string, { dbName: MONGO_DB, bufferCommands: false })
      .then((m) => m.connection);
  }
  cached.conn = await cached.promise;
  return cached.conn;
}