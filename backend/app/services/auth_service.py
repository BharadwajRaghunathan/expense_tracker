"""
Authentication Service
Business logic for user authentication, registration, and token management
"""

from app.extensions import db
from app.models import User
from flask_jwt_extended import create_access_token
from datetime import timedelta
import re


class AuthService:
    """
    Service class for authentication-related operations
    Handles user registration, login, validation, and token generation
    """
    
    @staticmethod
    def validate_email(email):
        """
        Validate email format using regex
        
        Args:
            email (str): Email address to validate
            
        Returns:
            bool: True if valid email format, False otherwise
        """
        if not email:
            return False
        
        # RFC 5322 compliant email regex pattern
        pattern = r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$'
        return re.match(pattern, email) is not None
    
    @staticmethod
    def validate_password(password):
        """
        Validate password strength requirements
        
        Args:
            password (str): Password to validate
            
        Returns:
            tuple: (is_valid: bool, error_message: str)
        """
        if not password:
            return False, "Password is required"
        
        if len(password) < 6:
            return False, "Password must be at least 6 characters long"
        
        if len(password) > 128:
            return False, "Password is too long (maximum 128 characters)"
        
        # Optional: Add more strength requirements
        # has_uppercase = any(c.isupper() for c in password)
        # has_lowercase = any(c.islower() for c in password)
        # has_digit = any(c.isdigit() for c in password)
        
        return True, ""
    
    @staticmethod
    def user_exists(email):
        """
        Check if user with given email already exists
        
        Args:
            email (str): Email address to check
            
        Returns:
            bool: True if user exists, False otherwise
        """
        email_lower = email.strip().lower()
        existing_user = User.query.filter_by(email=email_lower).first()
        return existing_user is not None
    
    @staticmethod
    def register_user(email, password, full_name=None):
        """
        Register a new user account
        
        Args:
            email (str): User's email address
            password (str): User's password (will be hashed)
            full_name (str, optional): User's full name
            
        Returns:
            tuple: (success: bool, user_or_error: User|str)
        """
        try:
            # Normalize email
            email = email.strip().lower()
            
            # Validate email format
            if not AuthService.validate_email(email):
                return False, "Invalid email format"
            
            # Validate password
            is_valid, error_msg = AuthService.validate_password(password)
            if not is_valid:
                return False, error_msg
            
            # Check if user already exists
            if AuthService.user_exists(email):
                return False, "User with this email already exists"
            
            # Sanitize full_name
            if full_name:
                full_name = full_name.strip()
                if len(full_name) > 100:
                    return False, "Full name is too long"
            
            # Create new user (password will be hashed in User model)
            new_user = User(
                email=email,
                password=password,
                full_name=full_name if full_name else None
            )
            
            # Save to database
            db.session.add(new_user)
            db.session.commit()
            
            return True, new_user
            
        except Exception as e:
            db.session.rollback()
            return False, f"Registration failed: {str(e)}"
    
    @staticmethod
    def authenticate_user(email, password):
        """
        Authenticate user credentials
        
        Args:
            email (str): User's email address
            password (str): User's password
            
        Returns:
            tuple: (success: bool, user_or_error: User|str)
        """
        try:
            # Normalize email
            email = email.strip().lower()
            
            # Validate inputs
            if not email or not password:
                return False, "Email and password are required"
            
            # Find user by email
            user = User.query.filter_by(email=email).first()
            
            # Check if user exists
            if not user:
                return False, "Invalid email or password"
            
            # Verify password
            if not user.check_password(password):
                return False, "Invalid email or password"
            
            # Check if account is active
            if not user.is_active:
                return False, "Account is deactivated. Please contact support."
            
            return True, user
            
        except Exception as e:
            return False, f"Authentication failed: {str(e)}"
    
    @staticmethod
    def generate_access_token(user_id, email, expires_hours=24):
        """
        Generate JWT access token for authenticated user
        
        Args:
            user_id (int): User's ID
            email (str): User's email
            expires_hours (int): Token expiration time in hours (default: 24)
            
        Returns:
            str: JWT access token
        """
        try:
            access_token = create_access_token(
                identity=user_id,
                expires_delta=timedelta(hours=expires_hours),
                additional_claims={
                    "email": email,
                    "token_type": "access"
                }
            )
            return access_token
        except Exception as e:
            raise Exception(f"Token generation failed: {str(e)}")
    
    @staticmethod
    def get_user_by_id(user_id):
        """
        Retrieve user by ID
        
        Args:
            user_id (int): User's ID
            
        Returns:
            User|None: User object if found, None otherwise
        """
        try:
            return User.query.get(user_id)
        except Exception:
            return None
    
    @staticmethod
    def get_user_by_email(email):
        """
        Retrieve user by email address
        
        Args:
            email (str): User's email address
            
        Returns:
            User|None: User object if found, None otherwise
        """
        try:
            email = email.strip().lower()
            return User.query.filter_by(email=email).first()
        except Exception:
            return None
    
    @staticmethod
    def update_user_profile(user_id, full_name=None):
        """
        Update user profile information
        
        Args:
            user_id (int): User's ID
            full_name (str, optional): New full name
            
        Returns:
            tuple: (success: bool, user_or_error: User|str)
        """
        try:
            user = User.query.get(user_id)
            
            if not user:
                return False, "User not found"
            
            # Update full name if provided
            if full_name is not None:
                full_name = full_name.strip()
                if len(full_name) > 100:
                    return False, "Full name is too long"
                user.full_name = full_name if full_name else None
            
            db.session.commit()
            return True, user
            
        except Exception as e:
            db.session.rollback()
            return False, f"Update failed: {str(e)}"
    
    @staticmethod
    def change_password(user_id, old_password, new_password):
        """
        Change user password
        
        Args:
            user_id (int): User's ID
            old_password (str): Current password
            new_password (str): New password
            
        Returns:
            tuple: (success: bool, message: str)
        """
        try:
            user = User.query.get(user_id)
            
            if not user:
                return False, "User not found"
            
            # Verify old password
            if not user.check_password(old_password):
                return False, "Current password is incorrect"
            
            # Validate new password
            is_valid, error_msg = AuthService.validate_password(new_password)
            if not is_valid:
                return False, error_msg
            
            # Check if new password is same as old password
            if old_password == new_password:
                return False, "New password must be different from current password"
            
            # Update password (will be hashed automatically)
            user.set_password(new_password)
            db.session.commit()
            
            return True, "Password changed successfully"
            
        except Exception as e:
            db.session.rollback()
            return False, f"Password change failed: {str(e)}"
    
    @staticmethod
    def deactivate_account(user_id):
        """
        Deactivate user account (soft delete)
        
        Args:
            user_id (int): User's ID
            
        Returns:
            tuple: (success: bool, message: str)
        """
        try:
            user = User.query.get(user_id)
            
            if not user:
                return False, "User not found"
            
            user.is_active = False
            db.session.commit()
            
            return True, "Account deactivated successfully"
            
        except Exception as e:
            db.session.rollback()
            return False, f"Deactivation failed: {str(e)}"
