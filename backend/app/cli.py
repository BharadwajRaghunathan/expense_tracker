"""
CLI Commands
Custom Flask CLI commands for database operations
"""

import click
from flask.cli import with_appcontext
from app.extensions import db
from app.models import Category, PaymentMode, User


def register_cli_commands(app):
    """Register CLI commands"""
    app.cli.add_command(seed_database)
    app.cli.add_command(create_admin)


@click.command('seed-db')
@with_appcontext
def seed_database():
    """Seed database with default categories and payment modes"""
    print('=' * 60)
    print('🌱 Seeding database with default data...')
    print('=' * 60)
    
    try:
        # Check if already seeded
        if Category.query.first():
            print('⚠️  Database already seeded. Skipping...')
            return
        
        # Create categories WITHOUT slug
        categories_data = [
            {'name': 'Food & Dining', 'icon': '🍔', 'color': '#FF6B6B'},
            {'name': 'Transportation', 'icon': '🚗', 'color': '#4ECDC4'},
            {'name': 'Shopping', 'icon': '🛍️', 'color': '#95E1D3'},
            {'name': 'Entertainment', 'icon': '🎮', 'color': '#FFE66D'},
            {'name': 'Bills & Utilities', 'icon': '💡', 'color': '#A8E6CF'},
            {'name': 'Healthcare', 'icon': '🏥', 'color': '#FF8B94'},
            {'name': 'Education', 'icon': '📚', 'color': '#C7CEEA'},
            {'name': 'Travel', 'icon': '✈️', 'color': '#FFB6C1'},
            {'name': 'Others', 'icon': '📌', 'color': '#FFDAB9'},
        ]
        
        for cat_data in categories_data:
            category = Category(
                name=cat_data['name'],
                icon=cat_data['icon'],
                color=cat_data['color']
            )
            db.session.add(category)
            print(f"✓ Added category: {cat_data['name']}")
        
        # Create payment modes WITHOUT slug
        payment_modes_data = [
            {'name': 'Cash', 'icon': '💵', 'color': '#2ECC71'},
            {'name': 'GPay', 'icon': '📱', 'color': '#3498DB', 'bank_name': 'Google Pay'},
            {'name': 'Paytm', 'icon': '💳', 'color': '#00BAF2', 'bank_name': 'Paytm'},
            {'name': 'PhonePe', 'icon': '📲', 'color': '#5F259F', 'bank_name': 'PhonePe'},
            {'name': 'Credit Card', 'icon': '💳', 'color': '#E74C3C'},
            {'name': 'Debit Card', 'icon': '💳', 'color': '#F39C12'},
            {'name': 'Net Banking', 'icon': '🏦', 'color': '#16A085'},
            {'name': 'UPI', 'icon': '📱', 'color': '#9B59B6'},
        ]
        
        for pm_data in payment_modes_data:
            payment_mode = PaymentMode(
                name=pm_data['name'],
                icon=pm_data['icon'],
                color=pm_data['color'],
                bank_name=pm_data.get('bank_name')
            )
            db.session.add(payment_mode)
            print(f"✓ Added payment mode: {pm_data['name']}")
        
        db.session.commit()
        
        print('=' * 60)
        print(f'✓ Created {len(categories_data)} categories')
        print(f'✓ Created {len(payment_modes_data)} payment modes')
        print('✓ Database seeded successfully!')
        print('=' * 60)
        
    except Exception as e:
        db.session.rollback()
        print('=' * 60)
        print(f'❌ Error seeding database: {str(e)}')
        print('=' * 60)
        import traceback
        traceback.print_exc()


@click.command('create-admin')
@with_appcontext
def create_admin():
    """Create admin user"""
    print('=' * 60)
    print('👤 Creating admin user...')
    print('=' * 60)
    
    try:
        admin_email = 'admin@example.com'
        existing = User.query.filter_by(email=admin_email).first()
        
        if existing:
            print(f'⚠️  Admin user already exists: {admin_email}')
        else:
            admin = User(
                email=admin_email,
                full_name='Admin User',
                password='admin123'
            )
            db.session.add(admin)
            db.session.commit()
            
            print(f'✓ Admin user created!')
            print(f'  Email: {admin_email}')
            print(f'  Password: admin123')
            print('=' * 60)
            
    except Exception as e:
        db.session.rollback()
        print('=' * 60)
        print(f'❌ Error creating admin: {str(e)}')
        print('=' * 60)
