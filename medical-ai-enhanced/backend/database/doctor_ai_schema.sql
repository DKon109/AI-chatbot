-- Doctor Input and Personalized AI Agent Tables
-- This schema supports doctor-trained, patient-specific AI agents

-- Doctor instructions table
CREATE TABLE IF NOT EXISTS doctor_instructions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    patient_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    doctor_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    instructions JSONB NOT NULL,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Personalized AI agent configurations
CREATE TABLE IF NOT EXISTS personalized_agents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    patient_id UUID NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
    instruction_id UUID NOT NULL REFERENCES doctor_instructions(id) ON DELETE CASCADE,
    agent_config JSONB NOT NULL,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- AI agent interactions log
CREATE TABLE IF NOT EXISTS ai_agent_interactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    patient_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    agent_type VARCHAR(50) NOT NULL, -- 'symptom', 'meal', 'exercise', 'motivation', 'progress'
    input_data JSONB NOT NULL,
    ai_response JSONB NOT NULL,
    doctor_instructions_id UUID REFERENCES doctor_instructions(id),
    created_at TIMESTAMP DEFAULT NOW()
);

-- Patient progress tracking
CREATE TABLE IF NOT EXISTS patient_progress_tracking (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    patient_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    metric_name VARCHAR(100) NOT NULL,
    metric_value DECIMAL(10,2),
    metric_unit VARCHAR(20),
    notes TEXT,
    doctor_instructions_id UUID REFERENCES doctor_instructions(id),
    created_at TIMESTAMP DEFAULT NOW()
);

-- AI agent performance metrics
CREATE TABLE IF NOT EXISTS ai_agent_performance (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    patient_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    agent_type VARCHAR(50) NOT NULL,
    accuracy_score DECIMAL(3,2), -- 0.00 to 1.00
    response_time_ms INTEGER,
    user_satisfaction INTEGER, -- 1-5 rating
    doctor_feedback TEXT,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_doctor_instructions_patient_id ON doctor_instructions(patient_id);
CREATE INDEX IF NOT EXISTS idx_doctor_instructions_doctor_id ON doctor_instructions(doctor_id);
CREATE INDEX IF NOT EXISTS idx_doctor_instructions_created_at ON doctor_instructions(created_at);

CREATE INDEX IF NOT EXISTS idx_personalized_agents_patient_id ON personalized_agents(patient_id);
CREATE INDEX IF NOT EXISTS idx_personalized_agents_instruction_id ON personalized_agents(instruction_id);

CREATE INDEX IF NOT EXISTS idx_ai_interactions_patient_id ON ai_agent_interactions(patient_id);
CREATE INDEX IF NOT EXISTS idx_ai_interactions_agent_type ON ai_agent_interactions(agent_type);
CREATE INDEX IF NOT EXISTS idx_ai_interactions_created_at ON ai_agent_interactions(created_at);

CREATE INDEX IF NOT EXISTS idx_progress_tracking_patient_id ON patient_progress_tracking(patient_id);
CREATE INDEX IF NOT EXISTS idx_progress_tracking_metric_name ON patient_progress_tracking(metric_name);
CREATE INDEX IF NOT EXISTS idx_progress_tracking_created_at ON patient_progress_tracking(created_at);

CREATE INDEX IF NOT EXISTS idx_ai_performance_patient_id ON ai_agent_performance(patient_id);
CREATE INDEX IF NOT EXISTS idx_ai_performance_agent_type ON ai_agent_performance(agent_type);
CREATE INDEX IF NOT EXISTS idx_ai_performance_created_at ON ai_agent_performance(created_at);
