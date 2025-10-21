"""
Authentication Routes
Handles user registration, login, and logout functionality
"""

from flask import Blueprint, request, jsonify
from flask_jwt_extended import (
    create_access_token,
    jwt_required,
    get_jwt_identity,
    get_jwt
)
from app.extensions import db
from app.models import User
from datetime import timedelta
import re

# Create Blueprint
auth_bp = Blueprint('auth', __name__)

# Token blacklist (in production, use Redis or database)
token_blacklist = set()


def validate_email(email):
    """
    Validate email format
    
    Args:
        email (str): Email address to validate
        
    Returns:
        bool: True if valid, False otherwise
    """
    pattern = r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$'
    return re.match(pattern, email) is not None


def validate_password(password):
    """
    Validate password strength (minimum 6 characters)
    
    Args:
        password (str): Password to validate
        
    Returns:
        tuple: (bool, str) - (is_valid, error_message)
    """
    if len(password) < 6:
        return False, "Password must be at least 6 characters long"
    return True, ""


@auth_bp.route('/register', methods=['POST'])
def register():
    """
    Register a new user
    
    Request Body:
        {
            "email": "user@example.com",
            "password": "password123",
            "full_name": "John Doe" (optional)
        }
    
    Returns:
        JSON response with user data or error message
    """
    try:
        data = request.get_json()
        print("=" * 60)
        print("📝 REGISTRATION REQUEST")
        print("=" * 60)
        if not data:
            print("❌ No data provided")
            return jsonify({"error": "No data provided"}), 400

        email = data.get('email', '').strip().lower()
        password = data.get('password', '')
        full_name = data.get('full_name', '').strip()

        print(f"📧 Email: {email}")
        print(f"👤 Full name: {full_name}")

        if not email:
            print("❌ Email is required")
            return jsonify({"error": "Email is required"}), 400
        if not validate_email(email):
            print("❌ Invalid email format")
            return jsonify({"error": "Invalid email format"}), 400
        if not password:
            print("❌ Password is required")
            return jsonify({"error": "Password is required"}), 400
        is_valid, error_msg = validate_password(password)
        if not is_valid:
            print(f"❌ Password validation failed: {error_msg}")
            return jsonify({"error": error_msg}), 400

        existing_user = User.query.filter_by(email=email).first()
        if existing_user:
            print(f"❌ User already exists: {email}")
            return jsonify({"error": "User with this email already exists"}), 409

        new_user = User(
            email=email,
            password=password,  # Will be hashed in User.__init__
            full_name=full_name if full_name else None
        )
        db.session.add(new_user)
        db.session.commit()

        print(f"✅ User registered successfully: ID={new_user.id}, Email={new_user.email}")
        print("=" * 60)
        return jsonify({
            "message": "User registered successfully",
            "user": new_user.to_dict()
        }), 201

    except Exception as e:
        print(f"❌ Registration error: {str(e)}")
        print("=" * 60)
        db.session.rollback()
        return jsonify({"error": f"Registration failed: {str(e)}"}), 500


@auth_bp.route('/login', methods=['POST'])
def login():
    """
    Login user and return JWT access token
    
    Request Body:
        {
            "email": "user@example.com",
            "password": "password123"
        }
    
    Returns:
        JSON response with access token and user data
    """
    try:
        data = request.get_json()
        print("=" * 60)
        print("🔐 LOGIN REQUEST")
        print("=" * 60)
        if not data:
            print("❌ No data provided")
            return jsonify({"error": "No data provided"}), 400

        email = data.get('email', '').strip().lower()
        password = data.get('password', '')

        print(f"📧 Login attempt for: {email}")
        print(f"🔑 Password length: {len(password)} characters")

        if not email or not password:
            print("❌ Email and password are required")
            return jsonify({"error": "Email and password are required"}), 400

        user = User.query.filter_by(email=email).first()
        if not user:
            print(f"❌ User not found: {email}")
            return jsonify({"error": "Invalid email or password"}), 401

        print(f"✅ User found: ID={user.id}, Email={user.email}")
        if not user.check_password(password):
            print("❌ Invalid password")
            return jsonify({"error": "Invalid email or password"}), 401

        print("✅ Password verified")
        if not user.is_active:
            print("❌ Account is deactivated")
            return jsonify({"error": "Account is deactivated"}), 403

        print("✅ Account is active")
        print("🔑 Generating JWT token...")
        access_token = create_access_token(
            identity=str(user.id),  # ✅ Fixed to use string identity
            expires_delta=timedelta(hours=24),
            additional_claims={"email": user.email}
        )

        print(f"✅ Token generated (length: {len(access_token)} chars)")
        print(f"   Token preview: {access_token[:30]}...")
        response_data = {
            "message": "Login successful",
            "access_token": access_token,
            "token_type": "Bearer",
            "expires_in": 86400,  # 24 hours
            "user": user.to_dict()
        }

        print("=" * 60)
        print("📤 SENDING LOGIN RESPONSE:")
        for k, v in response_data.items():
            print(f"✅ {k}: {str(v)[:50]}{'...' if isinstance(v, str) and len(str(v)) > 50 else ''}")
        print("=" * 60)

        return jsonify(response_data), 200

    except Exception as e:
        print(f"❌ Login error: {str(e)}")
        import traceback; traceback.print_exc()
        print("=" * 60)
        return jsonify({"error": f"Login failed: {str(e)}"}), 500


