"""
Configuration settings for different environments
Loads settings from .env file with security best practices
"""

import os
from dotenv import load_dotenv
from datetime import timedelta


# Load environment variables from .env file
basedir = os.path.abspath(os.path.dirname(__file__))
load_dotenv(os.path.join(basedir, '.env'))


class Config:
    """Base configuration class with common settings"""
    
    # Flask Configuration
    SECRET_KEY = os.environ.get('SECRET_KEY') or 'dev-secret-key-change-in-production'
    FLASK_APP = os.environ.get('FLASK_APP') or 'run.py'
    FLASK_ENV = os.environ.get('FLASK_ENV') or 'development'
    
    # Database Configuration
    DB_HOST = os.environ.get('DB_HOST', 'localhost')
    DB_PORT = os.environ.get('DB_PORT', '5432')
    DB_NAME = os.environ.get('DB_NAME', 'expense_db')
    DB_USER = os.environ.get('DB_USER', 'postgres')
    DB_PASSWORD = os.environ.get('DB_PASSWORD', '')
    
    # Construct PostgreSQL database URI
    SQLALCHEMY_DATABASE_URI = os.environ.get('DATABASE_URL') or (
        f"postgresql://{DB_USER}:{DB_PASSWORD}@{DB_HOST}:{DB_PORT}/{DB_NAME}"
    )
    
    # Fix for Heroku/Vercel postgres URLs (postgres:// -> postgresql://)
    if SQLALCHEMY_DATABASE_URI and SQLALCHEMY_DATABASE_URI.startswith('postgres://'):
        SQLALCHEMY_DATABASE_URI = SQLALCHEMY_DATABASE_URI.replace('postgres://', 'postgresql://', 1)
    
    # SQLAlchemy Configuration
    SQLALCHEMY_TRACK_MODIFICATIONS = False
    SQLALCHEMY_ECHO = False  # Set to True to see SQL queries in console
    SQLALCHEMY_ENGINE_OPTIONS = {
        'pool_size': 10,
        'pool_recycle': 3600,
        'pool_pre_ping': True,
        'connect_args': {
            'connect_timeout': 10
        }
    }
    
    # JWT Configuration
    JWT_SECRET_KEY = os.environ.get('JWT_SECRET_KEY') or 'jwt-secret-key-change-in-production'
    JWT_ACCESS_TOKEN_EXPIRES = timedelta(hours=24)  # 24 hours
    JWT_REFRESH_TOKEN_EXPIRES = timedelta(days=30)  # 30 days
    JWT_ALGORITHM = 'HS256'
    JWT_TOKEN_LOCATION = ['headers']
    JWT_HEADER_NAME = 'Authorization'
    JWT_HEADER_TYPE = 'Bearer'
    
    # ✅ CHANGED: OpenAI Configuration (was Gemini)
    OPENAI_API_KEY = os.environ.get('OPENAI_API_KEY')
    # Valid model options: 'gpt-4o', 'gpt-4o-mini', 'gpt-3.5-turbo'
    OPENAI_MODEL = os.environ.get('OPENAI_MODEL', 'gpt-4o-mini')
    OPENAI_MAX_TOKENS = 1000
    OPENAI_TEMPERATURE = 0.7  # Control response creativity (0.0 to 1.0)
    
    # CORS Configuration
    CORS_HEADERS = 'Content-Type'
    FRONTEND_URL = os.environ.get('FRONTEND_URL', 'http://localhost:3000')
    
    # Security Configuration
    SESSION_COOKIE_SECURE = True  # Only send cookies over HTTPS
    SESSION_COOKIE_HTTPONLY = True  # Prevent JavaScript access to session cookies
    SESSION_COOKIE_SAMESITE = 'Lax'  # CSRF protection
    PERMANENT_SESSION_LIFETIME = timedelta(days=7)
    
    # Rate Limiting Configuration
    RATELIMIT_ENABLED = True
    RATELIMIT_STORAGE_URL = os.environ.get('REDIS_URL', 'memory://')
    
    # Pagination Configuration
    DEFAULT_PAGE_SIZE = 50
    MAX_PAGE_SIZE = 100
    
    # File Upload Configuration (if needed in future)
    MAX_CONTENT_LENGTH = 16 * 1024 * 1024  # 16 MB max file size
    UPLOAD_FOLDER = os.path.join(basedir, 'uploads')
    ALLOWED_EXTENSIONS = {'png', 'jpg', 'jpeg', 'gif', 'pdf'}
    
    # Logging Configuration
    LOG_LEVEL = os.environ.get('LOG_LEVEL', 'INFO')
    LOG_FORMAT = '%(asctime)s - %(name)s - %(levelname)s - %(message)s'
    LOG_FILE = os.path.join(basedir, 'logs', 'app.log')
    
    # Application Information
    APP_NAME = 'Expense Tracker'
    APP_VERSION = '1.0.0'
    API_TITLE = 'Expense Tracker API'
    API_VERSION = 'v1'
    
    # Timezone Configuration
    TIMEZONE = 'Asia/Kolkata'  # IST
    
    @staticmethod
    def init_app(app):
        """
        Static method to perform application-specific initialization
        Can be overridden in subclasses
        """
        pass


