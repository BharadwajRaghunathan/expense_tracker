"""
Export Service
Professional PDF and CSV generation with ₹ symbol support
"""

from io import BytesIO
import csv
from datetime import datetime, timedelta
from reportlab.lib import colors
from reportlab.lib.pagesizes import A4, letter
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import inch
from reportlab.platypus import SimpleDocTemplate, Table, TableStyle, Paragraph, Spacer, PageBreak
from reportlab.pdfgen import canvas
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.lib.enums import TA_CENTER, TA_RIGHT, TA_LEFT
from app.models import Expense, Category, PaymentMode
from app.extensions import db
from sqlalchemy import func
import os

# ✅ ADDED: Register font that supports ₹ symbol
try:
    # Try to register DejaVu Sans font (supports ₹ symbol)
    font_path = os.path.join(os.path.dirname(__file__), '..', 'fonts', 'DejaVuSans.ttf')
    if os.path.exists(font_path):
        pdfmetrics.registerFont(TTFont('DejaVuSans', font_path))
        pdfmetrics.registerFont(TTFont('DejaVuSans-Bold', font_path.replace('.ttf', '-Bold.ttf')))
        DEFAULT_FONT = 'DejaVuSans'
        BOLD_FONT = 'DejaVuSans-Bold'
        print("✅ Custom fonts loaded successfully")
    else:
        # Fallback to standard fonts
        DEFAULT_FONT = 'Helvetica'
        BOLD_FONT = 'Helvetica-Bold'
        print("⚠️ Using default fonts (₹ symbol may not display)")
except Exception as e:
    DEFAULT_FONT = 'Helvetica'
    BOLD_FONT = 'Helvetica-Bold'
    print(f"⚠️ Font registration failed: {e}")


