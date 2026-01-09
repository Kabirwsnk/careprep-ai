"""
Chat Routes for CarePrep AI
"""

from flask import Blueprint, request, jsonify
from ..processors import AIProcessor

chat_bp = Blueprint('chat', __name__)

@chat_bp.route('', methods=['POST'])
def chat():
    """
    Process a chat message
    
    Expected JSON body:
    {
        "message": "User's question",
        "mode": "pre_visit" or "post_visit",
        "context": {
            "symptoms": [...] or
            "summary": {...}
        }
    }
    """
    try:
        data = request.get_json()
        
        if not data:
            return jsonify({'error': 'No data provided'}), 400
        
        message = data.get('message')
        mode = data.get('mode', 'pre_visit')
        context = data.get('context', {})
        
        if not message:
            return jsonify({'error': 'Message is required'}), 400
        
        if mode not in ['pre_visit', 'post_visit']:
            return jsonify({'error': 'Mode must be pre_visit or post_visit'}), 400
        
        ai_processor = AIProcessor()
        result = ai_processor.chat(message, mode, context)
        
        return jsonify({
            'success': result.get('success', False),
            'response': result.get('response', '')
        })
        
    except Exception as e:
        print(f"Error in chat: {e}")
        return jsonify({'error': str(e)}), 500


@chat_bp.route('/pre-visit', methods=['POST'])
def chat_pre_visit():
    """
    Pre-visit chat mode shorthand
    
    Expected JSON body:
    {
        "message": "User's question",
        "symptoms": [...]
    }
    """
    try:
        data = request.get_json()
        
        if not data:
            return jsonify({'error': 'No data provided'}), 400
        
        message = data.get('message')
        symptoms = data.get('symptoms', [])
        
        if not message:
            return jsonify({'error': 'Message is required'}), 400
        
        ai_processor = AIProcessor()
        result = ai_processor.chat(
            message, 
            'pre_visit', 
            {'symptoms': symptoms}
        )
        
        return jsonify({
            'success': result.get('success', False),
            'response': result.get('response', '')
        })
        
    except Exception as e:
        print(f"Error in pre-visit chat: {e}")
        return jsonify({'error': str(e)}), 500


@chat_bp.route('/post-visit', methods=['POST'])
def chat_post_visit():
    """
    Post-visit chat mode shorthand
    
    Expected JSON body:
    {
        "message": "User's question",
        "summary": {...}
    }
    """
    try:
        data = request.get_json()
        
        if not data:
            return jsonify({'error': 'No data provided'}), 400
        
        message = data.get('message')
        summary = data.get('summary', {})
        
        if not message:
            return jsonify({'error': 'Message is required'}), 400
        
        ai_processor = AIProcessor()
        result = ai_processor.chat(
            message, 
            'post_visit', 
            {'summary': summary}
        )
        
        return jsonify({
            'success': result.get('success', False),
            'response': result.get('response', '')
        })
        
    except Exception as e:
        print(f"Error in post-visit chat: {e}")
        return jsonify({'error': str(e)}), 500
