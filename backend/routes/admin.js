const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const { authenticateToken } = require('../middleware/auth');
const { requireAdmin } = require('../middleware/rbac');
const { validateFacultyAdd, validateConsultantAdd, validatePagination, validateUuidParam } = require('../middleware/validation');

// Apply authentication to all routes
router.use(authenticateToken);

// Apply admin role requirement to all routes
router.use(requireAdmin);

// User management routes
router.get('/users', validatePagination, userController.getAllUsers);
router.get('/users/:id', validateUuidParam, userController.getUserById);
router.delete('/users/:id', validateUuidParam, userController.deleteUser);

// Add faculty and consultant
router.post('/faculty', validateFacultyAdd, userController.addFaculty);
router.post('/consultant', validateConsultantAdd, userController.addConsultant);

// Statistics
router.get('/stats', userController.getUserStats);

module.exports = router;
