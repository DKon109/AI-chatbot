const BaseAgent = require('./BaseAgent');

/**
 * Feedback Agent - Generates weekly progress reports aligned with doctor goals
 */
class FeedbackAgent extends BaseAgent {
  constructor() {
    super(
      'FeedbackAgent',
      'Generates weekly progress reports aligned with doctor goals'
    );
    
    // Report templates
    this.reportTemplates = {
      diabetes: {
        title: 'Diabetes Management Weekly Report',
        sections: [
          'Blood Glucose Trends',
          'Medication Adherence',
          'Diet Compliance',
          'Exercise Activity',
          'Weight Management',
          'Recommendations'
        ],
        metrics: [
          'average_glucose',
          'glucose_variability',
          'medication_adherence_rate',
          'diet_compliance_score',
          'exercise_minutes',
          'weight_change'
        ]
      },
      hypertension: {
        title: 'Blood Pressure Management Weekly Report',
        sections: [
          'Blood Pressure Trends',
          'Medication Adherence',
          'Sodium Intake',
          'Exercise Activity',
          'Stress Management',
          'Recommendations'
        ],
        metrics: [
          'average_systolic',
          'average_diastolic',
          'medication_adherence_rate',
          'sodium_intake',
          'exercise_minutes',
          'stress_level'
        ]
      },
      heart_disease: {
        title: 'Cardiac Health Weekly Report',
        sections: [
          'Cardiac Symptoms',
          'Medication Adherence',
          'Exercise Capacity',
          'Diet Compliance',
          'Weight Management',
          'Recommendations'
        ],
        metrics: [
          'symptom_frequency',
          'medication_adherence_rate',
          'exercise_tolerance',
          'diet_compliance_score',
          'weight_change',
          'energy_level'
        ]
      },
      obesity: {
        title: 'Weight Management Weekly Report',
        sections: [
          'Weight Progress',
          'Calorie Intake',
          'Exercise Activity',
          'Diet Compliance',
          'Behavior Changes',
          'Recommendations'
        ],
        metrics: [
          'weight_change',
          'calorie_intake',
          'exercise_minutes',
          'diet_compliance_score',
          'behavior_changes',
          'motivation_level'
        ]
      }
    };
  }

  /**
   * Process feedback generation request
   */
  async process(request) {
    const { 
      userId, 
      condition, 
      timeframe = 'weekly',
      doctorGoals = [],
      includeRecommendations = true
    } = request;

    this.log('info', 'Processing feedback generation request', { 
      userId, 
      condition,
      timeframe
    });

    try {
      // Collect data for the specified timeframe
      const data = await this.collectData(userId, timeframe);
      
      // Analyze progress against doctor goals
      const goalAnalysis = this.analyzeGoalProgress(data, doctorGoals);
      
      // Generate metrics analysis
      const metricsAnalysis = this.analyzeMetrics(data, condition);
      
      // Create progress summary
      const progressSummary = this.createProgressSummary(data, goalAnalysis);
      
      // Generate recommendations
      const recommendations = includeRecommendations ? 
        this.generateRecommendations(metricsAnalysis, goalAnalysis, condition) : [];
      
      // Create comprehensive report
      const report = this.createReport(
        condition, 
        timeframe, 
        progressSummary, 
        metricsAnalysis, 
        goalAnalysis, 
        recommendations
      );
      
      // Save report
      await this.saveReport(userId, report);

      this.log('info', 'Feedback report generated successfully', {
        reportId: report.id,
        sectionsCount: report.sections.length,
        recommendationsCount: recommendations.length
      });

      return {
        success: true,
        report,
        agent: this.name,
        timestamp: new Date().toISOString()
      };

    } catch (error) {
      this.log('error', 'Feedback generation failed', error.message);
      return {
        success: false,
        error: error.message,
        agent: this.name,
        timestamp: new Date().toISOString()
      };
    }
  }

