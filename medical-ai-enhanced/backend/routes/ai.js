const express = require('express');
const { authenticateToken, requirePatient } = require('../middleware/auth');
const AIAgentManager = require('../agents/AIAgentManager');

const router = express.Router();

// Initialize AI Agent Manager
const aiManager = new AIAgentManager();
// const continuousLearning = new ContinuousLearningSystem(); // Will implement JS version

// All AI routes require authentication
router.use(authenticateToken);

/**
 * @route POST /api/ai/symptom-analysis
 * @desc Analyze symptoms using SymptomAgent
 * @access Patient
 */
router.post('/symptom-analysis', requirePatient, async (req, res, next) => {
  try {
    const { symptoms, additionalContext = {} } = req.body;
    const userId = req.userId;

    if (!symptoms) {
      return res.status(400).json({
        success: false,
        error: 'Symptoms are required'
      });
    }

    const result = await aiManager.process({
      userId,
      requestType: 'symptom_analysis',
      data: { symptoms },
      context: {
        ...additionalContext,
        emergency: symptoms.toLowerCase().includes('chest pain') || 
                   symptoms.toLowerCase().includes('difficulty breathing')
      }
    });

    res.json(result);
  } catch (error) {
    next(error);
  }
});

/**
 * @route POST /api/ai/chat
 * @desc General chat endpoint that handles both conversation and medical analysis
 * @access Patient
 */
router.post('/chat', requirePatient, async (req, res, next) => {
  try {
    const { message, additionalContext = {} } = req.body;
    const userId = req.userId;

    if (!message) {
      return res.status(400).json({
        success: false,
        error: 'Message is required'
      });
    }

    const result = await aiManager.process({
      userId,
      requestType: 'general_chat', // This will trigger conversation detection
      data: { message },
      context: {
        ...additionalContext,
        timestamp: new Date().toISOString()
      }
    });

    res.json(result);
  } catch (error) {
    next(error);
  }
});

/**
 * @route POST /api/ai/structured-symptoms
 * @desc Structured symptom analysis with user-guided selection
 * @access Patient
 */
router.post('/structured-symptoms', requirePatient, async (req, res, next) => {
  try {
    const { step, category, selectedSymptoms, answers, location } = req.body;
    const userId = req.userId;

    const StructuredSymptomAgent = require('../agents/StructuredSymptomAgent');
    const structuredAgent = new StructuredSymptomAgent();

    const result = await structuredAgent.process({
      userId,
      step: step || 'categorize',
      category,
      selectedSymptoms: selectedSymptoms || [],
      answers: answers || {},
      location: location || null
    });

    res.json(result);
  } catch (error) {
    next(error);
  }
});

/**
 * @route POST /api/ai/food-analysis
 * @desc Analyze food using MealNutritionAgent
 * @access Patient
 */
router.post('/food-analysis', requirePatient, async (req, res, next) => {
  try {
    const { meal, condition, medications = [], allergies = [] } = req.body;
    const userId = req.userId;

    if (!meal) {
      return res.status(400).json({
        success: false,
        error: 'Meal data is required'
      });
    }

    const result = await aiManager.process({
      userId,
      requestType: 'food_analysis',
      data: { meal, condition, medications, allergies },
      context: {
        medicationInvolved: medications.length > 0,
        needsMotivation: true
      }
    });

    res.json(result);
  } catch (error) {
    next(error);
  }
});

/**
 * @route POST /api/ai/exercise-recommendation
 * @desc Get exercise recommendations using ActivityAgent
 * @access Patient
 */
router.post('/exercise-recommendation', requirePatient, async (req, res, next) => {
  try {
    const { condition, fitnessLevel = 'beginner', preferences = {} } = req.body;
    const userId = req.userId;

    if (!condition) {
      return res.status(400).json({
        success: false,
        error: 'Condition is required'
      });
    }

    const result = await aiManager.process({
      userId,
      requestType: 'exercise_recommendation',
      data: { condition, fitnessLevel, preferences },
      context: {
        needsMotivation: true
      }
    });

    res.json(result);
  } catch (error) {
    next(error);
  }
});

/**
 * @route POST /api/ai/medication-reminder
 * @desc Send medication reminder using MotivationAgent
 * @access Patient
 */
