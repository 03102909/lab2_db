import pg from "pg";
import { MongoClient } from "mongodb";
import { createClient } from "redis";
import { MONGO_COLLECTION } from "./config.js";

const { Pool } = pg;

export function makePool() {
  return new Pool({
    host: process.env.PGHOST || "localhost",
    port: Number(process.env.PGPORT || 5433),
    database: process.env.PGDATABASE || "course_management",
    user: process.env.PGUSER || "admin",
    password: process.env.PGPASSWORD || "secret123",
  });
}

export function makeMongoClient() {
  const uri = process.env.MONGODB_URI || "mongodb://localhost:27017";
  return new MongoClient(uri);
}

export function makeRedisClient() {
  const url = process.env.REDIS_URL || "redis://localhost:6379";
  const client = createClient({ url });
  client.on("error", (err) => console.error("Redis error:", err.message));
  return client;
}

export async function connectMongo(client) {
  await client.connect();
  const dbName = process.env.MONGODB_DATABASE || "course_management";
  return client.db(dbName).collection(MONGO_COLLECTION);
}

export async function connectRedis(client) {
  if (!client.isOpen) {
    await client.connect();
  }
  return client;
}
