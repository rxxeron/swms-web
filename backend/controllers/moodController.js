const { query, transaction } = require('../config/database');
const { startOfDay, endOfDay, subDays, format } = require('date-fns');

/**
 * Add mood entry for student
 */
const addMoodEntry = async (req, res) => {
  try {
    const studentId = req.user.id;
    const { mood_level, notes, entry_date } = req.body;

    // Use provided date or current date
    const entryDate = entry_date ? new Date(entry_date) : new Date();
    const dateOnly = format(entryDate, 'yyyy-MM-dd');

    // Check if student already has an entry for this date
    const existingEntryResult = await query(
      'SELECT id FROM mood_entries WHERE student_id = $1 AND entry_date = $2',
      [studentId, dateOnly]
    );

    if (existingEntryResult.rows.length > 0) {
      return res.status(409).json({
        success: false,
        message: 'You have already submitted a mood entry for this date'
      });
    }

    // Use transaction to handle mood entry and potential auto-recommendation
    const result = await transaction(async (client) => {
      // Insert mood entry
      const moodEntryResult = await client.query(
        `INSERT INTO mood_entries (student_id, mood_level, notes, entry_date)
         VALUES ($1, $2, $3, $4)
         RETURNING id, student_id, mood_level, notes, entry_date, created_at`,
        [studentId, mood_level, notes, dateOnly]
      );

      const moodEntry = moodEntryResult.rows[0];

      // Auto-recommend if mood is below 4
      let autoRecommendation = null;
      if (mood_level < 4) {
        // Check if student already has a pending or recent recommendation
        const existingRecommendationResult = await client.query(
          `SELECT id FROM recommendations 
           WHERE student_id = $1 
           AND (status IN ('pending', 'scheduled') 
                OR (recommendation_type = 'auto' AND created_at >= CURRENT_DATE - INTERVAL '7 days'))`,
          [studentId]
        );

        if (existingRecommendationResult.rows.length === 0) {
          // Create auto-recommendation
          const recommendationResult = await client.query(
            `INSERT INTO recommendations (student_id, recommendation_type, reason, status)
             VALUES ($1, 'auto', $2, 'pending')
             RETURNING id, student_id, recommendation_type, reason, status, created_at`,
            [studentId, `Auto-recommended due to low mood level (${mood_level}/10) on ${dateOnly}`]
          );

          autoRecommendation = recommendationResult.rows[0];
        }
      }

      return { moodEntry, autoRecommendation };
    });

    res.status(201).json({
      success: true,
      message: 'Mood entry added successfully',
      data: result
    });
  } catch (error) {
    console.error('Add mood entry error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to add mood entry'
    });
  }
};

/**
 * Get mood entries for student with date filtering
 */
