const { PythonShell } = require('python-shell');
const path = require('path');

class SymptomAnalysisService {
  constructor() {
    this.pythonScriptPath = path.join(__dirname, 'utils', 'enhanced_symptom_analyzer.py');
    this.datasetPath = path.join(__dirname, 'symbipredict_2022.csv');
    this.modelsPath = path.join(__dirname, 'models');
    
    // Check if ML models are available
    this.mlModelsAvailable = this.checkMLModels();
    console.log('ML Models Available:', this.mlModelsAvailable);
  }

  checkMLModels() {
    const fs = require('fs');
    const requiredModels = [
      'randomforest_symptom_classifier.pkl',
      'severity_classifier.pkl',
      'emergency_detector.pkl',
      'label_encoder.pkl',
      'severity_encoder.pkl'
    ];
    
    return requiredModels.every(model => 
      fs.existsSync(path.join(this.modelsPath, model))
    );
  }

  /**
   * Analyze symptoms using the Python AI model
   * @param {string} userMessage - The user's symptom description
   * @returns {Promise<Object>} Analysis result with severity and recommendations
   */
  async analyzeSymptoms(userMessage) {
    console.log('Analyzing symptoms for:', userMessage);
    
    // Try to use ML models if available
    if (this.mlModelsAvailable) {
      try {
        return await this.analyzeWithML(userMessage);
      } catch (error) {
        console.error('ML analysis failed, falling back to rule-based:', error.message);
      }
    }
    
    // Fallback to enhanced rule-based analysis
    return this.enhancedFallbackAnalysis(userMessage);
  }

  async analyzeWithML(userMessage) {
    // Use Python script with ML models
    const options = {
      mode: 'text',
      pythonPath: path.join(__dirname, 'venv', 'bin', 'python'),
      scriptPath: path.dirname(this.pythonScriptPath),
      args: [userMessage, this.datasetPath, this.modelsPath]
    };

    return new Promise((resolve, reject) => {
      PythonShell.run('enhanced_symptom_analyzer.py', options, (err, results) => {
        if (err) {
          reject(err);
          return;
        }

        try {
          const analysis = JSON.parse(results[0]);
          resolve(analysis);
        } catch (parseError) {
          reject(new Error('Failed to parse ML analysis result'));
        }
      });
    });
  }

