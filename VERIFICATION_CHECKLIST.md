# ✅ Verification Checklist - ML Model Integration

Use this checklist to verify the ML model integration is working correctly.

---

## 📋 Pre-Launch Checklist

### Environment Setup
- [ ] Python 3.8+ installed (`python --version`)
- [ ] Node.js 18+ installed (`node --version`)
- [ ] npm installed (`npm --version`)
- [ ] MongoDB configured and running
- [ ] All model files present in `ml_service/`

### Installation
- [ ] `setup-ml-service.bat/sh` executed successfully
- [ ] Backend `npm install` completed
- [ ] Frontend `npm install` completed
- [ ] No error messages during installation

### Configuration
- [ ] `backend/.env` contains `ML_SERVICE_URL=http://localhost:5001`
- [ ] `backend/package.json` includes axios dependency
- [ ] Model files readable: `.pkl` files exist

---

## 🚀 Service Startup Verification

### Terminal 1: ML Service
```bash
# Run: cd ml_service && python app.py
- [ ] Flask server starting message appears
- [ ] "Running on http://localhost:5001" message
- [ ] No errors in output
- [ ] Service stays running
```

Test endpoint:
```bash
curl http://localhost:5001/health
# Should return: {"status": "ok", "models_loaded": true}
- [ ] Response is 200 OK
- [ ] Models loaded = true
```

### Terminal 2: Backend
```bash
# Run: cd backend && npm run dev
- [ ] Express server starting on port 5000
- [ ] Connected to MongoDB message
- [ ] "listening on port 5000" message
- [ ] No errors in output
```

Test endpoint:
```bash
curl http://localhost:5000
# Should return: {"message": "MediNova API Server"}
- [ ] Response is 200 OK
```

### Terminal 3: Frontend
```bash
# Run: npm run dev
- [ ] Vite development server starting
- [ ] "Local: http://localhost:5173" appears
- [ ] No compilation errors
```

---

## 🧪 Frontend Feature Verification

### 1. Access Application
- [ ] Open http://localhost:5173 in browser
- [ ] No error messages in console (F12)
- [ ] Page loads completely

### 2. Patient Dashboard Test
- [ ] Navigate to Patient Dashboard
- [ ] Section "Add Health Vitals" visible
- [ ] Input fields for BP, HR, Temperature visible

### 3. Manual Vital Entry Test
```
Enter these values:
- Blood Pressure: 130/85
- Heart Rate: 78
- Temperature: 37.2
- Click "Analyze Health Metrics"
```

Verify:
- [ ] Loading spinner appears
- [ ] Analysis completes within 5 seconds
- [ ] "AI Health Prediction" card appears
- [ ] Shows "Hypertension" or similar disease
- [ ] Confidence score displayed (should be >80%)
- [ ] Risk level badge shown (high/medium/low)
- [ ] Recommendations list visible
- [ ] No error messages

### 4. ML Prediction Card Check
- [ ] Card title shows "AI Health Prediction"
- [ ] Shows "Powered by ML Model (95% accuracy)"
- [ ] Displays predicted disease name
- [ ] Confidence score progress bar visible
- [ ] Confidence percentage displayed
- [ ] Risk level badge color appropriate
- [ ] Probability distribution shown
- [ ] At least 3 recommendations visible

### 5. Trend Analysis Test
- [ ] Navigate to Trend Analysis component
- [ ] Click "Analyze Trend & Predict Risk"
- [ ] Waits for sufficient data (<5 records: error message expected)
- [ ] After analysis:
  - [ ] Risk prediction alert appears
  - [ ] "ML Disease Prediction" card visible
  - [ ] Shows disease and confidence
  - [ ] Probability bars displayed
  - [ ] Recommendations shown

---

## 🔌 API Integration Verification

### Backend Disease Prediction Endpoint
```bash
curl -X POST http://localhost:5000/api/disease-predict \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "blood_pressure_systolic": 130,
    "blood_pressure_diastolic": 85,
    "heart_rate": 78,
    "temperature": 37.2
  }'
```

Expected response includes:
- [ ] `disease`: Disease name (string)
- [ ] `confidence`: Confidence score (0-1)
- [ ] `probability_distribution`: All disease probabilities
- [ ] `risk_level`: high/medium/low
- [ ] `recommendations`: Array of recommendation strings
- [ ] HTTP 200 OK status

### ML Service Prediction Endpoint
```bash
curl -X POST http://localhost:5001/api/predict \
  -H "Content-Type: application/json" \
  -d '{
    "blood_pressure_systolic": 130,
    "blood_pressure_diastolic": 85,
    "heart_rate": 78,
    "temperature": 37.2
  }'
```

Expected response:
- [ ] `disease`: str
- [ ] `confidence`: float (0-1)
- [ ] `probability_distribution`: dict
- [ ] `risk_level`: str
- [ ] `recommendations`: list
- [ ] HTTP 200 OK status

