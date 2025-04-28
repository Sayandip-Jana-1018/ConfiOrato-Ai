import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { HiCheckCircle, HiXCircle, HiOutlineLightBulb, HiOutlineChartBar } from 'react-icons/hi';
import { BodyLanguageMetrics } from '@/pages/api/body-language-feedback';

// Define comprehensive lists of allowed and disallowed gestures
const ALLOWED_GESTURES = [
  "Open Palm", 
  "Controlled Hand Movement", 
  "Head Nodding", 
  "Balanced Posture", 
  "Moderate Expressions", 
  "Steady Eye Contact", 
  "Purposeful Walking", 
  "Emphasis Gestures", 
  "Occasional Smiling", 
  "Limited Fist Gestures",
  "Thumbs Up",
  "Victorious",
  "Open"
];

const DISALLOWED_GESTURES = [
  "Crossed Arms", 
  "Hands in Pockets", 
  "Excessive Movements", 
  "Fidgeting", 
  "Slouching", 
  "Looking Away", 
  "Face Touching", 
  "Jumping", 
  "Restlessness", 
  "Crouching", 
  "Bending",
  "Victory Signs"
];

// Helper function to check if a gesture matches any in our defined lists
const matchesGesture = (detectedGesture: string, gestureList: string[]): boolean => {
  return gestureList.some(g => 
    detectedGesture.toLowerCase().includes(g.toLowerCase())
  );
};

interface BodyLanguageResultsProps {
  metrics: BodyLanguageMetrics | null;
  currentPrediction?: { gesture: string; confidence: number } | null;
}

