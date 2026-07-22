const express = require('express');
const { authenticateToken } = require('../middleware/auth');
const pool = require('../config/database');

const router = express.Router();
router.use(authenticateToken);

router.get('/all', async (req, res, next) => {
  try {
    const result = await pool.query(`
      SELECT id, diagnosis, recommended_foods, avoid_foods, additional_notes, created_at, updated_at
      FROM diet_recommendations
      ORDER BY diagnosis ASC
    `);
    res.json({ success: true, data: result.rows });
  } catch (error) {
    next(error);
  }
});

router.get('/recommendation', async (req, res, next) => {
  try {
    const diagnosis = typeof req.query.diagnosis === 'string' ? req.query.diagnosis.trim() : '';
    if (!diagnosis) {
      return res.status(400).json({ success: false, error: 'Diagnosis is required.' });
    }
    const result = await pool.query(`
      SELECT id, diagnosis, recommended_foods, avoid_foods, additional_notes, created_at, updated_at
      FROM diet_recommendations
      WHERE diagnosis ILIKE $1
      ORDER BY diagnosis ASC
      LIMIT 1
    `, [diagnosis]);
    if (!result.rows.length) {
      return res.status(404).json({ success: false, error: 'No diet recommendation found.' });
    }
    res.json({ success: true, data: result.rows[0] });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
