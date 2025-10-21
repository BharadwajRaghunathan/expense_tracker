"""
AI Query Routes
Handles OpenAI integration for natural language expense queries
"""
from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from app.extensions import db
from app.models import Expense, Category, PaymentMode
from sqlalchemy import func
from datetime import datetime, date, timedelta
from openai import OpenAI
import os


# Create Blueprint
ai_bp = Blueprint('ai', __name__)


# ✅ CHANGED: Configure OpenAI instead of Gemini
OPENAI_API_KEY = os.environ.get('OPENAI_API_KEY')
MODEL_NAME = os.environ.get('OPENAI_MODEL', 'gpt-4o-mini')
# Available models: 'gpt-4o', 'gpt-4o-mini', 'gpt-3.5-turbo'

client = None
if OPENAI_API_KEY:
    try:
        client = OpenAI(api_key=OPENAI_API_KEY)
        print(f"✅ OpenAI configured successfully with model: {MODEL_NAME}")
    except Exception as e:
        print(f"❌ Failed to initialize OpenAI client: {e}")
        client = None
else:
    print("⚠️ OPENAI_API_KEY not found in environment variables")
    print("💡 Get your API key from: https://platform.openai.com/api-keys")
    print("💡 Add it to your .env file: OPENAI_API_KEY=your_key_here")


def get_expense_context(user_id, query_lower):
    """
    Fetch relevant expense data based on the user query
    """
    # Safe user_id conversion
    if isinstance(user_id, str):
        try:
            user_id = int(user_id)
        except ValueError:
            print(f"⚠️ Invalid user_id: {user_id}")
            return None

    context = {}
    today = date.today()

    # Determine time period from query
    if 'today' in query_lower:
        start_date = end_date = today
        period = "today"
    elif 'yesterday' in query_lower:
        start_date = end_date = today - timedelta(days=1)
        period = "yesterday"
    elif 'week' in query_lower or 'this week' in query_lower:
        start_date = today - timedelta(days=7)
        end_date = today
        period = "this week"
    elif 'month' in query_lower or 'this month' in query_lower:
        start_date = today.replace(day=1)
        end_date = today
        period = "this month"
    elif 'year' in query_lower or 'this year' in query_lower:
        start_date = today.replace(month=1, day=1)
        end_date = today
        period = "this year"
    else:
        start_date = today - timedelta(days=30)
        end_date = today
        period = "last 30 days"

    context['period'] = period
    context['start_date'] = start_date.isoformat()
    context['end_date'] = end_date.isoformat()

    # Get total expenses
    base_query = Expense.query.filter(
        Expense.user_id == user_id,
        Expense.expense_date >= start_date,
        Expense.expense_date <= end_date
    )

    total = base_query.with_entities(func.sum(Expense.amount)).scalar() or 0
    context['total_expenses'] = float(total)
    context['expense_count'] = base_query.count()

    # Get category breakdown if relevant to query
    category_keywords = ['category', 'travel', 'food', 'payment', 'transfer', 'wallet', 'recharge', 'shopping', 'entertainment']
    if any(keyword in query_lower for keyword in category_keywords):
        category_data = db.session.query(
            Category.name,
            func.sum(Expense.amount).label('total'),
            func.count(Expense.id).label('count')
        ).join(Expense) \
         .filter(
            Expense.user_id == user_id,
            Expense.expense_date >= start_date,
            Expense.expense_date <= end_date
        ).group_by(Category.name) \
         .order_by(func.sum(Expense.amount).desc()) \
         .all()

        context['by_category'] = [
            {
                'name': row.name,
                'total': float(row.total),
                'count': row.count
            }
            for row in category_data
        ]

    # Get payment mode breakdown if relevant to query
    if 'payment' in query_lower or 'gpay' in query_lower or 'cash' in query_lower or 'card' in query_lower:
        payment_data = db.session.query(
            PaymentMode.name,
            PaymentMode.bank_name,
            func.sum(Expense.amount).label('total'),
            func.count(Expense.id).label('count')
        ).join(Expense) \
         .filter(
            Expense.user_id == user_id,
            Expense.expense_date >= start_date,
            Expense.expense_date <= end_date
        ).group_by(PaymentMode.name, PaymentMode.bank_name) \
         .order_by(func.sum(Expense.amount).desc()) \
         .all()

        context['by_payment_mode'] = [
            {
                'name': f"{row.name} - {row.bank_name}" if row.bank_name else row.name,
                'total': float(row.total),
                'count': row.count
            }
            for row in payment_data
        ]

    # Get recent expenses
    recent = base_query.order_by(Expense.expense_date.desc()).limit(5).all()
    context['recent_expenses'] = [
        {
            "date": exp.expense_date.isoformat(),
            "description": exp.description or 'No description',
            "amount": float(exp.amount),
            "category": exp.category.name if exp.category else 'Uncategorized'
        }
        for exp in recent
    ]

    return context


