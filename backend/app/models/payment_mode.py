"""
PaymentMode Model - Manages payment methods
Includes GPay (with bank options), Cash, Metro Card, etc.
"""


from app.extensions import db
from datetime import datetime, timezone


class PaymentMode(db.Model):
    """
    Payment Mode model for tracking payment methods
    
    Attributes:
        id: Primary key
        name: Payment method name (e.g., GPay, Cash, Metro Card)
        bank_name: Optional bank name for digital payments (e.g., SBI, HDFC, IOB)
        icon: Optional icon for UI
        color: Optional color code for UI
        type: Payment type (digital, cash, card)
        is_active: Whether this payment mode is available
        created_at: Timestamp when payment mode was created
    
    Relationships:
        expenses: One-to-many relationship with Expense model
    """
    
    __tablename__ = 'payment_modes'
    
    # Primary Key
    id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    
    # Payment Mode Information
    name = db.Column(db.String(50), nullable=False, index=True)
    bank_name = db.Column(db.String(50), nullable=True)  # For GPay - SBI, HDFC, IOB
    
    # UI Configuration (for frontend styling)
    icon = db.Column(db.String(50), nullable=True)
    color = db.Column(db.String(7), nullable=True)  # Hex color code
    
    # Payment Type Classification
    type = db.Column(
        db.String(20), 
        nullable=False, 
        default='digital'
    )  # Options: 'digital', 'cash', 'card', 'other'
    
    # Status
    is_active = db.Column(db.Boolean, default=True, nullable=False)
    
    # Timestamp
    created_at = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)
    
    # Relationships
    expenses = db.relationship(
        'Expense', 
        backref='payment_mode', 
        lazy='dynamic',
        cascade='all, delete-orphan'
    )
    
    # Unique constraint: combination of name and bank_name must be unique
    __table_args__ = (
        db.UniqueConstraint('name', 'bank_name', name='unique_payment_mode'),
    )
    
    def __init__(self, name, bankname=None, type='digital', icon=None, color=None, **kwargs):
        """
        Initialize a new payment mode
        
        Args:
            name (str): Payment mode name
            bankname (str, optional): Bank name for GPay payments (maps to bank_name)
            type (str): Payment type classification
            icon (str, optional): Icon for UI
            color (str, optional): Color code for UI
            **kwargs: Accept any extra arguments and ignore them
        """
        self.name = name
        self.bank_name = bankname  # Map 'bankname' parameter to 'bank_name' attribute
        self.type = type
        self.icon = icon
        self.color = color
        # Ignore any extra kwargs
    
    def to_dict(self):
        """
        Convert payment mode to dictionary for JSON serialization
        
        Returns:
            dict: Payment mode data
        """
        return {
            'id': self.id,
            'name': self.name,
            'bank_name': self.bank_name,
            'icon': self.icon,
            'color': self.color,
            'type': self.type,
            'display_name': self.get_display_name(),
            'is_active': self.is_active,
            'created_at': self.created_at.isoformat()
        }
    
    def get_display_name(self):
        """
        Get formatted display name for frontend
        
        Returns:
            str: Formatted payment mode name (e.g., "GPay - SBI" or "Cash")
        """
        if self.bank_name:
            return f"{self.name} - {self.bank_name}"
        return self.name
    
    @staticmethod
    def get_default_payment_modes():
        """
        Returns list of default payment modes to seed database
        
        Returns:
            list: Default payment mode dictionaries
        """
        return [
            # GPay with different banks
            {'name': 'GPay', 'bankname': 'SBI', 'type': 'digital'},
            {'name': 'GPay', 'bankname': 'HDFC', 'type': 'digital'},
            {'name': 'GPay', 'bankname': 'IOB', 'type': 'digital'},
            
            # Other payment methods
            {'name': 'Cash', 'bankname': None, 'type': 'cash'},
            {'name': 'Metro Card', 'bankname': None, 'type': 'card'},
            {'name': 'Credit Card', 'bankname': None, 'type': 'card'},
            {'name': 'Debit Card', 'bankname': None, 'type': 'card'},
            {'name': 'Other', 'bankname': None, 'type': 'other'}
        ]
    
    def __repr__(self):
        """String representation for debugging"""
        return f'<PaymentMode {self.get_display_name()}>'
