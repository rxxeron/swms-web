-- Add CSE 103-29 test data

-- Add Prof. Sarah Thompson
INSERT INTO users (name, username, email, password_hash, role) VALUES 
('Prof. Sarah Thompson', 'sarah_thompson', 'sarah.thompson@swms.edu', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhxHKthjTRBxoyxLrQnEzG', 'faculty')
ON CONFLICT (username) DO NOTHING;

-- Add CSE 103-29 course
INSERT INTO courses (title, section, faculty_id) VALUES 
('Computer Science and Engineering', 'CSE103-29', (SELECT id FROM users WHERE username = 'sarah_thompson'))
ON CONFLICT (title, section) DO NOTHING;

-- Add CSE 103-29 students
INSERT INTO users (name, username, email, password_hash, role, student_id) VALUES 
('Mike Chen', 'mike_chen', 'mike.chen@student.swms.edu', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhxHKthjTRBxoyxLrQnEzG', 'student', 'STU006'),
('Sarah Martinez', 'sarah_martinez', 'sarah.martinez@student.swms.edu', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhxHKthjTRBxoyxLrQnEzG', 'student', 'STU007'),
('James Wilson', 'james_wilson', 'james.wilson@student.swms.edu', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhxHKthjTRBxoyxLrQnEzG', 'student', 'STU008'),
('Emily Rodriguez', 'emily_rodriguez', 'emily.rodriguez@student.swms.edu', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhxHKthjTRBxoyxLrQnEzG', 'student', 'STU009'),
('Alex Kim', 'alex_kim', 'alex.kim@student.swms.edu', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhxHKthjTRBxoyxLrQnEzG', 'student', 'STU010')
ON CONFLICT (username) DO NOTHING;

-- Enroll students in CSE 103-29
INSERT INTO student_courses (student_id, course_id) VALUES 
((SELECT id FROM users WHERE username = 'mike_chen'), (SELECT id FROM courses WHERE title = 'Computer Science and Engineering' AND section = 'CSE103-29')),
((SELECT id FROM users WHERE username = 'sarah_martinez'), (SELECT id FROM courses WHERE title = 'Computer Science and Engineering' AND section = 'CSE103-29')),
((SELECT id FROM users WHERE username = 'james_wilson'), (SELECT id FROM courses WHERE title = 'Computer Science and Engineering' AND section = 'CSE103-29')),
((SELECT id FROM users WHERE username = 'emily_rodriguez'), (SELECT id FROM courses WHERE title = 'Computer Science and Engineering' AND section = 'CSE103-29')),
((SELECT id FROM users WHERE username = 'alex_kim'), (SELECT id FROM courses WHERE title = 'Computer Science and Engineering' AND section = 'CSE103-29'))
ON CONFLICT (student_id, course_id) DO NOTHING;

-- Add mood entries for CSE 103-29 students

-- Mike Chen's mood entries (good performer, 6-9 range)
INSERT INTO mood_entries (student_id, mood_level, notes, entry_date) VALUES 
((SELECT id FROM users WHERE username = 'mike_chen'), 8, 'Enjoying the CSE 103 lectures, understanding concepts well', CURRENT_DATE - INTERVAL '1 day'),
((SELECT id FROM users WHERE username = 'mike_chen'), 9, 'Aced the midterm exam!', CURRENT_DATE - INTERVAL '3 days'),
((SELECT id FROM users WHERE username = 'mike_chen'), 7, 'Working on challenging assignment but making progress', CURRENT_DATE - INTERVAL '5 days'),
((SELECT id FROM users WHERE username = 'mike_chen'), 8, 'Good study session with classmates', CURRENT_DATE - INTERVAL '7 days'),
((SELECT id FROM users WHERE username = 'mike_chen'), 6, 'Feeling confident about the course material', CURRENT_DATE - INTERVAL '10 days');

-- Sarah Martinez's mood entries (average performer, 4-8 range)
INSERT INTO mood_entries (student_id, mood_level, notes, entry_date) VALUES 
((SELECT id FROM users WHERE username = 'sarah_martinez'), 6, 'Understanding some concepts but struggling with others', CURRENT_DATE - INTERVAL '1 day'),
((SELECT id FROM users WHERE username = 'sarah_martinez'), 5, 'Need to spend more time on homework', CURRENT_DATE - INTERVAL '3 days'),
((SELECT id FROM users WHERE username = 'sarah_martinez'), 7, 'Office hours were really helpful', CURRENT_DATE - INTERVAL '5 days'),
((SELECT id FROM users WHERE username = 'sarah_martinez'), 4, 'Feeling behind on the coursework', CURRENT_DATE - INTERVAL '7 days'),
((SELECT id FROM users WHERE username = 'sarah_martinez'), 8, 'Had a breakthrough understanding algorithms', CURRENT_DATE - INTERVAL '10 days');

-- James Wilson's mood entries (struggling student, 2-4 range) 
INSERT INTO mood_entries (student_id, mood_level, notes, entry_date) VALUES 
((SELECT id FROM users WHERE username = 'james_wilson'), 2, 'Really struggling with CSE 103 concepts, feeling overwhelmed', CURRENT_DATE - INTERVAL '1 day'),
((SELECT id FROM users WHERE username = 'james_wilson'), 3, 'Got some help from TA but still confused', CURRENT_DATE - INTERVAL '3 days'),
((SELECT id FROM users WHERE username = 'james_wilson'), 2, 'Failed the quiz, considering dropping the course', CURRENT_DATE - INTERVAL '5 days'),
((SELECT id FROM users WHERE username = 'james_wilson'), 4, 'Talked to professor, will try to catch up', CURRENT_DATE - INTERVAL '7 days'),
((SELECT id FROM users WHERE username = 'james_wilson'), 3, 'Spent weekend studying but still not clicking', CURRENT_DATE - INTERVAL '10 days');

-- Emily Rodriguez's mood entries (average performer, 5-8 range)
INSERT INTO mood_entries (student_id, mood_level, notes, entry_date) VALUES 
((SELECT id FROM users WHERE username = 'emily_rodriguez'), 7, 'Doing well in CSE 103, enjoying programming assignments', CURRENT_DATE - INTERVAL '1 day'),
((SELECT id FROM users WHERE username = 'emily_rodriguez'), 6, 'Some concepts are challenging but manageable', CURRENT_DATE - INTERVAL '3 days'),
((SELECT id FROM users WHERE username = 'emily_rodriguez'), 8, 'Really liked today''s lab session', CURRENT_DATE - INTERVAL '5 days'),
((SELECT id FROM users WHERE username = 'emily_rodriguez'), 5, 'Neutral day, regular progress', CURRENT_DATE - INTERVAL '7 days'),
((SELECT id FROM users WHERE username = 'emily_rodriguez'), 7, 'Good collaboration with study group', CURRENT_DATE - INTERVAL '10 days');

-- Alex Kim's mood entries (high performer, 7-9 range)
INSERT INTO mood_entries (student_id, mood_level, notes, entry_date) VALUES 
((SELECT id FROM users WHERE username = 'alex_kim'), 9, 'Love CSE 103! Planning to take advanced courses', CURRENT_DATE - INTERVAL '1 day'),
((SELECT id FROM users WHERE username = 'alex_kim'), 8, 'Finished assignment early, helping classmates', CURRENT_DATE - INTERVAL '3 days'),
((SELECT id FROM users WHERE username = 'alex_kim'), 9, 'Perfect score on programming project', CURRENT_DATE - INTERVAL '5 days'),
((SELECT id FROM users WHERE username = 'alex_kim'), 7, 'Good day, regular progress on coursework', CURRENT_DATE - INTERVAL '7 days'),
((SELECT id FROM users WHERE username = 'alex_kim'), 8, 'Excited about upcoming final project', CURRENT_DATE - INTERVAL '10 days');

-- Add recommendations for at-risk students
INSERT INTO recommendations (student_id, faculty_id, consultant_id, recommendation_type, reason, status) VALUES 
-- Auto-recommendation for James Wilson (low mood pattern)
((SELECT id FROM users WHERE username = 'james_wilson'), NULL, (SELECT id FROM users WHERE username = 'sarah_johnson'), 'auto', 'Student showing consistently low mood levels (2-3) related to academic stress in CSE 103. Recommend immediate intervention with academic counseling and tutoring support.', 'pending'),

-- Faculty recommendation from Prof. Sarah Thompson
((SELECT id FROM users WHERE username = 'james_wilson'), (SELECT id FROM users WHERE username = 'sarah_thompson'), NULL, 'faculty', 'Student is having difficulty with CSE 103 concepts and showing signs of academic stress. Recommend counseling support for study strategies and stress management.', 'pending');
