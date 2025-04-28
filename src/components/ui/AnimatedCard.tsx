import { ReactNode, useState } from 'react';
import { motion, AnimatePresence, Variants } from 'framer-motion';
import { useTheme } from '../../context/ThemeContext';
import GlassCard from './GlassCard';

export type AnimationStyle = 
  | 'fade' 
  | 'slide' 
  | 'scale' 
  | 'flip' 
  | 'rotate' 
  | 'bounce' 
  | 'pulse' 
  | 'wave';

export type AnimationTrigger = 
  | 'hover' 
  | 'click' 
  | 'view' 
  | 'load' 
  | 'scroll' 
  | 'manual';

interface AnimatedCardProps {
  children: ReactNode;
  className?: string;
  animationStyle?: AnimationStyle;
  animationTrigger?: AnimationTrigger;
  delay?: number;
  duration?: number;
  interactive?: boolean;
  expandable?: boolean;
  initiallyExpanded?: boolean;
  hoverEffect?: boolean;
  glowEffect?: boolean;
  borderEffect?: boolean;
  ariaLabel?: string;
  role?: string;
}

export default function AnimatedCard({
  children,
  className = '',
  animationStyle = 'fade',
  animationTrigger = 'load',
  delay = 0,
  duration = 0.5,
  interactive = true,
  expandable = false,
  initiallyExpanded = false,
  hoverEffect = true,
  glowEffect = false,
  borderEffect = false,
  ariaLabel,
  role = 'region',
}: AnimatedCardProps) {
  const { themeColor } = useTheme();
  const [isExpanded, setIsExpanded] = useState(initiallyExpanded);
  const [isHovered, setIsHovered] = useState(false);
  const [isVisible, setIsVisible] = useState(animationTrigger === 'load');
  const [isClicked, setIsClicked] = useState(false);

  // Convert hex color to RGB for CSS variables
  const hexToRgb = (hex: string) => {
    hex = hex.replace('#', '');
    const r = parseInt(hex.substring(0, 2), 16);
    const g = parseInt(hex.substring(2, 4), 16);
    const b = parseInt(hex.substring(4, 6), 16);
    return { r, g, b };
  };
  
  const rgb = hexToRgb(themeColor || '#8B5CF6');

  // Animation variants based on animation style
  const getAnimationVariants = (): Variants => {
    switch (animationStyle) {
      case 'fade':
        return {
          hidden: { opacity: 0 },
          visible: { opacity: 1, transition: { duration, delay } }
        };
      case 'slide':
        return {
          hidden: { opacity: 0, y: 20 },
          visible: { opacity: 1, y: 0, transition: { duration, delay } }
        };
      case 'scale':
        return {
          hidden: { opacity: 0, scale: 0.8 },
          visible: { opacity: 1, scale: 1, transition: { duration, delay } }
        };
      case 'flip':
        return {
          hidden: { opacity: 0, rotateY: 90 },
          visible: { opacity: 1, rotateY: 0, transition: { duration, delay } }
        };
      case 'rotate':
        return {
          hidden: { opacity: 0, rotate: -10 },
          visible: { opacity: 1, rotate: 0, transition: { duration, delay } }
        };
      case 'bounce':
        return {
          hidden: { opacity: 0, y: 50 },
          visible: { 
            opacity: 1, 
            y: 0, 
            transition: { 
              type: 'spring', 
              stiffness: 300, 
              damping: 15, 
              delay 
            } 
          }
        };
      case 'pulse':
        return {
          hidden: { opacity: 0, scale: 0.8 },
          visible: { 
            opacity: 1, 
            scale: [0.8, 1.05, 1], 
            transition: { 
              duration: duration * 1.5, 
              times: [0, 0.7, 1],
              delay 
            } 
          }
        };
      case 'wave':
        return {
          hidden: { opacity: 0, y: 20 },
          visible: { 
            opacity: 1, 
            y: 0, 
            transition: { 
              type: 'spring', 
              stiffness: 100, 
              damping: 10, 
              delay 
            } 
          }
        };
      default:
        return {
          hidden: { opacity: 0 },
          visible: { opacity: 1, transition: { duration, delay } }
        };
    }
  };

  // Expansion variants
  const expansionVariants: Variants = {
    collapsed: { height: 'auto' },
    expanded: { height: 'auto', transition: { duration: 0.3 } }
  };

  // Interactive effects
  const getInteractiveStyles = () => {
    const styles: any = {};
    
    if (glowEffect && isHovered) {
      styles.boxShadow = `0 0 20px 5px rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 0.3)`;
    }
    
    if (borderEffect && isHovered) {
      styles.borderColor = `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 0.5)`;
      styles.borderWidth = '2px';
    }
    
    return styles;
  };

  // Handle animation trigger
  const shouldAnimate = () => {
    switch (animationTrigger) {
      case 'hover':
        return isHovered;
      case 'click':
        return isClicked;
      case 'view':
      case 'load':
      case 'scroll':
        return isVisible;
      case 'manual':
        return false;
      default:
        return true;
    }
  };

  // Handle interaction events
  const handleMouseEnter = () => {
    setIsHovered(true);
    if (animationTrigger === 'hover') {
      setIsVisible(true);
    }
  };

  const handleMouseLeave = () => {
    setIsHovered(false);
    if (animationTrigger === 'hover') {
      setIsVisible(false);
    }
  };

  const handleClick = () => {
    if (expandable) {
      setIsExpanded(!isExpanded);
    }
    if (animationTrigger === 'click') {
      setIsClicked(!isClicked);
      setIsVisible(!isVisible);
    }
  };

  // Intersection Observer for scroll/view triggers
  const handleInView = (inView: boolean) => {
    if ((animationTrigger === 'view' || animationTrigger === 'scroll') && inView) {
      setIsVisible(true);
    }
  };

  return (
    <motion.div
      initial="hidden"
      animate={shouldAnimate() ? "visible" : "hidden"}
      variants={getAnimationVariants()}
      whileHover={hoverEffect ? { y: -5, transition: { duration: 0.2 } } : {}}
      whileTap={interactive ? { scale: 0.98 } : {}}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onClick={interactive ? handleClick : undefined}
      className={`${className} ${interactive ? 'cursor-pointer' : ''}`}
      style={getInteractiveStyles()}
      aria-label={ariaLabel}
      role={role}
      aria-expanded={expandable ? isExpanded : undefined}
    >
      <GlassCard className={className}>
        <AnimatePresence>
          <motion.div
            key="content"
            initial={false}
            animate={isExpanded ? "expanded" : "collapsed"}
            variants={expansionVariants}
            className="relative z-10 overflow-hidden"
          >
            {children}
          </motion.div>
        </AnimatePresence>
        
        {/* Expandable indicator */}
        {expandable && (
          <motion.div 
            className="absolute bottom-2 right-2 w-6 h-6 bg-white/10 rounded-full flex items-center justify-center"
            animate={{ rotate: isExpanded ? 180 : 0 }}
            transition={{ duration: 0.3 }}
          >
            <svg 
              xmlns="http://www.w3.org/2000/svg" 
              className="h-4 w-4 text-white/70" 
              fill="none" 
              viewBox="0 0 24 24" 
              stroke="currentColor"
            >
              <path 
                strokeLinecap="round" 
                strokeLinejoin="round" 
                strokeWidth={2} 
                d="M19 9l-7 7-7-7" 
              />
            </svg>
          </motion.div>
        )}
      </GlassCard>
    </motion.div>
  );
}
