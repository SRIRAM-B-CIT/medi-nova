# 🏥 MediNova ML Model Integration Guide

## Overview

This document describes the ML model integration for disease prediction from vital signs. The system uses a **Random Forest classifier** with **95% accuracy** trained on vital health metrics (blood pressure, heart rate, temperature) to predict diseases.

### Model Performance

```
Accuracy: 95.22%

Classification Report:
                   precision    recall  f1-score   support
           Asthma       0.92      0.92      0.92      2377
Diabetes Mellitus       0.94      0.90      0.92      2433
          Healthy       1.00      1.00      1.00      2395
    Heart Disease       0.93      0.99      0.96      2409
     Hypertension       0.97      0.95      0.96      2386

         accuracy                           0.95     12000
        macro avg       0.95      0.95      0.95     12000
     weighted avg       0.95      0.95      0.95     12000
```

---

## System Architecture

### Components

```
┌─────────────────┐
│   Frontend      │ (React + TypeScript)
│   Port: 5173    │
└────────┬────────┘
         │
┌────────▼────────────────────────┐
│   Backend API                    │ (Node.js/Express)
│   Port: 5000                     │
│   - Disease Prediction Endpoint  │
│   - Trend Analysis              │
│   - Vital Records Management     │
└────────┬───────────────────────┘
         │
┌────────▼──────────────┐
│   ML Service          │ (Flask)
│   Port: 5001          │
│   - Model Inference   │
│   - Predictions       │
└──────────────────────┘
```

### ML Model Files

Located in `/ml_service/` directory:

- **`vitals_random_forest_model.pkl`** - Trained Random Forest model
- **`vitals_feature_scaler.pkl`** - Feature scaling object (StandardScaler)
- **`vitals_label_encoder.pkl`** - Label encoder for disease categories
- **`Vitals_Predicted_Disease_Model.ipynb`** - Training notebook

### Supported Diseases

1. **Asthma** - 92% precision
2. **Diabetes Mellitus** - 94% precision
3. **Healthy** - 100% precision (best detected)
4. **Heart Disease** - 93% precision
5. **Hypertension** - 97% precision (highest precision)

---

## Installation & Setup

### Prerequisites

- **Python 3.8+** (for ML service)
- **Node.js 18+** (for backend/frontend)
- **npm** (Node package manager)
- **MongoDB** (already configured)

### Quick Setup

#### Windows

```bash
# 1. Setup ML Service (one-time)
setup-ml-service.bat

# 2. Install backend dependencies
cd backend
npm install
cd ..

# 3. Install frontend dependencies
npm install

# 4. Start all services
start-all.bat
```

#### Linux/Mac

```bash
# 1. Setup ML Service (one-time)
chmod +x setup-ml-service.sh
./setup-ml-service.sh

# 2. Install backend dependencies
cd backend
npm install
cd ..

# 3. Install frontend dependencies
npm install

# 4. Start all services
chmod +x start-all.sh
./start-all.sh
```

### Manual Service Startup

#### Start ML Service

```bash
# Windows
cd ml_service
venv\Scripts\activate.bat
python app.py

# Linux/Mac
cd ml_service
source venv/bin/activate
python app.py
```

The ML service will be available at: `http://localhost:5001`

#### Start Backend API

```bash
# In a new terminal
cd backend
npm run dev
```

Backend will be available at: `http://localhost:5000`

#### Start Frontend

```bash
# In another new terminal
npm run dev
```

Frontend will be available at: `http://localhost:5173`

---

## API Documentation

### ML Service Endpoints

#### 1. Health Check

```http
GET http://localhost:5001/health
```

**Response:**
```json
{
  "status": "ok",
  "models_loaded": true
}
```

#### 2. Single Disease Prediction

```http
POST http://localhost:5001/api/predict
Content-Type: application/json
```

**Request Body:**
```json
{
  "blood_pressure_systolic": 130,
  "blood_pressure_diastolic": 85,
  "heart_rate": 78,
  "temperature": 37.2
}
```

**Response:**
```json
{
  "disease": "Hypertension",
  "confidence": 0.97,
  "probability_distribution": {
    "Asthma": 0.02,
    "Diabetes Mellitus": 0.01,
    "Healthy": 0.00,
    "Heart Disease": 0.00,
    "Hypertension": 0.97
  },
  "risk_level": "high",
  "recommendations": [
    "Reduce sodium intake to <2300mg/day",
    "Increase physical activity (150 min/week)",
    "Manage stress through meditation/yoga",
    "Limit alcohol consumption",
    "Monitor BP daily, schedule doctor visit"
  ],
  "input_vitals": {
    "blood_pressure": "130/85",
    "heart_rate": 78,
    "temperature": 37.2
  }
}
```

#### 3. Batch Disease Prediction

```http
POST http://localhost:5001/api/batch-predict
Content-Type: application/json
```

**Request Body:**
```json
{
  "records": [
    {
      "blood_pressure_systolic": 130,
      "blood_pressure_diastolic": 85,
      "heart_rate": 78,
      "temperature": 37.2
    },
    {
      "blood_pressure_systolic": 120,
      "blood_pressure_diastolic": 80,
      "heart_rate": 72,
      "temperature": 37.0
    }
  ]
}
```

