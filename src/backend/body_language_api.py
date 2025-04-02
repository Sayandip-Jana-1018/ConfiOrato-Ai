from flask import Blueprint, request, jsonify
import cv2
import numpy as np
import base64
import time
from body_language_detector import BodyLanguageDetector

app = Blueprint('body_language', __name__)
detector = BodyLanguageDetector()

# Store session data
sessions = {}

@app.route('/api/body-language/start-session', methods=['POST'])
def start_session():
    """Start a new body language analysis session"""
    session_id = str(int(time.time()))
    sessions[session_id] = {
        'start_time': time.time(),
        'frames_processed': 0,
        'detections': [],
    }
    
    print(f"Started session with ID: {session_id}")
    print(f"Session created with data: {sessions[session_id]}")  # Added debug print
    
    return jsonify({
        'session_id': session_id,
        'message': 'Session started successfully'
    })

@app.route('/api/body-language/analyze-frame', methods=['POST'])
def analyze_frame():
    """Analyze a single frame and return the results"""
    try:
        data = request.json
        
        if not data:
            return jsonify({'error': 'No data provided'}), 400
        
        session_id = data.get('session_id')
        image_data = data.get('image_data')
        
        if not session_id:
            return jsonify({'error': 'Missing session_id'}), 400
        
        if not image_data:
            return jsonify({'error': 'Missing image_data'}), 400
        
        # Try to find the session ID even if it's not an exact match
        matching_sessions = [sid for sid in sessions.keys() if str(sid) == str(session_id)]
        if matching_sessions:
            session_id = matching_sessions[0]
            
        if session_id not in sessions:
            # Return a graceful error instead of 404
            return jsonify({
                'processed_image': '',
                'prediction': None,
                'error': 'Session not found or expired'
            }), 200
        
        try:
            # Process the image
            image_data = image_data.split(',')[1]
            image_bytes = base64.b64decode(image_data)
            nparr = np.frombuffer(image_bytes, np.uint8)
            frame = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
            
            if frame is None:
                return jsonify({'error': 'Invalid image data'}), 400
            
            # Process the frame with the detector
            processed_frame, prediction = detector.process_frame(frame)
            
            # Update session data
            if session_id in sessions:
                sessions[session_id]['detections'].append(prediction)
                sessions[session_id]['frames_processed'] += 1
            
            # Encode the processed frame
            _, buffer = cv2.imencode('.jpg', processed_frame)
            processed_image = base64.b64encode(buffer).decode('utf-8')
            
            return jsonify({
                'processed_image': f'data:image/jpeg;base64,{processed_image}',
                'prediction': prediction
            })
            
        except Exception as e:
            print(f"Error processing frame: {str(e)}")
            return jsonify({
                'processed_image': '',
                'prediction': None,
                'error': f'Error processing frame: {str(e)}'
            }), 200  # Return 200 instead of 500 for graceful handling
            
    except Exception as e:
        print(f"Error in analyze_frame: {str(e)}")
        return jsonify({
            'processed_image': '',
            'prediction': None,
            'error': str(e)
        }), 200  # Return 200 instead of 500 for graceful handling

