const OpenAI = require('openai');

class OpenAIService {
  constructor() {
    this.client = process.env.OPENAI_API_KEY
      ? new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
      : null;
  }

  /**
   * Generate personalized AI agent based on doctor's input
   */
  async generatePersonalizedAgent(patientData, doctorInstructions) {
    const prompt = this.createPersonalizedAgentPrompt(patientData, doctorInstructions);
    
    try {
      const response = await this.client.chat.completions.create({
        model: "gpt-4",
        messages: [
          {
            role: "system",
            content: "You are a medical AI specialist that creates personalized healthcare agents based on doctor instructions and patient conditions. Generate specific, actionable recommendations."
          },
          {
            role: "user",
            content: prompt
          }
        ],
        temperature: 0.3,
        max_tokens: 2000
      });

      return this.parseAgentResponse(response.choices[0].message.content);
    } catch (error) {
      console.error('OpenAI API Error:', error);
      throw new Error('Failed to generate personalized AI agent');
    }
  }

  /**
   * Analyze symptoms with medical context
   */
  async analyzeSymptomsWithContext(symptoms, patientContext, doctorInstructions) {
    const prompt = this.createSymptomAnalysisPrompt(symptoms, patientContext, doctorInstructions);
    
    try {
      const response = await this.client.chat.completions.create({
        model: "gpt-4",
        messages: [
          {
            role: "system",
            content: "You are a medical AI that analyzes symptoms in the context of specific patient conditions and doctor instructions. Provide detailed analysis with urgency levels and recommendations."
          },
          {
            role: "user",
            content: prompt
          }
        ],
        temperature: 0.2,
        max_tokens: 1500
      });

      return this.parseSymptomAnalysis(response.choices[0].message.content);
    } catch (error) {
      console.error('OpenAI Symptom Analysis Error:', error);
      throw new Error('Failed to analyze symptoms');
    }
  }

  /**
   * Generate meal recommendations based on patient conditions
   */
  async generateMealRecommendations(mealData, patientContext, doctorInstructions) {
    const prompt = this.createMealAnalysisPrompt(mealData, patientContext, doctorInstructions);
    
    try {
      const response = await this.client.chat.completions.create({
        model: "gpt-4",
        messages: [
          {
            role: "system",
            content: "You are a medical nutritionist AI that analyzes meals based on specific patient conditions and doctor dietary instructions. Provide detailed nutritional analysis and recommendations."
          },
          {
            role: "user",
            content: prompt
          }
        ],
        temperature: 0.3,
        max_tokens: 1000
      });

      return this.parseMealAnalysis(response.choices[0].message.content);
    } catch (error) {
      console.error('OpenAI Meal Analysis Error:', error);
      throw new Error('Failed to analyze meal');
    }
  }

  /**
   * Generate exercise recommendations
   */
  async generateExerciseRecommendations(patientContext, doctorInstructions, currentActivity) {
    const prompt = this.createExercisePrompt(patientContext, doctorInstructions, currentActivity);
    
    try {
      const response = await this.client.chat.completions.create({
        model: "gpt-4",
        messages: [
          {
            role: "system",
            content: "You are a medical fitness AI that recommends exercises based on specific patient conditions and doctor instructions. Consider safety, effectiveness, and patient limitations."
          },
          {
            role: "user",
            content: prompt
          }
        ],
        temperature: 0.3,
        max_tokens: 1000
      });

      return this.parseExerciseRecommendations(response.choices[0].message.content);
    } catch (error) {
      console.error('OpenAI Exercise Analysis Error:', error);
      throw new Error('Failed to generate exercise recommendations');
    }
  }

  /**
   * Generate motivation and reminders
   */
  async generateMotivationMessage(patientContext, doctorInstructions, actionType) {
    const prompt = this.createMotivationPrompt(patientContext, doctorInstructions, actionType);
    
    try {
      const response = await this.client.chat.completions.create({
        model: "gpt-4",
        messages: [
          {
            role: "system",
            content: "You are a medical motivation AI that creates personalized encouragement and reminders based on patient conditions and doctor goals. Be supportive, specific, and medically appropriate."
          },
          {
            role: "user",
            content: prompt
          }
        ],
        temperature: 0.7,
        max_tokens: 500
      });

      return response.choices[0].message.content;
    } catch (error) {
      console.error('OpenAI Motivation Error:', error);
      throw new Error('Failed to generate motivation message');
    }
  }

  /**
   * Generate weekly progress report
   */
  async generateProgressReport(patientData, doctorInstructions, timeFrame) {
    const prompt = this.createProgressReportPrompt(patientData, doctorInstructions, timeFrame);
    
    try {
      const response = await this.client.chat.completions.create({
        model: "gpt-4",
        messages: [
          {
            role: "system",
            content: "You are a medical AI that generates comprehensive weekly progress reports based on patient data and doctor instructions. Provide detailed analysis, trends, and recommendations."
          },
          {
            role: "user",
            content: prompt
          }
        ],
        temperature: 0.3,
        max_tokens: 2000
      });

      return this.parseProgressReport(response.choices[0].message.content);
    } catch (error) {
      console.error('OpenAI Progress Report Error:', error);
      throw new Error('Failed to generate progress report');
    }
  }

