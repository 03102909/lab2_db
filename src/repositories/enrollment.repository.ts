import type pg from "pg";
import type { IEnrollmentRepository } from "./interfaces.js";
import type { Enrollment, CreateEnrollmentDto } from "../types/models.js";

interface EnrollmentRow {
  student_id: number;
  student_name: string;
  course_id: number;
  course_title: string;
  status: string;
  enrolled_at: Date;
}

export class EnrollmentRepository implements IEnrollmentRepository {
  constructor(private client: pg.PoolClient) {}

  async getByStudent(studentId: number): Promise<Enrollment[]> {
    const { rows } = await this.client.query<EnrollmentRow>(
      "SELECT * FROM v_student_enrollments WHERE student_id = $1 ORDER BY enrolled_at DESC",
      [studentId],
    );
    return rows.map((r) => ({
      studentId: r.student_id,
      studentName: r.student_name,
      courseId: r.course_id,
      courseTitle: r.course_title,
      status: r.status,
      enrolledAt: r.enrolled_at,
    }));
  }

  async getByCourse(courseId: number): Promise<Enrollment[]> {
    const { rows } = await this.client.query<EnrollmentRow>(
      "SELECT * FROM v_student_enrollments WHERE course_id = $1 ORDER BY enrolled_at DESC",
      [courseId],
    );
    return rows.map((r) => ({
      studentId: r.student_id,
      studentName: r.student_name,
      courseId: r.course_id,
      courseTitle: r.course_title,
      status: r.status,
      enrolledAt: r.enrolled_at,
    }));
  }

  async add(dto: CreateEnrollmentDto): Promise<void> {
    await this.client.query("CALL sp_enroll_student($1, $2)", [
      dto.studentId,
      dto.courseId,
    ]);
  }

  async getProgress(studentId: number, courseId: number): Promise<number> {
    const { rows } = await this.client.query<{ progress: string }>(
      "SELECT fn_student_course_progress($1, $2) AS progress",
      [studentId, courseId],
    );
    return parseFloat(rows[0]!.progress);
  }
}
