import React from 'react';
import { VoiceAssistant } from '../voice-assistant/VoiceAssistant';
import { useVoiceAssistant } from '@/context/VoiceAssistantContext';
import { motion, AnimatePresence } from 'framer-motion';

const NavbarVoiceAssistant: React.FC = () => {
  const { isEnabled } = useVoiceAssistant();

  // Don't render if voice assistant is disabled
  if (!isEnabled) {
    return null;
  }

  return (
    <AnimatePresence>
      <motion.div 
        className="relative"
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.8 }}
        transition={{ duration: 0.3 }}
      >
        <div className="flex items-center justify-center w-10 h-10 rounded-full bg-gradient-to-br from-indigo-500/20 to-purple-600/20 backdrop-blur-sm">
          <motion.div
            className="flex items-center justify-center"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            transition={{ duration: 0.2 }}
          >
            <div className="flex items-center justify-center">
              <VoiceAssistant initialOpacity={0.4} />
            </div>
          </motion.div>
        </div>
        
        {/* Accessibility status announcement for screen readers */}
        <div className="sr-only" aria-live="polite" role="status">
          Voice assistant is ready. Say "Hey Assistant" to activate.
        </div>
      </motion.div>
    </AnimatePresence>
  );
};

export default NavbarVoiceAssistant;
