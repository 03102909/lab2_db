import fs from "node:fs/promises";
import assert from "node:assert/strict";
import path from "node:path";
import { performance } from "node:perf_hooks";
import {
  ROOT,
  BENCHMARK_CATEGORY,
  COURSE_CONTENT_SQL,
  readArg,
} from "./config.js";
import { getActiveCourseIds, seedBenchmarkData } from "./seed.js";
import { syncMongoCourses, syncRedisCourseCache } from "./sync.js";

function getPercentile(sorted, p) {
  if (sorted.length === 0) return 0;
  const index = Math.max(0, Math.ceil(sorted.length * p) - 1);
  return sorted[index];
}

export async function measure(label, queryFn, ids, iterations) {
  const warmup = Math.min(25, iterations);
  for (let i = 0; i < warmup; i++) {
    await queryFn(ids[i % ids.length]);
  }

  const times = [];
  const startTotal = performance.now();

  for (let i = 0; i < iterations; i++) {
    const id = ids[i % ids.length];
    const t0 = performance.now();
    await queryFn(id);
    times.push(performance.now() - t0);
  }

  const totalMs = performance.now() - startTotal;
  const sorted = [...times].sort((a, b) => a - b);
  const sum = times.reduce((acc, val) => acc + val, 0);
  const avg = sum / times.length;

  return {
    engine: label,
    iterations,
    avg_ms: Number(avg.toFixed(4)),
    median_ms: Number(getPercentile(sorted, 0.5).toFixed(4)),
    p95_ms: Number(getPercentile(sorted, 0.95).toFixed(4)),
    min_ms: Number(sorted[0].toFixed(4)),
    max_ms: Number(sorted[sorted.length - 1].toFixed(4)),
    ops_per_second: Number((iterations / (totalMs / 1000)).toFixed(2)),
  };
}

export async function runBenchmark(pool, collection, redis) {
  const sizes = readArg("sizes", "50,200,500")
    .split(",")
    .map((s) => Number(s.trim()));
  const iterations = Number(readArg("iterations", "300"));
  const modulesPerCourse = Number(readArg("modules", "8"));
  const lessonsPerModule = Number(readArg("lessons", "10"));

  const sqlQuery = async (id) => {
    const res = await pool.query(COURSE_CONTENT_SQL, [id]);
    return res.rows[0]?.course ?? null;
  };

  const mongoQuery = async (id) => {
    return collection.findOne({ _id: id }, { projection: { _id: 0 } });
  };

  const redisQuery = async (id) => {
    const raw = await redis.get(`course:content:${id}`);
    return raw ? JSON.parse(raw) : null;
  };

  const allResults = [];

  for (const size of sizes) {
    console.log(`\nГенерація набору: ${size} курсів...`);
    const counts = await seedBenchmarkData(
      pool,
      size,
      modulesPerCourse,
      lessonsPerModule,
    );

    const docs = await syncMongoCourses(pool, collection);
    await syncRedisCourseCache(redis, docs);

    const ids = await getActiveCourseIds(pool, BENCHMARK_CATEGORY);

    const testId = ids[0];
    const sqlDoc = await sqlQuery(testId);
    const mongoDoc = await mongoQuery(testId);
    const redisDoc = await redisQuery(testId);

    assert.deepEqual(mongoDoc, sqlDoc, "Дані в MongoDB не збігаються з SQL");
    assert.deepEqual(redisDoc, sqlDoc, "Дані в Redis не збігаються з SQL");

    const metrics = [
      await measure("PostgreSQL (3 tables + nested JSON)", sqlQuery, ids, iterations),
      await measure("MongoDB (embedded document)", mongoQuery, ids, iterations),
      await measure("Redis (JSON cache)", redisQuery, ids, iterations),
    ];

    for (const m of metrics) {
      allResults.push({
        dataset_courses: counts.courses,
        dataset_modules: counts.modules,
        dataset_lessons: counts.lessons,
        ...m,
      });
    }

    console.table(metrics);
  }

  const jsonPath = path.join(ROOT, "benchmark-results.json");
  const csvPath = path.join(ROOT, "benchmark-results.csv");

  await fs.writeFile(
    jsonPath,
    JSON.stringify({ generated_at: new Date().toISOString(), results: allResults }, null, 2),
  );

  const headers = Object.keys(allResults[0]);
  const csvLines = [
    headers.join(","),
    ...allResults.map((row) => headers.map((h) => `"${row[h]}"`).join(",")),
  ];
  await fs.writeFile(csvPath, csvLines.join("\n") + "\n");

  console.log("\nПідсумкова таблиця:");
  console.table(
    allResults.map((r) => ({
      courses: r.dataset_courses,
      lessons: r.dataset_lessons,
      engine: r.engine,
      avg_ms: r.avg_ms,
      median_ms: r.median_ms,
      p95_ms: r.p95_ms,
      ops_per_second: r.ops_per_second,
    })),
  );
}
