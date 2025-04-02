import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { HiCheckCircle, HiXCircle, HiOutlineInformationCircle, HiOutlineLightBulb } from 'react-icons/hi';
import { ALLOWED_GESTURES, DISALLOWED_GESTURES, matchesGesture, getGestureDescription } from '../../constants/gestures';

interface RealTimeDetectionProps {
  currentPrediction?: { class: string; confidence: number } | null;
}

const RealTimeDetection: React.FC<RealTimeDetectionProps> = ({ currentPrediction }) => {
  const [gestureType, setGestureType] = useState<'allowed' | 'disallowed' | 'neutral'>('neutral');
  const [description, setDescription] = useState<string>('');
  const [tip, setTip] = useState<string>('');

  useEffect(() => {
    if (!currentPrediction) {
      setGestureType('neutral');
      setDescription('Waiting for gesture detection...');
      setTip('Position yourself clearly in front of the camera for better detection.');
      return;
    }

    const { class: gestureName, confidence } = currentPrediction;

    // Determine if the gesture is allowed or disallowed
    if (matchesGesture(gestureName, ALLOWED_GESTURES)) {
      setGestureType('allowed');
      setDescription(getGestureDescription(gestureName));

      // Set specific tips for allowed gestures
      if (gestureName.toLowerCase().includes('open palm')) {
        setTip('Great! Open palm gestures build trust with your audience.');
      } else if (gestureName.toLowerCase().includes('balanced')) {
        setTip('Excellent posture! This projects confidence and authority.');
      } else if (gestureName.toLowerCase().includes('thumbs up')) {
        setTip('Positive gestures like this can emphasize important points.');
      } else if (gestureName.toLowerCase().includes('victorious')) {
        setTip('Use this gesture sparingly to celebrate key achievements.');
      } else {
        setTip('Continue using this effective gesture in your presentations.');
      }
    } else if (matchesGesture(gestureName, DISALLOWED_GESTURES)) {
      setGestureType('disallowed');
      setDescription(getGestureDescription(gestureName));

      // Set specific tips for disallowed gestures
      if (gestureName.toLowerCase().includes('crossed arms')) {
        setTip('Try keeping your arms uncrossed to appear more open and receptive.');
      } else if (gestureName.toLowerCase().includes('slouching')) {
        setTip('Stand tall with shoulders back to project confidence.');
      } else if (gestureName.toLowerCase().includes('hands in pocket')) {
        setTip('Keep hands visible to enhance your expressiveness.');
      } else if (gestureName.toLowerCase().includes('fidgeting')) {
        setTip('Take a deep breath and focus on controlled movements.');
      } else {
        setTip('Consider avoiding this gesture during important presentations.');
      }
    } else {
      setGestureType('neutral');
      setDescription(`${gestureName} detected. Analyzing effectiveness...`);
      setTip('Focus on purposeful movements that enhance your message.');
    }
  }, [currentPrediction]);

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
            className="mr-2 text-yellow-400"
          >
            <HiOutlineInformationCircle size={24} />
          </motion.div>
        )}
        <h4 className="text-lg font-medium">{gestureName}</h4>
      </div>

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
                  : 'bg-yellow-500'
            }`}
            initial={{ width: 0 }}
            animate={{ width: `${confidencePercentage}%` }}
            transition={{ duration: 0.5 }}
          />
        </div>
      </div>

      <div className="mt-3 text-sm text-white/80">
        <p>{description}</p>
      </div>

      <div className="mt-3 text-xs text-white/70 flex items-start">
        <HiOutlineLightBulb className="text-yellow-400 mr-1 mt-0.5 flex-shrink-0" size={14} />
        <p>{tip}</p>
      </div>

      <div className="mt-3 text-xs text-white/60">
        <p>
          {gestureType === 'allowed'
            ? '✓ This is an allowed gesture for public speaking'
            : gestureType === 'disallowed'
              ? '✗ This gesture should be avoided during presentations'
              : '! Neutral gesture detected'}
        </p>
      </div>
    </div>
  );
};

export default RealTimeDetection;
