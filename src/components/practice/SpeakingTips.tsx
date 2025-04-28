import { HiLightBulb } from 'react-icons/hi';

interface SpeakingTipsProps {
  tips?: string[];
}

export default function SpeakingTips({ tips = [
  "Maintain good posture and eye contact",
  "Use gestures to emphasize key points",
  "Speak at a moderate pace with natural pauses",
  "Vary your vocal tone to maintain engagement",
  "Eliminate filler words like \"um\" and \"ah\""
] }: SpeakingTipsProps) {
  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center space-x-2 mb-6 justify-center">
        <HiLightBulb className="w-5 h-5 text-yellow-500" />
        <h2 className="text-xl font-bold text-white text-center">Speaking Tips</h2>
      </div>
      
      <p className="text-white/60 text-sm mb-4 text-center">Improve your speaking skills</p>
      
      <div className="space-y-3 flex-1">
        {tips.map((tip, index) => (
          <div key={index} className="flex items-start space-x-3">
            <div className="w-6 h-6 rounded-full bg-white/10 flex items-center justify-center flex-shrink-0 mt-0.5">
              <span className="text-white text-sm">{index + 1}</span>
            </div>
            <p className="text-white/90 text-sm">{tip}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