@app.route('/api/body-language/stop-session', methods=['POST'])
def stop_session():
    """Stop an active session and return analysis results"""
    try:
        data = request.json
        
        if not data:
            return jsonify({'error': 'No data provided', 'metrics': {}}), 200
        
        session_id = data.get('session_id')
        print(f"Attempting to stop session with ID: {session_id}")
        print(f"Available sessions: {list(sessions.keys())}")
        
        if not session_id:
            return jsonify({'error': 'Missing session_id', 'metrics': {}}), 200
        
        # Try to find the session ID even if it's not an exact match
        # This handles cases where the session ID might be stored as a number but sent as a string
        matching_sessions = [sid for sid in sessions.keys() if str(sid) == str(session_id)]
        if matching_sessions:
            session_id = matching_sessions[0]
        
        if session_id not in sessions:
            # Return empty metrics instead of 404 error
            print(f"Session ID not found: {session_id}")
            return jsonify({
                'error': f'Session ID not found: {session_id}',
                'metrics': {},
                'session_id': session_id,
                'duration': 0,
                'frames_processed': 0,
                'gesture_percentages': {},
                'feedback': 'No session data available',
                'overall_score': 0
            }), 200
        
        session_data = sessions[session_id]
        end_time = time.time()
        duration = end_time - session_data['start_time']
        
        # Calculate gesture percentages
        gesture_counts = {}
        total_frames = session_data['frames_processed']
        
        if total_frames > 0:
            for detection in session_data['detections']:
                gesture = detection['class']
                if gesture not in gesture_counts:
                    gesture_counts[gesture] = 0
                gesture_counts[gesture] += 1
            
            # Calculate percentages
            gesture_percentages = {}
            for gesture, count in gesture_counts.items():
                percentage = (count / total_frames) * 100
                gesture_percentages[gesture] = {
                    'gesture_name': gesture,
                    'gesture_count': count,
                    'gesture_percentage': percentage
                }
        else:
            gesture_percentages = {}
        
        # Define allowed and disallowed gestures
        allowed_gestures = {
            'Open Palm': gesture_percentages.get('Open Palm', {'gesture_name': 'Open Palm', 'gesture_count': 0, 'gesture_percentage': 0}),
            'Thumbs Up': gesture_percentages.get('Thumbs Up', {'gesture_name': 'Thumbs Up', 'gesture_count': 0, 'gesture_percentage': 0}),
            'Pointing': gesture_percentages.get('Pointing', {'gesture_name': 'Pointing', 'gesture_count': 0, 'gesture_percentage': 0})
        }
        
        disallowed_gestures = {
            'Crossed Arms': gesture_percentages.get('Crossed Arms', {'gesture_name': 'Crossed Arms', 'gesture_count': 0, 'gesture_percentage': 0}),
            'Victorious': gesture_percentages.get('Victorious', {'gesture_name': 'Victorious', 'gesture_count': 0, 'gesture_percentage': 0})
        }
        
        # Generate feedback
        feedback = generate_feedback(gesture_percentages)
        
        # Calculate overall score (0-100)
        overall_score = 0
        if total_frames > 0:
            allowed_percentage = sum([g['gesture_percentage'] for g in allowed_gestures.values()])
            disallowed_percentage = sum([g['gesture_percentage'] for g in disallowed_gestures.values()])
            
            # Higher score for more allowed gestures and fewer disallowed gestures
            overall_score = min(100, max(0, 50 + (allowed_percentage - disallowed_percentage) / 2))
        
        # Clean up session data
        del sessions[session_id]
        
        return jsonify({
            'session_id': session_id,
            'duration': duration,
            'frames_processed': total_frames,
            'gesture_percentages': gesture_percentages,
            'allowed_gestures': allowed_gestures,
            'disallowed_gestures': disallowed_gestures,
            'feedback': feedback,
            'overall_score': overall_score
        })
        
    except Exception as e:
        print(f"Error in stop_session: {str(e)}")
        return jsonify({'error': str(e)}), 500

def generate_feedback(gesture_percentages):
    """Generate feedback based on gesture percentages"""
    feedback = "Based on your body language analysis:\n\n"
    
    # Check for specific gestures
    if 'Open Palm' in gesture_percentages and gesture_percentages['Open Palm']['gesture_percentage'] > 20:
        feedback += "✓ Your open palm gestures convey openness and honesty.\n"
    else:
        feedback += "✗ Try using more open palm gestures to appear more trustworthy.\n"
    
    if 'Thumbs Up' in gesture_percentages and gesture_percentages['Thumbs Up']['gesture_percentage'] > 10:
        feedback += "✓ Your positive gestures like thumbs up help reinforce key points.\n"
    
    if 'Pointing' in gesture_percentages and gesture_percentages['Pointing']['gesture_percentage'] > 10:
        feedback += "✓ Your pointing gestures effectively direct attention.\n"
    
    if 'Crossed Arms' in gesture_percentages and gesture_percentages['Crossed Arms']['gesture_percentage'] > 15:
        feedback += "✗ Reduce crossed arms posture as it can appear defensive or closed off.\n"
    else:
        feedback += "✓ You maintained an open posture throughout most of your presentation.\n"
    
    if 'Victorious' in gesture_percentages and gesture_percentages['Victorious']['gesture_percentage'] > 15:
        feedback += "✗ Limit victory signs as they may appear unprofessional in formal settings.\n"
    
    # General advice
    feedback += "\nGeneral recommendations:\n"
    feedback += "• Maintain balanced posture and avoid slouching\n"
    feedback += "• Use purposeful hand movements to emphasize points\n"
    feedback += "• Keep steady eye contact with your audience\n"
    feedback += "• Vary your gestures to maintain audience engagement\n"
    
    return feedback
