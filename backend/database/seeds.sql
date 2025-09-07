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
('Prof. Robert Wilson', 'robert_wilson', 'robert.wilson@swms.edu', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhxHKthjTRBxoyxLrQnEzG', 'faculty'),
('Faculty Twenty One', 'faculty21', 'faculty21@swms.edu', '$2a$12$jEigfIdEdHp4k/e2wT3vuuSami11uRB5ciQFrNdL41rbFw.UL1eLe', 'faculty'),
('Prof. Sarah Thompson', 'sarah_thompson', 'sarah.thompson@swms.edu', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhxHKthjTRBxoyxLrQnEzG', 'faculty')
ON CONFLICT (username) DO NOTHING;

-- Insert sample courses
INSERT INTO courses (title, section, faculty_id) VALUES 
('Computer Science Fundamentals', 'CS101-A', (SELECT id FROM users WHERE username = 'john_smith')),
('Computer Science Fundamentals', 'CS101-B', (SELECT id FROM users WHERE username = 'john_smith')),
('Data Structures and Algorithms', 'CS201-A', (SELECT id FROM users WHERE username = 'lisa_davis')),
('Database Systems', 'CS301-A', (SELECT id FROM users WHERE username = 'robert_wilson')),
('Software Engineering', 'CS401-A', (SELECT id FROM users WHERE username = 'lisa_davis')),
('Web Development', 'WEB301-A', (SELECT id FROM users WHERE username = 'faculty21')),
('Mobile App Development', 'MOB401-A', (SELECT id FROM users WHERE username = 'faculty21')),
('Computer Science and Engineering', 'CSE103-29', (SELECT id FROM users WHERE username = 'sarah_thompson'))
ON CONFLICT (title, section) DO NOTHING;

-- Insert sample students
INSERT INTO users (name, username, email, password_hash, role, student_id) VALUES 
('Alice Johnson', 'alice_johnson', 'alice.johnson@student.swms.edu', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhxHKthjTRBxoyxLrQnEzG', 'student', 'STU001'),
('Bob Smith', 'bob_smith', 'bob.smith@student.swms.edu', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhxHKthjTRBxoyxLrQnEzG', 'student', 'STU002'),
('Carol Williams', 'carol_williams', 'carol.williams@student.swms.edu', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhxHKthjTRBxoyxLrQnEzG', 'student', 'STU003'),
('David Brown', 'david_brown', 'david.brown@student.swms.edu', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhxHKthjTRBxoyxLrQnEzG', 'student', 'STU004'),
('Eve Davis', 'eve_davis', 'eve.davis@student.swms.edu', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhxHKthjTRBxoyxLrQnEzG', 'student', 'STU005'),
-- CSE 103-29 Students
('Mike Chen', 'mike_chen', 'mike.chen@student.swms.edu', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhxHKthjTRBxoyxLrQnEzG', 'student', 'STU006'),
('Sarah Martinez', 'sarah_martinez', 'sarah.martinez@student.swms.edu', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhxHKthjTRBxoyxLrQnEzG', 'student', 'STU007'),
('James Wilson', 'james_wilson', 'james.wilson@student.swms.edu', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhxHKthjTRBxoyxLrQnEzG', 'student', 'STU008'),
('Emily Rodriguez', 'emily_rodriguez', 'emily.rodriguez@student.swms.edu', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhxHKthjTRBxoyxLrQnEzG', 'student', 'STU009'),
('Alex Kim', 'alex_kim', 'alex.kim@student.swms.edu', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhxHKthjTRBxoyxLrQnEzG', 'student', 'STU010')
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
((SELECT id FROM users WHERE username = 'eve_davis'), (SELECT id FROM courses WHERE title = 'Software Engineering' AND section = 'CS401-A')),

-- Students in faculty21's courses
((SELECT id FROM users WHERE username = 'alice_johnson'), (SELECT id FROM courses WHERE title = 'Web Development' AND section = 'WEB301-A')),
((SELECT id FROM users WHERE username = 'bob_smith'), (SELECT id FROM courses WHERE title = 'Web Development' AND section = 'WEB301-A')),
((SELECT id FROM users WHERE username = 'carol_williams'), (SELECT id FROM courses WHERE title = 'Mobile App Development' AND section = 'MOB401-A')),
((SELECT id FROM users WHERE username = 'david_brown'), (SELECT id FROM courses WHERE title = 'Mobile App Development' AND section = 'MOB401-A')),

-- Students in CSE 103-29
((SELECT id FROM users WHERE username = 'mike_chen'), (SELECT id FROM courses WHERE title = 'Computer Science and Engineering' AND section = 'CSE103-29')),
((SELECT id FROM users WHERE username = 'sarah_martinez'), (SELECT id FROM courses WHERE title = 'Computer Science and Engineering' AND section = 'CSE103-29')),
((SELECT id FROM users WHERE username = 'james_wilson'), (SELECT id FROM courses WHERE title = 'Computer Science and Engineering' AND section = 'CSE103-29')),
((SELECT id FROM users WHERE username = 'emily_rodriguez'), (SELECT id FROM courses WHERE title = 'Computer Science and Engineering' AND section = 'CSE103-29')),
((SELECT id FROM users WHERE username = 'alex_kim'), (SELECT id FROM courses WHERE title = 'Computer Science and Engineering' AND section = 'CSE103-29'))
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
((SELECT id FROM users WHERE username = 'eve_davis'), 6, 'Getting back on track', CURRENT_DATE - INTERVAL '3 days'),

-- CSE 103-29 students mood entries
((SELECT id FROM users WHERE username = 'mike_chen'), 8, 'Love the CSE course material!', CURRENT_DATE - INTERVAL '1 day'),
((SELECT id FROM users WHERE username = 'mike_chen'), 7, 'Good understanding of concepts', CURRENT_DATE - INTERVAL '2 days'),
((SELECT id FROM users WHERE username = 'mike_chen'), 9, 'Aced the programming assignment', CURRENT_DATE - INTERVAL '3 days'),
((SELECT id FROM users WHERE username = 'mike_chen'), 6, 'A bit challenging but manageable', CURRENT_DATE - INTERVAL '4 days'),

((SELECT id FROM users WHERE username = 'sarah_martinez'), 5, 'Average day in CSE class', CURRENT_DATE - INTERVAL '1 day'),
((SELECT id FROM users WHERE username = 'sarah_martinez'), 7, 'Understanding improved after study group', CURRENT_DATE - INTERVAL '2 days'),
((SELECT id FROM users WHERE username = 'sarah_martinez'), 4, 'Struggling with some algorithms', CURRENT_DATE - INTERVAL '3 days'),
((SELECT id FROM users WHERE username = 'sarah_martinez'), 8, 'Great lecture on data structures', CURRENT_DATE - INTERVAL '4 days'),

((SELECT id FROM users WHERE username = 'james_wilson'), 3, 'Finding CSE very challenging', CURRENT_DATE - INTERVAL '1 day'),
((SELECT id FROM users WHERE username = 'james_wilson'), 2, 'Really overwhelmed with coursework', CURRENT_DATE - INTERVAL '2 days'),
((SELECT id FROM users WHERE username = 'james_wilson'), 4, 'Got some help from TA', CURRENT_DATE - INTERVAL '3 days'),
((SELECT id FROM users WHERE username = 'james_wilson'), 3, 'Still struggling but trying', CURRENT_DATE - INTERVAL '4 days'),

((SELECT id FROM users WHERE username = 'emily_rodriguez'), 6, 'CSE is interesting but tough', CURRENT_DATE - INTERVAL '1 day'),
((SELECT id FROM users WHERE username = 'emily_rodriguez'), 7, 'Good progress on project', CURRENT_DATE - INTERVAL '2 days'),
((SELECT id FROM users WHERE username = 'emily_rodriguez'), 5, 'Regular study day', CURRENT_DATE - INTERVAL '3 days'),
((SELECT id FROM users WHERE username = 'emily_rodriguez'), 8, 'Breakthrough in understanding!', CURRENT_DATE - INTERVAL '4 days'),

((SELECT id FROM users WHERE username = 'alex_kim'), 9, 'Absolutely loving CSE 103!', CURRENT_DATE - INTERVAL '1 day'),
((SELECT id FROM users WHERE username = 'alex_kim'), 8, 'Great problem-solving session', CURRENT_DATE - INTERVAL '2 days'),
((SELECT id FROM users WHERE username = 'alex_kim'), 7, 'Helping classmates feels good', CURRENT_DATE - INTERVAL '3 days'),
((SELECT id FROM users WHERE username = 'alex_kim'), 9, 'Perfect score on quiz!', CURRENT_DATE - INTERVAL '4 days');

-- Insert sample auto-recommendations for low mood students
INSERT INTO recommendations (student_id, recommendation_type, reason, status) VALUES 
((SELECT id FROM users WHERE username = 'bob_smith'), 'auto', 'Auto-recommended due to low mood level (3/10) on ' || CURRENT_DATE - INTERVAL '1 day', 'pending'),
((SELECT id FROM users WHERE username = 'eve_davis'), 'auto', 'Auto-recommended due to low mood level (3/10) on ' || CURRENT_DATE - INTERVAL '1 day', 'pending'),
((SELECT id FROM users WHERE username = 'james_wilson'), 'auto', 'Auto-recommended due to low mood level (2/10) on ' || CURRENT_DATE - INTERVAL '2 days', 'pending');

-- Insert sample faculty recommendation
INSERT INTO recommendations (student_id, faculty_id, recommendation_type, reason, status) VALUES 
((SELECT id FROM users WHERE username = 'bob_smith'), (SELECT id FROM users WHERE username = 'john_smith'), 'faculty', 'Student seems to be struggling with course material and may benefit from counseling support', 'pending'),
((SELECT id FROM users WHERE username = 'james_wilson'), (SELECT id FROM users WHERE username = 'sarah_thompson'), 'faculty', 'Student is having difficulty with CSE 103 concepts and showing signs of academic stress. Recommend counseling support for study strategies and stress management.', 'pending');

-- Insert sample appointments
INSERT INTO appointments (student_id, consultant_id, recommendation_id, appointment_date, appointment_time, status, requested_by, student_notes) VALUES 
((SELECT id FROM users WHERE username = 'alice_johnson'), (SELECT id FROM users WHERE username = 'sarah_johnson'), NULL, CURRENT_DATE + INTERVAL '3 days', '10:00', 'confirmed', 'student', 'Would like to discuss time management strategies'),
((SELECT id FROM users WHERE username = 'bob_smith'), (SELECT id FROM users WHERE username = 'michael_chen'), (SELECT id FROM recommendations WHERE student_id = (SELECT id FROM users WHERE username = 'bob_smith') AND recommendation_type = 'auto'), CURRENT_DATE + INTERVAL '2 days', '14:00', 'pending', 'consultant', NULL);

-- Update recommendation status for scheduled appointment
UPDATE recommendations 
SET status = 'scheduled', consultant_id = (SELECT id FROM users WHERE username = 'michael_chen')
WHERE student_id = (SELECT id FROM users WHERE username = 'bob_smith') AND recommendation_type = 'auto';

COMMIT;
