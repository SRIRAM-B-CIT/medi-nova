const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const VitalRecord = require('../models/VitalRecord');

// Get all vital records for the authenticated user
router.get('/', auth, async (req, res) => {
  try {
    const records = await VitalRecord.find({ userId: req.user.id })
      .sort({ recordedAt: -1 });
    
    res.json(records);
  } catch (error) {
    console.error('Error fetching vital records:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Create a new vital record
router.post('/', auth, async (req, res) => {
  try {
    const { bloodPressure, heartRate, temperature, analysis } = req.body;

    if (!bloodPressure || !heartRate || !temperature || !analysis) {
      return res.status(400).json({ message: 'All fields are required' });
    }

    const newRecord = new VitalRecord({
      userId: req.user.id,
      bloodPressure,
      heartRate,
      temperature,
      analysis
    });

    await newRecord.save();
    res.status(201).json(newRecord);
  } catch (error) {
    console.error('Error creating vital record:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Delete a specific vital record
router.delete('/:id', auth, async (req, res) => {
  try {
    const record = await VitalRecord.findOne({
      _id: req.params.id,
      userId: req.user.id
    });

    if (!record) {
      return res.status(404).json({ message: 'Record not found' });
    }

    await VitalRecord.deleteOne({ _id: req.params.id });
    res.json({ message: 'Record deleted successfully' });
  } catch (error) {
    console.error('Error deleting vital record:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Delete all vital records for the authenticated user
router.delete('/', auth, async (req, res) => {
  try {
    await VitalRecord.deleteMany({ userId: req.user.id });
    res.json({ message: 'All records deleted successfully' });
  } catch (error) {
    console.error('Error deleting all vital records:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
