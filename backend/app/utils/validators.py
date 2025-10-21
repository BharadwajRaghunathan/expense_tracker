"""
Input Validators
Reusable validation functions for data sanitization and verification
"""

import re
from datetime import datetime, date
from typing import Tuple, Any, Optional, List


def validate_email(email: str) -> Tuple[bool, str]:
    """
    Validate email address format
    
    Args:
        email (str): Email address to validate
        
    Returns:
        tuple: (is_valid: bool, error_message: str)
    """
    if not email or not isinstance(email, str):
        return False, "Email is required"
    
    email = email.strip()
    
    if len(email) > 254:
        return False, "Email is too long"
    
    # RFC 5322 compliant email regex
    pattern = r'^[a-zA-Z0-9.!#$%&\'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$'
    
    if not re.match(pattern, email):
        return False, "Invalid email format"
    
    return True, ""


def validate_password(password: str, min_length: int = 6, max_length: int = 128) -> Tuple[bool, str]:
    """
    Validate password strength
    
    Args:
        password (str): Password to validate
        min_length (int): Minimum password length
        max_length (int): Maximum password length
        
    Returns:
        tuple: (is_valid: bool, error_message: str)
    """
    if not password or not isinstance(password, str):
        return False, "Password is required"
    
    if len(password) < min_length:
        return False, f"Password must be at least {min_length} characters long"
    
    if len(password) > max_length:
        return False, f"Password is too long (maximum {max_length} characters)"
    
    # Optional: Add complexity requirements
    # has_uppercase = any(c.isupper() for c in password)
    # has_lowercase = any(c.islower() for c in password)
    # has_digit = any(c.isdigit() for c in password)
    # has_special = any(c in "!@#$%^&*()_+-=[]{}|;:,.<>?" for c in password)
    
    return True, ""


def validate_amount(amount: Any, min_value: float = 0.01, max_value: float = 99999999.99) -> Tuple[bool, Any]:
    """
    Validate and sanitize monetary amount
    
    Args:
        amount: Amount value to validate
        min_value (float): Minimum allowed amount
        max_value (float): Maximum allowed amount
        
    Returns:
        tuple: (is_valid: bool, validated_amount_or_error: float|str)
    """
    if amount is None:
        return False, "Amount is required"
    
    try:
        amount = float(amount)
    except (ValueError, TypeError):
        return False, "Invalid amount format. Must be a number"
    
    if amount < min_value:
        return False, f"Amount must be at least {min_value}"
    
    if amount > max_value:
        return False, f"Amount is too large (maximum {max_value})"
    
    # Round to 2 decimal places
    amount = round(amount, 2)
    
    return True, amount


def validate_date(date_str: str, date_format: str = '%Y-%m-%d') -> Tuple[bool, Any]:
    """
    Validate and parse date string
    
    Args:
        date_str (str): Date string to validate
        date_format (str): Expected date format
        
    Returns:
        tuple: (is_valid: bool, parsed_date_or_error: date|str)
    """
    if not date_str or not isinstance(date_str, str):
        return False, "Date is required"
    
    try:
        parsed_date = datetime.strptime(date_str, date_format).date()
    except ValueError:
        return False, f"Invalid date format. Expected format: {date_format}"
    
    # Check if date is not in future
    if parsed_date > date.today():
        return False, "Date cannot be in the future"
    
    # Optional: Check if date is not too old (e.g., 10 years)
    from datetime import timedelta
    ten_years_ago = date.today() - timedelta(days=365*10)
    if parsed_date < ten_years_ago:
        return False, "Date is too old (maximum 10 years ago)"
    
    return True, parsed_date


def validate_string(value: Any, field_name: str, min_length: int = 1, max_length: int = 255, 
                    required: bool = True) -> Tuple[bool, str]:
    """
    Validate string field with length constraints
    
    Args:
        value: Value to validate
        field_name (str): Name of field for error messages
        min_length (int): Minimum string length
        max_length (int): Maximum string length
        required (bool): Whether field is required
        
    Returns:
        tuple: (is_valid: bool, error_message: str)
    """
    if value is None or (isinstance(value, str) and not value.strip()):
        if required:
            return False, f"{field_name} is required"
        return True, ""
    
    if not isinstance(value, str):
        return False, f"{field_name} must be a string"
    
    value = value.strip()
    
    if len(value) < min_length:
        return False, f"{field_name} must be at least {min_length} characters long"
    
    if len(value) > max_length:
        return False, f"{field_name} is too long (maximum {max_length} characters)"
    
    return True, ""


