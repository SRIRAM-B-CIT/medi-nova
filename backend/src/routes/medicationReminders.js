const express = require('express');
const router = express.Router();
const {
  getMedicationReminders,
  getMedicationReminder,
  createMedicationReminder,
  updateMedicationReminder,
  deleteMedicationReminder,
} = require('../controllers/medicationController');
const authMiddleware = require('../middleware/auth');

router.get('/', authMiddleware, getMedicationReminders);
router.get('/:id', authMiddleware, getMedicationReminder);
router.post('/', authMiddleware, createMedicationReminder);
router.put('/:id', authMiddleware, updateMedicationReminder);
router.delete('/:id', authMiddleware, deleteMedicationReminder);

module.exports = router;
