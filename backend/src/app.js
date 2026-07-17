const express = require('express');

const authRoutes = require('./routes/auth');
const patientDetailsRoutes = require('./routes/patientDetails');
const medicationRemindersRoutes = require('./routes/medicationReminders');
const vitalRecordsRoutes = require('./routes/vitalRecords');
const trendAnalysisRoutes = require('./routes/trendAnalysis');
const diseasePredictRoutes = require('./routes/diseasePredict');
const medicalChatbotRoutes = require('./routes/medicalChatbot');
const healthInsightsRoutes = require('./routes/healthInsights');
const weatherDiseaseRiskRoutes = require('./routes/weatherDiseaseRisk');
const labReportRoutes = require('./routes/labReports');
const nearbyHospitalRoutes = require('./routes/nearbyHospitals');

const app = express();

app.use(express.json({ limit: '2mb' }));
app.use(express.urlencoded({ extended: true, limit: '2mb' }));

app.get('/', (req, res) => {
  res.json({ message: 'MediNova API Server' });
});

app.use('/auth', authRoutes);
app.use('/patient-details', patientDetailsRoutes);
app.use('/medication-reminders', medicationRemindersRoutes);
app.use('/vital-records', vitalRecordsRoutes);
app.use('/trend-analysis', trendAnalysisRoutes);
app.use('/disease-predict', diseasePredictRoutes);
app.use('/medical-chatbot', medicalChatbotRoutes);
app.use('/health-insights', healthInsightsRoutes);
app.use('/weather-disease-risk', weatherDiseaseRiskRoutes);
app.use('/lab-reports', labReportRoutes);
app.use('/nearby-hospitals', nearbyHospitalRoutes);

app.use((err, req, res, next) => {
  console.error(err.stack || err);
  res.status(500).json({ message: 'Something went wrong!' });
});

app.use((req, res) => {
  res.status(404).json({ message: 'Route not found' });
});

module.exports = app;
