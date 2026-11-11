import type pg from "pg";
import type { ISubmissionRepository } from "./interfaces.js";
import type {
  SubmissionGrade,
  CreateSubmissionDto,
  GradeSubmissionDto,
} from "../types/models.js";

interface SubmissionGradeRow {
  submission_id: number;
  assignment_title: string;
  student_name: string;
  status: string;
  submitted_at: Date;
  score: string | null;
  grader_id: number | null;
}

export class SubmissionRepository implements ISubmissionRepository {
  constructor(private client: pg.PoolClient) {}

  async getAllGrades(): Promise<SubmissionGrade[]> {
    const { rows } = await this.client.query<SubmissionGradeRow>(
      "SELECT * FROM v_submission_grades ORDER BY submitted_at DESC",
    );
    return rows.map((r) => ({
      submissionId: r.submission_id,
      assignmentTitle: r.assignment_title,
      studentName: r.student_name,
      status: r.status,
      submittedAt: r.submitted_at,
      score: r.score !== null ? parseFloat(r.score) : null,
      graderId: r.grader_id,
    }));
  }

  async getByStudent(studentId: number): Promise<SubmissionGrade[]> {
    const { rows } = await this.client.query<SubmissionGradeRow>(
      `SELECT * FROM v_submission_grades
       WHERE student_name = (SELECT full_name FROM users WHERE id = $1)
       ORDER BY submitted_at DESC`,
      [studentId],
    );
    return rows.map((r) => ({
      submissionId: r.submission_id,
      assignmentTitle: r.assignment_title,
      studentName: r.student_name,
      status: r.status,
      submittedAt: r.submitted_at,
      score: r.score !== null ? parseFloat(r.score) : null,
      graderId: r.grader_id,
    }));
  }

  async add(dto: CreateSubmissionDto): Promise<void> {
    await this.client.query("CALL sp_submit_assignment($1, $2, $3)", [
      dto.assignmentId,
      dto.studentId,
      dto.answerText,
    ]);
  }

  async grade(dto: GradeSubmissionDto): Promise<void> {
    await this.client.query("CALL sp_grade_submission($1, $2, $3)", [
      dto.submissionId,
      dto.graderId,
      dto.score,
    ]);
  }
}
