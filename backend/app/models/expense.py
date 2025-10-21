"""
Expense Model - Core expense tracking functionality
Stores individual expense transactions with all related data
"""

from app.extensions import db
from datetime import datetime, timezone
from sqlalchemy import func


class Expense(db.Model):
    """
    Expense model for tracking individual transactions
    
    Attributes:
        id: Primary key
        user_id: Foreign key to User model
        category_id: Foreign key to Category model
        payment_mode_id: Foreign key to PaymentMode model
        amount: Expense amount (decimal with 2 decimal places)
        description: Text description of the expense
        expense_date: Date of the expense transaction
        created_at: Timestamp when record was created
        updated_at: Timestamp when record was last modified
    
    Relationships:
        user: Many-to-one relationship with User model
        category: Many-to-one relationship with Category model
        payment_mode: Many-to-one relationship with PaymentMode model
    """
    
    __tablename__ = 'expenses'
    
    # Primary Key
    id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    
    # Foreign Keys
    user_id = db.Column(
        db.Integer, 
        db.ForeignKey('users.id', ondelete='CASCADE'), 
        nullable=False,
        index=True
    )
    category_id = db.Column(
        db.Integer, 
        db.ForeignKey('categories.id', ondelete='RESTRICT'), 
        nullable=False,
        index=True
    )
    payment_mode_id = db.Column(
        db.Integer, 
        db.ForeignKey('payment_modes.id', ondelete='RESTRICT'), 
        nullable=False,
        index=True
    )
    
    # Expense Details
    amount = db.Column(
        db.Numeric(10, 2), 
        nullable=False
    )  # Up to 99,999,999.99
    description = db.Column(db.String(255), nullable=False)
    
    # Date Fields
    expense_date = db.Column(db.Date, nullable=False, index=True)
    
    # Timestamps
    created_at = db.Column(
        db.DateTime, 
        default=lambda: datetime.now(timezone.utc), 
        nullable=False
    )
    updated_at = db.Column(
        db.DateTime, 
        default=lambda: datetime.now(timezone.utc), 
        onupdate=lambda: datetime.now(timezone.utc),
        nullable=False
    )
    
    # Indexes for better query performance
    __table_args__ = (
        db.Index('idx_user_date', 'user_id', 'expense_date'),
        db.Index('idx_user_category', 'user_id', 'category_id'),
        db.Index('idx_user_payment', 'user_id', 'payment_mode_id'),
    )
    
    def __init__(self, user_id, category_id, payment_mode_id, amount, description, expense_date=None):
        """
        Initialize a new expense record
        
        Args:
            user_id (int): ID of the user who created the expense
            category_id (int): ID of the expense category
            payment_mode_id (int): ID of the payment mode used
            amount (float): Expense amount
            description (str): Description of the expense
            expense_date (date, optional): Date of expense (defaults to today)
        """
        self.user_id = user_id
        self.category_id = category_id
        self.payment_mode_id = payment_mode_id
        self.amount = amount
        self.description = description
        self.expense_date = expense_date or datetime.now(timezone.utc).date()
    
    def to_dict(self, include_relations=True):
        """
        Convert expense to dictionary for JSON serialization
        
        Args:
            include_relations (bool): Whether to include related model data
            
        Returns:
            dict: Expense data with optional related data
        """
        data = {
            'id': self.id,
            'user_id': self.user_id,
            'category_id': self.category_id,
            'payment_mode_id': self.payment_mode_id,
            'amount': float(self.amount),
            'description': self.description,
            'expense_date': self.expense_date.isoformat(),
            'created_at': self.created_at.isoformat(),
            'updated_at': self.updated_at.isoformat()
        }
        
        # Include related model data if requested
        if include_relations:
            data['category'] = self.category.to_dict() if self.category else None
            data['payment_mode'] = self.payment_mode.to_dict() if self.payment_mode else None
        
        return data
    
    @staticmethod
    def get_total_by_user(user_id, start_date=None, end_date=None):
        """
        Calculate total expenses for a user within date range
        
        Args:
            user_id (int): User ID
            start_date (date, optional): Start date for filtering
            end_date (date, optional): End date for filtering
            
        Returns:
            float: Total expense amount
        """
        query = db.session.query(func.sum(Expense.amount)).filter(Expense.user_id == user_id)
        
        if start_date:
            query = query.filter(Expense.expense_date >= start_date)
        if end_date:
            query = query.filter(Expense.expense_date <= end_date)
        
        result = query.scalar()
        return float(result) if result else 0.0
    
    @staticmethod
    def get_total_by_category(user_id, category_id, start_date=None, end_date=None):
        """
        Calculate total expenses for a specific category
        
        Args:
            user_id (int): User ID
            category_id (int): Category ID
            start_date (date, optional): Start date for filtering
            end_date (date, optional): End date for filtering
            
        Returns:
            float: Total expense amount for category
        """
        query = db.session.query(func.sum(Expense.amount)).filter(
            Expense.user_id == user_id,
            Expense.category_id == category_id
        )
        
        if start_date:
            query = query.filter(Expense.expense_date >= start_date)
        if end_date:
            query = query.filter(Expense.expense_date <= end_date)
        
        result = query.scalar()
        return float(result) if result else 0.0
    
    @staticmethod
    def get_total_by_payment_mode(user_id, payment_mode_id, start_date=None, end_date=None):
        """
        Calculate total expenses for a specific payment mode
        
        Args:
            user_id (int): User ID
            payment_mode_id (int): Payment Mode ID
            start_date (date, optional): Start date for filtering
            end_date (date, optional): End date for filtering
            
        Returns:
            float: Total expense amount for payment mode
        """
        query = db.session.query(func.sum(Expense.amount)).filter(
            Expense.user_id == user_id,
            Expense.payment_mode_id == payment_mode_id
        )
        
        if start_date:
            query = query.filter(Expense.expense_date >= start_date)
        if end_date:
            query = query.filter(Expense.expense_date <= end_date)
        
        result = query.scalar()
        return float(result) if result else 0.0
    
    def __repr__(self):
        """String representation for debugging"""
        return f'<Expense {self.description[:20]} - ₹{self.amount}>'
