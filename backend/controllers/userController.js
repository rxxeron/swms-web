const bcrypt = require('bcryptjs');
const { query, transaction } = require('../config/database');
const { validatePasswordStrength } = require('../middleware/validation');

/**
 * Get all users with filtering and pagination
 */
const getAllUsers = async (req, res) => {
  try {
    const { page = 1, limit = 10, role, search, sort_by = 'created_at', sort_order = 'desc' } = req.query;
    const offset = (page - 1) * limit;

    // Build WHERE clause
    let whereConditions = ['u.is_active = true'];
    let queryParams = [];
    let paramCount = 0;

    if (role && ['student', 'faculty', 'consultant'].includes(role)) {
      paramCount++;
      whereConditions.push(`u.role = $${paramCount}`);
      queryParams.push(role);
    }

    if (search) {
      paramCount++;
      whereConditions.push(`(
        u.name ILIKE $${paramCount} OR 
        u.username ILIKE $${paramCount} OR 
        u.email ILIKE $${paramCount} OR 
        u.student_id ILIKE $${paramCount}
      )`);
      queryParams.push(`%${search}%`);
    }

    const whereClause = whereConditions.length > 0 ? `WHERE ${whereConditions.join(' AND ')}` : '';

    // Validate sort column
    const allowedSortColumns = ['name', 'username', 'email', 'role', 'created_at', 'student_id'];
    const sortColumn = allowedSortColumns.includes(sort_by) ? sort_by : 'created_at';
    const sortDirection = sort_order.toLowerCase() === 'asc' ? 'ASC' : 'DESC';

    // Get total count
    const countQuery = `
      SELECT COUNT(*) as total
      FROM users u
      ${whereClause}
    `;
    const countResult = await query(countQuery, queryParams);
    const total = parseInt(countResult.rows[0].total);

    // Get users with pagination
    paramCount++;
    queryParams.push(limit);
    paramCount++;
    queryParams.push(offset);

    const usersQuery = `
      SELECT 
        u.id, u.name, u.username, u.email, u.role, u.student_id, u.created_at,
        CASE 
          WHEN u.role = 'student' THEN (
            SELECT COUNT(*) FROM student_courses sc WHERE sc.student_id = u.id
          )
          WHEN u.role = 'faculty' THEN (
            SELECT COUNT(*) FROM courses c WHERE c.faculty_id = u.id
          )
          ELSE 0
        END as course_count
      FROM users u
      ${whereClause}
      ORDER BY u.${sortColumn} ${sortDirection}
      LIMIT $${paramCount - 1} OFFSET $${paramCount}
    `;

    const usersResult = await query(usersQuery, queryParams);

    // Calculate pagination info
    const totalPages = Math.ceil(total / limit);
    const hasNextPage = page < totalPages;
    const hasPrevPage = page > 1;

    res.json({
      success: true,
      data: {
        users: usersResult.rows,
        pagination: {
          currentPage: parseInt(page),
          totalPages,
          totalItems: total,
          itemsPerPage: parseInt(limit),
          hasNextPage,
          hasPrevPage
        }
      }
    });
  } catch (error) {
    console.error('Get all users error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get users'
    });
  }
};

/**
 * Get user by ID
 */
