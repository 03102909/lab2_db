-- auto-set updated_at on users update
CREATE OR REPLACE FUNCTION trg_users_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql AS $$
BEGIN
    IF NEW.is_deleted = OLD.is_deleted THEN
        NEW.updated_at = now();
    END IF;
    RETURN NEW;
END;
$$;

CREATE TRIGGER tr_users_updated_at
    BEFORE UPDATE ON users
    FOR EACH ROW
    WHEN (OLD.is_deleted = FALSE)
    EXECUTE FUNCTION trg_users_updated_at();

-- auto-set updated_at on courses update
CREATE OR REPLACE FUNCTION trg_courses_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql AS $$
BEGIN
    IF NEW.is_deleted = OLD.is_deleted THEN
        NEW.updated_at = now();
    END IF;
    RETURN NEW;
END;
$$;

CREATE TRIGGER tr_courses_updated_at
    BEFORE UPDATE ON courses
    FOR EACH ROW
    WHEN (OLD.is_deleted = FALSE)
    EXECUTE FUNCTION trg_courses_updated_at();

-- auto-set updated_at on lessons update
CREATE OR REPLACE FUNCTION trg_lessons_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql AS $$
BEGIN
    IF NEW.is_deleted = OLD.is_deleted THEN
        NEW.updated_at = now();
    END IF;
    RETURN NEW;
END;
$$;

CREATE TRIGGER tr_lessons_updated_at
    BEFORE UPDATE ON lessons
    FOR EACH ROW
    WHEN (OLD.is_deleted = FALSE)
    EXECUTE FUNCTION trg_lessons_updated_at();

-- prevent deleting user with active enrollments
CREATE OR REPLACE FUNCTION trg_prevent_delete_enrolled_user()
RETURNS TRIGGER
LANGUAGE plpgsql AS $$
BEGIN
    IF NEW.is_deleted = TRUE AND OLD.is_deleted = FALSE THEN
        IF EXISTS (
            SELECT 1 FROM enrollments
            WHERE student_id = NEW.id AND status = 'active'
        ) THEN
            RAISE EXCEPTION 'Cannot delete user % — has active enrollments', NEW.id;
        END IF;
    END IF;
    RETURN NEW;
END;
$$;

CREATE TRIGGER tr_prevent_delete_enrolled_user
    BEFORE UPDATE ON users
    FOR EACH ROW
    EXECUTE FUNCTION trg_prevent_delete_enrolled_user();

-- auto-set completed_at when lesson progress marked complete
CREATE OR REPLACE FUNCTION trg_progress_completed_at()
RETURNS TRIGGER
LANGUAGE plpgsql AS $$
BEGIN
    IF NEW.is_completed = TRUE AND (OLD IS NULL OR OLD.is_completed = FALSE) THEN
        NEW.completed_at = now();
    END IF;
    RETURN NEW;
END;
$$;

CREATE TRIGGER tr_progress_completed_at
    BEFORE INSERT OR UPDATE ON lesson_progress
    FOR EACH ROW
    EXECUTE FUNCTION trg_progress_completed_at();
