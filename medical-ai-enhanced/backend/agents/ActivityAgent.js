const BaseAgent = require('./BaseAgent');

/**
 * Activity Agent - Recommends appropriate exercises while preventing unsafe activities
 */
class ActivityAgent extends BaseAgent {
  constructor() {
    super(
      'ActivityAgent',
      'Recommends appropriate exercises while preventing unsafe activities'
    );
    
    // Exercise database with condition-specific recommendations
    this.exerciseDatabase = {
      diabetes: {
        recommended: [
          { name: 'Walking', intensity: 'moderate', duration: '30 min', frequency: 'daily', benefits: 'blood sugar control' },
          { name: 'Swimming', intensity: 'moderate', duration: '30 min', frequency: '3x/week', benefits: 'full body, low impact' },
          { name: 'Cycling', intensity: 'moderate', duration: '30 min', frequency: '3x/week', benefits: 'cardiovascular health' },
          { name: 'Resistance Training', intensity: 'moderate', duration: '20 min', frequency: '2x/week', benefits: 'muscle strength' }
        ],
        avoided: ['high intensity interval training', 'extreme sports', 'activities with fall risk'],
        precautions: ['check blood sugar before exercise', 'carry glucose tablets', 'stay hydrated']
      },
      hypertension: {
        recommended: [
          { name: 'Walking', intensity: 'moderate', duration: '30 min', frequency: 'daily', benefits: 'blood pressure control' },
          { name: 'Yoga', intensity: 'low', duration: '45 min', frequency: '3x/week', benefits: 'stress reduction' },
          { name: 'Tai Chi', intensity: 'low', duration: '30 min', frequency: 'daily', benefits: 'balance and relaxation' },
          { name: 'Swimming', intensity: 'moderate', duration: '30 min', frequency: '3x/week', benefits: 'cardiovascular health' }
        ],
        avoided: ['heavy weightlifting', 'high intensity sports', 'activities causing breath holding'],
        precautions: ['monitor blood pressure', 'avoid straining', 'gradual progression']
      },
      heart_disease: {
        recommended: [
          { name: 'Cardiac Rehabilitation', intensity: 'supervised', duration: '45 min', frequency: '3x/week', benefits: 'supervised recovery' },
          { name: 'Walking', intensity: 'light', duration: '20 min', frequency: 'daily', benefits: 'gradual conditioning' },
          { name: 'Stationary Cycling', intensity: 'light', duration: '15 min', frequency: 'daily', benefits: 'low impact cardio' }
        ],
        avoided: ['high intensity exercise', 'competitive sports', 'heavy lifting', 'cold weather exercise'],
        precautions: ['medical clearance required', 'monitor heart rate', 'stop if chest pain occurs']
      },
      obesity: {
        recommended: [
          { name: 'Walking', intensity: 'moderate', duration: '30 min', frequency: 'daily', benefits: 'weight loss' },
          { name: 'Water Aerobics', intensity: 'moderate', duration: '45 min', frequency: '3x/week', benefits: 'low impact cardio' },
          { name: 'Resistance Training', intensity: 'moderate', duration: '30 min', frequency: '2x/week', benefits: 'muscle building' }
        ],
        avoided: ['high impact activities', 'running', 'jumping', 'activities stressing joints'],
        precautions: ['gradual progression', 'proper form', 'joint protection']
      }
    };

    // Safety guidelines
    this.safetyGuidelines = {
      general: [
        'Warm up before exercise',
        'Cool down after exercise',
        'Stay hydrated',
        'Listen to your body',
        'Stop if you feel pain'
      ],
      emergency: [
        'Stop immediately if chest pain occurs',
        'Stop if you feel dizzy or lightheaded',
        'Stop if you have difficulty breathing',
        'Seek medical attention if symptoms persist'
      ]
    };
  }

