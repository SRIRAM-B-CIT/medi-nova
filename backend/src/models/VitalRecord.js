const mongoose = require('mongoose');

const vitalRecordSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  bloodPressure: {
    type: String,
    required: true
  },
  heartRate: {
    type: String,
    required: true
  },
  temperature: {
    type: String,
    required: true
  },
  spo2: {
    type: String,
    default: '98'
  },
  analysis: {
    type: String,
    required: true
  },
  recordedAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Index for faster queries
vitalRecordSchema.index({ userId: 1, recordedAt: -1 });

module.exports = mongoose.model('VitalRecord', vitalRecordSchema);
