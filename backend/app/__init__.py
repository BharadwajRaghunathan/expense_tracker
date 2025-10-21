"""
Flask Application Factory
Creates and configures the Flask application with all extensions and blueprints
"""


from flask import Flask, jsonify
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
    
    # ✅ FIXED: Initialize JWT FIRST with proper config
    jwt.init_app(app)
    
    # ✅ FIXED: Configure CORS with proper OPTIONS support AND production frontend URL
    CORS(app, 
         resources={
             r"/api/*": {
                 "origins": [
                     "http://localhost:3000", 
                     "http://127.0.0.1:3000",
                     "https://expense-tracker-frontend-m3ud.onrender.com"
                 ],
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
    
    # Create tables if they don't exist (development only)
    with app.app_context():
        if app.config.get('FLASK_ENV') == 'development':
            try:
                db.create_all()
                print('✓ Database tables created/verified')
            except Exception as e:
                print(f'⚠️  Database warning: {str(e)}')
    
    # ✅ FIXED: Register JWT callbacks BEFORE blueprints
    register_jwt_callbacks(jwt, app)
    print('✓ JWT callbacks registered')
    
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
    
    # ✅ FIXED: Add global OPTIONS handler for all API routes with production frontend URL
    @app.before_request
    def handle_preflight():
        from flask import request
        if request.method == "OPTIONS":
            # Allow all OPTIONS requests
            from flask import make_response
            response = make_response()
            origin = request.headers.get('Origin')
            allowed_origins = [
                "http://localhost:3000",
                "http://127.0.0.1:3000",
                "https://expense-tracker-frontend-m3ud.onrender.com"
            ]
            if origin in allowed_origins:
                response.headers.add("Access-Control-Allow-Origin", origin)
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
    
    # ✅ FIXED: Add additional JWT callbacks for better debugging
    @jwt.additional_claims_loader
    def add_claims_to_jwt(identity):
        user = User.query.get(identity)
        return {
            'email': user.email if user else None,
            'is_admin': False  # Add admin check if needed
        }
    
    @jwt.user_identity_loader
    def user_identity_lookup(user):
        return user
    
    @jwt.user_lookup_loader
    def user_lookup_callback(_jwt_header, jwt_data):
        identity = jwt_data["sub"]
        user = User.query.filter_by(id=identity).one_or_none()
        print(f'🔍 JWT: Looking up user with ID {identity} - Found: {user is not None}')
        return user


def register_cli_commands(app):
    """Register CLI commands"""
    
    @app.cli.command('seed-db')
    def seed_database():
        """Seed database with default categories and payment modes"""
        print('=' * 60)
        print('🌱 Seeding database with default data...')
        print('=' * 60)
        
        try:
            # Seed categories
            categories = [
                {"name": "Food", "slug": "food", "color": "#FF6B6B"},
                {"name": "Transportation", "slug": "transportation", "color": "#4ECDC4"},
                {"name": "Shopping", "slug": "shopping", "color": "#45B7D1"},
                {"name": "Entertainment", "slug": "entertainment", "color": "#FFA07A"},
                {"name": "Bills & Utilities", "slug": "bills-utilities", "color": "#98D8C8"},
                {"name": "Healthcare", "slug": "healthcare", "color": "#FF69B4"},
                {"name": "Education", "slug": "education", "color": "#9B59B6"},
                {"name": "Travel", "slug": "travel", "color": "#3498DB"},
                {"name": "Investments", "slug": "investments", "color": "#2ECC71"},
                {"name": "Others", "slug": "others", "color": "#95A5A6"},
            ]
            
            for cat_data in categories:
                existing = Category.query.filter_by(slug=cat_data['slug']).first()
                if not existing:
                    category = Category(**cat_data)
                    db.session.add(category)
                    print(f'✓ Added category: {cat_data["name"]}')
                else:
                    print(f'⊙ Category already exists: {cat_data["name"]}')
            
            # Seed payment modes
            payment_modes = [
                {"name": "GPay", "bankname": "SBI", "type": "digital"},
                {"name": "GPay", "bankname": "HDFC", "type": "digital"},
                {"name": "GPay", "bankname": "IOB", "type": "digital"},
                {"name": "PhonePe", "bankname": "SBI", "type": "digital"},
                {"name": "PhonePe", "bankname": "HDFC", "type": "digital"},
                {"name": "Paytm", "type": "digital"},
                {"name": "Cash", "type": "cash"},
                {"name": "Credit Card", "type": "card"},
                {"name": "Debit Card", "type": "card"},
                {"name": "Net Banking", "type": "digital"},
                {"name": "UPI", "type": "digital"},
                {"name": "Other", "type": "other"},
            ]
            
            for pm_data in payment_modes:
                existing = PaymentMode.query.filter_by(
                    name=pm_data['name'],
                    bankname=pm_data.get('bankname')
                ).first()
                if not existing:
                    payment_mode = PaymentMode(**pm_data)
                    db.session.add(payment_mode)
                    display = f"{pm_data['name']}"
                    if pm_data.get('bankname'):
                        display += f" - {pm_data['bankname']}"
                    print(f'✓ Added payment mode: {display}')
                else:
                    display = f"{pm_data['name']}"
                    if pm_data.get('bankname'):
                        display += f" - {pm_data['bankname']}"
                    print(f'⊙ Payment mode already exists: {display}')
            
            db.session.commit()
            print('=' * 60)
            print('✅ Database seeded successfully!')
            print('=' * 60)
            
        except Exception as e:
            db.session.rollback()
            print('=' * 60)
            print(f'❌ Error seeding database: {str(e)}')
            print('=' * 60)
    
    @app.cli.command('create-admin')
    def create_admin():
        """Create admin user"""
        from werkzeug.security import generate_password_hash
        
        print('=' * 60)
        print('👤 Creating admin user...')
        print('=' * 60)
        
        try:
            admin_email = 'admin@example.com'
            existing = User.query.filter_by(email=admin_email).first()
            
            if existing:
                print(f'⊙ Admin user already exists: {admin_email}')
            else:
                admin = User(
                    email=admin_email,
                    full_name='Admin User',
                    password='admin123',  # Will be hashed by User model
                    is_active=True
                )
                db.session.add(admin)
                db.session.commit()
                print(f'✓ Admin user created: {admin_email}')
                print('  Password: admin123')
            
            print('=' * 60)
            print('✅ Admin user ready!')
            print('=' * 60)
            
        except Exception as e:
            db.session.rollback()
            print('=' * 60)
            print(f'❌ Error creating admin: {str(e)}')
            print('=' * 60)
