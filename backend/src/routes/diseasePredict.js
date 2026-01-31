const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/auth');
const axios = require('axios');

const ML_SERVICE_URL = process.env.ML_SERVICE_URL || 'http://localhost:5001';

/**
 * @desc    Predict disease from current vitals
 * @route   POST /api/disease-predict
 * @access  Private
 */
router.post('/', authMiddleware, async (req, res) => {
  try {
    const { blood_pressure_systolic, blood_pressure_diastolic, heart_rate, temperature, spo2 } = req.body;

    // Validate required fields
    if (!blood_pressure_systolic || !blood_pressure_diastolic || !heart_rate || !temperature || !spo2) {
      return res.status(400).json({
        message: 'Missing required vitals: blood_pressure_systolic, blood_pressure_diastolic, heart_rate, temperature, spo2'
      });
    }

    // Call ML service
    const response = await axios.post(`${ML_SERVICE_URL}/api/predict`, {
      blood_pressure_systolic: parseFloat(blood_pressure_systolic),
      blood_pressure_diastolic: parseFloat(blood_pressure_diastolic),
      heart_rate: parseFloat(heart_rate),
      temperature: parseFloat(temperature),
      spo2: parseFloat(spo2)
    });

    res.json(response.data);
  } catch (error) {
    console.error('Disease prediction error:', error.message);
    
    if (error.code === 'ECONNREFUSED') {
      return res.status(503).json({
        message: 'ML service unavailable. Please try again later.',
        error: 'ML_SERVICE_DOWN'
      });
    }

    res.status(500).json({
      message: error.message || 'Error predicting disease'
    });
  }
});

/**
 * @desc    Predict disease for multiple vital records (batch)
 * @route   POST /api/disease-predict/batch
 * @access  Private
 */
router.post('/batch', authMiddleware, async (req, res) => {
  try {
    const { records } = req.body;

    if (!Array.isArray(records) || records.length === 0) {
      return res.status(400).json({
        message: 'Invalid input: records must be a non-empty array'
      });
    }

    // Call ML service
    const response = await axios.post(`${ML_SERVICE_URL}/api/batch-predict`, {
      records
    });

    res.json(response.data);
  } catch (error) {
    console.error('Batch disease prediction error:', error.message);
    
    if (error.code === 'ECONNREFUSED') {
      return res.status(503).json({
        message: 'ML service unavailable. Please try again later.',
        error: 'ML_SERVICE_DOWN'
      });
    }

    res.status(500).json({
      message: error.message || 'Error predicting diseases'
    });
  }
});

module.exports = router;