router.post('/medication-reminder', requirePatient, async (req, res, next) => {
  try {
    const { medication, action = 'reminder' } = req.body;
    const userId = req.userId;

    if (!medication) {
      return res.status(400).json({
        success: false,
        error: 'Medication information is required'
      });
    }

    const result = await aiManager.process({
      userId,
      requestType: 'medication_reminder',
      data: { medication, action },
      context: {
        medicationInvolved: true,
        needsMotivation: true
      }
    });

    res.json(result);
  } catch (error) {
    next(error);
  }
});

/**
 * @route POST /api/ai/doctor-input
 * @desc Process doctor input using MedicalContextAgent
 * @access Patient
 */
router.post('/doctor-input', requirePatient, async (req, res, next) => {
  try {
    const { doctorInput, condition, currentMetrics = {} } = req.body;
    const userId = req.userId;

    if (!doctorInput || !condition) {
      return res.status(400).json({
        success: false,
        error: 'Doctor input and condition are required'
      });
    }

    const result = await aiManager.process({
      userId,
      requestType: 'doctor_input',
      data: { doctorInput, condition, currentMetrics },
      context: {
        hasDoctorInput: true,
        needsMotivation: true
      }
    });

    res.json(result);
  } catch (error) {
    next(error);
  }
});

/**
 * @route POST /api/ai/progress-report
 * @desc Generate progress report using FeedbackAgent
 * @access Patient
 */
router.post('/progress-report', requirePatient, async (req, res, next) => {
  try {
    const { timeframe = 'weekly', doctorGoals = [] } = req.body;
    const userId = req.userId;

    const result = await aiManager.process({
      userId,
      requestType: 'progress_report',
      data: { timeframe, doctorGoals },
      context: {
        needsMotivation: true
      }
    });

    res.json(result);
  } catch (error) {
    next(error);
  }
});

/**
 * @route POST /api/ai/hospital-matching
 * @desc Find suitable hospitals using HospitalInsuranceAgent
 * @access Patient
 */
router.post('/hospital-matching', requirePatient, async (req, res, next) => {
  try {
    const { condition, severity, location, insuranceProvider } = req.body;
    const userId = req.userId;

    if (!condition || !severity) {
      return res.status(400).json({
        success: false,
        error: 'Condition and severity are required'
      });
    }

    const result = await aiManager.process({
      userId,
      requestType: 'hospital_matching',
      data: { condition, severity, location, insuranceProvider },
      context: {
        emergency: severity === 'critical'
      }
    });

    res.json(result);
  } catch (error) {
    next(error);
  }
});

/**
 * @route POST /api/ai/prescription-processing
 * @desc Process prescription using PharmacyPrescriptionAgent
 * @access Patient
 */
router.post('/prescription-processing', requirePatient, async (req, res, next) => {
  try {
    const { prescription, preferredPharmacy, deliveryPreference = false } = req.body;
    const userId = req.userId;

    if (!prescription) {
      return res.status(400).json({
        success: false,
        error: 'Prescription data is required'
      });
    }

    const result = await aiManager.process({
      userId,
      requestType: 'prescription_processing',
      data: { prescription, preferredPharmacy, deliveryPreference },
      context: {
        medicationInvolved: true
      }
    });

    res.json(result);
  } catch (error) {
    next(error);
  }
});

/**
 * @route GET /api/ai/agent-status
 * @desc Get status of all AI agents
 * @access Authenticated
 */
