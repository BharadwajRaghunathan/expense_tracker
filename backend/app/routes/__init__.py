"""
Routes Package Initialization
Registers all blueprints for the application
"""

from app.routes.auth import auth_bp
from app.routes.expenses import expenses_bp
from app.routes.analytics import analytics_bp
from app.routes.ai import ai_bp


# Export all blueprints
__all__ = ['auth_bp', 'expenses_bp', 'analytics_bp', 'ai_bp']


def register_blueprints(app):
    """
    Register all application blueprints
    
    Args:
        app: Flask application instance
    
    Registered Blueprints:
        - auth_bp: User authentication (login, register, token refresh)
        - expenses_bp: Expense CRUD operations and management
        - analytics_bp: Analytics, reports, and dashboard data
        - ai_bp: AI-powered expense queries (OpenAI integration)
    """
    # Authentication routes (/api/auth/*)
    app.register_blueprint(auth_bp, url_prefix='/api/auth')
    
    # Expense management routes (/api/expenses/*)
    app.register_blueprint(expenses_bp, url_prefix='/api/expenses')
    
    # Analytics and dashboard routes (/api/analytics/*)
    app.register_blueprint(analytics_bp, url_prefix='/api/analytics')
    
    # AI query routes (/api/ai/*) - OpenAI powered
    app.register_blueprint(ai_bp, url_prefix='/api/ai')
    
    print("✓ All blueprints registered successfully")
