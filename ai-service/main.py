"""
CarePrep AI - Python AI Service
Flask-based microservice for document processing and AI chat
"""

from flask import Flask, request, jsonify
from flask_cors import CORS
from dotenv import load_dotenv
import os

from app.routes.process_routes import process_bp
from app.routes.chat_routes import chat_bp
from app.routes.summarize_routes import summarize_bp

# Load environment variables
load_dotenv()

app = Flask(__name__)
CORS(app)

# Register blueprints
app.register_blueprint(process_bp, url_prefix='/process')
app.register_blueprint(chat_bp, url_prefix='/chat')
app.register_blueprint(summarize_bp, url_prefix='/summarize')

@app.route('/health', methods=['GET'])
def health_check():
    """Health check endpoint"""
    return jsonify({
        'status': 'healthy',
        'service': 'CarePrep AI Service',
        'version': '1.0.0'
    })

@app.errorhandler(Exception)
def handle_error(error):
    """Global error handler"""
    print(f"Error: {error}")
    return jsonify({
        'error': str(error),
        'type': type(error).__name__
    }), 500

if __name__ == '__main__':
    port = int(os.getenv('PORT', 5000))
    debug = os.getenv('FLASK_DEBUG', 'False').lower() == 'true'
    
    print(f"\n🤖 CarePrep AI Service starting on http://localhost:{port}")
    print(f"📋 Health check: http://localhost:{port}/health")
    
    app.run(host='0.0.0.0', port=port, debug=debug)
