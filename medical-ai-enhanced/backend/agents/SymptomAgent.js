const BaseAgent = require('./BaseAgent');
const SymptomAnalysisService = require('../services/SymptomAnalysisService');

/**
 * Symptom Agent - Handles patient symptom logging and severity analysis
 */
class SymptomAgent extends BaseAgent {
  constructor() {
    super(
      'SymptomAgent',
      'Handles patient symptom logging and severity analysis with emergency detection'
    );
    this.severityThresholds = {
      critical: 0.9,
      high: 0.7,
      moderate: 0.5,
      low: 0.3
    };
  }

  /**
   * Process symptom analysis request
   */
  async process(request) {
    const { userId, symptoms, additionalContext = {} } = request;
    
    this.log('info', 'Processing symptom analysis', { userId, symptoms });

    try {
      // Analyze symptoms using the advanced analysis service
      const analysis = await SymptomAnalysisService.analyzeSymptoms(symptoms);
      
      // Enhance analysis with additional context
      const enhancedAnalysis = this.enhanceAnalysis(analysis, additionalContext);
      
      // Log the analysis for tracking
      await this.logSymptomAnalysis(userId, symptoms, enhancedAnalysis);
      
      // Generate recommendations based on severity
      const recommendations = this.generateRecommendations(enhancedAnalysis);
      
      this.log('info', 'Symptom analysis completed', {
        severity: enhancedAnalysis.severity,
        emergency: enhancedAnalysis.emergency,
        confidence: enhancedAnalysis.confidence
      });

      return {
        success: true,
        analysis: enhancedAnalysis,
        recommendations,
        agent: this.name,
        timestamp: new Date().toISOString()
      };

    } catch (error) {
      this.log('error', 'Symptom analysis failed', error.message);
      return {
        success: false,
        error: error.message,
        agent: this.name,
        timestamp: new Date().toISOString()
      };
    }
  }

  /**
   * Enhance analysis with additional context
   */
  enhanceAnalysis(analysis, context) {
    const enhanced = { ...analysis };
    
    // Adjust severity based on patient history
    if (context.patientHistory) {
      enhanced.patientHistory = context.patientHistory;
      
      // Increase severity if patient has relevant medical history
      if (this.hasRelevantHistory(analysis.possible_diseases, context.patientHistory)) {
        enhanced.severity = this.increaseSeverity(enhanced.severity);
        enhanced.confidence = Math.min(enhanced.confidence + 0.1, 1.0);
      }
    }

    // Adjust based on age
    if (context.age) {
      enhanced.ageContext = this.getAgeContext(context.age);
      if (enhanced.ageContext.riskMultiplier > 1) {
        enhanced.severity = this.increaseSeverity(enhanced.severity);
      }
    }

    // Adjust based on medications
    if (context.medications) {
      enhanced.medicationInteractions = this.checkMedicationInteractions(
        analysis.possible_diseases, 
        context.medications
      );
    }

    return enhanced;
  }

  /**
   * Check if patient has relevant medical history
   */
  hasRelevantHistory(possibleDiseases, history) {
    if (!possibleDiseases || !history) return false;
    
    const diseaseNames = possibleDiseases.map(d => d.disease.toLowerCase());
    const historyConditions = history.map(h => h.condition.toLowerCase());
    
    return diseaseNames.some(disease => 
      historyConditions.some(condition => 
        condition.includes(disease) || disease.includes(condition)
      )
    );
  }

  /**
   * Increase severity level
   */
  increaseSeverity(currentSeverity) {
    const levels = ['low', 'moderate', 'high', 'critical'];
    const currentIndex = levels.indexOf(currentSeverity);
    return levels[Math.min(currentIndex + 1, levels.length - 1)];
  }

  /**
   * Get age-based risk context
   */
  getAgeContext(age) {
    if (age >= 65) return { riskMultiplier: 1.5, category: 'elderly' };
    if (age >= 50) return { riskMultiplier: 1.2, category: 'middle-aged' };
    if (age <= 18) return { riskMultiplier: 1.3, category: 'pediatric' };
    return { riskMultiplier: 1.0, category: 'adult' };
  }

  /**
   * Check medication interactions
   */
  checkMedicationInteractions(possibleDiseases, medications) {
    // This would integrate with a drug interaction database
    // For now, return basic interaction warnings
    const interactions = [];
    
    medications.forEach(med => {
      if (med.name.toLowerCase().includes('blood thinner') && 
          possibleDiseases.some(d => d.disease.toLowerCase().includes('bleeding'))) {
        interactions.push({
          medication: med.name,
          warning: 'Increased bleeding risk',
          severity: 'high'
        });
      }
    });

    return interactions;
  }

  /**
   * Generate recommendations based on analysis
   */
  generateRecommendations(analysis) {
    const recommendations = {
      immediate: [],
      shortTerm: [],
      longTerm: [],
      monitoring: []
    };

    if (analysis.emergency || analysis.severity === 'critical') {
      recommendations.immediate.push({
        action: 'call_emergency',
        priority: 'critical',
        message: 'Call 911 immediately',
        reason: 'Critical symptoms detected'
      });
      
      recommendations.immediate.push({
        action: 'go_to_er',
        priority: 'critical',
        message: 'Go to emergency room',
        reason: 'Immediate medical attention required'
      });
    }

    if (analysis.severity === 'high') {
      recommendations.shortTerm.push({
        action: 'urgent_care',
        priority: 'high',
        message: 'Visit urgent care within 24 hours',
        reason: 'High severity symptoms'
      });
    }

    if (analysis.severity === 'moderate') {
      recommendations.shortTerm.push({
        action: 'schedule_appointment',
        priority: 'medium',
        message: 'Schedule doctor appointment within a week',
        reason: 'Moderate symptoms require evaluation'
      });
    }

    // Add monitoring recommendations
    recommendations.monitoring.push({
      action: 'track_symptoms',
      priority: 'medium',
      message: 'Keep symptom diary',
      reason: 'Track symptom progression'
    });

    return recommendations;
  }

  /**
   * Log symptom analysis to database
   */
  async logSymptomAnalysis(userId, symptoms, analysis) {
    const pool = require('../config/database');
    
    try {
      await pool.query(
        `INSERT INTO symptom_logs (id, user_id, symptoms, analysis_result, severity, emergency, confidence, created_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, NOW())`,
        [
          require('crypto').randomUUID(),
          userId,
          JSON.stringify(symptoms),
          JSON.stringify(analysis),
          analysis.severity,
          analysis.emergency,
          analysis.confidence
        ]
      );
    } catch (error) {
      this.log('error', 'Failed to log symptom analysis', error.message);
    }
  }

  /**
   * Get symptom history for a patient
   */
  async getSymptomHistory(userId, limit = 10) {
    const pool = require('../config/database');
    
    try {
      const result = await pool.query(
        `SELECT * FROM symptom_logs 
         WHERE user_id = $1 
         ORDER BY created_at DESC 
         LIMIT $2`,
        [userId, limit]
      );
      
      return result.rows;
    } catch (error) {
      this.log('error', 'Failed to get symptom history', error.message);
      return [];
    }
  }
}

module.exports = SymptomAgent;
