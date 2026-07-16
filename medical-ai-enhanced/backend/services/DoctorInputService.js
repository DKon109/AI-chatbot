const pool = require('../config/database');
const OpenAIService = require('./OpenAIService');

class DoctorInputService {
  constructor() {
    this.openai = new OpenAIService();
  }

  /**
   * Store doctor's instructions for a patient
   */
  async storeDoctorInstructions(patientId, doctorId, instructions) {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      // Store the doctor instructions
      const result = await client.query(`
        INSERT INTO doctor_instructions (patient_id, doctor_id, instructions, created_at)
        VALUES ($1, $2, $3, NOW())
        RETURNING id
      `, [patientId, doctorId, JSON.stringify(instructions)]);

      const instructionId = result.rows[0].id;

      // Generate personalized AI agent based on instructions
      const patientData = await this.getPatientData(patientId);
      const personalizedAgent = await this.openai.generatePersonalizedAgent(patientData, instructions);

      // Store the personalized agent configuration
      await client.query(`
        INSERT INTO personalized_agents (patient_id, instruction_id, agent_config, created_at)
        VALUES ($1, $2, $3, NOW())
        ON CONFLICT (patient_id) 
        DO UPDATE SET 
          instruction_id = EXCLUDED.instruction_id,
          agent_config = EXCLUDED.agent_config,
          updated_at = NOW()
      `, [patientId, instructionId, JSON.stringify(personalizedAgent)]);

      await client.query('COMMIT');
      
      return {
        success: true,
        instructionId,
        personalizedAgent
      };
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * Get personalized AI agent for a patient
   */
  async getPersonalizedAgent(patientId) {
    const client = await pool.connect();
    try {
      const result = await client.query(`
        SELECT pa.agent_config, di.instructions, di.created_at
        FROM personalized_agents pa
        JOIN doctor_instructions di ON pa.instruction_id = di.id
        WHERE pa.patient_id = $1
        ORDER BY pa.updated_at DESC
        LIMIT 1
      `, [patientId]);

      if (result.rows.length === 0) {
        return null;
      }

      return {
        agentConfig: JSON.parse(result.rows[0].agent_config),
        instructions: JSON.parse(result.rows[0].instructions),
        lastUpdated: result.rows[0].created_at
      };
    } finally {
      client.release();
    }
  }

  /**
   * Update doctor instructions and regenerate AI agent
   */
  async updateDoctorInstructions(patientId, doctorId, newInstructions) {
    return await this.storeDoctorInstructions(patientId, doctorId, newInstructions);
  }

  /**
   * Get patient data for AI processing
   */
  async getPatientData(patientId) {
    const client = await pool.connect();
    try {
      const result = await client.query(`
        SELECT 
          u.id, u.name, u.email, u.age, u.gender,
          u.medical_conditions, u.medications, u.allergies,
          u.fitness_level, u.preferences
        FROM users u
        WHERE u.id = $1 AND u.user_type = 'patient'
      `, [patientId]);

      if (result.rows.length === 0) {
        throw new Error('Patient not found');
      }

      const patient = result.rows[0];
      return {
        id: patient.id,
        name: patient.name,
        email: patient.email,
        age: patient.age,
        gender: patient.gender,
        conditions: patient.medical_conditions || [],
        medications: patient.medications || [],
        allergies: patient.allergies || [],
        fitnessLevel: patient.fitness_level,
        preferences: patient.preferences || {}
      };
    } finally {
      client.release();
    }
  }

  /**
   * Analyze symptoms with personalized context
   */
  async analyzeSymptomsWithContext(patientId, symptoms) {
    const personalizedAgent = await this.getPersonalizedAgent(patientId);
    const patientData = await this.getPatientData(patientId);

    if (!personalizedAgent) {
      throw new Error('No personalized AI agent found. Doctor needs to provide instructions first.');
    }

    return await this.openai.analyzeSymptomsWithContext(
      symptoms,
      patientData,
      personalizedAgent.instructions
    );
  }

  /**
   * Analyze meal with personalized context
   */
  async analyzeMealWithContext(patientId, mealData) {
    const personalizedAgent = await this.getPersonalizedAgent(patientId);
    const patientData = await this.getPatientData(patientId);

    if (!personalizedAgent) {
      throw new Error('No personalized AI agent found. Doctor needs to provide instructions first.');
    }

    return await this.openai.generateMealRecommendations(
      mealData,
      patientData,
      personalizedAgent.instructions
    );
  }

  /**
   * Generate exercise recommendations with personalized context
   */
  async generateExerciseRecommendations(patientId, currentActivity) {
    const personalizedAgent = await this.getPersonalizedAgent(patientId);
    const patientData = await this.getPatientData(patientId);

    if (!personalizedAgent) {
      throw new Error('No personalized AI agent found. Doctor needs to provide instructions first.');
    }

    return await this.openai.generateExerciseRecommendations(
      patientData,
      personalizedAgent.instructions,
      currentActivity
    );
  }

  /**
   * Generate motivation message with personalized context
   */
  async generateMotivationMessage(patientId, actionType) {
    const personalizedAgent = await this.getPersonalizedAgent(patientId);
    const patientData = await this.getPatientData(patientId);

    if (!personalizedAgent) {
      throw new Error('No personalized AI agent found. Doctor needs to provide instructions first.');
    }

    return await this.openai.generateMotivationMessage(
      patientData,
      personalizedAgent.instructions,
      actionType
    );
  }

  /**
   * Generate progress report with personalized context
   */
  async generateProgressReport(patientId, timeFrame = 'weekly') {
    const personalizedAgent = await this.getPersonalizedAgent(patientId);
    const patientData = await this.getPatientData(patientId);

    if (!personalizedAgent) {
      throw new Error('No personalized AI agent found. Doctor needs to provide instructions first.');
    }

    // Get patient data for the specified time frame
    const timeFrameData = await this.getPatientTimeFrameData(patientId, timeFrame);

    return await this.openai.generateProgressReport(
      timeFrameData,
      personalizedAgent.instructions,
      timeFrame
    );
  }

  /**
   * Get patient data for a specific time frame
   */
  async getPatientTimeFrameData(patientId, timeFrame) {
    const client = await pool.connect();
    try {
      let timeCondition = '';
      switch (timeFrame) {
        case 'daily':
          timeCondition = "created_at >= CURRENT_DATE";
          break;
        case 'weekly':
          timeCondition = "created_at >= CURRENT_DATE - INTERVAL '7 days'";
          break;
        case 'monthly':
          timeCondition = "created_at >= CURRENT_DATE - INTERVAL '30 days'";
          break;
        default:
          timeCondition = "created_at >= CURRENT_DATE - INTERVAL '7 days'";
      }

      // Get symptom logs
      const symptomLogs = await client.query(`
        SELECT * FROM symptom_logs 
        WHERE user_id = $1 AND ${timeCondition}
        ORDER BY created_at DESC
      `, [patientId]);

      // Get meal logs
      const mealLogs = await client.query(`
        SELECT * FROM meal_validation_logs 
        WHERE user_id = $1 AND ${timeCondition}
        ORDER BY created_at DESC
      `, [patientId]);

      // Get exercise logs
      const exerciseLogs = await client.query(`
        SELECT * FROM exercise_completions 
        WHERE user_id = $1 AND ${timeCondition}
        ORDER BY created_at DESC
      `, [patientId]);

      // Get medication logs
      const medicationLogs = await client.query(`
        SELECT * FROM medication_logs 
        WHERE user_id = $1 AND ${timeCondition}
        ORDER BY created_at DESC
      `, [patientId]);

      return {
        symptomLogs: symptomLogs.rows,
        mealLogs: mealLogs.rows,
        exerciseLogs: exerciseLogs.rows,
        medicationLogs: medicationLogs.rows,
        timeFrame
      };
    } finally {
      client.release();
    }
  }

  /**
   * Get all doctor instructions for a patient
   */
  async getDoctorInstructionsHistory(patientId) {
    const client = await pool.connect();
    try {
      const result = await client.query(`
        SELECT 
          di.id, di.instructions, di.created_at,
          u.name as doctor_name, u.email as doctor_email
        FROM doctor_instructions di
        JOIN users u ON di.doctor_id = u.id
        WHERE di.patient_id = $1
        ORDER BY di.created_at DESC
      `, [patientId]);

      return result.rows.map(row => ({
        id: row.id,
        instructions: JSON.parse(row.instructions),
        createdAt: row.created_at,
        doctorName: row.doctor_name,
        doctorEmail: row.doctor_email
      }));
    } finally {
      client.release();
    }
  }
}

module.exports = DoctorInputService;
