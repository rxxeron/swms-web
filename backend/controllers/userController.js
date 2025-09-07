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

    // Debug logging
    console.log('getAllUsers called with params:', { page, limit, role, search, sort_by, sort_order });

    // Build WHERE clause - show all users (active and inactive)
    let whereConditions = [];
    let queryParams = [];
    let paramCount = 0;

    if (role && ['student', 'faculty', 'consultant', 'admin'].includes(role)) {
      paramCount++;
      whereConditions.push(`u.role = $${paramCount}`);
      queryParams.push(role);
      console.log('Role filter applied:', role);
    } else if (role) {
      console.log('Invalid role provided:', role);
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
        u.id, u.name, u.username, u.email, u.role, u.student_id, u.created_at, u.is_active, u.deactivated_until,
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
 * Update user status (deactivate, reactivate, temporary deactivate)
 */
const updateUserStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { action, deactivate_until } = req.body;

    // Check if user exists and is not admin
    const userResult = await query(
      'SELECT id, role, name, is_active FROM users WHERE id = $1',
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
        message: 'Cannot modify admin user status'
      });
    }

    let updateQuery = '';
    let queryParams = [id];
    let message = '';

    switch (action) {
      case 'temporary':
        if (!deactivate_until) {
          return res.status(400).json({
            success: false,
            message: 'Deactivation end date is required for temporary deactivation'
          });
        }
        updateQuery = `
          UPDATE users 
          SET is_active = false, 
              deactivated_until = $2, 
              updated_at = CURRENT_TIMESTAMP 
          WHERE id = $1
        `;
        queryParams.push(deactivate_until);
        message = `User ${user.name} temporarily deactivated until ${new Date(deactivate_until).toLocaleString()}`;
        break;

      case 'permanent':
        updateQuery = `
          UPDATE users 
          SET is_active = false, 
              deactivated_until = NULL, 
              updated_at = CURRENT_TIMESTAMP 
          WHERE id = $1
        `;
        message = `User ${user.name} permanently deactivated`;
        break;

      case 'reactivate':
        updateQuery = `
          UPDATE users 
          SET is_active = true, 
              deactivated_until = NULL, 
              updated_at = CURRENT_TIMESTAMP 
          WHERE id = $1
        `;
        message = `User ${user.name} reactivated successfully`;
        break;

      default:
        return res.status(400).json({
          success: false,
          message: 'Invalid action. Use: temporary, permanent, or reactivate'
        });
    }

    await query(updateQuery, queryParams);

    res.json({
      success: true,
      message
    });
  } catch (error) {
    console.error('Update user status error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update user status'
    });
  }
};

/**
 * Delete user (soft delete or permanent delete)
 */
