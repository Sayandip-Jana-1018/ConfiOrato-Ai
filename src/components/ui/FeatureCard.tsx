import { motion } from 'framer-motion';
import { useTheme } from '../../context/ThemeContext';

interface FeatureCardProps {
  title: string;
  description: string;
  icon: string;
  delay?: number;
}

export default function FeatureCard({ 
  title, 
  description, 
  icon, 
  delay = 0 
}: FeatureCardProps) {
  const { themeColor } = useTheme();

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay }}
      whileHover={{ y: -5, transition: { duration: 0.2 } }}
      className="p-6 rounded-2xl backdrop-blur-lg border border-white/10"
      style={{
        background: `linear-gradient(135deg, ${themeColor}22 0%, ${themeColor}11 100%)`,
        boxShadow: `0 10px 30px -5px rgba(0, 0, 0, 0.3), 0 0 0 1px ${themeColor}22 inset`
      }}
    >
      <div className="text-4xl mb-4">{icon}</div>
      <h3 className="text-xl font-semibold text-white mb-2">{title}</h3>
      <p className="text-white/70">{description}</p>
    </motion.div>
  );
}
