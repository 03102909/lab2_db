INSERT INTO roles (name) VALUES ('admin'), ('instructor'), ('student');

INSERT INTO users (email, full_name) VALUES
    ('admin@example.com',    'System Admin'),
    ('prof.smith@example.com', 'Prof. Smith'),
    ('prof.jones@example.com', 'Prof. Jones'),
    ('alice@example.com',    'Alice Student'),
    ('bob@example.com',      'Bob Student'),
    ('carol@example.com',    'Carol Student');

INSERT INTO user_roles (user_id, role_id) VALUES
    (1, 1), 
    (2, 2), 
    (3, 2), 
    (4, 3), 
    (5, 3), 
    (6, 3);

INSERT INTO courses (title, description, category) VALUES
    ('Introduction to Databases',    'Learn SQL and relational DB fundamentals', 'Computer Science'),
    ('Web Development Bootcamp',     'Full-stack web development',              'Computer Science'),
    ('Linear Algebra',               'Vectors, matrices, transformations',       'Mathematics');

INSERT INTO course_instructors (course_id, instructor_id) VALUES
    (1, 2), (2, 2), (3, 3);

INSERT INTO modules (course_id, title, position) VALUES
    (1, 'SQL Basics',        1),
    (1, 'Advanced SQL',      2),
    (2, 'HTML & CSS',        1),
    (2, 'JavaScript',        2),
    (3, 'Vectors',           1);

INSERT INTO lessons (module_id, title, content, position) VALUES
    (1, 'SELECT Statements',  'Learn how to query data with SELECT',  1),
    (1, 'INSERT & UPDATE',    'Modifying data in tables',             2),
    (2, 'JOINs',              'Combining data from multiple tables',  1),
    (2, 'Subqueries',         'Nested queries and CTEs',              2),
    (3, 'Box Model',          'Understanding CSS box model',          1),
    (4, 'DOM Manipulation',   'Working with the DOM API',             1),
    (5, 'Vector Operations',  'Addition, subtraction, dot product',   1);

INSERT INTO enrollments (student_id, course_id) VALUES
    (4, 1), (4, 2),
    (5, 1), (5, 3),
    (6, 2);

INSERT INTO lesson_progress (enrollment_id, lesson_id, is_completed) VALUES
    (1, 1, TRUE),
    (1, 2, TRUE),
    (1, 3, FALSE),
    (2, 5, TRUE),
    (3, 1, TRUE);

INSERT INTO assignments (lesson_id, title, max_score) VALUES
    (1, 'Write SELECT queries', 100),
    (3, 'Practice JOINs',       100),
    (5, 'CSS Layout Challenge',  50);

INSERT INTO submissions (assignment_id, student_id, answer_text, status) VALUES
    (1, 4, 'SELECT * FROM users WHERE ...', 'submitted'),
    (1, 5, 'SELECT id, name FROM users;',   'submitted'),
    (2, 4, 'SELECT u.name, o.total FROM ...', 'submitted');

INSERT INTO grades (submission_id, grader_id, score) VALUES
    (2, 2, 85.00);

UPDATE submissions SET status = 'graded', updated_at = now(), updated_by = 2 WHERE id = 2;

INSERT INTO quizzes (lesson_id, title, pass_score) VALUES
    (1, 'SQL Basics Quiz', 70);

INSERT INTO quiz_questions (quiz_id, question_text) VALUES
    (1, 'What does SELECT do?'),
    (1, 'Which clause filters rows?');

INSERT INTO answer_options (question_id, option_text, is_correct) VALUES
    (1, 'Retrieves data from tables', TRUE),
    (1, 'Deletes data',               FALSE),
    (2, 'WHERE',                       TRUE),
    (2, 'ORDER BY',                    FALSE);

INSERT INTO reviews (course_id, student_id, rating, comment) VALUES
    (1, 4, 5, 'Excellent course!'),
    (1, 5, 4, 'Very informative');