const deleteUser = async (req, res) => {
  try {
    const { id } = req.params;
    const { permanent } = req.query; // Check if permanent deletion is requested

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

    if (permanent === 'true') {
      // Permanent deletion - remove from database
      await transaction(async (client) => {
        // Delete related data first (appointments, enrollments, etc.)
        await client.query('DELETE FROM appointments WHERE student_id = $1 OR consultant_id = $1', [id]);
        await client.query('DELETE FROM course_enrollments WHERE student_id = $1', [id]);
        await client.query('DELETE FROM mood_entries WHERE student_id = $1', [id]);
        await client.query('DELETE FROM recommendations WHERE student_id = $1 OR consultant_id = $1', [id]);
        
        // Finally delete the user
        await client.query('DELETE FROM users WHERE id = $1', [id]);
      });

      res.json({
        success: true,
        message: `User ${user.name} permanently deleted from the system`
      });
    } else {
      // Soft delete user (set is_active to false)
      await query(
        'UPDATE users SET is_active = false, updated_at = CURRENT_TIMESTAMP WHERE id = $1',
        [id]
      );

      res.json({
        success: true,
        message: `User ${user.name} deactivated successfully`
      });
    }
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

/**
 * Get all courses with faculty and enrollment information
 */
const getAllCourses = async (req, res) => {
  try {
    const coursesResult = await query(`
      SELECT 
        c.id,
        c.title,
        c.section,
        c.created_at,
        f.name as faculty_name,
        f.id as faculty_id,
        COUNT(sc.student_id) as enrolled_students
      FROM courses c
      LEFT JOIN users f ON c.faculty_id = f.id
      LEFT JOIN student_courses sc ON c.id = sc.course_id
      GROUP BY c.id, c.title, c.section, c.created_at, f.name, f.id
      ORDER BY c.title, c.section
    `);

    res.json({
      success: true,
      data: {
        courses: coursesResult.rows,
        total: coursesResult.rows.length
      }
    });
  } catch (error) {
    console.error('Get courses error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get courses'
    });
  }
};

/**
 * Create a new course
 */
const createCourse = async (req, res) => {
  try {
    const { title, section, faculty_id, description } = req.body;

    // Check if course with same title and section already exists
    const existingCourse = await query(
      'SELECT id FROM courses WHERE title = $1 AND section = $2',
      [title, section]
    );

    if (existingCourse.rows.length > 0) {
      return res.status(409).json({
        success: false,
        message: 'Course with this title and section already exists'
      });
    }

    // Validate faculty if provided
    if (faculty_id) {
      const facultyResult = await query(
        'SELECT id FROM users WHERE id = $1 AND role = $2 AND is_active = true',
        [faculty_id, 'faculty']
      );

      if (facultyResult.rows.length === 0) {
        return res.status(400).json({
          success: false,
          message: 'Invalid faculty member selected'
        });
      }
    }

    // Create course
    const courseResult = await query(
      'INSERT INTO courses (title, section, faculty_id) VALUES ($1, $2, $3) RETURNING *',
      [title, section, faculty_id || null]
    );

    res.status(201).json({
      success: true,
      message: 'Course created successfully',
      data: { course: courseResult.rows[0] }
    });
  } catch (error) {
    console.error('Create course error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create course'
    });
  }
};

/**
 * Update a course
 */
const updateCourse = async (req, res) => {
  try {
    const { id } = req.params;
    const { title, section, faculty_id, description } = req.body;

    // Check if course exists
    const courseResult = await query('SELECT id FROM courses WHERE id = $1', [id]);
    if (courseResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Course not found'
      });
    }

    // Check if another course with same title and section exists (excluding current course)
    const existingCourse = await query(
      'SELECT id FROM courses WHERE title = $1 AND section = $2 AND id != $3',
      [title, section, id]
    );

    if (existingCourse.rows.length > 0) {
      return res.status(409).json({
        success: false,
        message: 'Another course with this title and section already exists'
      });
    }

    // Validate faculty if provided
    if (faculty_id) {
      const facultyResult = await query(
        'SELECT id FROM users WHERE id = $1 AND role = $2 AND is_active = true',
        [faculty_id, 'faculty']
      );

      if (facultyResult.rows.length === 0) {
        return res.status(400).json({
          success: false,
          message: 'Invalid faculty member selected'
        });
      }
    }

    // Update course
    const updatedCourse = await query(
      'UPDATE courses SET title = $1, section = $2, faculty_id = $3, updated_at = CURRENT_TIMESTAMP WHERE id = $4 RETURNING *',
      [title, section, faculty_id || null, id]
    );

    res.json({
      success: true,
      message: 'Course updated successfully',
      data: { course: updatedCourse.rows[0] }
    });
  } catch (error) {
    console.error('Update course error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update course'
    });
  }
};

/**
 * Delete a course
 */
const deleteCourse = async (req, res) => {
  try {
    const { id } = req.params;

    // Check if course exists
    const courseResult = await query('SELECT title, section FROM courses WHERE id = $1', [id]);
    if (courseResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Course not found'
      });
    }

    const course = courseResult.rows[0];

    // Delete course (this will cascade delete student enrollments)
    await query('DELETE FROM courses WHERE id = $1', [id]);

    res.json({
      success: true,
      message: `Course "${course.title} - ${course.section}" deleted successfully`
    });
  } catch (error) {
    console.error('Delete course error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete course'
    });
  }
};

/**
 * Get students enrolled in a course
 */
