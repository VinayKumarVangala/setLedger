from flask import Flask
from flask_cors import CORS
from dotenv import load_dotenv
import os

# Load environment variables
load_dotenv()

# Import routes
from src.routes.prediction_routes import prediction_bp
from src.routes.pricing_routes import pricing_bp
from src.routes.forecast import forecast_bp

def create_app():
    app = Flask(__name__)
    
    # Enable CORS
    CORS(app, origins=['http://localhost:3000', 'https://your-frontend-domain.com'])
    
    # Register blueprints
    app.register_blueprint(prediction_bp, url_prefix='/api/v1')
    app.register_blueprint(pricing_bp, url_prefix='/api/v1')
    app.register_blueprint(forecast_bp, url_prefix='/api/v1/forecast')
    
    # Error handlers
    @app.errorhandler(404)
    def not_found(error):
        return {'success': False, 'error': 'Endpoint not found'}, 404
    
    @app.errorhandler(500)
    def internal_error(error):
        return {'success': False, 'error': 'Internal server error'}, 500
    
    return app

if __name__ == '__main__':
    app = create_app()
    port = int(os.getenv('PORT', 5000))
    debug = os.getenv('FLASK_ENV') == 'development'
    
    print(f"🤖 AI Forecasting Service starting on port {port}")
    app.run(host='0.0.0.0', port=port, debug=debug)