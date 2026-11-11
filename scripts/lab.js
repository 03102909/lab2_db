import "dotenv/config";
import {
  makePool,
  makeMongoClient,
  makeRedisClient,
  connectMongo,
  connectRedis,
} from "./clients.js";
import { runSeedOnly } from "./seed.js";
import { syncMongoCourses, syncRedisCourseCache } from "./sync.js";
import { runRedisDemo } from "./redis-demo.js";
import { runBenchmark } from "./benchmark.js";

async function main() {
  const command = process.argv[2] || "help";
  const pool = makePool();
  let mongo;
  let redis;

  try {
    if (command === "seed") {
      await runSeedOnly(pool);
      return;
    }

    if (command === "sync") {
      mongo = makeMongoClient();
      redis = makeRedisClient();
      const collection = await connectMongo(mongo);
      await connectRedis(redis);

      const docs = await syncMongoCourses(pool, collection);
      await syncRedisCourseCache(redis, docs);
      console.log(`Синхронізовано ${docs.length} курсів у MongoDB та Redis.`);
      return;
    }

    if (command === "redis") {
      redis = makeRedisClient();
      await connectRedis(redis);
      await runRedisDemo(pool, redis);
      return;
    }

    if (command === "benchmark" || command === "all") {
      mongo = makeMongoClient();
      redis = makeRedisClient();
      const collection = await connectMongo(mongo);
      await connectRedis(redis);

      if (command === "all") {
        await runRedisDemo(pool, redis);
      }
      await runBenchmark(pool, collection, redis);
      return;
    }

    console.log("Доступні команди:");
    console.log("  npm run lab:seed");
    console.log("  npm run lab:sync");
    console.log("  npm run lab:redis");
    console.log("  npm run lab:benchmark");
    console.log("  npm run lab:all");
  } finally {
    await pool.end();
    if (mongo) await mongo.close();
    if (redis?.isOpen) await redis.quit();
  }
}

main().catch((err) => {
  console.error("Помилка:", err);
  process.exit(1);
});

