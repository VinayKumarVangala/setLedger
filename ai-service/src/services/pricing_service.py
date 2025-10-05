import pandas as pd
import numpy as np
from sklearn.ensemble import RandomForestRegressor
from sklearn.linear_model import LinearRegression
from sklearn.preprocessing import StandardScaler
from datetime import datetime, timedelta
import requests
from bs4 import BeautifulSoup
import re
import warnings
warnings.filterwarnings('ignore')

class PricingService:
    def __init__(self):
        self.model = None
        self.scaler = StandardScaler()
        self.min_data_points = 10
        
    def calculate_optimal_price(self, product_data, sales_history, competitor_prices=None):
        """
        Calculate optimal price using AI regression models
        
        Args:
            product_data: Product information (cost, current price, etc.)
            sales_history: Historical sales data
            competitor_prices: Scraped competitor pricing data
            
        Returns:
            dict: Pricing recommendations with confidence
        """
        try:
            if len(sales_history) < self.min_data_points:
                return self._simple_pricing_model(product_data, sales_history)
            
            # Prepare features for ML model
            features_df = self._prepare_features(product_data, sales_history, competitor_prices)
            
            if features_df.empty:
                return self._simple_pricing_model(product_data, sales_history)
            
            # Train and predict
            optimal_price = self._ml_pricing_model(features_df, sales_history)
            
            # Calculate demand elasticity
            elasticity = self._calculate_demand_elasticity(sales_history)
            
            # Generate pricing recommendations
            return self._generate_pricing_recommendations(
                product_data, optimal_price, elasticity, competitor_prices
            )
            
        except Exception as e:
            return {
                'success': False,
                'error': str(e),
                'current_price': product_data.get('current_price', 0),
                'recommended_price': product_data.get('current_price', 0)
            }
    
    def _prepare_features(self, product_data, sales_history, competitor_prices):
        """Prepare feature matrix for ML model"""
        df = pd.DataFrame(sales_history)
        df['date'] = pd.to_datetime(df['date'])
        df = df.sort_values('date')
        
        # Create features
        features = []
        for i in range(len(df)):
            row = df.iloc[i]
            
            # Base features
            feature_row = {
                'price': row.get('unit_price', 0),
                'quantity_sold': row.get('quantity', 0),
                'cost_price': product_data.get('cost_price', 0),
                'day_of_week': row['date'].dayofweek,
                'month': row['date'].month,
                'is_weekend': 1 if row['date'].dayofweek >= 5 else 0
            }
            
            # Historical averages (last 7 days)
            if i >= 7:
                recent_data = df.iloc[i-7:i]
                feature_row.update({
                    'avg_price_7d': recent_data['unit_price'].mean() if 'unit_price' in recent_data else 0,
                    'avg_quantity_7d': recent_data['quantity'].mean() if 'quantity' in recent_data else 0,
                    'price_trend_7d': (recent_data['unit_price'].iloc[-1] - recent_data['unit_price'].iloc[0]) if len(recent_data) > 1 else 0
                })
            else:
                feature_row.update({
                    'avg_price_7d': feature_row['price'],
                    'avg_quantity_7d': feature_row['quantity_sold'],
                    'price_trend_7d': 0
                })
            
            # Competitor pricing features
            if competitor_prices:
                feature_row.update({
                    'min_competitor_price': min([p['price'] for p in competitor_prices]),
                    'max_competitor_price': max([p['price'] for p in competitor_prices]),
                    'avg_competitor_price': np.mean([p['price'] for p in competitor_prices]),
                    'price_vs_competitors': feature_row['price'] - np.mean([p['price'] for p in competitor_prices])
                })
            else:
                feature_row.update({
                    'min_competitor_price': feature_row['price'],
                    'max_competitor_price': feature_row['price'],
                    'avg_competitor_price': feature_row['price'],
                    'price_vs_competitors': 0
                })
            
            # Revenue and margin
            feature_row['revenue'] = feature_row['price'] * feature_row['quantity_sold']
            feature_row['margin'] = feature_row['price'] - feature_row['cost_price']
            feature_row['margin_percent'] = (feature_row['margin'] / feature_row['price']) * 100 if feature_row['price'] > 0 else 0
            
            features.append(feature_row)
        
        return pd.DataFrame(features)
    
    def _ml_pricing_model(self, features_df, sales_history):
        """Train ML model and predict optimal price"""
        # Prepare target variable (revenue per unit)
        y = features_df['revenue'] / (features_df['quantity_sold'] + 1)  # Avoid division by zero
        
        # Select features for training
        feature_cols = [
            'cost_price', 'day_of_week', 'month', 'is_weekend',
            'avg_price_7d', 'avg_quantity_7d', 'price_trend_7d',
            'min_competitor_price', 'max_competitor_price', 'avg_competitor_price'
        ]
        
        X = features_df[feature_cols].fillna(0)
        
        # Scale features
        X_scaled = self.scaler.fit_transform(X)
        
        # Train Random Forest model
        self.model = RandomForestRegressor(n_estimators=50, random_state=42)
        self.model.fit(X_scaled, y)
        
        # Predict optimal price using current market conditions
        current_features = X.iloc[-1:].values
        current_features_scaled = self.scaler.transform(current_features)
        
        predicted_revenue_per_unit = self.model.predict(current_features_scaled)[0]
        
        # Estimate optimal price based on demand curve
        current_price = features_df['price'].iloc[-1]
        current_quantity = features_df['quantity_sold'].iloc[-1]
        
        if current_quantity > 0:
            # Simple optimization: adjust price to maximize revenue
            price_multipliers = np.arange(0.8, 1.3, 0.05)  # Test prices from 80% to 130%
            best_price = current_price
            best_revenue = 0
            
            for multiplier in price_multipliers:
                test_price = current_price * multiplier
                estimated_quantity = self._estimate_quantity_at_price(
                    test_price, features_df['price'].values, features_df['quantity_sold'].values
                )
                estimated_revenue = test_price * estimated_quantity
                
                if estimated_revenue > best_revenue:
                    best_revenue = estimated_revenue
                    best_price = test_price
            
            return best_price
        
        return current_price
    
    def _estimate_quantity_at_price(self, price, historical_prices, historical_quantities):
        """Estimate quantity demand at given price using linear regression"""
        if len(historical_prices) < 3:
            return np.mean(historical_quantities) if len(historical_quantities) > 0 else 1
        
        # Simple linear demand model
        valid_data = [(p, q) for p, q in zip(historical_prices, historical_quantities) if p > 0 and q > 0]
        
        if len(valid_data) < 3:
            return np.mean(historical_quantities)
        
        prices, quantities = zip(*valid_data)
        
        # Fit linear regression: quantity = a * price + b
        X = np.array(prices).reshape(-1, 1)
        y = np.array(quantities)
        
        model = LinearRegression()
        model.fit(X, y)
        
        predicted_quantity = model.predict([[price]])[0]
        return max(0, predicted_quantity)  # Ensure non-negative quantity
    
    def _calculate_demand_elasticity(self, sales_history):
        """Calculate price elasticity of demand"""
        df = pd.DataFrame(sales_history)
        
        if len(df) < 5:
            return -1.0  # Default elasticity
        
        df = df.sort_values('date')
        
        # Calculate percentage changes
        df['price_change'] = df['unit_price'].pct_change()
        df['quantity_change'] = df['quantity'].pct_change()
        
        # Remove invalid data
        valid_data = df.dropna()
        valid_data = valid_data[
            (valid_data['price_change'] != 0) & 
            (abs(valid_data['price_change']) < 0.5) &  # Remove extreme changes
            (abs(valid_data['quantity_change']) < 2.0)
        ]
        
        if len(valid_data) < 3:
            return -1.0
        
        # Elasticity = % change in quantity / % change in price
        elasticity = (valid_data['quantity_change'] / valid_data['price_change']).mean()
        
        # Clamp elasticity to reasonable range
        return max(-5.0, min(0, elasticity))
    
    def _simple_pricing_model(self, product_data, sales_history):
        """Simple pricing model for limited data"""
        current_price = product_data.get('current_price', 0)
        cost_price = product_data.get('cost_price', 0)
        
        if len(sales_history) == 0:
            # Cost-plus pricing with 30% margin
            recommended_price = cost_price * 1.3
        else:
            # Average recent performance
            recent_sales = sales_history[-5:] if len(sales_history) >= 5 else sales_history
            avg_quantity = np.mean([s.get('quantity', 0) for s in recent_sales])
            
            if avg_quantity < 2:  # Low sales, reduce price
                recommended_price = current_price * 0.95
            elif avg_quantity > 10:  # High sales, increase price
                recommended_price = current_price * 1.05
            else:
                recommended_price = current_price
        
        return {
            'success': True,
            'current_price': current_price,
            'recommended_price': round(recommended_price, 2),
            'confidence': 0.3,
            'method': 'simple',
            'elasticity': -1.0,
            'factors': {
                'cost_price': cost_price,
                'margin_percent': ((recommended_price - cost_price) / recommended_price * 100) if recommended_price > 0 else 0
            }
        }
    
    def _generate_pricing_recommendations(self, product_data, optimal_price, elasticity, competitor_prices):
        """Generate comprehensive pricing recommendations"""
        current_price = product_data.get('current_price', 0)
        cost_price = product_data.get('cost_price', 0)
        
        # Price bounds
        min_price = cost_price * 1.1  # Minimum 10% margin
        max_price = current_price * 1.5  # Maximum 50% increase
        
        # Clamp optimal price to bounds
        recommended_price = max(min_price, min(max_price, optimal_price))
        
        # Calculate confidence based on data quality
        confidence = 0.7 if len(competitor_prices or []) > 0 else 0.5
        
        # Pricing strategies
        strategies = []
        
        if competitor_prices:
            avg_competitor_price = np.mean([p['price'] for p in competitor_prices])
            min_competitor_price = min([p['price'] for p in competitor_prices])
            
            if recommended_price < min_competitor_price:
                strategies.append({
                    'name': 'Competitive Advantage',
                    'price': min_competitor_price * 0.95,
                    'description': 'Price below lowest competitor'
                })
            
            strategies.append({
                'name': 'Market Average',
                'price': avg_competitor_price,
                'description': 'Match market average'
            })
        
        strategies.extend([
            {
                'name': 'Cost Plus 20%',
                'price': cost_price * 1.2,
                'description': 'Safe margin pricing'
            },
            {
                'name': 'Premium Positioning',
                'price': recommended_price * 1.1,
                'description': 'Higher margin strategy'
            }
        ])
        
        return {
            'success': True,
            'current_price': current_price,
            'recommended_price': round(recommended_price, 2),
            'confidence': confidence,
            'method': 'ml_regression',
            'elasticity': round(elasticity, 2),
            'factors': {
                'cost_price': cost_price,
                'margin_percent': ((recommended_price - cost_price) / recommended_price * 100) if recommended_price > 0 else 0,
                'competitor_count': len(competitor_prices or []),
                'avg_competitor_price': np.mean([p['price'] for p in competitor_prices]) if competitor_prices else None
            },
            'strategies': strategies[:4],  # Limit to 4 strategies
            'price_bounds': {
                'min_price': round(min_price, 2),
                'max_price': round(max_price, 2)
            }
        }