  /**
   * Process activity recommendation request
   */
  async process(request) {
    const { 
      userId, 
      condition, 
      fitnessLevel = 'beginner',
      currentActivity = 'sedentary',
      preferences = {},
      restrictions = []
    } = request;

    this.log('info', 'Processing activity recommendation request', { 
      userId, 
      condition,
      fitnessLevel,
      currentActivity
    });

    try {
      // Get condition-specific exercises
      const conditionExercises = this.getConditionExercises(condition);
      
      // Filter based on fitness level and current activity
      const filteredExercises = this.filterByFitnessLevel(
        conditionExercises, 
        fitnessLevel, 
        currentActivity
      );
      
      // Apply restrictions
      const safeExercises = this.applyRestrictions(filteredExercises, restrictions);
      
      // Generate personalized recommendations
      const recommendations = this.generateRecommendations(
        safeExercises, 
        condition, 
        fitnessLevel, 
        preferences
      );
      
      // Create activity plan
      const activityPlan = this.createActivityPlan(recommendations, condition);
      
      // Generate safety guidelines
      const safetyGuidelines = this.generateSafetyGuidelines(condition, fitnessLevel);

      // Log the activity recommendation
      await this.logActivityRecommendation(userId, condition, activityPlan);

      this.log('info', 'Activity recommendation completed', {
        exercisesRecommended: recommendations.length,
        planDuration: activityPlan.duration
      });

      return {
        success: true,
        recommendations,
        activityPlan,
        safetyGuidelines,
        agent: this.name,
        timestamp: new Date().toISOString()
      };

    } catch (error) {
      this.log('error', 'Activity recommendation failed', error.message);
      return {
        success: false,
        error: error.message,
        agent: this.name,
        timestamp: new Date().toISOString()
      };
    }
  }

  /**
   * Get exercises for specific condition
   */
  getConditionExercises(condition) {
    const conditionKey = condition.toLowerCase().replace(/\s+/g, '_');
    return this.exerciseDatabase[conditionKey] || this.exerciseDatabase.diabetes;
  }

  /**
   * Filter exercises by fitness level
   */
  filterByFitnessLevel(exercises, fitnessLevel, currentActivity) {
    return exercises.filter(exercise => {
      // Adjust intensity based on fitness level
      if (fitnessLevel === 'beginner' && exercise.intensity === 'high') {
        return false;
      }
      
      // Consider current activity level
      if (currentActivity === 'sedentary' && exercise.intensity === 'high') {
        return false;
      }
      
      return true;
    });
  }

  /**
   * Apply restrictions to exercises
   */
  applyRestrictions(exercises, restrictions) {
    return exercises.filter(exercise => {
      return !restrictions.some(restriction => 
        exercise.name.toLowerCase().includes(restriction.toLowerCase()) ||
        restriction.toLowerCase().includes(exercise.name.toLowerCase())
      );
    });
  }

  /**
   * Generate personalized recommendations
   */
  generateRecommendations(exercises, condition, fitnessLevel, preferences) {
    const recommendations = exercises.map(exercise => ({
      ...exercise,
      personalized: this.personalizeExercise(exercise, fitnessLevel, preferences),
      progression: this.generateProgression(exercise, fitnessLevel),
      alternatives: this.findAlternatives(exercise, condition)
    }));

    // Sort by suitability for fitness level
    return recommendations.sort((a, b) => {
      const aScore = this.calculateSuitabilityScore(a, fitnessLevel);
      const bScore = this.calculateSuitabilityScore(b, fitnessLevel);
      return bScore - aScore;
    });
  }

  /**
   * Personalize exercise based on fitness level and preferences
   */
  personalizeExercise(exercise, fitnessLevel, preferences) {
    const personalized = { ...exercise };
    
    // Adjust duration based on fitness level
    if (fitnessLevel === 'beginner') {
      personalized.duration = this.reduceDuration(exercise.duration);
    } else if (fitnessLevel === 'advanced') {
      personalized.duration = this.increaseDuration(exercise.duration);
    }
    
    // Adjust frequency based on fitness level
    if (fitnessLevel === 'beginner') {
      personalized.frequency = this.reduceFrequency(exercise.frequency);
    }
    
    // Apply preferences
    if (preferences.timeOfDay === 'morning' && exercise.name === 'Walking') {
      personalized.note = 'Great for morning energy boost';
    }
    
    return personalized;
  }

