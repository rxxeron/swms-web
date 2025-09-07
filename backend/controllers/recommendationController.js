const { query, transaction } = require('../config/database');

/**
 * Create recommendation for student (faculty only)
 */
const createRecommendation = async (req, res) => {
  try {
    const facultyId = req.user.id;
    const { student_id, reason } = req.body;

    // Check if student exists and is in faculty's course
    const studentResult = await query(`
      SELECT DISTINCT u.id, u.name, u.student_id
      FROM users u
      JOIN student_courses sc ON u.id = sc.student_id
      JOIN courses c ON sc.course_id = c.id
      WHERE u.id = $1 AND c.faculty_id = $2 AND u.role = 'student' AND u.is_active = true
    `, [student_id, facultyId]);

    if (studentResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Student not found in your courses'
      });
    }

    // Check if student is in cooldown period
    const cooldownResult = await query(`
      SELECT id, cooldown_until
      FROM recommendations 
      WHERE student_id = $1 AND cooldown_until > CURRENT_TIMESTAMP
    `, [student_id]);

    if (cooldownResult.rows.length > 0) {
      return res.status(409).json({
        success: false,
        message: 'Student is in cooldown period and cannot be recommended again',
        cooldown_until: cooldownResult.rows[0].cooldown_until
      });
    }

    // Create recommendation
    const recommendationResult = await query(`
      INSERT INTO recommendations (student_id, faculty_id, recommendation_type, reason, status)
      VALUES ($1, $2, 'faculty', $3, 'pending')
      RETURNING id, student_id, faculty_id, recommendation_type, reason, status, created_at
    `, [student_id, facultyId, reason]);

    const recommendation = recommendationResult.rows[0];

    res.status(201).json({
      success: true,
      message: 'Recommendation created successfully',
      data: { recommendation }
    });
  } catch (error) {
    console.error('Create recommendation error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create recommendation'
    });
  }
};

/**
 * Get recommendations for student
 */
const getStudentRecommendations = async (req, res) => {
  try {
    const studentId = req.user.id;
    const { status, page = 1, limit = 10 } = req.query;
    const offset = (page - 1) * limit;

    let statusFilter = '';
    let queryParams = [studentId];
    let paramCount = 1;

    if (status) {
      paramCount++;
      statusFilter = 'AND r.status = $' + paramCount;
      queryParams.push(status);
    }

    paramCount++;
    queryParams.push(limit);
    paramCount++;
    queryParams.push(offset);

    const recommendationsResult = await query(`
      SELECT 
        r.id, r.recommendation_type, r.reason, r.status, r.created_at,
        CASE 
          WHEN r.recommendation_type = 'auto' THEN 'Auto-Recommended'
          ELSE f.name
        END as source_name,
        f.email as faculty_email
      FROM recommendations r
      LEFT JOIN users f ON r.faculty_id = f.id
      WHERE r.student_id = $1 ${statusFilter}
      ORDER BY r.created_at DESC
      LIMIT $${paramCount - 1} OFFSET $${paramCount}
    `, queryParams);

    // Get total count
    const countParams = queryParams.slice(0, paramCount - 2);
    const countResult = await query(`
      SELECT COUNT(*) as total
      FROM recommendations r
      WHERE r.student_id = $1 ${statusFilter}
    `, countParams);

    const total = parseInt(countResult.rows[0].total);
    const totalPages = Math.ceil(total / limit);

    res.json({
      success: true,
      data: {
        recommendations: recommendationsResult.rows,
        pagination: {
          currentPage: parseInt(page),
          totalPages,
          totalItems: total,
          itemsPerPage: parseInt(limit),
          hasNextPage: page < totalPages,
          hasPrevPage: page > 1
        }
      }
    });
  } catch (error) {
    console.error('Get student recommendations error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get recommendations'
    });
  }
};

/**
 * Get recommendations for consultant
 */
const getConsultantRecommendations = async (req, res) => {
  try {
    const { status = 'pending', page = 1, limit = 10 } = req.query;
    const offset = (page - 1) * limit;

    const recommendationsResult = await query(`
      SELECT 
        r.id, r.student_id, r.recommendation_type, r.reason, r.status, r.created_at,
        s.name as student_name, s.student_id as student_number, s.email as student_email,
        CASE 
          WHEN r.recommendation_type = 'auto' THEN 'Auto-Recommended'
          ELSE f.name
        END as source_name,
        f.email as faculty_email
      FROM recommendations r
      JOIN users s ON r.student_id = s.id
      LEFT JOIN users f ON r.faculty_id = f.id
      WHERE r.status = $1
      ORDER BY r.created_at DESC
      LIMIT $2 OFFSET $3
    `, [status, limit, offset]);

    // Get total count
    const countResult = await query(`
      SELECT COUNT(*) as total
      FROM recommendations r
      WHERE r.status = $1
    `, [status]);

    const total = parseInt(countResult.rows[0].total);
    const totalPages = Math.ceil(total / limit);

    res.json({
      success: true,
      data: {
        recommendations: recommendationsResult.rows,
        pagination: {
          currentPage: parseInt(page),
          totalPages,
          totalItems: total,
          itemsPerPage: parseInt(limit),
          hasNextPage: page < totalPages,
          hasPrevPage: page > 1
        }
      }
    });
  } catch (error) {
    console.error('Get consultant recommendations error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get recommendations'
    });
  }
};

