from flask import Blueprint, request, jsonify
from ..services.forecasting_service import ForecastingService
from ..services.data_service import DataService

prediction_bp = Blueprint('prediction', __name__)
forecasting_service = ForecastingService()
data_service = DataService()

@prediction_bp.route('/predict/stock-depletion', methods=['POST'])
def predict_stock_depletion():
    """Predict stock depletion for a specific product"""
    try:
        data = request.get_json()
        org_id = data.get('org_id')
        product_id = data.get('product_id')
        
        if not org_id or not product_id:
            return jsonify({
                'success': False,
                'error': 'org_id and product_id are required'
            }), 400
        
        # Get stock movement data
        stock_data = data_service.get_stock_data(org_id, product_id)
        product_info = data_service.get_product_info(org_id, product_id)
        
        if not product_info:
            return jsonify({
                'success': False,
                'error': 'Product not found'
            }), 404
        
        # Generate prediction
        prediction = forecasting_service.predict_stock_depletion(stock_data, product_info)
        
        # Get additional insights
        insights = forecasting_service.get_stock_insights(stock_data, product_info)
        
        return jsonify({
            'success': True,
            'data': {
                'product_id': product_id,
                'product_name': product_info.get('name', ''),
                'current_stock': product_info.get('current_stock', 0),
                'min_stock': product_info.get('min_stock', 0),
                'prediction': prediction,
                'insights': insights.get('insights', [])
            }
        })
        
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@prediction_bp.route('/predict/bulk-depletion', methods=['POST'])
def predict_bulk_depletion():
    """Predict stock depletion for multiple products"""
    try:
        data = request.get_json()
        org_id = data.get('org_id')
        product_ids = data.get('product_ids', [])
        
        if not org_id:
            return jsonify({
                'success': False,
                'error': 'org_id is required'
            }), 400
        
        # If no specific products, get all products for org
        if not product_ids:
            products = data_service.get_all_products_for_org(org_id)
            product_ids = [p['product_id'] for p in products]
        
        predictions = []
        
        for product_id in product_ids[:20]:  # Limit to 20 products
            try:
                stock_data = data_service.get_stock_data(org_id, product_id)
                product_info = data_service.get_product_info(org_id, product_id)
                
                if product_info:
                    prediction = forecasting_service.predict_stock_depletion(stock_data, product_info)
                    
                    predictions.append({
                        'product_id': product_id,
                        'product_name': product_info.get('name', ''),
                        'current_stock': product_info.get('current_stock', 0),
                        'min_stock': product_info.get('min_stock', 0),
                        'depletion_date': prediction.get('depletion_date'),
                        'days_remaining': prediction.get('days_remaining'),
                        'confidence': prediction.get('confidence', 0),
                        'method': prediction.get('method', 'unknown')
                    })
                    
            except Exception as e:
                print(f"Error predicting for product {product_id}: {e}")
                continue
        
        # Sort by days remaining (ascending)
        predictions.sort(key=lambda x: x['days_remaining'] if x['days_remaining'] is not None else float('inf'))
        
        return jsonify({
            'success': True,
            'data': {
                'org_id': org_id,
                'total_products': len(predictions),
                'predictions': predictions
            }
        })
        
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@prediction_bp.route('/insights/stock-trends', methods=['POST'])
def get_stock_trends():
    """Get stock trend insights for dashboard"""
    try:
        data = request.get_json()
        org_id = data.get('org_id')
        
        if not org_id:
            return jsonify({
                'success': False,
                'error': 'org_id is required'
            }), 400
        
        products = data_service.get_all_products_for_org(org_id)
        
        trends = {
            'critical_stock': [],  # < 7 days
            'low_stock': [],       # 7-30 days
            'healthy_stock': [],   # > 30 days
            'no_data': []          # Insufficient data
        }
        
        for product in products[:50]:  # Limit to 50 products
            try:
                stock_data = data_service.get_stock_data(org_id, product['product_id'])
                prediction = forecasting_service.predict_stock_depletion(stock_data, product)
                
                days_remaining = prediction.get('days_remaining')
                
                if days_remaining is None or not prediction.get('success'):
                    trends['no_data'].append({
                        'product_id': product['product_id'],
                        'name': product['name'],
                        'current_stock': product['current_stock']
                    })
                elif days_remaining < 7:
                    trends['critical_stock'].append({
                        'product_id': product['product_id'],
                        'name': product['name'],
                        'days_remaining': days_remaining,
                        'current_stock': product['current_stock']
                    })
                elif days_remaining <= 30:
                    trends['low_stock'].append({
                        'product_id': product['product_id'],
                        'name': product['name'],
                        'days_remaining': days_remaining,
                        'current_stock': product['current_stock']
                    })
                else:
                    trends['healthy_stock'].append({
                        'product_id': product['product_id'],
                        'name': product['name'],
                        'days_remaining': min(days_remaining, 90),  # Cap at 90 days
                        'current_stock': product['current_stock']
                    })
                    
            except Exception as e:
                print(f"Error analyzing product {product['product_id']}: {e}")
                continue
        
        return jsonify({
            'success': True,
            'data': {
                'org_id': org_id,
                'summary': {
                    'critical_count': len(trends['critical_stock']),
                    'low_count': len(trends['low_stock']),
                    'healthy_count': len(trends['healthy_stock']),
                    'no_data_count': len(trends['no_data'])
                },
                'trends': trends
            }
        })
        
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@prediction_bp.route('/health', methods=['GET'])
def health_check():
    """Health check endpoint"""
    return jsonify({
        'success': True,
        'service': 'AI Forecasting Service',
        'status': 'healthy',
        'version': '1.0.0'
    })