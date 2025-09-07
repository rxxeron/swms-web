const { query, transaction } = require('../config/database');
const { format, parseISO, isAfter, isBefore, addDays } = require('date-fns');

/**
 * Create appointment request (student)
 */
const createAppointment = async (req, res) => {
  try {
    const studentId = req.user.id;
    const { consultant_id, appointment_date, appointment_time, student_notes, recommendation_id } = req.body;

    // Validate consultant exists
    const consultantResult = await query(
      'SELECT id, name FROM users WHERE id = $1 AND role = \'consultant\' AND is_active = true',
      [consultant_id]
    );

    if (consultantResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Consultant not found'
      });
    }

    // Check for appointment conflicts
    const conflictResult = await query(`
      SELECT id FROM appointments 
      WHERE consultant_id = $1 
        AND appointment_date = $2 
        AND appointment_time = $3 
        AND status IN ('pending', 'confirmed')
    `, [consultant_id, appointment_date, appointment_time]);

    if (conflictResult.rows.length > 0) {
      return res.status(409).json({
        success: false,
        message: 'This time slot is already booked'
      });
    }

    // Create appointment
    const appointmentResult = await query(`
      INSERT INTO appointments (
        student_id, consultant_id, recommendation_id, 
        appointment_date, appointment_time, student_notes, 
        requested_by, status
      )
      VALUES ($1, $2, $3, $4, $5, $6, 'student', 'pending')
      RETURNING id, student_id, consultant_id, recommendation_id, 
                appointment_date, appointment_time, student_notes, 
                requested_by, status, created_at
    `, [studentId, consultant_id, recommendation_id, appointment_date, appointment_time, student_notes]);

    const appointment = appointmentResult.rows[0];

    res.status(201).json({
      success: true,
      message: 'Appointment request created successfully',
      data: { appointment }
    });
  } catch (error) {
    console.error('Create appointment error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create appointment request'
    });
  }
};

/**
 * Schedule appointment from recommendation (consultant)
 */
const scheduleAppointmentFromRecommendation = async (req, res) => {
  try {
    const consultantId = req.user.id;
    const { recommendation_id, appointment_date, appointment_time, consultant_notes } = req.body;

    // Validate recommendation exists and is pending
    const recommendationResult = await query(`
      SELECT r.id, r.student_id, r.status, s.name as student_name
      FROM recommendations r
      JOIN users s ON r.student_id = s.id
      WHERE r.id = $1 AND r.status = 'pending'
    `, [recommendation_id]);

    if (recommendationResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Recommendation not found or already processed'
      });
    }

    const recommendation = recommendationResult.rows[0];

    // Check for appointment conflicts
    const conflictResult = await query(`
      SELECT id FROM appointments 
      WHERE consultant_id = $1 
        AND appointment_date = $2 
        AND appointment_time = $3 
        AND status IN ('pending', 'confirmed')
    `, [consultantId, appointment_date, appointment_time]);

    if (conflictResult.rows.length > 0) {
      return res.status(409).json({
        success: false,
        message: 'This time slot is already booked'
      });
    }

    // Use transaction to create appointment and update recommendation
    const result = await transaction(async (client) => {
      // Create appointment
      const appointmentResult = await client.query(`
        INSERT INTO appointments (
          student_id, consultant_id, recommendation_id, 
          appointment_date, appointment_time, consultant_notes, 
          requested_by, status
        )
        VALUES ($1, $2, $3, $4, $5, $6, 'consultant', 'pending')
        RETURNING id, student_id, consultant_id, recommendation_id, 
                  appointment_date, appointment_time, consultant_notes, 
                  requested_by, status, created_at
      `, [recommendation.student_id, consultantId, recommendation_id, appointment_date, appointment_time, consultant_notes]);

      // Update recommendation status and assign consultant
      await client.query(`
        UPDATE recommendations 
        SET status = 'scheduled', consultant_id = $1
        WHERE id = $2
      `, [consultantId, recommendation_id]);

      return appointmentResult.rows[0];
    });

    res.status(201).json({
      success: true,
      message: 'Appointment scheduled successfully',
      data: { appointment: result }
    });
  } catch (error) {
    console.error('Schedule appointment from recommendation error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to schedule appointment'
    });
  }
};

/**
 * Respond to appointment (student)
 */
