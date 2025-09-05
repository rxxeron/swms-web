const bcrypt = require('bcryptjs');
const { query, transaction } = require('../config/database');
const { generateToken } = require('../config/jwt');
const { validatePasswordStrength } = require('../middleware/validation');

/**
 * User login
 */
const login = async (req, res) => {
  try {
    const { identifier, password } = req.body;

    // Find user by username or email
    const userResult = await query(
      `SELECT id, name, username, email, password_hash, role, student_id, is_active 
       FROM users 
       WHERE (username = $1 OR email = $1) AND is_active = true`,
      [identifier.toLowerCase()]
    );

    if (userResult.rows.length === 0) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }

    const user = userResult.rows[0];

    // Verify password
    const isValidPassword = await bcrypt.compare(password, user.password_hash);
    if (!isValidPassword) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }

    // Generate JWT token
    const token = generateToken({
      userId: user.id,
      username: user.username,
      email: user.email,
      role: user.role
    });

    // Remove sensitive data
    const { password_hash, ...userInfo } = user;

    res.json({
      success: true,
      message: 'Login successful',
      data: {
        user: userInfo,
        token
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      success: false,
      message: 'Login failed'
    });
  }
};

/**
 * Student registration
 */
const register = async (req, res) => {
  try {
    const { name, username, email, password, student_id, courses } = req.body;

    // Validate password strength
    const passwordValidation = validatePasswordStrength(password);
    if (!passwordValidation.isValid) {
      return res.status(400).json({
        success: false,
        message: 'Password does not meet requirements',
        errors: passwordValidation.issues
      });
    }

    // Check if username, email, or student_id already exists
    const existingUserResult = await query(
      `SELECT username, email, student_id 
       FROM users 
       WHERE username = $1 OR email = $2 OR student_id = $3`,
      [username.toLowerCase(), email.toLowerCase(), student_id]
    );

    if (existingUserResult.rows.length > 0) {
      const existing = existingUserResult.rows[0];
      let message = 'Registration failed. ';
      
      if (existing.username === username.toLowerCase()) {
        message += 'Username already exists.';
      } else if (existing.email === email.toLowerCase()) {
        message += 'Email already exists.';
      } else if (existing.student_id === student_id) {
        message += 'Student ID already exists.';
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
      // Insert user
      const userResult = await client.query(
        `INSERT INTO users (name, username, email, password_hash, role, student_id)
         VALUES ($1, $2, $3, $4, 'student', $5)
         RETURNING id, name, username, email, role, student_id, created_at`,
        [name, username.toLowerCase(), email.toLowerCase(), passwordHash, student_id]
      );

      const newUser = userResult.rows[0];

      // Insert courses and enroll student
      for (const course of courses) {
        // Check if course exists, if not create it
        let courseResult = await client.query(
          'SELECT id FROM courses WHERE title = $1 AND section = $2',
          [course.title, course.section]
        );

        let courseId;
        if (courseResult.rows.length === 0) {
          // Create new course (without faculty initially)
          const newCourseResult = await client.query(
            'INSERT INTO courses (title, section) VALUES ($1, $2) RETURNING id',
            [course.title, course.section]
          );
          courseId = newCourseResult.rows[0].id;
        } else {
          courseId = courseResult.rows[0].id;
        }

        // Enroll student in course
        await client.query(
          'INSERT INTO student_courses (student_id, course_id) VALUES ($1, $2)',
          [newUser.id, courseId]
        );
      }

      return newUser;
    });

    // Generate token for immediate login
    const token = generateToken({
      userId: result.id,
      username: result.username,
      email: result.email,
      role: result.role
    });

    res.status(201).json({
      success: true,
      message: 'Registration successful',
      data: {
        user: result,
        token
      }
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({
      success: false,
      message: 'Registration failed'
    });
  }
};

/**
 * Get current user profile
 */
const getProfile = async (req, res) => {
  try {
    const userId = req.user.id;

    let userQuery = `
      SELECT u.id, u.name, u.username, u.email, u.role, u.student_id, u.created_at
      FROM users u
      WHERE u.id = $1
    `;

    const userResult = await query(userQuery, [userId]);
    
    if (userResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    const user = userResult.rows[0];

    // If user is a student, also get their courses
    if (user.role === 'student') {
      const coursesResult = await query(
        `SELECT c.id, c.title, c.section, f.name as faculty_name
         FROM courses c
         LEFT JOIN users f ON c.faculty_id = f.id
         JOIN student_courses sc ON c.id = sc.course_id
         WHERE sc.student_id = $1
         ORDER BY c.title, c.section`,
        [userId]
      );

      user.courses = coursesResult.rows;
    }

    // If user is faculty, get their courses
    if (user.role === 'faculty') {
      const coursesResult = await query(
        `SELECT c.id, c.title, c.section,
         COUNT(sc.student_id) as student_count
         FROM courses c
         LEFT JOIN student_courses sc ON c.id = sc.course_id
         WHERE c.faculty_id = $1
         GROUP BY c.id, c.title, c.section
         ORDER BY c.title, c.section`,
        [userId]
      );

      user.courses = coursesResult.rows;
    }

    res.json({
      success: true,
      data: { user }
    });
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get user profile'
    });
  }
};

/**
 * Update user profile
 */
const updateProfile = async (req, res) => {
  try {
    const userId = req.user.id;
    const { name, email } = req.body;

    // Check if email is already taken by another user
    if (email) {
      const existingUserResult = await query(
        'SELECT id FROM users WHERE email = $1 AND id != $2',
        [email.toLowerCase(), userId]
      );

      if (existingUserResult.rows.length > 0) {
        return res.status(409).json({
          success: false,
          message: 'Email already exists'
        });
      }
    }

    // Update user
    const updateResult = await query(
      `UPDATE users 
       SET name = COALESCE($1, name), 
           email = COALESCE($2, email),
           updated_at = CURRENT_TIMESTAMP
       WHERE id = $3
       RETURNING id, name, username, email, role, student_id, updated_at`,
      [name, email?.toLowerCase(), userId]
    );

    if (updateResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    res.json({
      success: true,
      message: 'Profile updated successfully',
      data: { user: updateResult.rows[0] }
    });
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update profile'
    });
  }
};