const getUserById = async (req, res) => {
  try {
    const { id } = req.params;

    const userResult = await query(
      `SELECT id, name, username, email, role, student_id, created_at, updated_at
       FROM users 
       WHERE id = $1 AND is_active = true`,
      [id]
    );

    if (userResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    const user = userResult.rows[0];

    // Get additional info based on role
    if (user.role === 'student') {
      // Get student's courses
      const coursesResult = await query(
        `SELECT c.id, c.title, c.section, f.name as faculty_name
         FROM courses c
         LEFT JOIN users f ON c.faculty_id = f.id
         JOIN student_courses sc ON c.id = sc.course_id
         WHERE sc.student_id = $1
         ORDER BY c.title, c.section`,
        [id]
      );

      // Get mood statistics
      const moodStatsResult = await query(
        `SELECT 
           COUNT(*) as total_entries,
           AVG(mood_level) as avg_mood,
           MIN(mood_level) as min_mood,
           MAX(mood_level) as max_mood,
           MAX(entry_date) as last_entry_date
         FROM mood_entries 
         WHERE student_id = $1`,
        [id]
      );

      user.courses = coursesResult.rows;
      user.mood_stats = moodStatsResult.rows[0];
    } else if (user.role === 'faculty') {
      // Get faculty's courses
      const coursesResult = await query(
        `SELECT c.id, c.title, c.section,
         COUNT(sc.student_id) as student_count
         FROM courses c
         LEFT JOIN student_courses sc ON c.id = sc.course_id
         WHERE c.faculty_id = $1
         GROUP BY c.id, c.title, c.section
         ORDER BY c.title, c.section`,
        [id]
      );

      user.courses = coursesResult.rows;
    }

    res.json({
      success: true,
      data: { user }
    });
  } catch (error) {
    console.error('Get user by ID error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get user'
    });
  }
};

/**
 * Add faculty member
 */
const addFaculty = async (req, res) => {
  try {
    const { name, username, email, password, courses } = req.body;

    // Validate password strength
    const passwordValidation = validatePasswordStrength(password);
    if (!passwordValidation.isValid) {
      return res.status(400).json({
        success: false,
        message: 'Password does not meet requirements',
        errors: passwordValidation.issues
      });
    }

    // Check if username or email already exists
    const existingUserResult = await query(
      'SELECT username, email FROM users WHERE username = $1 OR email = $2',
      [username.toLowerCase(), email.toLowerCase()]
    );

    if (existingUserResult.rows.length > 0) {
      const existing = existingUserResult.rows[0];
      let message = 'Faculty addition failed. ';
      
      if (existing.username === username.toLowerCase()) {
        message += 'Username already exists.';
      } else if (existing.email === email.toLowerCase()) {
        message += 'Email already exists.';
      }

      return res.status(409).json({
        success: false,
        message
      });
    }

    // Hash password
    const saltRounds = 12;
    const passwordHash = await bcrypt.hash(password, saltRounds);

    // Use transaction to ensure data consistency
    const result = await transaction(async (client) => {
      // Insert faculty user
      const userResult = await client.query(
        `INSERT INTO users (name, username, email, password_hash, role)
         VALUES ($1, $2, $3, $4, 'faculty')
         RETURNING id, name, username, email, role, created_at`,
        [name, username.toLowerCase(), email.toLowerCase(), passwordHash]
      );

      const newFaculty = userResult.rows[0];

      // Insert or update courses
      for (const course of courses) {
        // Check if course exists
        let courseResult = await client.query(
          'SELECT id, faculty_id FROM courses WHERE title = $1 AND section = $2',
          [course.title, course.section]
        );

        if (courseResult.rows.length === 0) {
          // Create new course
          await client.query(
            'INSERT INTO courses (title, section, faculty_id) VALUES ($1, $2, $3)',
            [course.title, course.section, newFaculty.id]
          );
        } else {
          // Update existing course to assign faculty
          const existingCourse = courseResult.rows[0];
          if (existingCourse.faculty_id && existingCourse.faculty_id !== newFaculty.id) {
            throw new Error(`Course ${course.title} - ${course.section} is already assigned to another faculty member`);
          }
          
          await client.query(
            'UPDATE courses SET faculty_id = $1 WHERE id = $2',
            [newFaculty.id, existingCourse.id]
          );
        }
      }

      return newFaculty;
    });

    res.status(201).json({
      success: true,
      message: 'Faculty member added successfully',
      data: { faculty: result }
    });
  } catch (error) {
    console.error('Add faculty error:', error);
    
    if (error.message.includes('already assigned')) {
      return res.status(409).json({
        success: false,
        message: error.message
      });
    }
    
    res.status(500).json({
      success: false,
      message: 'Failed to add faculty member'
    });
  }
};

/**
 * Add consultant
 */