const respondToAppointment = async (req, res) => {
  try {
    const studentId = req.user.id;
    const { id } = req.params;
    const { status, counter_proposal_date, counter_proposal_time, student_notes } = req.body;

    // Validate appointment exists and belongs to student
    const appointmentResult = await query(`
      SELECT id, student_id, consultant_id, recommendation_id, status as current_status
      FROM appointments 
      WHERE id = $1 AND student_id = $2
    `, [id, studentId]);

    if (appointmentResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Appointment not found'
      });
    }

    const appointment = appointmentResult.rows[0];

    if (appointment.current_status !== 'pending') {
      return res.status(400).json({
        success: false,
        message: 'Appointment has already been responded to'
      });
    }

    // Use transaction to handle response and potential cooldown
    const result = await transaction(async (client) => {
      if (status === 'confirmed') {
        // Confirm appointment
        const updateResult = await client.query(`
          UPDATE appointments 
          SET status = 'confirmed', 
              student_notes = COALESCE($1, student_notes),
              updated_at = CURRENT_TIMESTAMP
          WHERE id = $2
          RETURNING id, status, updated_at
        `, [student_notes, id]);

        // Set cooldown period if this was from a recommendation
        if (appointment.recommendation_id) {
          const cooldownDate = format(addDays(new Date(), 7), 'yyyy-MM-dd HH:mm:ss');
          await client.query(`
            UPDATE recommendations 
            SET cooldown_until = $1
            WHERE id = $2
          `, [cooldownDate, appointment.recommendation_id]);
        }

        return updateResult.rows[0];
      } else if (status === 'declined') {
        // Decline appointment and potentially suggest new time
        const updateResult = await client.query(`
          UPDATE appointments 
          SET status = 'declined',
              counter_proposal_date = $1,
              counter_proposal_time = $2,
              student_notes = COALESCE($3, student_notes),
              updated_at = CURRENT_TIMESTAMP
          WHERE id = $4
          RETURNING id, status, counter_proposal_date, counter_proposal_time, updated_at
        `, [counter_proposal_date, counter_proposal_time, student_notes, id]);

        // Reset recommendation status to pending if declined
        if (appointment.recommendation_id) {
          await client.query(`
            UPDATE recommendations 
            SET status = 'pending'
            WHERE id = $1
          `, [appointment.recommendation_id]);
        }

        return updateResult.rows[0];
      }
    });

    res.json({
      success: true,
      message: `Appointment ${status} successfully`,
      data: { appointment: result }
    });
  } catch (error) {
    console.error('Respond to appointment error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to respond to appointment'
    });
  }
};

/**
 * Get appointments for student
 */