@ai_bp.route('/query', methods=['POST'])
@jwt_required()
def ai_query():
    """Process natural language query about expenses using OpenAI"""
    try:
        # Check if OpenAI is configured
        if not client:
            return jsonify({
                "error": "OpenAI is not configured. Please add OPENAI_API_KEY to your environment variables.",
                "fallback": "AI features are currently unavailable. Please check your API configuration.",
                "help": "Get your API key from: https://platform.openai.com/api-keys"
            }), 503

        current_user_id = get_jwt_identity()
        if isinstance(current_user_id, str):
            try:
                current_user_id = int(current_user_id)
            except ValueError:
                return jsonify({"error": "Invalid user ID"}), 400

        data = request.get_json()
        if not data or not data.get('query'):
            return jsonify({"error": "Query is required"}), 400

        user_query = data['query'].strip()
        if not user_query:
            return jsonify({"error": "Query cannot be empty"}), 400

        print(f"🤖 Processing AI query: '{user_query}' for user {current_user_id}")

        # Get expense context
        context = get_expense_context(current_user_id, user_query.lower())
        
        if not context:
            return jsonify({"error": "Failed to retrieve expense context"}), 500

        # Handle case with no expenses
        if context['expense_count'] == 0:
            return jsonify({
                "query": user_query,
                "answer": f"You haven't recorded any expenses for {context['period']}. Start tracking your expenses to get AI-powered insights! 📊",
                "context": {
                    "period": context['period'],
                    "total_expenses": 0,
                    "expense_count": 0
                }
            }), 200

        # ✅ CHANGED: Build prompt for OpenAI (same format, different API)
        prompt = f"""You are a helpful financial assistant analyzing expense data.

User Question: "{user_query}"

Expense Summary:
• Period: {context['period']} ({context['start_date']} to {context['end_date']})
• Total Spending: ₹{context['total_expenses']:.2f}
• Number of Transactions: {context['expense_count']}
"""

        # Add category breakdown if available
        if 'by_category' in context and context['by_category']:
            prompt += "\n📊 Spending by Category:\n"
            for cat in context['by_category']:
                prompt += f"   • {cat['name']}: ₹{cat['total']:.2f} ({cat['count']} transactions)\n"

        # Add payment mode breakdown if available
        if 'by_payment_mode' in context and context['by_payment_mode']:
            prompt += "\n💳 Spending by Payment Method:\n"
            for pm in context['by_payment_mode']:
                prompt += f"   • {pm['name']}: ₹{pm['total']:.2f} ({pm['count']} transactions)\n"

        # Add recent expenses
        if context['recent_expenses']:
            prompt += "\n🕐 Recent Expenses:\n"
            for exp in context['recent_expenses'][:3]:
                prompt += f"   • {exp['date']}: {exp['description']} - ₹{exp['amount']:.2f} ({exp['category']})\n"

        prompt += """

Instructions:
• Answer the user's question directly and concisely
• Use specific numbers from the data
• Format currency as ₹X,XXX.XX
• Use emojis where appropriate (💰 📊 💳 etc.)
• Keep response under 150 words
• Use bullet points for lists
• Be friendly and conversational
"""

        print("🚀 Sending request to OpenAI...")
        
        try:
            # ✅ CHANGED: Use OpenAI API instead of Gemini
            response = client.chat.completions.create(
                model=MODEL_NAME,
                messages=[
                    {
                        "role": "system",
                        "content": "You are a helpful financial assistant. Provide clear, concise answers about expense data."
                    },
                    {
                        "role": "user",
                        "content": prompt
                    }
                ],
                temperature=0.7,
                max_tokens=500,
            )
            
            ai_answer = response.choices[0].message.content
            print(f"✅ AI response received (length: {len(ai_answer)} chars)")

        except Exception as e:
            error_msg = str(e)
            print(f"❌ OpenAI API error: {error_msg}")
            
            # Better error messages
            if 'model' in error_msg.lower() and 'not found' in error_msg.lower():
                return jsonify({
                    "error": f"Model '{MODEL_NAME}' not found or not accessible.",
                    "fallback": f"Based on your data: You've spent ₹{context['total_expenses']:.2f} over {context['expense_count']} transactions in {context['period']}.",
                    "help": "Try using 'gpt-4o-mini' or 'gpt-3.5-turbo' in your .env file"
                }), 500
            elif 'api_key' in error_msg.lower() or 'authentication' in error_msg.lower():
                return jsonify({
                    "error": "Invalid API key",
                    "fallback": "Please check your OPENAI_API_KEY in the .env file",
                    "help": "Get your API key from: https://platform.openai.com/api-keys"
                }), 500
            elif 'quota' in error_msg.lower() or 'insufficient' in error_msg.lower():
                return jsonify({
                    "error": "OpenAI API quota exceeded",
                    "fallback": "Please check your OpenAI account billing",
                    "help": "Visit: https://platform.openai.com/account/billing"
                }), 500
            else:
                return jsonify({
                    "error": f"AI query failed: {error_msg}",
                    "fallback": "Unable to process your query at this time. Please try again or use the analytics dashboard."
                }), 500

        return jsonify({
            "query": user_query,
            "answer": ai_answer,
            "context": {
                "period": context['period'],
                "total_expenses": context['total_expenses'],
                "expense_count": context['expense_count']
            }
        }), 200

    except Exception as e:
        print(f"❌ AI query error: {str(e)}")
        import traceback
        traceback.print_exc()
        return jsonify({
            "error": f"AI query failed: {str(e)}",
            "fallback": "Unable to process your query at this time. Please try again or use the analytics dashboard."
        }), 500