**Response:**
```json
{
  "predictions": [
    {
      "disease": "Hypertension",
      "confidence": 0.97,
      "risk_level": "high"
    },
    {
      "disease": "Healthy",
      "confidence": 0.98,
      "risk_level": "low"
    }
  ],
  "summary": {
    "most_common_disease": "Healthy",
    "average_confidence": 0.975,
    "total_records": 2
  }
}
```

### Backend API Endpoints

#### Disease Prediction Endpoint

```http
POST /api/disease-predict
Authorization: Bearer <token>
Content-Type: application/json
```

**Request Body:**
```json
{
  "blood_pressure_systolic": 130,
  "blood_pressure_diastolic": 85,
  "heart_rate": 78,
  "temperature": 37.2
}
```

#### Trend Analysis with ML Integration

```http
GET /api/trend-analysis?limit=20
Authorization: Bearer <token>
```

**Response includes ML predictions:**
```json
{
  "success": true,
  "dataPoints": 15,
  "diseasePrediction": "High risk: ML model predicts Hypertension (97% confidence)",
  "riskSeverity": "high",
  "mlPrediction": {
    "disease": "Hypertension",
    "confidence": 0.97,
    "probabilities": {...},
    "recommendations": [...]
  },
  "trends": {...},
  "vitalHistory": [...]
}
```

---

## Frontend Integration

### PatientDashboard Component

The `PatientDashboard` component now includes:

1. **ML Disease Prediction Card** - Shows disease prediction with confidence score
2. **Risk Level Badge** - Color-coded risk indicator
3. **Probability Distribution** - Shows all disease probabilities
4. **AI Recommendations** - Health recommendations from ML model
5. **Loading State** - Animated spinner during ML analysis

### TrendAnalysis Component

Enhanced with:

1. **AI Health Prediction Card** - Displays ML model insights
2. **Confidence Score Progress Bar** - Visual confidence indicator
3. **Disease Probabilities Table** - Probability breakdown
4. **AI Recommendations List** - Personalized health guidance

### API Client Methods

```typescript
// Single disease prediction
const result = await apiClient.predictDisease({
  blood_pressure_systolic: 130,
  blood_pressure_diastolic: 85,
  heart_rate: 78,
  temperature: 37.2
});

// Batch prediction
const results = await apiClient.batchPredictDiseases([
  { blood_pressure_systolic: 130, ... },
  { blood_pressure_systolic: 120, ... }
]);
```

---

## Configuration

### Environment Variables

**Backend (.env)**
```
ML_SERVICE_URL=http://localhost:5001
PORT=5000
```

**ML Service (.env)**
```
FLASK_ENV=development
FLASK_DEBUG=True
```

---

## Troubleshooting

### ML Service Not Starting

```bash
# Verify Python installation
python --version

# Check virtual environment
python -m venv ml_service/venv
source ml_service/venv/bin/activate  # or venv\Scripts\activate.bat on Windows

# Install dependencies
pip install -r requirements.txt

# Run manually
python ml_service/app.py
```

### Models Not Loading

```bash
# Verify model files exist
ls ml_service/vitals_random_forest_model.pkl
ls ml_service/vitals_feature_scaler.pkl
ls ml_service/vitals_label_encoder.pkl

# Check ML service logs for error details
```

### Backend Can't Connect to ML Service

```bash
# Verify ML service is running
curl http://localhost:5001/health

# Check backend .env file
# Ensure: ML_SERVICE_URL=http://localhost:5001

# Check firewall settings (port 5001)
```

### Slow Predictions

- ML service runs first prediction slower (model loading)
- Subsequent predictions are cached and faster
- For batch predictions, use `/api/batch-predict` endpoint (more efficient)

---

## Performance Notes

- **Single Prediction**: ~150-300ms (first time), ~50-100ms (cached)
- **Batch Prediction**: ~200-400ms for 10 records
- **Model Size**: ~15-20 MB
- **Memory Usage**: ~100-150 MB per Flask process
- **Concurrency**: Handles ~50+ concurrent requests

---

## Model Retraining

To retrain the model with new data:

1. Update training notebook: `ml_service/Vitals_Predicted_Disease_Model.ipynb`
2. Run training in Jupyter
3. Export new `.pkl` files to `ml_service/` directory
4. Restart Flask service

**Note**: Model files will be automatically loaded on service restart

---

## Security Considerations

1. **API Authentication** - Backend requires JWT tokens for ML endpoints
2. **Input Validation** - ML service validates vital sign ranges
3. **CORS** - ML service configured with appropriate CORS headers
4. **Error Handling** - Errors don't expose model internals

---

## Future Enhancements

1. **Model Versioning** - Support multiple model versions
2. **Online Learning** - Update model with new patient data
3. **Explainability** - Add SHAP values for prediction explanations
4. **Advanced Features** - Add more vital signs (SpO2, respiratory rate)
5. **Ensemble Methods** - Combine multiple models for better accuracy

---

## Support & Documentation

- **Model Training**: See `ml_service/Vitals_Predicted_Disease_Model.ipynb`
- **Backend API**: Check `backend/src/controllers/trendController.js`
- **Frontend Components**: See `src/components/TrendAnalysis.tsx` and `src/pages/PatientDashboard.tsx`
- **Error Logs**: Check terminal output for detailed error messages

---

**Last Updated**: January 2026
**Model Accuracy**: 95.22%
**Supported Diseases**: 5 (Asthma, Diabetes Mellitus, Healthy, Heart Disease, Hypertension)