const getStudentAppointments = async (req, res) => {
  try {
    const studentId = req.user.id;
    const { status, page = 1, limit = 10 } = req.query;
    const offset = (page - 1) * limit;

    let statusFilter = '';
    let queryParams = [studentId];
    let paramCount = 1;

    if (status) {
      paramCount++;
      statusFilter = 'AND a.status = $' + paramCount;
      queryParams.push(status);
    }

    paramCount++;
    queryParams.push(limit);
    paramCount++;
    queryParams.push(offset);

    const appointmentsResult = await query(`
      SELECT 
        a.id, a.appointment_date, a.appointment_time, a.status, 
        a.student_notes, a.consultant_notes, a.requested_by, a.created_at,
        a.counter_proposal_date, a.counter_proposal_time,
        c.name as consultant_name, c.email as consultant_email,
        r.recommendation_type, r.reason as recommendation_reason
      FROM appointments a
      JOIN users c ON a.consultant_id = c.id
      LEFT JOIN recommendations r ON a.recommendation_id = r.id
      WHERE a.student_id = $1 ${statusFilter}
      ORDER BY a.appointment_date DESC, a.appointment_time DESC
      LIMIT $${paramCount - 1} OFFSET $${paramCount}
    `, queryParams);

    // Get total count
    const countParams = queryParams.slice(0, paramCount - 2);
    const countResult = await query(`
      SELECT COUNT(*) as total
      FROM appointments a
      WHERE a.student_id = $1 ${statusFilter}
    `, countParams);

    const total = parseInt(countResult.rows[0].total);
    const totalPages = Math.ceil(total / limit);

    res.json({
      success: true,
      data: {
        appointments: appointmentsResult.rows,
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
    console.error('Get student appointments error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get appointments'
    });
  }
};

/**
 * Get appointments for consultant
 */
const getConsultantAppointments = async (req, res) => {
  try {
    const consultantId = req.user.id;
    const { status, date, page = 1, limit = 10 } = req.query;
    const offset = (page - 1) * limit;

    let filters = ['a.consultant_id = $1'];
    let queryParams = [consultantId];
    let paramCount = 1;

    if (status) {
      paramCount++;
      filters.push(`a.status = $${paramCount}`);
      queryParams.push(status);
    }

    if (date) {
      paramCount++;
      filters.push(`a.appointment_date = $${paramCount}`);
      queryParams.push(date);
    }

    const whereClause = filters.join(' AND ');

    paramCount++;
    queryParams.push(limit);
    paramCount++;
    queryParams.push(offset);

    const appointmentsResult = await query(`
      SELECT 
        a.id, a.appointment_date, a.appointment_time, a.status, 
        a.student_notes, a.consultant_notes, a.requested_by, a.created_at,
        a.counter_proposal_date, a.counter_proposal_time,
        s.name as student_name, s.student_id as student_number, s.email as student_email,
        r.recommendation_type, r.reason as recommendation_reason
      FROM appointments a
      JOIN users s ON a.student_id = s.id
      LEFT JOIN recommendations r ON a.recommendation_id = r.id
      WHERE ${whereClause}
      ORDER BY a.appointment_date ASC, a.appointment_time ASC
      LIMIT $${paramCount - 1} OFFSET $${paramCount}
    `, queryParams);

    // Get total count
    const countParams = queryParams.slice(0, paramCount - 2);
    const countResult = await query(`
      SELECT COUNT(*) as total
      FROM appointments a
      WHERE ${whereClause}
    `, countParams);

    const total = parseInt(countResult.rows[0].total);
    const totalPages = Math.ceil(total / limit);

    res.json({
      success: true,
      data: {
        appointments: appointmentsResult.rows,
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
    console.error('Get consultant appointments error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get appointments'
    });
  }
};

/**
 * Update appointment (consultant)
 */
const updateAppointment = async (req, res) => {
  try {
    const consultantId = req.user.id;
    const { id } = req.params;
    const { status, consultant_notes, appointment_date, appointment_time } = req.body;

    // Validate appointment exists and belongs to consultant
    const appointmentResult = await query(`
      SELECT id, consultant_id, current_status
      FROM appointments 
      WHERE id = $1 AND consultant_id = $2
    `, [id, consultantId]);

    if (appointmentResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Appointment not found'
      });
    }

    // Check for conflicts if rescheduling
    if (appointment_date && appointment_time) {
      const conflictResult = await query(`
        SELECT id FROM appointments 
        WHERE consultant_id = $1 
          AND appointment_date = $2 
          AND appointment_time = $3 
          AND status IN ('pending', 'confirmed')
          AND id != $4
      `, [consultantId, appointment_date, appointment_time, id]);

      if (conflictResult.rows.length > 0) {
        return res.status(409).json({
          success: false,
          message: 'This time slot is already booked'
        });
      }
    }

    // Update appointment
    const updateResult = await query(`
      UPDATE appointments 
      SET status = COALESCE($1, status),
          consultant_notes = COALESCE($2, consultant_notes),
          appointment_date = COALESCE($3, appointment_date),
          appointment_time = COALESCE($4, appointment_time),
          updated_at = CURRENT_TIMESTAMP
      WHERE id = $5
      RETURNING id, status, consultant_notes, appointment_date, appointment_time, updated_at
    `, [status, consultant_notes, appointment_date, appointment_time, id]);

    res.json({
      success: true,
      message: 'Appointment updated successfully',
      data: { appointment: updateResult.rows[0] }
    });
  } catch (error) {
    console.error('Update appointment error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update appointment'
    });
  }
};

/**
 * Get available time slots for consultant
 */
const getAvailableTimeSlots = async (req, res) => {
  try {
    const { consultant_id, date } = req.query;

    if (!consultant_id || !date) {
      return res.status(400).json({
        success: false,
        message: 'Consultant ID and date are required'
      });
    }

    // Get booked time slots
    const bookedSlotsResult = await query(`
      SELECT appointment_time 
      FROM appointments 
      WHERE consultant_id = $1 
        AND appointment_date = $2 
        AND status IN ('pending', 'confirmed')
    `, [consultant_id, date]);

    const bookedTimes = bookedSlotsResult.rows.map(row => row.appointment_time);

    // Generate available time slots (9 AM to 5 PM, 30-minute intervals)
    const allTimeSlots = [];
    for (let hour = 9; hour < 17; hour++) {
      for (let minute = 0; minute < 60; minute += 30) {
        const timeSlot = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
        if (!bookedTimes.includes(timeSlot)) {
          allTimeSlots.push(timeSlot);
        }
      }
    }

    res.json({
      success: true,
      data: { availableTimeSlots: allTimeSlots }
    });
  } catch (error) {
    console.error('Get available time slots error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get available time slots'
    });
  }
};

/**
 * Get all appointments for admin with filtering (admin only)
 */