class DevelopmentConfig(Config):
    """Development environment configuration"""
    DEBUG = True
    TESTING = False
    SQLALCHEMY_ECHO = True  # Show SQL queries in development
    
    # Development-specific settings
    SESSION_COOKIE_SECURE = False  # Allow HTTP in development
    RATELIMIT_ENABLED = False  # Disable rate limiting in development
    
    # ✅ CHANGED: More lenient OpenAI settings for development
    OPENAI_MAX_TOKENS = 1500  # Allow longer responses in development
    
    @staticmethod
    def init_app(app):
        """Development-specific initialization"""
        print('✓ Running in DEVELOPMENT mode')
        print('⚠️  Debug mode is ON - Do not use in production!')
        
        # ✅ CHANGED: Check OpenAI configuration
        if app.config.get('OPENAI_API_KEY'):
            print(f"✓ OpenAI configured with model: {app.config.get('OPENAI_MODEL')}")
        else:
            print('⚠️  OpenAI not configured - AI features will be disabled')
            print('💡 Get your API key from: https://platform.openai.com/api-keys')


class ProductionConfig(Config):
    """Production environment configuration"""
    DEBUG = False
    TESTING = False
    SQLALCHEMY_ECHO = False
    
    # Production-specific settings
    SESSION_COOKIE_SECURE = True
    RATELIMIT_ENABLED = True
    
    # ✅ CHANGED: Stricter OpenAI settings for production (cost control)
    OPENAI_MAX_TOKENS = 800  # Shorter responses in production for cost control
    OPENAI_TEMPERATURE = 0.6  # More consistent responses in production
    
    # Ensure required environment variables are set
    @classmethod
    def init_app(cls, app):
        """Production-specific initialization"""
        Config.init_app(app)
        
        # Validate required environment variables
        required_vars = [
            'SECRET_KEY',
            'JWT_SECRET_KEY',
            'DATABASE_URL',
        ]
        
        # ✅ CHANGED: OpenAI API key is optional, not required
        optional_vars = ['OPENAI_API_KEY']
        
        missing_vars = []
        for var in required_vars:
            if not os.environ.get(var):
                missing_vars.append(var)
        
        if missing_vars:
            raise ValueError(
                f"Missing required environment variables for production: {', '.join(missing_vars)}"
            )
        
        # Ensure secret keys are not default values
        if app.config['SECRET_KEY'] == 'dev-secret-key-change-in-production':
            raise ValueError("SECRET_KEY must be changed for production!")
        
        if app.config['JWT_SECRET_KEY'] == 'jwt-secret-key-change-in-production':
            raise ValueError("JWT_SECRET_KEY must be changed for production!")
        
        print('✓ Running in PRODUCTION mode')
        print('✓ All security checks passed')
        
        # Warn about optional configs
        for var in optional_vars:
            if not os.environ.get(var):
                print(f'⚠️  Optional config {var} not set - some features may be disabled')
            else:
                print(f'✓ {var} configured')


class TestingConfig(Config):
    """Testing environment configuration"""
    TESTING = True
    DEBUG = True
    
    # Use in-memory SQLite database for tests
    SQLALCHEMY_DATABASE_URI = 'sqlite:///:memory:'
    
    # Disable CSRF protection in testing
    WTF_CSRF_ENABLED = False
    
    # Speed up password hashing for tests
    BCRYPT_LOG_ROUNDS = 4
    
    # Disable rate limiting in tests
    RATELIMIT_ENABLED = False
    
    # Short token expiry for testing
    JWT_ACCESS_TOKEN_EXPIRES = timedelta(minutes=5)
    
    # ✅ CHANGED: Disable OpenAI in tests
    OPENAI_API_KEY = None  # Don't use real API in tests
    
    @staticmethod
    def init_app(app):
        """Testing-specific initialization"""
        print('✓ Running in TESTING mode')
        print('⚠️  Using in-memory database - data will not persist')


class VercelConfig(ProductionConfig):
    """Vercel-specific production configuration"""
    
    @staticmethod
    def init_app(app):
        """Vercel-specific initialization"""
        ProductionConfig.init_app(app)
        
        # Vercel-specific settings
        print('✓ Configured for Vercel deployment')
        
        # Set up logging for Vercel
        import logging
        logging.basicConfig(
            level=logging.INFO,
            format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
        )


# Configuration dictionary for easy access
config = {
    'development': DevelopmentConfig,
    'production': ProductionConfig,
    'testing': TestingConfig,
    'vercel': VercelConfig,
    'default': DevelopmentConfig
}


def get_config():
    """
    Get configuration based on FLASK_ENV environment variable
    
    Returns:
        Config class for the current environment
    """
    env = os.environ.get('FLASK_ENV', 'development')
    return config.get(env, config['default'])
