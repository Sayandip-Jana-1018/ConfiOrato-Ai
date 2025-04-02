import React from 'react';
import { motion } from 'framer-motion';

interface GlassmorphicCardProps {
  children: React.ReactNode;
  className?: string;
}

const GlassmorphicCard: React.FC<GlassmorphicCardProps> = ({ children, className = '' }) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className={`relative overflow-hidden rounded-xl ${className}`}
    >
      {/* Improved glassmorphic effect with better contrast and depth */}
      <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-xl border border-white/20 shadow-2xl" />
      
      {/* Subtle top highlight */}
      <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-white/30 to-transparent" />
      
      {/* Content with improved padding and spacing */}
      <div className="relative p-8 z-10">
        {children}
      </div>
    </motion.div>
  );
};

export default GlassmorphicCard;
