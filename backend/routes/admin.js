const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const appointmentController = require('../controllers/appointmentController');
const { authenticateToken } = require('../middleware/auth');
const { requireAdmin } = require('../middleware/rbac');
const { 
  validateFacultyAdd, 
  validateConsultantAdd, 
  validatePagination, 
  validateUuidParam, 
  validateCourseAdd, 
  validateCourseUpdate,
  validateAppointmentCreateAdmin,
  validateAppointmentStatusUpdate 
} = require('../middleware/validation');

// Apply authentication to all routes
router.use(authenticateToken);

// Apply admin role requirement to all routes
router.use(requireAdmin);

// User management routes
router.get('/users', validatePagination, userController.getAllUsers);
router.get('/users/:id', validateUuidParam, userController.getUserById);
router.put('/users/:id/status', validateUuidParam, userController.updateUserStatus);
router.delete('/users/:id', validateUuidParam, userController.deleteUser);

// Course management routes
router.get('/courses', userController.getAllCourses);
router.post('/courses', validateCourseAdd, userController.createCourse);
router.put('/courses/:id', validateUuidParam, validateCourseUpdate, userController.updateCourse);
router.delete('/courses/:id', validateUuidParam, userController.deleteCourse);
router.get('/courses/:id/students', validateUuidParam, userController.getCourseStudents);

// Appointment management routes
router.get('/appointments', appointmentController.getAllAppointments);
router.post('/appointments', validateAppointmentCreateAdmin, appointmentController.createAppointmentAdmin);
router.put('/appointments/:id/status', validateUuidParam, validateAppointmentStatusUpdate, appointmentController.updateAppointmentStatus);
router.delete('/appointments/:id', validateUuidParam, appointmentController.deleteAppointmentAdmin);
router.get('/appointments/stats', appointmentController.getAppointmentStats);

// Add faculty and consultant
router.post('/faculty', validateFacultyAdd, userController.addFaculty);
router.post('/consultant', validateConsultantAdd, userController.addConsultant);

// Statistics
router.get('/stats', userController.getUserStats);

module.exports = router;
