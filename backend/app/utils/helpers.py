"""
Helper Functions
Utility functions for common operations like formatting, calculations, and responses
"""

from datetime import datetime, date, timedelta
from typing import Any, Dict, Optional, Tuple, List
from flask import jsonify


def format_currency(amount: float, currency_symbol: str = '₹') -> str:
    """
    Format amount as currency string
    
    Args:
        amount (float): Amount to format
        currency_symbol (str): Currency symbol
        
    Returns:
        str: Formatted currency string (e.g., "₹1,234.56")
    """
    try:
        amount = float(amount)
        formatted = f"{currency_symbol}{amount:,.2f}"
        return formatted
    except (ValueError, TypeError):
        return f"{currency_symbol}0.00"


def format_date(date_obj: date, format_str: str = '%Y-%m-%d') -> str:
    """
    Format date object as string
    
    Args:
        date_obj (date): Date object to format
        format_str (str): Desired date format
        
    Returns:
        str: Formatted date string
    """
    if not isinstance(date_obj, (date, datetime)):
        return ""
    
    try:
        return date_obj.strftime(format_str)
    except Exception:
        return str(date_obj)


def parse_date(date_str: str, format_str: str = '%Y-%m-%d') -> Optional[date]:
    """
    Parse date string to date object
    
    Args:
        date_str (str): Date string to parse
        format_str (str): Expected date format
        
    Returns:
        date|None: Parsed date object or None if invalid
    """
    if not date_str:
        return None
    
    try:
        return datetime.strptime(date_str, format_str).date()
    except ValueError:
        return None


def calculate_percentage(part: float, total: float) -> float:
    """
    Calculate percentage with zero-division handling
    
    Args:
        part (float): Part value
        total (float): Total value
        
    Returns:
        float: Percentage (rounded to 2 decimals)
    """
    try:
        if total == 0:
            return 0.0
        percentage = (float(part) / float(total)) * 100
        return round(percentage, 2)
    except (ValueError, TypeError, ZeroDivisionError):
        return 0.0


def get_date_range(period: str) -> Tuple[date, date]:
    """
    Get start and end dates for common periods
    
    Args:
        period (str): Period name ('today', 'yesterday', 'week', 'month', 'year')
        
    Returns:
        tuple: (start_date, end_date)
    """
    today = date.today()
    
    if period == 'today':
        return today, today
    
    elif period == 'yesterday':
        yesterday = today - timedelta(days=1)
        return yesterday, yesterday
    
    elif period == 'week':
        start = today - timedelta(days=7)
        return start, today
    
    elif period == 'month':
        start = today.replace(day=1)
        return start, today
    
    elif period == 'year':
        start = today.replace(month=1, day=1)
        return start, today
    
    elif period == 'last_30_days':
        start = today - timedelta(days=30)
        return start, today
    
    else:
        # Default: last 7 days
        start = today - timedelta(days=7)
        return start, today


def paginate_query(query, page: int = 1, per_page: int = 50):
    """
    Paginate SQLAlchemy query
    
    Args:
        query: SQLAlchemy query object
        page (int): Page number (1-indexed)
        per_page (int): Items per page
        
    Returns:
        dict: Pagination data with items and metadata
    """
    try:
        page = max(1, int(page))
        per_page = max(1, min(100, int(per_page)))  # Cap at 100
    except (ValueError, TypeError):
        page = 1
        per_page = 50
    
    # Get total count
    total_items = query.count()
    
    # Calculate pagination
    total_pages = (total_items + per_page - 1) // per_page
    offset = (page - 1) * per_page
    
    # Get items for current page
    items = query.limit(per_page).offset(offset).all()
    
    return {
        'items': items,
        'pagination': {
            'page': page,
            'per_page': per_page,
            'total_items': total_items,
            'total_pages': total_pages,
            'has_next': page < total_pages,
            'has_prev': page > 1
        }
    }