/**
 * Update recommendation status
 */
const updateRecommendationStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const updateResult = await query(`
      UPDATE recommendations 
      SET status = $1, updated_at = CURRENT_TIMESTAMP
      WHERE id = $2
      RETURNING id, status, updated_at
    `, [status, id]);

    if (updateResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Recommendation not found'
      });
    }

    res.json({
      success: true,
      message: 'Recommendation status updated successfully',
      data: { recommendation: updateResult.rows[0] }
    });
  } catch (error) {
    console.error('Update recommendation status error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update recommendation status'
    });
  }
};

/**
 * Get recommendation details
 */
const getRecommendationById = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    const userRole = req.user.role;

    let recommendationQuery = `
      SELECT 
        r.id, r.student_id, r.faculty_id, r.consultant_id, r.recommendation_type, 
        r.reason, r.status, r.created_at, r.cooldown_until,
        s.name as student_name, s.student_id as student_number, s.email as student_email,
        CASE 
          WHEN r.recommendation_type = 'auto' THEN 'Auto-Recommended'
          ELSE f.name
        END as source_name,
        f.email as faculty_email,
        c.name as consultant_name, c.email as consultant_email
      FROM recommendations r
      JOIN users s ON r.student_id = s.id
      LEFT JOIN users f ON r.faculty_id = f.id
      LEFT JOIN users c ON r.consultant_id = c.id
      WHERE r.id = $1
    `;

    let queryParams = [id];

    // Add access control based on user role
    if (userRole === 'student') {
      recommendationQuery += ' AND r.student_id = $2';
      queryParams.push(userId);
    } else if (userRole === 'faculty') {
      recommendationQuery += ' AND r.faculty_id = $2';
      queryParams.push(userId);
    }
    // Consultants and admins can see all recommendations

    const recommendationResult = await query(recommendationQuery, queryParams);

    if (recommendationResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Recommendation not found'
      });
    }

    res.json({
      success: true,
      data: { recommendation: recommendationResult.rows[0] }
    });
  } catch (error) {
    console.error('Get recommendation by ID error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get recommendation'
    });
  }
};

/**
 * Get faculty's own recommendations
 */
const getFacultyRecommendations = async (req, res) => {
  try {
    const facultyId = req.user.id;
    const { status, page = 1, limit = 10 } = req.query;
    const offset = (page - 1) * limit;

    let statusFilter = '';
    let queryParams = [facultyId];
    let paramCount = 1;

    if (status) {
      paramCount++;
      statusFilter = 'AND r.status = $' + paramCount;
      queryParams.push(status);
    }

    paramCount++;
    queryParams.push(limit);
    paramCount++;
    queryParams.push(offset);

    const recommendationsResult = await query(`
      SELECT 
        r.id, r.student_id, r.recommendation_type, r.reason, r.status, r.created_at,
        s.name as student_name, s.student_id as student_number, s.email as student_email,
        c.name as consultant_name, 
        CASE 
          WHEN r.status = 'pending' THEN 'Awaiting Assignment'
          WHEN r.status = 'scheduled' THEN 'Consultation Scheduled'
          WHEN r.status = 'completed' THEN 'Consultation Completed'
          WHEN r.status = 'declined' THEN 'Student Declined'
          ELSE r.status
        END as status_description
      FROM recommendations r
      JOIN users s ON r.student_id = s.id
      LEFT JOIN users c ON r.consultant_id = c.id
      WHERE r.faculty_id = $1 ${statusFilter}
      ORDER BY r.created_at DESC
      LIMIT $${paramCount - 1} OFFSET $${paramCount}
    `, queryParams);

    // Get total count
    const countParams = queryParams.slice(0, paramCount - 2);
    const countResult = await query(`
      SELECT COUNT(*) as total
      FROM recommendations r
      WHERE r.faculty_id = $1 ${statusFilter}
    `, countParams);

    const total = parseInt(countResult.rows[0].total);
    const totalPages = Math.ceil(total / limit);

    res.json({
      success: true,
      data: {
        recommendations: recommendationsResult.rows,
        pagination: {
          currentPage: parseInt(page),
          totalPages,
          totalItems: total,
          itemsPerPage: parseInt(limit),
          hasNextPage: page < totalPages,
          hasPrevPage: page > 1
        }
      }
    });
  } catch (error) {
    console.error('Get faculty recommendations error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get faculty recommendations'
    });
  }
};

module.exports = {
  createRecommendation,
  getStudentRecommendations,
  getConsultantRecommendations,
  updateRecommendationStatus,
  getRecommendationById,
  getFacultyRecommendations
};
