import type { PoolClient } from "pg";
import pool from "./db.js";
import { UserRepository } from "./repositories/user.repository.js";
import { CourseRepository } from "./repositories/course.repository.js";
import { EnrollmentRepository } from "./repositories/enrollment.repository.js";
import { SubmissionRepository } from "./repositories/submission.repository.js";

export class UnitOfWork {
  private client: PoolClient | null = null;
  public users!: UserRepository;
  public courses!: CourseRepository;
  public enrollments!: EnrollmentRepository;
  public submissions!: SubmissionRepository;

  async begin(): Promise<void> {
    this.client = await pool.connect();
    await this.client.query("BEGIN");
    this.users = new UserRepository(this.client);
    this.courses = new CourseRepository(this.client);
    this.enrollments = new EnrollmentRepository(this.client);
    this.submissions = new SubmissionRepository(this.client);
  }

  async commit(): Promise<void> {
    if (!this.client) throw new Error("No transaction active");
    await this.client.query("COMMIT");
    this.client.release();
    this.client = null;
  }

  async rollback(): Promise<void> {
    if (!this.client) return;
    await this.client.query("ROLLBACK");
    this.client.release();
    this.client = null;
  }
}
