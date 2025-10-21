"""
Analytics Routes
Provides data for graphs, charts, and dashboard visualizations
"""


from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from app.extensions import db
from app.models import Expense, Category, PaymentMode
from sqlalchemy import func
from datetime import datetime, date, timedelta
from collections import defaultdict


# Create Blueprint
analytics_bp = Blueprint('analytics', __name__)


@analytics_bp.route('/categories-vs-expenses', methods=['GET'])
@jwt_required()
def categories_vs_expenses():
    """
    Get expense totals grouped by category with counts and percentages
    
    Query Parameters:
        - start_date: Filter start date (YYYY-MM-DD)
        - end_date: Filter end date (YYYY-MM-DD)
    
    Returns:
        JSON response with category-wise expense breakdown
    """
    try:
        current_user_id = get_jwt_identity()
        
        # Build query with COUNT
        query = db.session.query(
            Category.name,
            Category.color,
            func.sum(Expense.amount).label('total'),
            func.count(Expense.id).label('count')
        ).join(Expense, Category.id == Expense.category_id) \
         .filter(Expense.user_id == current_user_id)
        
        # Apply date filters
        start_date = request.args.get('start_date')
        end_date = request.args.get('end_date')
        
        if start_date:
            query = query.filter(Expense.expense_date >= start_date)
        
        if end_date:
            query = query.filter(Expense.expense_date <= end_date)
        
        # Group by category and order by total
        results = query.group_by(Category.name, Category.color) \
                      .order_by(func.sum(Expense.amount).desc()) \
                      .all()
        
        # ✅ FIXED: Convert to float BEFORE summing to avoid Decimal issues
        grand_total = float(sum(float(row.total) for row in results))
        
        # Format response with percentages
        data = [
            {
                "category": row.name,
                "color": row.color,
                "total": float(row.total),
                "count": row.count,
                "percentage": round((float(row.total) / grand_total * 100) if grand_total > 0 else 0, 2)
            }
            for row in results
        ]
        
        return jsonify({
            "data": data,
            "chart_type": "bar",
            "total": grand_total,
            "filters": {
                "start_date": start_date,
                "end_date": end_date
            }
        }), 200
        
    except Exception as e:
        print(f"❌ Analytics error (categories): {str(e)}")
        import traceback
        traceback.print_exc()
        return jsonify({"error": f"Failed to fetch analytics: {str(e)}"}), 500


@analytics_bp.route('/payment-modes-vs-expenses', methods=['GET'])
@jwt_required()
def payment_modes_vs_expenses():
    """
    Get expense totals grouped by payment mode with counts and percentages
    
    Query Parameters:
        - start_date: Filter start date (YYYY-MM-DD)
        - end_date: Filter end date (YYYY-MM-DD)
    
    Returns:
        JSON response with payment mode-wise expense breakdown
    """
    try:
        current_user_id = get_jwt_identity()
        
        # Build query with COUNT
        query = db.session.query(
            PaymentMode.name,
            PaymentMode.bank_name,
            func.sum(Expense.amount).label('total'),
            func.count(Expense.id).label('count')
        ).join(Expense, PaymentMode.id == Expense.payment_mode_id) \
         .filter(Expense.user_id == current_user_id)
        
        # Apply date filters
        start_date = request.args.get('start_date')
        end_date = request.args.get('end_date')
        
        if start_date:
            query = query.filter(Expense.expense_date >= start_date)
        
        if end_date:
            query = query.filter(Expense.expense_date <= end_date)
        
        # Group by payment mode
        results = query.group_by(PaymentMode.name, PaymentMode.bank_name) \
                      .order_by(func.sum(Expense.amount).desc()) \
                      .all()
        
        # ✅ FIXED: Convert to float BEFORE summing to avoid Decimal issues
        grand_total = float(sum(float(row.total) for row in results))
        
        # Format response with percentages
        data = [
            {
                "paymentmode": f"{row.name} - {row.bank_name}" if row.bank_name else row.name,
                "payment_mode": row.name,
                "bank_name": row.bank_name,
                "total": float(row.total),
                "count": row.count,
                "percentage": round((float(row.total) / grand_total * 100) if grand_total > 0 else 0, 2)
            }
            for row in results
        ]
        
        return jsonify({
            "data": data,
            "chart_type": "pie",
            "total": grand_total,
            "filters": {
                "start_date": start_date,
                "end_date": end_date
            }
        }), 200
        
    except Exception as e:
        print(f"❌ Analytics error (payment modes): {str(e)}")
        import traceback
        traceback.print_exc()
        return jsonify({"error": f"Failed to fetch analytics: {str(e)}"}), 500


