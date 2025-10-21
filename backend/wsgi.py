"""
WSGI Entry Point for Production Deployment
Used by production WSGI servers (Gunicorn, uWSGI, Vercel)

Usage with Gunicorn:
    gunicorn -w 4 -b 0.0.0.0:5000 wsgi:app
    
Usage with uWSGI:
    uwsgi --http :5000 --wsgi-file wsgi.py --callable app
    
Vercel:
    Automatically detects this file for serverless deployment
"""

import os
from app import create_app
from config import config

# Determine environment
environment = os.environ.get('FLASK_ENV', 'production')

# For Vercel, always use production config
if os.environ.get('VERCEL'):
    config_class = config['vercel']
else:
    config_class = config.get(environment, config['production'])

# Create application instance
app = create_app(config_class)

# Application initialization logging
if __name__ != '__main__':
    # This runs when loaded by a WSGI server
    print('=' * 60)
    print(f'✓ {app.config["APP_NAME"]} loaded successfully')
    print(f'✓ Environment: {environment}')
    print(f'✓ Version: {app.config["APP_VERSION"]}')
    print('=' * 60)

# For direct execution (not recommended for production)
if __name__ == '__main__':
    print('⚠️  WARNING: This file is meant for WSGI servers, not direct execution!')
    print('⚠️  For development, use: python run.py')
    print('⚠️  For production, use a WSGI server like:')
    print('     gunicorn -w 4 -b 0.0.0.0:5000 wsgi:app')