const getCourseStudents = async (req, res) => {
  try {
    const { id } = req.params;

    // Check if course exists
    const courseResult = await query('SELECT title, section FROM courses WHERE id = $1', [id]);
    if (courseResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Course not found'
      });
    }

    // Get enrolled students
    const studentsResult = await query(`
      SELECT 
        u.id,
        u.name,
        u.username,
        u.email,
        u.student_id,
        sc.enrolled_at
      FROM users u
      JOIN student_courses sc ON u.id = sc.student_id
      WHERE sc.course_id = $1 AND u.is_active = true
      ORDER BY u.name
    `, [id]);

    res.json({
      success: true,
      data: {
        course: courseResult.rows[0],
        students: studentsResult.rows
      }
    });
  } catch (error) {
    console.error('Get course students error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get course students'
    });
  }
};

/**
 * Get students for faculty dashboard
 */
const getFacultyStudents = async (req, res) => {
  try {
    const facultyId = req.user.id;

    const studentsResult = await query(`
      SELECT DISTINCT
        u.id,
        u.name,
        u.email,
        u.student_id,
        c.title as course_name,
        c.section,
        me.recent_mood,
        me.last_mood_entry,
        CASE 
          WHEN me.mood_trend > 0 THEN 'improving'
          WHEN me.mood_trend < 0 THEN 'declining'
          ELSE 'stable'
        END as mood_trend
      FROM users u
      JOIN student_courses sc ON u.id = sc.student_id
      JOIN courses c ON sc.course_id = c.id
      LEFT JOIN (
        SELECT 
          student_id,
          AVG(mood_level) as recent_mood,
          MAX(entry_date) as last_mood_entry,
          CASE 
            WHEN COUNT(*) >= 3 THEN 
              (SELECT AVG(mood_level) FROM mood_entries me2 
               WHERE me2.student_id = me1.student_id 
               AND me2.entry_date >= CURRENT_DATE - INTERVAL '7 days') -
              (SELECT AVG(mood_level) FROM mood_entries me3 
               WHERE me3.student_id = me1.student_id 
               AND me3.entry_date >= CURRENT_DATE - INTERVAL '14 days'
               AND me3.entry_date < CURRENT_DATE - INTERVAL '7 days')
            ELSE 0
          END as mood_trend
        FROM mood_entries me1
        WHERE me1.entry_date >= CURRENT_DATE - INTERVAL '30 days'
        GROUP BY student_id
      ) me ON u.id = me.student_id
      WHERE c.faculty_id = $1 AND u.is_active = true
      ORDER BY u.name
    `, [facultyId]);

    res.json({
      success: true,
      data: studentsResult.rows
    });
  } catch (error) {
    console.error('Get faculty students error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get faculty students'
    });
  }
};

/**
 * Get courses for faculty dashboard
 */
const getFacultyCourses = async (req, res) => {
  try {
    const facultyId = req.user.id;

    const coursesResult = await query(`
      SELECT 
        c.id,
        c.title,
        c.section,
        COUNT(sc.student_id) as enrolled_count,
        AVG(me.mood_level) as avg_mood,
        COUNT(CASE WHEN me.mood_level < 4 THEN 1 END) as low_mood_students
      FROM courses c
      LEFT JOIN student_courses sc ON c.id = sc.course_id
      LEFT JOIN mood_entries me ON sc.student_id = me.student_id 
        AND me.entry_date >= CURRENT_DATE - INTERVAL '7 days'
      WHERE c.faculty_id = $1
      GROUP BY c.id, c.title, c.section
      ORDER BY c.title, c.section
    `, [facultyId]);

    res.json({
      success: true,
      data: coursesResult.rows
    });
  } catch (error) {
    console.error('Get faculty courses error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get faculty courses'
    });
  }
};

module.exports = {
  getAllUsers,
  getUserById,
  addFaculty,
  addConsultant,
  updateUserStatus,
  deleteUser,
  getUserStats,
  getAllCourses,
  createCourse,
  updateCourse,
  deleteCourse,
  getCourseStudents,
  getFacultyStudents,
  getFacultyCourses
};
