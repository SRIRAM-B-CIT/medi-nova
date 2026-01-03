const mongoose = require('mongoose');

const trendAnalysisSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  dataPoints: {
    type: Number,
    required: true
  },
  trends: {
    bpTrend: Number,
    hrTrend: Number,
    tempTrend: Number,
    interpretation: {
      bp: String,
      hr: String,
      temp: String
    }
  },
  peakTimes: {
    bloodPressure: String,
    heartRate: String,
    temperature: String,
    details: {
      bp: Object,
      hr: Object,
      temp: Object
    }
  },
  diseasePrediction: String,
  riskSeverity: {
    type: String,
    enum: ['low', 'moderate', 'high']
  },
  riskFactors: [String],
  analysisDate: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Index for faster queries
trendAnalysisSchema.index({ userId: 1, analysisDate: -1 });

module.exports = mongoose.model('TrendAnalysis', trendAnalysisSchema);
