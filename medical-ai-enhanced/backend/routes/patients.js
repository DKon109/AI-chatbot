const express = require('express');
const { authenticateToken, requireDoctor } = require('../middleware/auth');
const { randomUUID } = require('crypto');
const pool = require('../config/database');

const router = express.Router();

// All patient routes require authentication and doctor role
router.use(authenticateToken);
router.use(requireDoctor);

// Get all patients for the doctor
router.get('/', async (req, res, next) => {
  try {
    const { page = 1, limit = 10, search = '' } = req.query;
    const offset = (page - 1) * limit;
    
    let query = `
      SELECT id, name, age, gender, phone, address, diagnosis, symptoms, 
             allergies, current_medications, created_at, updated_at
      FROM patients 
      WHERE doctor_id = $1
    `;
    let params = [req.userId];
    
    if (search) {
      query += ` AND (name ILIKE $2 OR diagnosis ILIKE $2 OR symptoms ILIKE $2)`;
      params.push(`%${search}%`);
    }
    
    query += ` ORDER BY created_at DESC LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;
    params.push(limit, offset);
    
    const result = await pool.query(query, params);
    
    // Get total count for pagination
    let countQuery = 'SELECT COUNT(*) FROM patients WHERE doctor_id = $1';
    let countParams = [req.userId];
    
    if (search) {
      countQuery += ` AND (name ILIKE $2 OR diagnosis ILIKE $2 OR symptoms ILIKE $2)`;
      countParams.push(`%${search}%`);
    }
    
    const countResult = await pool.query(countQuery, countParams);
    const total = parseInt(countResult.rows[0].count);
    
    res.json({
      success: true,
      data: {
        patients: result.rows,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / limit)
        }
      }
    });
  } catch (error) {
    next(error);
  }
});

// Get specific patient
router.get('/:id', async (req, res, next) => {
  try {
    const { id } = req.params;
    
    const result = await pool.query(
      'SELECT * FROM patients WHERE id = $1 AND doctor_id = $2',
      [id, req.userId]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Patient not found'
      });
    }
    
    res.json({
      success: true,
      data: result.rows[0]
    });
  } catch (error) {
    next(error);
  }
});

// Add new patient
router.post('/', async (req, res, next) => {
  try {
    const {
      name, age, gender, phone, address, diagnosis, symptoms,
      allergies, current_medications
    } = req.body;
    
    // Validate required fields
    if (!name || !age || !diagnosis) {
      return res.status(400).json({
        success: false,
        error: 'Name, age, and diagnosis are required fields'
      });
    }
    
    const result = await pool.query(
      `INSERT INTO patients (id, doctor_id, name, age, gender, phone, address, 
                           diagnosis, symptoms, allergies, current_medications, created_at) 
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, NOW()) 
       RETURNING *`,
      [randomUUID(), req.userId, name, age, gender, phone, address,
       diagnosis, symptoms, allergies, current_medications]
    );
    
    res.status(201).json({
      success: true,
      message: 'Patient added successfully',
      data: result.rows[0]
    });
  } catch (error) {
    next(error);
  }
});

// Update patient
router.put('/:id', async (req, res, next) => {
  try {
    const { id } = req.params;
    const {
      name, age, gender, phone, address, diagnosis, symptoms,
      allergies, current_medications
    } = req.body;
    
    const result = await pool.query(
      `UPDATE patients 
       SET name = $1, age = $2, gender = $3, phone = $4, address = $5,
           diagnosis = $6, symptoms = $7, allergies = $8, 
           current_medications = $9, updated_at = NOW()
       WHERE id = $10 AND doctor_id = $11
       RETURNING *`,
      [name, age, gender, phone, address, diagnosis, symptoms,
       allergies, current_medications, id, req.userId]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Patient not found or you do not have permission to update'
      });
    }
    
    res.json({
      success: true,
      message: 'Patient updated successfully',
      data: result.rows[0]
    });
  } catch (error) {
    next(error);
  }
});

// Delete patient
router.delete('/:id', async (req, res, next) => {
  try {
    const { id } = req.params;
    
    const result = await pool.query(
      'DELETE FROM patients WHERE id = $1 AND doctor_id = $2 RETURNING id',
      [id, req.userId]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Patient not found or you do not have permission to delete'
      });
    }
    
    res.json({
      success: true,
      message: 'Patient deleted successfully'
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
