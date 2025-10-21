"""
Flask Application Factory
Creates and configures the Flask application with all extensions and blueprints
"""

import os
from flask import Flask, jsonify, request, make_response
from flask_cors import CORS
from config import Config
from app.extensions import db, migrate, jwt
from app.models import User, Category, PaymentMode, Expense


def create_app(config_class=Config):
    """
    Application factory function
    Creates and configures Flask application instance
    
    Args:
        config_class: Configuration class (default: Config)
        
    Returns:
        Flask: Configured Flask application
    """
    
    # Create Flask app
    app = Flask(__name__)
    
    # Load configuration
    app.config.from_object(config_class)
    
    print('=' * 60)
    print('🚀 Initializing Flask Application')
    print('=' * 60)
    
    # ✅ FIXED: Get allowed origins from environment
    frontend_url = os.getenv('FRONTEND_URL', 'http://localhost:3000')
    
    # Support multiple origins (comma-separated)
    if ',' in frontend_url:
        allowed_origins = [origin.strip() for origin in frontend_url.split(',')]
    else:
        allowed_origins = [frontend_url, 'http://localhost:3000', 'http://127.0.0.1:3000']
    
    print(f'✓ CORS allowed origins: {allowed_origins}')
    
    # ✅ FIXED: Initialize JWT FIRST with proper config
    jwt.init_app(app)
    
    # ✅ FIXED: Configure CORS with dynamic origins from environment
    CORS(app, 
         resources={
             r"/api/*": {
                 "origins": allowed_origins,
                 "methods": ["GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"],
                 "allow_headers": ["Content-Type", "Authorization", "X-Requested-With", "X-CSRF-TOKEN"],
                 "expose_headers": ["Content-Type", "Authorization"],
                 "supports_credentials": True,
                 "max_age": 3600,
                 "send_wildcard": False,
                 "automatic_options": True
             }
         })
    
    print('✓ CORS configured with proper OPTIONS support')
    
    # Initialize extensions AFTER JWT
    db.init_app(app)
    migrate.init_app(app, db)
    
    # Create tables if they don't exist
    with app.app_context():
        try:
            db.create_all()
            print('✓ Database tables created/verified')
        except Exception as e:
            print(f'⚠️  Database warning: {str(e)}')
    
    # ✅ FIXED: Register JWT callbacks BEFORE blueprints
    register_jwt_callbacks(jwt, app)
    print('✓ JWT callbacks registered')
    
    # Configure OpenAI
    openai_key = os.getenv('OPENAI_API_KEY')
    if openai_key:
        print(f'✅ OpenAI configured successfully with model: {os.getenv("OPENAI_MODEL", "gpt-4o-mini")}')
    else:
        print('⚠️  OpenAI API key not configured')
    
    # Check for fonts (for PDF generation)
    try:
        from reportlab.pdfbase import pdfmetrics
        from reportlab.pdfbase.ttfonts import TTFont
        print('⚠️ Using default fonts (₹ symbol may not display)')
    except:
        pass
    
    # Register blueprints
    from app.routes import auth_bp, expenses_bp, analytics_bp, ai_bp
    from app.routes.export import export_bp
    
    app.register_blueprint(auth_bp, url_prefix='/api/auth')
    app.register_blueprint(expenses_bp, url_prefix='/api/expenses')
    app.register_blueprint(analytics_bp, url_prefix='/api/analytics')
    app.register_blueprint(ai_bp, url_prefix='/api/ai')
    app.register_blueprint(export_bp, url_prefix='/api/export')
    
    print(f'✓ Registered {len(app.blueprints)} blueprints')
    print('  • /api/auth - Authentication')
    print('  • /api/expenses - Expense Management')
    print('  • /api/analytics - Analytics')
    print('  • /api/ai - AI Insights')
    print('  • /api/export - Export Reports')
    
    # ✅ FIXED: Add global OPTIONS handler with dynamic origins
    @app.before_request
    def handle_preflight():
        if request.method == "OPTIONS":
            response = make_response()
            origin = request.headers.get('Origin')
            if origin in allowed_origins:
                response.headers.add("Access-Control-Allow-Origin", origin)
            else:
                response.headers.add("Access-Control-Allow-Origin", allowed_origins[0])
            response.headers.add('Access-Control-Allow-Headers', "Content-Type,Authorization,X-Requested-With")
            response.headers.add('Access-Control-Allow-Methods', "GET,PUT,POST,DELETE,OPTIONS,PATCH")
            response.headers.add('Access-Control-Allow-Credentials', 'true')
            return response
    
    # Register error handlers
    register_error_handlers(app)
    print('✓ Error handlers registered')
    
    # Register CLI commands
    register_cli_commands(app)
    print('✓ CLI commands registered')
    
    # Root endpoint
    @app.route('/', methods=['GET'])
    def index():
        """Root endpoint with API information"""
        return jsonify({
            "message": "Expense Tracker API",
            "version": "1.0.0",
            "status": "running",
            "endpoints": {
                "auth": "/api/auth",
                "expenses": "/api/expenses",
                "analytics": "/api/analytics",
                "ai": "/api/ai",
                "export": "/api/export"
            },
            "health": "/health"
        }), 200
    
    # Health check endpoint
    @app.route('/health', methods=['GET'])
    def health():
        """Health check endpoint"""
        try:
            # Test database connection
            db.session.execute(db.text('SELECT 1'))
            db_status = "connected"
        except Exception as e:
            db_status = f"error: {str(e)}"
        
        return jsonify({
            "status": "healthy",
            "database": db_status,
            "version": "1.0.0",
            "environment": app.config.get('FLASK_ENV', 'unknown')
        }), 200
    
    print('=' * 60)
    print('✓ Flask application initialized successfully')
    print('=' * 60)
    
    return app


