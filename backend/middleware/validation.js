const Joi = require('joi');

/**
 * Validation middleware using Joi schemas
 * @param {Object} schema - Joi validation schema
 * @param {string} property - Request property to validate ('body', 'query', 'params')
 * @returns {Function} Express middleware function
 */
const validate = (schema, property = 'body') => {
  return (req, res, next) => {
    const { error, value } = schema.validate(req[property], {
      abortEarly: false, // Show all errors
      stripUnknown: true, // Remove unknown fields
      convert: true // Convert string numbers to numbers
    });

    if (error) {
      const errors = error.details.map(detail => ({
        field: detail.path.join('.'),
        message: detail.message
      }));

      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors
      });
    }

    // Replace request property with validated and sanitized value
    req[property] = value;
    next();
  };
};

// Common validation schemas
const schemas = {
  // User registration schema
  userRegistration: Joi.object({
    name: Joi.string().min(2).max(255).required().trim(),
    username: Joi.string().alphanum().min(3).max(50).required().lowercase(),
    email: Joi.string().email().required().lowercase(),
    password: Joi.string().min(8).max(128).required(),
    role: Joi.string().valid('student', 'faculty', 'consultant').required(),
    student_id: Joi.when('role', {
      is: 'student',
      then: Joi.string().required().trim(),
      otherwise: Joi.forbidden()
    }),
    number_of_courses: Joi.when('role', {
      is: 'student',
      then: Joi.number().integer().min(3).max(7).required(),
      otherwise: Joi.forbidden()
    }),
    courses: Joi.when('role', {
      is: 'student',
      then: Joi.array().items(
        Joi.object({
          title: Joi.string().required().trim(),
          section: Joi.string().required().trim()
        })
      ).min(Joi.ref('number_of_courses')).max(Joi.ref('number_of_courses')),
      otherwise: Joi.forbidden()
    })
  }),

  // User login schema
  userLogin: Joi.object({
    identifier: Joi.string().required().trim(), // username or email
    password: Joi.string().required()
  }),

  // Faculty addition schema
  facultyAdd: Joi.object({
    name: Joi.string().min(2).max(255).required().trim(),
    username: Joi.string().alphanum().min(3).max(50).required().lowercase(),
    email: Joi.string().email().required().lowercase(),
    password: Joi.string().min(8).max(128).required(),
    number_of_courses: Joi.number().integer().min(1).max(10).required(),
    courses: Joi.array().items(
      Joi.object({
        title: Joi.string().required().trim(),
        section: Joi.string().required().trim()
      })
    ).min(Joi.ref('number_of_courses')).max(Joi.ref('number_of_courses'))
  }),

  // Consultant addition schema
  consultantAdd: Joi.object({
    name: Joi.string().min(2).max(255).required().trim(),
    username: Joi.string().alphanum().min(3).max(50).required().lowercase(),
    email: Joi.string().email().required().lowercase(),
    password: Joi.string().min(8).max(128).required()
  }),

  // Course management schemas
  courseAdd: Joi.object({
    title: Joi.string().min(2).max(255).required().trim(),
    section: Joi.string().min(1).max(50).required().trim(),
    faculty_id: Joi.string().uuid().optional().allow(null, ''),
    description: Joi.string().max(1000).optional().allow('').trim()
  }),

  courseUpdate: Joi.object({
    title: Joi.string().min(2).max(255).required().trim(),
    section: Joi.string().min(1).max(50).required().trim(),
    faculty_id: Joi.string().uuid().optional().allow(null, ''),
    description: Joi.string().max(1000).optional().allow('').trim()
  }),

  // Mood entry schema
  moodEntry: Joi.object({
    mood_level: Joi.number().integer().min(1).max(10).required(),
    notes: Joi.string().max(1000).allow('').optional().trim(),
    entry_date: Joi.date().max('now').optional()
  }),

  // Recommendation schema
  recommendation: Joi.object({
    student_id: Joi.string().uuid().required(),
    reason: Joi.string().max(500).optional().trim()
  }),

  // Appointment creation schema
  appointmentCreate: Joi.object({
    consultant_id: Joi.string().uuid().required(),
    appointment_date: Joi.date().min('now').required(),
    appointment_time: Joi.string().pattern(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/).required(),
    student_notes: Joi.string().max(500).allow('').optional().trim(),
    recommendation_id: Joi.string().uuid().optional()
  }),

  // Appointment response schema
  appointmentResponse: Joi.object({
    status: Joi.string().valid('confirmed', 'declined').required(),
    counter_proposal_date: Joi.when('status', {
      is: 'declined',
      then: Joi.date().min('now').optional(),
      otherwise: Joi.forbidden()
    }),
    counter_proposal_time: Joi.when('status', {
      is: 'declined',
      then: Joi.string().pattern(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/).optional(),
      otherwise: Joi.forbidden()
    }),
    student_notes: Joi.string().max(500).allow('').optional().trim()
  }),

  // Admin appointment creation schema
  appointmentCreateAdmin: Joi.object({
    student_id: Joi.string().uuid().required(),
    consultant_id: Joi.string().uuid().required(),
    appointment_date: Joi.date().required(),
    appointment_time: Joi.string().pattern(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/).required(),
    student_notes: Joi.string().max(1000).allow('', null).optional(),
    requested_by: Joi.string().valid('admin', 'student', 'consultant').default('admin')
  }),

  // Admin appointment status update schema
  appointmentStatusUpdate: Joi.object({
    status: Joi.string().valid('pending', 'confirmed', 'completed', 'cancelled', 'rejected').required(),
    consultant_notes: Joi.string().max(1000).allow('', null).optional(),
    counter_proposal_date: Joi.date().allow(null).optional(),
    counter_proposal_time: Joi.string().pattern(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/).allow(null).optional()
  }),

  // Course schema
  course: Joi.object({
    title: Joi.string().min(2).max(255).required().trim(),
    section: Joi.string().min(1).max(50).required().trim(),
    faculty_id: Joi.string().uuid().required()
  }),

  // Query parameters for pagination
  pagination: Joi.object({
    page: Joi.number().integer().min(1).default(1),
    limit: Joi.number().integer().min(1).max(1000).default(10),
    sort_by: Joi.string().optional(),
    sort_order: Joi.string().valid('asc', 'desc').default('asc'),
    search: Joi.string().max(255).optional().trim(),
    role: Joi.string().valid('student', 'faculty', 'consultant', 'admin').optional()
  }),

  // Date range query
  dateRange: Joi.object({
    start_date: Joi.date().optional(),
    end_date: Joi.date().min(Joi.ref('start_date')).optional(),
    period: Joi.string().valid('today', '7days', '30days', '90days').optional()
  }),

  // UUID parameter validation
  uuid: Joi.object({
    id: Joi.string().uuid().required()
  })
};

