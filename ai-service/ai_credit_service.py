from flask import Flask, request, jsonify
from sklearn.linear_model import LogisticRegression
import numpy as np
import joblib
import os

app = Flask(__name__)

# Pre-trained model (in production, load from file)
model = LogisticRegression()
# Dummy training data for demonstration
X_train = np.array([
    [5, 0.3, 0.1, 1000],   # Low risk
    [15, 0.7, 0.4, 500],   # High risk
    [8, 0.5, 0.2, 800],    # Moderate risk
    [3, 0.2, 0.05, 1200],  # Low risk
    [20, 0.9, 0.6, 300]    # High risk
])
y_train = np.array([0, 1, 0, 0, 1])  # 0: Low risk, 1: High risk
model.fit(X_train, y_train)

def calculate_risk_score(features):
    """Calculate credit risk score from 0-100"""
    probability = model.predict_proba([features])[0][1]  # Probability of high risk
    return min(100, max(0, int(probability * 100)))

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
        
        # Extract features
        features = [
            data.get('avgPaymentDelay', 0),
            data.get('creditLimitUsage', 0),
            data.get('overdueRatio', 0),
            data.get('transactionVolume', 0)
        ]
        
        # Calculate risk score
        risk_score = calculate_risk_score(features)
        risk_level = get_risk_level(risk_score)
        
        return jsonify({
            'success': True,
            'data': {
                'creditRiskScore': risk_score,
                'riskLevel': risk_level,
                'features': {
                    'avgPaymentDelay': features[0],
                    'creditLimitUsage': features[1],
                    'overdueRatio': features[2],
                    'transactionVolume': features[3]
                }
            }
        })
        
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 400

@app.route('/health', methods=['GET'])
def health_check():
    return jsonify({'status': 'healthy', 'service': 'ai_credit_service'})

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5001, debug=True)