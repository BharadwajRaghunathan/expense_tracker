"""
Category Model - Manages expense categories
Predefined categories: Travel, Food, Payments to Friends, etc.
"""

from app.extensions import db
from datetime import datetime, timezone


class Category(db.Model):
    """
    Category model for expense classification
    
    Attributes:
        id: Primary key
        name: Category name (e.g., Travel, Food, Payments to Friends)
        description: Optional detailed description of category
        icon: Optional icon identifier for frontend display
        color: Optional color code for UI visualization (e.g., #FF5733)
        is_active: Whether this category is available for selection
        created_at: Timestamp when category was created
    
    Relationships:
        expenses: One-to-many relationship with Expense model
    """
    
    __tablename__ = 'categories'
    
    # Primary Key
    id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    
    # Category Information
    name = db.Column(db.String(50), unique=True, nullable=False, index=True)
    description = db.Column(db.String(200), nullable=True)
    
    # UI Configuration (for frontend styling)
    icon = db.Column(db.String(50), nullable=True)  # e.g., 'travel', 'food', 'payment'
    color = db.Column(db.String(7), nullable=True)  # Hex color code
    
    # Status
    is_active = db.Column(db.Boolean, default=True, nullable=False)
    
    # Timestamp
    created_at = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)
    
    # Relationships
    expenses = db.relationship(
        'Expense', 
        backref='category', 
        lazy='dynamic',
        cascade='all, delete-orphan'
    )
    
    def __init__(self, name, description=None, icon=None, color=None):
        """
        Initialize a new category
        
        Args:
            name (str): Category name
            description (str, optional): Category description
            icon (str, optional): Icon identifier
            color (str, optional): Hex color code
        """
        self.name = name
        self.description = description
        self.icon = icon
        self.color = color
    
    def to_dict(self):
        """
        Convert category to dictionary for JSON serialization
        
        Returns:
            dict: Category data
        """
        return {
            'id': self.id,
            'name': self.name,
            'description': self.description,
            'icon': self.icon,
            'color': self.color,
            'is_active': self.is_active,
            'created_at': self.created_at.isoformat()
        }
    
    @staticmethod
    def get_default_categories():
        """
        Returns list of default categories to seed database
        
        Returns:
            list: Default category dictionaries
        """
        return [
            {'name': 'Travel', 'description': 'Transportation and travel expenses', 'icon': 'directions_car', 'color': '#4CAF50'},
            {'name': 'Food', 'description': 'Food and dining expenses', 'icon': 'restaurant', 'color': '#FF9800'},
            {'name': 'Payments to Friends', 'description': 'Money sent to friends', 'icon': 'people', 'color': '#2196F3'},
            {'name': 'Self Transfer to Accounts', 'description': 'Transfers between own accounts', 'icon': 'swap_horiz', 'color': '#9C27B0'},
            {'name': 'Wallet Recharge', 'description': 'Digital wallet top-ups', 'icon': 'account_balance_wallet', 'color': '#F44336'},
            {'name': 'Other', 'description': 'Miscellaneous expenses', 'icon': 'more_horiz', 'color': '#607D8B'}
        ]
    
    def __repr__(self):
        """String representation for debugging"""
        return f'<Category {self.name}>'
