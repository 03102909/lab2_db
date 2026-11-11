-- active users (exclude soft-deleted)
CREATE OR REPLACE VIEW v_active_users AS
SELECT id, email, full_name, created_at, updated_at, updated_by
FROM users
WHERE is_deleted = FALSE;

-- active courses with instructor count
CREATE OR REPLACE VIEW v_active_courses AS
SELECT
    c.id,
    c.title,
    c.description,
    c.category,
    c.created_at,
    c.updated_at,
    COUNT(ci.instructor_id) AS instructor_count
FROM courses c
LEFT JOIN course_instructors ci ON ci.course_id = c.id
WHERE c.is_deleted = FALSE
GROUP BY c.id;

-- course details - modules + lessons count
CREATE OR REPLACE VIEW v_course_details AS
SELECT
    c.id           AS course_id,
    c.title        AS course_title,
    c.category,
    COUNT(DISTINCT m.id) AS module_count,
    COUNT(DISTINCT l.id) AS lesson_count
FROM courses c
LEFT JOIN modules m ON m.course_id = c.id AND m.is_deleted = FALSE
LEFT JOIN lessons l ON l.module_id = m.id AND l.is_deleted = FALSE
WHERE c.is_deleted = FALSE
GROUP BY c.id;

-- student enrollment overview
CREATE OR REPLACE VIEW v_student_enrollments AS
SELECT
    u.id           AS student_id,
    u.full_name    AS student_name,
    c.id           AS course_id,
    c.title        AS course_title,
    e.status,
    e.enrolled_at
FROM enrollments e
JOIN users u   ON u.id = e.student_id AND u.is_deleted = FALSE
JOIN courses c ON c.id = e.course_id AND c.is_deleted = FALSE;

-- submission grades overview
CREATE OR REPLACE VIEW v_submission_grades AS
SELECT
    s.id           AS submission_id,
    a.title        AS assignment_title,
    u.full_name    AS student_name,
    s.status,
    s.submitted_at,
    g.score,
    g.grader_id
FROM submissions s
JOIN assignments a ON a.id = s.assignment_id
JOIN users u       ON u.id = s.student_id AND u.is_deleted = FALSE
LEFT JOIN grades g ON g.submission_id = s.id;

-- course average rating
CREATE OR REPLACE VIEW v_course_ratings AS
SELECT
    c.id           AS course_id,
    c.title        AS course_title,
    COALESCE(AVG(r.rating), 0) AS avg_rating,
    COUNT(r.id)    AS review_count
FROM courses c
LEFT JOIN reviews r ON r.course_id = c.id
WHERE c.is_deleted = FALSE
GROUP BY c.id;
