-- soft-delete user
CREATE OR REPLACE PROCEDURE sp_soft_delete_user(
    p_user_id    INT,
    p_deleted_by INT
)
LANGUAGE plpgsql AS $$
BEGIN
    UPDATE users
    SET is_deleted = TRUE,
        deleted_at = now(),
        deleted_by = p_deleted_by
    WHERE id = p_user_id AND is_deleted = FALSE;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'User % not found or already deleted', p_user_id;
    END IF;
END;
$$;

-- restore soft-deleted user
CREATE OR REPLACE PROCEDURE sp_restore_user(
    p_user_id INT
)
LANGUAGE plpgsql AS $$
BEGIN
    UPDATE users
    SET is_deleted = FALSE,
        deleted_at = NULL,
        deleted_by = NULL
    WHERE id = p_user_id AND is_deleted = TRUE;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'User % not found or not deleted', p_user_id;
    END IF;
END;
$$;

-- soft-delete course
CREATE OR REPLACE PROCEDURE sp_soft_delete_course(
    p_course_id  INT,
    p_deleted_by INT
)
LANGUAGE plpgsql AS $$
BEGIN
    UPDATE courses
    SET is_deleted = TRUE,
        deleted_at = now(),
        deleted_by = p_deleted_by
    WHERE id = p_course_id AND is_deleted = FALSE;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Course % not found or already deleted', p_course_id;
    END IF;

    UPDATE modules
    SET is_deleted = TRUE, deleted_at = now(), deleted_by = p_deleted_by
    WHERE course_id = p_course_id AND is_deleted = FALSE;

    UPDATE lessons
    SET is_deleted = TRUE, deleted_at = now(), deleted_by = p_deleted_by
    WHERE module_id IN (SELECT id FROM modules WHERE course_id = p_course_id)
      AND is_deleted = FALSE;
END;
$$;

-- create enrollment
CREATE OR REPLACE PROCEDURE sp_enroll_student(
    p_student_id INT,
    p_course_id  INT
)
LANGUAGE plpgsql AS $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM courses WHERE id = p_course_id AND is_deleted = FALSE) THEN
        RAISE EXCEPTION 'Course % not found or deleted', p_course_id;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM users WHERE id = p_student_id AND is_deleted = FALSE) THEN
        RAISE EXCEPTION 'Student % not found or deleted', p_student_id;
    END IF;

    INSERT INTO enrollments (student_id, course_id, status)
    VALUES (p_student_id, p_course_id, 'active');
END;
$$;

-- submit assignment answer
CREATE OR REPLACE PROCEDURE sp_submit_assignment(
    p_assignment_id INT,
    p_student_id    INT,
    p_answer_text   TEXT
)
LANGUAGE plpgsql AS $$
BEGIN
    INSERT INTO submissions (assignment_id, student_id, answer_text, status)
    VALUES (p_assignment_id, p_student_id, p_answer_text, 'submitted');
END;
$$;

-- grade a submission
CREATE OR REPLACE PROCEDURE sp_grade_submission(
    p_submission_id INT,
    p_grader_id     INT,
    p_score         DECIMAL(5,2)
)
LANGUAGE plpgsql AS $$
BEGIN
    UPDATE submissions
    SET status     = 'graded',
        updated_at = now(),
        updated_by = p_grader_id
    WHERE id = p_submission_id;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Submission % not found', p_submission_id;
    END IF;

    INSERT INTO grades (submission_id, grader_id, score)
    VALUES (p_submission_id, p_grader_id, p_score)
    ON CONFLICT (submission_id) DO UPDATE
    SET score      = EXCLUDED.score,
        grader_id  = EXCLUDED.grader_id,
        updated_at = now(),
        updated_by = p_grader_id;
END;
$$;

-- update user info
CREATE OR REPLACE PROCEDURE sp_update_user(
    p_user_id    INT,
    p_email      VARCHAR(255),
    p_full_name  VARCHAR(200),
    p_updated_by INT
)
LANGUAGE plpgsql AS $$
BEGIN
    UPDATE users
    SET email      = COALESCE(p_email, email),
        full_name  = COALESCE(p_full_name, full_name),
        updated_at = now(),
        updated_by = p_updated_by
    WHERE id = p_user_id AND is_deleted = FALSE;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'User % not found or deleted', p_user_id;
    END IF;
END;
$$;

-- create user with role
CREATE OR REPLACE PROCEDURE sp_create_user(
    p_email     VARCHAR(255),
    p_full_name VARCHAR(200),
    p_role_name VARCHAR(50),
    INOUT p_user_id INT DEFAULT NULL
)
LANGUAGE plpgsql AS $$
DECLARE
    v_role_id INT;
BEGIN
    SELECT id INTO v_role_id FROM roles WHERE name = p_role_name;
    IF v_role_id IS NULL THEN
        RAISE EXCEPTION 'Role "%" not found', p_role_name;
    END IF;

    INSERT INTO users (email, full_name)
    VALUES (p_email, p_full_name)
    RETURNING id INTO p_user_id;

    INSERT INTO user_roles (user_id, role_id)
    VALUES (p_user_id, v_role_id);
END;
$$;

-- create course with instructor
CREATE OR REPLACE PROCEDURE sp_create_course(
    p_title       VARCHAR(200),
    p_description TEXT,
    p_category    VARCHAR(100),
    p_instructor_id INT,
    INOUT p_course_id INT DEFAULT NULL
)
LANGUAGE plpgsql AS $$
BEGIN
    INSERT INTO courses (title, description, category)
    VALUES (p_title, p_description, p_category)
    RETURNING id INTO p_course_id;

    INSERT INTO course_instructors (course_id, instructor_id)
    VALUES (p_course_id, p_instructor_id);
END;
$$;

-- update course
CREATE OR REPLACE PROCEDURE sp_update_course(
    p_course_id   INT,
    p_title       VARCHAR(200),
    p_description TEXT,
    p_category    VARCHAR(100),
    p_updated_by  INT
)
LANGUAGE plpgsql AS $$
BEGIN
    UPDATE courses
    SET title       = COALESCE(p_title, title),
        description = COALESCE(p_description, description),
        category    = COALESCE(p_category, category),
        updated_at  = now(),
        updated_by  = p_updated_by
    WHERE id = p_course_id AND is_deleted = FALSE;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Course % not found or deleted', p_course_id;
    END IF;
END;
$$;