class ExportService:
    """Service for exporting expense data to various formats"""
    
    # ✅ CHANGED: Use "Rs." prefix instead of ₹ symbol as fallback
    CURRENCY_SYMBOL = "₹"  # Will be used if font supports it
    CURRENCY_PREFIX = "Rs. "  # Fallback if ₹ not supported
    USE_RUPEE_SYMBOL = DEFAULT_FONT == 'DejaVuSans'  # Flag to check if we can use ₹
    
    @staticmethod
    def get_period_dates(period):
        """Get start and end dates for predefined periods"""
        today = datetime.now().date()
        
        period_map = {
            'today': (today, today),
            'yesterday': (today - timedelta(days=1), today - timedelta(days=1)),
            'week': (today - timedelta(days=today.weekday()), today),
            'last_week': (
                today - timedelta(days=today.weekday() + 7),
                today - timedelta(days=today.weekday() + 1)
            ),
            'month': (today.replace(day=1), today),
            'last_month': (
                (today.replace(day=1) - timedelta(days=1)).replace(day=1),
                today.replace(day=1) - timedelta(days=1)
            ),
            'quarter': (
                today.replace(month=((today.month - 1) // 3) * 3 + 1, day=1),
                today
            ),
            'year': (today.replace(month=1, day=1), today),
            'last_year': (
                today.replace(year=today.year - 1, month=1, day=1),
                today.replace(year=today.year - 1, month=12, day=31)
            ),
        }
        
        return period_map.get(period, (None, None))
    
    @staticmethod
    def format_currency(amount):
        """
        Format amount with currency symbol
        Uses ₹ if font supports it, otherwise uses Rs.
        """
        if amount is None:
            amount = 0
        
        # Use ₹ symbol if custom font is loaded, otherwise use Rs.
        if ExportService.USE_RUPEE_SYMBOL:
            return f"₹{amount:,.2f}"
        else:
            return f"Rs. {amount:,.2f}"
    
    @staticmethod
    def get_expenses_query(user_id, start_date=None, end_date=None, category_id=None, payment_mode_id=None):
        """Build filtered expenses query"""
        query = Expense.query.filter_by(user_id=user_id)
        
        if start_date:
            query = query.filter(Expense.expense_date >= start_date)
        if end_date:
            query = query.filter(Expense.expense_date <= end_date)
        if category_id:
            query = query.filter_by(category_id=category_id)
        if payment_mode_id:
            query = query.filter_by(payment_mode_id=payment_mode_id)
        
        return query.order_by(Expense.expense_date.desc())
    
    @staticmethod
    def export_to_csv(user_id, user_name, start_date=None, end_date=None, 
                      category_id=None, payment_mode_id=None, include_summary=True):
        """Export expenses to CSV with UTF-8 BOM encoding"""
        try:
            expenses = ExportService.get_expenses_query(
                user_id, start_date, end_date, category_id, payment_mode_id
            ).all()
            
            if not expenses and not include_summary:
                return None
            
            output = BytesIO()
            output.write('\ufeff'.encode('utf-8'))
            
            writer = csv.writer(output)
            
            writer.writerow(['EXPENSE REPORT'])
            writer.writerow([f'Generated by: {user_name}'])
            writer.writerow([f'Generated on: {datetime.now().strftime("%d %B %Y, %I:%M %p")}'])
            
            if start_date and end_date:
                writer.writerow([f'Period: {start_date.strftime("%d %b %Y")} to {end_date.strftime("%d %b %Y")}'])
            elif start_date:
                writer.writerow([f'From: {start_date.strftime("%d %b %Y")}'])
            elif end_date:
                writer.writerow([f'Until: {end_date.strftime("%d %b %Y")}'])
            else:
                writer.writerow(['Period: All Time'])
            
            writer.writerow([])
            
            writer.writerow([
                'Date',
                'Category',
                'Payment Mode',
                'Description',
                'Amount (₹)',
                'Tags'
            ])
            
            total_amount = 0
            for expense in expenses:
                writer.writerow([
                    expense.expense_date.strftime('%d-%m-%Y'),
                    expense.category.name if expense.category else 'Uncategorized',
                    expense.payment_mode.name if expense.payment_mode else 'N/A',
                    expense.description or '',
                    f'{expense.amount:.2f}',
                    expense.tags or ''
                ])
                total_amount += expense.amount
            
            if include_summary:
                writer.writerow([])
                writer.writerow(['SUMMARY'])
                writer.writerow(['Total Transactions:', len(expenses)])
                writer.writerow(['Total Amount:', f'₹{total_amount:,.2f}'])
                writer.writerow(['Average Amount:', f'₹{(total_amount / len(expenses)):,.2f}' if expenses else '₹0.00'])
                
                category_totals = db.session.query(
                    Category.name,
                    func.sum(Expense.amount).label('total'),
                    func.count(Expense.id).label('count')
                ).join(Expense).filter(
                    Expense.user_id == user_id
                ).group_by(Category.id).all()
                
                if category_totals:
                    writer.writerow([])
                    writer.writerow(['CATEGORY BREAKDOWN'])
                    writer.writerow(['Category', 'Count', 'Total Amount (₹)', 'Percentage'])
                    for cat_name, cat_total, cat_count in category_totals:
                        percentage = (cat_total / total_amount * 100) if total_amount > 0 else 0
                        writer.writerow([
                            cat_name,
                            cat_count,
                            f'{cat_total:.2f}',
                            f'{percentage:.1f}%'
                        ])
            
            output.seek(0)
            return output
            
        except Exception as e:
            print(f"CSV export error: {str(e)}")
            return None
    
    @staticmethod
    def export_to_pdf(user_id, user_name, user_email, start_date=None, end_date=None,
                      category_id=None, payment_mode_id=None, report_type='detailed',
                      include_charts=True, group_by='none'):
        """Generate professional PDF report with ₹ symbol support"""
        try:
            expenses = ExportService.get_expenses_query(
                user_id, start_date, end_date, category_id, payment_mode_id
            ).all()
            
            if not expenses:
                return None
            
            buffer = BytesIO()
            
            doc = SimpleDocTemplate(
                buffer,
                pagesize=A4,
                rightMargin=0.5*inch,
                leftMargin=0.5*inch,
                topMargin=0.75*inch,
                bottomMargin=0.75*inch
            )
            
            elements = []
            
            styles = getSampleStyleSheet()
            
            # ✅ CHANGED: Use custom font that supports ₹
            title_style = ParagraphStyle(
                'CustomTitle',
                parent=styles['Heading1'],
                fontSize=24,
                textColor=colors.HexColor('#1E40AF'),
                spaceAfter=30,
                alignment=TA_CENTER,
                fontName=BOLD_FONT  # Use registered font
            )
            
            heading_style = ParagraphStyle(
                'CustomHeading',
                parent=styles['Heading2'],
                fontSize=14,
                textColor=colors.HexColor('#1E40AF'),
                spaceAfter=12,
                spaceBefore=12,
                fontName=BOLD_FONT  # Use registered font
            )
            
            subheading_style = ParagraphStyle(
                'CustomSubHeading',
                parent=styles['Normal'],
                fontSize=10,
                textColor=colors.HexColor('#6B7280'),
                spaceAfter=20,
                alignment=TA_CENTER,
                fontName=DEFAULT_FONT  # Use registered font
            )
            
            elements.append(Paragraph('EXPENSE REPORT', title_style))
            
            period_text = ''
            if start_date and end_date:
                period_text = f'{start_date.strftime("%d %B %Y")} to {end_date.strftime("%d %B %Y")}'
            elif start_date:
                period_text = f'From {start_date.strftime("%d %B %Y")}'
            elif end_date:
                period_text = f'Until {end_date.strftime("%d %B %Y")}'
            else:
                period_text = 'All Time'
            
            metadata_text = f'''
            <b>Generated For:</b> {user_name} ({user_email})<br/>
            <b>Period:</b> {period_text}<br/>
            <b>Generated On:</b> {datetime.now().strftime("%d %B %Y, %I:%M %p")}<br/>
            <b>Report Type:</b> {report_type.title()}
            '''
            elements.append(Paragraph(metadata_text, subheading_style))
            elements.append(Spacer(1, 0.3*inch))
            
            total_amount = sum(e.amount for e in expenses)
            avg_amount = total_amount / len(expenses) if expenses else 0
            
            elements.append(Paragraph('SUMMARY', heading_style))
            
            summary_data = [
                ['Total Transactions', 'Total Amount', 'Average Amount', 'Highest Expense'],
                [
                    str(len(expenses)),
                    ExportService.format_currency(total_amount),
                    ExportService.format_currency(avg_amount),
                    ExportService.format_currency(max(e.amount for e in expenses) if expenses else 0)
                ]
            ]
            
            summary_table = Table(summary_data, colWidths=[2*inch, 2*inch, 2*inch, 2*inch])
            summary_table.setStyle(TableStyle([
                ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#1E40AF')),
                ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
                ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
                ('FONTNAME', (0, 0), (-1, 0), BOLD_FONT),  # ✅ Use registered font
                ('FONTSIZE', (0, 0), (-1, 0), 10),
                ('BOTTOMPADDING', (0, 0), (-1, 0), 12),
                ('BACKGROUND', (0, 1), (-1, -1), colors.beige),
                ('FONTSIZE', (0, 1), (-1, -1), 11),
                ('FONTNAME', (0, 1), (-1, -1), DEFAULT_FONT),  # ✅ Use registered font
                ('GRID', (0, 0), (-1, -1), 1, colors.HexColor('#E5E7EB'))
            ]))
            elements.append(summary_table)
            elements.append(Spacer(1, 0.3*inch))
            
            if report_type in ['detailed', 'analytics']:
                elements.append(Paragraph('TRANSACTION DETAILS', heading_style))
                
                table_data = [['Date', 'Category', 'Payment', 'Description', 'Amount']]
                
                for expense in expenses[:100]:
                    table_data.append([
                        expense.expense_date.strftime('%d-%m-%Y'),
                        expense.category.name[:15] if expense.category else 'N/A',
                        expense.payment_mode.name[:10] if expense.payment_mode else 'N/A',
                        (expense.description[:30] + '...') if expense.description and len(expense.description) > 30 else (expense.description or 'N/A'),
                        ExportService.format_currency(expense.amount)
                    ])
                
                expense_table = Table(table_data, colWidths=[1.2*inch, 1.5*inch, 1.2*inch, 2.5*inch, 1.4*inch])
                expense_table.setStyle(TableStyle([
                    ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#1E40AF')),
                    ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
                    ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
                    ('ALIGN', (4, 0), (4, -1), 'RIGHT'),
                    ('FONTNAME', (0, 0), (-1, 0), BOLD_FONT),  # ✅ Use registered font
                    ('FONTSIZE', (0, 0), (-1, 0), 9),
                    ('BOTTOMPADDING', (0, 0), (-1, 0), 12),
                    ('BACKGROUND', (0, 1), (-1, -1), colors.white),
                    ('FONTNAME', (0, 1), (-1, -1), DEFAULT_FONT),  # ✅ Use registered font
                    ('FONTSIZE', (0, 1), (-1, -1), 8),
                    ('ROWBACKGROUNDS', (0, 1), (-1, -1), [colors.white, colors.HexColor('#F9FAFB')]),
                    ('GRID', (0, 0), (-1, -1), 0.5, colors.HexColor('#E5E7EB'))
                ]))
                elements.append(expense_table)
            
            if report_type in ['summary', 'analytics']:
                elements.append(PageBreak())
                elements.append(Paragraph('CATEGORY BREAKDOWN', heading_style))
                
                category_stats = db.session.query(
                    Category.name,
                    func.sum(Expense.amount).label('total'),
                    func.count(Expense.id).label('count')
                ).join(Expense).filter(
                    Expense.user_id == user_id
                ).group_by(Category.id).order_by(func.sum(Expense.amount).desc()).all()
                
                cat_data = [['Category', 'Transactions', 'Total Amount', 'Percentage']]
                for cat_name, cat_total, cat_count in category_stats:
                    percentage = (cat_total / total_amount * 100) if total_amount > 0 else 0
                    cat_data.append([
                        cat_name,
                        str(cat_count),
                        ExportService.format_currency(cat_total),
                        f'{percentage:.1f}%'
                    ])
                
                cat_table = Table(cat_data, colWidths=[2.5*inch, 1.5*inch, 2*inch, 1.5*inch])
                cat_table.setStyle(TableStyle([
                    ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#10B981')),
                    ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
                    ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
                    ('ALIGN', (1, 0), (-1, -1), 'CENTER'),
                    ('FONTNAME', (0, 0), (-1, 0), BOLD_FONT),  # ✅ Use registered font
                    ('FONTSIZE', (0, 0), (-1, 0), 10),
                    ('BOTTOMPADDING', (0, 0), (-1, 0), 12),
                    ('FONTNAME', (0, 1), (-1, -1), DEFAULT_FONT),  # ✅ Use registered font
                    ('ROWBACKGROUNDS', (0, 1), (-1, -1), [colors.white, colors.HexColor('#F0FDF4')]),
                    ('GRID', (0, 0), (-1, -1), 0.5, colors.HexColor('#E5E7EB'))
                ]))
                elements.append(cat_table)
            
            elements.append(Spacer(1, 0.5*inch))
            footer_style = ParagraphStyle(
                'Footer',
                parent=styles['Normal'],
                fontSize=8,
                textColor=colors.HexColor('#6B7280'),
                alignment=TA_CENTER,
                fontName=DEFAULT_FONT  # ✅ Use registered font
            )
            
            # ✅ Display currency info in footer
            currency_text = "₹ (Indian Rupee)" if ExportService.USE_RUPEE_SYMBOL else "Rs. (Indian Rupee)"
            elements.append(Paragraph(
                f'This is a computer-generated report. Currency: {currency_text}',
                footer_style
            ))
            
            doc.build(elements)
            
            buffer.seek(0)
            return buffer
            
        except Exception as e:
            print(f"PDF export error: {str(e)}")
            import traceback
            traceback.print_exc()
            return None
    
    @staticmethod
    def get_export_preview(user_id, start_date=None, end_date=None, category_id=None, payment_mode_id=None):
        """Get preview data for export"""
        expenses = ExportService.get_expenses_query(
            user_id, start_date, end_date, category_id, payment_mode_id
        ).limit(10).all()
        
        total_count = ExportService.get_expenses_query(
            user_id, start_date, end_date, category_id, payment_mode_id
        ).count()
        
        total_amount = db.session.query(func.sum(Expense.amount)).filter(
            Expense.user_id == user_id
        ).scalar() or 0
        
        return {
            "preview_records": [e.to_dict() for e in expenses],
            "total_records": total_count,
            "total_amount": float(total_amount),
            "currency": ExportService.CURRENCY_SYMBOL if ExportService.USE_RUPEE_SYMBOL else "Rs."
        }
    
    @staticmethod
    def get_export_history(user_id):
        """Get export history (placeholder)"""
        return []
