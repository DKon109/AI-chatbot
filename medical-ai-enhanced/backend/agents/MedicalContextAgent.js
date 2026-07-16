const BaseAgent = require('./BaseAgent');

/**
 * Medical Context Agent - Interprets doctor's input, sets health goals, and ensures recommendations comply with medical guidelines
 */
class MedicalContextAgent extends BaseAgent {
  constructor() {
    super(
      'MedicalContextAgent',
      'Interprets doctor\'s input, sets health goals, and ensures recommendations comply with medical guidelines'
    );
    
    // Medical guidelines database
    this.medicalGuidelines = {
      diabetes: {
        bloodGlucose: { target: '70-130 mg/dL', critical: '<70 or >180' },
        hba1c: { target: '<7%', critical: '>9%' },
        diet: ['low carb', 'fiber rich', 'avoid processed sugars'],
        exercise: ['150 min/week moderate', 'resistance training'],
        medications: ['metformin', 'insulin', 'sulfonylureas'],
        monitoring: ['daily glucose', 'quarterly hba1c', 'annual eye exam']
      },
      hypertension: {
        bloodPressure: { target: '<140/90', critical: '>160/100' },
        diet: ['low sodium', 'DASH diet', 'limit alcohol'],
        exercise: ['30 min/day', 'aerobic exercise'],
        medications: ['ACE inhibitors', 'diuretics', 'beta blockers'],
        monitoring: ['daily BP', 'monthly checkup', 'annual labs']
      },
      heart_disease: {
        cholesterol: { target: 'LDL <100', critical: 'LDL >190' },
        diet: ['low saturated fat', 'omega-3 rich', 'plant based'],
        exercise: ['cardiac rehab', 'gradual increase'],
        medications: ['statins', 'aspirin', 'beta blockers'],
        monitoring: ['lipid panel', 'stress test', 'echocardiogram']
      },
      obesity: {
        bmi: { target: '18.5-24.9', critical: '>30' },
        diet: ['calorie deficit', 'portion control', 'whole foods'],
        exercise: ['gradual increase', 'strength training'],
        medications: ['GLP-1 agonists', 'orlistat'],
        monitoring: ['weekly weight', 'monthly measurements']
      }
    };

    // Health goal templates
    this.goalTemplates = {
      diabetes: [
        { type: 'glucose_control', target: 'Maintain blood glucose 70-130 mg/dL', timeframe: 'ongoing' },
        { type: 'weight_loss', target: 'Lose 5-10% body weight', timeframe: '6 months' },
        { type: 'exercise', target: '150 minutes moderate exercise per week', timeframe: 'ongoing' },
        { type: 'medication_adherence', target: 'Take medications as prescribed', timeframe: 'ongoing' }
      ],
      hypertension: [
        { type: 'blood_pressure', target: 'Maintain BP <140/90', timeframe: 'ongoing' },
        { type: 'sodium_reduction', target: 'Limit sodium to <2g/day', timeframe: 'ongoing' },
        { type: 'exercise', target: '30 minutes daily exercise', timeframe: 'ongoing' },
        { type: 'stress_management', target: 'Practice stress reduction techniques', timeframe: 'ongoing' }
      ],
      heart_disease: [
        { type: 'cholesterol', target: 'Maintain LDL <100 mg/dL', timeframe: 'ongoing' },
        { type: 'cardiac_rehab', target: 'Complete cardiac rehabilitation program', timeframe: '3 months' },
        { type: 'lifestyle', target: 'Adopt heart-healthy lifestyle', timeframe: 'ongoing' },
        { type: 'medication_adherence', target: 'Take all prescribed medications', timeframe: 'ongoing' }
      ]
    };
  }