  /**
   * Collect data for the specified timeframe
   */
  async collectData(userId, timeframe) {
    const pool = require('../config/database');
    const timeCondition = this.getTimeCondition(timeframe);
    
    try {
      // Collect various types of data
      const [
        symptomLogs,
        medicationLogs,
        exerciseLogs,
        mealLogs,
        vitalSigns,
        goalProgress
      ] = await Promise.all([
        this.getSymptomLogs(userId, timeCondition),
        this.getMedicationLogs(userId, timeCondition),
        this.getExerciseLogs(userId, timeCondition),
        this.getMealLogs(userId, timeCondition),
        this.getVitalSigns(userId, timeCondition),
        this.getGoalProgress(userId, timeCondition)
      ]);

      return {
        symptomLogs,
        medicationLogs,
        exerciseLogs,
        mealLogs,
        vitalSigns,
        goalProgress,
        timeframe,
        dataPoints: this.calculateDataPoints({
          symptomLogs,
          medicationLogs,
          exerciseLogs,
          mealLogs,
          vitalSigns,
          goalProgress
        })
      };
    } catch (error) {
      this.log('error', 'Failed to collect data', error.message);
      return { error: error.message };
    }
  }

  /**
   * Get time condition for SQL queries
   */
  getTimeCondition(timeframe) {
    const conditions = {
      'daily': "AND created_at >= NOW() - INTERVAL '1 day'",
      'weekly': "AND created_at >= NOW() - INTERVAL '7 days'",
      'monthly': "AND created_at >= NOW() - INTERVAL '30 days'",
      'quarterly': "AND created_at >= NOW() - INTERVAL '90 days'"
    };
    return conditions[timeframe] || conditions.weekly;
  }

  /**
   * Get symptom logs
   */
  async getSymptomLogs(userId, timeCondition) {
    const pool = require('../config/database');
    try {
      const result = await pool.query(
        `SELECT * FROM symptom_logs 
         WHERE user_id = $1 ${timeCondition}
         ORDER BY created_at DESC`,
        [userId]
      );
      return result.rows;
    } catch (error) {
      this.log('error', 'Failed to get symptom logs', error.message);
      return [];
    }
  }

  /**
   * Get medication logs
   */
  async getMedicationLogs(userId, timeCondition) {
    const pool = require('../config/database');
    try {
      const result = await pool.query(
        `SELECT * FROM medication_logs 
         WHERE user_id = $1 ${timeCondition}
         ORDER BY created_at DESC`,
        [userId]
      );
      return result.rows;
    } catch (error) {
      this.log('error', 'Failed to get medication logs', error.message);
      return [];
    }
  }

  /**
   * Get exercise logs
   */
  async getExerciseLogs(userId, timeCondition) {
    const pool = require('../config/database');
    try {
      const result = await pool.query(
        `SELECT * FROM exercise_completions 
         WHERE user_id = $1 ${timeCondition}
         ORDER BY completed_at DESC`,
        [userId]
      );
      return result.rows;
    } catch (error) {
      this.log('error', 'Failed to get exercise logs', error.message);
      return [];
    }
  }

  /**
   * Get meal logs
   */
  async getMealLogs(userId, timeCondition) {
    const pool = require('../config/database');
    try {
      const result = await pool.query(
        `SELECT * FROM meal_validation_logs 
         WHERE user_id = $1 ${timeCondition}
         ORDER BY created_at DESC`,
        [userId]
      );
      return result.rows;
    } catch (error) {
      this.log('error', 'Failed to get meal logs', error.message);
      return [];
    }
  }

  /**
   * Get vital signs
   */
  async getVitalSigns(userId, timeCondition) {
    const pool = require('../config/database');
    try {
      const result = await pool.query(
        `SELECT * FROM vital_signs 
         WHERE user_id = $1 ${timeCondition}
         ORDER BY recorded_at DESC`,
        [userId]
      );
      return result.rows;
    } catch (error) {
      this.log('error', 'Failed to get vital signs', error.message);
      return [];
    }
  }

  /**
   * Get goal progress
   */
  async getGoalProgress(userId, timeCondition) {
    const pool = require('../config/database');
    try {
      const result = await pool.query(
        `SELECT * FROM goal_progress 
         WHERE user_id = $1 ${timeCondition}
         ORDER BY updated_at DESC`,
        [userId]
      );
      return result.rows;
    } catch (error) {
      this.log('error', 'Failed to get goal progress', error.message);
      return [];
    }
  }

