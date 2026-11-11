import { test, describe, after } from "node:test";
import assert from "node:assert/strict";
import "dotenv/config";
import pool from "../src/db.js";
import { UnitOfWork } from "../src/unit-of-work.js";
import { CourseManagementService } from "../src/services/course-management.service.js";

describe("Repository + Unit of Work", () => {
  const service = new CourseManagementService();

  after(async () => {
    await pool.end();
  });

  test("commit transaction", async () => {
    const ts = Date.now();

    const result = await service.createCourseAndEnrollStudents(
      `Database Systems ${ts}`,
      "PostgreSQL architecture and indexing",
      "Computer Science",
      2,
      [
        { email: `student_a_${ts}@test.com`, fullName: "Student Alpha" },
        { email: `student_b_${ts}@test.com`, fullName: "Student Beta" },
      ],
    );

    assert.ok(result.courseId > 0);
    assert.strictEqual(result.enrolledUserIds.length, 2);

    const analytics = await service.getCourseAnalytics(result.courseId);
    assert.strictEqual(analytics.enrollmentCount, 2);
    assert.strictEqual(analytics.course?.title, `Database Systems ${ts}`);
  });

  test("rollback transaction on error", async () => {
    const ts = Date.now();
    const uow = new UnitOfWork();
    await uow.begin();

    let courseId: number | null = null;
    try {
      courseId = await uow.courses.add({
        title: `Rollback Course ${ts}`,
        description: "Should never persist in DB",
        category: "Testing",
        instructorId: 2,
      });

      await uow.enrollments.add({ studentId: 9999999, courseId });

      await uow.commit();
      assert.fail("Expected exception from sp_enroll_student");
    } catch (err) {
      await uow.rollback();
      assert.match((err as Error).message, /Student 9999999 not found/);
    }

    if (courseId) {
      const checkUow = new UnitOfWork();
      await checkUow.begin();
      const course = await checkUow.courses.getById(courseId);
      await checkUow.commit();
      assert.strictEqual(course, null, "Course was rolled back");
    }
  });
});