/**
 * Change password
 */
const changePassword = async (req, res) => {
  try {
    const userId = req.user.id;
    const { currentPassword, newPassword } = req.body;

    // Get user's current password hash
    const userResult = await query(
      'SELECT password_hash FROM users WHERE id = $1',
      [userId]
    );

    if (userResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Verify current password
    const isValidPassword = await bcrypt.compare(currentPassword, userResult.rows[0].password_hash);
    if (!isValidPassword) {
      return res.status(400).json({
        success: false,
        message: 'Current password is incorrect'
      });
    }

    // Validate new password strength
    const passwordValidation = validatePasswordStrength(newPassword);
    if (!passwordValidation.isValid) {
      return res.status(400).json({
        success: false,
        message: 'New password does not meet requirements',
        errors: passwordValidation.issues
      });
    }

    // Hash new password
    const saltRounds = 12;
    const newPasswordHash = await bcrypt.hash(newPassword, saltRounds);

    // Update password
    await query(
      'UPDATE users SET password_hash = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2',
      [newPasswordHash, userId]
    );

    res.json({
      success: true,
      message: 'Password changed successfully'
    });
  } catch (error) {
    console.error('Change password error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to change password'
    });
  }
};

/**
 * Logout (client-side token invalidation)
 */
const logout = async (req, res) => {
  res.json({
    success: true,
    message: 'Logout successful'
  });
};

module.exports = {
  login,
  register,
  getProfile,
  updateProfile,
  changePassword,
  logout
};
