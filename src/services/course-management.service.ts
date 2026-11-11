import { UnitOfWork } from "../unit-of-work.js";

export class CourseManagementService {
  async createCourseAndEnrollStudents(
    title: string,
    description: string,
    category: string,
    instructorId: number,
    studentEmails: { email: string; fullName: string }[],
  ) {
    const uow = new UnitOfWork();
    await uow.begin();

    try {
      const isInstructor = await uow.users.hasRole(instructorId, "instructor");
      if (!isInstructor) {
        throw new Error(`User ${instructorId} is not an instructor`);
      }

      const courseId = await uow.courses.add({
        title,
        description,
        category,
        instructorId,
      });

      const enrolledUserIds: number[] = [];
      for (const s of studentEmails) {
        const studentId = await uow.users.add({
          email: s.email,
          fullName: s.fullName,
          role: "student",
        });
        await uow.enrollments.add({ studentId, courseId });
        enrolledUserIds.push(studentId);
      }

      await uow.commit();
      return { courseId, enrolledUserIds };
    } catch (err) {
      await uow.rollback();
      throw err;
    }
  }

  async submitAndGradeAssignment(
    assignmentId: number,
    studentId: number,
    answer: string,
    graderId: number,
    score: number,
  ) {
    const uow = new UnitOfWork();
    await uow.begin();

    try {
      await uow.submissions.add({
        assignmentId,
        studentId,
        answerText: answer,
      });

      const studentGrades = await uow.submissions.getByStudent(studentId);
      const latestSub = studentGrades[0];
      if (!latestSub) throw new Error("Submission not found");

      await uow.submissions.grade({
        submissionId: latestSub.submissionId,
        graderId,
        score,
      });

      await uow.commit();
      return { submissionId: latestSub.submissionId, score };
    } catch (err) {
      await uow.rollback();
      throw err;
    }
  }

  async getCourseAnalytics(courseId: number) {
    const uow = new UnitOfWork();
    await uow.begin();

    try {
      const course = await uow.courses.getById(courseId);
      const details = await uow.courses.getDetails(courseId);
      const rating = await uow.courses.getRating(courseId);
      const enrollments = await uow.enrollments.getByCourse(courseId);

      await uow.commit();
      return {
        course,
        details,
        rating,
        enrollmentCount: enrollments.length,
        enrollments,
      };
    } catch (err) {
      await uow.rollback();
      throw err;
    }
  }

  async failingTransactionDemonstration(instructorId: number) {
    const uow = new UnitOfWork();
    await uow.begin();

    try {
      const courseId = await uow.courses.add({
        title: "Course That Will Fail",
        description: "Should be rolled back",
        category: "Testing",
        instructorId,
      });

      await uow.enrollments.add({ studentId: 999999, courseId });

      await uow.commit();
    } catch (err) {
      await uow.rollback();
      return {
        status: "rolled_back_successfully",
        reason: (err as Error).message,
      };
    }
  }
}
