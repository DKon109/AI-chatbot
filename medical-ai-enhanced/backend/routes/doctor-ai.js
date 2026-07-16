const express = require('express');
const router = express.Router();
const DoctorInputService = require('../services/DoctorInputService');
const { authenticateToken, requireDoctor, requirePatient } = require('../middleware/auth');

const doctorInputService = new DoctorInputService();

router.use(authenticateToken);

/**
 * @route GET /api/doctor/patients
 * @desc List patient accounts that can receive a personalized guidance profile
 * @access Doctor
 */
router.get('/patients', requireDoctor, async (req, res, next) => {
  try {
    const patients = await doctorInputService.getPatientAccounts();
    res.json({ success: true, data: patients });
  } catch (error) {
    next(error);
  }
});

/**
 * @route POST /api/doctor/instructions
 * @desc Store doctor instructions for a patient and generate personalized AI agent
 * @access Doctor
 */
router.post('/instructions', requireDoctor, async (req, res, next) => {
  try {
    const { patientId, instructions } = req.body;
    const doctorId = req.userId;

    if (!patientId || !instructions) {
      return res.status(400).json({
        success: false,
        error: 'Patient ID and instructions are required'
      });
    }

    const result = await doctorInputService.storeDoctorInstructions(
      patientId, 
      doctorId, 
      instructions
    );

    res.json({
      success: true,
      message: 'Doctor instructions stored and personalized AI agent generated',
      data: result
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @route GET /api/doctor/instructions/:patientId
 * @desc Get doctor instructions history for a patient
 * @access Doctor
 */
router.get('/instructions/:patientId', requireDoctor, async (req, res, next) => {
  try {
    const { patientId } = req.params;
    const instructions = await doctorInputService.getDoctorInstructionsHistory(patientId);

    res.json({
      success: true,
      data: instructions
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @route PUT /api/doctor/instructions/:patientId
 * @desc Update doctor instructions for a patient
 * @access Doctor
 */
router.put('/instructions/:patientId', requireDoctor, async (req, res, next) => {
  try {
    const { patientId } = req.params;
    const { instructions } = req.body;
    const doctorId = req.userId;

    if (!instructions) {
      return res.status(400).json({
        success: false,
        error: 'Instructions are required'
      });
    }

    const result = await doctorInputService.updateDoctorInstructions(
      patientId, 
      doctorId, 
      instructions
    );

    res.json({
      success: true,
      message: 'Doctor instructions updated and AI agent regenerated',
      data: result
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @route GET /api/ai/personalized/:patientId
 * @desc Get personalized AI agent for a patient
 * @access Patient
 */
router.get('/personalized/:patientId', requirePatient, async (req, res, next) => {
  try {
    const { patientId } = req.params;
    
    // Verify patient can access their own data
    if (req.userId !== patientId) {
      return res.status(403).json({
        success: false,
        error: 'Access denied'
      });
    }

    const personalizedAgent = await doctorInputService.getPersonalizedAgent(patientId);

    if (!personalizedAgent) {
      return res.status(404).json({
        success: false,
        error: 'No personalized AI agent found. Please ask your doctor to provide instructions.'
      });
    }

    res.json({
      success: true,
      data: personalizedAgent
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @route POST /api/ai/symptoms-personalized
 * @desc Analyze symptoms with personalized AI context
 * @access Patient
 */
router.post('/symptoms-personalized', requirePatient, async (req, res, next) => {
  try {
    const { patientId, symptoms } = req.body;
    const userId = req.userId;

    if (!patientId || !symptoms) {
      return res.status(400).json({
        success: false,
        error: 'Patient ID and symptoms are required'
      });
    }

    // Verify patient can access their own data
    if (userId !== patientId) {
      return res.status(403).json({
        success: false,
        error: 'Access denied'
      });
    }

    const analysis = await doctorInputService.analyzeSymptomsWithContext(patientId, symptoms);

    res.json({
      success: true,
      data: analysis
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @route POST /api/ai/meal-personalized
 * @desc Analyze meal with personalized AI context
 * @access Patient
 */
router.post('/meal-personalized', requirePatient, async (req, res, next) => {
  try {
    const { patientId, mealData } = req.body;
    const userId = req.userId;

    if (!patientId || !mealData) {
      return res.status(400).json({
        success: false,
        error: 'Patient ID and meal data are required'
      });
    }

    // Verify patient can access their own data
    if (userId !== patientId) {
      return res.status(403).json({
        success: false,
        error: 'Access denied'
      });
    }

    const analysis = await doctorInputService.analyzeMealWithContext(patientId, mealData);

    res.json({
      success: true,
      data: analysis
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @route POST /api/ai/exercise-personalized
 * @desc Generate exercise recommendations with personalized AI context
 * @access Patient
 */
router.post('/exercise-personalized', requirePatient, async (req, res, next) => {
  try {
    const { patientId, currentActivity } = req.body;
    const userId = req.userId;

    if (!patientId) {
      return res.status(400).json({
        success: false,
        error: 'Patient ID is required'
      });
    }

    // Verify patient can access their own data
    if (userId !== patientId) {
      return res.status(403).json({
        success: false,
        error: 'Access denied'
      });
    }

    const recommendations = await doctorInputService.generateExerciseRecommendations(
      patientId, 
      currentActivity
    );

    res.json({
      success: true,
      data: recommendations
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @route POST /api/ai/motivation-personalized
 * @desc Generate motivation message with personalized AI context
 * @access Patient
 */
router.post('/motivation-personalized', requirePatient, async (req, res, next) => {
  try {
    const { patientId, actionType } = req.body;
    const userId = req.userId;

    if (!patientId || !actionType) {
      return res.status(400).json({
        success: false,
        error: 'Patient ID and action type are required'
      });
    }

    // Verify patient can access their own data
    if (userId !== patientId) {
      return res.status(403).json({
        success: false,
        error: 'Access denied'
      });
    }

    const motivation = await doctorInputService.generateMotivationMessage(patientId, actionType);

    res.json({
      success: true,
      data: { message: motivation }
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @route POST /api/ai/progress-report-personalized
 * @desc Generate progress report with personalized AI context
 * @access Patient
 */
router.post('/progress-report-personalized', requirePatient, async (req, res, next) => {
  try {
    const { patientId, timeFrame = 'weekly' } = req.body;
    const userId = req.userId;

    if (!patientId) {
      return res.status(400).json({
        success: false,
        error: 'Patient ID is required'
      });
    }

    // Verify patient can access their own data
    if (userId !== patientId) {
      return res.status(403).json({
        success: false,
        error: 'Access denied'
      });
    }

    const report = await doctorInputService.generateProgressReport(patientId, timeFrame);

    res.json({
      success: true,
      data: report
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
