import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { HiCheckCircle, HiXCircle, HiOutlineInformationCircle, HiOutlineLightBulb } from 'react-icons/hi';
import { getGestureStatus, getGestureDescription, getGestureTip, isAllowedGesture, getGestureColor, getStabilityColor } from '../../backend/bodyLanguageFeedback';

interface RealTimeDetectionProps {
  currentPrediction: { class: string; confidence: number } | null;
}

const RealTimeDetection: React.FC<RealTimeDetectionProps> = ({ currentPrediction }) => {
  const [gestureType, setGestureType] = useState<'allowed' | 'disallowed' | 'neutral'>('neutral');
  const [stabilityCounter, setStabilityCounter] = useState<number>(1);
  const [stabilityScore, setStabilityScore] = useState<number>(0.1); // 0-1 score for detection stability
  const [lastPrediction, setLastPrediction] = useState<{ class: string; confidence: number } | null>(null);
  
  // Process current prediction with improved stability and accuracy
  useEffect(() => {
    if (!currentPrediction) {
      setGestureType('neutral');
      return;
    }

    const { class: gestureName, confidence } = currentPrediction;
    
    // Update gesture type based on status
    setGestureType(getGestureStatus(gestureName));
    
    // Track prediction stability
    if (lastPrediction?.class === gestureName) {
      setStabilityCounter(prev => Math.min(prev + 1, 10));
    } else {
      setStabilityCounter(1); // Reset counter for new gesture
    }
    
    // Update last prediction
    setLastPrediction(currentPrediction);
    
    // Calculate stability score (0-1)
    const stabilityScore = stabilityCounter / 10;
    setStabilityScore(stabilityScore);
    
    // Log detected gesture for debugging
    console.log(`Detected gesture: ${gestureName} (${confidence.toFixed(2)}) - Type: ${getGestureStatus(gestureName)}`);
  }, [currentPrediction, lastPrediction, stabilityCounter]);

  // If no prediction is available yet
  if (!currentPrediction) {
    return (
      <div className="text-white/70 flex flex-col items-center justify-center h-full">
        <HiOutlineInformationCircle className="text-4xl mb-2" />
        <p>Position yourself in front of the camera</p>
        <p className="text-sm mt-1">Waiting for gesture detection...</p>
      </div>
    );
  }

  const { class: gestureName, confidence } = currentPrediction;
  const confidencePercentage = (confidence * 100).toFixed(1);
  
  return (
    <div className="text-white">
      <div className="flex items-center mb-3">
        {gestureType === 'allowed' ? (
          <motion.div
            initial={{ scale: 0.8 }}
            animate={{ scale: 1 }}
            className="mr-2 text-green-400"
          >
            <HiCheckCircle size={24} />
          </motion.div>
        ) : gestureType === 'disallowed' ? (
          <motion.div
            initial={{ scale: 0.8 }}
            animate={{ scale: 1 }}
            className="mr-2 text-red-400"
          >
            <HiXCircle size={24} />
          </motion.div>
        ) : (
          <motion.div
            initial={{ scale: 0.8 }}
            animate={{ scale: 1 }}
            className="mr-2 text-blue-400"
          >
            <HiOutlineInformationCircle size={24} />
          </motion.div>
        )}
        <h4 className="text-lg font-medium">{gestureName}</h4>
      </div>

      {/* Confidence meter */}
      <div className="mb-3">
        <div className="flex justify-between mb-1">
          <span className="text-sm">Confidence</span>
          <span className="text-sm font-medium">{confidencePercentage}%</span>
        </div>
        <div className="w-full bg-gray-700 rounded-full h-2.5">
          <motion.div
            className={`h-2.5 rounded-full ${
              gestureType === 'allowed'
                ? 'bg-green-500'
                : gestureType === 'disallowed'
                  ? 'bg-red-500'
                  : 'bg-blue-500'
            }`}
            initial={{ width: 0 }}
            animate={{ width: `${confidencePercentage}%` }}
            transition={{ duration: 0.5 }}
          />
        </div>
      </div>
      
      {/* Stability indicator */}
      <div className="mb-3">
        <div className="flex justify-between mb-1">
          <span className="text-sm">Detection Stability</span>
          <span className="text-sm font-medium">{Math.round(stabilityScore * 100)}%</span>
        </div>
        <div className="w-full bg-gray-700 rounded-full h-1.5">
          <motion.div
            className={`h-1.5 rounded-full ${stabilityScore > 0.7 ? 'bg-green-500' : 
              stabilityScore > 0.4 ? 'bg-yellow-500' : 'bg-red-500'}`}
            initial={{ width: 0 }}
            animate={{ width: `${stabilityScore * 100}%` }}
            transition={{ duration: 0.5 }}
          />
        </div>
      </div>

      {/* Description */}
      <div className="mt-3 text-sm text-white/80">
        <p>{getGestureDescription(gestureName)}</p>
      </div>

      {/* Tip */}
      <div className="mt-3 text-xs text-white/70 flex items-start">
        <HiOutlineLightBulb className="text-yellow-400 mr-1 mt-0.5 flex-shrink-0" size={14} />
        <p>{getGestureTip(gestureName)}</p>
      </div>

      {/* Status */}
      <div className="mt-3 text-xs text-white/60">
        <p>
          {gestureType === 'allowed'
            ? '✓ This is a recommended gesture for public speaking'
            : gestureType === 'disallowed'
              ? '✗ This gesture is not recommended for public speaking'
              : '! This gesture has neutral impact on your presentation'}
        </p>
      </div>
    </div>
  );
};

export default RealTimeDetection;