const getAllAppointments = async (req, res) => {
  try {
    const { status, consultant_id, student_id, date_from, date_to, page = 1, limit = 50 } = req.query;
    
    let whereConditions = [];
    let queryParams = [];
    let paramCount = 0;

    // Build WHERE conditions
    if (status && status !== 'all') {
      paramCount++;
      whereConditions.push(`a.status = $${paramCount}`);
      queryParams.push(status);
    }

    if (consultant_id) {
      paramCount++;
      whereConditions.push(`a.consultant_id = $${paramCount}`);
      queryParams.push(consultant_id);
    }

    if (student_id) {
      paramCount++;
      whereConditions.push(`a.student_id = $${paramCount}`);
      queryParams.push(student_id);
    }

    if (date_from) {
      paramCount++;
      whereConditions.push(`a.appointment_date >= $${paramCount}`);
      queryParams.push(date_from);
    }

    if (date_to) {
      paramCount++;
      whereConditions.push(`a.appointment_date <= $${paramCount}`);
      queryParams.push(date_to);
    }

    const whereClause = whereConditions.length > 0 ? 'WHERE ' + whereConditions.join(' AND ') : '';

    // Get total count
    const countQuery = `
      SELECT COUNT(*) as total
      FROM appointments a
      ${whereClause}
    `;
    const countResult = await query(countQuery, queryParams);
    const total = parseInt(countResult.rows[0].total);

    // Calculate pagination
    const offset = (page - 1) * limit;
    paramCount++;
    queryParams.push(limit);
    paramCount++;
    queryParams.push(offset);

    // Get appointments with user details
    const appointmentsQuery = `
      SELECT 
        a.id,
        a.appointment_date,
        a.appointment_time,
        a.status,
        a.student_notes,
        a.consultant_notes,
        a.requested_by,
        a.created_at,
        a.updated_at,
        a.counter_proposal_date,
        a.counter_proposal_time,
        s.name as student_name,
        s.username as student_username,
        s.email as student_email,
        s.student_id,
        c.name as consultant_name,
        c.username as consultant_username,
        c.email as consultant_email
      FROM appointments a
      LEFT JOIN users s ON a.student_id = s.id
      LEFT JOIN users c ON a.consultant_id = c.id
      ${whereClause}
      ORDER BY a.appointment_date DESC, a.appointment_time DESC
      LIMIT $${paramCount - 1} OFFSET $${paramCount}
    `;

    const appointmentsResult = await query(appointmentsQuery, queryParams);

    // Calculate pagination info
    const totalPages = Math.ceil(total / limit);
    const hasNextPage = page < totalPages;
    const hasPrevPage = page > 1;

    res.json({
      success: true,
      data: {
        appointments: appointmentsResult.rows,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          totalPages,
          hasNextPage,
          hasPrevPage
        }
      }
    });
  } catch (error) {
    console.error('Get appointments error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get appointments'
    });
  }
};

/**
 * Create appointment (admin only)
 */
const createAppointmentAdmin = async (req, res) => {
  try {
    const { student_id, consultant_id, appointment_date, appointment_time, student_notes, requested_by } = req.body;

    // Validate that student and consultant exist and have correct roles
    const studentResult = await query(
      'SELECT id, name FROM users WHERE id = $1 AND role = $2 AND is_active = true',
      [student_id, 'student']
    );

    if (studentResult.rows.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Invalid student selected'
      });
    }

    const consultantResult = await query(
      'SELECT id, name FROM users WHERE id = $1 AND role = $2 AND is_active = true',
      [consultant_id, 'consultant']
    );

    if (consultantResult.rows.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Invalid consultant selected'
      });
    }

    // Check for conflicting appointments (same consultant, same date/time)
    const conflictResult = await query(
      `SELECT id FROM appointments 
       WHERE consultant_id = $1 AND appointment_date = $2 AND appointment_time = $3 
       AND status IN ('pending', 'confirmed')`,
      [consultant_id, appointment_date, appointment_time]
    );

    if (conflictResult.rows.length > 0) {
      return res.status(409).json({
        success: false,
        message: 'This time slot is already booked with the selected consultant'
      });
    }

    // Create appointment
    const appointmentResult = await query(
      `INSERT INTO appointments 
       (student_id, consultant_id, appointment_date, appointment_time, student_notes, requested_by, status)
       VALUES ($1, $2, $3, $4, $5, $6, 'pending')
       RETURNING *`,
      [student_id, consultant_id, appointment_date, appointment_time, student_notes || null, requested_by || 'admin']
    );

    res.status(201).json({
      success: true,
      message: 'Appointment created successfully',
      data: { appointment: appointmentResult.rows[0] }
    });
  } catch (error) {
    console.error('Create appointment error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create appointment'
    });
  }
};

