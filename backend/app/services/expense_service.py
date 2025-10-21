"""
Expense Service
Business logic for expense management operations
"""

from app.extensions import db
from app.models import Expense, Category, PaymentMode
from datetime import datetime, date
from sqlalchemy import func, and_


class ExpenseService:
    """
    Service class for expense-related operations
    Handles CRUD operations, validation, and calculations
    """
    
    @staticmethod
    def validate_amount(amount):
        """
        Validate expense amount
        
        Args:
            amount: Amount value to validate
            
        Returns:
            tuple: (is_valid: bool, validated_amount_or_error: float|str)
        """
        try:
            amount = float(amount)
            
            if amount <= 0:
                return False, "Amount must be greater than 0"
            
            if amount > 99999999.99:
                return False, "Amount is too large"
            
            return True, round(amount, 2)
            
        except (ValueError, TypeError):
            return False, "Invalid amount format"
    
    @staticmethod
    def validate_description(description):
        """
        Validate expense description
        
        Args:
            description (str): Description text
            
        Returns:
            tuple: (is_valid: bool, error_message: str)
        """
        if not description or not description.strip():
            return False, "Description is required"
        
        description = description.strip()
        
        if len(description) < 3:
            return False, "Description must be at least 3 characters long"
        
        if len(description) > 255:
            return False, "Description is too long (maximum 255 characters)"
        
        return True, ""
    
    @staticmethod
    def validate_date(date_str):
        """
        Validate and parse expense date
        
        Args:
            date_str (str): Date string in YYYY-MM-DD format
            
        Returns:
            tuple: (is_valid: bool, date_or_error: date|str)
        """
        try:
            parsed_date = datetime.strptime(date_str, '%Y-%m-%d').date()
            
            # Check if date is not in future
            if parsed_date > date.today():
                return False, "Expense date cannot be in the future"
            
            # Check if date is not too old (optional: 5 years limit)
            from datetime import timedelta
            five_years_ago = date.today() - timedelta(days=365*5)
            if parsed_date < five_years_ago:
                return False, "Expense date is too old"
            
            return True, parsed_date
            
        except ValueError:
            return False, "Invalid date format. Use YYYY-MM-DD"
    
    @staticmethod
    def create_expense(user_id, category_id, payment_mode_id, amount, description, expense_date=None):
        """
        Create a new expense record
        
        Args:
            user_id (int): User ID
            category_id (int): Category ID
            payment_mode_id (int): Payment mode ID
            amount (float): Expense amount
            description (str): Expense description
            expense_date (date, optional): Date of expense
            
        Returns:
            tuple: (success: bool, expense_or_error: Expense|str)
        """
        try:
            # Validate amount
            is_valid, validated_amount = ExpenseService.validate_amount(amount)
            if not is_valid:
                return False, validated_amount
            
            # Validate description
            is_valid, error_msg = ExpenseService.validate_description(description)
            if not is_valid:
                return False, error_msg
            
            description = description.strip()
            
            # Verify category exists and is active
            category = Category.query.get(category_id)
            if not category:
                return False, "Invalid category"
            if not category.is_active:
                return False, "Selected category is inactive"
            
            # Verify payment mode exists and is active
            payment_mode = PaymentMode.query.get(payment_mode_id)
            if not payment_mode:
                return False, "Invalid payment mode"
            if not payment_mode.is_active:
                return False, "Selected payment mode is inactive"
            
            # Use today if date not provided
            if expense_date is None:
                expense_date = date.today()
            
            # Create new expense
            new_expense = Expense(
                user_id=user_id,
                category_id=category_id,
                payment_mode_id=payment_mode_id,
                amount=validated_amount,
                description=description,
                expense_date=expense_date
            )
            
            # Save to database
            db.session.add(new_expense)
            db.session.commit()
            
            return True, new_expense
            
        except Exception as e:
            db.session.rollback()
            return False, f"Failed to create expense: {str(e)}"
    
    @staticmethod
    def get_expense_by_id(expense_id, user_id):
        """
        Get expense by ID (with user ownership check)
        
        Args:
            expense_id (int): Expense ID
            user_id (int): User ID for ownership verification
            
        Returns:
            Expense|None: Expense object if found and owned by user
        """
        try:
            return Expense.query.filter_by(id=expense_id, user_id=user_id).first()
        except Exception:
            return None
    
    @staticmethod
    def get_user_expenses(user_id, start_date=None, end_date=None, category_id=None, 
                         payment_mode_id=None, limit=50, offset=0):
        """
        Get list of user expenses with filters
        
        Args:
            user_id (int): User ID
            start_date (date, optional): Filter start date
            end_date (date, optional): Filter end date
            category_id (int, optional): Filter by category
            payment_mode_id (int, optional): Filter by payment mode
            limit (int): Maximum number of results
            offset (int): Pagination offset
            
        Returns:
            tuple: (expenses: list, total_count: int)
        """
        try:
            # Build query
            query = Expense.query.filter_by(user_id=user_id)
            
            # Apply filters
            if start_date:
                query = query.filter(Expense.expense_date >= start_date)
            
            if end_date:
                query = query.filter(Expense.expense_date <= end_date)
            
            if category_id:
                query = query.filter(Expense.category_id == category_id)
            
            if payment_mode_id:
                query = query.filter(Expense.payment_mode_id == payment_mode_id)
            
            # Get total count
            total_count = query.count()
            
            # Apply pagination and ordering
            expenses = query.order_by(
                Expense.expense_date.desc(),
                Expense.created_at.desc()
            ).limit(limit).offset(offset).all()
            
            return expenses, total_count
            
        except Exception:
            return [], 0
    
    @staticmethod
    def update_expense(expense_id, user_id, **kwargs):
        """
        Update an existing expense
        
        Args:
            expense_id (int): Expense ID
            user_id (int): User ID for ownership verification
            **kwargs: Fields to update (category_id, payment_mode_id, amount, description, expense_date)
            
        Returns:
            tuple: (success: bool, expense_or_error: Expense|str)
        """
        try:
            # Find expense
            expense = ExpenseService.get_expense_by_id(expense_id, user_id)
            
            if not expense:
                return False, "Expense not found"
            
            # Update category if provided
            if 'category_id' in kwargs:
                category = Category.query.get(kwargs['category_id'])
                if not category:
                    return False, "Invalid category"
                expense.category_id = kwargs['category_id']
            
            # Update payment mode if provided
            if 'payment_mode_id' in kwargs:
                payment_mode = PaymentMode.query.get(kwargs['payment_mode_id'])
                if not payment_mode:
                    return False, "Invalid payment mode"
                expense.payment_mode_id = kwargs['payment_mode_id']
            
            # Update amount if provided
            if 'amount' in kwargs:
                is_valid, validated_amount = ExpenseService.validate_amount(kwargs['amount'])
                if not is_valid:
                    return False, validated_amount
                expense.amount = validated_amount
            
            # Update description if provided
            if 'description' in kwargs:
                is_valid, error_msg = ExpenseService.validate_description(kwargs['description'])
                if not is_valid:
                    return False, error_msg
                expense.description = kwargs['description'].strip()
            
            # Update date if provided
            if 'expense_date' in kwargs:
                expense.expense_date = kwargs['expense_date']
            
            # Save changes
            db.session.commit()
            
            return True, expense
            
        except Exception as e:
            db.session.rollback()
            return False, f"Failed to update expense: {str(e)}"
    
    @staticmethod
    def delete_expense(expense_id, user_id):
        """
        Delete an expense
        
        Args:
            expense_id (int): Expense ID
            user_id (int): User ID for ownership verification
            
        Returns:
            tuple: (success: bool, message: str)
        """
        try:
            # Find expense
            expense = ExpenseService.get_expense_by_id(expense_id, user_id)
            
            if not expense:
                return False, "Expense not found"
            
            # Delete expense
            db.session.delete(expense)
            db.session.commit()
            
            return True, "Expense deleted successfully"
            
        except Exception as e:
            db.session.rollback()
            return False, f"Failed to delete expense: {str(e)}"
    
    @staticmethod
    def get_expense_summary(user_id, start_date=None, end_date=None):
        """
        Calculate expense summary statistics
        
        Args:
            user_id (int): User ID
            start_date (date, optional): Filter start date
            end_date (date, optional): Filter end date
            
        Returns:
            dict: Summary statistics
        """
        try:
            # Build base query
            query = Expense.query.filter_by(user_id=user_id)
            
            if start_date:
                query = query.filter(Expense.expense_date >= start_date)
            
            if end_date:
                query = query.filter(Expense.expense_date <= end_date)
            
            # Calculate total
            total_amount = query.with_entities(func.sum(Expense.amount)).scalar() or 0
            
            # Count expenses
            total_expenses = query.count()
            
            # Calculate today's total
            today = date.today()
            today_total = Expense.query.filter(
                and_(
                    Expense.user_id == user_id,
                    Expense.expense_date == today
                )
            ).with_entities(func.sum(Expense.amount)).scalar() or 0
            
            # Calculate average
            average_amount = float(total_amount) / total_expenses if total_expenses > 0 else 0
            
            return {
                'total_amount': float(total_amount),
                'total_expenses': total_expenses,
                'today_total': float(today_total),
                'average_amount': round(average_amount, 2)
            }
            
        except Exception:
            return {
                'total_amount': 0,
                'total_expenses': 0,
                'today_total': 0,
                'average_amount': 0
            }
    
    @staticmethod
    def get_all_categories():
        """
        Get all active categories
        
        Returns:
            list: List of Category objects
        """
        try:
            return Category.query.filter_by(is_active=True).order_by(Category.name).all()
        except Exception:
            return []
    
    @staticmethod
    def get_all_payment_modes():
        """
        Get all active payment modes
        
        Returns:
            list: List of PaymentMode objects
        """
        try:
            return PaymentMode.query.filter_by(is_active=True).order_by(PaymentMode.name).all()
        except Exception:
            return []
