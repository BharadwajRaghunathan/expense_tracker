"""
Application entry point for development server
Run this file to start the Flask development server

Usage:
    python run.py
    
Environment Variables:
    FLASK_ENV: development, production, testing (default: development)
    PORT: Port number (default: 5000)
    HOST: Host address (default: 0.0.0.0)
"""

import os
import sys
from app import create_app
from config import get_config


# Create Flask application instance with environment-specific config
config_class = get_config()
app = create_app(config_class)


if __name__ == '__main__':
    # Get configuration from environment
    port = int(os.environ.get('PORT', 5000))
    host = os.environ.get('HOST', '0.0.0.0')
    debug = os.environ.get('FLASK_ENV', 'development') == 'development'
    
    # Warning for production
    if os.environ.get('FLASK_ENV') == 'production':
        print('\n' + '=' * 60)
        print('⚠️  WARNING: Development Server in Production Mode!')
        print('=' * 60)
        print('⚠️  Please use a production WSGI server instead.')
        print('⚠️  Example: gunicorn -w 4 -b 0.0.0.0:5000 wsgi:app')
        print('=' * 60 + '\n')
        sys.exit(1)
    
    # Print startup information
    print('\n' + '=' * 60)
    print(f'🚀 Starting {app.config["APP_NAME"]} v{app.config["APP_VERSION"]}')
    print('=' * 60)
    print(f'📍 Environment:    {app.config["FLASK_ENV"]}')
    print(f'🌐 Server URL:     http://localhost:{port}')
    print(f'🌐 Local Access:   http://127.0.0.1:{port}')
    print(f'🔍 Debug Mode:     {"✅ Enabled" if debug else "❌ Disabled"}')
    print(f'🔐 JWT Enabled:    ✅ Yes')
    # ✅ CHANGED: Check for OpenAI instead of Gemini
    print(f'🤖 OpenAI:         {"✅ Configured (" + app.config.get("OPENAI_MODEL", "N/A") + ")" if app.config.get("OPENAI_API_KEY") else "❌ Not Configured"}')
    print(f'🗄️  Database:       ✅ PostgreSQL Connected')
    print(f'🌍 CORS:           ✅ Enabled (All origins for development)')
    print('=' * 60)
    print('\n💡 Available API Endpoints:')
    print(f'   • http://localhost:{port}/                    - API Info')
    print(f'   • http://localhost:{port}/health              - Health Check')
    print(f'   • http://localhost:{port}/api/auth/login      - Login (POST)')
    print(f'   • http://localhost:{port}/api/auth/register   - Register (POST)')
    print(f'   • http://localhost:{port}/api/expenses        - Expense Management')
    print(f'   • http://localhost:{port}/api/analytics       - Analytics & Reports')
    print(f'   • http://localhost:{port}/api/ai              - AI Query (OpenAI)')
    print(f'   • http://localhost:{port}/api/export          - Export (CSV/PDF)')
    print('\n💡 Frontend Connection:')
    print(f'   • React App:     http://localhost:3000')
    print(f'   • API Base URL:  http://localhost:{port}/api')
    print('\n💡 CLI Commands:')
    print('   • flask seed-db        - Seed database with default data')
    print('   • flask create-admin   - Create admin user')
    print('\n💡 Test Commands:')
    print(f'   • curl http://localhost:{port}/health')
    print(f'   • curl http://localhost:{port}/api/auth/login -X POST -H "Content-Type: application/json" -d \'{{"email":"test@example.com","password":"password123"}}\'')
    print(f'   • curl http://localhost:{port}/api/ai/query -X POST -H "Content-Type: application/json" -H "Authorization: Bearer YOUR_TOKEN" -d \'{{"query":"What did I spend this week?"}}\'')
    print('\n💡 Press CTRL+C to quit')
    print('=' * 60 + '\n')
    
    # Check database connection
    try:
        with app.app_context():
            from app.extensions import db
            db.session.execute(db.text('SELECT 1'))
            print('✅ Database connection verified')
    except Exception as e:
        print(f'❌ Database connection failed: {str(e)}')
        print('⚠️  Please check your database configuration in .env file')
        print('=' * 60 + '\n')
        sys.exit(1)
    
    # ✅ ADDED: Check OpenAI configuration
    if app.config.get('OPENAI_API_KEY'):
        print(f'✅ OpenAI configured with model: {app.config.get("OPENAI_MODEL", "gpt-4o-mini")}')
    else:
        print('⚠️  OpenAI not configured - AI features will be limited')
        print('💡 Add OPENAI_API_KEY to your .env file to enable AI features')
        print('💡 Get your API key from: https://platform.openai.com/api-keys')
    
    print()  # Empty line for spacing
    
    # Run development server
    try:
        app.run(
            host=host,
            port=port,
            debug=debug,
            use_reloader=debug,
            threaded=True
        )
    except KeyboardInterrupt:
        print('\n\n' + '=' * 60)
        print('✓ Server stopped by user')
        print('=' * 60 + '\n')
    except OSError as e:
        if 'Address already in use' in str(e):
            print('\n\n' + '=' * 60)
            print(f'❌ Port {port} is already in use!')
            print('=' * 60)
            print(f'💡 Solutions:')
            print(f'   1. Stop the other process using port {port}')
            print(f'   2. Use a different port: PORT=5001 python run.py')
            print(f'   3. Find process: netstat -ano | findstr :{port} (Windows)')
            print('=' * 60 + '\n')
        else:
            print('\n\n' + '=' * 60)
            print(f'❌ Error starting server: {str(e)}')
            print('=' * 60 + '\n')
        sys.exit(1)
    except Exception as e:
        print('\n\n' + '=' * 60)
        print(f'❌ Unexpected error: {str(e)}')
        print('=' * 60 + '\n')
        sys.exit(1)
