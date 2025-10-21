"""
Analytics Service
Business logic for generating expense analytics and reports
"""

from app.extensions import db
from app.models import Expense, Category, PaymentMode
from sqlalchemy import func, and_
from datetime import datetime, date, timedelta
from collections import defaultdict


class AnalyticsService:
    """
    Service class for analytics and reporting operations
    Handles data aggregation for charts and dashboards
    """
    
    @staticmethod
    def get_category_breakdown(user_id, start_date=None, end_date=None):
        """
        Get expense breakdown by category
        
        Args:
            user_id (int): User ID
            start_date (date, optional): Filter start date
            end_date (date, optional): Filter end date
            
        Returns:
            list: List of dicts with category data
        """
        try:
            # Build query
            query = db.session.query(
                Category.name,
                Category.color,
                Category.icon,
                func.sum(Expense.amount).label('total'),
                func.count(Expense.id).label('count')
            ).join(Expense, Category.id == Expense.category_id) \
             .filter(Expense.user_id == user_id)
            
            # Apply date filters
            if start_date:
                query = query.filter(Expense.expense_date >= start_date)
            
            if end_date:
                query = query.filter(Expense.expense_date <= end_date)
            
            # Group and order
            results = query.group_by(Category.id, Category.name, Category.color, Category.icon) \
                          .order_by(func.sum(Expense.amount).desc()) \
                          .all()
            
            # Format results
            data = []
            total_sum = sum(float(row.total) for row in results)
            
            for row in results:
                amount = float(row.total)
                percentage = (amount / total_sum * 100) if total_sum > 0 else 0
                
                data.append({
                    'category': row.name,
                    'color': row.color,
                    'icon': row.icon,
                    'total': amount,
                    'count': row.count,
                    'percentage': round(percentage, 2)
                })
            
            return data
            
        except Exception as e:
            print(f"Category breakdown error: {str(e)}")
            return []
    
    @staticmethod
    def get_payment_mode_breakdown(user_id, start_date=None, end_date=None):
        """
        Get expense breakdown by payment mode
        
        Args:
            user_id (int): User ID
            start_date (date, optional): Filter start date
            end_date (date, optional): Filter end date
            
        Returns:
            list: List of dicts with payment mode data
        """
        try:
            # Build query
            query = db.session.query(
                PaymentMode.name,
                PaymentMode.bank_name,
                PaymentMode.type,
                func.sum(Expense.amount).label('total'),
                func.count(Expense.id).label('count')
            ).join(Expense, PaymentMode.id == Expense.payment_mode_id) \
             .filter(Expense.user_id == user_id)
            
            # Apply date filters
            if start_date:
                query = query.filter(Expense.expense_date >= start_date)
            
            if end_date:
                query = query.filter(Expense.expense_date <= end_date)
            
            # Group and order
            results = query.group_by(
                PaymentMode.id,
                PaymentMode.name,
                PaymentMode.bank_name,
                PaymentMode.type
            ).order_by(func.sum(Expense.amount).desc()).all()
            
            # Format results
            data = []
            total_sum = sum(float(row.total) for row in results)
            
            for row in results:
                amount = float(row.total)
                percentage = (amount / total_sum * 100) if total_sum > 0 else 0
                display_name = f"{row.name} - {row.bank_name}" if row.bank_name else row.name
                
                data.append({
                    'payment_mode': display_name,
                    'type': row.type,
                    'total': amount,
                    'count': row.count,
                    'percentage': round(percentage, 2)
                })
            
            return data
            
        except Exception as e:
            print(f"Payment mode breakdown error: {str(e)}")
            return []
    
    @staticmethod
    def get_payment_vs_category_matrix(user_id, start_date=None, end_date=None):
        """
        Get cross-tabulation of payment modes vs categories
        
        Args:
            user_id (int): User ID
            start_date (date, optional): Filter start date
            end_date (date, optional): Filter end date
            
        Returns:
            list: Matrix data for visualization
        """
        try:
            # Build query
            query = db.session.query(
                Category.name.label('category'),
                PaymentMode.name.label('payment_mode'),
                PaymentMode.bank_name,
                func.sum(Expense.amount).label('total')
            ).join(Expense, Category.id == Expense.category_id) \
             .join(PaymentMode, Expense.payment_mode_id == PaymentMode.id) \
             .filter(Expense.user_id == user_id)
            
            # Apply date filters
            if start_date:
                query = query.filter(Expense.expense_date >= start_date)
            
            if end_date:
                query = query.filter(Expense.expense_date <= end_date)
            
            # Group by both dimensions
            results = query.group_by(
                Category.name,
                PaymentMode.name,
                PaymentMode.bank_name
            ).all()
            
            # Build matrix structure
            matrix = defaultdict(dict)
            for row in results:
                payment_display = f"{row.payment_mode} - {row.bank_name}" if row.bank_name else row.payment_mode
                matrix[row.category][payment_display] = float(row.total)
            
            # Convert to list format
            data = [
                {
                    'category': category,
                    'payments': dict(payments)
                }
                for category, payments in matrix.items()
            ]
            
            return data
            
        except Exception as e:
            print(f"Matrix calculation error: {str(e)}")
            return []
    
    @staticmethod
    def get_daily_trend(user_id, days=7):
        """
        Get daily expense trend
        
        Args:
            user_id (int): User ID
            days (int): Number of days to look back
            
        Returns:
            list: Daily totals
        """
        try:
            # Calculate date range
            end_date = date.today()
            start_date = end_date - timedelta(days=days-1)
            
            # Query daily totals
            results = db.session.query(
                Expense.expense_date,
                func.sum(Expense.amount).label('total')
            ).filter(
                and_(
                    Expense.user_id == user_id,
                    Expense.expense_date >= start_date,
                    Expense.expense_date <= end_date
                )
            ).group_by(Expense.expense_date) \
             .order_by(Expense.expense_date) \
             .all()
            
            # Create lookup dictionary
            expense_dict = {row.expense_date: float(row.total) for row in results}
            
            # Fill in all dates (including days with no expenses)
            data = []
            current_date = start_date
            while current_date <= end_date:
                data.append({
                    'date': current_date.isoformat(),
                    'total': expense_dict.get(current_date, 0),
                    'day_name': current_date.strftime('%A')
                })
                current_date += timedelta(days=1)
            
            return data
            
        except Exception as e:
            print(f"Daily trend error: {str(e)}")
            return []
    
    @staticmethod
    def get_monthly_summary(user_id, year=None):
        """
        Get monthly expense summary for a year
        
        Args:
            user_id (int): User ID
            year (int, optional): Year to analyze (defaults to current year)
            
        Returns:
            list: Monthly totals
        """
        try:
            if year is None:
                year = date.today().year
            
            # Query monthly totals
            results = db.session.query(
                func.extract('month', Expense.expense_date).label('month'),
                func.sum(Expense.amount).label('total'),
                func.count(Expense.id).label('count')
            ).filter(
                and_(
                    Expense.user_id == user_id,
                    func.extract('year', Expense.expense_date) == year
                )
            ).group_by(func.extract('month', Expense.expense_date)) \
             .order_by(func.extract('month', Expense.expense_date)) \
             .all()
            
            # Month names
            month_names = [
                "January", "February", "March", "April", "May", "June",
                "July", "August", "September", "October", "November", "December"
            ]
            
            # Create lookup dictionary
            expense_dict = {int(row.month): {'total': float(row.total), 'count': row.count} for row in results}
            
            # Fill all 12 months
            data = []
            for i in range(12):
                month_num = i + 1
                month_data = expense_dict.get(month_num, {'total': 0, 'count': 0})
                
                data.append({
                    'month': month_names[i],
                    'month_number': month_num,
                    'total': month_data['total'],
                    'count': month_data['count']
                })
            
            return data
            
        except Exception as e:
            print(f"Monthly summary error: {str(e)}")
            return []
    
    @staticmethod
    def get_top_expenses(user_id, limit=10, start_date=None, end_date=None):
        """
        Get top N expenses by amount
        
        Args:
            user_id (int): User ID
            limit (int): Number of results
            start_date (date, optional): Filter start date
            end_date (date, optional): Filter end date
            
        Returns:
            list: Top expenses
        """
        try:
            query = Expense.query.filter_by(user_id=user_id)
            
            if start_date:
                query = query.filter(Expense.expense_date >= start_date)
            
            if end_date:
                query = query.filter(Expense.expense_date <= end_date)
            
            expenses = query.order_by(Expense.amount.desc()).limit(limit).all()
            
            return [expense.to_dict(include_relations=True) for expense in expenses]
            
        except Exception:
            return []
    
    @staticmethod
    def get_spending_insights(user_id, days=30):
        """
        Generate spending insights and statistics
        
        Args:
            user_id (int): User ID
            days (int): Number of days to analyze
            
        Returns:
            dict: Insights and statistics
        """
        try:
            end_date = date.today()
            start_date = end_date - timedelta(days=days)
            
            # Total spending
            total = db.session.query(func.sum(Expense.amount)) \
                             .filter(Expense.user_id == user_id) \
                             .filter(Expense.expense_date >= start_date) \
                             .scalar() or 0
            
            # Daily average
            daily_avg = float(total) / days if days > 0 else 0
            
            # Highest category
            top_category = db.session.query(
                Category.name,
                func.sum(Expense.amount).label('total')
            ).join(Expense) \
             .filter(Expense.user_id == user_id) \
             .filter(Expense.expense_date >= start_date) \
             .group_by(Category.name) \
             .order_by(func.sum(Expense.amount).desc()) \
             .first()
            
            # Most used payment mode
            top_payment = db.session.query(
                PaymentMode.name,
                PaymentMode.bank_name,
                func.count(Expense.id).label('count')
            ).join(Expense) \
             .filter(Expense.user_id == user_id) \
             .filter(Expense.expense_date >= start_date) \
             .group_by(PaymentMode.name, PaymentMode.bank_name) \
             .order_by(func.count(Expense.id).desc()) \
             .first()
            
            return {
                'period_days': days,
                'total_spent': float(total),
                'daily_average': round(daily_avg, 2),
                'top_category': {
                    'name': top_category.name if top_category else None,
                    'amount': float(top_category.total) if top_category else 0
                },
                'most_used_payment': {
                    'name': f"{top_payment.name} - {top_payment.bank_name}" if top_payment and top_payment.bank_name else (top_payment.name if top_payment else None),
                    'usage_count': top_payment.count if top_payment else 0
                }
            }
            
        except Exception as e:
            print(f"Insights error: {str(e)}")
            return {}
