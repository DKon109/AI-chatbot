const { Client } = require('pg');
require('dotenv').config();

async function createDatabase() {
  if (process.env.DATABASE_URL) {
    console.log('DATABASE_URL is set; using the provider-managed database.');
    return;
  }

  const database = process.env.DB_NAME || 'medical_ai_enhanced';
  if (!/^[a-zA-Z_][a-zA-Z0-9_]*$/.test(database)) {
    throw new Error('DB_NAME may contain only letters, numbers, and underscores.');
  }

  const client = new Client({
    host: process.env.DB_HOST || 'localhost',
    port: Number(process.env.DB_PORT || 5432),
    database: 'postgres',
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD,
  });

  await client.connect();
  try {
    const existing = await client.query('SELECT 1 FROM pg_database WHERE datname = $1', [database]);
    if (existing.rowCount === 0) {
      await client.query(`CREATE DATABASE "${database}"`);
      console.log(`Created database ${database}.`);
    } else {
      console.log(`Database ${database} already exists.`);
    }
  } finally {
    await client.end();
  }
}

createDatabase().catch((error) => {
  console.error('Database creation failed:', error.message);
  process.exitCode = 1;
});