---

## 📊 Test Cases

### Test 1: Healthy Person
```
Input:
- BP: 120/80
- HR: 72
- Temp: 37.0

Expected:
- [ ] Disease: "Healthy"
- [ ] Confidence: > 0.95
- [ ] Risk Level: "low"
```

### Test 2: High Blood Pressure
```
Input:
- BP: 150/95
- HR: 82
- Temp: 37.1

Expected:
- [ ] Disease: "Hypertension"
- [ ] Confidence: > 0.90
- [ ] Risk Level: "high"
```

### Test 3: Heart Issues
```
Input:
- BP: 135/88
- HR: 105
- Temp: 37.3

Expected:
- [ ] Disease: "Heart Disease" or "Hypertension"
- [ ] Confidence: > 0.85
- [ ] Risk Level: "high" or "medium"
```

### Test 4: Fever/Infection
```
Input:
- BP: 125/82
- HR: 95
- Temp: 38.8

Expected:
- [ ] Disease: Relevant to high temperature
- [ ] Confidence: > 0.80
- [ ] Risk Level: "medium" or "high"
```

---

## 🐛 Error Handling Verification

### ML Service Unavailable
- [ ] Kill ML service (CTRL+C)
- [ ] Try to analyze vitals on frontend
- [ ] Should show error message or use fallback
- [ ] Backend still responsive
- [ ] Restart ML service works without restart

### Invalid Input
```bash
curl -X POST http://localhost:5001/api/predict \
  -H "Content-Type: application/json" \
  -d '{
    "blood_pressure_systolic": "invalid"
  }'
```
- [ ] Returns 400 error
- [ ] Includes descriptive error message

### Missing Fields
```bash
curl -X POST http://localhost:5001/api/predict \
  -H "Content-Type: application/json" \
  -d '{
    "blood_pressure_systolic": 130
  }'
```
- [ ] Returns 400 error
- [ ] Message indicates missing fields

---

## 📈 Performance Verification

### Response Time
- [ ] First prediction: < 500ms
- [ ] Subsequent predictions: < 150ms
- [ ] Batch predictions (10 records): < 500ms

### Resource Usage
- [ ] ML service memory: < 300 MB
- [ ] No memory leaks after multiple predictions
- [ ] CPU usage normal during inference

### Concurrency
- [ ] Test 5 simultaneous requests
- [ ] Test 10 simultaneous requests
- [ ] All complete successfully

---

## 📚 Documentation Verification

Files exist and readable:
- [ ] `ML_INTEGRATION_GUIDE.md`
- [ ] `QUICK_START.md`
- [ ] `IMPLEMENTATION_SUMMARY.md`
- [ ] `setup-ml-service.bat` / `.sh`
- [ ] `start-all.bat` / `.sh`

Documentation includes:
- [ ] Architecture explanation
- [ ] API documentation
- [ ] Setup instructions
- [ ] Troubleshooting guide
- [ ] Test cases

---

## 🔐 Security Verification

- [ ] ML service requires authorization (if needed)
- [ ] Invalid tokens rejected
- [ ] CORS properly configured
- [ ] No sensitive data in error messages
- [ ] Input validation prevents injection

---

## 🎯 Final Verification

### Entire Flow Test
1. [ ] Login to application
2. [ ] Navigate to Patient Dashboard
3. [ ] Enter vital signs
4. [ ] Click "Analyze Health Metrics"
5. [ ] See ML prediction card
6. [ ] Prediction shows disease name
7. [ ] Confidence score displayed
8. [ ] Recommendations visible
9. [ ] No console errors
10. [ ] Data saved to MongoDB

### Backup: Fallback Test
1. [ ] Stop ML service
2. [ ] Try to analyze vitals
3. [ ] System either:
   - [ ] Shows error gracefully, OR
   - [ ] Uses rule-based fallback
4. [ ] Restart ML service
5. [ ] ML predictions work again

---

## ✅ Sign-Off

- [ ] All checklist items completed
- [ ] No critical errors
- [ ] ML model integration working
- [ ] Frontend displays predictions
- [ ] APIs responding correctly
- [ ] Documentation complete
- [ ] Ready for production use

**Date Verified:** _______________
**Verified By:** _______________
**Notes:** _______________

---

## 🆘 If Something Fails

1. **Check Logs** - Look at terminal output for errors
2. **Verify Services** - Ensure all 3 services running
3. **Check Ports** - Confirm 5000, 5001, 5173 available
4. **Check Models** - Verify `.pkl` files in `ml_service/`
5. **Check Network** - Try curl endpoints manually
6. **Review Docs** - See `ML_INTEGRATION_GUIDE.md`
7. **Restart Services** - Clean restart often helps

---

**Once all boxes checked: ✅ ML Integration Verified!**
