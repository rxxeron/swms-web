const express = require('express');
const router = express.Router();
const moodController = require('../controllers/moodController');
const recommendationController = require('../controllers/recommendationController');
const userController = require('../controllers/userController');
const { authenticateToken } = require('../middleware/auth');
const { requireFaculty } = require('../middleware/rbac');
const { validateRecommendation, validateUuidParam } = require('../middleware/validation');

// Apply authentication to all routes
router.use(authenticateToken);

// Apply faculty role requirement to all routes
router.use(requireFaculty);

// Faculty Dashboard API endpoints
router.get('/students', userController.getFacultyStudents);
router.get('/recommendations', recommendationController.getFacultyRecommendations);
router.get('/courses', userController.getFacultyCourses);
router.get('/mood-analytics', moodController.getFacultyMoodStats);

// View mood statistics for faculty's sections
router.get('/mood-stats', moodController.getFacultyMoodStats);

// View vulnerable students
router.get('/vulnerable-students', moodController.getVulnerableStudents);

// Create recommendation for student
router.post('/recommendations', validateRecommendation, recommendationController.createRecommendation);

// View recommendation details
router.get('/recommendations/:id', validateUuidParam, recommendationController.getRecommendationById);

module.exports = router;