def register_error_handlers(app):
    """Register custom error handlers"""
    
    @app.errorhandler(400)
    def bad_request_error(error):
        return jsonify({
            "error": "Bad Request",
            "message": str(error.description) if hasattr(error, 'description') else "Invalid request"
        }), 400
    
    @app.errorhandler(401)
    def unauthorized_error(error):
        return jsonify({
            "error": "Unauthorized",
            "message": "Authentication required"
        }), 401
    
    @app.errorhandler(403)
    def forbidden_error(error):
        return jsonify({
            "error": "Forbidden",
            "message": "You don't have permission to access this resource"
        }), 403
    
    @app.errorhandler(404)
    def not_found_error(error):
        return jsonify({
            "error": "Not Found",
            "message": "The requested resource was not found"
        }), 404
    
    @app.errorhandler(405)
    def method_not_allowed_error(error):
        return jsonify({
            "error": "Method Not Allowed",
            "message": "The HTTP method is not allowed for this endpoint",
            "allowed_methods": error.valid_methods if hasattr(error, 'valid_methods') else []
        }), 405
    
    @app.errorhandler(500)
    def internal_error(error):
        db.session.rollback()
        print(f'❌ Internal Server Error: {str(error)}')
        return jsonify({
            "error": "Internal Server Error",
            "message": "An internal server error occurred. Please try again later."
        }), 500


def register_jwt_callbacks(jwt, app):
    """Register JWT callbacks with detailed logging"""
    
    @jwt.expired_token_loader
    def expired_token_callback(jwt_header, jwt_payload):
        print('❌ JWT: Token expired')
        return jsonify({
            "error": "Token Expired",
            "message": "The access token has expired. Please login again."
        }), 401
    
    @jwt.invalid_token_loader
    def invalid_token_callback(error):
        print(f'❌ JWT: Invalid token - {error}')
        return jsonify({
            "error": "Invalid Token",
            "message": "Token verification failed. Please login again."
        }), 401
    
    @jwt.unauthorized_loader
    def missing_token_callback(error):
        print(f'❌ JWT: Missing token - {error}')
        return jsonify({
            "error": "Authorization Required",
            "message": "Request does not contain a valid access token"
        }), 401
    
    @jwt.revoked_token_loader
    def revoked_token_callback(jwt_header, jwt_payload):
        print('❌ JWT: Token revoked')
        return jsonify({
            "error": "Token Revoked",
            "message": "The token has been revoked. Please login again."
        }), 401
    
    @jwt.additional_claims_loader
    def add_claims_to_jwt(identity):
        user = User.query.get(identity)
        return {
            'email': user.email if user else None,
            'is_admin': False
        }
    
    @jwt.user_identity_loader
    def user_identity_lookup(user):
        return user
    
    @jwt.user_lookup_loader
    def user_lookup_callback(_jwt_header, jwt_data):
        identity = jwt_data["sub"]
        user = User.query.filter_by(id=identity).one_or_none()
        return user


def register_cli_commands(app):
    """Register CLI commands"""
    from app.cli import seed_database, create_admin
    
    app.cli.add_command(seed_database)
    app.cli.add_command(create_admin)