@ai_bp.route('/suggestions', methods=['GET'])
@jwt_required()
def get_suggestions():
    """Get AI-powered spending suggestions and insights"""
    try:
        current_user_id = get_jwt_identity()
        if isinstance(current_user_id, str):
            try:
                current_user_id = int(current_user_id)
            except ValueError:
                return jsonify({"error": "Invalid user ID"}), 400

        # Get last 30 days data
        today = date.today()
        start_date = today - timedelta(days=30)

        total = Expense.query.filter(
            Expense.user_id == current_user_id,
            Expense.expense_date >= start_date
        ).with_entities(func.sum(Expense.amount)).scalar() or 0

        # Better fallback suggestions
        fallback_suggestions = [
            "📊 Track your daily expenses to identify spending patterns",
            "💰 Set a monthly budget for each category to stay on track",
            "🔍 Review your top spending categories regularly",
            "📈 Compare your spending month-over-month to spot trends",
            "💳 Monitor which payment methods you use most frequently",
            "🎯 Set savings goals and track your progress"
        ]

        if not client:
            return jsonify({
                "suggestions": fallback_suggestions,
                "period": "General Tips",
                "total_analyzed": float(total) if total else 0,
                "note": "AI suggestions unavailable - showing general tips",
                "is_ai_generated": False
            }), 200

        # No expenses case
        if not total or total == 0:
            return jsonify({
                "suggestions": [
                    "🎯 Start tracking your expenses to get personalized insights",
                    "📝 Add your first expense to begin building your financial profile",
                    "💡 Categorize expenses properly for better analysis",
                    "🔔 Check back after a week of tracking for AI-powered suggestions"
                ],
                "period": "Getting Started",
                "total_analyzed": 0,
                "is_ai_generated": False
            }), 200

        # Get category data
        category_data = db.session.query(
            Category.name,
            func.sum(Expense.amount).label('total'),
            func.count(Expense.id).label('count')
        ).join(Expense) \
         .filter(
            Expense.user_id == current_user_id,
            Expense.expense_date >= start_date
        ).group_by(Category.name) \
         .order_by(func.sum(Expense.amount).desc()) \
         .all()

        # Build prompt
        prompt = f"""Analyze this user's spending pattern and provide 4-5 actionable insights.

Total Spending (Last 30 days): ₹{float(total):.2f}

Spending Breakdown:
"""
        for row in category_data:
            percentage = (float(row.total) / float(total) * 100) if total > 0 else 0
            prompt += f"• {row.name}: ₹{float(row.total):.2f} ({row.count} transactions, {percentage:.1f}%)\n"

        prompt += """

Provide insights on:
1. ✅ One positive spending habit
2. ⚠️ One area for potential savings
3. 💡 One tracking/budgeting tip
4. 📊 Overall financial health (Excellent/Good/Fair/Needs Attention)
5. 🎯 One specific action item

Format as bullet points with emojis. Keep it friendly, specific, and under 200 words.
"""

        try:
            # ✅ CHANGED: Use OpenAI API for suggestions
            response = client.chat.completions.create(
                model=MODEL_NAME,
                messages=[
                    {
                        "role": "system",
                        "content": "You are a helpful financial advisor providing spending insights."
                    },
                    {
                        "role": "user",
                        "content": prompt
                    }
                ],
                temperature=0.8,
                max_tokens=600,
            )
            
            suggestions_text = response.choices[0].message.content

            return jsonify({
                "suggestions": suggestions_text,
                "period": "Last 30 days",
                "total_analyzed": float(total),
                "is_ai_generated": True
            }), 200

        except Exception as e:
            print(f"❌ OpenAI API error in suggestions: {str(e)}")
            return jsonify({
                "suggestions": fallback_suggestions,
                "period": "Last 30 days",
                "total_analyzed": float(total),
                "note": f"AI temporarily unavailable - showing general tips",
                "is_ai_generated": False
            }), 200

    except Exception as e:
        print(f"❌ Suggestions error: {str(e)}")
        import traceback
        traceback.print_exc()
        
        return jsonify({
            "suggestions": [
                "📊 Review your spending patterns in the Analytics dashboard",
                "💰 Set monthly budgets for better financial control",
                "🔍 Identify your top spending categories",
                "📈 Track your expenses consistently for better insights"
            ],
            "period": "General Tips",
            "total_analyzed": 0,
            "note": f"Error loading suggestions: {str(e)}",
            "is_ai_generated": False
        }), 200
