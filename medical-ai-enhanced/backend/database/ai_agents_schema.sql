-- Enhanced Medical AI Database Schema
-- This schema supports all AI agents and their functionality

-- Extend existing users table with additional fields
ALTER TABLE users ADD COLUMN IF NOT EXISTS medical_conditions TEXT[];
ALTER TABLE users ADD COLUMN IF NOT EXISTS medications TEXT[];
ALTER TABLE users ADD COLUMN IF NOT EXISTS allergies TEXT[];
ALTER TABLE users ADD COLUMN IF NOT EXISTS emergency_contact JSONB;
ALTER TABLE users ADD COLUMN IF NOT EXISTS insurance_provider VARCHAR(100);
ALTER TABLE users ADD COLUMN IF NOT EXISTS fitness_level VARCHAR(20) DEFAULT 'beginner';
ALTER TABLE users ADD COLUMN IF NOT EXISTS preferences JSONB DEFAULT '{}';
ALTER TABLE users ADD COLUMN IF NOT EXISTS created_at TIMESTAMP DEFAULT NOW();
ALTER TABLE users ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT NOW();

-- Symptom logs table for SymptomAgent
CREATE TABLE IF NOT EXISTS symptom_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    symptoms TEXT NOT NULL,
    analysis_result JSONB NOT NULL,
    severity VARCHAR(20) NOT NULL,
    emergency BOOLEAN DEFAULT FALSE,
    confidence DECIMAL(3,2) DEFAULT 0.0,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Hospital matching logs for HospitalInsuranceAgent
CREATE TABLE IF NOT EXISTS hospital_matching_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    condition VARCHAR(100) NOT NULL,
    matched_hospitals JSONB NOT NULL,
    location JSONB,
    insurance_provider VARCHAR(100),
    created_at TIMESTAMP DEFAULT NOW()
);

-- Prescription tracking for PharmacyPrescriptionAgent
CREATE TABLE IF NOT EXISTS prescriptions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    medication VARCHAR(200) NOT NULL,
    dosage VARCHAR(100) NOT NULL,
    frequency VARCHAR(100) NOT NULL,
    duration VARCHAR(100) NOT NULL,
    instructions TEXT,
    pharmacy_id VARCHAR(100),
    pharmacy_name VARCHAR(200),
    status VARCHAR(50) DEFAULT 'pending',
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Prescription tracking history
CREATE TABLE IF NOT EXISTS prescription_tracking (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    prescription_id UUID NOT NULL REFERENCES prescriptions(id) ON DELETE CASCADE,
    status VARCHAR(50) NOT NULL,
    timestamp TIMESTAMP DEFAULT NOW(),
    note TEXT,
    pharmacy_note TEXT
);

-- Medical context logs for MedicalContextAgent
CREATE TABLE IF NOT EXISTS medical_context_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    condition VARCHAR(100) NOT NULL,
    care_plan JSONB NOT NULL,
    doctor_input TEXT,
    goals JSONB,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Meal validation logs for MealNutritionAgent
CREATE TABLE IF NOT EXISTS meal_validation_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    meal_data JSONB NOT NULL,
    assessment JSONB NOT NULL,
    compliance_score DECIMAL(3,2),
    created_at TIMESTAMP DEFAULT NOW()
);

-- Exercise completions for ActivityAgent
CREATE TABLE IF NOT EXISTS exercise_completions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    exercise_id VARCHAR(100) NOT NULL,
    exercise_name VARCHAR(200) NOT NULL,
    duration INTEGER NOT NULL, -- minutes
    intensity VARCHAR(20),
    calories_burned INTEGER,
    notes TEXT,
    completed_at TIMESTAMP DEFAULT NOW()
);

-- Activity recommendation logs
CREATE TABLE IF NOT EXISTS activity_recommendation_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    condition VARCHAR(100) NOT NULL,
    activity_plan JSONB NOT NULL,
    fitness_level VARCHAR(20),
    created_at TIMESTAMP DEFAULT NOW()
);

-- User progress tracking for MotivationAgent
CREATE TABLE IF NOT EXISTS user_progress (
    user_id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
    total_points INTEGER DEFAULT 0,
    current_streak INTEGER DEFAULT 0,
    total_actions INTEGER DEFAULT 0,
    badges TEXT[] DEFAULT '{}',
    last_updated TIMESTAMP DEFAULT NOW()
);

-- Motivation interactions
CREATE TABLE IF NOT EXISTS motivation_interactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    action VARCHAR(200) NOT NULL,
    motivation_type VARCHAR(50) NOT NULL,
    message TEXT NOT NULL,
    rewards JSONB,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Weekly reports for FeedbackAgent
CREATE TABLE IF NOT EXISTS weekly_reports (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    report_data JSONB NOT NULL,
    condition VARCHAR(100),
    timeframe VARCHAR(20),
    created_at TIMESTAMP DEFAULT NOW()
);

