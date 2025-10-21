"""
User Model - Handles user authentication and account management
Stores user credentials with secure password hashing
"""


from app.extensions import db
from werkzeug.security import generate_password_hash, check_password_hash
from datetime import datetime, timezone



class User(db.Model):
    """
    User model for authentication and user management
    
    Attributes:
        id: Primary key, auto-incrementing integer
        email: Unique email address for login (max 120 chars)
        password_hash: Bcrypt hashed password (never store plain passwords)
        full_name: Optional user's full name
        created_at: Timestamp when account was created
        updated_at: Timestamp when account was last modified
        is_active: Boolean flag for account status (soft delete)
    
    Relationships:
        expenses: One-to-many relationship with Expense model
    """
    
    __tablename__ = 'users'
    
    # Primary Key
    id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    
    # Authentication Fields
    email = db.Column(db.String(120), unique=True, nullable=False, index=True)
    password_hash = db.Column(db.String(255), nullable=False)
    
    # User Information
    full_name = db.Column(db.String(100), nullable=True)
    
    # Account Status
    is_active = db.Column(db.Boolean, default=True, nullable=False)
    
    # Timestamps (UTC)
    created_at = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)
    updated_at = db.Column(
        db.DateTime, 
        default=lambda: datetime.now(timezone.utc), 
        onupdate=lambda: datetime.now(timezone.utc),
        nullable=False
    )
    
    # Relationships
    expenses = db.relationship(
        'Expense', 
        backref='user', 
        lazy='dynamic',
        cascade='all, delete-orphan'
    )
    
    def __init__(self, email, password, full_name=None):
        """
        Initialize a new user with email and password
        
        Args:
            email (str): User's email address
            password (str): Plain text password (will be hashed)
            full_name (str, optional): User's full name
        """
        self.email = email
        self.set_password(password)
        self.full_name = full_name
    
    def set_password(self, password):
        """
        Hash and store password securely using Werkzeug's security module
        Uses PBKDF2 with SHA-256 by default
        
        Args:
            password (str): Plain text password to hash
        """
        self.password_hash = generate_password_hash(password)
    
    def check_password(self, password):
        """
        Verify password against stored hash
        
        Args:
            password (str): Plain text password to verify
            
        Returns:
            bool: True if password matches, False otherwise
        """
        return check_password_hash(self.password_hash, password)
    
    def to_dict(self):
        """
        Convert user object to dictionary (exclude sensitive data)
        Used for JSON serialization in API responses
        
        Returns:
            dict: User data without password_hash
        """
        # ✅ ADDED: Debug logging
        print(f"🔍 to_dict() called for user: {self.email}")
        print(f"🔍 full_name value: {self.full_name}")
        print(f"🔍 full_name type: {type(self.full_name)}")
        
        user_dict = {
            'id': self.id,
            'email': self.email,
            'full_name': self.full_name,
            'is_active': self.is_active,
            'created_at': self.created_at.isoformat(),
            'updated_at': self.updated_at.isoformat()
        }
        
        print(f"🔍 Returning user_dict: {user_dict}")
        return user_dict
    
    def __repr__(self):
        """String representation for debugging"""
        return f'<User {self.email}>'
