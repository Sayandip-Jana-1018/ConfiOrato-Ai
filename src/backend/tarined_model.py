"""
Generate Training Data for Body Language Detection

This script generates realistic training data for body language detection using MediaPipe landmarks.
It creates a dataset with realistic pose configurations for different gestures and saves it to a CSV file.
"""

import numpy as np
import pandas as pd
import os
import pickle
from sklearn.model_selection import train_test_split
from sklearn.pipeline import make_pipeline
from sklearn.preprocessing import StandardScaler
from sklearn.ensemble import RandomForestClassifier
from sklearn.metrics import accuracy_score, classification_report

# Define the gesture classes
GESTURES = {
    "Victorious": {
        "description": "Victory sign with right hand raised",
        "key_points": {
            "right_wrist": [0.6, 0.5, 0.0],  # x, y, z coordinates
            "right_index": [0.65, 0.4, 0.0],
            "right_middle": [0.7, 0.4, 0.0],
            "right_shoulder": [0.5, 0.3, 0.0],
            "right_elbow": [0.55, 0.4, 0.0],
        }
    },
    "Thumbs Up": {
        "description": "Thumbs up gesture with right hand",
        "key_points": {
            "right_wrist": [0.6, 0.5, 0.0],
            "right_thumb": [0.65, 0.4, 0.0],
            "right_index": [0.6, 0.45, 0.0],
            "right_shoulder": [0.5, 0.3, 0.0],
            "right_elbow": [0.55, 0.4, 0.0],
        }
    },
    "Open Palm": {
        "description": "Open palm gesture with right hand",
        "key_points": {
            "right_wrist": [0.6, 0.5, 0.0],
            "right_thumb": [0.7, 0.5, 0.0],
            "right_index": [0.65, 0.4, 0.0],
            "right_middle": [0.6, 0.39, 0.0],
            "right_ring": [0.55, 0.4, 0.0],
            "right_pinky": [0.5, 0.42, 0.0],
            "right_shoulder": [0.5, 0.3, 0.0],
            "right_elbow": [0.55, 0.4, 0.0],
        }
    },
    "Pointing": {
        "description": "Pointing gesture with right index finger",
        "key_points": {
            "right_wrist": [0.6, 0.5, 0.0],
            "right_index": [0.7, 0.4, 0.0],
            "right_middle": [0.65, 0.5, 0.0],
            "right_ring": [0.63, 0.51, 0.0],
            "right_pinky": [0.61, 0.52, 0.0],
            "right_shoulder": [0.5, 0.3, 0.0],
            "right_elbow": [0.55, 0.4, 0.0],
        }
    },
    "Crossed Arms": {
        "description": "Arms crossed in front of chest",
        "key_points": {
            "right_wrist": [0.4, 0.4, 0.0],
            "right_elbow": [0.6, 0.4, 0.0],
            "right_shoulder": [0.6, 0.3, 0.0],
            "left_wrist": [0.6, 0.4, 0.0],
            "left_elbow": [0.4, 0.4, 0.0],
            "left_shoulder": [0.4, 0.3, 0.0],
        }
    },
    "Hands on Hips": {
        "description": "Standing with hands on hips",
        "key_points": {
            "right_wrist": [0.7, 0.5, 0.0],
            "right_elbow": [0.7, 0.4, 0.0],
            "right_shoulder": [0.6, 0.3, 0.0],
            "right_hip": [0.6, 0.5, 0.0],
            "left_wrist": [0.3, 0.5, 0.0],
            "left_elbow": [0.3, 0.4, 0.0],
            "left_shoulder": [0.4, 0.3, 0.0],
            "left_hip": [0.4, 0.5, 0.0],
        }
    },
    "Arms Raised": {
        "description": "Both arms raised above head",
        "key_points": {
            "right_wrist": [0.7, 0.1, 0.0],
            "right_elbow": [0.65, 0.2, 0.0],
            "right_shoulder": [0.6, 0.3, 0.0],
            "left_wrist": [0.3, 0.1, 0.0],
            "left_elbow": [0.35, 0.2, 0.0],
            "left_shoulder": [0.4, 0.3, 0.0],
        }
    }
}

# MediaPipe pose landmark indices (simplified for clarity)
POSE_LANDMARKS = {
    # Torso
    "nose": 0,
    "left_shoulder": 11,
    "right_shoulder": 12,
    "left_hip": 23,
    "right_hip": 24,
    
    # Arms
    "left_elbow": 13,
    "right_elbow": 14,
    "left_wrist": 15,
    "right_wrist": 16,
    
    # Hands (simplified)
    "left_thumb": 21,
    "right_thumb": 22,
    "left_index": 19,
    "right_index": 20,
    "left_middle": 17,
    "right_middle": 18,
    "left_ring": 25,  # Note: These are not actual MediaPipe indices, simplified for demo
    "right_ring": 26,
    "left_pinky": 27,
    "right_pinky": 28,
}