-- Goal progress tracking
CREATE TABLE IF NOT EXISTS goal_progress (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    goal_id VARCHAR(100) NOT NULL,
    goal_type VARCHAR(50) NOT NULL,
    target_value DECIMAL(10,2),
    current_value DECIMAL(10,2),
    progress_percentage DECIMAL(5,2),
    status VARCHAR(20),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Vital signs tracking
CREATE TABLE IF NOT EXISTS vital_signs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    blood_pressure_systolic INTEGER,
    blood_pressure_diastolic INTEGER,
    heart_rate INTEGER,
    weight DECIMAL(5,2),
    height DECIMAL(5,2),
    glucose_level INTEGER,
    temperature DECIMAL(4,2),
    recorded_at TIMESTAMP DEFAULT NOW()
);

-- Medication logs
CREATE TABLE IF NOT EXISTS medication_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    medication_name VARCHAR(200) NOT NULL,
    dosage VARCHAR(100),
    taken BOOLEAN DEFAULT FALSE,
    taken_at TIMESTAMP,
    side_effects TEXT,
    notes TEXT,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Comprehensive AI logs
CREATE TABLE IF NOT EXISTS comprehensive_ai_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    request_type VARCHAR(100) NOT NULL,
    response_data JSONB NOT NULL,
    agents_involved TEXT[],
    processing_time INTEGER, -- milliseconds
    created_at TIMESTAMP DEFAULT NOW()
);

-- Agent performance logs
CREATE TABLE IF NOT EXISTS agent_performance_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    agent_name VARCHAR(100) NOT NULL,
    request_type VARCHAR(100),
    success BOOLEAN NOT NULL,
    response_time INTEGER, -- milliseconds
    confidence_score DECIMAL(3,2),
    error_message TEXT,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_symptom_logs_user_id ON symptom_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_symptom_logs_created_at ON symptom_logs(created_at);
CREATE INDEX IF NOT EXISTS idx_symptom_logs_severity ON symptom_logs(severity);

CREATE INDEX IF NOT EXISTS idx_prescriptions_user_id ON prescriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_prescriptions_status ON prescriptions(status);
CREATE INDEX IF NOT EXISTS idx_prescription_tracking_prescription_id ON prescription_tracking(prescription_id);

CREATE INDEX IF NOT EXISTS idx_exercise_completions_user_id ON exercise_completions(user_id);
CREATE INDEX IF NOT EXISTS idx_exercise_completions_completed_at ON exercise_completions(completed_at);

CREATE INDEX IF NOT EXISTS idx_meal_validation_user_id ON meal_validation_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_meal_validation_created_at ON meal_validation_logs(created_at);

CREATE INDEX IF NOT EXISTS idx_motivation_interactions_user_id ON motivation_interactions(user_id);
CREATE INDEX IF NOT EXISTS idx_motivation_interactions_created_at ON motivation_interactions(created_at);

CREATE INDEX IF NOT EXISTS idx_weekly_reports_user_id ON weekly_reports(user_id);
CREATE INDEX IF NOT EXISTS idx_weekly_reports_created_at ON weekly_reports(created_at);

CREATE INDEX IF NOT EXISTS idx_vital_signs_user_id ON vital_signs(user_id);
CREATE INDEX IF NOT EXISTS idx_vital_signs_recorded_at ON vital_signs(recorded_at);

CREATE INDEX IF NOT EXISTS idx_medication_logs_user_id ON medication_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_medication_logs_taken_at ON medication_logs(taken_at);

CREATE INDEX IF NOT EXISTS idx_comprehensive_ai_logs_user_id ON comprehensive_ai_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_comprehensive_ai_logs_created_at ON comprehensive_ai_logs(created_at);

CREATE INDEX IF NOT EXISTS idx_agent_performance_logs_agent_name ON agent_performance_logs(agent_name);
CREATE INDEX IF NOT EXISTS idx_agent_performance_logs_created_at ON agent_performance_logs(created_at);

-- Portfolio demo data is managed by scripts/seed.js so schema migrations remain
-- deterministic and production deployments can opt in explicitly.

COMMENT ON TABLE symptom_logs IS 'Stores symptom analysis results from SymptomAgent';
COMMENT ON TABLE hospital_matching_logs IS 'Stores hospital matching results from HospitalInsuranceAgent';
COMMENT ON TABLE prescriptions IS 'Stores prescription information for PharmacyPrescriptionAgent';
COMMENT ON TABLE medical_context_logs IS 'Stores medical context and care plans from MedicalContextAgent';
COMMENT ON TABLE meal_validation_logs IS 'Stores meal validation results from MealNutritionAgent';
COMMENT ON TABLE exercise_completions IS 'Stores exercise completion data for ActivityAgent';
COMMENT ON TABLE user_progress IS 'Stores user progress and points for MotivationAgent';
COMMENT ON TABLE weekly_reports IS 'Stores weekly progress reports from FeedbackAgent';
COMMENT ON TABLE comprehensive_ai_logs IS 'Stores comprehensive AI interactions from AIAgentManager';