  // Helper methods for creating prompts
  createPersonalizedAgentPrompt(patientData, doctorInstructions) {
    return `
PATIENT DATA:
- Age: ${patientData.age || 'Not specified'}
- Gender: ${patientData.gender || 'Not specified'}
- Medical Conditions: ${patientData.conditions?.join(', ') || 'None specified'}
- Current Medications: ${patientData.medications?.join(', ') || 'None'}
- Allergies: ${patientData.allergies?.join(', ') || 'None'}
- Fitness Level: ${patientData.fitnessLevel || 'Not specified'}

DOCTOR INSTRUCTIONS:
${doctorInstructions}

Please create a personalized AI agent configuration that includes:
1. Specific dietary recommendations based on patient conditions
2. Exercise guidelines considering patient limitations
3. Medication reminders and monitoring
4. Symptom tracking priorities
5. Emergency protocols
6. Progress metrics to track

Format as JSON with sections: diet, exercise, medications, monitoring, emergency, metrics.
    `;
  }

  createSymptomAnalysisPrompt(symptoms, patientContext, doctorInstructions) {
    return `
PATIENT SYMPTOMS:
${symptoms}

PATIENT CONTEXT:
- Conditions: ${patientContext.conditions?.join(', ') || 'None'}
- Medications: ${patientContext.medications?.join(', ') || 'None'}
- Recent Changes: ${patientContext.recentChanges || 'None'}

DOCTOR INSTRUCTIONS:
${doctorInstructions}

Analyze these symptoms considering the patient's specific conditions and doctor's guidance. Provide:
1. Severity assessment (low/moderate/high/critical)
2. Possible causes specific to this patient
3. Immediate actions needed
4. When to contact doctor
5. Home care recommendations
6. Red flags to watch for

Format as JSON with: severity, causes, immediateActions, contactDoctor, homeCare, redFlags.
    `;
  }

  createMealAnalysisPrompt(mealData, patientContext, doctorInstructions) {
    return `
MEAL DATA:
- Description: ${mealData.description || 'Not provided'}
- Image Analysis: ${mealData.imageAnalysis || 'Not available'}

PATIENT CONTEXT:
- Conditions: ${patientContext.conditions?.join(', ') || 'None'}
- Dietary Restrictions: ${patientContext.dietaryRestrictions?.join(', ') || 'None'}
- Current Medications: ${patientContext.medications?.join(', ') || 'None'}

DOCTOR DIETARY INSTRUCTIONS:
${doctorInstructions}

Analyze this meal for this specific patient. Consider:
1. Nutritional appropriateness for their conditions
2. Medication interactions
3. Portion recommendations
4. Alternative suggestions
5. Timing considerations
6. Potential concerns

Format as JSON with: appropriate, score, concerns, recommendations, alternatives, timing.
    `;
  }

  createExercisePrompt(patientContext, doctorInstructions, currentActivity) {
    return `
PATIENT CONTEXT:
- Conditions: ${patientContext.conditions?.join(', ') || 'None'}
- Fitness Level: ${patientContext.fitnessLevel || 'Not specified'}
- Limitations: ${patientContext.limitations?.join(', ') || 'None'}
- Current Activity: ${currentActivity || 'None'}

DOCTOR EXERCISE INSTRUCTIONS:
${doctorInstructions}

Recommend appropriate exercises considering:
1. Patient's specific conditions and limitations
2. Doctor's exercise guidelines
3. Safety considerations
4. Progression recommendations
5. Frequency and duration
6. Warning signs to watch for

Format as JSON with: recommended, intensity, duration, frequency, safety, warnings.
    `;
  }

  createMotivationPrompt(patientContext, doctorInstructions, actionType) {
    return `
PATIENT CONTEXT:
- Conditions: ${patientContext.conditions?.join(', ') || 'None'}
- Goals: ${patientContext.goals?.join(', ') || 'General health'}
- Recent Progress: ${patientContext.recentProgress || 'Not specified'}

DOCTOR INSTRUCTIONS:
${doctorInstructions}

ACTION TYPE: ${actionType}

Create a personalized motivation message that:
1. Acknowledges their specific health journey
2. Encourages the specific action needed
3. References their doctor's goals
4. Is supportive and realistic
5. Includes specific next steps

Keep it concise, encouraging, and medically appropriate.
    `;
  }

  createProgressReportPrompt(patientData, doctorInstructions, timeFrame) {
    return `
PATIENT DATA (${timeFrame}):
${JSON.stringify(patientData, null, 2)}

DOCTOR INSTRUCTIONS:
${doctorInstructions}

Generate a comprehensive progress report including:
1. Key metrics and trends
2. Progress toward doctor's goals
3. Areas of improvement
4. Concerns or red flags
5. Recommendations for next period
6. Doctor consultation needs

Format as JSON with: summary, metrics, trends, improvements, concerns, recommendations, nextSteps.
    `;
  }

  // Response parsing methods
  parseAgentResponse(response) {
    try {
      return JSON.parse(response);
    } catch (error) {
      console.error('Failed to parse agent response:', error);
      return { error: 'Failed to parse AI response' };
    }
  }

  parseSymptomAnalysis(response) {
    try {
      return JSON.parse(response);
    } catch (error) {
      console.error('Failed to parse symptom analysis:', error);
      return { error: 'Failed to parse symptom analysis' };
    }
  }

  parseMealAnalysis(response) {
    try {
      return JSON.parse(response);
    } catch (error) {
      console.error('Failed to parse meal analysis:', error);
      return { error: 'Failed to parse meal analysis' };
    }
  }

  parseExerciseRecommendations(response) {
    try {
      return JSON.parse(response);
    } catch (error) {
      console.error('Failed to parse exercise recommendations:', error);
      return { error: 'Failed to parse exercise recommendations' };
    }
  }

  parseProgressReport(response) {
    try {
      return JSON.parse(response);
    } catch (error) {
      console.error('Failed to parse progress report:', error);
      return { error: 'Failed to parse progress report' };
    }
  }
}

module.exports = OpenAIService;