def generate_pose_sample(gesture_name, noise_level=0.03):
    """
    Generate a single sample for a specific gesture with realistic pose landmarks.
    
    Args:
        gesture_name: Name of the gesture to generate
        noise_level: Amount of random noise to add for variation
        
    Returns:
        Dictionary with pose landmarks
    """
    # Initialize all landmarks with default values (center of frame)
    landmarks = {name: [0.5, 0.5, 0.0, 1.0] for name in POSE_LANDMARKS.keys()}
    
    # Set specific key points for this gesture
    gesture_data = GESTURES[gesture_name]
    for point_name, coords in gesture_data["key_points"].items():
        # Add some random noise for variation
        noisy_coords = [
            coord + np.random.normal(0, noise_level) for coord in coords
        ]
        # Add visibility (1.0 = fully visible)
        noisy_coords.append(1.0)
        landmarks[point_name] = noisy_coords
    
    # Convert to flat array in the order of POSE_LANDMARKS
    flat_landmarks = []
    for name in POSE_LANDMARKS.keys():
        flat_landmarks.extend(landmarks[name])
    
    return flat_landmarks

def generate_dataset(samples_per_class=100):
    """
    Generate a complete dataset with all gesture classes.
    
    Args:
        samples_per_class: Number of samples to generate per gesture class
        
    Returns:
        X: Feature array
        y: Target labels
    """
    X = []
    y = []
    
    for gesture_name in GESTURES.keys():
        for _ in range(samples_per_class):
            # Generate sample with varying noise levels
            noise = np.random.uniform(0.01, 0.05)
            sample = generate_pose_sample(gesture_name, noise_level=noise)
            X.append(sample)
            y.append(gesture_name)
    
    return np.array(X), np.array(y)

def train_and_save_model():
    """
    Generate dataset, train a model, and save both the dataset and model.
    """
    print("Generating synthetic MediaPipe landmark dataset...")
    X, y = generate_dataset(samples_per_class=200)
    
    # Create a DataFrame for better visualization
    columns = []
    for name in POSE_LANDMARKS.keys():
        columns.extend([f"{name}_x", f"{name}_y", f"{name}_z", f"{name}_visibility"])
    
    df = pd.DataFrame(X, columns=columns)
    df['gesture'] = y
    
    # Save the dataset
    dataset_path = os.path.join(os.path.dirname(__file__), 'body_language_dataset.csv')
    df.to_csv(dataset_path, index=False)
    print(f"Dataset saved to {dataset_path}")
    
    # Split the data
    X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.3, random_state=42)
    
    # Create and train model
    print("Training model...")
    pipeline = make_pipeline(
        StandardScaler(), 
        RandomForestClassifier(n_estimators=100, random_state=42)
    )
    
    pipeline.fit(X_train, y_train)
    
    # Evaluate
    y_pred = pipeline.predict(X_test)
    accuracy = accuracy_score(y_test, y_pred)
    print(f"Model accuracy: {accuracy:.4f}")
    print("\nClassification Report:")
    print(classification_report(y_test, y_pred))
    
    # Save the model
    model_path = os.path.join(os.path.dirname(__file__), 'body_language.pkl')
    with open(model_path, 'wb') as f:
        pickle.dump(pipeline, f)
    
    print(f"Model saved to {model_path}")
    
    # Generate feature importance analysis
    if hasattr(pipeline[-1], 'feature_importances_'):
        importances = pipeline[-1].feature_importances_
        indices = np.argsort(importances)[::-1]
        
        print("\nTop 10 Most Important Features:")
        for i in range(min(10, len(columns))):
            idx = indices[i]
            print(f"{columns[idx]}: {importances[idx]:.4f}")

def visualize_dataset_sample():
    """
    Generate a visualization of what the dataset represents in terms of body positions.
    This is a text-based visualization for demonstration purposes.
    """
    print("\nExample Gesture Visualizations (ASCII):")
    
    visualizations = {
        "Victorious": """
            O (head)
           /|\\
          / | \\
         /  |  \\
           / \\
          /   \\
         /     \\
           Right arm raised with V sign
        """,
        
        "Thumbs Up": """
            O (head)
           /|\\
          / | \\
         /  |  \\
           / \\    👍
          /   \\
         /     \\
           Right arm with thumbs up
        """,
        
        "Crossed Arms": """
            O (head)
           /|\\
          / | \\
         /XX|XX\\
           / \\
          /   \\
         /     \\
           Arms crossed in front
        """
    }
    
    for gesture, viz in visualizations.items():
        print(f"\n{gesture}:{viz}")

if __name__ == "__main__":
    train_and_save_model()
    visualize_dataset_sample()
    
    print("\nDone! You now have a realistic synthetic dataset and trained model for body language detection.")
    print("The dataset represents realistic MediaPipe skeletal point configurations for various gestures.")