from flask import Blueprint, request, jsonify
import cv2
import numpy as np
import base64
import time
import threading
from body_language_detector import BodyLanguageDetector

app = Blueprint('body_language', __name__)

# Create detector instance with thread lock for thread safety
detector = BodyLanguageDetector()
detector_lock = threading.Lock()

# Store session data with improved structure
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
    """Analyze a single frame and return the results with improved performance and error handling"""
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
            # Process the image with improved error handling
            try:
                # Handle different base64 formats
                if ',' in image_data:
                    image_data = image_data.split(',')[1]
                image_bytes = base64.b64decode(image_data)
                nparr = np.frombuffer(image_bytes, np.uint8)
                frame = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
            except Exception as e:
                print(f"Error decoding image: {str(e)}")
                return jsonify({
                    'processed_image': '',
                    'prediction': None,
                    'error': f'Invalid image format: {str(e)}'
                }), 200
            
            if frame is None or frame.size == 0:
                return jsonify({
                    'processed_image': '',
                    'prediction': None,
                    'error': 'Invalid or empty image data'
                }), 200
            
            # Use thread lock to ensure thread safety when processing frames
            with detector_lock:
                # Process the frame with the detector
                processed_frame, prediction = detector.process_frame(frame)
            
            # Update session data with more details
            if session_id in sessions:
                # Only store valid predictions
                if prediction is not None:
                    sessions[session_id]['detections'].append(prediction)
                    
                    # Track specific gestures for better analysis
                    gesture_name = prediction.get('class', 'unknown')
                    if gesture_name != 'unknown':
                        if 'gesture_counts' not in sessions[session_id]:
                            sessions[session_id]['gesture_counts'] = {}
                        
                        if gesture_name not in sessions[session_id]['gesture_counts']:
                            sessions[session_id]['gesture_counts'][gesture_name] = 0
                        
                        sessions[session_id]['gesture_counts'][gesture_name] += 1
                
                sessions[session_id]['frames_processed'] += 1
                sessions[session_id]['last_activity'] = time.time()
            
            # Encode the processed frame with quality control
            try:
                # Use higher quality for better visualization
                encode_params = [cv2.IMWRITE_JPEG_QUALITY, 85]
                _, buffer = cv2.imencode('.jpg', processed_frame, encode_params)
                processed_image = base64.b64encode(buffer).decode('utf-8')
            except Exception as e:
                print(f"Error encoding processed frame: {str(e)}")
                # Return just the prediction if image encoding fails
                return jsonify({
                    'processed_image': '',
                    'prediction': prediction,
                    'error': f'Error encoding processed frame: {str(e)}'
                }), 200
            
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
            'Pointing': gesture_percentages.get('Pointing', {'gesture_name': 'Pointing', 'gesture_count': 0, 'gesture_percentage': 0}),
            'Hand Emphasis': gesture_percentages.get('Hand Emphasis', {'gesture_name': 'Hand Emphasis', 'gesture_count': 0, 'gesture_percentage': 0}),
            'Balanced Posture': gesture_percentages.get('Balanced Posture', {'gesture_name': 'Balanced Posture', 'gesture_count': 0, 'gesture_percentage': 0}),
            'Victorious': gesture_percentages.get('Victorious', {'gesture_name': 'Victorious', 'gesture_count': 0, 'gesture_percentage': 0}),
            'Confident': gesture_percentages.get('Confident', {'gesture_name': 'Confident', 'gesture_count': 0, 'gesture_percentage': 0}),
            'Expressive': gesture_percentages.get('Expressive', {'gesture_name': 'Expressive', 'gesture_count': 0, 'gesture_percentage': 0})
        }
        
        disallowed_gestures = {
            'Crossed Arms': gesture_percentages.get('Crossed Arms', {'gesture_name': 'Crossed Arms', 'gesture_count': 0, 'gesture_percentage': 0}),
            'Arms Crossed': gesture_percentages.get('Arms Crossed', {'gesture_name': 'Arms Crossed', 'gesture_count': 0, 'gesture_percentage': 0}),
            'Hands In Pockets': gesture_percentages.get('Hands In Pockets', {'gesture_name': 'Hands In Pockets', 'gesture_count': 0, 'gesture_percentage': 0}),
            'Hands Behind Back': gesture_percentages.get('Hands Behind Back', {'gesture_name': 'Hands Behind Back', 'gesture_count': 0, 'gesture_percentage': 0}),
            'Fidgeting': gesture_percentages.get('Fidgeting', {'gesture_name': 'Fidgeting', 'gesture_count': 0, 'gesture_percentage': 0}),
            'Face Touching': gesture_percentages.get('Face Touching', {'gesture_name': 'Face Touching', 'gesture_count': 0, 'gesture_percentage': 0}),
            'Slouching': gesture_percentages.get('Slouching', {'gesture_name': 'Slouching', 'gesture_count': 0, 'gesture_percentage': 0}),
            'Leaning': gesture_percentages.get('Leaning', {'gesture_name': 'Leaning', 'gesture_count': 0, 'gesture_percentage': 0}),
            'Nervous': gesture_percentages.get('Nervous', {'gesture_name': 'Nervous', 'gesture_count': 0, 'gesture_percentage': 0}),
            'Closed': gesture_percentages.get('Closed', {'gesture_name': 'Closed', 'gesture_count': 0, 'gesture_percentage': 0})
        }
        
        # If we have a Leaning gesture in the percentages, make sure it's in disallowed, not allowed
        if 'Leaning' in gesture_percentages:
            # Remove from allowed if it was mistakenly added there
            if 'Leaning' in allowed_gestures:
                del allowed_gestures['Leaning']
            # Make sure it's in disallowed
            disallowed_gestures['Leaning'] = gesture_percentages['Leaning']
        
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
    """Generate feedback based on gesture percentages with improved analysis"""
    feedback = "Based on your body language analysis:\n\n"
    
    # Define allowed and disallowed gestures for analysis
    allowed_gestures = [
        'Open Palm', 'Thumbs Up', 'Pointing', 'Victorious', 'Hand Emphasis', 
        'Balanced Posture', 'Confident', 'Expressive'
    ]
    
    disallowed_gestures = [
        'Crossed Arms', 'Arms Crossed', 'Hands In Pockets', 'Hands Behind Back',
        'Face Touching', 'Fidgeting', 'Slouching', 'Leaning', 'Nervous', 'Closed'
    ]
    
    # Calculate totals for allowed and disallowed gestures
    allowed_total = sum([gesture_percentages.get(g, {}).get('gesture_percentage', 0) for g in allowed_gestures])
    disallowed_total = sum([gesture_percentages.get(g, {}).get('gesture_percentage', 0) for g in disallowed_gestures])
    
    # Overall assessment
    if allowed_total > 50 and disallowed_total < 10:
        feedback += "✓ Overall, your body language was very effective and engaging.\n"
    elif allowed_total > 30 and disallowed_total < 20:
        feedback += "✓ Your body language was generally positive with room for improvement.\n"
    elif disallowed_total > 30:
        feedback += "✗ Your body language showed several areas for improvement.\n"
    else:
        feedback += "! Your body language was mostly neutral. More expressive gestures would enhance engagement.\n"
    
    # Specific gesture feedback for allowed gestures
    if 'Open Palm' in gesture_percentages and gesture_percentages['Open Palm']['gesture_percentage'] > 20:
        feedback += "✓ Your open palm gestures effectively convey openness and honesty.\n"
    elif any(g in gesture_percentages for g in ['Open Palm', 'Thumbs Up']):
        feedback += "! Try using more open palm gestures to appear more trustworthy.\n"
    else:
        feedback += "✗ Consider incorporating open palm gestures to build trust with your audience.\n"
    
    if 'Thumbs Up' in gesture_percentages and gesture_percentages['Thumbs Up']['gesture_percentage'] > 10:
        feedback += "✓ Your positive gestures like thumbs up help reinforce key points.\n"
    
    if 'Pointing' in gesture_percentages and gesture_percentages['Pointing']['gesture_percentage'] > 10:
        if gesture_percentages['Pointing']['gesture_percentage'] > 30:
            feedback += "! While pointing effectively directs attention, you may be using it too frequently.\n"
        else:
            feedback += "✓ Your pointing gestures effectively direct attention to important elements.\n"
    
    if 'Hand Emphasis' in gesture_percentages and gesture_percentages['Hand Emphasis']['gesture_percentage'] > 15:
        feedback += "✓ Your hand emphasis gestures add visual dimension to your speech.\n"
    
    if 'Balanced Posture' in gesture_percentages and gesture_percentages['Balanced Posture']['gesture_percentage'] > 20:
        feedback += "✓ Your balanced posture projects confidence and professionalism.\n"
    
    # Specific feedback for disallowed gestures
    crossed_arms_percentage = (
        gesture_percentages.get('Crossed Arms', {}).get('gesture_percentage', 0) + 
        gesture_percentages.get('Arms Crossed', {}).get('gesture_percentage', 0)
    )
    
    if crossed_arms_percentage > 15:
        feedback += "✗ Reduce crossed arms posture as it can appear defensive or closed off.\n"
    
    if 'Hands In Pockets' in gesture_percentages and gesture_percentages['Hands In Pockets']['gesture_percentage'] > 15:
        feedback += "✗ Keep your hands visible rather than in pockets to appear more confident and engaged.\n"
    
    if 'Hands Behind Back' in gesture_percentages and gesture_percentages['Hands Behind Back']['gesture_percentage'] > 15:
        feedback += "✗ Bring your hands forward for more natural gestures instead of keeping them behind your back.\n"
    
    if 'Face Touching' in gesture_percentages and gesture_percentages['Face Touching']['gesture_percentage'] > 10:
        feedback += "✗ Avoid touching your face as it can indicate nervousness or uncertainty.\n"
    
    if 'Fidgeting' in gesture_percentages and gesture_percentages['Fidgeting']['gesture_percentage'] > 10:
        feedback += "✗ Reduce fidgeting movements as they can distract from your message.\n"
    
    if 'Slouching' in gesture_percentages and gesture_percentages['Slouching']['gesture_percentage'] > 10:
        feedback += "✗ Improve your posture by standing straighter to project more confidence.\n"
    
    if 'Leaning' in gesture_percentages and gesture_percentages['Leaning']['gesture_percentage'] > 10:
        feedback += "✗ Try to maintain a balanced stance without leaning to one side.\n"
    
    # Check if posture was generally good
    if crossed_arms_percentage < 10 and \
       gesture_percentages.get('Hands In Pockets', {}).get('gesture_percentage', 0) < 10 and \
       gesture_percentages.get('Slouching', {}).get('gesture_percentage', 0) < 10 and \
       gesture_percentages.get('Leaning', {}).get('gesture_percentage', 0) < 10:
        feedback += "✓ You maintained an open, confident posture throughout most of your presentation.\n"
    
    if 'Victorious' in gesture_percentages:
        if gesture_percentages['Victorious']['gesture_percentage'] > 20:
            feedback += "! You used the victory sign frequently. While it shows confidence, use it sparingly for key moments.\n"
        elif gesture_percentages['Victorious']['gesture_percentage'] > 5:
            feedback += "✓ Your victory gestures effectively highlight achievements when used sparingly.\n"
    
    # Gesture variety assessment
    unique_gestures = len([g for g in gesture_percentages if gesture_percentages[g]['gesture_percentage'] > 5])
    if unique_gestures >= 4:
        feedback += "✓ You used a good variety of gestures, keeping your presentation dynamic.\n"
    elif unique_gestures >= 2:
        feedback += "! Try to incorporate more variety in your gestures to maintain audience engagement.\n"
    else:
        feedback += "✗ Your gestures lacked variety. Different gestures help emphasize different points.\n"
    
    # General advice based on analysis
    feedback += "\nPersonalized recommendations:\n"
    
    if disallowed_total > 20:
        feedback += "• Focus on maintaining an open, confident posture throughout your presentation\n"
    
    if allowed_total < 30:
        feedback += "• Incorporate more purposeful hand gestures to emphasize key points\n"
    
    if gesture_percentages.get('Slouching', {}).get('gesture_percentage', 0) > 5 or \
       gesture_percentages.get('Leaning', {}).get('gesture_percentage', 0) > 5:
        feedback += "• Stand up straight with your shoulders back for a more confident appearance\n"
    else:
        feedback += "• Maintain your balanced posture throughout your presentations\n"
    
    if gesture_percentages.get('Hand Emphasis', {}).get('gesture_percentage', 0) < 10:
        feedback += "• Use more hand gestures to emphasize important points\n"
    
    feedback += "• Keep steady eye contact with your audience\n"
    feedback += "• Vary your gestures to maintain audience engagement\n"
    
    return feedback
