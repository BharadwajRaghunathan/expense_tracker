"""
Expense Management Routes
Handles CRUD operations for expenses, categories, and payment modes
"""

from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity, get_jwt
from app.extensions import db
from app.models import Expense, Category, PaymentMode
from datetime import datetime, date
from sqlalchemy import func

# Create Blueprint
expenses_bp = Blueprint('expenses', __name__)


@expenses_bp.route('/add', methods=['POST'])
@jwt_required()
def add_expense():
    """
    Add a new expense
    
    Request Body:
        {
            "category_id": 1,
            "payment_mode_id": 2,
            "amount": 150.50,
            "description": "Lunch at restaurant",
            "expense_date": "2025-10-11" (optional, defaults to today)
        }
    
    Returns:
        JSON response with created expense data
    """
    try:
        current_user_id = get_jwt_identity()
        print("=" * 60)
        print("➕ ADD EXPENSE REQUEST")
        print("=" * 60)
        print(f"👤 User ID from token: {current_user_id}")
        print(f"🔑 Token claims: {get_jwt()}")
        
        data = request.get_json()
        if not data:
            print("❌ No data provided")
            return jsonify({"error": "No data provided"}), 400
        
        category_id = data.get('category_id')
        payment_mode_id = data.get('payment_mode_id')
        amount = data.get('amount')
        description = data.get('description', '').strip()
        expense_date_str = data.get('expense_date')
        
        print(f"📊 Expense data:")
        print(f"  - Category ID: {category_id}")
        print(f"  - Payment Mode ID: {payment_mode_id}")
        print(f"  - Amount: {amount}")
        print(f"  - Description: {description}")
        print(f"  - Date: {expense_date_str or 'Today'}")
        
        if not category_id:
            return jsonify({"error": "Category is required"}), 400
        if not payment_mode_id:
            return jsonify({"error": "Payment mode is required"}), 400
        if not amount:
            return jsonify({"error": "Amount is required"}), 400
        
        try:
            amount = float(amount)
            if amount <= 0:
                return jsonify({"error": "Amount must be greater than 0"}), 400
        except ValueError:
            return jsonify({"error": "Invalid amount format"}), 400
        
        if not description:
            return jsonify({"error": "Description is required"}), 400
        
        category = Category.query.get(category_id)
        if not category or not category.is_active:
            return jsonify({"error": "Invalid or inactive category"}), 400
        
        payment_mode = PaymentMode.query.get(payment_mode_id)
        if not payment_mode or not payment_mode.is_active:
            return jsonify({"error": "Invalid or inactive payment mode"}), 400
        
        if expense_date_str:
            try:
                expense_date = datetime.strptime(expense_date_str, '%Y-%m-%d').date()
            except ValueError:
                return jsonify({"error": "Invalid date format. Use YYYY-MM-DD"}), 400
        else:
            expense_date = date.today()
        
        new_expense = Expense(
            user_id=current_user_id,
            category_id=category_id,
            payment_mode_id=payment_mode_id,
            amount=amount,
            description=description,
            expense_date=expense_date
        )
        
        db.session.add(new_expense)
        db.session.commit()
        
        print(f"✅ Expense added: ID={new_expense.id}")
        print("=" * 60)
        
        return jsonify({
            "message": "Expense added successfully",
            "expense": new_expense.to_dict(include_relations=True)
        }), 201
        
    except Exception as e:
        print(f"❌ Add expense error: {str(e)}")
        print("=" * 60)
        db.session.rollback()
        return jsonify({"error": f"Failed to add expense: {str(e)}"}), 500