router.get('/agent-status', async (req, res, next) => {
  try {
    const status = aiManager.getAgentStatus();
    res.json({
      success: true,
      data: status
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @route GET /api/ai/system-health
 * @desc Get system health status
 * @access Authenticated
 */
router.get('/system-health', async (req, res, next) => {
  try {
    const health = aiManager.getSystemHealth();
    res.json({
      success: true,
      data: health
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @route GET /api/ai/user-progress/:userId
 * @desc Get user progress and motivation stats
 * @access Patient (own data only)
 */
router.get('/user-progress/:userId', requirePatient, async (req, res, next) => {
  try {
    const userId = req.params.userId;
    
    // Ensure user can only access their own data
    if (userId !== req.userId) {
      return res.status(403).json({
        success: false,
        error: 'Access denied'
      });
    }

    const motivationAgent = aiManager.agents.motivation;
    const stats = await motivationAgent.getUserMotivationStats(userId);
    
    res.json({
      success: true,
      data: stats
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @route GET /api/ai/prescription-status/:prescriptionId
 * @desc Get prescription status
 * @access Patient
 */
router.get('/prescription-status/:prescriptionId', requirePatient, async (req, res, next) => {
  try {
    const prescriptionId = req.params.prescriptionId;
    const pharmacyAgent = aiManager.agents.pharmacy;
    
    const status = pharmacyAgent.getPrescriptionStatus(prescriptionId);
    res.json(status);
  } catch (error) {
    next(error);
  }
});

/**
 * @route GET /api/ai/report-history/:userId
 * @desc Get user's report history
 * @access Patient (own data only)
 */
router.get('/report-history/:userId', requirePatient, async (req, res, next) => {
  try {
    const userId = req.params.userId;
    
    // Ensure user can only access their own data
    if (userId !== req.userId) {
      return res.status(403).json({
        success: false,
        error: 'Access denied'
      });
    }

    const feedbackAgent = aiManager.agents.feedback;
    const reports = await feedbackAgent.getReportHistory(userId);
    
    res.json({
      success: true,
      data: reports
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @route POST /api/ai/track-exercise
 * @desc Track exercise completion
 * @access Patient
 */
router.post('/track-exercise', requirePatient, async (req, res, next) => {
  try {
    const { exerciseId, duration, intensity, notes = '' } = req.body;
    const userId = req.userId;

    if (!exerciseId || !duration) {
      return res.status(400).json({
        success: false,
        error: 'Exercise ID and duration are required'
      });
    }

    const activityAgent = aiManager.agents.activity;
    const success = await activityAgent.trackExerciseCompletion(
      userId, 
      exerciseId, 
      duration, 
      intensity, 
      notes
    );

    res.json({
      success,
      message: success ? 'Exercise tracked successfully' : 'Failed to track exercise'
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @route POST /api/ai/mark-prescription-picked-up
 * @desc Mark prescription as picked up
 * @access Patient
 */
router.post('/mark-prescription-picked-up', requirePatient, async (req, res, next) => {
  try {
    const { prescriptionId } = req.body;
    const userId = req.userId;

    if (!prescriptionId) {
      return res.status(400).json({
        success: false,
        error: 'Prescription ID is required'
      });
    }

    const pharmacyAgent = aiManager.agents.pharmacy;
    const success = pharmacyAgent.markAsPickedUp(prescriptionId);

    res.json({
      success,
      message: success ? 'Prescription marked as picked up' : 'Failed to update prescription status'
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @route POST /api/ai/feedback
 * @desc Collect user feedback for continuous learning
 * @access Patient
 */
router.post('/feedback', requirePatient, async (req, res, next) => {
  try {
    const { user_input, ai_response, rating, doctor_correction } = req.body;
    const userId = req.userId;

    if (!user_input || !ai_response || !rating) {
      return res.status(400).json({
        success: false,
        error: 'user_input, ai_response, and rating are required'
      });
    }

    if (rating < 1 || rating > 5) {
      return res.status(400).json({
        success: false,
        error: 'Rating must be between 1 and 5'
      });
    }

    // Collect feedback (TODO: Implement continuous learning)
    console.log('Feedback collected:', { user_input, ai_response, rating, doctor_correction });

    res.json({
      success: true,
      message: 'Feedback collected successfully'
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @route GET /api/ai/performance-metrics
 * @desc Get AI performance metrics
 * @access Patient
 */
router.get('/performance-metrics', requirePatient, async (req, res, next) => {
  try {
    // TODO: Implement performance metrics
    res.json({
      success: true,
      data: { message: 'Performance metrics coming soon' }
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @route GET /api/ai/feedback-analysis
 * @desc Get feedback analysis and trends
 * @access Patient
 */
router.get('/feedback-analysis', requirePatient, async (req, res, next) => {
  try {
    // TODO: Implement feedback analysis
    res.json({
      success: true,
      data: { message: 'Feedback analysis coming soon' }
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
