-- get student progress % for a course
CREATE OR REPLACE FUNCTION fn_student_course_progress(
    p_student_id INT,
    p_course_id  INT
) RETURNS DECIMAL(5,2)
LANGUAGE plpgsql STABLE AS $$
DECLARE
    total_lessons   INT;
    done_lessons    INT;
BEGIN
    SELECT COUNT(l.id) INTO total_lessons
    FROM lessons l
    JOIN modules m ON m.id = l.module_id AND m.is_deleted = FALSE
    WHERE m.course_id = p_course_id AND l.is_deleted = FALSE;

    IF total_lessons = 0 THEN RETURN 0; END IF;

    SELECT COUNT(lp.id) INTO done_lessons
    FROM lesson_progress lp
    JOIN enrollments e ON e.id = lp.enrollment_id
    WHERE e.student_id = p_student_id
      AND e.course_id  = p_course_id
      AND lp.is_completed = TRUE;

    RETURN ROUND((done_lessons::DECIMAL / total_lessons) * 100, 2);
END;
$$;

-- get average grade for a student
CREATE OR REPLACE FUNCTION fn_student_avg_grade(
    p_student_id INT
) RETURNS DECIMAL(5,2)
LANGUAGE plpgsql STABLE AS $$
DECLARE
    avg_score DECIMAL(5,2);
BEGIN
    SELECT AVG(g.score) INTO avg_score
    FROM grades g
    JOIN submissions s ON s.id = g.submission_id
    WHERE s.student_id = p_student_id;

    RETURN COALESCE(avg_score, 0);
END;
$$;

-- check if user has role
CREATE OR REPLACE FUNCTION fn_user_has_role(
    p_user_id   INT,
    p_role_name VARCHAR(50)
) RETURNS BOOLEAN
LANGUAGE plpgsql STABLE AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1
        FROM user_roles ur
        JOIN roles r ON r.id = ur.role_id
        WHERE ur.user_id = p_user_id AND r.name = p_role_name
    );
END;
$$;
