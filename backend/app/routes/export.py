"""
Export Routes
Handles PDF and CSV export functionality with professional formatting
"""

from flask import Blueprint, request, send_file, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from app.services.export_service import ExportService
from app.services.auth_service import AuthService
from app.utils.helpers import parse_date, error_response
from datetime import datetime

# Create Blueprint
export_bp = Blueprint('export', __name__)


@export_bp.route('/csv', methods=['GET'])
@jwt_required()
def export_csv():
    """
    Export expenses to CSV file with proper UTF-8 encoding for ₹ symbol
    
    Query Parameters:
        - start_date: Start date (YYYY-MM-DD)
        - end_date: End date (YYYY-MM-DD)
        - category_id: Filter by category
        - payment_mode_id: Filter by payment mode
        - period: Predefined period (today, week, month, year, all)
        - include_summary: Include summary statistics (true/false)
    
    Returns:
        CSV file download with UTF-8 BOM encoding
    """
    try:
        # Get current user
        current_user_id = get_jwt_identity()
        user = AuthService.get_user_by_id(current_user_id)
        
        if not user:
            return error_response("User not found", 404)
        
        # Get filters from query parameters
        period = request.args.get('period', 'all')
        category_id = request.args.get('category_id', type=int)
        payment_mode_id = request.args.get('payment_mode_id', type=int)
        include_summary = request.args.get('include_summary', 'true').lower() == 'true'
        
        # Determine date range
        if period and period != 'custom' and period != 'all':
            start_date, end_date = ExportService.get_period_dates(period)
        elif period == 'all':
            start_date, end_date = None, None
        else:
            start_date_str = request.args.get('start_date')
            end_date_str = request.args.get('end_date')
            
            start_date = parse_date(start_date_str) if start_date_str else None
            end_date = parse_date(end_date_str) if end_date_str else None
        
        # Generate CSV with UTF-8 encoding
        csv_buffer = ExportService.export_to_csv(
            user_id=current_user_id,
            user_name=user.full_name or user.email,
            start_date=start_date,
            end_date=end_date,
            category_id=category_id,
            payment_mode_id=payment_mode_id,
            include_summary=include_summary
        )
        
        if not csv_buffer:
            return error_response("No data available for export", 404)
        
        # Generate filename with period info
        timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
        period_label = period.replace('_', '-') if period else 'custom'
        filename = f"expenses_{period_label}_{timestamp}.csv"
        
        # Send file with UTF-8 BOM for proper Excel compatibility
        return send_file(
            csv_buffer,
            mimetype='text/csv; charset=utf-8',
            as_attachment=True,
            download_name=filename
        )
        
    except ValueError as ve:
        return error_response(str(ve), 400)
    except Exception as e:
        print(f"CSV export error: {str(e)}")
        return error_response(f"CSV export failed: {str(e)}", 500)


@export_bp.route('/pdf', methods=['GET'])
@jwt_required()
def export_pdf():
    """
    Export expenses to professional PDF report with charts and summaries
    
    Query Parameters:
        - start_date: Start date (YYYY-MM-DD)
        - end_date: End date (YYYY-MM-DD)
        - category_id: Filter by category
        - payment_mode_id: Filter by payment mode
        - period: Predefined period (today, week, month, year, all)
        - report_type: 'detailed', 'summary', or 'analytics' (default: detailed)
        - include_charts: Include visual charts (true/false, default: true)
        - group_by: Group expenses by 'category', 'payment_mode', 'date', or 'none'
    
    Returns:
        Professional PDF file download with ₹ symbol support
    """
    try:
        # Get current user
        current_user_id = get_jwt_identity()
        user = AuthService.get_user_by_id(current_user_id)
        
        if not user:
            return error_response("User not found", 404)
        
        # Get filters from query parameters
        period = request.args.get('period', 'month')
        category_id = request.args.get('category_id', type=int)
        payment_mode_id = request.args.get('payment_mode_id', type=int)
        report_type = request.args.get('report_type', 'detailed')
        include_charts = request.args.get('include_charts', 'true').lower() == 'true'
        group_by = request.args.get('group_by', 'none')
        
        # Validate parameters
        if report_type not in ['detailed', 'summary', 'analytics']:
            report_type = 'detailed'
        
        if group_by not in ['category', 'payment_mode', 'date', 'none']:
            group_by = 'none'
        
        # Determine date range
        if period and period != 'custom' and period != 'all':
            start_date, end_date = ExportService.get_period_dates(period)
        elif period == 'all':
            start_date, end_date = None, None
        else:
            start_date_str = request.args.get('start_date')
            end_date_str = request.args.get('end_date')
            
            start_date = parse_date(start_date_str) if start_date_str else None
            end_date = parse_date(end_date_str) if end_date_str else None
        
        # Generate professional PDF
        pdf_buffer = ExportService.export_to_pdf(
            user_id=current_user_id,
            user_name=user.full_name or user.email,
            user_email=user.email,
            start_date=start_date,
            end_date=end_date,
            category_id=category_id,
            payment_mode_id=payment_mode_id,
            report_type=report_type,
            include_charts=include_charts,
            group_by=group_by
        )
        
        if not pdf_buffer:
            return error_response("No data available for export", 404)
        
        # Generate descriptive filename
        timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
        period_label = period.replace('_', '-') if period else 'custom'
        filename = f"expense_report_{report_type}_{period_label}_{timestamp}.pdf"
        
        # Send file
        return send_file(
            pdf_buffer,
            mimetype='application/pdf',
            as_attachment=True,
            download_name=filename
        )
        
    except ValueError as ve:
        return error_response(str(ve), 400)
    except Exception as e:
        print(f"PDF export error: {str(e)}")
        return error_response(f"PDF export failed: {str(e)}", 500)


