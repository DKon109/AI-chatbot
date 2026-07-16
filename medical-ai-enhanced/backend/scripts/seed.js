const bcrypt = require('bcryptjs');
const pool = require('../config/database');

const ids = {
  patient: '7920fa1b-7185-496a-96f5-e96a0db37c03',
  doctor: '7920fa1b-7185-496a-96f5-e96a0db37c04',
  patientRecord: '7920fa1b-7185-496a-96f5-e96a0db37c05',
  symptom: '7920fa1b-7185-496a-96f5-e96a0db37c06',
  prescription: '7920fa1b-7185-496a-96f5-e96a0db37c07',
  exercise: '7920fa1b-7185-496a-96f5-e96a0db37c08',
  vital: '7920fa1b-7185-496a-96f5-e96a0db37c09',
  medication: '7920fa1b-7185-496a-96f5-e96a0db37c10',
};

async function seed() {
  const client = await pool.connect();
  const demoPassword = process.env.DEMO_PASSWORD || 'PortfolioDemo!2026';
  const passwordHash = await bcrypt.hash(demoPassword, 12);

  try {
    await client.query('BEGIN');

    await client.query(
      `INSERT INTO users
        (id, email, password, user_type, name, medical_conditions, medications, allergies, fitness_level)
       VALUES
        ($1, 'demo.patient@example.com', $3, 'patient', 'Alex Morgan', ARRAY['diabetes', 'hypertension'], ARRAY['metformin'], ARRAY['peanuts'], 'beginner'),
        ($2, 'demo.doctor@example.com', $3, 'doctor', 'Dr. Taylor Smith', ARRAY[]::TEXT[], ARRAY[]::TEXT[], ARRAY[]::TEXT[], 'advanced')
       ON CONFLICT (email) DO NOTHING`,
      [ids.patient, ids.doctor, passwordHash]
    );

    await client.query(
      `INSERT INTO patients
        (id, doctor_id, name, age, gender, phone, diagnosis, symptoms, allergies, current_medications)
       VALUES ($1, $2, 'Jordan Lee', 42, 'other', '0400 000 000', 'Hypertension', 'Recurring headaches', 'None', 'Lisinopril')
       ON CONFLICT (id) DO NOTHING`,
      [ids.patientRecord, ids.doctor]
    );

    await client.query(
      `INSERT INTO symptom_logs
        (id, user_id, symptoms, analysis_result, severity, emergency, confidence)
       VALUES ($1, $2, 'mild headache and fatigue', $3::jsonb, 'low', false, 0.82)
       ON CONFLICT (id) DO NOTHING`,
      [ids.symptom, ids.patient, JSON.stringify({ symptoms_found: ['headache', 'fatigue'], recommendation: 'Rest, hydrate, and monitor symptoms.' })]
    );

    await client.query(
      `INSERT INTO prescriptions
        (id, user_id, medication, dosage, frequency, duration, instructions, pharmacy_id, status)
       VALUES ($1, $2, 'Metformin', '500mg', 'twice daily', 'ongoing', 'Take with food', 'pharm_demo', 'active')
       ON CONFLICT (id) DO NOTHING`,
      [ids.prescription, ids.patient]
    );

    await client.query(
      `INSERT INTO exercise_completions
        (id, user_id, exercise_id, exercise_name, duration, intensity, calories_burned)
       VALUES ($1, $2, 'walking_demo', 'Walking', 30, 'moderate', 150)
       ON CONFLICT (id) DO NOTHING`,
      [ids.exercise, ids.patient]
    );

    await client.query(
      `INSERT INTO vital_signs
        (id, user_id, blood_pressure_systolic, blood_pressure_diastolic, heart_rate, weight, glucose_level)
       VALUES ($1, $2, 128, 82, 72, 78.5, 105)
       ON CONFLICT (id) DO NOTHING`,
      [ids.vital, ids.patient]
    );

    await client.query(
      `INSERT INTO medication_logs
        (id, user_id, medication_name, dosage, taken, taken_at)
       VALUES ($1, $2, 'Metformin', '500mg', true, NOW())
       ON CONFLICT (id) DO NOTHING`,
      [ids.medication, ids.patient]
    );

    await client.query(
      `INSERT INTO user_progress (user_id, total_points, current_streak, total_actions, badges)
       VALUES ($1, 150, 5, 25, ARRAY['First Steps', 'Consistency Champion'])
       ON CONFLICT (user_id) DO NOTHING`,
      [ids.patient]
    );

    await client.query('COMMIT');
    console.log('Portfolio demo data seeded.');
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Database seed failed:', error.message);
    process.exitCode = 1;
  } finally {
    client.release();
    await pool.end();
  }
}

seed();