  /**
   * Calculate data points summary
   */
  calculateDataPoints(data) {
    return {
      totalSymptomEntries: data.symptomLogs.length,
      totalMedicationEntries: data.medicationLogs.length,
      totalExerciseEntries: data.exerciseLogs.length,
      totalMealEntries: data.mealLogs.length,
      totalVitalSignEntries: data.vitalSigns.length,
      totalGoalUpdates: data.goalProgress.length,
      dataCompleteness: this.calculateDataCompleteness(data)
    };
  }

  /**
   * Calculate data completeness score
   */
  calculateDataCompleteness(data) {
    const expectedEntries = {
      symptomLogs: 7, // daily for a week
      medicationLogs: 21, // 3 times daily for a week
      exerciseLogs: 3, // 3 times per week
      mealLogs: 21, // 3 meals daily for a week
      vitalSigns: 7, // daily for a week
      goalProgress: 1 // weekly update
    };

    let totalExpected = 0;
    let totalActual = 0;

    Object.keys(expectedEntries).forEach(key => {
      const expected = expectedEntries[key];
      const actual = data[key].length;
      totalExpected += expected;
      totalActual += Math.min(actual, expected);
    });

    return totalExpected > 0 ? (totalActual / totalExpected) * 100 : 0;
  }

  /**
   * Analyze progress against doctor goals
   */
  analyzeGoalProgress(data, doctorGoals) {
    const analysis = {
      goals: [],
      overallProgress: 0,
      completedGoals: 0,
      onTrackGoals: 0,
      needsAttentionGoals: 0
    };

    doctorGoals.forEach(goal => {
      const progress = this.calculateGoalProgress(goal, data);
      analysis.goals.push({
        ...goal,
        progress,
        status: this.determineGoalStatus(progress),
        lastUpdated: new Date().toISOString()
      });

      if (progress >= 100) analysis.completedGoals++;
      else if (progress >= 70) analysis.onTrackGoals++;
      else analysis.needsAttentionGoals++;
    });

    analysis.overallProgress = analysis.goals.length > 0 ? 
      analysis.goals.reduce((sum, goal) => sum + goal.progress, 0) / analysis.goals.length : 0;

    return analysis;
  }

  /**
   * Calculate progress for a specific goal
   */
  calculateGoalProgress(goal, data) {
    // This would be customized based on goal type
    switch (goal.type) {
      case 'medication_adherence':
        return this.calculateMedicationAdherence(data.medicationLogs);
      case 'exercise':
        return this.calculateExerciseProgress(data.exerciseLogs, goal.target);
      case 'diet':
        return this.calculateDietProgress(data.mealLogs, goal.target);
      case 'weight_loss':
        return this.calculateWeightProgress(data.vitalSigns, goal.target);
      default:
        return 0;
    }
  }

  /**
   * Calculate medication adherence percentage
   */
  calculateMedicationAdherence(medicationLogs) {
    if (medicationLogs.length === 0) return 0;
    
    const takenCount = medicationLogs.filter(log => log.taken).length;
    return (takenCount / medicationLogs.length) * 100;
  }

  /**
   * Calculate exercise progress
   */
  calculateExerciseProgress(exerciseLogs, target) {
    if (exerciseLogs.length === 0) return 0;
    
    const totalMinutes = exerciseLogs.reduce((sum, log) => sum + (log.duration || 0), 0);
    const targetMinutes = target ? parseInt(target.match(/(\d+)/)?.[1] || '150') : 150;
    
    return Math.min((totalMinutes / targetMinutes) * 100, 100);
  }

  /**
   * Calculate diet progress
   */
  calculateDietProgress(mealLogs, target) {
    if (mealLogs.length === 0) return 0;
    
    const compliantMeals = mealLogs.filter(log => 
      log.assessment && log.assessment.status === 'approved'
    ).length;
    
    return (compliantMeals / mealLogs.length) * 100;
  }

  /**
   * Calculate weight progress
   */
  calculateWeightProgress(vitalSigns, target) {
    if (vitalSigns.length < 2) return 0;
    
    const sortedSigns = vitalSigns.sort((a, b) => new Date(a.recorded_at) - new Date(b.recorded_at));
    const startWeight = sortedSigns[0].weight;
    const currentWeight = sortedSigns[sortedSigns.length - 1].weight;
    
    if (!startWeight || !currentWeight) return 0;
    
    const weightChange = startWeight - currentWeight;
    const targetChange = target ? parseFloat(target.match(/(\d+)/)?.[1] || '5') : 5;
    
    return Math.min((weightChange / targetChange) * 100, 100);
  }