const getMoodEntries = async (req, res) => {
  try {
    const studentId = req.user.id;
    const { period, start_date, end_date, page = 1, limit = 50 } = req.query;
    const offset = (page - 1) * limit;

    let dateFilter = '';
    let queryParams = [studentId];
    let paramCount = 1;

    // Handle different period filters
    if (period) {
      switch (period) {
        case 'today':
          paramCount++;
          dateFilter = 'AND entry_date = CURRENT_DATE';
          break;
        case '7days':
          paramCount++;
          dateFilter = 'AND entry_date >= CURRENT_DATE - INTERVAL \'7 days\'';
          break;
        case '30days':
          paramCount++;
          dateFilter = 'AND entry_date >= CURRENT_DATE - INTERVAL \'30 days\'';
          break;
        case '90days':
          paramCount++;
          dateFilter = 'AND entry_date >= CURRENT_DATE - INTERVAL \'90 days\'';
          break;
      }
    } else if (start_date && end_date) {
      paramCount++;
      queryParams.push(start_date);
      paramCount++;
      queryParams.push(end_date);
      dateFilter = `AND entry_date BETWEEN $${paramCount - 1} AND $${paramCount}`;
    } else if (start_date) {
      paramCount++;
      queryParams.push(start_date);
      dateFilter = `AND entry_date >= $${paramCount}`;
    } else if (end_date) {
      paramCount++;
      queryParams.push(end_date);
      dateFilter = `AND entry_date <= $${paramCount}`;
    }

    // Get mood entries with pagination
    paramCount++;
    queryParams.push(limit);
    paramCount++;
    queryParams.push(offset);

    const moodEntriesQuery = `
      SELECT id, mood_level, notes, entry_date, created_at
      FROM mood_entries
      WHERE student_id = $1 ${dateFilter}
      ORDER BY entry_date DESC, created_at DESC
      LIMIT $${paramCount - 1} OFFSET $${paramCount}
    `;

    const entriesResult = await query(moodEntriesQuery, queryParams);

    // Get statistics for the same period
    const statsQuery = `
      SELECT 
        COUNT(*) as total_entries,
        AVG(mood_level) as average_mood,
        MIN(mood_level) as min_mood,
        MAX(mood_level) as max_mood,
        COUNT(CASE WHEN mood_level < 4 THEN 1 END) as low_mood_count,
        COUNT(CASE WHEN mood_level >= 7 THEN 1 END) as high_mood_count
      FROM mood_entries
      WHERE student_id = $1 ${dateFilter}
    `;

    const statsParams = queryParams.slice(0, paramCount - 2); // Remove limit and offset
    const statsResult = await query(statsQuery, statsParams);

    // Get total count for pagination
    const countQuery = `
      SELECT COUNT(*) as total
      FROM mood_entries
      WHERE student_id = $1 ${dateFilter}
    `;

    const countResult = await query(countQuery, statsParams);
    const total = parseInt(countResult.rows[0].total);

    // Calculate pagination info
    const totalPages = Math.ceil(total / limit);
    const hasNextPage = page < totalPages;
    const hasPrevPage = page > 1;

    res.json({
      success: true,
      data: {
        entries: entriesResult.rows,
        statistics: statsResult.rows[0],
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
    console.error('Get mood entries error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get mood entries'
    });
  }
};

/**
 * Get mood entry for specific date
 */
const getMoodEntryByDate = async (req, res) => {
  try {
    const studentId = req.user.id;
    const { date } = req.params;

    const entryResult = await query(
      `SELECT id, mood_level, notes, entry_date, created_at
       FROM mood_entries
       WHERE student_id = $1 AND entry_date = $2`,
      [studentId, date]
    );

    if (entryResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'No mood entry found for this date'
      });
    }

    res.json({
      success: true,
      data: { entry: entryResult.rows[0] }
    });
  } catch (error) {
    console.error('Get mood entry by date error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get mood entry'
    });
  }
};

/**
 * Update mood entry (only for today's entry)
 */
const updateMoodEntry = async (req, res) => {
  try {
    const studentId = req.user.id;
    const { id } = req.params;
    const { mood_level, notes } = req.body;

    // Check if entry exists and belongs to student
    const entryResult = await query(
      'SELECT id, entry_date FROM mood_entries WHERE id = $1 AND student_id = $2',
      [id, studentId]
    );

    if (entryResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Mood entry not found'
      });
    }

    const entry = entryResult.rows[0];
    const today = format(new Date(), 'yyyy-MM-dd');

    // Only allow updating today's entry
    if (entry.entry_date !== today) {
      return res.status(403).json({
        success: false,
        message: 'You can only update today\'s mood entry'
      });
    }

    // Update entry
    const updateResult = await query(
      `UPDATE mood_entries 
       SET mood_level = COALESCE($1, mood_level), 
           notes = COALESCE($2, notes)
       WHERE id = $3
       RETURNING id, mood_level, notes, entry_date, created_at`,
      [mood_level, notes, id]
    );

    res.json({
      success: true,
      message: 'Mood entry updated successfully',
      data: { entry: updateResult.rows[0] }
    });
  } catch (error) {
    console.error('Update mood entry error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update mood entry'
    });
  }
};

/**
 * Delete mood entry (only for today's entry)
 */
