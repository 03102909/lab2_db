import type pg from "pg";
import type { ICourseRepository } from "./interfaces.js";
import type {
  Course,
  CreateCourseDto,
  CourseDetails,
  CourseRating,
} from "../types/models.js";

interface CourseRow {
  id: number;
  title: string;
  description: string | null;
  category: string;
  created_at: Date;
  updated_at: Date | null;
  instructor_count: string;
}

interface CourseDetailsRow {
  course_id: number;
  course_title: string;
  category: string;
  module_count: string;
  lesson_count: string;
}

interface CourseRatingRow {
  course_id: number;
  course_title: string;
  avg_rating: string;
  review_count: string;
}

export class CourseRepository implements ICourseRepository {
  constructor(private client: pg.PoolClient) {}

  async getAll(): Promise<Course[]> {
    const { rows } = await this.client.query<CourseRow>(
      "SELECT * FROM v_active_courses ORDER BY id",
    );
    return rows.map((r) => ({
      id: r.id,
      title: r.title,
      description: r.description,
      category: r.category,
      createdAt: r.created_at,
      updatedAt: r.updated_at,
      instructorCount: parseInt(r.instructor_count, 10),
    }));
  }

  async getById(id: number): Promise<Course | null> {
    const { rows } = await this.client.query<CourseRow>(
      "SELECT * FROM v_active_courses WHERE id = $1",
      [id],
    );
    const r = rows[0];
    if (!r) return null;
    return {
      id: r.id,
      title: r.title,
      description: r.description,
      category: r.category,
      createdAt: r.created_at,
      updatedAt: r.updated_at,
      instructorCount: parseInt(r.instructor_count, 10),
    };
  }

  async getDetails(id: number): Promise<CourseDetails | null> {
    const { rows } = await this.client.query<CourseDetailsRow>(
      "SELECT * FROM v_course_details WHERE course_id = $1",
      [id],
    );
    const r = rows[0];
    if (!r) return null;
    return {
      courseId: r.course_id,
      courseTitle: r.course_title,
      category: r.category,
      moduleCount: parseInt(r.module_count, 10),
      lessonCount: parseInt(r.lesson_count, 10),
    };
  }

  async getRating(id: number): Promise<CourseRating | null> {
    const { rows } = await this.client.query<CourseRatingRow>(
      "SELECT * FROM v_course_ratings WHERE course_id = $1",
      [id],
    );
    const r = rows[0];
    if (!r) return null;
    return {
      courseId: r.course_id,
      courseTitle: r.course_title,
      avgRating: parseFloat(r.avg_rating),
      reviewCount: parseInt(r.review_count, 10),
    };
  }

  async add(dto: CreateCourseDto): Promise<number> {
    const { rows } = await this.client.query<{ p_course_id: number }>(
      "CALL sp_create_course($1, $2, $3, $4, NULL)",
      [dto.title, dto.description, dto.category, dto.instructorId],
    );
    return rows[0]!.p_course_id;
  }

  async update(
    id: number,
    data: {
      title?: string;
      description?: string | null;
      category?: string;
      updatedBy: number;
    },
  ): Promise<void> {
    await this.client.query("CALL sp_update_course($1, $2, $3, $4, $5)", [
      id,
      data.title ?? null,
      data.description ?? null,
      data.category ?? null,
      data.updatedBy,
    ]);
  }

  async remove(id: number, deletedBy: number): Promise<void> {
    await this.client.query("CALL sp_soft_delete_course($1, $2)", [
      id,
      deletedBy,
    ]);
  }
}
