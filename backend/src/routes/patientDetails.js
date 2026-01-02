const express = require('express');
const router = express.Router();
const {
  getPatientDetails,
  getPatientDetailsByUserId,
  createOrUpdatePatientDetails,
  checkHealthRecord,
} = require('../controllers/patientController');
const authMiddleware = require('../middleware/auth');

router.get('/', authMiddleware, getPatientDetails);
router.get('/check', authMiddleware, checkHealthRecord);
router.get('/:userId', authMiddleware, getPatientDetailsByUserId);
router.post('/', authMiddleware, createOrUpdatePatientDetails);

module.exports = router;
