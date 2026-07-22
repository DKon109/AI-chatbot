const fs = require('fs');
const path = require('path');
const pool = require('../config/database');

const migrations = [
  'schema.sql',
  'ai_agents_schema.sql',
  'doctor_ai_schema.sql',
  'ai_intake_schema.sql',
];

async function migrate() {
  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    for (const filename of migrations) {
      const sql = fs.readFileSync(path.join(__dirname, '..', 'database', filename), 'utf8');
      await client.query(sql);
      console.log(`Applied ${filename}`);
    }

    await client.query('COMMIT');
    console.log('Database migration completed.');
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Database migration failed:', error.message);
    process.exitCode = 1;
  } finally {
    client.release();
    await pool.end();
  }
}

migrate();
