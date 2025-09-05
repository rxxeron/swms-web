-- Sample data for SWMS database
-- Run this after creating the main schema

-- Insert admin user (password: swmsewu2025)
INSERT INTO users (name, username, email, password_hash, role) VALUES 
('System Administrator', 'admin_swms', 'admin@swms.edu', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhxHKthjTRBxoyxLrQnEzG', 'admin')
ON CONFLICT (username) DO NOTHING;

-- Insert sample consultants
INSERT INTO users (name, username, email, password_hash, role) VALUES 
('Dr. Sarah Johnson', 'sarah_johnson', 'sarah.johnson@swms.edu', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhxHKthjTRBxoyxLrQnEzG', 'consultant'),
('Dr. Michael Chen', 'michael_chen', 'michael.chen@swms.edu', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhxHKthjTRBxoyxLrQnEzG', 'consultant'),
('Dr. Emily Rodriguez', 'emily_rodriguez', 'emily.rodriguez@swms.edu', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhxHKthjTRBxoyxLrQnEzG', 'consultant')
ON CONFLICT (username) DO NOTHING;

-- Insert sample faculty
INSERT INTO users (name, username, email, password_hash, role) VALUES 
('Prof. John Smith', 'john_smith', 'john.smith@swms.edu', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhxHKthjTRBxoyxLrQnEzG', 'faculty'),
('Prof. Lisa Davis', 'lisa_davis', 'lisa.davis@swms.edu', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhxHKthjTRBxoyxLrQnEzG', 'faculty'),
('Prof. Robert Wilson', 'robert_wilson', 'robert.wilson@swms.edu', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhxHKthjTRBxoyxLrQnEzG', 'faculty')
ON CONFLICT (username) DO NOTHING;

-- Insert sample courses
INSERT INTO courses (title, section, faculty_id) VALUES 
('Computer Science Fundamentals', 'CS101-A', (SELECT id FROM users WHERE username = 'john_smith')),
('Computer Science Fundamentals', 'CS101-B', (SELECT id FROM users WHERE username = 'john_smith')),
('Data Structures and Algorithms', 'CS201-A', (SELECT id FROM users WHERE username = 'lisa_davis')),
('Database Systems', 'CS301-A', (SELECT id FROM users WHERE username = 'robert_wilson')),
('Software Engineering', 'CS401-A', (SELECT id FROM users WHERE username = 'lisa_davis'))
ON CONFLICT (title, section) DO NOTHING;

-- Insert sample students
INSERT INTO users (name, username, email, password_hash, role, student_id) VALUES 
('Alice Johnson', 'alice_johnson', 'alice.johnson@student.swms.edu', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhxHKthjTRBxoyxLrQnEzG', 'student', 'STU001'),
('Bob Smith', 'bob_smith', 'bob.smith@student.swms.edu', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhxHKthjTRBxoyxLrQnEzG', 'student', 'STU002'),
('Carol Williams', 'carol_williams', 'carol.williams@student.swms.edu', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhxHKthjTRBxoyxLrQnEzG', 'student', 'STU003'),
('David Brown', 'david_brown', 'david.brown@student.swms.edu', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhxHKthjTRBxoyxLrQnEzG', 'student', 'STU004'),
('Eve Davis', 'eve_davis', 'eve.davis@student.swms.edu', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhxHKthjTRBxoyxLrQnEzG', 'student', 'STU005')
ON CONFLICT (username) DO NOTHING;

-- Enroll students in courses
INSERT INTO student_courses (student_id, course_id) VALUES 
-- Alice's courses
((SELECT id FROM users WHERE username = 'alice_johnson'), (SELECT id FROM courses WHERE title = 'Computer Science Fundamentals' AND section = 'CS101-A')),
((SELECT id FROM users WHERE username = 'alice_johnson'), (SELECT id FROM courses WHERE title = 'Data Structures and Algorithms' AND section = 'CS201-A')),
((SELECT id FROM users WHERE username = 'alice_johnson'), (SELECT id FROM courses WHERE title = 'Database Systems' AND section = 'CS301-A')),

-- Bob's courses
((SELECT id FROM users WHERE username = 'bob_smith'), (SELECT id FROM courses WHERE title = 'Computer Science Fundamentals' AND section = 'CS101-B')),
((SELECT id FROM users WHERE username = 'bob_smith'), (SELECT id FROM courses WHERE title = 'Data Structures and Algorithms' AND section = 'CS201-A')),
((SELECT id FROM users WHERE username = 'bob_smith'), (SELECT id FROM courses WHERE title = 'Software Engineering' AND section = 'CS401-A')),

-- Carol's courses
((SELECT id FROM users WHERE username = 'carol_williams'), (SELECT id FROM courses WHERE title = 'Computer Science Fundamentals' AND section = 'CS101-A')),
((SELECT id FROM users WHERE username = 'carol_williams'), (SELECT id FROM courses WHERE title = 'Database Systems' AND section = 'CS301-A')),
((SELECT id FROM users WHERE username = 'carol_williams'), (SELECT id FROM courses WHERE title = 'Software Engineering' AND section = 'CS401-A')),

-- David's courses
((SELECT id FROM users WHERE username = 'david_brown'), (SELECT id FROM courses WHERE title = 'Computer Science Fundamentals' AND section = 'CS101-B')),
((SELECT id FROM users WHERE username = 'david_brown'), (SELECT id FROM courses WHERE title = 'Data Structures and Algorithms' AND section = 'CS201-A')),
((SELECT id FROM users WHERE username = 'david_brown'), (SELECT id FROM courses WHERE title = 'Database Systems' AND section = 'CS301-A')),

-- Eve's courses
((SELECT id FROM users WHERE username = 'eve_davis'), (SELECT id FROM courses WHERE title = 'Computer Science Fundamentals' AND section = 'CS101-A')),
((SELECT id FROM users WHERE username = 'eve_davis'), (SELECT id FROM courses WHERE title = 'Software Engineering' AND section = 'CS401-A'))
ON CONFLICT (student_id, course_id) DO NOTHING;

-- Insert sample mood entries (last 30 days)
INSERT INTO mood_entries (student_id, mood_level, notes, entry_date) VALUES 
-- Alice's mood entries
((SELECT id FROM users WHERE username = 'alice_johnson'), 7, 'Feeling good about the new semester', CURRENT_DATE - INTERVAL '1 day'),
((SELECT id FROM users WHERE username = 'alice_johnson'), 6, 'A bit tired but manageable', CURRENT_DATE - INTERVAL '2 days'),
((SELECT id FROM users WHERE username = 'alice_johnson'), 8, 'Great day! Understood algorithms better', CURRENT_DATE - INTERVAL '3 days'),
((SELECT id FROM users WHERE username = 'alice_johnson'), 5, 'Stressed about upcoming exam', CURRENT_DATE - INTERVAL '4 days'),
((SELECT id FROM users WHERE username = 'alice_johnson'), 9, 'Ace the database quiz!', CURRENT_DATE - INTERVAL '5 days'),

-- Bob's mood entries (including some low moods)
((SELECT id FROM users WHERE username = 'bob_smith'), 3, 'Really struggling with coursework', CURRENT_DATE - INTERVAL '1 day'),
((SELECT id FROM users WHERE username = 'bob_smith'), 4, 'Getting some help from friends', CURRENT_DATE - INTERVAL '2 days'),
((SELECT id FROM users WHERE username = 'bob_smith'), 2, 'Feeling overwhelmed', CURRENT_DATE - INTERVAL '3 days'),
((SELECT id FROM users WHERE username = 'bob_smith'), 5, 'Better day today', CURRENT_DATE - INTERVAL '4 days'),
((SELECT id FROM users WHERE username = 'bob_smith'), 3, 'Still finding it difficult', CURRENT_DATE - INTERVAL '5 days'),

-- Carol's mood entries
((SELECT id FROM users WHERE username = 'carol_williams'), 6, 'Doing okay overall', CURRENT_DATE - INTERVAL '1 day'),
((SELECT id FROM users WHERE username = 'carol_williams'), 7, 'Good progress on project', CURRENT_DATE - INTERVAL '2 days'),
((SELECT id FROM users WHERE username = 'carol_williams'), 5, 'Neutral day', CURRENT_DATE - INTERVAL '3 days'),
((SELECT id FROM users WHERE username = 'carol_williams'), 8, 'Excellent presentation today', CURRENT_DATE - INTERVAL '4 days'),

-- David's mood entries
((SELECT id FROM users WHERE username = 'david_brown'), 6, 'Regular day', CURRENT_DATE - INTERVAL '1 day'),
((SELECT id FROM users WHERE username = 'david_brown'), 7, 'Enjoyed the lecture', CURRENT_DATE - INTERVAL '2 days'),
((SELECT id FROM users WHERE username = 'david_brown'), 8, 'Great group work session', CURRENT_DATE - INTERVAL '3 days'),

-- Eve's mood entries (including low mood)
((SELECT id FROM users WHERE username = 'eve_davis'), 3, 'Having trouble balancing everything', CURRENT_DATE - INTERVAL '1 day'),
((SELECT id FROM users WHERE username = 'eve_davis'), 4, 'Slightly better today', CURRENT_DATE - INTERVAL '2 days'),
((SELECT id FROM users WHERE username = 'eve_davis'), 6, 'Getting back on track', CURRENT_DATE - INTERVAL '3 days');

-- Insert sample auto-recommendations for low mood students
INSERT INTO recommendations (student_id, recommendation_type, reason, status) VALUES 
((SELECT id FROM users WHERE username = 'bob_smith'), 'auto', 'Auto-recommended due to low mood level (3/10) on ' || CURRENT_DATE - INTERVAL '1 day', 'pending'),
((SELECT id FROM users WHERE username = 'eve_davis'), 'auto', 'Auto-recommended due to low mood level (3/10) on ' || CURRENT_DATE - INTERVAL '1 day', 'pending');

-- Insert sample faculty recommendation
INSERT INTO recommendations (student_id, faculty_id, recommendation_type, reason, status) VALUES 
((SELECT id FROM users WHERE username = 'bob_smith'), (SELECT id FROM users WHERE username = 'john_smith'), 'faculty', 'Student seems to be struggling with course material and may benefit from counseling support', 'pending');

-- Insert sample appointments
INSERT INTO appointments (student_id, consultant_id, recommendation_id, appointment_date, appointment_time, status, requested_by, student_notes) VALUES 
((SELECT id FROM users WHERE username = 'alice_johnson'), (SELECT id FROM users WHERE username = 'sarah_johnson'), NULL, CURRENT_DATE + INTERVAL '3 days', '10:00', 'confirmed', 'student', 'Would like to discuss time management strategies'),
((SELECT id FROM users WHERE username = 'bob_smith'), (SELECT id FROM users WHERE username = 'michael_chen'), (SELECT id FROM recommendations WHERE student_id = (SELECT id FROM users WHERE username = 'bob_smith') AND recommendation_type = 'auto'), CURRENT_DATE + INTERVAL '2 days', '14:00', 'pending', 'consultant', NULL);

-- Update recommendation status for scheduled appointment
UPDATE recommendations 
SET status = 'scheduled', consultant_id = (SELECT id FROM users WHERE username = 'michael_chen')
WHERE student_id = (SELECT id FROM users WHERE username = 'bob_smith') AND recommendation_type = 'auto';

COMMIT;
