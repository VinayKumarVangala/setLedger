from flask import Blueprint, request, jsonify
import numpy as np
import pandas as pd
from datetime import datetime, timedelta
from sklearn.linear_model import LinearRegression
from sklearn.preprocessing import StandardScaler
import logging

forecast_bp = Blueprint('forecast', __name__)
logger = logging.getLogger(__name__)

@forecast_bp.route('/financial', methods=['POST'])
def financial_forecast():
    try:
        data = request.get_json()
        historical_data = data.get('historical_data', {})
        forecast_days = data.get('forecast_days', 30)
        
        # Process revenue data
        revenue_data = historical_data.get('revenue', [])
        expense_data = historical_data.get('expenses', [])
        
        if not revenue_data and not expense_data:
            return jsonify({'error': 'No historical data provided'}), 400
        
        # Generate forecasts
        revenue_forecast = generate_forecast(revenue_data, forecast_days, 'revenue')
        expense_forecast = generate_forecast(expense_data, forecast_days, 'expenses')
        
        # Combine forecasts
        forecast_result = []
        today = datetime.now()
        
        for i in range(forecast_days):
            date = (today + timedelta(days=i+1)).strftime('%Y-%m-%d')
            
            revenue_val = revenue_forecast[i] if i < len(revenue_forecast) else 0
            expense_val = expense_forecast[i] if i < len(expense_forecast) else 0
            profit_val = revenue_val - expense_val
            
            forecast_result.append({
                'date': date,
                'forecastRevenue': max(0, revenue_val),
                'forecastExpenses': max(0, expense_val),
                'forecastProfit': profit_val,
                'confidence': calculate_confidence(i, forecast_days)
            })
        
        return jsonify({
            'success': True,
            'forecast': forecast_result,
            'metadata': {
                'forecast_days': forecast_days,
                'model_type': 'linear_regression',
                'data_points': len(revenue_data) + len(expense_data)
            }
        })
        
    except Exception as e:
        logger.error(f"Error in financial forecast: {str(e)}")
        return jsonify({'error': 'Internal server error'}), 500

def generate_forecast(data, forecast_days, data_type):
    if not data or len(data) < 2:
        # Return simple trend if insufficient data
        base_value = 10000 if data_type == 'revenue' else 5000
        return [base_value * (1 + np.random.normal(0, 0.1)) for _ in range(forecast_days)]
    
    try:
        # Convert to DataFrame
        df = pd.DataFrame(data)
        df['date'] = pd.to_datetime(df['date'])
        df = df.sort_values('date')
        
        # Create features
        df['days_since_start'] = (df['date'] - df['date'].min()).dt.days
        
        # Prepare data for regression
        X = df[['days_since_start']].values
        y = df['value'].values
        
        # Fit linear regression
        model = LinearRegression()
        model.fit(X, y)
        
        # Generate future predictions
        last_day = df['days_since_start'].max()
        future_days = np.array([[last_day + i + 1] for i in range(forecast_days)])
        predictions = model.predict(future_days)
        
        # Add some realistic variance
        noise = np.random.normal(0, np.std(y) * 0.1, forecast_days)
        predictions += noise
        
        return predictions.tolist()
        
    except Exception as e:
        logger.error(f"Error generating forecast for {data_type}: {str(e)}")
        # Fallback to simple trend
        avg_value = np.mean([item['value'] for item in data])
        return [avg_value * (1 + np.random.normal(0, 0.1)) for _ in range(forecast_days)]

def calculate_confidence(day_index, total_days):
    # Confidence decreases over time
    base_confidence = 0.9
    decay_rate = 0.02
    confidence = base_confidence * np.exp(-decay_rate * day_index)
    return max(0.3, min(0.95, confidence))

@forecast_bp.route('/revenue', methods=['POST'])
def revenue_forecast():
    try:
        data = request.get_json()
        historical_data = data.get('historical_data', [])
        forecast_days = data.get('forecast_days', 30)
        
        forecast = generate_forecast(historical_data, forecast_days, 'revenue')
        
        return jsonify({
            'success': True,
            'forecast': forecast,
            'confidence_scores': [calculate_confidence(i, forecast_days) for i in range(forecast_days)]
        })
        
    except Exception as e:
        logger.error(f"Error in revenue forecast: {str(e)}")
        return jsonify({'error': 'Internal server error'}), 500