  /**
   * Process medical context request
   */
  async process(request) {
    const { 
      userId, 
      doctorInput, 
      patientCondition, 
      currentMetrics = {},
      patientHistory = []
    } = request;

    this.log('info', 'Processing medical context request', { 
      userId, 
      condition: patientCondition,
      doctorInput: doctorInput.substring(0, 100) + '...'
    });

    try {
      // Interpret doctor's input
      const interpretedInput = this.interpretDoctorInput(doctorInput);
      
      // Set health goals based on condition and doctor input
      const healthGoals = this.setHealthGoals(patientCondition, interpretedInput, currentMetrics);
      
      // Ensure recommendations comply with medical guidelines
      const compliantRecommendations = this.ensureCompliance(
        interpretedInput.recommendations, 
        patientCondition
      );
      
      // Generate monitoring plan
      const monitoringPlan = this.generateMonitoringPlan(
        patientCondition, 
        healthGoals, 
        currentMetrics
      );
      
      // Create care plan
      const carePlan = this.createCarePlan(
        healthGoals, 
        compliantRecommendations, 
        monitoringPlan
      );

      // Log the medical context for tracking
      await this.logMedicalContext(userId, patientCondition, carePlan);

      this.log('info', 'Medical context processed successfully', {
        goalsCount: healthGoals.length,
        recommendationsCount: compliantRecommendations.length
      });

      return {
        success: true,
        interpretedInput,
        healthGoals,
        compliantRecommendations,
        monitoringPlan,
        carePlan,
        agent: this.name,
        timestamp: new Date().toISOString()
      };

    } catch (error) {
      this.log('error', 'Medical context processing failed', error.message);
      return {
        success: false,
        error: error.message,
        agent: this.name,
        timestamp: new Date().toISOString()
      };
    }
  }

  /**
   * Interpret doctor's input using NLP techniques
   */
  interpretDoctorInput(doctorInput) {
    const input = doctorInput.toLowerCase();
    
    const interpretation = {
      medications: [],
      lifestyleChanges: [],
      monitoring: [],
      restrictions: [],
      goals: [],
      urgency: 'normal',
      confidence: 0.8
    };

    // Extract medications
    const medicationKeywords = ['prescribe', 'medication', 'drug', 'pill', 'tablet'];
    if (medicationKeywords.some(keyword => input.includes(keyword))) {
      interpretation.medications = this.extractMedications(input);
    }

    // Extract lifestyle changes
    const lifestyleKeywords = ['exercise', 'diet', 'lifestyle', 'activity', 'food'];
    if (lifestyleKeywords.some(keyword => input.includes(keyword))) {
      interpretation.lifestyleChanges = this.extractLifestyleChanges(input);
    }

    // Extract monitoring requirements
    const monitoringKeywords = ['check', 'monitor', 'measure', 'test', 'track'];
    if (monitoringKeywords.some(keyword => input.includes(keyword))) {
      interpretation.monitoring = this.extractMonitoring(input);
    }

    // Extract restrictions
    const restrictionKeywords = ['avoid', 'limit', 'restrict', 'no', 'don\'t'];
    if (restrictionKeywords.some(keyword => input.includes(keyword))) {
      interpretation.restrictions = this.extractRestrictions(input);
    }

    // Determine urgency
    if (input.includes('urgent') || input.includes('immediate') || input.includes('asap')) {
      interpretation.urgency = 'urgent';
    } else if (input.includes('gradual') || input.includes('slowly') || input.includes('over time')) {
      interpretation.urgency = 'gradual';
    }

    return interpretation;
  }

  /**
   * Extract medications from doctor input
   */
  extractMedications(input) {
    const commonMedications = [
      'metformin', 'insulin', 'lisinopril', 'amlodipine', 'atorvastatin',
      'metoprolol', 'hydrochlorothiazide', 'aspirin', 'warfarin', 'omeprazole'
    ];
    
    return commonMedications.filter(med => input.includes(med));
  }

  /**
   * Extract lifestyle changes from doctor input
   */
  extractLifestyleChanges(input) {
    const changes = [];
    
    if (input.includes('exercise') || input.includes('activity')) {
      changes.push('Increase physical activity');
    }
    if (input.includes('diet') || input.includes('food') || input.includes('eat')) {
      changes.push('Modify diet');
    }
    if (input.includes('weight') || input.includes('lose')) {
      changes.push('Weight management');
    }
    if (input.includes('stress') || input.includes('relax')) {
      changes.push('Stress management');
    }
    
    return changes;
  }

