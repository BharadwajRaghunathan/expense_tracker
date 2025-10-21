"""
OpenAI Service
Business logic for AI-powered expense queries and insights
"""

import os
from openai import OpenAI
from app.extensions import db
from app.models import Expense, Category, PaymentMode
from sqlalchemy import func
from datetime import date, timedelta


class OpenAIService:
    """
    Service class for OpenAI integration
    Handles natural language queries and generates insights
    """
    def __init__(self):
        """Initialize OpenAI with API key and model name"""
        self.api_key = os.environ.get('OPENAI_API_KEY')
        self.model_name = os.environ.get('OPENAI_MODEL', 'gpt-4o-mini')
        # Available models: 'gpt-4o', 'gpt-4o-mini', 'gpt-3.5-turbo'
        self.client = None

        if self.api_key:
            try:
                self.client = OpenAI(api_key=self.api_key)
                print(f"✅ OpenAIService: Client initialized with model: {self.model_name}")
            except Exception as e:
                print(f"❌ OpenAIService: Client initialization error: {str(e)}")
                print(f"💡 Tried model: {self.model_name}")
                print("💡 Available models: 'gpt-4o', 'gpt-4o-mini', 'gpt-3.5-turbo'")
                self.client = None
        else:
            print("⚠️ OPENAI_API_KEY not found in environment")
            print("💡 Get your API key from: https://platform.openai.com/api-keys")
            print("💡 Add it to your .env file: OPENAI_API_KEY=your_key_here")
            self.client = None

    def is_available(self):
        """Check if OpenAI is configured and available"""
        return self.client is not None

    @staticmethod
    def parse_query_intent(query):
        """
        Parse query to determine date range and focus
        """
        query_lower = query.lower()
        today = date.today()

        intent = {
            'start_date': None,
            'end_date': None,
            'period': None,
            'categories': [],
            'payment_modes': []
        }

        # Determine date range
        if 'today' in query_lower:
            intent['start_date'] = intent['end_date'] = today
            intent['period'] = 'today'
        elif 'yesterday' in query_lower:
            yesterday = today - timedelta(days=1)
            intent['start_date'] = intent['end_date'] = yesterday
            intent['period'] = 'yesterday'
        elif 'week' in query_lower or 'this week' in query_lower or '7 days' in query_lower:
            intent['start_date'] = today - timedelta(days=7)
            intent['end_date'] = today
            intent['period'] = 'this week'
        elif 'month' in query_lower or 'this month' in query_lower or '30 days' in query_lower:
            intent['start_date'] = today.replace(day=1)
            intent['end_date'] = today
            intent['period'] = 'this month'
        elif 'year' in query_lower or 'this year' in query_lower:
            intent['start_date'] = today.replace(month=1, day=1)
            intent['end_date'] = today
            intent['period'] = 'this year'
        else:
            # Default to last 30 days
            intent['start_date'] = today - timedelta(days=30)
            intent['end_date'] = today
            intent['period'] = 'last 30 days'

        # Check for category mentions
        category_keywords = {
            'travel': 'Travel',
            'food': 'Food',
            'payment': 'Payments to Friends',
            'transfer': 'Self Transfer to Accounts',
            'wallet': 'Wallet Recharge',
            'recharge': 'Wallet Recharge',
            'shopping': 'Shopping',
            'entertainment': 'Entertainment',
            'bills': 'Bills',
            'groceries': 'Groceries'
        }
        for keyword, category in category_keywords.items():
            if keyword in query_lower:
                intent['categories'].append(category)

        # Check for payment mode mentions
        payment_keywords = {
            'gpay': 'GPay',
            'google pay': 'GPay',
            'cash': 'Cash',
            'metro': 'Metro Card',
            'card': 'Card',
            'debit': 'Debit Card',
            'credit': 'Credit Card',
            'upi': 'UPI'
        }
        for keyword, payment_mode in payment_keywords.items():
            if keyword in query_lower:
                intent['payment_modes'].append(payment_mode)

        return intent

    @staticmethod
    def get_expense_context(user_id, intent):
        """
        Fetch expense data based on parsed intent
        """
        # Safe user_id conversion
        if isinstance(user_id, str):
            try:
                user_id = int(user_id)
            except ValueError:
                print(f"⚠️ Invalid user_id: {user_id}")
                return None

        context = {
            'period': intent['period'],
            'start_date': intent['start_date'].isoformat() if intent['start_date'] else None,
            'end_date': intent['end_date'].isoformat() if intent['end_date'] else None
        }

        # Build base query
        query = Expense.query.filter(Expense.user_id == user_id)
        if intent['start_date']:
            query = query.filter(Expense.expense_date >= intent['start_date'])
        if intent['end_date']:
            query = query.filter(Expense.expense_date <= intent['end_date'])

        # Safe total calculation
        total = query.with_entities(func.sum(Expense.amount)).scalar()
        context['total_expenses'] = float(total) if total else 0.0
        context['expense_count'] = query.count()

        # Category breakdown
        category_data = db.session.query(
            Category.name,
            func.sum(Expense.amount).label('total'),
            func.count(Expense.id).label('count')
        ).join(Expense).filter(Expense.user_id == user_id)
        
        if intent['start_date']:
            category_data = category_data.filter(Expense.expense_date >= intent['start_date'])
        if intent['end_date']:
            category_data = category_data.filter(Expense.expense_date <= intent['end_date'])
        
        category_results = category_data.group_by(Category.name).order_by(func.sum(Expense.amount).desc()).all()
        
        # Safe number conversion
        context['by_category'] = {
            row.name: {
                'total': float(row.total) if row.total else 0.0,
                'count': row.count
            }
            for row in category_results if row.total
        }

        # Payment mode breakdown
        payment_data = db.session.query(
            PaymentMode.name,
            PaymentMode.bank_name,
            func.sum(Expense.amount).label('total'),
            func.count(Expense.id).label('count')
        ).join(Expense).filter(Expense.user_id == user_id)
        
        if intent['start_date']:
            payment_data = payment_data.filter(Expense.expense_date >= intent['start_date'])
        if intent['end_date']:
            payment_data = payment_data.filter(Expense.expense_date <= intent['end_date'])
        
        payment_results = payment_data.group_by(PaymentMode.name, PaymentMode.bank_name).order_by(func.sum(Expense.amount).desc()).all()
        
        # Safe number conversion
        context['by_payment_mode'] = {
            f"{row.name} - {row.bank_name}" if row.bank_name else row.name: {
                'total': float(row.total) if row.total else 0.0,
                'count': row.count
            }
            for row in payment_results if row.total
        }

        # Recent expenses (top 5)
        recent = query.order_by(Expense.expense_date.desc()).limit(5).all()
        context['recent_expenses'] = [
            {
                'date': exp.expense_date.isoformat(),
                'description': exp.description or 'No description',
                'amount': float(exp.amount) if exp.amount else 0.0,
                'category': exp.category.name if exp.category else 'Uncategorized'
            }
            for exp in recent
        ]

        return context

    def query_expenses(self, user_id, query_text):
        """
        Process natural language query about expenses using OpenAI
        """
        try:
            if not self.is_available():
                return False, "OpenAI is not configured. Please set OPENAI_API_KEY in your environment."

            # Safe user_id conversion
            if isinstance(user_id, str):
                try:
                    user_id = int(user_id)
                except ValueError:
                    return False, "Invalid user ID"

            # Parse query and get context
            intent = self.parse_query_intent(query_text)
            context = self.get_expense_context(user_id, intent)

            if not context:
                return False, "Failed to retrieve expense data"

            # Handle no expenses case
            if context['expense_count'] == 0:
                return True, f"You haven't recorded any expenses for {context['period']}. Start tracking your expenses to get AI-powered insights! 📊"

            # Build prompt
            prompt = self._build_query_prompt(query_text, context)

            # ✅ CHANGED: Use OpenAI chat completions API
            try:
                response = self.client.chat.completions.create(
                    model=self.model_name,
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
                
                answer = response.choices[0].message.content
                return True, answer
                
            except Exception as e:
                error_msg = str(e)
                print(f"❌ OpenAIService: API error: {error_msg}")
                
                # Better error messages
                if 'model' in error_msg.lower() and 'not found' in error_msg.lower():
                    return False, f"Model '{self.model_name}' not found. Try using 'gpt-4o-mini' or 'gpt-3.5-turbo'."
                elif 'api_key' in error_msg.lower() or 'authentication' in error_msg.lower():
                    return False, "Invalid API key. Please check your OPENAI_API_KEY."
                elif 'quota' in error_msg.lower() or 'insufficient' in error_msg.lower():
                    return False, "OpenAI API quota exceeded. Please check your billing."
                else:
                    return False, f"AI query failed: {error_msg}"

        except Exception as e:
            print(f"❌ AI query error: {str(e)}")
            import traceback
            traceback.print_exc()
            return False, f"AI query failed: {str(e)}"

    def _build_query_prompt(self, query, context):
        """
        Build prompt for OpenAI API
        """
        prompt = f"""You are a helpful financial assistant analyzing expense data.

User Question: "{query}"

Expense Summary ({context['period']}):
• Period: {context['start_date']} to {context['end_date']}
• Total Spending: ₹{context['total_expenses']:.2f}
• Number of Transactions: {context['expense_count']}
"""

        # Add category breakdown if available
        if context.get('by_category'):
            prompt += "\n📊 Spending by Category:\n"
            for category, data in sorted(context['by_category'].items(), key=lambda x: x[1]['total'], reverse=True):
                percentage = (data['total'] / context['total_expenses'] * 100) if context['total_expenses'] > 0 else 0
                prompt += f"   • {category}: ₹{data['total']:.2f} ({data['count']} transactions, {percentage:.1f}%)\n"

        # Add payment mode breakdown if available
        if context.get('by_payment_mode'):
            prompt += "\n💳 Payment Methods Used:\n"
            for payment, data in sorted(context['by_payment_mode'].items(), key=lambda x: x[1]['total'], reverse=True):
                prompt += f"   • {payment}: ₹{data['total']:.2f} ({data['count']} times)\n"

        # Add recent expenses
        if context.get('recent_expenses'):
            prompt += "\n🕐 Recent Expenses:\n"
            for exp in context['recent_expenses'][:3]:
                prompt += f"   • {exp['date']}: {exp['description']} - ₹{exp['amount']:.2f} ({exp['category']})\n"

        prompt += """

Instructions:
• Answer the user's question directly and clearly
• Use specific numbers from the data
• Format currency as ₹X,XXX.XX
• Use emojis where appropriate (💰 📊 💳 📈 etc.)
• Keep response under 150 words
• Use bullet points for multiple items
• Be friendly and conversational
• Provide insights when relevant
"""
        return prompt

    def generate_suggestions(self, user_id, days=30):
        """
        Generate AI-powered spending suggestions using OpenAI
        """
        try:
            if not self.is_available():
                return False, "OpenAI is not configured."

            # Safe user_id conversion
            if isinstance(user_id, str):
                try:
                    user_id = int(user_id)
                except ValueError:
                    return False, "Invalid user ID"

            # Get expense context
            end_date = date.today()
            start_date = end_date - timedelta(days=days)

            intent = {
                'start_date': start_date,
                'end_date': end_date,
                'period': f'last {days} days',
                'categories': [],
                'payment_modes': []
            }

            context = self.get_expense_context(user_id, intent)

            if not context:
                return False, "Failed to retrieve expense data"

            # Handle no expenses case
            if context['expense_count'] == 0:
                return True, (
                    "🎯 Start tracking your expenses to get personalized AI insights!\n\n"
                    "📝 Add your first expense to begin building your financial profile\n\n"
                    "💡 Categorize expenses properly for detailed analysis\n\n"
                    "🔔 Check back after a week of tracking for AI-powered suggestions"
                )

            # Build prompt
            prompt = f"""Analyze this user's spending pattern and provide actionable insights.

Period: Last {days} days
Total Spent: ₹{context['total_expenses']:.2f}
Transactions: {context['expense_count']}
Daily Average: ₹{(context['total_expenses'] / days):.2f}

Spending by Category:
"""
            # Add category breakdown
            for category, data in sorted(context.get('by_category', {}).items(), key=lambda x: x[1]['total'], reverse=True):
                percentage = (data['total'] / context['total_expenses'] * 100) if context['total_expenses'] > 0 else 0
                prompt += f"• {category}: ₹{data['total']:.2f} ({percentage:.1f}%, {data['count']} transactions)\n"

            prompt += """

Provide 4-5 personalized insights:
1. ✅ One positive observation about their spending habits
2. ⚠️ One area where they could potentially save money
3. 💡 One practical tip for better expense tracking
4. 📊 Overall financial health assessment (Excellent/Good/Fair/Needs Attention)
5. 🎯 One specific action item they can take this week

Format as clear bullet points with emojis. Be encouraging, specific, and actionable. Keep it under 200 words.
"""

            try:
                # ✅ CHANGED: Use OpenAI chat completions API
                response = self.client.chat.completions.create(
                    model=self.model_name,
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
                
                suggestions = response.choices[0].message.content
                return True, suggestions
                
            except Exception as e:
                print(f"❌ OpenAIService: generate suggestions error: {str(e)}")
                return False, f"Failed to generate suggestions: {str(e)}"

        except Exception as e:
            print(f"❌ Suggestions error: {str(e)}")
            import traceback
            traceback.print_exc()
            return False, f"Failed to generate suggestions: {str(e)}"
