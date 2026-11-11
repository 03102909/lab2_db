import "dotenv/config";
import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
export const ROOT = path.resolve(__dirname, "..");

export const COURSE_CONTENT_SQL = await fs.readFile(
  path.join(ROOT, "src/nosql/course-content.sql"),
  "utf8",
);

export const BENCHMARK_CATEGORY = "NoSQL Benchmark";
export const MONGO_COLLECTION = "course_content";

export function readArg(name, fallback) {
  const prefix = `--${name}=`;
  const found = process.argv.find((arg) => arg.startsWith(prefix));
  return found ? found.slice(prefix.length) : fallback;
}
