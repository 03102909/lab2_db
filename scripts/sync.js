import { COURSE_CONTENT_SQL } from "./config.js";

export async function syncMongoCourses(pool, collection) {
  const sql = COURSE_CONTENT_SQL.replace(
    "WHERE c.id = $1 AND c.is_deleted = FALSE;",
    "WHERE c.is_deleted = FALSE ORDER BY c.id;",
  );

  const result = await pool.query(sql);
  const documents = result.rows.map((row) => row.course);

  await collection.deleteMany({});
  if (documents.length > 0) {
    const docsWithId = documents.map((doc) => ({ _id: doc.id, ...doc }));
    await collection.insertMany(docsWithId);
  }
  await collection.createIndex({ category: 1 });

  return documents;
}

export async function syncRedisCourseCache(redis, documents) {
  if (documents.length === 0) return;

  const multi = redis.multi();
  for (const doc of documents) {
    multi.set(`course:content:${doc.id}`, JSON.stringify(doc), { EX: 3600 });
  }
  await multi.exec();
}
