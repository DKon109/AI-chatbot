-- Enhanced Medical AI Database Schema
-- This file contains all the SQL commands to create the database tables

-- Create database (run this separately)
-- CREATE DATABASE medical_ai_enhanced;

-- Users table
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    user_type VARCHAR(20) NOT NULL CHECK (user_type IN ('patient', 'doctor')),
    name VARCHAR(100) NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Patients table (for doctors to manage)
CREATE TABLE IF NOT EXISTS patients (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    doctor_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    age INTEGER NOT NULL CHECK (age > 0 AND age < 150),
    gender VARCHAR(10) CHECK (gender IN ('male', 'female', 'other')),
    phone VARCHAR(20),
    address TEXT,
    diagnosis TEXT NOT NULL,
    symptoms TEXT,
    allergies TEXT,
    current_medications TEXT,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Chat messages table
CREATE TABLE IF NOT EXISTS chat_messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    sender VARCHAR(10) NOT NULL CHECK (sender IN ('user', 'ai')),
    message TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Diet recommendations table
CREATE TABLE IF NOT EXISTS diet_recommendations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    diagnosis VARCHAR(255) NOT NULL,
    recommended_foods TEXT[] NOT NULL,
    avoid_foods TEXT[] NOT NULL,
    additional_notes TEXT,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_user_type ON users(user_type);
CREATE INDEX IF NOT EXISTS idx_patients_doctor_id ON patients(doctor_id);
CREATE INDEX IF NOT EXISTS idx_patients_name ON patients(name);
CREATE INDEX IF NOT EXISTS idx_chat_messages_user_id ON chat_messages(user_id);
CREATE INDEX IF NOT EXISTS idx_chat_messages_created_at ON chat_messages(created_at);
CREATE INDEX IF NOT EXISTS idx_diet_recommendations_diagnosis ON diet_recommendations(diagnosis);

-- Insert reference diet recommendations without duplicating them on reruns.
INSERT INTO diet_recommendations (diagnosis, recommended_foods, avoid_foods, additional_notes)
SELECT 'Diabetes',
 ARRAY['Whole grains', 'Leafy vegetables', 'Lean proteins', 'Berries', 'Nuts', 'Low-fat dairy'],
 ARRAY['Refined sugars', 'White bread', 'Processed foods', 'Sugary drinks', 'Fried foods'],
 'Monitor blood sugar levels regularly and maintain consistent meal timing'
WHERE NOT EXISTS (SELECT 1 FROM diet_recommendations WHERE diagnosis = 'Diabetes');

INSERT INTO diet_recommendations (diagnosis, recommended_foods, avoid_foods, additional_notes)
SELECT 'Hypertension',
 ARRAY['Fresh fruits', 'Vegetables', 'Whole grains', 'Lean meats', 'Low-sodium foods', 'Potassium-rich foods'],
 ARRAY['High-sodium foods', 'Processed meats', 'Canned foods', 'Alcohol', 'Excessive caffeine'],
 'Limit sodium intake to less than 2,300mg per day and maintain regular exercise'
WHERE NOT EXISTS (SELECT 1 FROM diet_recommendations WHERE diagnosis = 'Hypertension');

INSERT INTO diet_recommendations (diagnosis, recommended_foods, avoid_foods, additional_notes)
SELECT 'Heart Disease',
 ARRAY['Omega-3 rich fish', 'Whole grains', 'Fruits', 'Vegetables', 'Nuts', 'Olive oil'],
 ARRAY['Trans fats', 'Saturated fats', 'High-cholesterol foods', 'Excessive salt', 'Processed foods'],
 'Focus on heart-healthy fats and maintain a balanced diet with regular physical activity'
WHERE NOT EXISTS (SELECT 1 FROM diet_recommendations WHERE diagnosis = 'Heart Disease');

INSERT INTO diet_recommendations (diagnosis, recommended_foods, avoid_foods, additional_notes)
SELECT 'Obesity',
 ARRAY['High-fiber foods', 'Lean proteins', 'Vegetables', 'Fruits', 'Whole grains', 'Water'],
 ARRAY['High-calorie foods', 'Sugary drinks', 'Processed snacks', 'Fried foods', 'Large portions'],
 'Focus on portion control, regular meals, and increased physical activity'
WHERE NOT EXISTS (SELECT 1 FROM diet_recommendations WHERE diagnosis = 'Obesity');

INSERT INTO diet_recommendations (diagnosis, recommended_foods, avoid_foods, additional_notes)
SELECT 'Digestive Issues',
 ARRAY['Probiotic foods', 'Fiber-rich foods', 'Lean proteins', 'Cooked vegetables', 'Herbal teas', 'Water'],
 ARRAY['Spicy foods', 'Fatty foods', 'Carbonated drinks', 'Alcohol', 'Caffeine', 'Raw vegetables'],
 'Eat smaller, more frequent meals and avoid foods that trigger symptoms'
WHERE NOT EXISTS (SELECT 1 FROM diet_recommendations WHERE diagnosis = 'Digestive Issues');

-- Create a function to update the updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers to automatically update updated_at
DROP TRIGGER IF EXISTS update_users_updated_at ON users;
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_patients_updated_at ON patients;
CREATE TRIGGER update_patients_updated_at BEFORE UPDATE ON patients
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_diet_recommendations_updated_at ON diet_recommendations;
CREATE TRIGGER update_diet_recommendations_updated_at BEFORE UPDATE ON diet_recommendations
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
