"""
WSGI Entry Point for Production Deployment
Used by production WSGI servers (Gunicorn, Render)
"""

import os
from app import create_app
from config import config

# Determine environment
environment = os.environ.get('FLASK_ENV', 'production')

# For Render deployment
if os.environ.get('RENDER'):
    config_class = config['production']
elif os.environ.get('VERCEL'):
    config_class = config['vercel']
else:
    config_class = config.get(environment, config['production'])

# Create application instance
app = create_app(config_class)

# Application initialization logging
if __name__ != '__main__':
    print('=' * 60)
    print(f'✓ {app.config["APP_NAME"]} loaded successfully')
    print(f'✓ Environment: {environment}')
    print(f'✓ Version: {app.config["APP_VERSION"]}')
    print('=' * 60)

if __name__ == '__main__':
    print('⚠️  WARNING: Use gunicorn for production!')
    print('     gunicorn -w 4 -b 0.0.0.0:5000 wsgi:app')