@auth_bp.route('/logout', methods=['POST'])
@jwt_required()
def logout():
    """
    Logout user by blacklisting their JWT token
    
    Headers:
        Authorization: Bearer <access_token>
    
    Returns:
        JSON response confirming logout
    """
    try:
        jti = get_jwt()['jti']
        print("=" * 60)
        print("🚪 LOGOUT REQUEST")
        print("=" * 60)
        print(f"Token JTI: {jti}")
        token_blacklist.add(jti)
        print(f"✅ Token blacklisted ({len(token_blacklist)} total)")
        print("=" * 60)
        return jsonify({"message": "Logout successful"}), 200

    except Exception as e:
        print(f"❌ Logout error: {str(e)}")
        print("=" * 60)
        return jsonify({"error": f"Logout failed: {str(e)}"}), 500


@auth_bp.route('/me', methods=['GET'])
@jwt_required()
def get_current_user():
    """
    Get current authenticated user information
    
    Headers:
        Authorization: Bearer <access_token>
    
    Returns:
        JSON response with user data
    """
    try:
        current_user_id = get_jwt_identity()
        print("=" * 60)
        print("👤 GET CURRENT USER REQUEST")
        print("=" * 60)
        print(f"User ID from token: {current_user_id}")

        user = User.query.get(current_user_id)
        if not user:
            print(f"❌ User not found: ID={current_user_id}")
            print("=" * 60)
            return jsonify({"error": "User not found"}), 404

        print(f"✅ User found: {user.email}")
        print("=" * 60)
        return jsonify({"user": user.to_dict()}), 200

    except Exception as e:
        print(f"❌ Get user error: {str(e)}")
        print("=" * 60)
        return jsonify({"error": f"Failed to fetch user: {str(e)}"}), 500


@auth_bp.route('/refresh', methods=['POST'])
@jwt_required()
def refresh_token():
    """
    Refresh JWT access token
    
    Headers:
        Authorization: Bearer <access_token>
    
    Returns:
        JSON response with new access token
    """
    try:
        current_user_id = get_jwt_identity()
        print("=" * 60)
        print("🔄 REFRESH TOKEN REQUEST")
        print("=" * 60)
        print(f"User ID: {current_user_id}")

        new_token = create_access_token(
            identity=str(current_user_id),  # ✅ Fixed to use string identity
            expires_delta=timedelta(hours=24)
        )
        print(f"✅ New token generated (length: {len(new_token)})")
        print("=" * 60)
        return jsonify({
            "access_token": new_token,
            "token_type": "Bearer",
            "expires_in": 86400
        }), 200

    except Exception as e:
        print(f"❌ Refresh error: {str(e)}")
        print("=" * 60)
        return jsonify({"error": f"Token refresh failed: {str(e)}"}), 500


@auth_bp.before_app_request
def check_if_token_revoked():
    """
    Check if token is in blacklist before processing request
    This runs before every request that requires JWT
    """
    try:
        jwt_data = get_jwt()
        if jwt_data and jwt_data.get('jti') in token_blacklist:
            print(f"⚠️ Blocked blacklisted token: {jwt_data.get('jti')}")
            return jsonify({"error": "Token has been revoked"}), 401
    except Exception:
        pass  # No JWT present, continue normally