class CompetitorScraper:
    def __init__(self):
        self.headers = {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        }
        
    def scrape_competitor_prices(self, product_name, product_sku=None):
        """Scrape competitor prices from various sources"""
        competitors = []
        
        try:
            # Amazon-like scraping (mock implementation)
            amazon_price = self._scrape_amazon(product_name)
            if amazon_price:
                competitors.append({
                    'source': 'Amazon',
                    'price': amazon_price,
                    'url': f'https://amazon.com/search?k={product_name.replace(" ", "+")}'
                })
            
            # Generic e-commerce scraping
            generic_prices = self._scrape_generic_sites(product_name)
            competitors.extend(generic_prices)
            
        except Exception as e:
            print(f"Scraping error: {e}")
        
        return competitors
    
    def _scrape_amazon(self, product_name):
        """Mock Amazon price scraping (replace with actual implementation)"""
        try:
            # In production, use actual Amazon API or scraping
            # This is a mock implementation
            base_price = hash(product_name) % 1000 + 100
            return float(base_price)
        except:
            return None
    
    def _scrape_generic_sites(self, product_name):
        """Mock generic site scraping"""
        # Mock competitor data
        mock_competitors = [
            {'source': 'Competitor A', 'price': hash(product_name + 'A') % 500 + 50},
            {'source': 'Competitor B', 'price': hash(product_name + 'B') % 800 + 80},
            {'source': 'Competitor C', 'price': hash(product_name + 'C') % 600 + 60}
        ]
        
        return [
            {
                'source': comp['source'],
                'price': float(comp['price']),
                'url': f'https://{comp["source"].lower().replace(" ", "")}.com'
            }
            for comp in mock_competitors
        ]