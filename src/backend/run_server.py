"""
Backend Server

This script runs the Flask server for the backend API.
"""

import os
from flask import Flask, jsonify
from flask_cors import CORS
from body_language_api import app as body_language_app
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Create Flask app
app = Flask(__name__)

# Get CORS configuration from environment variables
cors_origin = os.environ.get('CORS_ORIGIN', '*')
CORS(app, resources={r"/api/*": {"origins": cors_origin}})  # Enable CORS for all API routes

# Register the body language API blueprint
app.register_blueprint(body_language_app)

# Health check endpoint
@app.route('/api/health', methods=['GET'])
def health_check():
    return jsonify({
        'status': 'ok',
        'message': 'Server is running'
    })

if __name__ == '__main__':
    # Get port from environment variable or use default
    port = int(os.environ.get('PORT', 5000))
    
    # Get debug mode from environment variable
    debug_mode = os.environ.get('DEBUG', 'False').lower() == 'true'
    
    # Run the Flask app
    app.run(host='0.0.0.0', port=port, debug=debug_mode)