const addConsultant = async (req, res) => {
  try {
    const { name, username, email, password } = req.body;

    // Validate password strength
    const passwordValidation = validatePasswordStrength(password);
    if (!passwordValidation.isValid) {
      return res.status(400).json({
        success: false,
        message: 'Password does not meet requirements',
        errors: passwordValidation.issues
      });
    }

    // Check if username or email already exists
    const existingUserResult = await query(
      'SELECT username, email FROM users WHERE username = $1 OR email = $2',
      [username.toLowerCase(), email.toLowerCase()]
    );

    if (existingUserResult.rows.length > 0) {
      const existing = existingUserResult.rows[0];
      let message = 'Consultant addition failed. ';
      
      if (existing.username === username.toLowerCase()) {
        message += 'Username already exists.';
      } else if (existing.email === email.toLowerCase()) {
        message += 'Email already exists.';
      }

      return res.status(409).json({
        success: false,
        message
      });
    }

    // Hash password
    const saltRounds = 12;
    const passwordHash = await bcrypt.hash(password, saltRounds);

    // Insert consultant user
    const userResult = await query(
      `INSERT INTO users (name, username, email, password_hash, role)
       VALUES ($1, $2, $3, $4, 'consultant')
       RETURNING id, name, username, email, role, created_at`,
      [name, username.toLowerCase(), email.toLowerCase(), passwordHash]
    );

    const newConsultant = userResult.rows[0];

    res.status(201).json({
      success: true,
      message: 'Consultant added successfully',
      data: { consultant: newConsultant }
    });
  } catch (error) {
    console.error('Add consultant error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to add consultant'
    });
  }
};

/**
 * Delete user
 */
const deleteUser = async (req, res) => {
  try {
    const { id } = req.params;

    // Check if user exists and is not admin
    const userResult = await query(
      'SELECT id, role, name FROM users WHERE id = $1 AND is_active = true',
      [id]
    );

    if (userResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    const user = userResult.rows[0];

    if (user.role === 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Cannot delete admin user'
      });
    }

    // Soft delete user (set is_active to false)
    await query(
      'UPDATE users SET is_active = false, updated_at = CURRENT_TIMESTAMP WHERE id = $1',
      [id]
    );

    res.json({
      success: true,
      message: `User ${user.name} deleted successfully`
    });
  } catch (error) {
    console.error('Delete user error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete user'
    });
  }
};

/**
 * Get user statistics for admin dashboard
 */
const getUserStats = async (req, res) => {
  try {
    const statsResult = await query(`
      SELECT 
        role,
        COUNT(*) as count,
        COUNT(CASE WHEN created_at >= CURRENT_DATE - INTERVAL '30 days' THEN 1 END) as new_this_month,
        COUNT(CASE WHEN created_at >= CURRENT_DATE - INTERVAL '7 days' THEN 1 END) as new_this_week
      FROM users 
      WHERE is_active = true AND role != 'admin'
      GROUP BY role
      ORDER BY role
    `);

    const moodStatsResult = await query(`
      SELECT 
        COUNT(*) as total_entries,
        COUNT(CASE WHEN entry_date = CURRENT_DATE THEN 1 END) as entries_today,
        COUNT(CASE WHEN entry_date >= CURRENT_DATE - INTERVAL '7 days' THEN 1 END) as entries_this_week,
        AVG(mood_level) as overall_avg_mood,
        COUNT(CASE WHEN mood_level < 4 THEN 1 END) as low_mood_entries
      FROM mood_entries
      WHERE entry_date >= CURRENT_DATE - INTERVAL '30 days'
    `);

    const appointmentStatsResult = await query(`
      SELECT 
        status,
        COUNT(*) as count
      FROM appointments 
      WHERE created_at >= CURRENT_DATE - INTERVAL '30 days'
      GROUP BY status
    `);

    res.json({
      success: true,
      data: {
        userStats: statsResult.rows,
        moodStats: moodStatsResult.rows[0],
        appointmentStats: appointmentStatsResult.rows
      }
    });
  } catch (error) {
    console.error('Get user stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get user statistics'
    });
  }
};

module.exports = {
  getAllUsers,
  getUserById,
  addFaculty,
  addConsultant,
  deleteUser,
  getUserStats
};