  /**
   * Enhanced fallback analysis with better symptom detection
   * @param {string} userMessage - The user's symptom description
   * @returns {Object} Enhanced analysis result
   */
  enhancedFallbackAnalysis(userMessage) {
    const lowerMessage = userMessage.toLowerCase();
    
    // Emergency symptoms that require immediate attention
    const emergencySymptoms = [
      'chest pain', 'heart attack', 'stroke', 'difficulty breathing', 'can\'t breathe',
      'severe pain', 'unconscious', 'coma', 'bleeding', 'severe headache',
      'high fever', 'emergency', 'ambulance', 'urgent', 'breathlessness',
      'shortness of breath', 'severe chest pain', 'heart attack symptoms'
    ];
    
    // High severity symptoms
    const highSeveritySymptoms = [
      'fever', 'cough', 'pneumonia', 'tuberculosis', 'hepatitis', 'diabetes',
      'hypertension', 'severe', 'worsening', 'persistent', 'blood in',
      'severe nausea', 'severe vomiting', 'severe diarrhea'
    ];
    
    // Moderate severity symptoms
    const moderateSeveritySymptoms = [
      'pain', 'ache', 'hurt', 'sore', 'tired', 'fatigue', 'headache',
      'nausea', 'stomach', 'belly', 'back pain', 'joint pain'
    ];
    
    // Check for emergency conditions
    const isEmergency = emergencySymptoms.some(symptom => lowerMessage.includes(symptom));
    
    if (isEmergency) {
      return {
        severity: 'critical',
        emergency: true,
        recommendation: {
          action: 'emergency',
          message: '🚨 **EMERGENCY ALERT** 🚨\n\nYour symptoms indicate a potentially serious condition that requires **immediate medical attention**.\n\n**IMMEDIATE ACTIONS:**\n• Call emergency services (911/ambulance) immediately\n• Go to the nearest emergency room\n• Do not delay seeking medical help\n\n**Emergency Services Available:**\n• Call 911 for immediate medical assistance\n• Use the emergency call feature in this app\n• Go to the nearest emergency room\n\n**Do not wait** - your health and safety are the top priority.',
          urgency: 'immediate'
        },
        confidence: 0.9,
        symptoms_found: emergencySymptoms.filter(s => lowerMessage.includes(s)),
        possible_diseases: [
          { disease: 'Heart Attack', score: 8 },
          { disease: 'Stroke', score: 7 },
          { disease: 'Pneumonia', score: 6 }
        ]
      };
    }
    
    // Check for high severity
    const isHighSeverity = highSeveritySymptoms.some(symptom => lowerMessage.includes(symptom));
    
    if (isHighSeverity) {
      return {
        severity: 'high',
        emergency: false,
        recommendation: {
          action: 'urgent_care',
          message: '⚠️ **URGENT MEDICAL ATTENTION NEEDED**\n\nYour symptoms suggest a condition that requires prompt medical evaluation.\n\n**RECOMMENDED ACTIONS:**\n• Contact your doctor immediately or visit urgent care\n• Schedule an appointment within 24-48 hours\n• Monitor your symptoms closely\n• Seek emergency care if symptoms worsen\n\n**Don\'t ignore these symptoms** - early intervention is important.',
          urgency: 'high'
        },
        confidence: 0.7,
        symptoms_found: highSeveritySymptoms.filter(s => lowerMessage.includes(s)),
        possible_diseases: [
          { disease: 'Infection', score: 6 },
          { disease: 'Inflammatory Condition', score: 5 }
        ]
      };
    }
    
    // Check for moderate severity
    const isModerateSeverity = moderateSeveritySymptoms.some(symptom => lowerMessage.includes(symptom));
    
    if (isModerateSeverity) {
      return {
        severity: 'moderate',
        emergency: false,
        recommendation: {
          action: 'schedule_appointment',
          message: '📋 **MEDICAL CONSULTATION RECOMMENDED**\n\nYour symptoms suggest a condition that should be evaluated by a healthcare professional.\n\n**RECOMMENDED ACTIONS:**\n• Schedule an appointment with your doctor within a week\n• Monitor your symptoms and note any changes\n• Keep a symptom diary\n• Consider over-the-counter treatments for relief\n\n**When to seek immediate care:**\n• If symptoms worsen significantly\n• If new symptoms develop\n• If you feel generally unwell',
          urgency: 'moderate'
        },
        confidence: 0.6,
        symptoms_found: moderateSeveritySymptoms.filter(s => lowerMessage.includes(s)),
        possible_diseases: [
          { disease: 'Musculoskeletal Issue', score: 5 },
          { disease: 'General Discomfort', score: 4 }
        ]
      };
    }
    
    // Default to low severity
    return {
      severity: 'low',
      emergency: false,
      recommendation: {
        action: 'self_care',
        message: '💚 **SELF-CARE APPROPRIATE**\n\nYour symptoms appear to be mild and may be managed with self-care measures.\n\n**SELF-CARE RECOMMENDATIONS:**\n• Rest and stay hydrated\n• Use over-the-counter medications as directed\n• Apply home remedies (cold/heat therapy, etc.)\n• Monitor symptoms for improvement\n\n**When to see a doctor:**\n• If symptoms persist for more than a week\n• If symptoms worsen\n• If you develop new symptoms\n• If you\'re concerned about your health',
        urgency: 'low'
      },
      confidence: 0.4,
      symptoms_found: [],
      possible_diseases: []
    };
  }

  /**
   * Fallback analysis if Python script fails
   * @param {string} userMessage - The user's symptom description
   * @returns {Object} Basic analysis result
   */
  fallbackAnalysis(userMessage) {
    const lowerMessage = userMessage.toLowerCase();
    
    // Emergency keywords
    const emergencyKeywords = [
      'chest pain', 'heart attack', 'stroke', 'difficulty breathing', 'can\'t breathe',
      'severe pain', 'unconscious', 'coma', 'bleeding', 'severe headache',
      'high fever', 'emergency', 'ambulance', 'urgent'
    ];
    
    // High severity keywords
    const highSeverityKeywords = [
      'fever', 'cough', 'pneumonia', 'tuberculosis', 'hepatitis', 'diabetes',
      'hypertension', 'severe', 'worsening', 'persistent'
    ];
    
    // Check for emergency conditions
    const isEmergency = emergencyKeywords.some(keyword => lowerMessage.includes(keyword));
    
    if (isEmergency) {
      return {
        severity: 'critical',
        emergency: true,
        recommendation: {
          action: 'emergency',
          message: '🚨 **EMERGENCY ALERT** 🚨\n\nYour symptoms indicate a potentially serious condition that requires **immediate medical attention**.\n\n**IMMEDIATE ACTIONS:**\n• Call emergency services (911/ambulance) immediately\n• Go to the nearest emergency room\n• Do not delay seeking medical help\n\n**Do not wait** - your health and safety are the top priority.',
          urgency: 'immediate'
        },
        confidence: 0.8
      };
    }
    
    // Check for high severity
    const isHighSeverity = highSeverityKeywords.some(keyword => lowerMessage.includes(keyword));
    
    if (isHighSeverity) {
      return {
        severity: 'high',
        emergency: false,
        recommendation: {
          action: 'urgent_care',
          message: '⚠️ **URGENT MEDICAL ATTENTION NEEDED**\n\nYour symptoms suggest a condition that requires prompt medical evaluation.\n\n**RECOMMENDED ACTIONS:**\n• Contact your doctor immediately or visit urgent care\n• Schedule an appointment within 24-48 hours\n• Monitor your symptoms closely\n• Seek emergency care if symptoms worsen\n\n**Don\'t ignore these symptoms** - early intervention is important.',
          urgency: 'high'
        },
        confidence: 0.6
      };
    }
    
    // Default to moderate severity
    return {
      severity: 'moderate',
      emergency: false,
      recommendation: {
        action: 'schedule_appointment',
        message: '📋 **MEDICAL CONSULTATION RECOMMENDED**\n\nYour symptoms suggest a condition that should be evaluated by a healthcare professional.\n\n**RECOMMENDED ACTIONS:**\n• Schedule an appointment with your doctor within a week\n• Monitor your symptoms and note any changes\n• Keep a symptom diary\n• Consider over-the-counter treatments for relief\n\n**When to seek immediate care:**\n• If symptoms worsen significantly\n• If new symptoms develop\n• If you feel generally unwell',
        urgency: 'moderate'
      },
      confidence: 0.4
    };
  }

