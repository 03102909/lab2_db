import { BENCHMARK_CATEGORY } from "./config.js";

export async function runRedisDemo(pool, redis) {
  const result = await pool.query(
    "SELECT id, title FROM courses WHERE is_deleted = FALSE AND category <> $1 ORDER BY id LIMIT 1",
    [BENCHMARK_CATEGORY],
  );

  if (result.rowCount === 0) {
    throw new Error("Немає курсів у PostgreSQL для демонстрації Redis.");
  }

  const course = result.rows[0];
  const viewsKey = `course:views:${course.id}`;

  for (let i = 0; i < 10; i++) {
    await redis.incr(viewsKey);
    await redis.zIncrBy("courses:popular", 1, String(course.id));
  }

  await redis.expire(viewsKey, 86400);

  const views = await redis.get(viewsKey);
  const ttl = await redis.ttl(viewsKey);
  const popular = await redis.zRangeWithScores("courses:popular", 0, 4, {
    REV: true,
  });

  console.log(`Курс "${course.title}" (id=${course.id}): ${views} переглядів (TTL: ${ttl} с)`);
  console.log("Топ популярних курсів:", popular);

  return { course, views, popular };
}
