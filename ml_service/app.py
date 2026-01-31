"""
ML Service for Disease Prediction from Vitals
Loads pre-trained Random Forest model and provides REST API endpoints
"""

from flask import Flask, request, jsonify
from flask_cors import CORS
import joblib
import numpy as np
import pandas as pd
import logging
from pathlib import Path

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = Flask(__name__)
CORS(app)

# Load ML models
model_dir = Path(__file__).parent.parent / "ML model"

try:
    model = joblib.load(model_dir / "vitals_random_forest_model.pkl")
    scaler = joblib.load(model_dir / "vitals_feature_scaler.pkl")
    encoder = joblib.load(model_dir / "vitals_label_encoder.pkl")
    
    logger.info("✓ ML models loaded successfully")
except Exception as e:
    logger.error(f"✗ Failed to load ML models: {str(e)}")
    model = None
    scaler = None
    encoder = None


@app.route("/health", methods=["GET"])
def health():
    """Health check endpoint"""
    return jsonify({
        "status": "ok",
        "models_loaded": all([model, scaler, encoder])
    }), 200


@app.route("/api/predict", methods=["POST"])
def predict_disease():
    """
    Predict disease from vitals data
    
    Expected JSON body:
    {
        "blood_pressure_systolic": float,
        "blood_pressure_diastolic": float,
        "heart_rate": float,
        "temperature": float,
        "respiratory_rate": float (optional)
    }
    
    Returns:
    {
        "disease": str,
        "confidence": float,
        "probability_distribution": dict,
        "risk_level": str,
        "recommendations": list
    }
    """
    try:
        if not all([model, scaler, encoder]):
            return jsonify({
                "error": "ML models not loaded"
            }), 503

        data = request.get_json()

        # Validate required fields
        required_fields = [
            "blood_pressure_systolic",
            "blood_pressure_diastolic",
            "heart_rate",
            "temperature",
            "spo2"  # Blood oxygen level
        ]

        for field in required_fields:
            if field not in data or data[field] is None:
                return jsonify({
                    "error": f"Missing or invalid field: {field}"
                }), 400

        # Extract features using DataFrame with proper column names
        # The model expects: Heart Rate, SpO2, Systolic BP, Diastolic BP, Temperature, and SpO2 Alert categorical feature
        features_df = pd.DataFrame([{
            'Heart Rate (bpm)': float(data["heart_rate"]),
            'SpO2 Level (%)': float(data["spo2"]),
            'Systolic Blood Pressure (mmHg)': float(data["blood_pressure_systolic"]),
            'Diastolic Blood Pressure (mmHg)': float(data["blood_pressure_diastolic"]),
            'Body Temperature (°C)': float(data["temperature"]),
            'SpO2 Level Alert_NORMAL': 1  # Default alert status (categorical feature from one-hot encoding)
        }])

        # Scale features
        scaled_features = scaler.transform(features_df)

        # Get prediction
        prediction = model.predict(scaled_features)[0]
        probabilities = model.predict_proba(scaled_features)[0]

        # Get disease name
        disease = encoder.inverse_transform([prediction])[0]

        # Get confidence (max probability)
        confidence = float(np.max(probabilities))

        # Get all probabilities
        all_diseases = encoder.classes_
        probability_dist = {
            disease_name: float(prob)
            for disease_name, prob in zip(all_diseases, probabilities)
        }

        # Determine risk level based on confidence
        if confidence >= 0.95:
            risk_level = "high"
        elif confidence >= 0.85:
            risk_level = "medium"
        else:
            risk_level = "low"

        # Generate recommendations based on prediction
        recommendations = get_recommendations(disease, data)

        return jsonify({
            "disease": disease,
            "confidence": confidence,
            "probability_distribution": probability_dist,
            "risk_level": risk_level,
            "recommendations": recommendations,
            "input_vitals": {
                "blood_pressure": f"{data['blood_pressure_systolic']}/{data['blood_pressure_diastolic']}",
                "heart_rate": data["heart_rate"],
                "spo2": data["spo2"],
                "temperature": data["temperature"]
            }
        }), 200

    except Exception as e:
        logger.error(f"Prediction error: {str(e)}")
        return jsonify({
            "error": str(e)
        }), 500


