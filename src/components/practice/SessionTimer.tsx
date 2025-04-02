import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { HiClock, HiStar, HiThumbUp, HiMusicNote } from 'react-icons/hi';
import { IconType } from 'react-icons';
import AudioRecorder from './AudioRecorder';

interface Achievement {
  id: number;
  title: string;
  completed: boolean;
  icon: IconType;
  color: string;
}

interface SessionTimerProps {
  sessionTime: number;
  isListening: boolean;
  onStartListening: () => Promise<void>;
  onStopListening: () => void;
  audioURL: string | null;
  sessionActive: boolean;
}

export default function SessionTimer({
  sessionTime,
  isListening,
  onStartListening,
  onStopListening,
  audioURL,
  sessionActive
}: SessionTimerProps) {
  const [achievements, setAchievements] = useState<Achievement[]>([
    { id: 1, title: 'First Practice', completed: true, icon: HiStar, color: 'yellow' },
    { id: 2, title: '5 Minutes Streak', completed: true, icon: HiClock, color: 'green' },
    { id: 3, title: 'Confidence Master', completed: false, icon: HiThumbUp, color: 'blue' },
    { id: 4, title: 'Pitch Perfect', completed: false, icon: HiMusicNote, color: 'purple' },
  ]);

  const formatTime = (timeInSeconds: number) => {
    const mins = Math.floor(timeInSeconds / 60);
    const secs = timeInSeconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center space-x-2 mb-6 justify-center">
        <HiClock className="w-5 h-5 text-green-500" />
        <h2 className="text-xl font-bold text-white text-center">Session Timer</h2>
      </div>
      
      <p className="text-white/60 text-sm mb-4 text-center">Track your practice time</p>
      
      <div className="flex-1 flex flex-col items-center justify-center">
        <div className="text-5xl font-bold text-white mb-6">{formatTime(sessionTime)}</div>
        <p className="text-white/60 text-sm mb-6 text-center">Target: 5 minutes</p>
        
        {/* Recording controls */}
        <AudioRecorder 
          isListening={isListening}
          onStartListening={onStartListening}
          onStopListening={onStopListening}
          audioURL={audioURL}
          sessionActive={sessionActive}
        />
      </div>
      
      {/* Recent Achievements */}
      <div className="mt-6">
        <h3 className="text-lg font-semibold text-white mb-4 text-center">Recent Achievements</h3>
        <div className="grid grid-cols-2 gap-2">
          {achievements.map((achievement) => (
            <div 
              key={achievement.id}
              className={`p-3 ${achievement.completed ? 'bg-white/5' : 'bg-white/5 opacity-50'} rounded-lg flex items-center space-x-2`}
            >
              <div className={`w-8 h-8 rounded-full bg-${achievement.color}-500/20 flex items-center justify-center`}>
                <achievement.icon className={`w-4 h-4 text-${achievement.color}-500`} />
              </div>
              <span className="text-white text-sm">{achievement.title}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