  /**
   * Extract monitoring requirements from doctor input
   */
  extractMonitoring(input) {
    const monitoring = [];
    
    if (input.includes('blood pressure') || input.includes('bp')) {
      monitoring.push('Blood pressure monitoring');
    }
    if (input.includes('glucose') || input.includes('sugar')) {
      monitoring.push('Blood glucose monitoring');
    }
    if (input.includes('weight')) {
      monitoring.push('Weight tracking');
    }
    if (input.includes('heart rate') || input.includes('pulse')) {
      monitoring.push('Heart rate monitoring');
    }
    
    return monitoring;
  }

  /**
   * Extract restrictions from doctor input
   */
  extractRestrictions(input) {
    const restrictions = [];
    
    if (input.includes('salt') || input.includes('sodium')) {
      restrictions.push('Limit sodium intake');
    }
    if (input.includes('sugar') || input.includes('sweet')) {
      restrictions.push('Limit sugar intake');
    }
    if (input.includes('alcohol')) {
      restrictions.push('Limit alcohol consumption');
    }
    if (input.includes('smoking') || input.includes('tobacco')) {
      restrictions.push('No smoking');
    }
    
    return restrictions;
  }

  /**
   * Set health goals based on condition and doctor input
   */
  setHealthGoals(condition, interpretedInput, currentMetrics) {
    const conditionKey = condition.toLowerCase().replace(/\s+/g, '_');
    const baseGoals = this.goalTemplates[conditionKey] || this.goalTemplates.diabetes;
    
    const goals = baseGoals.map(goal => ({
      ...goal,
      id: `goal_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
      status: 'active',
      createdAt: new Date().toISOString(),
      progress: 0,
      milestones: this.generateMilestones(goal, currentMetrics)
    }));

    // Add custom goals from doctor input
    if (interpretedInput.goals && interpretedInput.goals.length > 0) {
      interpretedInput.goals.forEach(goal => {
        goals.push({
          id: `goal_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
          type: 'custom',
          target: goal,
          timeframe: 'ongoing',
          status: 'active',
          createdAt: new Date().toISOString(),
          progress: 0,
          milestones: []
        });
      });
    }

    return goals;
  }

  /**
   * Generate milestones for a goal
   */
  generateMilestones(goal, currentMetrics) {
    const milestones = [];
    
    if (goal.type === 'weight_loss' && currentMetrics.weight) {
      const targetWeight = currentMetrics.weight * 0.95; // 5% weight loss
      milestones.push(
        { target: `Lose 2% weight (${currentMetrics.weight * 0.98} lbs)`, timeframe: '1 month' },
        { target: `Lose 5% weight (${targetWeight} lbs)`, timeframe: '3 months' },
        { target: `Lose 10% weight (${currentMetrics.weight * 0.9} lbs)`, timeframe: '6 months' }
      );
    }
    
    if (goal.type === 'exercise') {
      milestones.push(
        { target: 'Start with 10 minutes daily', timeframe: '1 week' },
        { target: 'Increase to 20 minutes daily', timeframe: '2 weeks' },
        { target: 'Reach 30 minutes daily', timeframe: '1 month' }
      );
    }
    
    return milestones;
  }

  /**
   * Ensure recommendations comply with medical guidelines
   */
  ensureCompliance(recommendations, condition) {
    const conditionKey = condition.toLowerCase().replace(/\s+/g, '_');
    const guidelines = this.medicalGuidelines[conditionKey];
    
    if (!guidelines) {
      return recommendations.map(rec => ({
        ...rec,
        compliance: 'unknown',
        warning: 'No specific guidelines found for this condition'
      }));
    }

    return recommendations.map(rec => {
      const compliance = this.checkCompliance(rec, guidelines);
      return {
        ...rec,
        compliance: compliance.status,
        warning: compliance.warning,
        guidelineReference: compliance.reference
      };
    });
  }

  /**
   * Check compliance of a recommendation with guidelines
   */
  checkCompliance(recommendation, guidelines) {
    const rec = recommendation.toLowerCase();
    
    // Check diet recommendations
    if (rec.includes('diet') || rec.includes('food')) {
      const guidelineDiet = guidelines.diet || [];
      const hasCompliantDiet = guidelineDiet.some(diet => rec.includes(diet));
      
      if (hasCompliantDiet) {
        return { status: 'compliant', reference: 'Diet guidelines' };
      } else {
        return { 
          status: 'non_compliant', 
          warning: 'Recommendation may not align with dietary guidelines',
          reference: 'Diet guidelines'
        };
      }
    }
    
    // Check exercise recommendations
    if (rec.includes('exercise') || rec.includes('activity')) {
      const guidelineExercise = guidelines.exercise || [];
      const hasCompliantExercise = guidelineExercise.some(ex => rec.includes(ex));
      
      if (hasCompliantExercise) {
        return { status: 'compliant', reference: 'Exercise guidelines' };
      } else {
        return { 
          status: 'warning', 
          warning: 'Exercise recommendation should be gradual and appropriate',
          reference: 'Exercise guidelines'
        };
      }
    }
    
    return { status: 'compliant', reference: 'General guidelines' };
  }

  /**
   * Generate monitoring plan
   */
  generateMonitoringPlan(condition, goals, currentMetrics) {
    const conditionKey = condition.toLowerCase().replace(/\s+/g, '_');
    const guidelines = this.medicalGuidelines[conditionKey];
    
    const monitoringPlan = {
      daily: [],
      weekly: [],
      monthly: [],
      quarterly: [],
      annually: []
    };

    if (guidelines && guidelines.monitoring) {
      guidelines.monitoring.forEach(monitor => {
        if (monitor.includes('daily')) {
          monitoringPlan.daily.push(monitor);
        } else if (monitor.includes('weekly')) {
          monitoringPlan.weekly.push(monitor);
        } else if (monitor.includes('monthly')) {
          monitoringPlan.monthly.push(monitor);
        } else if (monitor.includes('quarterly')) {
          monitoringPlan.quarterly.push(monitor);
        } else if (monitor.includes('annual')) {
          monitoringPlan.annually.push(monitor);
        }
      });
    }

    // Add goal-specific monitoring
    goals.forEach(goal => {
      if (goal.type === 'glucose_control') {
        monitoringPlan.daily.push('Blood glucose monitoring');
      }
      if (goal.type === 'blood_pressure') {
        monitoringPlan.daily.push('Blood pressure monitoring');
      }
      if (goal.type === 'weight_loss') {
        monitoringPlan.weekly.push('Weight tracking');
      }
    });

    return monitoringPlan;
  }

  /**
   * Create comprehensive care plan
   */
  createCarePlan(goals, recommendations, monitoringPlan) {
    return {
      id: `careplan_${Date.now()}`,
      goals,
      recommendations,
      monitoringPlan,
      status: 'active',
      createdAt: new Date().toISOString(),
      lastUpdated: new Date().toISOString(),
      nextReview: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString() // 30 days
    };
  }

  /**
   * Log medical context for tracking
   */
  async logMedicalContext(userId, condition, carePlan) {
    const pool = require('../config/database');
    
    try {
      await pool.query(
        `INSERT INTO medical_context_logs (id, user_id, condition, care_plan, created_at)
         VALUES ($1, $2, $3, $4, NOW())`,
        [
          require('crypto').randomUUID(),
          userId,
          condition,
          JSON.stringify(carePlan)
        ]
      );
    } catch (error) {
      this.log('error', 'Failed to log medical context', error.message);
    }
  }

  /**
   * Update goal progress
   */
  updateGoalProgress(goalId, progress, notes = '') {
    // This would update goal progress in the database
    this.log('info', 'Goal progress updated', { goalId, progress, notes });
    return true;
  }

  /**
   * Get care plan for user
   */
  async getCarePlan(userId) {
    const pool = require('../config/database');
    
    try {
      const result = await pool.query(
        `SELECT * FROM medical_context_logs 
         WHERE user_id = $1 
         ORDER BY created_at DESC 
         LIMIT 1`,
        [userId]
      );
      
      return result.rows[0] || null;
    } catch (error) {
      this.log('error', 'Failed to get care plan', error.message);
      return null;
    }
  }
}

module.exports = MedicalContextAgent;
