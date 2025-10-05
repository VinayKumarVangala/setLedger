import pandas as pd
import numpy as np
from datetime import datetime, timedelta
from prophet import Prophet
from statsmodels.tsa.arima.model import ARIMA
import warnings
warnings.filterwarnings('ignore')

class ForecastingService:
    def __init__(self):
        self.min_data_points = 7  # Minimum data points for forecasting
    
    def predict_stock_depletion(self, stock_data, product_info):
        """
        Predict stock depletion date using time-series forecasting
        
        Args:
            stock_data: List of stock movements with dates and quantities
            product_info: Product details including current stock and min stock
            
        Returns:
            dict: Prediction results with depletion date and confidence
        """
        try:
            if len(stock_data) < self.min_data_points:
                return self._simple_linear_prediction(stock_data, product_info)
            
            # Try Prophet first, fallback to ARIMA
            try:
                return self._prophet_forecast(stock_data, product_info)
            except:
                return self._arima_forecast(stock_data, product_info)
                
        except Exception as e:
            return {
                'success': False,
                'error': str(e),
                'depletion_date': None,
                'days_remaining': None,
                'confidence': 0
            }
    
    def _prophet_forecast(self, stock_data, product_info):
        """Prophet-based forecasting"""
        df = self._prepare_data(stock_data)
        
        # Create Prophet model
        model = Prophet(
            daily_seasonality=False,
            weekly_seasonality=True,
            yearly_seasonality=False,
            changepoint_prior_scale=0.05
        )
        
        model.fit(df)
        
        # Forecast next 90 days
        future = model.make_future_dataframe(periods=90)
        forecast = model.predict(future)
        
        return self._calculate_depletion_date(forecast, product_info, 'prophet')
    
    def _arima_forecast(self, stock_data, product_info):
        """ARIMA-based forecasting"""
        df = self._prepare_data(stock_data)
        
        # Auto ARIMA parameters
        model = ARIMA(df['y'], order=(1, 1, 1))
        fitted_model = model.fit()
        
        # Forecast next 90 days
        forecast = fitted_model.forecast(steps=90)
        forecast_df = pd.DataFrame({
            'ds': pd.date_range(start=df['ds'].max() + timedelta(days=1), periods=90),
            'yhat': forecast
        })
        
        return self._calculate_depletion_date(forecast_df, product_info, 'arima')
    
    def _simple_linear_prediction(self, stock_data, product_info):
        """Simple linear regression for limited data"""
        if len(stock_data) < 2:
            return {
                'success': False,
                'error': 'Insufficient data for prediction',
                'depletion_date': None,
                'days_remaining': None,
                'confidence': 0
            }
        
        # Calculate average daily consumption
        df = pd.DataFrame(stock_data)
        df['date'] = pd.to_datetime(df['date'])
        df = df.sort_values('date')
        
        # Calculate daily stock changes
        daily_changes = []
        for i in range(1, len(df)):
            days_diff = (df.iloc[i]['date'] - df.iloc[i-1]['date']).days
            stock_change = df.iloc[i]['balance'] - df.iloc[i-1]['balance']
            if days_diff > 0:
                daily_changes.append(stock_change / days_diff)
        
        if not daily_changes:
            return {
                'success': False,
                'error': 'No valid stock changes found',
                'depletion_date': None,
                'days_remaining': None,
                'confidence': 0
            }
        
        avg_daily_consumption = -np.mean([x for x in daily_changes if x < 0])
        
        if avg_daily_consumption <= 0:
            return {
                'success': True,
                'depletion_date': None,
                'days_remaining': float('inf'),
                'confidence': 0.3,
                'method': 'linear',
                'message': 'Stock is not depleting'
            }
        
        current_stock = product_info.get('current_stock', 0)
        min_stock = product_info.get('min_stock', 0)
        
        days_to_depletion = (current_stock - min_stock) / avg_daily_consumption
        depletion_date = datetime.now() + timedelta(days=max(0, days_to_depletion))
        
        return {
            'success': True,
            'depletion_date': depletion_date.isoformat(),
            'days_remaining': max(0, int(days_to_depletion)),
            'confidence': 0.5,
            'method': 'linear',
            'avg_daily_consumption': avg_daily_consumption
        }
    
    def _prepare_data(self, stock_data):
        """Prepare data for Prophet/ARIMA"""
        df = pd.DataFrame(stock_data)
        df['date'] = pd.to_datetime(df['date'])
        df = df.sort_values('date')
        
        # Rename columns for Prophet
        df = df.rename(columns={'date': 'ds', 'balance': 'y'})
        
        # Fill missing dates
        date_range = pd.date_range(start=df['ds'].min(), end=df['ds'].max(), freq='D')
        df = df.set_index('ds').reindex(date_range).interpolate().reset_index()
        df = df.rename(columns={'index': 'ds'})
        
        return df
    
    def _calculate_depletion_date(self, forecast_df, product_info, method):
        """Calculate depletion date from forecast"""
        current_stock = product_info.get('current_stock', 0)
        min_stock = product_info.get('min_stock', 0)
        
        # Find when stock will hit minimum level
        forecast_df['cumulative_change'] = forecast_df['yhat'].cumsum()
        forecast_df['projected_stock'] = current_stock + forecast_df['cumulative_change']
        
        # Find depletion point
        depletion_point = forecast_df[forecast_df['projected_stock'] <= min_stock]
        
        if depletion_point.empty:
            return {
                'success': True,
                'depletion_date': None,
                'days_remaining': 90,  # Beyond forecast period
                'confidence': 0.7,
                'method': method,
                'message': 'No depletion expected in next 90 days'
            }
        
        depletion_date = depletion_point.iloc[0]['ds']
        days_remaining = (depletion_date - datetime.now()).days
        
        # Calculate confidence based on forecast variance
        confidence = min(0.9, max(0.3, 1 - (forecast_df['yhat'].std() / abs(forecast_df['yhat'].mean()))))
        
        return {
            'success': True,
            'depletion_date': depletion_date.isoformat(),
            'days_remaining': max(0, days_remaining),
            'confidence': round(confidence, 2),
            'method': method,
            'forecast_data': forecast_df[['ds', 'projected_stock']].to_dict('records')[:30]  # First 30 days
        }
    
    def get_stock_insights(self, stock_data, product_info):
        """Get additional stock insights"""
        if len(stock_data) < 2:
            return {'insights': []}
        
        df = pd.DataFrame(stock_data)
        df['date'] = pd.to_datetime(df['date'])
        df = df.sort_values('date')
        
        insights = []
        
        # Trend analysis
        recent_trend = df.tail(7)['balance'].diff().mean()
        if recent_trend < -5:
            insights.append({
                'type': 'warning',
                'message': 'Rapid stock depletion detected in last 7 days'
            })
        elif recent_trend > 5:
            insights.append({
                'type': 'info',
                'message': 'Stock levels increasing recently'
            })
        
        # Seasonality detection
        if len(df) >= 14:
            weekly_pattern = df.groupby(df['date'].dt.dayofweek)['balance'].mean()
            if weekly_pattern.std() > weekly_pattern.mean() * 0.2:
                insights.append({
                    'type': 'info',
                    'message': 'Weekly consumption pattern detected'
                })
        
        # Stock velocity
        if len(df) >= 7:
            velocity = abs(df.tail(7)['balance'].diff().mean())
            insights.append({
                'type': 'metric',
                'message': f'Average daily stock change: {velocity:.1f} units'
            })
        
        return {'insights': insights}