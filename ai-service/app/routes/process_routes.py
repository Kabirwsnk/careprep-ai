"""
Document Processing Routes for CarePrep AI
"""

from flask import Blueprint, request, jsonify
from ..processors import DocumentProcessor, AIProcessor

process_bp = Blueprint('process', __name__)

@process_bp.route('/document', methods=['POST'])
def process_document():
    """
    Process an uploaded document (PDF, image, CSV, Excel)
    
    Expected JSON body:
    {
        "fileUrl": "https://...",
        "fileType": "application/pdf",
        "fileName": "document.pdf"
    }
    """
    try:
        data = request.get_json()
        
        if not data:
            return jsonify({'error': 'No data provided'}), 400
        
        file_url = data.get('fileUrl')
        file_type = data.get('fileType')
        
        if not file_url or not file_type:
            return jsonify({'error': 'fileUrl and fileType are required'}), 400
        
        # Process document to extract text
        doc_processor = DocumentProcessor()
        result = doc_processor.process(file_url, file_type)
        
        if not result.get('success'):
            return jsonify({
                'error': result.get('error', 'Failed to process document'),
                'processedText': '',
                'doctorSummary': '',
                'patientSummary': '',
                'medications': [],
                'followUps': [],
                'redFlags': []
            }), 400
        
        extracted_text = result.get('text', '')
        
        if not extracted_text.strip():
            return jsonify({
                'error': 'No text could be extracted from the document',
                'processedText': '',
                'doctorSummary': '',
                'patientSummary': '',
                'medications': [],
                'followUps': [],
                'redFlags': []
            }), 400
        
        # Use AI to summarize and structure the document
        ai_processor = AIProcessor()
        
        # Clean up OCR text if needed
        cleaned_text = ai_processor.cleanup_ocr_text(extracted_text)
        
        # Generate summary
        summary_result = ai_processor.summarize_document(cleaned_text)
        
        return jsonify({
            'success': True,
            'processedText': summary_result.get('processedText', cleaned_text),
            'doctorSummary': summary_result.get('doctorSummary', ''),
            'patientSummary': summary_result.get('patientSummary', ''),
            'medications': summary_result.get('medications', []),
            'followUps': summary_result.get('followUps', []),
            'redFlags': summary_result.get('redFlags', [])
        })
        
    except Exception as e:
        print(f"Error processing document: {e}")
        return jsonify({'error': str(e)}), 500


@process_bp.route('/ocr', methods=['POST'])
def process_ocr():
    """
    Process an image with OCR only (no AI summarization)
    
    Expected JSON body:
    {
        "fileUrl": "https://...",
        "fileType": "image/jpeg"
    }
    """
    try:
        data = request.get_json()
        
        if not data:
            return jsonify({'error': 'No data provided'}), 400
        
        file_url = data.get('fileUrl')
        file_type = data.get('fileType', 'image/jpeg')
        
        if not file_url:
            return jsonify({'error': 'fileUrl is required'}), 400
        
        doc_processor = DocumentProcessor()
        result = doc_processor.process(file_url, file_type)
        
        return jsonify({
            'success': result.get('success', False),
            'text': result.get('text', ''),
            'error': result.get('error')
        })
        
    except Exception as e:
        print(f"Error in OCR processing: {e}")
        return jsonify({'error': str(e)}), 500