const BodyLanguageResults: React.FC<BodyLanguageResultsProps> = ({
  metrics,
  currentPrediction
}) => {
  // State to track which tab is active
  const [activeTab, setActiveTab] = useState<'allowed' | 'disallowed' | 'insights' | 'metrics'>('allowed');

  // Format confidence as percentage
  const formatConfidence = (confidence: number) => {
    if (typeof confidence !== 'number' || isNaN(confidence)) {
      return '0.0%';
    }
    return `${(confidence).toFixed(1)}%`;
  };

  const [aiInsights, setAiInsights] = useState<string>('');
  const [detectedGestures, setDetectedGestures] = useState<{
    allowed: { name: string; percentage: number }[];
    disallowed: { name: string; percentage: number }[];
  }>({
    allowed: [],
    disallowed: []
  });

  // Process metrics to categorize gestures as allowed or disallowed
  useEffect(() => {
    // Create a copy of metrics to work with
    let metricsToProcess = metrics;
    let gesturePercentages = metrics?.gesturePercentages || {};
    
    // If we have a current prediction, incorporate it into the gesture percentages
    if (currentPrediction && currentPrediction.gesture) {
      // Create a new object that includes both the metrics data and current prediction
      gesturePercentages = {
        ...gesturePercentages,
        [currentPrediction.gesture]: currentPrediction.confidence * 100 // Convert confidence to percentage
      };
    }
    
    if (!metrics && !currentPrediction) return;

    const allowed: { name: string; percentage: number }[] = [];
    const disallowed: { name: string; percentage: number }[] = [];

    // Process each detected gesture
    Object.entries(gesturePercentages).forEach(([gesture, percentage]) => {
      // Ensure percentage is a valid number (not NaN or undefined)
      let numericPercentage = typeof percentage === 'string' ? parseFloat(percentage) : Number(percentage);
      
      // If percentage is NaN or undefined, set a default value of 0
      if (isNaN(numericPercentage) || numericPercentage === undefined) {
        numericPercentage = 0;
      }
      
      // Check if the gesture is in the allowed list
      const isAllowed = matchesGesture(gesture, ALLOWED_GESTURES);
      
      // Check if the gesture is in the disallowed list
      const isDisallowed = matchesGesture(gesture, DISALLOWED_GESTURES);

      if (isAllowed) {
        allowed.push({ name: gesture, percentage: numericPercentage });
      } else if (isDisallowed) {
        disallowed.push({ name: gesture, percentage: numericPercentage });
      } else {
        // If not explicitly categorized, use heuristics based on the gesture name
        if (gesture.includes('Thumbs Up') || 
            gesture.toLowerCase().includes('thumbs') || 
            gesture.toLowerCase().includes('thumb up')) { 
          allowed.push({ name: 'Thumbs Up', percentage: numericPercentage });
        } else if (gesture.toLowerCase().includes('victory') || 
                  gesture.toLowerCase().includes('v sign') || 
                  gesture.toLowerCase().includes('peace sign')) {
          disallowed.push({ name: 'Victory Signs', percentage: numericPercentage });
        } else if (gesture.toLowerCase().includes('cross') && 
                  gesture.toLowerCase().includes('arm')) {
          disallowed.push({ name: 'Crossed Arms', percentage: numericPercentage });
        } else if (gesture.toLowerCase().includes('open palm') || 
                  gesture.toLowerCase().includes('palm open') || 
                  gesture.toLowerCase().includes('open hand')) {
          allowed.push({ name: 'Open Palm', percentage: numericPercentage });
        } else if (gesture.toLowerCase().includes('slouch') || 
                  gesture.toLowerCase().includes('hunch') || 
                  gesture.toLowerCase().includes('poor posture')) {
          disallowed.push({ name: 'Slouching', percentage: numericPercentage });
        } else if (gesture.toLowerCase().includes('balanced') || 
                  gesture.toLowerCase().includes('good posture') || 
                  gesture.toLowerCase().includes('upright')) {
          allowed.push({ name: 'Balanced Posture', percentage: numericPercentage });
        } else if (gesture.toLowerCase().includes('point') || 
                  gesture.toLowerCase().includes('finger')) {
          // Pointing could be allowed as an emphasis gesture
          allowed.push({ name: 'Emphasis Gestures', percentage: numericPercentage });
        } else {
          // Default to allowed if we can't categorize
          allowed.push({ name: gesture, percentage: numericPercentage });
        }
      }
    });

    // Sort by percentage (highest first)
    allowed.sort((a, b) => b.percentage - a.percentage);
    disallowed.sort((a, b) => b.percentage - a.percentage);

    setDetectedGestures({ allowed, disallowed });

    // Generate AI insights based on the detected gestures
    generateAiInsights(allowed, disallowed);
  }, [metrics, currentPrediction]);

  // Generate AI insights based on detected gestures
  const generateAiInsights = (
    allowed: { name: string; percentage: number }[],
    disallowed: { name: string; percentage: number }[]
  ) => {
    if (allowed.length === 0 && disallowed.length === 0) {
      setAiInsights('No gestures detected during this session. Try recording for a longer duration.');
      return;
    }

    // Helper function to safely format percentages
    const formatPercentage = (value: number) => {
      return isNaN(value) ? '0.0' : Number(value).toFixed(1);
    };

    // Calculate the ratio of allowed vs disallowed gestures
    const totalAllowed = allowed.reduce((sum, item) => sum + (isNaN(item.percentage) ? 0 : item.percentage), 0);
    const totalDisallowed = disallowed.reduce((sum, item) => sum + (isNaN(item.percentage) ? 0 : item.percentage), 0);
    const totalPercentage = totalAllowed + totalDisallowed;
    
    // Prepare SWOT analysis for public speaking context
    let strengths = '';
    let weaknesses = '';
    let opportunities = '';
    let threats = '';

    // Strengths - based on allowed gestures
    if (allowed.length > 0) {
      const topAllowed = allowed.slice(0, Math.min(3, allowed.length));
      strengths = 'Your strongest public speaking gestures include ' + 
        topAllowed.map(g => `${g.name} (${formatPercentage(g.percentage)}%)`).join(', ') + 
        '. These gestures enhance your credibility and audience engagement.';
      
      // Add specific feedback based on detected gestures
      if (matchesGesture('Open Palm', topAllowed.map(g => g.name))) {
        strengths += ' Open palm gestures convey honesty and openness to your audience.';
      }
      if (matchesGesture('Eye Contact', topAllowed.map(g => g.name))) {
        strengths += ' Your steady eye contact builds trust with your audience.';
      }
      if (matchesGesture('Balanced Posture', topAllowed.map(g => g.name))) {
        strengths += ' Your balanced posture projects confidence and authority.';
      }
    } else {
      strengths = 'No positive gestures were detected. Focus on incorporating open palm gestures, balanced posture, and purposeful hand movements in your presentations.';
    }

    // Weaknesses - based on disallowed gestures
    if (disallowed.length > 0) {
      const topDisallowed = disallowed.slice(0, Math.min(3, disallowed.length));
      weaknesses = 'Areas for improvement include reducing ' + 
        topDisallowed.map(g => `${g.name} (${formatPercentage(g.percentage)}%)`).join(', ') + 
        ', which can distract from your message and reduce your perceived confidence.';
      
      // Add specific feedback based on detected gestures
      if (matchesGesture('Crossed Arms', topDisallowed.map(g => g.name))) {
        weaknesses += ' Crossed arms create a barrier between you and your audience.';
      }
      if (matchesGesture('Hands In Pockets', topDisallowed.map(g => g.name))) {
        weaknesses += ' Hands in pockets can appear casual or unprepared.';
      }
      if (matchesGesture('Fidgeting', topDisallowed.map(g => g.name)) || 
          matchesGesture('Excessive Movement', topDisallowed.map(g => g.name))) {
        weaknesses += ' Fidgeting and excessive movement distract from your message.';
      }
      if (matchesGesture('Looking Away', topDisallowed.map(g => g.name))) {
        weaknesses += ' Avoiding eye contact can reduce audience trust.';
      }
      if (matchesGesture('Slouching', topDisallowed.map(g => g.name))) {
        weaknesses += ' Slouching diminishes your authority and presence.';
      }
    } else {
      weaknesses = 'No negative gestures were detected. Great job maintaining positive body language throughout your presentation!';
    }

    // Opportunities for public speaking improvement
    if (totalPercentage > 0) {
      const positiveRatio = (totalAllowed / totalPercentage) * 100;
      if (positiveRatio > 70) {
        opportunities = 'You have a strong foundation of positive body language. To further enhance your public speaking:';
        opportunities += '<ul class="list-disc pl-5 mt-2 mb-2">';
        opportunities += '<li>Practice varying your gestures to emphasize different types of content</li>';
        opportunities += '<li>Use more deliberate hand movements to highlight key points</li>';
        opportunities += '<li>Incorporate strategic pauses with strong posture to add impact</li>';
        opportunities += '</ul>';
      } else if (positiveRatio > 40) {
        opportunities = 'To improve your public speaking body language:';
        opportunities += '<ul class="list-disc pl-5 mt-2 mb-2">';
        opportunities += '<li>Replace defensive gestures with open palm movements</li>';
        opportunities += '<li>Practice maintaining balanced posture throughout your presentation</li>';
        opportunities += '<li>Use purposeful gestures to emphasize important points</li>';
        opportunities += '<li>Maintain consistent eye contact with different sections of your audience</li>';
        opportunities += '</ul>';
      } else {
        opportunities = 'Focus on these fundamental improvements for effective public speaking:';
        opportunities += '<ul class="list-disc pl-5 mt-2 mb-2">';
        opportunities += '<li>Eliminate distracting movements like fidgeting and face touching</li>';
        opportunities += '<li>Practice open palm gestures to appear more trustworthy</li>';
        opportunities += '<li>Stand with feet shoulder-width apart for a balanced, confident stance</li>';
        opportunities += '<li>Use deliberate hand gestures to emphasize key points</li>';
        opportunities += '</ul>';
      }
    }

    // Threats to effective public speaking
    if (disallowed.length > 0) {
      threats = 'Watch out for these body language habits that could undermine your presentations:';
      threats += '<ul class="list-disc pl-5 mt-2 mb-2">';
      
      if (matchesGesture('Crossed Arms', disallowed.map(g => g.name))) {
        threats += '<li>Crossed arms create a barrier between you and your audience</li>';
      }
      if (matchesGesture('Hands In Pockets', disallowed.map(g => g.name))) {
        threats += '<li>Hands in pockets can appear casual or unprepared</li>';
      }
      if (matchesGesture('Fidgeting', disallowed.map(g => g.name)) || 
          matchesGesture('Excessive Movement', disallowed.map(g => g.name))) {
        threats += '<li>Fidgeting and excessive movement distract from your message</li>';
      }
      if (matchesGesture('Looking Away', disallowed.map(g => g.name))) {
        threats += '<li>Avoiding eye contact can reduce audience trust</li>';
      }
      if (matchesGesture('Slouching', disallowed.map(g => g.name))) {
        threats += '<li>Slouching diminishes your authority and presence</li>';
      }
      
      // Add general items if specific ones weren't added
      if (threats.split('<li>').length < 3) {
        threats += '<li>Inconsistent body language can confuse your audience</li>';
        threats += '<li>Nervous gestures can undermine your credibility</li>';
      }
      
      threats += '</ul>';
    } else {
      threats = 'Maintain your current positive body language to avoid developing distracting habits. Remember that even effective speakers can fall into negative patterns under pressure, so continue practicing good techniques.';
    }

    // Combine into SWOT analysis
    const swotAnalysis = `
      <strong>Strengths:</strong> ${strengths}<br><br>
      <strong>Weaknesses:</strong> ${weaknesses}<br><br>
      <strong>Opportunities:</strong> ${opportunities}<br><br>
      <strong>Threats:</strong> ${threats}
    `;

    setAiInsights(swotAnalysis);
  };

  if (!metrics) {
    return (
      <div className="text-center p-4">
        <p className="text-gray-400">No analysis data available. Start recording to generate insights.</p>
      </div>
    );
  }

  return (
    <div className="text-white h-full">
      <h3 className="text-xl font-medium mb-4">Your body language analysis</h3>
      
      {/* Tab Navigation */}
      <div className="flex flex-wrap border-b border-white/10 mb-4">
        <button
          className={`px-3 py-2 text-xs md:text-sm font-medium ${activeTab === 'allowed' ? 'text-green-400 border-b-2 border-green-400' : 'text-white/70 hover:text-white'}`}
          onClick={() => setActiveTab('allowed')}
        >
          <div className="flex items-center">
            <HiCheckCircle className="mr-1" />
            <span className="hidden sm:inline">Allowed</span>
          </div>
        </button>
        <button
          className={`px-3 py-2 text-xs md:text-sm font-medium ${activeTab === 'disallowed' ? 'text-red-400 border-b-2 border-red-400' : 'text-white/70 hover:text-white'}`}
          onClick={() => setActiveTab('disallowed')}
        >
          <div className="flex items-center">
            <HiXCircle className="mr-1" />
            <span className="hidden sm:inline">Disallowed</span>
          </div>
        </button>
        <button
          className={`px-3 py-2 text-xs md:text-sm font-medium ${activeTab === 'insights' ? 'text-blue-400 border-b-2 border-blue-400' : 'text-white/70 hover:text-white'}`}
          onClick={() => setActiveTab('insights')}
        >
          <div className="flex items-center">
            <HiOutlineLightBulb className="mr-1" />
            AI Insights
          </div>
        </button>
        <button
          className={`px-3 py-2 text-xs md:text-sm font-medium ${activeTab === 'metrics' ? 'text-purple-400 border-b-2 border-purple-400' : 'text-white/70 hover:text-white'}`}
          onClick={() => setActiveTab('metrics')}
        >
          <div className="flex items-center">
            <HiOutlineChartBar className="mr-1" />
            Metrics
          </div>
        </button>
      </div>
      
      {/* Tab Content - Fixed Height Container */}
      <div className="h-[300px] md:h-[350px] lg:h-[400px] overflow-y-auto">
        {/* Allowed Gestures Tab */}
        {activeTab === 'allowed' && (
          <div className="space-y-3">
            <h4 className="text-lg font-medium text-green-400 flex items-center">
              <HiCheckCircle className="mr-2" /> Allowed Gestures
            </h4>
            {detectedGestures.allowed.length > 0 ? (
              detectedGestures.allowed.map((gesture, index) => (
                <div key={index} className="flex justify-between items-center py-2 border-b border-white/10">
                  <span>{gesture.name}</span>
                  <span className="text-green-400">{formatConfidence(gesture.percentage)}</span>
                </div>
              ))
            ) : (
              <p className="text-white/70">No allowed gestures detected yet.</p>
            )}
          </div>
        )}
        
        {/* Disallowed Gestures Tab */}
        {activeTab === 'disallowed' && (
          <div className="space-y-3">
            <h4 className="text-lg font-medium text-red-400 flex items-center">
              <HiXCircle className="mr-2" /> Disallowed Gestures
            </h4>
            {detectedGestures.disallowed.length > 0 ? (
              detectedGestures.disallowed.map((gesture, index) => (
                <div key={index} className="flex justify-between items-center py-2 border-b border-white/10">
                  <span>{gesture.name}</span>
                  <span className="text-red-400">{formatConfidence(gesture.percentage)}</span>
                </div>
              ))
            ) : (
              <p className="text-white/70">No disallowed gestures detected yet.</p>
            )}
          </div>
        )}
        
        {/* AI Insights Tab */}
        {activeTab === 'insights' && (
          <div className="space-y-4">
            
            {/* Strengths Section */}
            <div className="mb-4">
              <h5 className="font-medium mb-2">Strengths:</h5>
              <p className="text-sm text-white/90">
                Your strongest public speaking gestures include 
                {detectedGestures.allowed.length > 0 
                  ? detectedGestures.allowed.slice(0, 3).map((g, i) => 
                      `${i === 0 ? ' ' : ', '}${g.name} (${formatConfidence(g.percentage)})`
                    ).join('')
                  : ' none detected yet'
                }. 
                {detectedGestures.allowed.length > 0 && 'These gestures enhance your credibility and audience engagement. Open palm gestures convey honesty and openness to your audience.'}
              </p>
            </div>
            
            {/* Weaknesses Section */}
            <div className="mb-4">
              <h5 className="font-medium mb-2">Weaknesses:</h5>
              <p className="text-sm text-white/90">
                Areas for improvement include reducing
                {detectedGestures.disallowed.length > 0 
                  ? detectedGestures.disallowed.slice(0, 2).map((g, i) => 
                      `${i === 0 ? ' ' : ', '}${g.name} (${formatConfidence(g.percentage)})`
                    ).join('')
                  : ' none detected yet'
                }
                {detectedGestures.disallowed.length > 0 && ', which can distract from your message and reduce your perceived confidence. Crossed arms create a barrier between you and your audience.'}
              </p>
            </div>
            
            {/* Opportunities Section */}
            <div className="mb-4">
              <h5 className="font-medium mb-2">Opportunities:</h5>
              <p className="text-sm text-white/90 mb-2">Focus on these fundamental improvements for effective public speaking:</p>
              <ul className="list-disc list-inside text-sm text-white/90 space-y-1">
                <li>Eliminate distracting movements like fidgeting and face touching</li>
                <li>Practice open palm gestures to appear more trustworthy</li>
                <li>Stand with feet shoulder-width apart for a balanced, confident stance</li>
                <li>Use deliberate hand gestures to emphasize key points</li>
              </ul>
            </div>
            
            {/* Threats Section */}
            <div>
              <h5 className="font-medium mb-2">Threats:</h5>
              <p className="text-sm text-white/90 mb-2">Watch out for these body language habits that could undermine your presentations:</p>
              <ul className="list-disc list-inside text-sm text-white/90 space-y-1">
                <li>Crossed arms create a barrier between you and your audience</li>
                <li>Inconsistent body language can confuse your audience</li>
                <li>Nervous gestures can undermine your credibility</li>
              </ul>
            </div>
          </div>
        )}
        
        {/* Metrics Tab */}
        {activeTab === 'metrics' && (
          <div className="space-y-4">
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="bg-white/5 p-4 rounded-lg">
                <h5 className="text-sm text-white/70 mb-1">Overall Score:</h5>
                <p className="text-2xl font-bold">
                  {metrics?.overallScore 
                    ? `${parseFloat(String(metrics.overallScore)).toFixed(2)}/100` 
                    : '0.00/100'}
                </p>
              </div>
              
              <div className="bg-white/5 p-4 rounded-lg">
                <h5 className="text-sm text-white/70 mb-1">Session Duration:</h5>
                <p className="text-2xl font-bold">
                  {metrics?.sessionDuration 
                    ? `${parseFloat(String(metrics.sessionDuration)).toFixed(1)}s` 
                    : '0.0s'}
                </p>
              </div>
            </div>
            
            <div className="bg-white/5 p-4 rounded-lg">
              <h5 className="text-sm text-white/70 mb-3">Gesture Distribution:</h5>
              <div className="space-y-3">
                {/* Allowed Gestures Distribution */}
                <div>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-green-400">Allowed Gestures</span>
                    <span>{detectedGestures.allowed.length > 0 
                      ? `${detectedGestures.allowed.reduce((sum, g) => sum + (g.percentage || 0), 0).toFixed(1)}%`
                      : '0.0%'}
                    </span>
                  </div>
                  <div className="w-full bg-white/10 rounded-full h-2">
                    <div 
                      className="bg-green-400 h-2 rounded-full" 
                      style={{ 
                        width: `${Math.min(
                          100, 
                          detectedGestures.allowed.reduce((sum, g) => sum + (g.percentage || 0), 0)
                        )}%` 
                      }}
                    ></div>
                  </div>
                </div>
                
                {/* Disallowed Gestures Distribution */}
                <div>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-red-400">Disallowed Gestures</span>
                    <span>{detectedGestures.disallowed.length > 0 
                      ? `${detectedGestures.disallowed.reduce((sum, g) => sum + (g.percentage || 0), 0).toFixed(1)}%`
                      : '0.0%'}
                    </span>
                  </div>
                  <div className="w-full bg-white/10 rounded-full h-2">
                    <div 
                      className="bg-red-400 h-2 rounded-full" 
                      style={{ 
                        width: `${Math.min(
                          100, 
                          detectedGestures.disallowed.reduce((sum, g) => sum + (g.percentage || 0), 0)
                        )}%` 
                      }}
                    ></div>
                  </div>
                </div>
              </div>
              
              {/* Top Gestures */}
              <div className="mt-4">
                <h6 className="text-xs text-white/70 mb-2">Top Gestures:</h6>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                  {[...detectedGestures.allowed, ...detectedGestures.disallowed]
                    .sort((a, b) => b.percentage - a.percentage)
                    .slice(0, 4)
                    .map((gesture, index) => (
                      <div 
                        key={index}
                        className={`p-2 rounded ${
                          detectedGestures.allowed.some(g => g.name === gesture.name)
                            ? 'bg-green-400/10 text-green-400'
                            : 'bg-red-400/10 text-red-400'
                        }`}
                      >
                        {gesture.name}: {formatConfidence(gesture.percentage)}
                      </div>
                    ))}
                </div>
              </div>
            </div>
            
            <div className="bg-white/5 p-4 rounded-lg">
              <h5 className="text-sm text-white/70 mb-2">Tips to Improve:</h5>
              <ul className="list-disc list-inside text-sm text-white/90 space-y-1">
                <li>Maintain a balanced ratio of effective gestures</li>
                <li>Aim for consistent, purposeful movements</li>
                <li>Practice eliminating nervous habits</li>
                <li>Record and review your presentations regularly</li>
              </ul>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default BodyLanguageResults;