# ✅ FIXED: Changed from '/list' to '' so GET /api/expenses works
@expenses_bp.route('', methods=['GET'])
@jwt_required()
def get_expenses():
    """
    Get list of user's expenses with optional filters
    
    Query Parameters:
        - start_date: Filter by start date (YYYY-MM-DD)
        - end_date: Filter by end date (YYYY-MM-DD)
        - category_id: Filter by category
        - payment_mode_id: Filter by payment mode
        - limit: Number of results (default: 50)
        - offset: Pagination offset (default: 0)
    
    Returns:
        JSON response with list of expenses
    """
    try:
        print("=" * 60)
        print("📋 GET EXPENSES LIST REQUEST")
        print("=" * 60)
        
        auth_header = request.headers.get('Authorization')
        print(f"🔑 Authorization header received: {auth_header[:50] if auth_header else 'NONE'}...")
        
        current_user_id = get_jwt_identity()
        print(f"👤 User ID from token: {current_user_id}")
        
        jwt_claims = get_jwt()
        print(f"📧 Email from token: {jwt_claims.get('email', 'N/A')}")
        print(f"🔐 Token JTI: {jwt_claims.get('jti', 'N/A')}")
        
        query = Expense.query.filter_by(user_id=current_user_id)
        
        start_date = request.args.get('start_date')
        end_date = request.args.get('end_date')
        category_id = request.args.get('category_id')
        payment_mode_id = request.args.get('payment_mode_id')
        
        print(f"🔍 Filters applied:")
        print(f"  - start_date: {start_date or 'None'}")
        print(f"  - end_date: {end_date or 'None'}")
        print(f"  - category_id: {category_id or 'None'}")
        print(f"  - payment_mode_id: {payment_mode_id or 'None'}")
        
        if start_date:
            query = query.filter(Expense.expense_date >= start_date)
        if end_date:
            query = query.filter(Expense.expense_date <= end_date)
        if category_id:
            query = query.filter(Expense.category_id == category_id)
        if payment_mode_id:
            query = query.filter(Expense.payment_mode_id == payment_mode_id)
        
        limit = request.args.get('limit', 50, type=int)
        offset = request.args.get('offset', 0, type=int)
        total_count = query.count()
        
        print(f"📊 Query results:")
        print(f"  - Total count: {total_count}")
        print(f"  - Limit: {limit}")
        print(f"  - Offset: {offset}")
        
        expenses = query.order_by(Expense.expense_date.desc(), Expense.created_at.desc()) \
                        .limit(limit) \
                        .offset(offset) \
                        .all()
        
        print(f"✅ Returning {len(expenses)} expenses")
        print("=" * 60)
        
        return jsonify({
            "expenses": [expense.to_dict(include_relations=True) for expense in expenses],
            "total_count": total_count,
            "limit": limit,
            "offset": offset
        }), 200
        
    except Exception as e:
        print(f"❌ Get expenses error: {str(e)}")
        print(f"   Error type: {type(e).__name__}")
        import traceback
        print(f"   Traceback: {traceback.format_exc()}")
        print("=" * 60)
        return jsonify({"error": f"Failed to fetch expenses: {str(e)}"}), 500


@expenses_bp.route('/<int:expense_id>', methods=['GET'])
@jwt_required()
def get_expense_by_id(expense_id):
    """
    Get a single expense by ID
    """
    try:
        current_user_id = get_jwt_identity()
        print(f"🔍 GET EXPENSE BY ID: {expense_id}")
        print(f"👤 User ID: {current_user_id}")
        
        expense = Expense.query.filter_by(id=expense_id, user_id=current_user_id).first()
        if not expense:
            return jsonify({"error": "Expense not found"}), 404
        
        return jsonify({"expense": expense.to_dict(include_relations=True)}), 200
        
    except Exception as e:
        print(f"❌ Get expense error: {str(e)}")
        return jsonify({"error": f"Failed to fetch expense: {str(e)}"}), 500


@expenses_bp.route('/<int:expense_id>', methods=['PUT'])
@jwt_required()
def update_expense(expense_id):
    """
    Update an existing expense
    """
    try:
        current_user_id = get_jwt_identity()
        print(f"✏️ UPDATE EXPENSE: {expense_id}")
        
        expense = Expense.query.filter_by(id=expense_id, user_id=current_user_id).first()
        if not expense:
            return jsonify({"error": "Expense not found"}), 404
        
        data = request.get_json()
        if not data:
            return jsonify({"error": "No data provided"}), 400
        
        if 'category_id' in data:
            category = Category.query.get(data['category_id'])
            if not category:
                return jsonify({"error": "Invalid category"}), 400
            expense.category_id = data['category_id']
        
        if 'payment_mode_id' in data:
            payment_mode = PaymentMode.query.get(data['payment_mode_id'])
            if not payment_mode:
                return jsonify({"error": "Invalid payment mode"}), 400
            expense.payment_mode_id = data['payment_mode_id']
        
        if 'amount' in data:
            try:
                amount = float(data['amount'])
                if amount <= 0:
                    return jsonify({"error": "Amount must be greater than 0"}), 400
                expense.amount = amount
            except ValueError:
                return jsonify({"error": "Invalid amount format"}), 400
        
        if 'description' in data:
            description = data['description'].strip()
            if not description:
                return jsonify({"error": "Description cannot be empty"}), 400
            expense.description = description
        
        if 'expense_date' in data:
            try:
                expense.expense_date = datetime.strptime(data['expense_date'], '%Y-%m-%d').date()
            except ValueError:
                return jsonify({"error": "Invalid date format. Use YYYY-MM-DD"}), 400
        
        db.session.commit()
        print(f"✅ Expense updated: {expense_id}")
        
        return jsonify({
            "message": "Expense updated successfully",
            "expense": expense.to_dict(include_relations=True)
        }), 200
        
    except Exception as e:
        print(f"❌ Update expense error: {str(e)}")
        db.session.rollback()
        return jsonify({"error": f"Failed to update expense: {str(e)}"}), 500


