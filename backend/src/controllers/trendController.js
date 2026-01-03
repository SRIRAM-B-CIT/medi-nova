const VitalRecord = require('../models/VitalRecord');
const TrendAnalysis = require('../models/TrendAnalysis');

/**
 * Calculate linear regression trend slope
 * @param {Array} values - Array of numeric values
 * @returns {Number} Trend slope (positive = rising, negative = falling)
 */
const calculateTrendSlope = (values) => {
  if (values.length < 2) return 0;

  const n = values.length;
  const xValues = Array.from({ length: n }, (_, i) => i);
  
  const xMean = xValues.reduce((a, b) => a + b) / n;
  const yMean = values.reduce((a, b) => a + b) / n;
  
  let numerator = 0;
  let denominator = 0;
  
  for (let i = 0; i < n; i++) {
    numerator += (xValues[i] - xMean) * (values[i] - yMean);
    denominator += Math.pow(xValues[i] - xMean, 2);
  }
  
  return denominator === 0 ? 0 : numerator / denominator;
};

/**
 * Determine time period (morning, afternoon, night)
 * @param {Date} date
 * @returns {String} 'morning' | 'afternoon' | 'night'
 */
const getTimePeriod = (date) => {
  const hour = new Date(date).getHours();
  if (hour >= 5 && hour < 12) return 'morning';
  if (hour >= 12 && hour < 17) return 'afternoon';
  return 'night';
};

/**
 * Find peak time for vital readings
 * @param {Array} records - Array of vital records
 * @param {String} vitalType - 'bloodPressure', 'heartRate', or 'temperature'
 * @returns {Object} Peak time info
 */
const findPeakTime = (records, vitalType) => {
  const timePeriods = {
    morning: [],
    afternoon: [],
    night: []
  };

  records.forEach(record => {
    const period = getTimePeriod(record.recordedAt);
    let value = 0;

    if (vitalType === 'bloodPressure') {
      const parts = record.bloodPressure.split('/');
      value = parseInt(parts[0]); // systolic
    } else if (vitalType === 'heartRate') {
      value = parseInt(record.heartRate);
    } else if (vitalType === 'temperature') {
      value = parseFloat(record.temperature);
    }

    timePeriods[period].push(value);
  });

  // Calculate average for each period
  const avgByPeriod = {};
  for (const period in timePeriods) {
    const values = timePeriods[period];
    avgByPeriod[period] = values.length > 0 
      ? (values.reduce((a, b) => a + b) / values.length).toFixed(2)
      : 0;
  }

  // Find the period with highest average
  let peakPeriod = 'morning';
  let maxAvg = 0;
  for (const period in avgByPeriod) {
    if (parseFloat(avgByPeriod[period]) > maxAvg) {
      maxAvg = parseFloat(avgByPeriod[period]);
      peakPeriod = period;
    }
  }

  return {
    peakTime: peakPeriod,
    averages: avgByPeriod,
    maxAverage: maxAvg
  };
};

/**
 * Generate disease prediction based on trends and peaks
 * @param {Object} trends
 * @param {Object} peaks
 * @returns {String} Risk prediction
 */
const predictDisease = (trends, peaks) => {
  const riskFactors = [];

  // Blood Pressure analysis
  const bpTrend = trends.bpTrend;
  const bpPeakTime = peaks.bp.peakTime;

  if (bpTrend > 1.5 && (bpPeakTime === 'morning' || bpPeakTime === 'afternoon')) {
    riskFactors.push('hypertension_risk');
  }
  if (bpTrend > 2) {
    riskFactors.push('severe_bp_elevation');
  }

  // Heart Rate analysis
  const hrTrend = trends.hrTrend;
  if (hrTrend > 1.2) {
    riskFactors.push('cardiac_acceleration');
  }
  if (hrTrend < -1.5) {
    riskFactors.push('abnormal_heart_rate_drop');
  }

  // Temperature analysis
  const tempTrend = trends.tempTrend;
  const tempPeakTime = peaks.temperature.peakTime;

  if (tempTrend > 0.1 && tempPeakTime === 'afternoon') {
    riskFactors.push('infection_risk');
  }
  if (tempTrend > 0.15) {
    riskFactors.push('fever_development');
  }

  // Generate prediction message
  let riskLevel = 'Low risk: Vitals normal';
  let severity = 'low';

  if (riskFactors.length >= 3) {
    riskLevel = 'High risk: Multiple concerning trends detected';
    severity = 'high';
  } else if (riskFactors.length === 2) {
    riskLevel = 'Moderate risk: Several trends need monitoring';
    severity = 'moderate';
  } else if (riskFactors.length === 1) {
    if (riskFactors.includes('infection_risk')) {
      riskLevel = 'Moderate risk: Possible infection, monitor temperature';
      severity = 'moderate';
    } else if (riskFactors.includes('hypertension_risk')) {
      riskLevel = 'Moderate risk: Elevated blood pressure trend';
      severity = 'moderate';
    } else if (riskFactors.includes('cardiac_acceleration')) {
      riskLevel = 'Moderate risk: Elevated heart rate trend';
      severity = 'moderate';
    }
  }

  return {
    prediction: riskLevel,
    severity,
    factors: riskFactors
  };
};

