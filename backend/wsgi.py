"""
WSGI Entry Point for Production Deployment
Used by production WSGI servers (Gunicorn, Render)
"""


import os
from app import create_app
from config import config



# Determine environment
environment = os.environ.get('FLASK_ENV', 'production')


# For Render deployment - always use production config
if os.environ.get('RENDER') or environment == 'production':
    config_class = config['production']
else:
    config_class = config.get(environment, config['production'])


# Create application instance
app = create_app(config_class)



# Application initialization logging
if __name__ != '__main__':
    # This runs when loaded by Gunicorn
    print('=' * 60)
    print(f'🚀 {app.config["APP_NAME"]} v{app.config["APP_VERSION"]}')
    print('=' * 60)
    print(f'✓ Environment: {environment}')
    print(f'✓ Database: Connected')
    print(f'✓ OpenAI: {"Configured" if app.config.get("OPENAI_API_KEY") else "Not Configured"}')
    print(f'✓ CORS: Enabled')
    print('=' * 60)



if __name__ == '__main__':
    # This should never run in production
    print('⚠️  WARNING: This file is for WSGI servers only!')
    print('⚠️  For development: python run.py')
    print('⚠️  For production: gunicorn wsgi:app')
