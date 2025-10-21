from app import create_app
from app.extensions import db
from app.models import Category, PaymentMode

app = create_app()

with app.app_context():
    # Check if already seeded
    if Category.query.first():
        print('⚠️ Database already seeded!')
    else:
        # Create categories
        cats = [
            Category(name='Food & Dining', icon='🍔', color='#FF6B6B'),
            Category(name='Transportation', icon='🚗', color='#4ECDC4'),
            Category(name='Shopping', icon='🛍️', color='#95E1D3'),
            Category(name='Entertainment', icon='🎮', color='#FFE66D'),
            Category(name='Bills & Utilities', icon='💡', color='#A8E6CF'),
            Category(name='Healthcare', icon='🏥', color='#FF8B94'),
            Category(name='Education', icon='📚', color='#C7CEEA'),
            Category(name='Travel', icon='✈️', color='#FFB6C1'),
            Category(name='Others', icon='📌', color='#FFDAB9'),
        ]
        
        for c in cats:
            db.session.add(c)
            print(f'✓ Added category: {c.name}')
        
        # Create payment modes
        pms = [
            PaymentMode(name='Cash', icon='💵', color='#2ECC71'),
            PaymentMode(name='GPay', bank_name='Google Pay', icon='📱', color='#3498DB'),
            PaymentMode(name='Paytm', bank_name='Paytm', icon='💳', color='#00BAF2'),
            PaymentMode(name='PhonePe', bank_name='PhonePe', icon='📲', color='#5F259F'),
            PaymentMode(name='Credit Card', icon='💳', color='#E74C3C'),
            PaymentMode(name='Debit Card', icon='💳', color='#F39C12'),
            PaymentMode(name='Net Banking', icon='🏦', color='#16A085'),
            PaymentMode(name='UPI', icon='📱', color='#9B59B6'),
        ]
        
        for p in pms:
            db.session.add(p)
            print(f'✓ Added payment mode: {p.name}')
        
        db.session.commit()
        print('✅ DATABASE SEEDED SUCCESSFULLY!')
