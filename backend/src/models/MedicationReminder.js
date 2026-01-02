const mongoose = require('mongoose');

const medicationReminderSchema = new mongoose.Schema({
  patient_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  created_by: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  medication_name: {
    type: String,
    required: true,
  },
  dosage: {
    type: String,
    required: true,
  },
  reminder_type: {
    type: String,
    enum: ['time_based', 'interval_based', 'schedule_pattern'],
    default: 'time_based',
  },
  reminder_times: [String],
  interval_hours: Number,
  schedule_pattern: String,
  start_date: {
    type: Date,
    default: Date.now,
  },
  end_date: Date,
  is_active: {
    type: Boolean,
    default: true,
  },
  notes: String,
  created_at: {
    type: Date,
    default: Date.now,
  },
  updated_at: {
    type: Date,
    default: Date.now,
  },
});

medicationReminderSchema.pre('save', function (next) {
  this.updated_at = Date.now();
  next();
});

module.exports = mongoose.model('MedicationReminder', medicationReminderSchema);