const deleteMoodEntry = async (req, res) => {
  try {
    const studentId = req.user.id;
    const { id } = req.params;

    // Check if entry exists and belongs to student
    const entryResult = await query(
      'SELECT id, entry_date FROM mood_entries WHERE id = $1 AND student_id = $2',
      [id, studentId]
    );

    if (entryResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Mood entry not found'
      });
    }

    const entry = entryResult.rows[0];
    const today = format(new Date(), 'yyyy-MM-dd');

    // Only allow deleting today's entry
    if (entry.entry_date !== today) {
      return res.status(403).json({
        success: false,
        message: 'You can only delete today\'s mood entry'
      });
    }

    // Delete entry
    await query('DELETE FROM mood_entries WHERE id = $1', [id]);

    res.json({
      success: true,
      message: 'Mood entry deleted successfully'
    });
  } catch (error) {
    console.error('Delete mood entry error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete mood entry'
    });
  }
};

/**
 * Get mood statistics for faculty (their students)
 */
const getFacultyMoodStats = async (req, res) => {
  try {
    const facultyId = req.user.id;

    // Get mood stats for all students in faculty's courses
    const statsResult = await query(`
      SELECT 
        c.id as course_id,
        c.title as course_title,
        c.section,
        COUNT(DISTINCT sc.student_id) as total_students,
        COUNT(me.id) as total_mood_entries,
        AVG(me.mood_level) as overall_avg_mood,
        AVG(CASE WHEN me.entry_date >= CURRENT_DATE - INTERVAL '7 days' THEN me.mood_level END) as avg_mood_7d,
        AVG(CASE WHEN me.entry_date >= CURRENT_DATE - INTERVAL '30 days' THEN me.mood_level END) as avg_mood_30d,
        COUNT(CASE WHEN me.entry_date >= CURRENT_DATE - INTERVAL '7 days' AND me.mood_level < 4 THEN 1 END) as low_mood_count_7d
      FROM courses c
      LEFT JOIN student_courses sc ON c.id = sc.course_id
      LEFT JOIN mood_entries me ON sc.student_id = me.student_id
      WHERE c.faculty_id = $1
      GROUP BY c.id, c.title, c.section
      ORDER BY c.title, c.section
    `, [facultyId]);

    res.json({
      success: true,
      data: { courseStats: statsResult.rows }
    });
  } catch (error) {
    console.error('Get faculty mood stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get mood statistics'
    });
  }
};

/**
 * Get vulnerable students for faculty
 */
const getVulnerableStudents = async (req, res) => {
  try {
    const facultyId = req.user.id;

    const vulnerableStudentsResult = await query(`
      SELECT 
        u.id,
        u.name,
        u.student_id,
        u.email,
        c.title as course_title,
        c.section,
        AVG(me.mood_level) as avg_mood_7d,
        MAX(me.entry_date) as last_entry_date,
        COUNT(me.id) as entry_count_7d,
        CASE WHEN r.cooldown_until IS NOT NULL AND r.cooldown_until > CURRENT_TIMESTAMP 
             THEN true ELSE false END as in_cooldown,
        r.cooldown_until
      FROM users u
      JOIN student_courses sc ON u.id = sc.student_id
      JOIN courses c ON sc.course_id = c.id
      LEFT JOIN mood_entries me ON u.id = me.student_id 
        AND me.entry_date >= CURRENT_DATE - INTERVAL '7 days'
      LEFT JOIN recommendations r ON u.id = r.student_id 
        AND r.cooldown_until > CURRENT_TIMESTAMP
      WHERE c.faculty_id = $1 
        AND u.role = 'student' 
        AND u.is_active = true
      GROUP BY u.id, u.name, u.student_id, u.email, c.title, c.section, r.cooldown_until
      HAVING AVG(me.mood_level) < 4 AND COUNT(me.id) > 0
      ORDER BY AVG(me.mood_level) ASC, u.name
    `, [facultyId]);

    res.json({
      success: true,
      data: { vulnerableStudents: vulnerableStudentsResult.rows }
    });
  } catch (error) {
    console.error('Get vulnerable students error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get vulnerable students'
    });
  }
};

module.exports = {
  addMoodEntry,
  getMoodEntries,
  getMoodEntryByDate,
  updateMoodEntry,
  deleteMoodEntry,
  getFacultyMoodStats,
  getVulnerableStudents
};