@app.route("/api/batch-predict", methods=["POST"])
def batch_predict():
    """
    Predict disease for multiple vital records
    
    Expected JSON body:
    {
        "records": [
            {
                "blood_pressure_systolic": float,
                "blood_pressure_diastolic": float,
                "heart_rate": float,
                "temperature": float
            },
            ...
        ]
    }
    
    Returns:
    {
        "predictions": [
            {
                "disease": str,
                "confidence": float,
                "risk_level": str
            },
            ...
        ],
        "summary": {
            "most_common_disease": str,
            "average_confidence": float
        }
    }
    """
    try:
        if not all([model, scaler, encoder]):
            return jsonify({
                "error": "ML models not loaded"
            }), 503

        data = request.get_json()

        if "records" not in data or not isinstance(data["records"], list):
            return jsonify({
                "error": "Invalid input: 'records' must be a list"
            }), 400

        predictions = []
        confidences = []
        diseases = []

        for record in data["records"]:
            try:
                # Extract features using DataFrame with proper column names
                features_df = pd.DataFrame([{
                    'Heart Rate (bpm)': float(record.get("heart_rate", 80)),
                    'SpO2 Level (%)': float(record.get("spo2", 98)),
                    'Systolic Blood Pressure (mmHg)': float(record["blood_pressure_systolic"]),
                    'Diastolic Blood Pressure (mmHg)': float(record["blood_pressure_diastolic"]),
                    'Body Temperature (°C)': float(record["temperature"]),
                    'SpO2 Level Alert_NORMAL': 1
                }])

                # Scale and predict
                scaled_features = scaler.transform(features_df)
                prediction = model.predict(scaled_features)[0]
                probabilities = model.predict_proba(scaled_features)[0]

                disease = encoder.inverse_transform([prediction])[0]
                confidence = float(np.max(probabilities))

                if confidence >= 0.95:
                    risk_level = "high"
                elif confidence >= 0.85:
                    risk_level = "medium"
                else:
                    risk_level = "low"

                predictions.append({
                    "disease": disease,
                    "confidence": confidence,
                    "risk_level": risk_level
                })

                confidences.append(confidence)
                diseases.append(disease)

            except Exception as e:
                logger.error(f"Error predicting for record: {str(e)}")
                predictions.append({
                    "error": str(e)
                })

        # Calculate summary
        from collections import Counter
        disease_counts = Counter(diseases)
        most_common_disease = disease_counts.most_common(1)[0][0] if disease_counts else "Unknown"
        avg_confidence = sum(confidences) / len(confidences) if confidences else 0

        return jsonify({
            "predictions": predictions,
            "summary": {
                "most_common_disease": most_common_disease,
                "average_confidence": avg_confidence,
                "total_records": len(predictions)
            }
        }), 200

    except Exception as e:
        logger.error(f"Batch prediction error: {str(e)}")
        return jsonify({
            "error": str(e)
        }), 500


def get_recommendations(disease, vitals):
    """Generate health recommendations based on disease prediction"""
    recommendations = {
        "Asthma": [
            "Use prescribed inhalers regularly",
            "Avoid respiratory irritants and allergens",
            "Monitor heart rate for exertion",
            "Consider pulmonary function tests",
            "Consult pulmonologist for management plan"
        ],
        "Diabetes Mellitus": [
            "Monitor blood glucose levels regularly",
            "Maintain balanced diet with controlled carbohydrates",
            "Exercise regularly (150 min/week)",
            "Check blood pressure regularly",
            "Schedule HbA1c test (every 3 months)"
        ],
        "Healthy": [
            "Maintain current healthy lifestyle",
            "Continue regular exercise (at least 150 min/week)",
            "Monitor vitals monthly",
            "Eat balanced diet rich in fruits and vegetables",
            "Get 7-9 hours of sleep daily"
        ],
        "Heart Disease": [
            "Monitor heart rate and blood pressure daily",
            "Reduce sodium intake",
            "Avoid stressful situations",
            "Take prescribed cardiac medications",
            "Schedule regular cardiology checkups"
        ],
        "Hypertension": [
            "Reduce sodium intake to <2300mg/day",
            "Increase physical activity (150 min/week)",
            "Manage stress through meditation/yoga",
            "Limit alcohol consumption",
            "Monitor BP daily, schedule doctor visit"
        ]
    }

    return recommendations.get(disease, [
        "Consult with healthcare provider",
        "Monitor vitals regularly",
        "Maintain healthy lifestyle"
    ])


if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5001, debug=False)
