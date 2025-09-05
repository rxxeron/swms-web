const express = require('express');
const router = express.Router();
const recommendationController = require('../controllers/recommendationController');
const appointmentController = require('../controllers/appointmentController');
const { authenticateToken } = require('../middleware/auth');
const { requireConsultant } = require('../middleware/rbac');
const { validatePagination, validateUuidParam } = require('../middleware/validation');

// Apply authentication to all routes
router.use(authenticateToken);

// Apply consultant role requirement to all routes
router.use(requireConsultant);

// Recommendation routes
router.get('/recommendations', validatePagination, recommendationController.getConsultantRecommendations);
router.get('/recommendations/:id', validateUuidParam, recommendationController.getRecommendationById);
router.put('/recommendations/:id/status', validateUuidParam, recommendationController.updateRecommendationStatus);

// Schedule appointment from recommendation
router.post('/schedule-appointment', appointmentController.scheduleAppointmentFromRecommendation);

// Appointment management routes
router.get('/appointments', validatePagination, appointmentController.getConsultantAppointments);
router.put('/appointments/:id', validateUuidParam, appointmentController.updateAppointment);

// Available time slots
router.get('/available-slots', appointmentController.getAvailableTimeSlots);

module.exports = router;
