from flask import Flask, request, jsonify
from sklearn.linear_model import LogisticRegression
import numpy as np
import pandas as pd
import joblib
import os

app = Flask(__name__)

# Global model and backup data
model = None
backup_data = None

def load_backup_data():
    """Load backup training data from CSV"""
    try:
        backup_path = os.path.join(os.path.dirname(__file__), 'data', 'credit_training_backup.csv')
        return pd.read_csv(backup_path)
    except Exception as e:
        print(f"Failed to load backup data: {e}")
        return None

def initialize_model():
    """Initialize model with backup data or dummy data"""
    global model, backup_data
    
    try:
        backup_data = load_backup_data()
        
        if backup_data is not None:
            X = backup_data[['avgPaymentDelay', 'creditLimitUsage', 'overdueRatio', 'transactionVolume']].values
            y = backup_data['riskLabel'].values
        else:
            # Fallback to dummy data
            X = np.array([
                [5, 0.3, 0.1, 1000], [15, 0.7, 0.4, 500], [8, 0.5, 0.2, 800],
                [3, 0.2, 0.05, 1200], [20, 0.9, 0.6, 300]
            ])
            y = np.array([0, 1, 0, 0, 1])
        
        model = LogisticRegression()
        model.fit(X, y)
        print("Model initialized successfully")
        
    except Exception as e:
        print(f"Model initialization failed: {e}")
        model = None

# Initialize on startup
initialize_model()

def calculate_risk_score(features):
    """Calculate credit risk score from 0-100"""
    try:
        if model is None:
            return fallback_risk_score(features)
        
        probability = model.predict_proba([features])[0][1]
        return min(100, max(0, int(probability * 100)))
    except Exception as e:
        print(f"Model prediction failed: {e}")
        return fallback_risk_score(features)

def fallback_risk_score(features):
    """Fallback scoring when model fails"""
    delay, usage, overdue, volume = features
    score = (delay * 2) + (usage * 50) + (overdue * 100)
    return min(100, max(0, int(score)))

def get_risk_level(score):
    """Convert score to risk level"""
    if score < 30:
        return "Low"
    elif score < 70:
        return "Moderate"
    else:
        return "High"

@app.route('/predict-credit-risk', methods=['POST'])
def predict_credit_risk():
    try:
        data = request.get_json()
        
        if not data:
            raise ValueError("No input data provided")
        
        # Extract features with validation
        features = [
            float(data.get('avgPaymentDelay', 0)),
            float(data.get('creditLimitUsage', 0)),
            float(data.get('overdueRatio', 0)),
            float(data.get('transactionVolume', 0))
        ]
        
        # Calculate risk score with fallback
        risk_score = calculate_risk_score(features)
        risk_level = get_risk_level(risk_score)
        
        return jsonify({
            'success': True,
            'data': {
                'creditRiskScore': risk_score,
                'riskLevel': risk_level,
                'modelStatus': 'active' if model else 'fallback',
                'features': {
                    'avgPaymentDelay': features[0],
                    'creditLimitUsage': features[1],
                    'overdueRatio': features[2],
                    'transactionVolume': features[3]
                }
            }
        })
        
    except Exception as e:
        print(f"Prediction error: {e}")
        return jsonify({
            'success': False,
            'error': str(e),
            'fallback': True
        }), 400

@app.route('/health', methods=['GET'])
def health_check():
    return jsonify({
        'status': 'healthy', 
        'service': 'ai_credit_service',
        'modelStatus': 'active' if model else 'fallback',
        'backupDataLoaded': backup_data is not None
    })

@app.route('/retrain', methods=['POST'])
def retrain_model():
    """Retrain model with backup data"""
    try:
        initialize_model()
        return jsonify({
            'success': True,
            'message': 'Model retrained successfully',
            'modelStatus': 'active' if model else 'failed'
        })
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5001, debug=True)