// Specific validation middleware functions
const validateRegistration = validate(schemas.userRegistration);
const validateLogin = validate(schemas.userLogin);
const validateFacultyAdd = validate(schemas.facultyAdd);
const validateConsultantAdd = validate(schemas.consultantAdd);
const validateCourseAdd = validate(schemas.courseAdd);
const validateCourseUpdate = validate(schemas.courseUpdate);
const validateMoodEntry = validate(schemas.moodEntry);
const validateRecommendation = validate(schemas.recommendation);
const validateAppointmentCreate = validate(schemas.appointmentCreate);
const validateAppointmentResponse = validate(schemas.appointmentResponse);
const validateAppointmentCreateAdmin = validate(schemas.appointmentCreateAdmin);
const validateAppointmentStatusUpdate = validate(schemas.appointmentStatusUpdate);
const validateCourse = validate(schemas.course);
const validatePagination = validate(schemas.pagination, 'query');
const validateDateRange = validate(schemas.dateRange, 'query');
const validateUuidParam = validate(schemas.uuid, 'params');

// Custom validation functions
const validatePasswordStrength = (password) => {
  const minLength = 8;
  const hasUpperCase = /[A-Z]/.test(password);
  const hasLowerCase = /[a-z]/.test(password);
  const hasNumbers = /\d/.test(password);
  const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(password);

  const issues = [];
  
  if (password.length < minLength) {
    issues.push(`Password must be at least ${minLength} characters long`);
  }
  if (!hasUpperCase) {
    issues.push('Password must contain at least one uppercase letter');
  }
  if (!hasLowerCase) {
    issues.push('Password must contain at least one lowercase letter');
  }
  if (!hasNumbers) {
    issues.push('Password must contain at least one number');
  }
  if (!hasSpecialChar) {
    issues.push('Password must contain at least one special character');
  }

  return {
    isValid: issues.length === 0,
    issues
  };
};

module.exports = {
  validate,
  schemas,
  validateRegistration,
  validateLogin,
  validateFacultyAdd,
  validateConsultantAdd,
  validateCourseAdd,
  validateCourseUpdate,
  validateMoodEntry,
  validateRecommendation,
  validateAppointmentCreate,
  validateAppointmentResponse,
  validateAppointmentCreateAdmin,
  validateAppointmentStatusUpdate,
  validateCourse,
  validatePagination,
  validateDateRange,
  validateUuidParam,
  validatePasswordStrength
};
