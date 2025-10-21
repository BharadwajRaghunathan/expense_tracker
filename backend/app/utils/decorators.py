"""
Custom Decorators
Reusable decorators for route protection, validation, and enhancement
"""

from functools import wraps
from flask import jsonify, request
from flask_jwt_extended import verify_jwt_in_request, get_jwt_identity, get_jwt
from app.models import User
from datetime import datetime, timedelta
from collections import defaultdict
import time


# Rate limiting storage (in production, use Redis)
rate_limit_storage = defaultdict(lambda: {'count': 0, 'reset_time': None})


def jwt_required_with_user(fn):
    """
    Custom decorator that verifies JWT and loads user object
    
    Usage:
        @jwt_required_with_user
        def my_route(current_user):
            # current_user is automatically passed as User object
            return jsonify({"user": current_user.email})
    
    Args:
        fn: Function to decorate
        
    Returns:
        Decorated function with current_user parameter
    """
    @wraps(fn)
    def wrapper(*args, **kwargs):
        try:
            # Verify JWT token is present and valid
            verify_jwt_in_request()
            
            # Get current user ID from JWT
            current_user_id = get_jwt_identity()
            
            # Fetch user from database
            current_user = User.query.get(current_user_id)
            
            if not current_user:
                return jsonify({"error": "User not found"}), 404
            
            # Check if user account is active
            if not current_user.is_active:
                return jsonify({"error": "Account is deactivated"}), 403
            
            # Call the original function with current_user as parameter
            return fn(current_user=current_user, *args, **kwargs)
            
        except Exception as e:
            return jsonify({"error": f"Authentication failed: {str(e)}"}), 401
    
    return wrapper


def admin_required(fn):
    """
    Decorator that requires JWT authentication and admin role
    
    Usage:
        @admin_required
        def admin_only_route():
            return jsonify({"message": "Admin access granted"})
    
    Note: Requires 'is_admin' claim in JWT token
    
    Args:
        fn: Function to decorate
        
    Returns:
        Decorated function with admin verification
    """
    @wraps(fn)
    def wrapper(*args, **kwargs):
        try:
            # Verify JWT token
            verify_jwt_in_request()
            
            # Get JWT claims
            claims = get_jwt()
            
            # Check if user has admin privileges
            if not claims.get('is_admin', False):
                return jsonify({"error": "Admin access required"}), 403
            
            return fn(*args, **kwargs)
            
        except Exception as e:
            return jsonify({"error": f"Authorization failed: {str(e)}"}), 401
    
    return wrapper


def rate_limit(max_requests=10, window_seconds=60):
    """
    Rate limiting decorator to prevent API abuse
    
    Usage:
        @rate_limit(max_requests=5, window_seconds=60)
        def limited_route():
            return jsonify({"message": "Success"})
    
    Args:
        max_requests (int): Maximum number of requests allowed
        window_seconds (int): Time window in seconds
        
    Returns:
        Decorated function with rate limiting
    """
    def decorator(fn):
        @wraps(fn)
        def wrapper(*args, **kwargs):
            try:
                # Get client identifier (IP address or user ID)
                client_id = request.remote_addr
                
                # Try to get user ID from JWT if authenticated
                try:
                    verify_jwt_in_request(optional=True)
                    user_id = get_jwt_identity()
                    if user_id:
                        client_id = f"user_{user_id}"
                except:
                    pass
                
                # Get rate limit data for this client
                rate_data = rate_limit_storage[client_id]
                current_time = datetime.now()
                
                # Reset counter if window has expired
                if rate_data['reset_time'] is None or current_time > rate_data['reset_time']:
                    rate_data['count'] = 0
                    rate_data['reset_time'] = current_time + timedelta(seconds=window_seconds)
                
                # Check if limit exceeded
                if rate_data['count'] >= max_requests:
                    retry_after = int((rate_data['reset_time'] - current_time).total_seconds())
                    return jsonify({
                        "error": "Rate limit exceeded",
                        "retry_after": retry_after
                    }), 429
                
                # Increment request counter
                rate_data['count'] += 1
                
                # Call the original function
                return fn(*args, **kwargs)
                
            except Exception as e:
                return jsonify({"error": f"Rate limiting error: {str(e)}"}), 500
        
        return wrapper
    return decorator