// @desc    Get trend analysis and disease prediction for vitals
// @route   GET /api/trend-analysis?limit=20
// @access  Private
exports.getTrendAnalysis = async (req, res) => {
  try {
    const userId = req.user.id;

    // Calculate date range: last 10 days
    const tenDaysAgo = new Date();
    tenDaysAgo.setDate(tenDaysAgo.getDate() - 10);

    // Fetch vital records from last 10 days
    const records = await VitalRecord.find({ 
      userId,
      recordedAt: { $gte: tenDaysAgo }
    })
      .sort({ recordedAt: -1 })
      .lean();

    // Check if minimum 5 records exist
    if (records.length < 5) {
      return res.status(400).json({
        message: `Insufficient data. Need at least 5 records from last 10 days. Found: ${records.length}`,
        recordsFound: records.length,
        minimumRequired: 5
      });
    }

    // Reverse to chronological order (oldest to newest)
    records.reverse();

    // Extract values for trend calculation
    const bpSystolicValues = records.map(r => {
      const parts = r.bloodPressure.split('/');
      return parseInt(parts[0]);
    });
    const heartRateValues = records.map(r => parseInt(r.heartRate));
    const temperatureValues = records.map(r => parseFloat(r.temperature));

    // Calculate trend slopes
    const bpTrend = parseFloat(calculateTrendSlope(bpSystolicValues).toFixed(3));
    const hrTrend = parseFloat(calculateTrendSlope(heartRateValues).toFixed(3));
    const tempTrend = parseFloat(calculateTrendSlope(temperatureValues).toFixed(4));

    // Create trends object
    const trends = {
      bpTrend: bpTrend,
      hrTrend: hrTrend,
      tempTrend: tempTrend,
      interpretation: {
        bp: bpTrend > 0 ? 'Rising' : bpTrend < 0 ? 'Falling' : 'Stable',
        hr: hrTrend > 0 ? 'Rising' : hrTrend < 0 ? 'Falling' : 'Stable',
        temp: tempTrend > 0 ? 'Rising' : tempTrend < 0 ? 'Falling' : 'Stable'
      }
    };

    // Find peak times
    const peakTimes = {
      bp: findPeakTime(records, 'bloodPressure'),
      heartRate: findPeakTime(records, 'heartRate'),
      temperature: findPeakTime(records, 'temperature')
    };

    // Get disease prediction
    const prediction = predictDisease(trends, peakTimes);

    // Get latest values
    const latestRecord = records[records.length - 1];
    const bpParts = latestRecord.bloodPressure.split('/');

    // Prepare analysis data
    const analysisData = {
      success: true,
      dataPoints: records.length,
      dateRange: {
        from: records[0].recordedAt,
        to: latestRecord.recordedAt
      },
      latestVitals: {
        bloodPressure: latestRecord.bloodPressure,
        heartRate: latestRecord.heartRate,
        temperature: latestRecord.temperature,
        recordedAt: latestRecord.recordedAt
      },
      trends: {
        bpTrend: trends.bpTrend,
        hrTrend: trends.hrTrend,
        tempTrend: trends.tempTrend,
        interpretation: trends.interpretation
      },
      peakTimes: {
        bloodPressure: peakTimes.bp.peakTime,
        heartRate: peakTimes.heartRate.peakTime,
        temperature: peakTimes.temperature.peakTime,
        details: {
          bp: peakTimes.bp.averages,
          hr: peakTimes.heartRate.averages,
          temp: peakTimes.temperature.averages
        }
      },
      diseasePrediction: prediction.prediction,
      riskSeverity: prediction.severity,
      riskFactors: prediction.factors,
      vitalHistory: records.map(r => ({
        bpSystolic: parseInt(r.bloodPressure.split('/')[0]),
        heartRate: parseInt(r.heartRate),
        temperature: parseFloat(r.temperature),
        recordedAt: r.recordedAt
      }))
    };

    // Save analysis to MongoDB for future reference
    const savedAnalysis = await TrendAnalysis.create({
      userId,
      dataPoints: records.length,
      trends: {
        bpTrend: trends.bpTrend,
        hrTrend: trends.hrTrend,
        tempTrend: trends.tempTrend,
        interpretation: trends.interpretation
      },
      peakTimes: {
        bloodPressure: peakTimes.bp.peakTime,
        heartRate: peakTimes.heartRate.peakTime,
        temperature: peakTimes.temperature.peakTime,
        details: {
          bp: peakTimes.bp.averages,
          hr: peakTimes.heartRate.averages,
          temp: peakTimes.temperature.averages
        }
      },
      diseasePrediction: prediction.prediction,
      riskSeverity: prediction.severity,
      riskFactors: prediction.factors
    });

    // Add analysis ID to response
    analysisData.analysisId = savedAnalysis._id;
    analysisData.savedAt = savedAnalysis.createdAt;

    res.json(analysisData);
  } catch (error) {
    console.error('Error calculating trend analysis:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};
