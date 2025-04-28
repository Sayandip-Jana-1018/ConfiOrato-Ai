import { ReactNode } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface TooltipProps {
  children: ReactNode;
  content: string;
}

export function Tooltip({ children, content }: TooltipProps) {
  return (
    <div className="relative group">
      {children}
      <AnimatePresence>
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 10 }}
          className="absolute z-50 invisible group-hover:visible bg-black/90 text-white text-sm px-2 py-1 rounded-md -top-8 left-1/2 transform -translate-x-1/2 whitespace-nowrap"
          style={{ backdropFilter: 'blur(8px)' }}
        >
          {content}
          <div className="absolute -bottom-1 left-1/2 transform -translate-x-1/2 w-2 h-2 bg-black/90 rotate-45" />
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
