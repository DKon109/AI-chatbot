const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const HospitalSearchService = require('../services/HospitalSearchService');
const { authenticateToken } = require('../middleware/auth');

// Middleware to handle validation errors
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ 
      success: false,
      error: 'Validation failed',
      details: errors.array() 
    });
  }
  next();
};

/**
 * @route POST /api/hospital/search
 * @desc Search for hospitals near a location based on symptoms
 * @access Private (Patient only)
 */
router.post('/search', authenticateToken, async (req, res, next) => {
  try {
    const { latitude, longitude, radius = 5000, symptoms = [] } = req.body;
    const userId = req.userId;
    
    console.log('Hospital search request - User ID:', userId);
    console.log('Request headers:', req.headers.authorization ? 'Token present' : 'No token');

    // Basic validation
    if (!latitude || !longitude) {
      return res.status(400).json({
        success: false,
        error: 'Latitude and longitude are required'
      });
    }

    if (typeof latitude !== 'number' || typeof longitude !== 'number') {
      return res.status(400).json({
        success: false,
        error: 'Latitude and longitude must be numbers'
      });
    }

    console.log(`Hospital search request from user ${userId}:`, { latitude, longitude, radius, symptoms });

    const result = await HospitalSearchService.searchHospitals(latitude, longitude, radius, symptoms);
    
    if (result.success) {
      res.status(200).json({
        success: true,
        message: 'Hospital search completed successfully',
        data: result.data
      });
    } else {
      res.status(500).json({
        success: false,
        error: result.error || 'Failed to search hospitals'
      });
    }

  } catch (error) {
    console.error('Hospital search error:', error);
    next(error);
  }
});

/**
 * @route GET /api/hospital/directions/:placeId
 * @desc Get directions to a specific hospital
 * @access Private (Patient only)
 */
router.get(
  '/directions/:placeId',
  authenticateToken,
  async (req, res, next) => {
    try {
      const { placeId } = req.params;
      const { latitude, longitude } = req.query;

      if (!latitude || !longitude) {
        return res.status(400).json({
          success: false,
          error: 'User location (latitude and longitude) is required'
        });
      }

      const result = await HospitalSearchService.getDirectionsToHospital(
        placeId, 
        parseFloat(latitude), 
        parseFloat(longitude)
      );

      if (result.success) {
        res.status(200).json({
          success: true,
          message: 'Directions retrieved successfully',
          data: result
        });
      } else {
        res.status(500).json({
          success: false,
          error: result.error || 'Failed to get directions'
        });
      }

    } catch (error) {
      console.error('Directions error:', error);
      next(error);
    }
  }
);

/**
 * @route GET /api/hospital/specialties
 * @desc Get list of available medical specialties
 * @access Private
 */
router.get(
  '/specialties',
  authenticateToken,
  async (req, res, next) => {
    try {
      const specialties = [
        'cardiology',
        'dermatology', 
        'orthopedics',
        'oncology',
        'neurology',
        'gastroenterology',
        'pulmonology',
        'endocrinology',
        'urology',
        'gynecology',
        'pediatrics',
        'psychiatry',
        'emergency',
        'general'
      ];

      res.status(200).json({
        success: true,
        message: 'Medical specialties retrieved successfully',
        data: { specialties }
      });

    } catch (error) {
      console.error('Specialties error:', error);
      next(error);
    }
  }
);

module.exports = router;
