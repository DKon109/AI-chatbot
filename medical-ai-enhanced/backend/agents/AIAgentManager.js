const BaseAgent = require('./BaseAgent');
const SymptomAgent = require('./SymptomAgent');
const HospitalInsuranceAgent = require('./HospitalInsuranceAgent');
const PharmacyPrescriptionAgent = require('./PharmacyPrescriptionAgent');
const MedicalContextAgent = require('./MedicalContextAgent');
const MealNutritionAgent = require('./MealNutritionAgent');
const ActivityAgent = require('./ActivityAgent');
const MotivationAgent = require('./MotivationAgent');
const FeedbackAgent = require('./FeedbackAgent');
const ConversationAgent = require('./ConversationAgent');

/**
 * AI Agent Manager - Coordinates all medical AI agents
 */
class AIAgentManager extends BaseAgent {
  constructor() {
    super(
      'AIAgentManager',
      'Coordinates all medical AI agents for comprehensive patient care'
    );
    
    // Initialize all agents
    this.agents = {
      conversation: new ConversationAgent(),
      symptom: new SymptomAgent(),
      hospital: new HospitalInsuranceAgent(),
      pharmacy: new PharmacyPrescriptionAgent(),
      medicalContext: new MedicalContextAgent(),
      nutrition: new MealNutritionAgent(),
      activity: new ActivityAgent(),
      motivation: new MotivationAgent(),
      feedback: new FeedbackAgent()
    };

    // Agent routing rules
    this.routingRules = {
      'symptom_analysis': ['symptom', 'hospital'],
      'food_analysis': ['nutrition'],
      'exercise_recommendation': ['activity'],
      'medication_reminder': ['motivation', 'pharmacy'],
      'doctor_input': ['medicalContext'],
      'progress_report': ['feedback'],
      'emergency_detection': ['symptom', 'hospital'],
      'goal_setting': ['medicalContext', 'motivation'],
      'adherence_tracking': ['motivation', 'feedback']
    };
  }

