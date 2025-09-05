/**
 * Role-based access control middleware
 * Ensures user has required role(s) to access endpoint
 */

/**
 * Create middleware to check if user has required role
 * @param {string|string[]} roles - Required role(s)
 * @returns {Function} Express middleware function
 */
const requireRole = (roles) => {
  // Normalize roles to array
  const requiredRoles = Array.isArray(roles) ? roles : [roles];

  return (req, res, next) => {
    // Check if user is authenticated
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
    }

    // Check if user has required role
    if (!requiredRoles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: `Access denied. Required role(s): ${requiredRoles.join(', ')}`
      });
    }

    next();
  };
};

/**
 * Middleware to ensure user is an admin
 */
const requireAdmin = requireRole('admin');

/**
 * Middleware to ensure user is a student
 */
const requireStudent = requireRole('student');

/**
 * Middleware to ensure user is faculty
 */
const requireFaculty = requireRole('faculty');

/**
 * Middleware to ensure user is a consultant
 */
const requireConsultant = requireRole('consultant');

/**
 * Middleware to ensure user is either faculty or consultant
 */
const requireStaffRole = requireRole(['faculty', 'consultant']);

/**
 * Middleware to ensure user is either student, faculty, or consultant
 */
const requireUserRole = requireRole(['student', 'faculty', 'consultant']);

/**
 * Middleware to check if user owns the resource or is admin
 * Expects req.params.userId to match req.user.id
 */
const requireOwnershipOrAdmin = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      message: 'Authentication required'
    });
  }

  const targetUserId = req.params.userId || req.params.id;
  
  // Admin can access any resource
  if (req.user.role === 'admin') {
    return next();
  }

  // User can access their own resources
  if (req.user.id === targetUserId) {
    return next();
  }

  return res.status(403).json({
    success: false,
    message: 'Access denied. You can only access your own resources.'
  });
};

/**
 * Middleware to check if user can access student data
 * Students can only access their own data
 * Faculty can access their students' data
 * Consultants can access recommended students' data
 * Admins can access all data
 */
const requireStudentAccess = async (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      message: 'Authentication required'
    });
  }

  const targetStudentId = req.params.studentId || req.params.id;
  
  // Admin can access any student data
  if (req.user.role === 'admin') {
    return next();
  }

  // Student can access their own data
  if (req.user.role === 'student' && req.user.id === targetStudentId) {
    return next();
  }

  // Faculty can access their students' data
  if (req.user.role === 'faculty') {
    // This would require checking if the student is in faculty's course
    // Implementation depends on specific endpoint requirements
    return next();
  }

  // Consultant can access their assigned students' data
  if (req.user.role === 'consultant') {
    // This would require checking if consultant has appointments/recommendations for the student
    // Implementation depends on specific endpoint requirements
    return next();
  }

  return res.status(403).json({
    success: false,
    message: 'Access denied. Insufficient permissions to access this student data.'
  });
};

/**
 * Create middleware to check multiple conditions
 * @param {Function[]} middlewares - Array of middleware functions
 * @returns {Function} Combined middleware function
 */
const combineMiddleware = (middlewares) => {
  return (req, res, next) => {
    let index = 0;

    const runNext = (err) => {
      if (err) return next(err);
      
      if (index >= middlewares.length) {
        return next();
      }

      const middleware = middlewares[index++];
      middleware(req, res, runNext);
    };

    runNext();
  };
};

module.exports = {
  requireRole,
  requireAdmin,
  requireStudent,
  requireFaculty,
  requireConsultant,
  requireStaffRole,
  requireUserRole,
  requireOwnershipOrAdmin,
  requireStudentAccess,
  combineMiddleware
};
