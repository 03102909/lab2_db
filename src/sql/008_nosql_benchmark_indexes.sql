CREATE INDEX IF NOT EXISTS idx_courses_active_category_id
    ON courses (category, id) WHERE is_deleted = FALSE;
