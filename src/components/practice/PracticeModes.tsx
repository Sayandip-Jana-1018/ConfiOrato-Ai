import { motion } from 'framer-motion';
import { IconType } from 'react-icons';
import { useTheme } from '../../context/ThemeContext';

interface PracticeEnvironment {
  id: string;
  name: string;
  icon: IconType;
  color: string;
  difficulty: number;
}

interface PracticeModesProps {
  environments: PracticeEnvironment[];
  selectedEnvironment: PracticeEnvironment;
  onSelectEnvironment: (environment: PracticeEnvironment) => void;
}

export default function PracticeModes({ 
  environments, 
  selectedEnvironment, 
  onSelectEnvironment 
}: PracticeModesProps) {
  const { themeColor } = useTheme();

  return (
    <div className="space-y-4">
      <p className="text-white/60 text-sm text-center">Select your practice environment</p>
      
      <div className="space-y-3">
        {environments.map((env) => (
          <motion.div
            key={env.id}
            className={`p-4 rounded-xl cursor-pointer transition-all ${
              selectedEnvironment.id === env.id 
                ? `bg-${env.color}-500/20 border border-${env.color}-500/50` 
                : 'bg-white/5 hover:bg-white/10'
            }`}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => onSelectEnvironment(env)}
          >
            <div className="flex items-center space-x-3">
              <div className={`w-10 h-10 rounded-lg bg-${env.color}-500/20 flex items-center justify-center`}>
                <env.icon className={`w-5 h-5 text-${env.color}-500`} />
              </div>
              <div>
                <h3 className="text-white font-medium">{env.name}</h3>
                <div className="flex items-center mt-1">
                  {[...Array(5)].map((_, i) => (
                    <div 
                      key={i}
                      className={`w-2 h-2 rounded-full mr-1 ${
                        i < env.difficulty 
                          ? `bg-${env.color}-500` 
                          : 'bg-white/20'
                      }`}
                    />
                  ))}
                  <span className="text-white/60 text-xs ml-1">
                    {env.difficulty === 1 ? 'Beginner' : 
                     env.difficulty === 2 ? 'Easy' : 
                     env.difficulty === 3 ? 'Intermediate' : 
                     env.difficulty === 4 ? 'Advanced' : 'Expert'}
                  </span>
                </div>
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
