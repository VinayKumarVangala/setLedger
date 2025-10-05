from flask import Blueprint, request, jsonify
from ..services.pricing_service import PricingService, CompetitorScraper
from ..services.data_service import DataService

pricing_bp = Blueprint('pricing', __name__)
pricing_service = PricingService()
competitor_scraper = CompetitorScraper()
data_service = DataService()

@pricing_bp.route('/pricing/optimize', methods=['POST'])
def optimize_pricing():
    """Calculate optimal pricing for a product"""
    try:
        data = request.get_json()
        org_id = data.get('org_id')
        product_id = data.get('product_id')
        include_competitors = data.get('include_competitors', True)
        
        if not org_id or not product_id:
            return jsonify({
                'success': False,
                'error': 'org_id and product_id are required'
            }), 400
        
        # Get product information
        product_info = data_service.get_product_info(org_id, product_id)
        if not product_info:
            return jsonify({
                'success': False,
                'error': 'Product not found'
            }), 404
        
        # Get sales history
        sales_history = data_service.get_sales_history(org_id, product_id)
        
        # Scrape competitor prices if requested
        competitor_prices = None
        if include_competitors:
            try:
                competitor_prices = competitor_scraper.scrape_competitor_prices(
                    product_info.get('name', ''),
                    product_info.get('sku', '')
                )
            except Exception as e:
                print(f"Competitor scraping failed: {e}")
        
        # Calculate optimal pricing
        pricing_result = pricing_service.calculate_optimal_price(
            product_info, sales_history, competitor_prices
        )
        
        return jsonify({
            'success': True,
            'data': {
                'product_id': product_id,
                'product_name': product_info.get('name', ''),
                'pricing': pricing_result,
                'competitor_prices': competitor_prices or [],
                'sales_data_points': len(sales_history)
            }
        })
        
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@pricing_bp.route('/pricing/bulk-optimize', methods=['POST'])
def bulk_optimize_pricing():
    """Optimize pricing for multiple products"""
    try:
        data = request.get_json()
        org_id = data.get('org_id')
        product_ids = data.get('product_ids', [])
        include_competitors = data.get('include_competitors', False)  # Disabled by default for bulk
        
        if not org_id:
            return jsonify({
                'success': False,
                'error': 'org_id is required'
            }), 400
        
        # If no specific products, get all products for org
        if not product_ids:
            products = data_service.get_all_products_for_org(org_id)
            product_ids = [p['product_id'] for p in products]
        
        pricing_results = []
        
        for product_id in product_ids[:20]:  # Limit to 20 products
            try:
                product_info = data_service.get_product_info(org_id, product_id)
                if not product_info:
                    continue
                
                sales_history = data_service.get_sales_history(org_id, product_id)
                
                # Skip competitor scraping for bulk to avoid rate limits
                competitor_prices = None
                
                pricing_result = pricing_service.calculate_optimal_price(
                    product_info, sales_history, competitor_prices
                )
                
                if pricing_result.get('success'):
                    pricing_results.append({
                        'product_id': product_id,
                        'product_name': product_info.get('name', ''),
                        'current_price': pricing_result.get('current_price', 0),
                        'recommended_price': pricing_result.get('recommended_price', 0),
                        'price_change': pricing_result.get('recommended_price', 0) - pricing_result.get('current_price', 0),
                        'price_change_percent': (
                            (pricing_result.get('recommended_price', 0) - pricing_result.get('current_price', 0)) / 
                            pricing_result.get('current_price', 1) * 100
                        ),
                        'confidence': pricing_result.get('confidence', 0),
                        'method': pricing_result.get('method', 'unknown'),
                        'margin_percent': pricing_result.get('factors', {}).get('margin_percent', 0)
                    })
                    
            except Exception as e:
                print(f"Error optimizing pricing for product {product_id}: {e}")
                continue
        
        # Sort by potential revenue impact
        pricing_results.sort(key=lambda x: abs(x['price_change']), reverse=True)
        
        return jsonify({
            'success': True,
            'data': {
                'org_id': org_id,
                'total_products': len(pricing_results),
                'pricing_results': pricing_results
            }
        })
        
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@pricing_bp.route('/pricing/competitor-prices', methods=['POST'])
def get_competitor_prices():
    """Get competitor prices for a product"""
    try:
        data = request.get_json()
        product_name = data.get('product_name')
        product_sku = data.get('product_sku')
        
        if not product_name:
            return jsonify({
                'success': False,
                'error': 'product_name is required'
            }), 400
        
        competitor_prices = competitor_scraper.scrape_competitor_prices(
            product_name, product_sku
        )
        
        return jsonify({
            'success': True,
            'data': {
                'product_name': product_name,
                'competitor_prices': competitor_prices,
                'scraped_at': datetime.now().isoformat()
            }
        })
        
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@pricing_bp.route('/pricing/elasticity', methods=['POST'])
def calculate_elasticity():
    """Calculate demand elasticity for a product"""
    try:
        data = request.get_json()
        org_id = data.get('org_id')
        product_id = data.get('product_id')
        
        if not org_id or not product_id:
            return jsonify({
                'success': False,
                'error': 'org_id and product_id are required'
            }), 400
        
        # Get sales history
        sales_history = data_service.get_sales_history(org_id, product_id)
        
        if len(sales_history) < 5:
            return jsonify({
                'success': False,
                'error': 'Insufficient sales data for elasticity calculation'
            }), 400
        
        # Calculate elasticity
        elasticity = pricing_service._calculate_demand_elasticity(sales_history)
        
        # Interpret elasticity
        if elasticity > -0.5:
            interpretation = 'Inelastic - Price changes have minimal impact on demand'
        elif elasticity > -1.5:
            interpretation = 'Moderately elastic - Price changes moderately affect demand'
        else:
            interpretation = 'Highly elastic - Price changes significantly impact demand'
        
        return jsonify({
            'success': True,
            'data': {
                'product_id': product_id,
                'elasticity': round(elasticity, 3),
                'interpretation': interpretation,
                'data_points': len(sales_history)
            }
        })
        
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500