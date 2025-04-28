import { motion } from 'framer-motion';
import { useTheme } from '../../context/ThemeContext';

export default function LoadingScreen() {
  const { themeColor } = useTheme();
  
  return (
    <div className="flex flex-col items-center justify-center">
      <motion.div
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
        className="relative"
      >
        <div className="text-4xl font-bold text-white mb-8 relative z-10">
          Speaking Confidently is an art. Powered by ~ 
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-white to-white/50">AI</span>
        </div>
        <motion.div
          className="absolute -inset-4 rounded-xl opacity-50 blur-xl"
          style={{ background: themeColor }}
          animate={{
            scale: [1, 1.2, 1],
            opacity: [0.5, 0.8, 0.5],
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />
      </motion.div>
      
      <motion.div
        initial={{ width: 0 }}
        animate={{ width: 300 }}
        transition={{ duration: 1.5, ease: "easeInOut" }}
        className="h-1 bg-gradient-to-r from-transparent via-white to-transparent rounded-full"
      />
    </div>
  );
}
