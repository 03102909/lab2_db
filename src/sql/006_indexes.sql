-- b-tree indexes
CREATE INDEX idx_users_email          ON users (email)       WHERE is_deleted = FALSE;
CREATE INDEX idx_courses_category     ON courses (category)  WHERE is_deleted = FALSE;
CREATE INDEX idx_enrollments_student  ON enrollments (student_id);
CREATE INDEX idx_enrollments_course   ON enrollments (course_id);
CREATE INDEX idx_submissions_student  ON submissions (student_id);
CREATE INDEX idx_grades_submission    ON grades (submission_id);
CREATE INDEX idx_lessons_module       ON lessons (module_id)  WHERE is_deleted = FALSE;
CREATE INDEX idx_modules_course       ON modules (course_id)  WHERE is_deleted = FALSE;

-- gin indexes
CREATE INDEX idx_courses_title_gin    ON courses  USING GIN (to_tsvector('english', title));
CREATE INDEX idx_lessons_content_gin  ON lessons  USING GIN (to_tsvector('english', COALESCE(content, '')));
