const express = require('express');
const router = express.Router();
const moodController = require('../controllers/moodController');
const recommendationController = require('../controllers/recommendationController');
const appointmentController = require('../controllers/appointmentController');
const { authenticateToken } = require('../middleware/auth');
const { requireStudent } = require('../middleware/rbac');
const { 
  validateMoodEntry, 
  validateAppointmentCreate, 
  validateAppointmentResponse,
  validatePagination,
  validateDateRange,
  validateUuidParam 
} = require('../middleware/validation');

// Apply authentication to all routes
router.use(authenticateToken);

// Apply student role requirement to all routes
router.use(requireStudent);

// Mood entry routes
router.post('/mood', validateMoodEntry, moodController.addMoodEntry);
router.get('/mood', validatePagination, validateDateRange, moodController.getMoodEntries);
router.get('/mood/:date', moodController.getMoodEntryByDate);
router.put('/mood/:id', validateUuidParam, validateMoodEntry, moodController.updateMoodEntry);
router.delete('/mood/:id', validateUuidParam, moodController.deleteMoodEntry);

// Recommendation routes
router.get('/recommendations', validatePagination, recommendationController.getStudentRecommendations);
router.get('/recommendations/:id', validateUuidParam, recommendationController.getRecommendationById);

// Appointment routes
router.post('/appointments', validateAppointmentCreate, appointmentController.createAppointment);
router.get('/appointments', validatePagination, appointmentController.getStudentAppointments);
router.put('/appointments/:id/respond', validateUuidParam, validateAppointmentResponse, appointmentController.respondToAppointment);

// Available time slots
router.get('/available-slots', appointmentController.getAvailableTimeSlots);

module.exports = router;