  /**
   * Detect if this is a natural conversation vs medical analysis
   */
  detectNaturalConversation(data, requestType) {
    // If explicitly medical request type, use medical analysis
    if (requestType === 'symptom_analysis' || requestType === 'food_analysis') {
      return false;
    }
    
    // Check the message content for conversation patterns
    const message = data.symptoms || data.message || '';
    const lowerMessage = message.toLowerCase().trim();
    
    this.log('info', 'Detecting conversation type', { 
      message, 
      requestType, 
      hasMessage: !!data.message,
      hasSymptoms: !!data.symptoms 
    });
    
    // Greeting patterns
    const greetingPatterns = [
      /^(hi|hello|hey|good morning|good afternoon|good evening)$/i,
      /^(how are you|how's it going|how do you do)$/i,
      /^(what's up|what's new|howdy)$/i,
      /^(thank you|thanks|thx|appreciate it)$/i,
      /^(nice to meet you|pleasure to meet you)$/i
    ];
    
    // Check if it's a greeting
    const isGreeting = greetingPatterns.some(pattern => pattern.test(lowerMessage));
    
    // Check if it contains medical keywords - if so, treat as medical analysis
    const medicalKeywords = ['pain', 'ache', 'hurt', 'sick', 'ill', 'fever', 'cough', 'headache', 'nausea', 'dizzy', 'tired', 'fatigue', 'symptom', 'medication', 'medicine', 'pill', 'dose', 'prescription', 'feel', 'feeling', 'have', 'experiencing'];
    const hasMedicalKeywords = medicalKeywords.some(keyword => lowerMessage.includes(keyword));
    
    // If it has medical keywords, treat as medical analysis (not conversation)
    if (hasMedicalKeywords) {
      this.log('info', 'Medical keywords detected, treating as medical analysis', { hasMedicalKeywords, medicalKeywords });
      return false;
    }
    
    // If it's a greeting or short non-medical message, treat as conversation
    const isConversation = isGreeting || (message.length < 20);
    this.log('info', 'Conversation detection result', { isGreeting, messageLength: message.length, isConversation });
    return isConversation;
  }

  /**
   * Handle natural conversation
   */
  async handleNaturalConversation(request) {
    const { userId, data, context = {} } = request;
    
    this.log('info', 'Handling natural conversation', { userId, message: data.symptoms?.substring(0, 50) });
    
    try {
      const conversationRequest = {
        userId,
        message: data.symptoms || data.message || '',
        context
      };
      
      const result = await this.agents.conversation.process(conversationRequest);
      
      return {
        success: true,
        response: {
          type: 'conversation',
          message: result.response,
          isNaturalConversation: true,
          conversationType: result.conversationType
        },
        agentResults: {
          conversation: result
        },
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      this.log('error', 'Natural conversation failed', error.message);
      return {
        success: false,
        error: error.message,
        timestamp: new Date().toISOString()
      };
    }
  }

  /**
   * Process comprehensive AI request
   */
  async process(request) {
    const { 
      userId, 
      requestType, 
      data, 
      context = {},
      priority = 'normal'
    } = request;

    this.log('info', 'Processing comprehensive AI request', { 
      userId, 
      requestType,
      priority,
      context: Object.keys(context)
    });

    try {
      // Check if this is a natural conversation first
      this.log('info', 'About to detect conversation type', { requestType, data });
      const isNaturalConversation = this.detectNaturalConversation(data, requestType);
      this.log('info', 'Conversation detection result', { isNaturalConversation });
      
      if (isNaturalConversation) {
        this.log('info', 'Handling as natural conversation');
        return await this.handleNaturalConversation(request);
      }
      
      // Determine which agents to involve
      const involvedAgents = this.determineInvolvedAgents(requestType, data, context);
      
      // Process with each relevant agent
      const agentResults = await this.processWithAgents(involvedAgents, {
        userId,
        requestType,
        data,
        context,
        priority
      });
      
      // Synthesize results
      const synthesizedResult = this.synthesizeResults(agentResults, requestType, context);
      
      // Generate comprehensive response
      const comprehensiveResponse = this.generateComprehensiveResponse(
        synthesizedResult, 
        agentResults, 
        context
      );

      // Log the comprehensive interaction
      await this.logComprehensiveInteraction(userId, requestType, comprehensiveResponse);

      this.log('info', 'Comprehensive AI request processed successfully', {
        agentsInvolved: involvedAgents.length,
        responseType: comprehensiveResponse.type,
        recommendationsCount: comprehensiveResponse.recommendations?.length || 0
      });

      return {
        success: true,
        response: comprehensiveResponse,
        agentResults,
        involvedAgents,
        agent: this.name,
        timestamp: new Date().toISOString()
      };

    } catch (error) {
      this.log('error', 'Comprehensive AI request failed', error.message);
      return {
        success: false,
        error: error.message,
        agent: this.name,
        timestamp: new Date().toISOString()
      };
    }
  }

  /**
   * Create agent-specific request based on agent type
   */
  createAgentRequest(agentName, request) {
    const { userId, requestType, data, context } = request;
    
    this.log('info', `Creating request for ${agentName}`, { 
      data, 
      requestType,
      message: data.message,
      symptoms: data.symptoms 
    });
    
    switch (agentName) {
      case 'symptom':
        return {
          userId,
          symptoms: data.symptoms || data.message, // Support both symptoms and message
          additionalContext: data.additionalContext || {}
        };
        
      case 'hospital':
        return {
          userId,
          condition: data.condition || data.symptoms || data.message,
          severity: data.severity || 'moderate',
          location: data.location,
          insuranceProvider: data.insuranceProvider,
          preferences: data.preferences || {}
        };
        
      case 'pharmacy':
        return {
          userId,
          prescription: data.prescription,
          preferredPharmacy: data.preferredPharmacy,
          deliveryPreference: data.deliveryPreference || false,
          urgency: data.urgency || 'normal'
        };
        
      case 'medicalContext':
        return {
          userId,
          doctorInput: data.doctorInput,
          patientCondition: data.condition,
          currentMetrics: data.currentMetrics || {},
          patientHistory: data.patientHistory || []
        };
        
      case 'nutrition':
        return {
          userId,
          meal: data.meal,
          patientCondition: data.condition || 'general',
          medications: data.medications || [],
          allergies: data.allergies || [],
          preferences: data.preferences || {}
        };
        
      case 'activity':
        return {
          userId,
          condition: data.condition,
          fitnessLevel: data.fitnessLevel || 'beginner',
          currentActivity: data.currentActivity || 'sedentary',
          preferences: data.preferences || {},
          restrictions: data.restrictions || []
        };
        
      case 'motivation':
        return {
          userId,
          action: data.action || data.medication || 'general',
          context: context,
          userProgress: data.userProgress || {},
          preferences: data.preferences || {}
        };
        
      case 'feedback':
        return {
          userId,
          condition: data.condition,
          timeframe: data.timeframe || 'weekly',
          doctorGoals: data.doctorGoals || [],
          includeRecommendations: data.includeRecommendations !== false
        };
        
      default:
        return request;
    }
  }

  /**
   * Determine which agents should be involved
   */
  determineInvolvedAgents(requestType, data, context) {
    const baseAgents = this.routingRules[requestType] || ['symptom'];
    const involvedAgents = [...baseAgents];

    // Add context-based agents
    if (context.emergency) {
      involvedAgents.push('hospital');
    }
    
    if (context.medicationInvolved) {
      involvedAgents.push('pharmacy');
    }
    
    if (context.needsMotivation) {
      involvedAgents.push('motivation');
    }
    
    if (context.hasDoctorInput) {
      involvedAgents.push('medicalContext');
    }

    // Remove duplicates
    return [...new Set(involvedAgents)];
  }

  /**
   * Process request with multiple agents
   */
  async processWithAgents(agentNames, request) {
    const results = {};
    
    // Process with each agent in parallel where possible
    const agentPromises = agentNames.map(async (agentName) => {
      try {
        const agent = this.agents[agentName];
        if (!agent) {
          throw new Error(`Agent ${agentName} not found`);
        }
        
        // Create agent-specific request based on agent type
        const agentRequest = this.createAgentRequest(agentName, request);
        const result = await agent.process(agentRequest);
        return { agentName, result };
      } catch (error) {
        this.log('error', `Agent ${agentName} processing failed`, error.message);
        return { 
          agentName, 
          result: { 
            success: false, 
            error: error.message,
            agent: agentName
          }
        };
      }
    });

    const agentResults = await Promise.all(agentPromises);
    
    // Organize results by agent name
    agentResults.forEach(({ agentName, result }) => {
      results[agentName] = result;
    });

    return results;
  }

  /**
   * Synthesize results from multiple agents
   */
  synthesizeResults(agentResults, requestType, context) {
    const synthesis = {
      primaryResponse: null,
      secondaryResponses: [],
      recommendations: [],
      warnings: [],
      emergencyActions: [],
      confidence: 0,
      dataQuality: 'good'
    };

    // Determine primary response based on request type
    switch (requestType) {
      case 'symptom_analysis':
        synthesis.primaryResponse = agentResults.symptom;
        if (agentResults.hospital) {
          synthesis.secondaryResponses.push(agentResults.hospital);
        }
        break;
        
      case 'food_analysis':
        synthesis.primaryResponse = agentResults.nutrition;
        break;
        
      case 'exercise_recommendation':
        synthesis.primaryResponse = agentResults.activity;
        break;
        
      case 'medication_reminder':
        synthesis.primaryResponse = agentResults.motivation;
        if (agentResults.pharmacy) {
          synthesis.secondaryResponses.push(agentResults.pharmacy);
        }
        break;
        
      case 'doctor_input':
        synthesis.primaryResponse = agentResults.medicalContext;
        break;
        
      case 'progress_report':
        synthesis.primaryResponse = agentResults.feedback;
        break;
        
      default:
        synthesis.primaryResponse = agentResults.symptom || Object.values(agentResults)[0];
    }

    // Extract recommendations from all agents
    Object.values(agentResults).forEach(result => {
      if (result.success && result.recommendations && Array.isArray(result.recommendations)) {
        synthesis.recommendations.push(...result.recommendations);
      }
      if (result.success && result.warnings && Array.isArray(result.warnings)) {
        synthesis.warnings.push(...result.warnings);
      }
      if (result.success && result.emergency) {
        synthesis.emergencyActions.push(result);
      }
    });

    // Calculate overall confidence
    synthesis.confidence = this.calculateOverallConfidence(agentResults);
    
    // Assess data quality
    synthesis.dataQuality = this.assessDataQuality(agentResults);

    return synthesis;
  }

  /**
   * Calculate overall confidence from agent results
   */
  calculateOverallConfidence(agentResults) {
    const successfulResults = Object.values(agentResults).filter(result => result.success);
    
    if (successfulResults.length === 0) return 0;
    
    const totalConfidence = successfulResults.reduce((sum, result) => {
      return sum + (result.confidence || 0.5);
    }, 0);
    
    return totalConfidence / successfulResults.length;
  }

  /**
   * Assess data quality based on agent results
   */
  assessDataQuality(agentResults) {
    const results = Object.values(agentResults);
    const successfulCount = results.filter(result => result.success).length;
    const totalCount = results.length;
    
    const successRate = successfulCount / totalCount;
    
    if (successRate >= 0.8) return 'excellent';
    if (successRate >= 0.6) return 'good';
    if (successRate >= 0.4) return 'fair';
    return 'poor';
  }

  /**
   * Generate comprehensive response
   */
  generateComprehensiveResponse(synthesis, agentResults, context) {
    const response = {
      type: this.determineResponseType(synthesis),
      message: this.generateMainMessage(synthesis, context),
      recommendations: synthesis.recommendations,
      warnings: synthesis.warnings,
      emergencyActions: synthesis.emergencyActions,
      confidence: synthesis.confidence,
      dataQuality: synthesis.dataQuality,
      nextSteps: this.generateNextSteps(synthesis, context),
      followUp: this.generateFollowUpPlan(synthesis, context)
    };

    // Add agent-specific insights
    response.insights = this.generateInsights(agentResults);
    
    // Add personalized elements
    if (context.userPreferences) {
      response.personalization = this.addPersonalization(response, context.userPreferences);
    }

    return response;
  }

  /**
   * Determine response type
   */
  determineResponseType(synthesis) {
    if (synthesis.emergencyActions.length > 0) return 'emergency';
    if (synthesis.warnings.length > 0) return 'warning';
    if (synthesis.recommendations.length > 0) return 'recommendation';
    return 'informational';
  }

  /**
   * Generate main message
   */
  generateMainMessage(synthesis, context) {
    if (synthesis.emergencyActions.length > 0) {
      return '🚨 EMERGENCY DETECTED - Immediate action required!';
    }
    
    if (synthesis.primaryResponse && synthesis.primaryResponse.success) {
      const primaryMessage = synthesis.primaryResponse.message || 
                           synthesis.primaryResponse.recommendation?.message ||
                           'Analysis completed successfully.';
      return primaryMessage;
    }
    
    return 'Analysis completed. Please review the recommendations below.';
  }

  /**
   * Generate next steps
   */
  generateNextSteps(synthesis, context) {
    const steps = [];
    
    if (synthesis.emergencyActions.length > 0) {
      steps.push('Call emergency services immediately');
      steps.push('Go to the nearest emergency room');
    }
    
    if (synthesis.recommendations.length > 0) {
      synthesis.recommendations.slice(0, 3).forEach(rec => {
        if (rec.action) {
          steps.push(rec.action);
        }
      });
    }
    
    if (steps.length === 0) {
      steps.push('Continue monitoring your health');
      steps.push('Schedule regular check-ups with your doctor');
    }
    
    return steps;
  }

  /**
   * Generate follow-up plan
   */
  generateFollowUpPlan(synthesis, context) {
    return {
      immediate: synthesis.emergencyActions.length > 0 ? 'Emergency care' : 'Monitor symptoms',
      shortTerm: 'Follow recommendations and track progress',
      longTerm: 'Regular health monitoring and goal achievement',
      reminders: this.generateReminders(synthesis, context)
    };
  }

  /**
   * Generate reminders
   */
  generateReminders(synthesis, context) {
    const reminders = [];
    
    if (synthesis.recommendations.some(rec => rec.type === 'medication')) {
      reminders.push('Medication reminders');
    }
    
    if (synthesis.recommendations.some(rec => rec.type === 'exercise')) {
      reminders.push('Exercise reminders');
    }
    
    if (synthesis.recommendations.some(rec => rec.type === 'diet')) {
      reminders.push('Meal planning reminders');
    }
    
    return reminders;
  }

  /**
   * Generate insights from agent results
   */
  generateInsights(agentResults) {
    const insights = [];
    
    Object.entries(agentResults).forEach(([agentName, result]) => {
      if (result.success && result.insights) {
        insights.push({
          agent: agentName,
          insight: result.insights
        });
      }
    });
    
    return insights;
  }

  /**
   * Add personalization to response
   */
  addPersonalization(response, preferences) {
    const personalized = { ...response };
    
    if (preferences.tone === 'encouraging') {
      personalized.message = this.makeEncouraging(personalized.message);
    }
    
    if (preferences.name) {
      personalized.message = personalized.message.replace(/you/gi, preferences.name);
    }
    
    return personalized;
  }

  /**
   * Make message more encouraging
   */
  makeEncouraging(message) {
    const encouragingPrefixes = [
      'Great news! ',
      'You\'re doing well! ',
      'Keep up the excellent work! '
    ];
    return encouragingPrefixes[Math.floor(Math.random() * encouragingPrefixes.length)] + message;
  }

  /**
   * Log comprehensive interaction
   */
  async logComprehensiveInteraction(userId, requestType, response) {
    const pool = require('../config/database');
    
    try {
      await pool.query(
        `INSERT INTO comprehensive_ai_logs (id, user_id, request_type, response_data, created_at)
         VALUES ($1, $2, $3, $4, NOW())`,
        [
          require('crypto').randomUUID(),
          userId,
          requestType,
          JSON.stringify(response)
        ]
      );
    } catch (error) {
      this.log('error', 'Failed to log comprehensive interaction', error.message);
    }
  }

  /**
   * Get agent status
   */
  getAgentStatus() {
    const status = {
      manager: this.getStatus(),
      agents: {}
    };
    
    Object.entries(this.agents).forEach(([name, agent]) => {
      status.agents[name] = agent.getStatus();
    });
    
    return status;
  }

  /**
   * Get agent performance metrics
   */
  async getAgentPerformanceMetrics(timeframe = '7 days') {
    const pool = require('../config/database');
    
    try {
      const result = await pool.query(
        `SELECT 
           agent_name,
           COUNT(*) as total_requests,
           COUNT(CASE WHEN success = true THEN 1 END) as successful_requests,
           AVG(response_time) as avg_response_time,
           AVG(confidence_score) as avg_confidence
         FROM agent_performance_logs 
         WHERE created_at >= NOW() - INTERVAL '${timeframe}'
         GROUP BY agent_name`,
        []
      );
      
      return result.rows;
    } catch (error) {
      this.log('error', 'Failed to get agent performance metrics', error.message);
      return [];
    }
  }

  /**
   * Restart specific agent
   */
  restartAgent(agentName) {
    if (this.agents[agentName]) {
      this.agents[agentName].isActive = true;
      this.log('info', `Agent ${agentName} restarted`);
      return true;
    }
    return false;
  }

  /**
   * Get system health
   */
  getSystemHealth() {
    const health = {
      overall: 'healthy',
      agents: {},
      lastCheck: new Date().toISOString()
    };
    
    Object.entries(this.agents).forEach(([name, agent]) => {
      health.agents[name] = {
        status: agent.isActive ? 'active' : 'inactive',
        logsCount: agent.logs.length,
        lastActivity: agent.logs.length > 0 ? agent.logs[agent.logs.length - 1].timestamp : null
      };
    });
    
    const inactiveAgents = Object.values(health.agents).filter(agent => agent.status === 'inactive').length;
    if (inactiveAgents > 0) {
      health.overall = inactiveAgents === Object.keys(this.agents).length ? 'critical' : 'degraded';
    }
    
    return health;
  }
}

module.exports = AIAgentManager;