def validate_integer(value: Any, field_name: str, min_value: Optional[int] = None, 
                     max_value: Optional[int] = None) -> Tuple[bool, Any]:
    """
    Validate integer field
    
    Args:
        value: Value to validate
        field_name (str): Name of field for error messages
        min_value (int, optional): Minimum allowed value
        max_value (int, optional): Maximum allowed value
        
    Returns:
        tuple: (is_valid: bool, validated_value_or_error: int|str)
    """
    if value is None:
        return False, f"{field_name} is required"
    
    try:
        value = int(value)
    except (ValueError, TypeError):
        return False, f"{field_name} must be an integer"
    
    if min_value is not None and value < min_value:
        return False, f"{field_name} must be at least {min_value}"
    
    if max_value is not None and value > max_value:
        return False, f"{field_name} must be at most {max_value}"
    
    return True, value


def validate_required_fields(data: dict, required_fields: List[str]) -> Tuple[bool, str]:
    """
    Check if all required fields are present in data dictionary
    
    Args:
        data (dict): Data dictionary to validate
        required_fields (list): List of required field names
        
    Returns:
        tuple: (is_valid: bool, error_message: str)
    """
    if not isinstance(data, dict):
        return False, "Invalid data format"
    
    missing_fields = []
    
    for field in required_fields:
        if field not in data or data[field] is None or (isinstance(data[field], str) and not data[field].strip()):
            missing_fields.append(field)
    
    if missing_fields:
        return False, f"Missing required fields: {', '.join(missing_fields)}"
    
    return True, ""


def validate_choice(value: Any, field_name: str, choices: List[Any]) -> Tuple[bool, str]:
    """
    Validate that value is one of allowed choices
    
    Args:
        value: Value to validate
        field_name (str): Name of field for error messages
        choices (list): List of allowed values
        
    Returns:
        tuple: (is_valid: bool, error_message: str)
    """
    if value is None:
        return False, f"{field_name} is required"
    
    if value not in choices:
        return False, f"{field_name} must be one of: {', '.join(map(str, choices))}"
    
    return True, ""


def validate_id(value: Any, field_name: str = "ID") -> Tuple[bool, Any]:
    """
    Validate database ID (positive integer)
    
    Args:
        value: Value to validate
        field_name (str): Name of field for error messages
        
    Returns:
        tuple: (is_valid: bool, validated_id_or_error: int|str)
    """
    if value is None:
        return False, f"{field_name} is required"
    
    try:
        value = int(value)
    except (ValueError, TypeError):
        return False, f"Invalid {field_name} format"
    
    if value <= 0:
        return False, f"{field_name} must be a positive integer"
    
    return True, value


def sanitize_string(value: str) -> str:
    """
    Sanitize string input by removing dangerous characters
    
    Args:
        value (str): String to sanitize
        
    Returns:
        str: Sanitized string
    """
    if not isinstance(value, str):
        return ""
    
    # Strip whitespace
    value = value.strip()
    
    # Remove null bytes
    value = value.replace('\x00', '')
    
    # Remove control characters except newlines and tabs
    value = ''.join(char for char in value if char.isprintable() or char in '\n\t')
    
    return value


def validate_phone_number(phone: str, country_code: str = 'IN') -> Tuple[bool, str]:
    """
    Validate phone number format
    
    Args:
        phone (str): Phone number to validate
        country_code (str): Country code for validation rules
        
    Returns:
        tuple: (is_valid: bool, error_message: str)
    """
    if not phone or not isinstance(phone, str):
        return False, "Phone number is required"
    
    # Remove spaces and dashes
    phone = phone.replace(' ', '').replace('-', '').replace('(', '').replace(')', '')
    
    if country_code == 'IN':
        # Indian phone number: 10 digits starting with 6-9
        pattern = r'^[6-9]\d{9}$'
        if not re.match(pattern, phone):
            return False, "Invalid Indian phone number format (must be 10 digits starting with 6-9)"
    else:
        # Generic validation: 7-15 digits
        if not phone.isdigit() or len(phone) < 7 or len(phone) > 15:
            return False, "Invalid phone number format"
    
    return True, ""


def validate_url(url: str) -> Tuple[bool, str]:
    """
    Validate URL format
    
    Args:
        url (str): URL to validate
        
    Returns:
        tuple: (is_valid: bool, error_message: str)
    """
    if not url or not isinstance(url, str):
        return False, "URL is required"
    
    # Basic URL regex pattern
    pattern = r'^https?:\/\/(www\.)?[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_\+.~#?&//=]*)$'
    
    if not re.match(pattern, url):
        return False, "Invalid URL format"
    
    return True, ""
