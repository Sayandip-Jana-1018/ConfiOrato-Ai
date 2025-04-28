"""
Body Language Detector

This module provides a class for detecting body language in video frames.
"""

import cv2
import mediapipe as mp
import numpy as np
import pickle
import os

class BodyLanguageDetector:
    """
    A class for detecting body language in video frames using MediaPipe.
    """
    
    def __init__(self):
        """
        Initialize the BodyLanguageDetector with MediaPipe Holistic model and load the trained model.
        """
        # Initialize MediaPipe Holistic model
        self.mp_holistic = mp.solutions.holistic
        self.mp_drawing = mp.solutions.drawing_utils
        self.mp_drawing_styles = mp.solutions.drawing_styles
        
        # Initialize the holistic model with optimized parameters for better detection
        self.holistic = self.mp_holistic.Holistic(
            min_detection_confidence=0.6,  # Increased from 0.5 for more accurate detection
            min_tracking_confidence=0.6,   # Increased from 0.5 for more stable tracking
            static_image_mode=False,       # Dynamic mode for video
            model_complexity=1             # Medium complexity for balance of speed and accuracy
        )
        
        # Previous prediction for smoothing
        self.prev_prediction = None
        self.smoothing_factor = 0.7  # Weight for current prediction (0.7 current, 0.3 previous)
        
        # Gesture confidence threshold
        self.confidence_threshold = 0.25  # Minimum confidence to report a gesture
        
        # Frame skipping for performance
        self.process_every_n_frames = 2
        self.frame_count = 0
        
        # Load the trained model
        model_path = os.path.join(os.path.dirname(__file__), 'body_language.pkl')
        try:
            with open(model_path, 'rb') as f:
                self.model = pickle.load(f)
            print(f"Model loaded from {model_path}")
        except Exception as e:
            print(f"Error loading model: {e}")
            self.model = None
    
    def process_frame(self, frame):
        """
        Process a single frame and return the annotated image with body language prediction.
        
        Args:
            frame: The input frame to process
            
        Returns:
            tuple: (annotated_image, prediction)
                - annotated_image: The frame with pose landmarks drawn
                - prediction: A dictionary with class and confidence
        """
        # Skip frames for better performance
        self.frame_count += 1
        if self.frame_count % self.process_every_n_frames != 0 and self.prev_prediction is not None:
            # Return previous prediction for skipped frames
            # Still draw landmarks for visual feedback
            rgb_frame = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
            annotated_image = cv2.cvtColor(rgb_frame, cv2.COLOR_RGB2BGR)
            self._draw_landmarks_basic(annotated_image, frame)
            return annotated_image, self.prev_prediction
        
        # Resize for faster processing if frame is large
        height, width = frame.shape[:2]
        process_frame = frame
        scale_factor = 1.0
        
        if width > 640 or height > 480:
            scale_factor = min(640 / width, 480 / height)
            process_frame = cv2.resize(frame, (0, 0), fx=scale_factor, fy=scale_factor)
        
        # Convert the BGR image to RGB
        rgb_frame = cv2.cvtColor(process_frame, cv2.COLOR_BGR2RGB)
        
        # Process the image and get the results
        results = self.holistic.process(rgb_frame)
        
        # Convert back to BGR for OpenCV
        annotated_image = frame.copy()  # Just use the original frame since we're already in BGR format
        
        # Draw the pose landmarks on the image
        if results and results.pose_landmarks:
            # Draw all landmarks
            self._draw_landmarks(annotated_image, results)
            
            # Extract pose landmarks
            pose = self._extract_landmarks(results)
            
            # Make prediction if model is loaded
            prediction = None
            if self.model is not None and pose is not None:
                try:
                    # Make prediction
                    body_language_class = self.model.predict([pose])[0]
                    body_language_prob = self.model.predict_proba([pose])[0]
                    confidence = body_language_prob[list(self.model.classes_).index(body_language_class)]
                    
                    # Apply smoothing with previous prediction
                    if self.prev_prediction is not None:
                        # If the same class, smooth the confidence
                        if self.prev_prediction['class'] == body_language_class:
                            confidence = (self.smoothing_factor * confidence + 
                                         (1 - self.smoothing_factor) * self.prev_prediction['confidence'])
                        # If different class but previous confidence was high, keep previous prediction
                        elif self.prev_prediction['confidence'] > 0.6 and confidence < 0.4:
                            body_language_class = self.prev_prediction['class']
                            confidence = self.prev_prediction['confidence'] * 0.9  # Slight decay
                    
                    # Only report gestures above threshold
                    if confidence >= self.confidence_threshold:
                        prediction = {
                            'class': body_language_class,
                            'confidence': float(confidence)
                        }
                        
                        # Apply our enhanced gesture detection
                        prediction = self._override_prediction(prediction)
                        
                        # Store for smoothing
                        self.prev_prediction = prediction
                        
                        # Add prediction text to the image
                        cv2.putText(
                            annotated_image, 
                            f"{prediction['class']} ({prediction['confidence']:.2f})", 
                            (10, 30), 
                            cv2.FONT_HERSHEY_SIMPLEX, 
                            1, 
                            (0, 255, 0), 
                            2, 
                            cv2.LINE_AA
                        )
                    elif self.prev_prediction is not None:
                        # Use previous prediction with decayed confidence
                        prediction = {
                            'class': self.prev_prediction['class'],
                            'confidence': float(self.prev_prediction['confidence'] * 0.9)  # Decay confidence
                        }
                        
                        # If confidence drops below threshold, clear prediction
                        if prediction['confidence'] < self.confidence_threshold:
                            self.prev_prediction = None
                        else:
                            self.prev_prediction = prediction
                except Exception as e:
                    print(f"Error making prediction: {e}")
                    prediction = None
            
            return annotated_image, prediction
        
        return annotated_image, None
    
    def _draw_landmarks(self, image, results):
        """
        Draw the pose landmarks on the image with enhanced visibility.
        
        Args:
            image: The image to draw on
            results: The MediaPipe results object
        """
        # Draw pose landmarks
        if results.pose_landmarks:
            # Enhanced pose landmarks with thicker lines and larger points
            self.mp_drawing.draw_landmarks(
                image,
                results.pose_landmarks,
                self.mp_holistic.POSE_CONNECTIONS,
                landmark_drawing_spec=self.mp_drawing.DrawingSpec(
                    color=(0, 255, 0),  # Bright green for better visibility
                    thickness=3,         # Thicker lines
                    circle_radius=5      # Larger points
                ),
                connection_drawing_spec=self.mp_drawing.DrawingSpec(
                    color=(255, 0, 255),  # Magenta for connections
                    thickness=2,
                    circle_radius=2
                )
            )
        
        # Draw face landmarks with more subtle visualization
        if results.face_landmarks:
            # Use a more subtle visualization for face landmarks
            self.mp_drawing.draw_landmarks(
                image,
                results.face_landmarks,
                self.mp_holistic.FACEMESH_CONTOURS,
                landmark_drawing_spec=None,
                connection_drawing_spec=self.mp_drawing.DrawingSpec(
                    color=(80, 110, 10), 
                    thickness=1, 
                    circle_radius=1
                )
            )
        
        # Draw hand landmarks with enhanced visibility
        if results.left_hand_landmarks:
            self.mp_drawing.draw_landmarks(
                image,
                results.left_hand_landmarks,
                self.mp_holistic.HAND_CONNECTIONS,
                landmark_drawing_spec=self.mp_drawing.DrawingSpec(
                    color=(0, 255, 255),  # Cyan for left hand
                    thickness=3, 
                    circle_radius=4
                ),
                connection_drawing_spec=self.mp_drawing.DrawingSpec(
                    color=(0, 165, 255),  # Orange for connections
                    thickness=2, 
                    circle_radius=2
                )
            )
        
        if results.right_hand_landmarks:
            self.mp_drawing.draw_landmarks(
                image,
                results.right_hand_landmarks,
                self.mp_holistic.HAND_CONNECTIONS,
                landmark_drawing_spec=self.mp_drawing.DrawingSpec(
                    color=(0, 255, 0),  # Green for right hand
                    thickness=3, 
                    circle_radius=4
                ),
                connection_drawing_spec=self.mp_drawing.DrawingSpec(
                    color=(255, 0, 255),  # Magenta for connections
                    thickness=2, 
                    circle_radius=2
                )
            )
            
    def _draw_landmarks_basic(self, image, frame):
        """
        Draw basic landmarks when skipping full processing.
        
        Args:
            image: The image to draw on
            frame: Original frame
        """
        # If we have a previous prediction, just draw a simple indicator
        if self.prev_prediction:
            # Draw a circle in the center of the frame
            h, w = frame.shape[:2]
            center = (w // 2, h // 2)
            
            # Color based on confidence
            confidence = self.prev_prediction['confidence']
            color = (0, int(255 * confidence), 0)  # Green with intensity based on confidence
            
            # Draw circle
            cv2.circle(image, center, 10, color, -1)
            
            # Add text
            cv2.putText(
                image,
                f"{self.prev_prediction['class']} ({confidence:.2f})",
                (10, 30),
                cv2.FONT_HERSHEY_SIMPLEX,
                1,
                color,
                2,
                cv2.LINE_AA
            )
    
    def _extract_landmarks(self, results):
        """
        Extract landmarks from the MediaPipe results.
        
        Args:
            results: The MediaPipe results object
            
        Returns:
            list: A flattened list of landmarks
        """
        # We need to match the exact feature format used during training (2004 features)
        pose = []
        
        # Extract pose landmarks (33 landmarks with x,y,z,visibility = 132 values)
        if results.pose_landmarks:
            for landmark in results.pose_landmarks.landmark:
                pose.append([landmark.x, landmark.y, landmark.z, landmark.visibility])
        else:
            # If no pose landmarks detected, return None
            return None
        
        # Extract face landmarks (468 landmarks with x,y,z = 1404 values)
        face = []
        if results.face_landmarks:
            for landmark in results.face_landmarks.landmark:
                face.append([landmark.x, landmark.y, landmark.z, 0])  # No visibility score for face
        else:
            # If no face landmarks, fill with zeros
            face = [[0, 0, 0, 0]] * 468  # MediaPipe uses 468 face landmarks
        
        # Combine all landmarks to match the expected 2004 features
        # Store the original features for our own use
        self.original_features = self._extract_enhanced_features(results)
        
        # Return the format expected by the model
        return np.array(pose + face).flatten().tolist()
    
    def _extract_enhanced_features(self, results):
        """
        Extract enhanced features for our internal use (not for the model)
        
        Args:
            results: The MediaPipe results object
            
        Returns:
            dict: Enhanced features for gesture recognition
        """
        features = {}
        
        # Check for specific hand gestures
        if results.left_hand_landmarks or results.right_hand_landmarks:
            # Allowed gestures
            features['thumbs_up'] = self._detect_thumbs_up(results)
            features['victory'] = self._detect_victory_sign(results)
            features['pointing'] = self._detect_pointing(results)
            features['open_palm'] = self._detect_open_palm(results)
            features['hand_emphasis'] = self._detect_hand_emphasis(results)
            
            # Disallowed gestures
            features['crossed_arms'] = self._detect_crossed_arms(results)
            features['hands_in_pockets'] = self._detect_hands_in_pockets(results)
            features['fidgeting'] = self._detect_fidgeting(results)
            features['face_touching'] = self._detect_face_touching(results)
        
        # Check for posture issues
        if results.pose_landmarks:
            features['slouching'] = self._detect_slouching(results)
            features['leaning'] = self._detect_leaning(results)
            features['balanced_posture'] = self._detect_balanced_posture(results)
        
        return features
        
    def _detect_thumbs_up(self, results):
        """Detect thumbs up gesture"""
        for hand_landmarks in [results.left_hand_landmarks, results.right_hand_landmarks]:
            if hand_landmarks:
                landmarks = hand_landmarks.landmark
                # Thumb is up if thumb tip is higher than thumb IP joint
                if landmarks[4].y < landmarks[3].y and landmarks[3].y < landmarks[2].y:
                    # Other fingers should be curled
                    other_fingers_curled = True
                    for finger_tip, finger_pip in [(8, 6), (12, 10), (16, 14), (20, 18)]:
                        if landmarks[finger_tip].y < landmarks[finger_pip].y:
                            other_fingers_curled = False
                            break
                    if other_fingers_curled:
                        return True
        return False
    
    def _detect_victory_sign(self, results):
        """Detect victory sign (peace sign)"""
        for hand_landmarks in [results.left_hand_landmarks, results.right_hand_landmarks]:
            if hand_landmarks:
                landmarks = hand_landmarks.landmark
                # Index and middle fingers extended
                index_up = landmarks[8].y < landmarks[5].y
                middle_up = landmarks[12].y < landmarks[9].y
                # Ring and pinky fingers curled
                ring_down = landmarks[16].y > landmarks[14].y
                pinky_down = landmarks[20].y > landmarks[18].y
                
                if index_up and middle_up and ring_down and pinky_down:
                    return True
        return False
    
    def _detect_pointing(self, results):
        """Detect pointing gesture"""
        for hand_landmarks in [results.left_hand_landmarks, results.right_hand_landmarks]:
            if hand_landmarks:
                landmarks = hand_landmarks.landmark
                # Only index finger extended
                index_up = landmarks[8].y < landmarks[5].y
                middle_down = landmarks[12].y > landmarks[9].y
                ring_down = landmarks[16].y > landmarks[14].y
                pinky_down = landmarks[20].y > landmarks[18].y
                
                if index_up and middle_down and ring_down and pinky_down:
                    return True
        return False
    
    def _detect_open_palm(self, results):
        """Detect open palm gesture"""
        for hand_landmarks in [results.left_hand_landmarks, results.right_hand_landmarks]:
            if hand_landmarks:
                landmarks = hand_landmarks.landmark
                # All fingers extended
                fingers_up = True
                for finger_tip, finger_base in [(8, 5), (12, 9), (16, 13), (20, 17)]:
                    if landmarks[finger_tip].y > landmarks[finger_base].y:
                        fingers_up = False
                        break
                
                if fingers_up:
                    return True
        return False
        
    def _detect_hand_emphasis(self, results):
        """Detect hand emphasis gesture (dynamic hand movement)"""
        # This is hard to detect from a single frame, but we can look for hands in a position
        # that suggests emphasis (hands at mid-height, slightly apart)
        if not hasattr(self, 'prev_hand_positions'):
            self.prev_hand_positions = []
            self.hand_movement_counter = 0
            
        current_positions = []
        
        # Check if hands are in a position typical for emphasis
        for hand_landmarks in [results.left_hand_landmarks, results.right_hand_landmarks]:
            if hand_landmarks:
                # Get wrist position
                wrist = hand_landmarks.landmark[0]
                current_positions.append((wrist.x, wrist.y))
                
                # Check if hand is in a typical emphasis position (mid-height)
                if 0.3 < wrist.y < 0.7 and 0.2 < wrist.x < 0.8:
                    self.hand_movement_counter += 1
        
        # Store positions for next frame
        self.prev_hand_positions = current_positions
        
        # If we've seen hands in emphasis position multiple times recently
        if self.hand_movement_counter > 5:
            self.hand_movement_counter = 0  # Reset counter
            return True
            
        return False
        
    def _detect_crossed_arms(self, results):
        """Detect crossed arms posture"""
        if not results.pose_landmarks:
            return False
            
        landmarks = results.pose_landmarks.landmark
        
        # Check if wrists are on opposite sides of the body
        if landmarks[15].x < landmarks[11].x and landmarks[16].x > landmarks[12].x:
            # Left wrist is right of right shoulder and right wrist is left of left shoulder
            return True
            
        # Check if elbows are close to each other
        elbow_distance = ((landmarks[13].x - landmarks[14].x)**2 + 
                         (landmarks[13].y - landmarks[14].y)**2)**0.5
        if elbow_distance < 0.15:  # Threshold for close elbows
            return True
            
        return False
        
    def _detect_hands_in_pockets(self, results):
        """Detect hands in pockets posture with improved accuracy"""
        if not results.pose_landmarks:
            return False
            
        landmarks = results.pose_landmarks.landmark
        
        # Check if hands are near hip level and not visible
        left_hand_visible = results.left_hand_landmarks is not None
        right_hand_visible = results.right_hand_landmarks is not None
        
        # If pose is visible but hands aren't, and wrists are near hip level
        if landmarks[15].visibility > 0.5 and landmarks[16].visibility > 0.5:  # Ensure wrists are visible
            left_wrist = landmarks[15]
            right_wrist = landmarks[16]
            left_hip = landmarks[23]
            right_hip = landmarks[24]
            
            # Check horizontal alignment (wrists should be slightly to the outside of hips)
            left_wrist_hip_x_aligned = abs(left_wrist.x - left_hip.x) < 0.15
            right_wrist_hip_x_aligned = abs(right_wrist.x - right_hip.x) < 0.15
            
            # Check vertical alignment (wrists should be near hip level)
            left_hand_near_hip = abs(left_wrist.y - left_hip.y) < 0.15 and left_wrist.y > left_hip.y - 0.1
            right_hand_near_hip = abs(right_wrist.y - right_hip.y) < 0.15 and right_wrist.y > right_hip.y - 0.1
            
            # One or both hands in pockets
            left_in_pocket = left_hand_near_hip and left_wrist_hip_x_aligned and not left_hand_visible
            right_in_pocket = right_hand_near_hip and right_wrist_hip_x_aligned and not right_hand_visible
            
            if left_in_pocket or right_in_pocket:
                return True
                
        return False
        
    def _detect_pointing(self, results):
        """Detect pointing gesture"""
        for hand_landmarks in [results.left_hand_landmarks, results.right_hand_landmarks]:
            if hand_landmarks:
                landmarks = hand_landmarks.landmark
                # Only index finger extended
                index_up = landmarks[8].y < landmarks[5].y
                middle_down = landmarks[12].y > landmarks[9].y
                ring_down = landmarks[16].y > landmarks[14].y
                pinky_down = landmarks[20].y > landmarks[18].y
                
                if index_up and middle_down and ring_down and pinky_down:
                    return True
                    
        return False
        
    def _detect_fidgeting(self, results):
        """Detect fidgeting (rapid small hand movements)"""
        if not hasattr(self, 'hand_positions_history'):
            self.hand_positions_history = []
            self.fidget_counter = 0
            
        # Track hand movement
        if results.left_hand_landmarks or results.right_hand_landmarks:
            for hand_landmarks in [h for h in [results.left_hand_landmarks, results.right_hand_landmarks] if h]:
                # Calculate average movement of hand landmarks
                if len(self.hand_positions_history) > 5:
                    # Get current positions
                    current_positions = [(lm.x, lm.y) for lm in hand_landmarks.landmark[:5]]  # Just use first 5 landmarks
                    
                    # Compare with previous positions
                    if len(self.hand_positions_history) > 0:
                        prev_positions = self.hand_positions_history[-1]
                        
                        # Calculate movement
                        movements = [((curr[0]-prev[0])**2 + (curr[1]-prev[1])**2)**0.5 
                                    for curr, prev in zip(current_positions, prev_positions)]
                        avg_movement = sum(movements) / len(movements)
                        
                        # Small, rapid movements indicate fidgeting
                        if 0.005 < avg_movement < 0.03:  # Small but not tiny movement
                            self.fidget_counter += 1
                        else:
                            self.fidget_counter = max(0, self.fidget_counter - 1)
                    
                    # Keep history limited
                    self.hand_positions_history = self.hand_positions_history[-5:] + [current_positions]
                else:
                    self.hand_positions_history.append([(lm.x, lm.y) for lm in hand_landmarks.landmark[:5]])
        
        # If we've detected fidgeting movements multiple times
        if self.fidget_counter > 8:
            self.fidget_counter = 0  # Reset counter
            return True
            
        return False
        
    def _detect_face_touching(self, results):
        """Detect hand touching face"""
        if not results.face_landmarks:
            return False
            
        for hand_landmarks in [h for h in [results.left_hand_landmarks, results.right_hand_landmarks] if h]:
            # Check if any fingertip is near the face
            for fingertip_idx in [4, 8, 12, 16, 20]:  # Thumb and fingertips
                fingertip = hand_landmarks.landmark[fingertip_idx]
                
                # Check distance to several face landmarks
                for face_idx in [0, 50, 100, 150, 200, 250, 300, 350, 400]:  # Sample face landmarks
                    if face_idx < len(results.face_landmarks.landmark):
                        face_point = results.face_landmarks.landmark[face_idx]
                        distance = ((fingertip.x - face_point.x)**2 + 
                                   (fingertip.y - face_point.y)**2)**0.5
                        
                        if distance < 0.05:  # Close enough to be touching
                            return True
                            
        return False
        
    def _detect_slouching(self, results):
        """Detect slouching posture"""
        if not results.pose_landmarks:
            return False
            
        landmarks = results.pose_landmarks.landmark
        
        # Check shoulder alignment relative to hips
        if all(landmarks[i].visibility > 0.7 for i in [11, 12, 23, 24]):  # If all landmarks visible
            left_shoulder = landmarks[11]
            right_shoulder = landmarks[12]
            left_hip = landmarks[23]
            right_hip = landmarks[24]
            
            # Calculate shoulder and hip centers
            shoulder_center_y = (left_shoulder.y + right_shoulder.y) / 2
            hip_center_y = (left_hip.y + right_hip.y) / 2
            
            # Calculate angle of back (should be straight)
            shoulder_width = abs(right_shoulder.x - left_shoulder.x)
            back_height = abs(shoulder_center_y - hip_center_y)
            
            # If shoulders are hunched or back is curved
            if shoulder_width < 0.2 or back_height < 0.15:  # Thresholds for slouching
                return True
                
            # Check if shoulders are significantly higher than they should be
            if shoulder_center_y > hip_center_y - 0.2:  # Shoulders too low relative to hips
                return True
                
        return False
        
    def _detect_leaning(self, results):
        """Detect leaning to one side"""
        if not results.pose_landmarks:
            return False
            
        landmarks = results.pose_landmarks.landmark
        
        # Check if shoulders are tilted
        if landmarks[11].visibility > 0.7 and landmarks[12].visibility > 0.7:  # If shoulders visible
            left_shoulder = landmarks[11]
            right_shoulder = landmarks[12]
            
            # Calculate shoulder tilt
            shoulder_tilt = abs(left_shoulder.y - right_shoulder.y)
            
            # If shoulders are significantly tilted
            if shoulder_tilt > 0.05:  # Threshold for leaning
                return True
                
        return False
        
    def _detect_balanced_posture(self, results):
        """Detect good, balanced posture"""
        if not results.pose_landmarks:
            return False
            
        # If we're not slouching or leaning, and shoulders are visible
        if not self._detect_slouching(results) and not self._detect_leaning(results):
            landmarks = results.pose_landmarks.landmark
            
            # Check if shoulders and hips are visible and aligned
            if all(landmarks[i].visibility > 0.7 for i in [11, 12, 23, 24]):
                left_shoulder = landmarks[11]
                right_shoulder = landmarks[12]
                left_hip = landmarks[23]
                right_hip = landmarks[24]
                
                # Calculate alignment
                shoulder_tilt = abs(left_shoulder.y - right_shoulder.y)
                hip_tilt = abs(left_hip.y - right_hip.y)
                
                # Good posture has minimal tilt and good spacing
                if shoulder_tilt < 0.03 and hip_tilt < 0.03:
                    return True
                    
        return False
    
    def _override_prediction(self, prediction):
        """
        Override model prediction with our enhanced feature detection
        
        Args:
            prediction: The original model prediction
            
        Returns:
            dict: Updated prediction with better gesture recognition
        """
        if not hasattr(self, 'original_features') or not self.original_features:
            return prediction
        
        # If we have a high-confidence prediction from the model, keep it
        if prediction and prediction['confidence'] > 0.7:
            return prediction
        
        # Check for disallowed gestures first (higher priority)
        if self.original_features.get('crossed_arms', False):
            return {'class': 'Crossed Arms', 'confidence': 0.85}
            
        if self.original_features.get('hands_in_pockets', False):
            return {'class': 'Hands In Pockets', 'confidence': 0.82}
            
        if self.original_features.get('face_touching', False):
            return {'class': 'Face Touching', 'confidence': 0.80}
            
        if self.original_features.get('fidgeting', False):
            return {'class': 'Fidgeting', 'confidence': 0.78}
            
        if self.original_features.get('slouching', False):
            return {'class': 'Slouching', 'confidence': 0.85}
            
        if self.original_features.get('leaning', False):
            return {'class': 'Leaning', 'confidence': 0.80}
        
        # Then check for allowed gestures
        if self.original_features.get('thumbs_up', False):
            return {'class': 'Thumbs Up', 'confidence': 0.85}
        
        if self.original_features.get('victory', False):
            return {'class': 'Victorious', 'confidence': 0.85}
        
        if self.original_features.get('pointing', False):
            return {'class': 'Pointing', 'confidence': 0.85}
        
        if self.original_features.get('open_palm', False):
            return {'class': 'Open Palm', 'confidence': 0.85}
            
        if self.original_features.get('hand_emphasis', False):
            return {'class': 'Hand Emphasis', 'confidence': 0.80}
            
        if self.original_features.get('balanced_posture', False):
            return {'class': 'Balanced Posture', 'confidence': 0.85}
        
        # If we couldn't detect a specific gesture, return the original prediction
        return prediction
