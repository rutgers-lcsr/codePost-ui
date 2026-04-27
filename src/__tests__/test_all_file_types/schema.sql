-- Sample SQL file — student grades schema and queries

CREATE TABLE students (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    net_id      TEXT    NOT NULL UNIQUE,
    first_name  TEXT    NOT NULL,
    last_name   TEXT    NOT NULL,
    email       TEXT    NOT NULL,
    enrolled_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE assignments (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    title       TEXT    NOT NULL,
    max_points  INTEGER NOT NULL DEFAULT 100,
    due_date    TIMESTAMP NOT NULL,
    weight      REAL    NOT NULL DEFAULT 1.0
);

CREATE TABLE submissions (
    id            INTEGER PRIMARY KEY AUTOINCREMENT,
    student_id    INTEGER NOT NULL REFERENCES students(id),
    assignment_id INTEGER NOT NULL REFERENCES assignments(id),
    submitted_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    points_earned INTEGER,
    graded        BOOLEAN DEFAULT FALSE,
    UNIQUE(student_id, assignment_id)
);

-- Insert sample data
INSERT INTO assignments (title, max_points, due_date, weight) VALUES
    ('HW1: Intro', 50, '2026-09-15', 0.1),
    ('HW2: Lists', 100, '2026-10-01', 0.15),
    ('HW3: BST', 100, '2026-10-15', 0.15),
    ('Midterm', 200, '2026-10-22', 0.25),
    ('Final', 300, '2026-12-15', 0.35);

-- Calculate weighted averages
SELECT
    s.net_id,
    s.first_name || ' ' || s.last_name AS full_name,
    ROUND(
        SUM(sub.points_earned * 1.0 / a.max_points * a.weight) /
        SUM(a.weight) * 100,
        1
    ) AS weighted_average,
    CASE
        WHEN SUM(sub.points_earned * 1.0 / a.max_points * a.weight) / SUM(a.weight) * 100 >= 90 THEN 'A'
        WHEN SUM(sub.points_earned * 1.0 / a.max_points * a.weight) / SUM(a.weight) * 100 >= 80 THEN 'B'
        WHEN SUM(sub.points_earned * 1.0 / a.max_points * a.weight) / SUM(a.weight) * 100 >= 70 THEN 'C'
        WHEN SUM(sub.points_earned * 1.0 / a.max_points * a.weight) / SUM(a.weight) * 100 >= 60 THEN 'D'
        ELSE 'F'
    END AS letter_grade
FROM students s
JOIN submissions sub ON s.id = sub.student_id
JOIN assignments a ON sub.assignment_id = a.id
WHERE sub.graded = TRUE
GROUP BY s.id
ORDER BY weighted_average DESC;