  /**
   * Reduce duration for beginners
   */
  reduceDuration(duration) {
    const match = duration.match(/(\d+)/);
    if (match) {
      const minutes = parseInt(match[1]);
      return `${Math.max(10, Math.floor(minutes * 0.7))} min`;
    }
    return duration;
  }

  /**
   * Increase duration for advanced users
   */
  increaseDuration(duration) {
    const match = duration.match(/(\d+)/);
    if (match) {
      const minutes = parseInt(match[1]);
      return `${Math.floor(minutes * 1.3)} min`;
    }
    return duration;
  }

  /**
   * Reduce frequency for beginners
   */
  reduceFrequency(frequency) {
    if (frequency === 'daily') return '3x/week';
    if (frequency === '3x/week') return '2x/week';
    return frequency;
  }

  /**
   * Generate progression plan
   */
  generateProgression(exercise, fitnessLevel) {
    const progressions = {
      beginner: [
        { week: '1-2', description: 'Start with shorter duration, focus on form' },
        { week: '3-4', description: 'Gradually increase duration by 5 minutes' },
        { week: '5-6', description: 'Add slight intensity increase' }
      ],
      intermediate: [
        { week: '1-2', description: 'Maintain current intensity, focus on consistency' },
        { week: '3-4', description: 'Increase duration or add variations' },
        { week: '5-6', description: 'Add complementary exercises' }
      ],
      advanced: [
        { week: '1-2', description: 'Optimize technique and efficiency' },
        { week: '3-4', description: 'Increase intensity or duration' },
        { week: '5-6', description: 'Add advanced variations or cross-training' }
      ]
    };
    
    return progressions[fitnessLevel] || progressions.beginner;
  }

  /**
   * Find alternative exercises
   */
  findAlternatives(exercise, condition) {
    const conditionExercises = this.getConditionExercises(condition);
    return conditionExercises
      .filter(alt => alt.name !== exercise.name && alt.intensity === exercise.intensity)
      .slice(0, 2);
  }

  /**
   * Calculate suitability score
   */
  calculateSuitabilityScore(exercise, fitnessLevel) {
    let score = 0.5; // Base score
    
    // Intensity matching
    if (fitnessLevel === 'beginner' && exercise.intensity === 'low') score += 0.3;
    if (fitnessLevel === 'intermediate' && exercise.intensity === 'moderate') score += 0.3;
    if (fitnessLevel === 'advanced' && exercise.intensity === 'high') score += 0.3;
    
    // Duration appropriateness
    const duration = parseInt(exercise.duration.match(/(\d+)/)?.[1] || '30');
    if (fitnessLevel === 'beginner' && duration <= 30) score += 0.2;
    if (fitnessLevel === 'advanced' && duration >= 45) score += 0.2;
    
    return Math.min(1.0, score);
  }

  /**
   * Create activity plan
   */
  createActivityPlan(recommendations, condition) {
    const plan = {
      id: `plan_${Date.now()}`,
      condition,
      duration: '12 weeks',
      phases: [
        {
          phase: 'Foundation (Weeks 1-4)',
          focus: 'Building routine and basic fitness',
          exercises: recommendations.slice(0, 2),
          goals: ['Establish routine', 'Build basic fitness', 'Learn proper form']
        },
        {
          phase: 'Progression (Weeks 5-8)',
          focus: 'Increasing intensity and duration',
          exercises: recommendations.slice(0, 3),
          goals: ['Increase intensity', 'Add variety', 'Improve endurance']
        },
        {
          phase: 'Optimization (Weeks 9-12)',
          focus: 'Maintaining and optimizing fitness',
          exercises: recommendations,
          goals: ['Maintain routine', 'Optimize performance', 'Long-term sustainability']
        }
      ],
      weeklySchedule: this.generateWeeklySchedule(recommendations),
      milestones: this.generateMilestones(recommendations)
    };
    
    return plan;
  }