@expenses_bp.route('/<int:expense_id>', methods=['DELETE'])
@jwt_required()
def delete_expense(expense_id):
    """
    Delete an expense
    """
    try:
        current_user_id = get_jwt_identity()
        print(f"🗑️ DELETE EXPENSE: {expense_id}")
        
        expense = Expense.query.filter_by(id=expense_id, user_id=current_user_id).first()
        if not expense:
            return jsonify({"error": "Expense not found"}), 404
        
        db.session.delete(expense)
        db.session.commit()
        
        print(f"✅ Expense deleted: {expense_id}")
        return jsonify({"message": "Expense deleted successfully"}), 200
        
    except Exception as e:
        print(f"❌ Delete expense error: {str(e)}")
        db.session.rollback()
        return jsonify({"error": f"Failed to delete expense: {str(e)}"}), 500


@expenses_bp.route('/categories', methods=['GET'])
@jwt_required()
def get_categories():
    """
    Get all active categories
    """
    try:
        print("📁 GET CATEGORIES REQUEST")
        current_user_id = get_jwt_identity()
        print(f"👤 User ID: {current_user_id}")
        
        categories = Category.query.filter_by(is_active=True).all()
        print(f"✅ Found {len(categories)} categories")
        
        return jsonify({
            "categories": [category.to_dict() for category in categories]
        }), 200
        
    except Exception as e:
        print(f"❌ Get categories error: {str(e)}")
        return jsonify({"error": f"Failed to fetch categories: {str(e)}"}), 500


@expenses_bp.route('/payment-modes', methods=['GET'])
@jwt_required()
def get_payment_modes():
    """
    Get all active payment modes
    """
    try:
        print("💳 GET PAYMENT MODES REQUEST")
        current_user_id = get_jwt_identity()
        print(f"👤 User ID: {current_user_id}")
        
        payment_modes = PaymentMode.query.filter_by(is_active=True).all()
        print(f"✅ Found {len(payment_modes)} payment modes")
        
        return jsonify({
            "payment_modes": [pm.to_dict() for pm in payment_modes]
        }), 200
        
    except Exception as e:
        print(f"❌ Get payment modes error: {str(e)}")
        return jsonify({"error": f"Failed to fetch payment modes: {str(e)}"}), 500


@expenses_bp.route('/summary', methods=['GET'])
@jwt_required()
def get_expense_summary():
    """
    Get expense summary for dashboard
    """
    try:
        print("📊 GET EXPENSE SUMMARY REQUEST")
        current_user_id = get_jwt_identity()
        print(f"👤 User ID: {current_user_id}")
        
        query = Expense.query.filter_by(user_id=current_user_id)
        
        start_date = request.args.get('start_date')
        end_date = request.args.get('end_date')
        
        if start_date:
            query = query.filter(Expense.expense_date >= start_date)
        if end_date:
            query = query.filter(Expense.expense_date <= end_date)
        
        total_amount = query.with_entities(func.sum(Expense.amount)).scalar() or 0
        total_expenses = query.count()
        
        today = date.today()
        today_total = Expense.query.filter_by(user_id=current_user_id) \
                                    .filter(Expense.expense_date == today) \
                                    .with_entities(func.sum(Expense.amount)) \
                                    .scalar() or 0
        
        print(f"✅ Summary calculated:")
        print(f"  - Total amount: ₹{total_amount}")
        print(f"  - Total expenses: {total_expenses}")
        print(f"  - Today's total: ₹{today_total}")
        
        return jsonify({
            "total_amount": float(total_amount),
            "total_expenses": total_expenses,
            "today_total": float(today_total),
            "filters_applied": {
                "start_date": start_date,
                "end_date": end_date
            }
        }), 200
        
    except Exception as e:
        print(f"❌ Get summary error: {str(e)}")
        return jsonify({"error": f"Failed to fetch summary: {str(e)}"}), 500
