SELECT jsonb_build_object(
    'id', c.id,
    'title', c.title,
    'description', c.description,
    'category', c.category,
    'modules', COALESCE((
        SELECT jsonb_agg(
            jsonb_build_object(
                'id', m.id,
                'title', m.title,
                'position', m.position,
                'lessons', COALESCE((
                    SELECT jsonb_agg(
                        jsonb_build_object(
                            'id', l.id,
                            'title', l.title,
                            'content', l.content,
                            'position', l.position
                        ) ORDER BY l.position
                    )
                    FROM lessons l
                    WHERE l.module_id = m.id AND l.is_deleted = FALSE
                ), '[]'::jsonb)
            ) ORDER BY m.position
        )
        FROM modules m
        WHERE m.course_id = c.id AND m.is_deleted = FALSE
    ), '[]'::jsonb)
) AS course
FROM courses c
WHERE c.id = $1 AND c.is_deleted = FALSE;