  /**
   * Generate weekly schedule
   */
  generateWeeklySchedule(recommendations) {
    const schedule = {
      monday: recommendations[0] || null,
      tuesday: recommendations[1] || null,
      wednesday: recommendations[0] || null,
      thursday: recommendations[2] || recommendations[1] || null,
      friday: recommendations[0] || null,
      saturday: recommendations[1] || null,
      sunday: 'Rest day'
    };
    
    return schedule;
  }

  /**
   * Generate milestones
   */
  generateMilestones(recommendations) {
    return [
      { week: 2, milestone: 'Complete first week without missing sessions' },
      { week: 4, milestone: 'Increase exercise duration by 25%' },
      { week: 8, milestone: 'Add one new exercise to routine' },
      { week: 12, milestone: 'Achieve target fitness level' }
    ];
  }

  /**
   * Generate safety guidelines
   */
  generateSafetyGuidelines(condition, fitnessLevel) {
    const conditionKey = condition.toLowerCase().replace(/\s+/g, '_');
    const conditionData = this.exerciseDatabase[conditionKey];
    
    const guidelines = [...this.safetyGuidelines.general];
    
    if (conditionData && conditionData.precautions) {
      guidelines.push(...conditionData.precautions);
    }
    
    if (fitnessLevel === 'beginner') {
      guidelines.push('Start slowly and gradually increase intensity');
      guidelines.push('Focus on proper form over intensity');
    }
    
    return {
      general: guidelines,
      emergency: this.safetyGuidelines.emergency,
      conditionSpecific: conditionData?.precautions || []
    };
  }

  /**
   * Log activity recommendation
   */
  async logActivityRecommendation(userId, condition, activityPlan) {
    const pool = require('../config/database');
    
    try {
      await pool.query(
        `INSERT INTO activity_recommendation_logs (id, user_id, condition, activity_plan, created_at)
         VALUES ($1, $2, $3, $4, NOW())`,
        [
          require('crypto').randomUUID(),
          userId,
          condition,
          JSON.stringify(activityPlan)
        ]
      );
    } catch (error) {
      this.log('error', 'Failed to log activity recommendation', error.message);
    }
  }

  /**
   * Track exercise completion
   */
  async trackExerciseCompletion(userId, exerciseId, duration, intensity, notes = '') {
    const pool = require('../config/database');
    
    try {
      await pool.query(
        `INSERT INTO exercise_completions (id, user_id, exercise_id, duration, intensity, notes, completed_at)
         VALUES ($1, $2, $3, $4, $5, $6, NOW())`,
        [
          require('crypto').randomUUID(),
          userId,
          exerciseId,
          duration,
          intensity,
          notes
        ]
      );
      
      this.log('info', 'Exercise completion tracked', { userId, exerciseId, duration });
      return true;
    } catch (error) {
      this.log('error', 'Failed to track exercise completion', error.message);
      return false;
    }
  }

  /**
   * Get exercise progress
   */
  async getExerciseProgress(userId, timeframe = '30 days') {
    const pool = require('../config/database');
    
    try {
      const result = await pool.query(
        `SELECT * FROM exercise_completions 
         WHERE user_id = $1 
         AND completed_at >= NOW() - INTERVAL '${timeframe}'
         ORDER BY completed_at DESC`,
        [userId]
      );
      
      return result.rows;
    } catch (error) {
      this.log('error', 'Failed to get exercise progress', error.message);
      return [];
    }
  }
}

module.exports = ActivityAgent;
