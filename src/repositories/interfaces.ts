import type {
  User,
  CreateUserDto,
  Course,
  CreateCourseDto,
  CourseDetails,
  CourseRating,
  Enrollment,
  CreateEnrollmentDto,
  SubmissionGrade,
  CreateSubmissionDto,
  GradeSubmissionDto,
} from "../types/models.js";

export interface IRepository<T> {
  getById(id: number): Promise<T | null>;
  getAll(): Promise<T[]>;
}

export interface IUserRepository extends IRepository<User> {
  add(dto: CreateUserDto): Promise<number>;
  update(
    id: number,
    data: { email?: string; fullName?: string; updatedBy: number },
  ): Promise<void>;
  remove(id: number, deletedBy: number): Promise<void>;
  restore(id: number): Promise<void>;
  hasRole(userId: number, roleName: string): Promise<boolean>;
  getAvgGrade(studentId: number): Promise<number>;
}

export interface ICourseRepository extends IRepository<Course> {
  add(dto: CreateCourseDto): Promise<number>;
  update(
    id: number,
    data: {
      title?: string;
      description?: string | null;
      category?: string;
      updatedBy: number;
    },
  ): Promise<void>;
  remove(id: number, deletedBy: number): Promise<void>;
  getDetails(id: number): Promise<CourseDetails | null>;
  getRating(id: number): Promise<CourseRating | null>;
}

export interface IEnrollmentRepository {
  getByStudent(studentId: number): Promise<Enrollment[]>;
  getByCourse(courseId: number): Promise<Enrollment[]>;
  add(dto: CreateEnrollmentDto): Promise<void>;
  getProgress(studentId: number, courseId: number): Promise<number>;
}

export interface ISubmissionRepository {
  getAllGrades(): Promise<SubmissionGrade[]>;
  getByStudent(studentId: number): Promise<SubmissionGrade[]>;
  add(dto: CreateSubmissionDto): Promise<void>;
  grade(dto: GradeSubmissionDto): Promise<void>;
}