@analytics_bp.route('/payment-modes-vs-categories', methods=['GET'])
@jwt_required()
def payment_modes_vs_categories():
    """
    Get expense breakdown by payment mode and category (matrix view)
    
    Query Parameters:
        - start_date: Filter start date (YYYY-MM-DD)
        - end_date: Filter end date (YYYY-MM-DD)
    
    Returns:
        JSON response with cross-tabulation of payment modes and categories
    """
    try:
        current_user_id = get_jwt_identity()
        
        # Build query with COUNT
        query = db.session.query(
            Category.name.label('category'),
            PaymentMode.name.label('payment_mode'),
            PaymentMode.bank_name,
            func.sum(Expense.amount).label('total'),
            func.count(Expense.id).label('count')
        ).join(Expense, Category.id == Expense.category_id) \
         .join(PaymentMode, Expense.payment_mode_id == PaymentMode.id) \
         .filter(Expense.user_id == current_user_id)
        
        # Apply date filters
        start_date = request.args.get('start_date')
        end_date = request.args.get('end_date')
        
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
        
        # Format as nested structure
        data = defaultdict(dict)
        for row in results:
            payment_display = f"{row.payment_mode} - {row.bank_name}" if row.bank_name else row.payment_mode
            data[row.category][payment_display] = {
                "total": float(row.total),
                "count": row.count
            }
        
        # Convert to list format for frontend
        formatted_data = [
            {
                "category": category,
                "payments": payments
            }
            for category, payments in data.items()
        ]
        
        return jsonify({
            "data": formatted_data,
            "chart_type": "stacked_bar",
            "filters": {
                "start_date": start_date,
                "end_date": end_date
            }
        }), 200
        
    except Exception as e:
        print(f"❌ Analytics error (cross-tab): {str(e)}")
        import traceback
        traceback.print_exc()
        return jsonify({"error": f"Failed to fetch analytics: {str(e)}"}), 500


@analytics_bp.route('/daily-trend', methods=['GET'])
@jwt_required()
def daily_trend():
    """
    Get daily expense trend for dashboard graph with day names
    
    Query Parameters:
        - days: Number of days to look back (default: 7)
    
    Returns:
        JSON response with daily expense totals and day names
    """
    try:
        current_user_id = get_jwt_identity()
        
        # Get number of days
        days = request.args.get('days', 7, type=int)
        
        # Calculate date range
        end_date = date.today()
        start_date = end_date - timedelta(days=days-1)
        
        # Query daily totals with COUNT
        results = db.session.query(
            Expense.expense_date,
            func.sum(Expense.amount).label('total'),
            func.count(Expense.id).label('count')
        ).filter(
            Expense.user_id == current_user_id,
            Expense.expense_date >= start_date,
            Expense.expense_date <= end_date
        ).group_by(Expense.expense_date) \
         .order_by(Expense.expense_date) \
         .all()
        
        # Create dictionary of results - ✅ FIXED: Convert Decimal to float
        expense_dict = {
            row.expense_date: {
                "total": float(row.total),
                "count": row.count
            } 
            for row in results
        }
        
        # Day name mapping
        day_names = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"]
        
        # Fill in missing dates with 0
        data = []
        current_date = start_date
        while current_date <= end_date:
            expense_data = expense_dict.get(current_date, {"total": 0.0, "count": 0})
            data.append({
                "date": current_date.isoformat(),
                "dayname": day_names[current_date.weekday()],
                "total": expense_data["total"],
                "count": expense_data["count"],
                "average": round(expense_data["total"] / expense_data["count"], 2) if expense_data["count"] > 0 else 0.0
            })
            current_date += timedelta(days=1)
        
        return jsonify({
            "data": data,
            "chart_type": "line",
            "period": f"Last {days} days"
        }), 200
        
    except Exception as e:
        print(f"❌ Analytics error (daily trend): {str(e)}")
        import traceback
        traceback.print_exc()
        return jsonify({"error": f"Failed to fetch trend: {str(e)}"}), 500


@analytics_bp.route('/monthly-summary', methods=['GET'])
@jwt_required()
def monthly_summary():
    """
    Get monthly expense summary for current year with counts and averages
    
    Returns:
        JSON response with monthly totals, counts, and averages
    """
    try:
        current_user_id = get_jwt_identity()
        
        # Get current year
        current_year = date.today().year
        
        # Query monthly totals with COUNT
        results = db.session.query(
            func.extract('month', Expense.expense_date).label('month'),
            func.sum(Expense.amount).label('total'),
            func.count(Expense.id).label('count'),
            func.avg(Expense.amount).label('average')
        ).filter(
            Expense.user_id == current_user_id,
            func.extract('year', Expense.expense_date) == current_year
        ).group_by(func.extract('month', Expense.expense_date)) \
         .order_by(func.extract('month', Expense.expense_date)) \
         .all()
        
        # Create month name mapping
        month_names = [
            "January", "February", "March", "April", "May", "June",
            "July", "August", "September", "October", "November", "December"
        ]
        
        # ✅ FIXED: Convert Decimal to float
        expense_dict = {
            int(row.month): {
                "total": float(row.total),
                "count": row.count,
                "average": round(float(row.average), 2) if row.average else 0.0
            }
            for row in results
        }
        
        data = [
            {
                "month": month_names[i],
                "month_number": i + 1,
                "total": expense_dict.get(i + 1, {}).get("total", 0.0),
                "count": expense_dict.get(i + 1, {}).get("count", 0),
                "average": expense_dict.get(i + 1, {}).get("average", 0.0)
            }
            for i in range(12)
        ]
        
        # Calculate year totals
        year_total = sum(month["total"] for month in data)
        year_count = sum(month["count"] for month in data)
        year_average = round(year_total / year_count, 2) if year_count > 0 else 0.0
        
        return jsonify({
            "data": data,
            "year": current_year,
            "chart_type": "bar",
            "summary": {
                "total": year_total,
                "count": year_count,
                "average": year_average
            }
        }), 200
        
    except Exception as e:
        print(f"❌ Analytics error (monthly summary): {str(e)}")
        import traceback
        traceback.print_exc()
        return jsonify({"error": f"Failed to fetch monthly summary: {str(e)}"}), 500
