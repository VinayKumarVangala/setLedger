from flask import Flask, request, jsonify
import json
import os

app = Flask(__name__)

@app.route('/health', methods=['GET'])
def health():
    return jsonify({
        'status': 'healthy',
        'service': 'AI Credit Risk Service',
        'version': '1.0.0'
    })

@app.route('/predict/credit-risk', methods=['POST'])
def predict_credit_risk():
    try:
        data = request.get_json()
        
        # Simple credit risk calculation
        metrics = data.get('metrics', {})
        avg_payment_delay = metrics.get('avgPaymentDelay', 0)
        credit_limit_usage = metrics.get('creditLimitUsage', 0)
        overdue_ratio = metrics.get('overdueRatio', 0)
        transaction_volume = metrics.get('transactionVolume', 0)
        
        # Calculate risk score
        score = 50  # Base score
        
        # Payment delay impact
        if avg_payment_delay <= 5:
            score += 20
        elif avg_payment_delay <= 15:
            score += 10
        elif avg_payment_delay <= 30:
            score -= 10
        else:
            score -= 20
            
        # Credit usage impact
        if credit_limit_usage <= 0.3:
            score += 15
        elif credit_limit_usage <= 0.7:
            score += 5
        elif credit_limit_usage <= 0.9:
            score -= 10
        else:
            score -= 15
            
        # Overdue ratio impact
        if overdue_ratio <= 0.1:
            score += 10
        elif overdue_ratio <= 0.3:
            score += 0
        else:
            score -= 15
            
        # Transaction volume impact
        if transaction_volume >= 10:
            score += 5
        elif transaction_volume >= 5:
            score += 2
            
        # Normalize score
        score = max(0, min(100, score))
        
        # Determine risk level
        if score >= 70:
            risk_level = 'low'
        elif score >= 40:
            risk_level = 'moderate'
        else:
            risk_level = 'high'
            
        return jsonify({
            'success': True,
            'data': {
                'creditRiskScore': round(score),
                'riskLevel': risk_level,
                'confidence': 0.85,
                'source': 'ai_service'
            }
        })
        
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

if __name__ == '__main__':
    port = int(os.environ.get('PORT', 5001))
    print(f'🤖 AI Service starting on port {port}')
    print(f'📍 Health check: http://localhost:{port}/health')
    app.run(host='127.0.0.1', port=port, debug=True)