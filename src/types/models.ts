export interface User {
  id: number;
  email: string;
  fullName: string;
  createdAt: Date;
  updatedAt: Date | null;
  updatedBy: number | null;
}

export interface CreateUserDto {
  email: string;
  fullName: string;
  role: string;
}

export interface Course {
  id: number;
  title: string;
  description: string | null;
  category: string;
  createdAt: Date;
  updatedAt: Date | null;
  instructorCount?: number;
}

export interface CreateCourseDto {
  title: string;
  description: string | null;
  category: string;
  instructorId: number;
}

export interface CourseDetails {
  courseId: number;
  courseTitle: string;
  category: string;
  moduleCount: number;
  lessonCount: number;
}

export interface CourseRating {
  courseId: number;
  courseTitle: string;
  avgRating: number;
  reviewCount: number;
}

export interface Enrollment {
  studentId: number;
  studentName: string;
  courseId: number;
  courseTitle: string;
  status: string;
  enrolledAt: Date;
}

export interface CreateEnrollmentDto {
  studentId: number;
  courseId: number;
}

export interface SubmissionGrade {
  submissionId: number;
  assignmentTitle: string;
  studentName: string;
  status: string;
  submittedAt: Date;
  score: number | null;
  graderId: number | null;
}

export interface CreateSubmissionDto {
  assignmentId: number;
  studentId: number;
  answerText: string;
}

export interface GradeSubmissionDto {
  submissionId: number;
  graderId: number;
  score: number;
}
