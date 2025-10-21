"""
Flask extensions initialization
Initializes SQLAlchemy, Flask-Migrate, JWT Manager, and other extensions
"""

from flask_sqlalchemy import SQLAlchemy
from flask_migrate import Migrate
from flask_jwt_extended import JWTManager


# Initialize SQLAlchemy for database operations
db = SQLAlchemy()

# Initialize Flask-Migrate for database migrations
migrate = Migrate()

# Initialize JWT Manager for authentication
jwt = JWTManager()


def init_extensions(app):
    """
    Alternative initialization function if needed
    Can be used instead of calling init_app on each extension
    
    Args:
        app: Flask application instance
    """
    db.init_app(app)
    migrate.init_app(app, db)
    jwt.init_app(app)
    
    print("✓ All extensions initialized")