  /**
   * Generate emergency ambulance call functionality
   * @param {string} location - Patient's location
   * @param {string} symptoms - Current symptoms
   * @returns {Object} Emergency response with call options
   */
  generateEmergencyResponse(location, symptoms) {
    return {
      emergency: true,
      action: 'call_ambulance',
      message: `🚨 **EMERGENCY AMBULANCE REQUIRED** 🚨\n\n**Location:** ${location || 'Not specified'}\n**Symptoms:** ${symptoms}\n\n**IMMEDIATE ACTIONS:**\n• **Call 911/Ambulance immediately**\n• **Stay calm and follow operator instructions**\n• **Do not drive yourself to the hospital**\n• **Have someone stay with you if possible**\n\n**Emergency Numbers:**\n• **911** (US Emergency Services)\n• **999** (UK Emergency Services)\n• **112** (EU Emergency Services)\n\n**While waiting for ambulance:**\n• Stay in a safe position\n• Keep airways clear\n• Monitor breathing\n• Do not eat or drink\n\n**Your safety is the top priority!**`,
      urgency: 'immediate',
      callOptions: {
        emergencyNumber: '911',
        location: location,
        symptoms: symptoms,
        timestamp: new Date().toISOString()
      }
    };
  }

  /**
   * Generate exercise recommendations based on patient conditions
   * @param {string} condition - Patient's medical condition
   * @param {string} fitnessLevel - Patient's fitness level
   * @returns {Object} Exercise recommendations
   */
  generateExerciseRecommendations(condition, fitnessLevel = 'beginner') {
    const exerciseDatabase = {
      'diabetes': {
        beginner: [
          'Walking 30 minutes daily',
          'Light stretching exercises',
          'Swimming (if comfortable)',
          'Cycling on flat terrain'
        ],
        intermediate: [
          'Brisk walking or jogging',
          'Resistance training with light weights',
          'Yoga or Pilates',
          'Dancing or aerobics'
        ],
        advanced: [
          'Running or interval training',
          'Weight training',
          'High-intensity interval training (HIIT)',
          'Sports activities'
        ]
      },
      'hypertension': {
        beginner: [
          'Gentle walking',
          'Tai Chi',
          'Light yoga',
          'Swimming'
        ],
        intermediate: [
          'Moderate walking',
          'Cycling',
          'Dancing',
          'Light resistance training'
        ],
        advanced: [
          'Cardio exercises',
          'Strength training',
          'Running',
          'Sports'
        ]
      },
      'arthritis': {
        beginner: [
          'Range of motion exercises',
          'Gentle stretching',
          'Water exercises',
          'Tai Chi'
        ],
        intermediate: [
          'Low-impact aerobics',
          'Swimming',
          'Cycling',
          'Yoga'
        ],
        advanced: [
          'Walking',
          'Light resistance training',
          'Dancing',
          'Golf'
        ]
      },
      'heart_disease': {
        beginner: [
          'Gentle walking',
          'Light stretching',
          'Breathing exercises',
          'Tai Chi'
        ],
        intermediate: [
          'Moderate walking',
          'Swimming',
          'Cycling',
          'Light yoga'
        ],
        advanced: [
          'Supervised cardio',
          'Light resistance training',
          'Dancing',
          'Golf'
        ]
      }
    };

    const conditionKey = condition.toLowerCase().replace(/\s+/g, '_');
    const recommendations = exerciseDatabase[conditionKey] || exerciseDatabase['diabetes'];
    
    return {
      condition: condition,
      fitnessLevel: fitnessLevel,
      recommendations: recommendations[fitnessLevel] || recommendations.beginner,
      generalTips: [
        'Start slowly and gradually increase intensity',
        'Listen to your body and stop if you feel pain',
        'Stay hydrated during exercise',
        'Warm up before and cool down after exercise',
        'Consult your doctor before starting any new exercise program'
      ],
      warnings: [
        'Stop immediately if you experience chest pain',
        'Avoid exercises that cause joint pain',
        'Monitor your heart rate during exercise',
        'Take breaks as needed'
      ]
    };
  }
}

module.exports = new SymptomAnalysisService();
