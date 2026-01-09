"""
Summarization Routes for CarePrep AI
"""

from flask import Blueprint, request, jsonify
from ..processors import AIProcessor

summarize_bp = Blueprint('summarize', __name__)

@summarize_bp.route('/symptoms', methods=['POST'])
def summarize_symptoms():
    """
    Generate a doctor-friendly summary of symptoms
    
    Expected JSON body:
    {
        "symptoms": [
            {
                "date": "2024-01-15",
                "symptom": "Headache",
                "severity": 7,
                "notes": "Started in the morning"
            },
            ...
        ]
    }
    """
    try:
        data = request.get_json()
        
        if not data:
            return jsonify({'error': 'No data provided'}), 400
        
        symptoms = data.get('symptoms', [])
        
        if not symptoms:
            return jsonify({'error': 'No symptoms provided'}), 400
        
        if not isinstance(symptoms, list):
            return jsonify({'error': 'Symptoms must be a list'}), 400
        
        ai_processor = AIProcessor()
        result = ai_processor.generate_symptom_summary(symptoms)
        
        return jsonify({
            'success': result.get('success', False),
            'summary': result.get('summary', '')
        })
        
    except Exception as e:
        print(f"Error summarizing symptoms: {e}")
        return jsonify({'error': str(e)}), 500


@summarize_bp.route('/text', methods=['POST'])
def summarize_text():
    """
    Summarize raw medical text
    
    Expected JSON body:
    {
        "text": "Medical document text..."
    }
    """
    try:
        data = request.get_json()
        
        if not data:
            return jsonify({'error': 'No data provided'}), 400
        
        text = data.get('text', '')
        
        if not text.strip():
            return jsonify({'error': 'No text provided'}), 400
        
        ai_processor = AIProcessor()
        result = ai_processor.summarize_document(text)
        
        return jsonify({
            'success': result.get('success', False),
            'patientSummary': result.get('patientSummary', ''),
            'doctorSummary': result.get('doctorSummary', ''),
            'medications': result.get('medications', []),
            'followUps': result.get('followUps', []),
            'redFlags': result.get('redFlags', [])
        })
        
    except Exception as e:
        print(f"Error summarizing text: {e}")
        return jsonify({'error': str(e)}), 500