  /**
   * Determine goal status based on progress
   */
  determineGoalStatus(progress) {
    if (progress >= 100) return 'completed';
    if (progress >= 70) return 'on_track';
    if (progress >= 40) return 'needs_attention';
    return 'at_risk';
  }

  /**
   * Analyze metrics for the condition
   */
  analyzeMetrics(data, condition) {
    const conditionKey = condition.toLowerCase().replace(/\s+/g, '_');
    const template = this.reportTemplates[conditionKey];
    
    if (!template) {
      return this.generateGenericMetrics(data);
    }

    const analysis = {};
    
    template.metrics.forEach(metric => {
      analysis[metric] = this.calculateMetric(data, metric);
    });

    return analysis;
  }

  /**
   * Calculate specific metric
   */
  calculateMetric(data, metric) {
    switch (metric) {
      case 'average_glucose':
        return this.calculateAverageGlucose(data.vitalSigns);
      case 'medication_adherence_rate':
        return this.calculateMedicationAdherence(data.medicationLogs);
      case 'exercise_minutes':
        return this.calculateTotalExerciseMinutes(data.exerciseLogs);
      case 'diet_compliance_score':
        return this.calculateDietCompliance(data.mealLogs);
      default:
        return 0;
    }
  }

  /**
   * Calculate average glucose
   */
  calculateAverageGlucose(vitalSigns) {
    const glucoseReadings = vitalSigns
      .filter(sign => sign.glucose_level)
      .map(sign => sign.glucose_level);
    
    if (glucoseReadings.length === 0) return null;
    
    return glucoseReadings.reduce((sum, reading) => sum + reading, 0) / glucoseReadings.length;
  }

  /**
   * Calculate total exercise minutes
   */
  calculateTotalExerciseMinutes(exerciseLogs) {
    return exerciseLogs.reduce((sum, log) => sum + (log.duration || 0), 0);
  }

  /**
   * Calculate diet compliance score
   */
  calculateDietCompliance(mealLogs) {
    if (mealLogs.length === 0) return 0;
    
    const compliantMeals = mealLogs.filter(log => 
      log.assessment && log.assessment.status === 'approved'
    ).length;
    
    return (compliantMeals / mealLogs.length) * 100;
  }

  /**
   * Generate generic metrics
   */
  generateGenericMetrics(data) {
    return {
      data_completeness: data.dataPoints.dataCompleteness,
      total_activities: data.dataPoints.totalExerciseEntries,
      medication_adherence: this.calculateMedicationAdherence(data.medicationLogs),
      symptom_frequency: data.symptomLogs.length,
      meal_compliance: this.calculateDietCompliance(data.mealLogs)
    };
  }

  /**
   * Create progress summary
   */
  createProgressSummary(data, goalAnalysis) {
    return {
      period: data.timeframe,
      dataCompleteness: data.dataPoints.dataCompleteness,
      overallProgress: goalAnalysis.overallProgress,
      goalsSummary: {
        total: goalAnalysis.goals.length,
        completed: goalAnalysis.completedGoals,
        onTrack: goalAnalysis.onTrackGoals,
        needsAttention: goalAnalysis.needsAttentionGoals
      },
      keyInsights: this.generateKeyInsights(data, goalAnalysis),
      trends: this.identifyTrends(data)
    };
  }

  /**
   * Generate key insights
   */
  generateKeyInsights(data, goalAnalysis) {
    const insights = [];

    if (goalAnalysis.overallProgress > 80) {
      insights.push('Excellent progress! You\'re exceeding most of your health goals.');
    } else if (goalAnalysis.overallProgress > 60) {
      insights.push('Good progress! You\'re on track with most of your health goals.');
    } else if (goalAnalysis.overallProgress > 40) {
      insights.push('Some progress made. Focus on areas that need more attention.');
    } else {
      insights.push('Limited progress this week. Consider adjusting your approach.');
    }

    if (data.dataPoints.dataCompleteness < 50) {
      insights.push('Low data completeness. More consistent logging would improve insights.');
    }

    if (data.symptomLogs.length > 5) {
      insights.push('Frequent symptom logging detected. Consider discussing with your doctor.');
    }

    return insights;
  }