def success_response(data: Any = None, message: str = "Success", status_code: int = 200):
    """
    Create standardized success JSON response
    
    Args:
        data: Response data
        message (str): Success message
        status_code (int): HTTP status code
        
    Returns:
        tuple: (JSON response, status code)
    """
    response = {
        "success": True,
        "message": message
    }
    
    if data is not None:
        response["data"] = data
    
    return jsonify(response), status_code


def error_response(error: str, status_code: int = 400, details: Any = None):
    """
    Create standardized error JSON response
    
    Args:
        error (str): Error message
        status_code (int): HTTP status code
        details: Additional error details
        
    Returns:
        tuple: (JSON response, status code)
    """
    response = {
        "success": False,
        "error": error
    }
    
    if details is not None:
        response["details"] = details
    
    return jsonify(response), status_code


def get_current_timestamp() -> str:
    """
    Get current timestamp in ISO format
    
    Returns:
        str: ISO formatted timestamp
    """
    return datetime.now().isoformat()


def truncate_string(text: str, max_length: int = 50, suffix: str = "...") -> str:
    """
    Truncate string to maximum length
    
    Args:
        text (str): Text to truncate
        max_length (int): Maximum length
        suffix (str): Suffix to add if truncated
        
    Returns:
        str: Truncated string
    """
    if not text or not isinstance(text, str):
        return ""
    
    if len(text) <= max_length:
        return text
    
    return text[:max_length - len(suffix)] + suffix


def generate_slug(text: str) -> str:
    """
    Generate URL-safe slug from text
    
    Args:
        text (str): Text to convert to slug
        
    Returns:
        str: URL-safe slug
    """
    import re
    
    if not text:
        return ""
    
    # Convert to lowercase
    slug = text.lower()
    
    # Replace spaces with hyphens
    slug = slug.replace(' ', '-')
    
    # Remove non-alphanumeric characters (except hyphens)
    slug = re.sub(r'[^a-z0-9-]', '', slug)
    
    # Remove multiple consecutive hyphens
    slug = re.sub(r'-+', '-', slug)
    
    # Remove leading/trailing hyphens
    slug = slug.strip('-')
    
    return slug


def chunk_list(items: List, chunk_size: int = 100) -> List[List]:
    """
    Split list into chunks of specified size
    
    Args:
        items (list): List to chunk
        chunk_size (int): Size of each chunk
        
    Returns:
        list: List of chunks
    """
    chunks = []
    for i in range(0, len(items), chunk_size):
        chunks.append(items[i:i + chunk_size])
    return chunks


def safe_divide(numerator: float, denominator: float, default: float = 0.0) -> float:
    """
    Safely divide two numbers with zero-division handling
    
    Args:
        numerator (float): Numerator
        denominator (float): Denominator
        default (float): Default value if division fails
        
    Returns:
        float: Division result or default
    """
    try:
        if denominator == 0:
            return default
        return float(numerator) / float(denominator)
    except (ValueError, TypeError, ZeroDivisionError):
        return default


def merge_dicts(*dicts: Dict) -> Dict:
    """
    Merge multiple dictionaries
    
    Args:
        *dicts: Variable number of dictionaries to merge
        
    Returns:
        dict: Merged dictionary
    """
    result = {}
    for d in dicts:
        if isinstance(d, dict):
            result.update(d)
    return result


def get_month_name(month_number: int) -> str:
    """
    Get month name from month number
    
    Args:
        month_number (int): Month number (1-12)
        
    Returns:
        str: Month name
    """
    month_names = [
        "January", "February", "March", "April", "May", "June",
        "July", "August", "September", "October", "November", "December"
    ]
    
    try:
        index = int(month_number) - 1
        if 0 <= index < 12:
            return month_names[index]
    except (ValueError, TypeError):
        pass
    
    return "Unknown"


def is_valid_json(data: Any) -> bool:
    """
    Check if data is valid JSON-serializable
    
    Args:
        data: Data to check
        
    Returns:
        bool: True if JSON-serializable
    """
    import json
    try:
        json.dumps(data)
        return True
    except (TypeError, ValueError):
        return False
