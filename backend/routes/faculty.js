const express = require('express');
const router = express.Router();
const moodController = require('../controllers/moodController');
const recommendationController = require('../controllers/recommendationController');
const { authenticateToken } = require('../middleware/auth');
const { requireFaculty } = require('../middleware/rbac');
const { validateRecommendation, validateUuidParam } = require('../middleware/validation');

// Apply authentication to all routes
router.use(authenticateToken);

// Apply faculty role requirement to all routes
router.use(requireFaculty);

// View mood statistics for faculty's sections
router.get('/mood-stats', moodController.getFacultyMoodStats);

// View vulnerable students
router.get('/vulnerable-students', moodController.getVulnerableStudents);

// Create recommendation for student
router.post('/recommendations', validateRecommendation, recommendationController.createRecommendation);

// View recommendation details
router.get('/recommendations/:id', validateUuidParam, recommendationController.getRecommendationById);

module.exports = router;