def validate_json(fn):
    """
    Decorator to ensure request contains valid JSON data
    
    Usage:
        @validate_json
        def create_item():
            data = request.get_json()
            # data is guaranteed to be valid JSON
    
    Args:
        fn: Function to decorate
        
    Returns:
        Decorated function with JSON validation
    """
    @wraps(fn)
    def wrapper(*args, **kwargs):
        if not request.is_json:
            return jsonify({"error": "Content-Type must be application/json"}), 400
        
        try:
            data = request.get_json()
            if data is None:
                return jsonify({"error": "Invalid JSON data"}), 400
        except Exception:
            return jsonify({"error": "Malformed JSON"}), 400
        
        return fn(*args, **kwargs)
    
    return wrapper


def require_ownership(model_class, id_param='id'):
    """
    Decorator to verify user owns the resource
    
    Usage:
        @require_ownership(Expense, id_param='expense_id')
        def update_expense(expense_id, current_user):
            # Automatically verifies expense belongs to current_user
    
    Args:
        model_class: SQLAlchemy model class
        id_param (str): Name of the ID parameter in route
        
    Returns:
        Decorated function with ownership verification
    """
    def decorator(fn):
        @wraps(fn)
        def wrapper(*args, **kwargs):
            try:
                # Verify JWT and get user
                verify_jwt_in_request()
                current_user_id = get_jwt_identity()
                
                # Get resource ID from kwargs
                resource_id = kwargs.get(id_param)
                
                if not resource_id:
                    return jsonify({"error": f"Missing {id_param} parameter"}), 400
                
                # Fetch resource
                resource = model_class.query.get(resource_id)
                
                if not resource:
                    return jsonify({"error": "Resource not found"}), 404
                
                # Verify ownership
                if hasattr(resource, 'user_id') and resource.user_id != current_user_id:
                    return jsonify({"error": "Access denied"}), 403
                
                return fn(*args, **kwargs)
                
            except Exception as e:
                return jsonify({"error": f"Ownership verification failed: {str(e)}"}), 500
        
        return wrapper
    return decorator


def cache_response(timeout=300):
    """
    Simple response caching decorator (in-memory)
    
    Usage:
        @cache_response(timeout=60)
        def expensive_calculation():
            # Result will be cached for 60 seconds
    
    Args:
        timeout (int): Cache timeout in seconds
        
    Returns:
        Decorated function with caching
    """
    cache = {}
    
    def decorator(fn):
        @wraps(fn)
        def wrapper(*args, **kwargs):
            # Generate cache key from function name and arguments
            cache_key = f"{fn.__name__}_{str(args)}_{str(kwargs)}"
            
            # Check if result is in cache and not expired
            if cache_key in cache:
                result, timestamp = cache[cache_key]
                if time.time() - timestamp < timeout:
                    return result
            
            # Call function and cache result
            result = fn(*args, **kwargs)
            cache[cache_key] = (result, time.time())
            
            return result
        
        return wrapper
    return decorator


def log_request(fn):
    """
    Decorator to log incoming requests for debugging
    
    Usage:
        @log_request
        def my_route():
            return jsonify({"message": "Success"})
    
    Args:
        fn: Function to decorate
        
    Returns:
        Decorated function with logging
    """
    @wraps(fn)
    def wrapper(*args, **kwargs):
        print(f"[{datetime.now().isoformat()}] {request.method} {request.path}")
        print(f"Headers: {dict(request.headers)}")
        if request.is_json:
            print(f"JSON Body: {request.get_json()}")
        
        result = fn(*args, **kwargs)
        
        print(f"Response Status: {result[1] if isinstance(result, tuple) else 200}")
        
        return result
    
    return wrapper