@export_bp.route('/preview', methods=['GET'])
@jwt_required()
def preview_export():
    """
    Get preview data for export (first 10 records + summary)
    
    Query Parameters: Same as export endpoints
    
    Returns:
        JSON with preview data and statistics
    """
    try:
        current_user_id = get_jwt_identity()
        
        # Get filters
        period = request.args.get('period', 'month')
        category_id = request.args.get('category_id', type=int)
        payment_mode_id = request.args.get('payment_mode_id', type=int)
        
        # Determine date range
        if period and period != 'custom' and period != 'all':
            start_date, end_date = ExportService.get_period_dates(period)
        elif period == 'all':
            start_date, end_date = None, None
        else:
            start_date_str = request.args.get('start_date')
            end_date_str = request.args.get('end_date')
            
            start_date = parse_date(start_date_str) if start_date_str else None
            end_date = parse_date(end_date_str) if end_date_str else None
        
        # Get preview data
        preview_data = ExportService.get_export_preview(
            user_id=current_user_id,
            start_date=start_date,
            end_date=end_date,
            category_id=category_id,
            payment_mode_id=payment_mode_id
        )
        
        return jsonify(preview_data), 200
        
    except Exception as e:
        return error_response(f"Preview failed: {str(e)}", 500)


@export_bp.route('/formats', methods=['GET'])
@jwt_required()
def get_export_formats():
    """
    Get available export formats, periods, and options
    
    Returns:
        JSON response with comprehensive export options
    """
    return jsonify({
        "formats": [
            {"value": "csv", "label": "CSV (Excel Compatible)", "icon": "📊"},
            {"value": "pdf", "label": "PDF Report", "icon": "📄"}
        ],
        "periods": [
            {"value": "today", "label": "Today"},
            {"value": "yesterday", "label": "Yesterday"},
            {"value": "week", "label": "This Week"},
            {"value": "last_week", "label": "Last Week"},
            {"value": "month", "label": "This Month"},
            {"value": "last_month", "label": "Last Month"},
            {"value": "quarter", "label": "This Quarter"},
            {"value": "year", "label": "This Year"},
            {"value": "last_year", "label": "Last Year"},
            {"value": "all", "label": "All Time"},
            {"value": "custom", "label": "Custom Date Range"}
        ],
        "report_types": [
            {
                "value": "summary", 
                "label": "Summary Report",
                "description": "Overview with totals and charts"
            },
            {
                "value": "detailed", 
                "label": "Detailed Report",
                "description": "All transactions with complete information"
            },
            {
                "value": "analytics", 
                "label": "Analytics Report",
                "description": "Advanced insights with trends and breakdowns"
            }
        ],
        "group_by_options": [
            {"value": "none", "label": "No Grouping"},
            {"value": "category", "label": "Group by Category"},
            {"value": "payment_mode", "label": "Group by Payment Mode"},
            {"value": "date", "label": "Group by Date"}
        ],
        "currency": {
            "symbol": "₹",
            "code": "INR",
            "name": "Indian Rupee"
        }
    }), 200


@export_bp.route('/history', methods=['GET'])
@jwt_required()
def get_export_history():
    """
    Get user's export history (last 10 exports)
    
    Returns:
        JSON with export history
    """
    try:
        current_user_id = get_jwt_identity()
        
        # This would typically come from a database table tracking exports
        # For now, return a placeholder
        history = ExportService.get_export_history(current_user_id)
        
        return jsonify({
            "exports": history,
            "total_count": len(history)
        }), 200
        
    except Exception as e:
        return error_response(f"Failed to fetch history: {str(e)}", 500)
