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
        
        # Initialize the holistic model with good detection confidence
        self.holistic = self.mp_holistic.Holistic(
            min_detection_confidence=0.5,
            min_tracking_confidence=0.5,
            static_image_mode=False
        )
        
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
        # Convert the BGR image to RGB
        rgb_frame = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
        
        # Process the image and get the results
        results = self.holistic.process(rgb_frame)
        
        # Convert back to BGR for OpenCV
        annotated_image = cv2.cvtColor(rgb_frame, cv2.COLOR_RGB2BGR)
        
        # Draw the pose landmarks on the image
        if results.pose_landmarks:
            # Draw landmarks with thicker lines and larger points for better visibility
            self.mp_drawing.draw_landmarks(
                annotated_image,
                results.pose_landmarks,
                self.mp_holistic.POSE_CONNECTIONS,
                landmark_drawing_spec=self.mp_drawing.DrawingSpec(
                    color=(0, 255, 0), thickness=4, circle_radius=6),
                connection_drawing_spec=self.mp_drawing.DrawingSpec(
                    color=(255, 0, 255), thickness=4)
            )
            
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
                    
                    prediction = {
                        'class': body_language_class,
                        'confidence': float(confidence)
                    }
                    
                    # Add prediction text to the image
                    cv2.putText(
                        annotated_image, 
                        f"{body_language_class} ({confidence:.2f})", 
                        (10, 30), 
                        cv2.FONT_HERSHEY_SIMPLEX, 
                        1, 
                        (0, 255, 0), 
                        2, 
                        cv2.LINE_AA
                    )
                except Exception as e:
                    print(f"Error making prediction: {e}")
                    prediction = None
            
            return annotated_image, prediction
        
        return annotated_image, None
    
    def _draw_landmarks(self, image, results):
        """
        Draw the pose landmarks on the image.
        
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
                    color=(80, 110, 10), 
                    thickness=2, 
                    circle_radius=4
                ),
                connection_drawing_spec=self.mp_drawing.DrawingSpec(
                    color=(80, 256, 121), 
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
                    color=(121, 22, 76), 
                    thickness=2, 
                    circle_radius=4
                ),
                connection_drawing_spec=self.mp_drawing.DrawingSpec(
                    color=(121, 44, 250), 
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
                    color=(245, 117, 66), 
                    thickness=2, 
                    circle_radius=4
                ),
                connection_drawing_spec=self.mp_drawing.DrawingSpec(
                    color=(245, 66, 230), 
                    thickness=2, 
                    circle_radius=2
                )
            )
    
    def _extract_landmarks(self, results):
        """
        Extract landmarks from the MediaPipe results.
        
        Args:
            results: The MediaPipe results object
            
        Returns:
            list: A flattened list of landmarks
        """
        pose = []
        
        # Extract pose landmarks
        if results.pose_landmarks:
            for landmark in results.pose_landmarks.landmark:
                pose.append([landmark.x, landmark.y, landmark.z, landmark.visibility])
        else:
            # If no pose landmarks detected, return None
            return None
        
        # Extract face landmarks
        face = []
        if results.face_landmarks:
            for landmark in results.face_landmarks.landmark:
                face.append([landmark.x, landmark.y, landmark.z, 0])  # No visibility score for face
        else:
            # If no face landmarks, fill with zeros
            face = [[0, 0, 0, 0]] * 468  # MediaPipe uses 468 face landmarks
        
        # Combine all landmarks
        return np.array(pose + face).flatten().tolist()
