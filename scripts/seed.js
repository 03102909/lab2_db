import { BENCHMARK_CATEGORY, readArg } from "./config.js";

export async function getActiveCourseIds(pool, category = null) {
  if (category) {
    const res = await pool.query(
      "SELECT id FROM courses WHERE is_deleted = FALSE AND category = $1 ORDER BY id",
      [category],
    );
    return res.rows.map((r) => Number(r.id));
  }

  const res = await pool.query(
    "SELECT id FROM courses WHERE is_deleted = FALSE ORDER BY id",
  );
  return res.rows.map((r) => Number(r.id));
}

export async function seedBenchmarkData(
  pool,
  courseCount,
  modulesPerCourse,
  lessonsPerModule,
) {
  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    await client.query(
      `DELETE FROM lessons
       WHERE module_id IN (
         SELECT m.id FROM modules m
         JOIN courses c ON c.id = m.course_id
         WHERE c.category = $1
       )`,
      [BENCHMARK_CATEGORY],
    );
    await client.query(
      `DELETE FROM modules
       WHERE course_id IN (SELECT id FROM courses WHERE category = $1)`,
      [BENCHMARK_CATEGORY],
    );
    await client.query("DELETE FROM courses WHERE category = $1", [
      BENCHMARK_CATEGORY,
    ]);

    await client.query(
      `INSERT INTO courses (title, description, category)
       SELECT 'Benchmark Course ' || n,
              'Generated course for SQL vs NoSQL benchmark',
              $2
       FROM generate_series(1, $1::int) AS n`,
      [courseCount, BENCHMARK_CATEGORY],
    );

    await client.query(
      `INSERT INTO modules (course_id, title, position)
       SELECT c.id, 'Module ' || pos, pos
       FROM courses c
       CROSS JOIN generate_series(1, $1::int) AS pos
       WHERE c.category = $2`,
      [modulesPerCourse, BENCHMARK_CATEGORY],
    );

    await client.query(
      `INSERT INTO lessons (module_id, title, content, position)
       SELECT m.id, 'Lesson ' || pos, 'Lesson text content for benchmark', pos
       FROM modules m
       JOIN courses c ON c.id = m.course_id
       CROSS JOIN generate_series(1, $1::int) AS pos
       WHERE c.category = $2`,
      [lessonsPerModule, BENCHMARK_CATEGORY],
    );

    await client.query("COMMIT");
  } catch (err) {
    await client.query("ROLLBACK");
    throw err;
  } finally {
    client.release();
  }

  return {
    courses: courseCount,
    modules: courseCount * modulesPerCourse,
    lessons: courseCount * modulesPerCourse * lessonsPerModule,
  };
}

export async function runSeedOnly(pool) {
  const courses = Number(readArg("courses", "100"));
  const modules = Number(readArg("modules", "8"));
  const lessons = Number(readArg("lessons", "10"));
  const counts = await seedBenchmarkData(pool, courses, modules, lessons);
  console.log("Згенеровано в PostgreSQL:", counts);
  return counts;
}
