-- Student Wellness Management System Database Schema
-- PostgreSQL version

-- Create database (run this first as superuser)
-- CREATE DATABASE swms_db;

-- Extensions for UUID generation
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users table (unified for all user types)
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    username VARCHAR(100) UNIQUE NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(20) NOT NULL CHECK (role IN ('admin', 'student', 'faculty', 'consultant')),
    student_id VARCHAR(50) UNIQUE,  -- Only for students
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    is_active BOOLEAN DEFAULT true
);

-- Courses table
CREATE TABLE courses (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title VARCHAR(255) NOT NULL,
    section VARCHAR(50) NOT NULL,
    faculty_id UUID REFERENCES users(id) ON DELETE CASCADE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(title, section)
);

-- Student courses enrollment table
CREATE TABLE student_courses (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    student_id UUID REFERENCES users(id) ON DELETE CASCADE,
    course_id UUID REFERENCES courses(id) ON DELETE CASCADE,
    enrolled_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(student_id, course_id)
);

-- Mood entries table
CREATE TABLE mood_entries (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    student_id UUID REFERENCES users(id) ON DELETE CASCADE,
    mood_level INTEGER NOT NULL CHECK (mood_level >= 1 AND mood_level <= 10),
    notes TEXT,
    entry_date DATE NOT NULL DEFAULT CURRENT_DATE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Recommendations table
CREATE TABLE recommendations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    student_id UUID REFERENCES users(id) ON DELETE CASCADE,
    faculty_id UUID REFERENCES users(id) ON DELETE SET NULL,
    consultant_id UUID REFERENCES users(id) ON DELETE SET NULL,
    recommendation_type VARCHAR(20) NOT NULL CHECK (recommendation_type IN ('auto', 'faculty')),
    reason TEXT,
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'scheduled', 'completed', 'declined')),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    cooldown_until TIMESTAMP
);

-- Appointments table
CREATE TABLE appointments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    student_id UUID REFERENCES users(id) ON DELETE CASCADE,
    consultant_id UUID REFERENCES users(id) ON DELETE CASCADE,
    recommendation_id UUID REFERENCES recommendations(id) ON DELETE SET NULL,
    appointment_date DATE NOT NULL,
    appointment_time TIME NOT NULL,
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'declined', 'completed', 'cancelled')),
    student_notes TEXT,
    consultant_notes TEXT,
    requested_by VARCHAR(20) NOT NULL CHECK (requested_by IN ('student', 'consultant')),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    counter_proposal_date DATE,
    counter_proposal_time TIME
);

-- Create indexes for better performance
CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_username ON users(username);
CREATE INDEX idx_users_student_id ON users(student_id);
CREATE INDEX idx_mood_entries_student_date ON mood_entries(student_id, entry_date);
CREATE INDEX idx_mood_entries_date ON mood_entries(entry_date);
CREATE INDEX idx_recommendations_student ON recommendations(student_id);
CREATE INDEX idx_recommendations_status ON recommendations(status);
CREATE INDEX idx_appointments_date_time ON appointments(appointment_date, appointment_time);
CREATE INDEX idx_appointments_student ON appointments(student_id);
CREATE INDEX idx_appointments_consultant ON appointments(consultant_id);
CREATE INDEX idx_student_courses_student ON student_courses(student_id);
CREATE INDEX idx_courses_faculty ON courses(faculty_id);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers for updated_at
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_appointments_updated_at BEFORE UPDATE ON appointments FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Insert default admin user
INSERT INTO users (name, username, email, password_hash, role) VALUES 
('System Administrator', 'admin_swms', 'admin@swms.edu', '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'admin');
-- Note: The password hash above is for 'swmsewu2025' (will be properly hashed in the application)

-- Views for easier data access

-- View for student mood statistics
CREATE VIEW student_mood_stats AS
SELECT 
    u.id,
    u.name,
    u.student_id,
    u.email,
    COUNT(me.id) as total_entries,
    AVG(me.mood_level) as overall_avg_mood,
    AVG(CASE WHEN me.entry_date >= CURRENT_DATE - INTERVAL '7 days' THEN me.mood_level END) as avg_mood_7d,
    AVG(CASE WHEN me.entry_date >= CURRENT_DATE - INTERVAL '30 days' THEN me.mood_level END) as avg_mood_30d,
    MAX(me.entry_date) as last_entry_date
FROM users u
LEFT JOIN mood_entries me ON u.id = me.student_id
WHERE u.role = 'student' AND u.is_active = true
GROUP BY u.id, u.name, u.student_id, u.email;

-- View for course mood averages
CREATE VIEW course_mood_averages AS
SELECT 
    c.id as course_id,
    c.title,
    c.section,
    c.faculty_id,
    f.name as faculty_name,
    COUNT(DISTINCT sc.student_id) as student_count,
    AVG(me.mood_level) as avg_mood,
    AVG(CASE WHEN me.entry_date >= CURRENT_DATE - INTERVAL '7 days' THEN me.mood_level END) as avg_mood_7d,
    AVG(CASE WHEN me.entry_date >= CURRENT_DATE - INTERVAL '30 days' THEN me.mood_level END) as avg_mood_30d
FROM courses c
LEFT JOIN users f ON c.faculty_id = f.id
LEFT JOIN student_courses sc ON c.id = sc.course_id
LEFT JOIN mood_entries me ON sc.student_id = me.student_id
WHERE f.role = 'faculty' AND f.is_active = true
GROUP BY c.id, c.title, c.section, c.faculty_id, f.name;

-- View for vulnerable students (7-day average mood < 4)
CREATE VIEW vulnerable_students AS
SELECT 
    u.id,
    u.name,
    u.student_id,
    u.email,
    c.title as course_title,
    c.section,
    c.faculty_id,
    AVG(me.mood_level) as avg_mood_7d,
    MAX(me.entry_date) as last_entry_date,
    CASE WHEN r.cooldown_until IS NOT NULL AND r.cooldown_until > CURRENT_TIMESTAMP 
         THEN true ELSE false END as in_cooldown
FROM users u
JOIN student_courses sc ON u.id = sc.student_id
JOIN courses c ON sc.course_id = c.id
LEFT JOIN mood_entries me ON u.id = me.student_id AND me.entry_date >= CURRENT_DATE - INTERVAL '7 days'
LEFT JOIN recommendations r ON u.id = r.student_id AND r.cooldown_until > CURRENT_TIMESTAMP
WHERE u.role = 'student' AND u.is_active = true
GROUP BY u.id, u.name, u.student_id, u.email, c.title, c.section, c.faculty_id, r.cooldown_until
HAVING AVG(me.mood_level) < 4;
