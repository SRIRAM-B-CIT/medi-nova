require('dotenv').config();
const express = require('express');
const cors = require('cors');
const connectDB = require('./config/database');

// Import routes
const authRoutes = require('./routes/auth');
const patientDetailsRoutes = require('./routes/patientDetails');
const medicationRemindersRoutes = require('./routes/medicationReminders');
const vitalRecordsRoutes = require('./routes/vitalRecords');
const trendAnalysisRoutes = require('./routes/trendAnalysis');
const diseasePredictRoutes = require('./routes/diseasePredict');

const app = express();

// Connect to MongoDB
connectDB();

// Middleware
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true,
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
app.get('/', (req, res) => {
  res.json({ message: 'MediNova API Server' });
});

app.use('/api/auth', authRoutes);
app.use('/api/patient-details', patientDetailsRoutes);
app.use('/api/medication-reminders', medicationRemindersRoutes);
app.use('/api/vital-records', vitalRecordsRoutes);
app.use('/api/trend-analysis', trendAnalysisRoutes);
app.use('/api/disease-predict', diseasePredictRoutes);

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ message: 'Something went wrong!' });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ message: 'Route not found' });
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
  console.log(`Environment: ${process.env.NODE_ENV}`);
});