  /**
   * Identify trends in data
   */
  identifyTrends(data) {
    const trends = [];

    // Exercise trend
    if (data.exerciseLogs.length > 0) {
      const recentExercise = data.exerciseLogs.slice(0, 3);
      const olderExercise = data.exerciseLogs.slice(3, 6);
      
      if (recentExercise.length > 0 && olderExercise.length > 0) {
        const recentAvg = recentExercise.reduce((sum, log) => sum + (log.duration || 0), 0) / recentExercise.length;
        const olderAvg = olderExercise.reduce((sum, log) => sum + (log.duration || 0), 0) / olderExercise.length;
        
        if (recentAvg > olderAvg * 1.2) {
          trends.push('Exercise activity is increasing');
        } else if (recentAvg < olderAvg * 0.8) {
          trends.push('Exercise activity is decreasing');
        }
      }
    }

    return trends;
  }

  /**
   * Generate recommendations
   */
  generateRecommendations(metricsAnalysis, goalAnalysis, condition) {
    const recommendations = [];

    // Goal-based recommendations
    goalAnalysis.goals.forEach(goal => {
      if (goal.status === 'needs_attention' || goal.status === 'at_risk') {
        recommendations.push({
          type: 'goal_focus',
          priority: 'high',
          message: `Focus on improving ${goal.type} - currently at ${Math.round(goal.progress)}% progress`,
          action: `Increase ${goal.type} activities`
        });
      }
    });

    // Metric-based recommendations
    if (metricsAnalysis.medication_adherence_rate < 80) {
      recommendations.push({
        type: 'medication',
        priority: 'high',
        message: 'Medication adherence is below target. Set reminders to improve consistency.',
        action: 'Enable medication reminders'
      });
    }

    if (metricsAnalysis.exercise_minutes < 150) {
      recommendations.push({
        type: 'exercise',
        priority: 'medium',
        message: 'Exercise minutes below recommended 150 per week.',
        action: 'Increase physical activity'
      });
    }

    if (metricsAnalysis.diet_compliance_score < 70) {
      recommendations.push({
        type: 'diet',
        priority: 'medium',
        message: 'Diet compliance could be improved.',
        action: 'Review meal choices and portion sizes'
      });
    }

    return recommendations;
  }

  /**
   * Create comprehensive report
   */
  createReport(condition, timeframe, progressSummary, metricsAnalysis, goalAnalysis, recommendations) {
    const conditionKey = condition.toLowerCase().replace(/\s+/g, '_');
    const template = this.reportTemplates[conditionKey];
    
    const report = {
      id: `report_${Date.now()}`,
      condition,
      timeframe,
      generatedAt: new Date().toISOString(),
      title: template?.title || `${condition} Weekly Report`,
      summary: progressSummary,
      metrics: metricsAnalysis,
      goals: goalAnalysis,
      recommendations,
      sections: template?.sections || [
        'Progress Summary',
        'Key Metrics',
        'Goal Analysis',
        'Recommendations'
      ]
    };

    return report;
  }

  /**
   * Save report to database
   */
  async saveReport(userId, report) {
    const pool = require('../config/database');
    
    try {
      await pool.query(
        `INSERT INTO weekly_reports (id, user_id, report_data, created_at)
         VALUES ($1, $2, $3, NOW())`,
        [
          report.id,
          userId,
          JSON.stringify(report)
        ]
      );
    } catch (error) {
      this.log('error', 'Failed to save report', error.message);
    }
  }

  /**
   * Get user's report history
   */
  async getReportHistory(userId, limit = 10) {
    const pool = require('../config/database');
    
    try {
      const result = await pool.query(
        `SELECT * FROM weekly_reports 
         WHERE user_id = $1 
         ORDER BY created_at DESC 
         LIMIT $2`,
        [userId, limit]
      );
      
      return result.rows.map(row => JSON.parse(row.report_data));
    } catch (error) {
      this.log('error', 'Failed to get report history', error.message);
      return [];
    }
  }
}

module.exports = FeedbackAgent;