/**
 * Update appointment status (admin only)
 */
const updateAppointmentStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, consultant_notes, counter_proposal_date, counter_proposal_time } = req.body;

    // Check if appointment exists
    const appointmentResult = await query('SELECT * FROM appointments WHERE id = $1', [id]);
    if (appointmentResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Appointment not found'
      });
    }

    // Build update fields
    let updateFields = ['status = $2', 'updated_at = CURRENT_TIMESTAMP'];
    let updateParams = [id, status];
    let paramCount = 2;

    if (consultant_notes !== undefined) {
      paramCount++;
      updateFields.push(`consultant_notes = $${paramCount}`);
      updateParams.push(consultant_notes);
    }

    if (counter_proposal_date !== undefined) {
      paramCount++;
      updateFields.push(`counter_proposal_date = $${paramCount}`);
      updateParams.push(counter_proposal_date);
    }

    if (counter_proposal_time !== undefined) {
      paramCount++;
      updateFields.push(`counter_proposal_time = $${paramCount}`);
      updateParams.push(counter_proposal_time);
    }

    // Update appointment
    const updateQuery = `
      UPDATE appointments 
      SET ${updateFields.join(', ')}
      WHERE id = $1
      RETURNING *
    `;

    const updatedAppointment = await query(updateQuery, updateParams);

    res.json({
      success: true,
      message: 'Appointment updated successfully',
      data: { appointment: updatedAppointment.rows[0] }
    });
  } catch (error) {
    console.error('Update appointment error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update appointment'
    });
  }
};

/**
 * Delete appointment (admin only)
 */
const deleteAppointmentAdmin = async (req, res) => {
  try {
    const { id } = req.params;

    // Check if appointment exists
    const appointmentResult = await query(
      `SELECT a.*, s.name as student_name, c.name as consultant_name
       FROM appointments a
       LEFT JOIN users s ON a.student_id = s.id
       LEFT JOIN users c ON a.consultant_id = c.id
       WHERE a.id = $1`,
      [id]
    );

    if (appointmentResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Appointment not found'
      });
    }

    const appointment = appointmentResult.rows[0];

    // Delete appointment
    await query('DELETE FROM appointments WHERE id = $1', [id]);

    res.json({
      success: true,
      message: `Appointment between ${appointment.student_name} and ${appointment.consultant_name} deleted successfully`
    });
  } catch (error) {
    console.error('Delete appointment error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete appointment'
    });
  }
};

/**
 * Get appointment statistics (admin only)
 */
const getAppointmentStats = async (req, res) => {
  try {
    // Get status distribution
    const statusStatsResult = await query(`
      SELECT 
        status,
        COUNT(*) as count
      FROM appointments 
      WHERE appointment_date >= CURRENT_DATE - INTERVAL '30 days'
      GROUP BY status
      ORDER BY count DESC
    `);

    // Get consultant performance
    const consultantStatsResult = await query(`
      SELECT 
        c.name as consultant_name,
        COUNT(*) as total_appointments,
        COUNT(CASE WHEN a.status = 'completed' THEN 1 END) as completed_appointments,
        COUNT(CASE WHEN a.status = 'pending' THEN 1 END) as pending_appointments
      FROM appointments a
      LEFT JOIN users c ON a.consultant_id = c.id
      WHERE a.appointment_date >= CURRENT_DATE - INTERVAL '30 days'
      GROUP BY c.id, c.name
      ORDER BY total_appointments DESC
    `);

    // Get daily appointment counts for the last 7 days
    const dailyStatsResult = await query(`
      SELECT 
        appointment_date::date as date,
        COUNT(*) as count
      FROM appointments 
      WHERE appointment_date >= CURRENT_DATE - INTERVAL '7 days'
      GROUP BY appointment_date::date
      ORDER BY appointment_date::date
    `);

    res.json({
      success: true,
      data: {
        statusStats: statusStatsResult.rows,
        consultantStats: consultantStatsResult.rows,
        dailyStats: dailyStatsResult.rows
      }
    });
  } catch (error) {
    console.error('Get appointment stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get appointment statistics'
    });
  }
};

module.exports = {
  createAppointment,
  scheduleAppointmentFromRecommendation,
  respondToAppointment,
  getStudentAppointments,
  getConsultantAppointments,
  updateAppointment,
  getAvailableTimeSlots,
  // Admin functions
  getAllAppointments,
  createAppointmentAdmin,
  updateAppointmentStatus,
  deleteAppointmentAdmin,
  getAppointmentStats
};
