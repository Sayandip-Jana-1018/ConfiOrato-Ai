import { ReactNode } from 'react';
import { useTheme } from '@/context/ThemeContext';

interface GlassCardProps {
  children: ReactNode;
  className?: string;
  onClick?: () => void;
}

export default function GlassCard({ children, className = '', onClick }: GlassCardProps) {
  const { themeColor } = useTheme();
  
  // Convert hex color to RGB for CSS variables
  const hexToRgb = (hex: string) => {
    // Remove # if present
    hex = hex.replace('#', '');
    
    // Parse the hex values
    const r = parseInt(hex.substring(0, 2), 16);
    const g = parseInt(hex.substring(2, 4), 16);
    const b = parseInt(hex.substring(4, 6), 16);
    
    // Return RGB values
    return { r, g, b };
  };
  
  const rgb = hexToRgb(themeColor || '#8B5CF6');
  
  return (
    <div 
      className={`glass-card bg-white/5 backdrop-filter backdrop-blur-lg border border-white/10 rounded-xl shadow-xl hover:shadow-2xl transition-all duration-300 hover:border-white/20 relative overflow-hidden ${className} ${onClick ? 'cursor-pointer' : ''}`}
      style={{
        background: `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 0.2)`,
        boxShadow: `0 8px 32px 0 rgba(0, 0, 0, 0.37)`,
        borderColor: `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 0.18)`
      }}
      onClick={onClick}
    >
      {/* Shiny glass effect overlays */}
      <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent opacity-30 pointer-events-none"></div>
      <div 
        className="absolute -inset-1 opacity-20 pointer-events-none"
        style={{ 
          background: `linear-gradient(to top right, rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 0.1), transparent, rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 0.1))` 
        }}
      ></div>
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-white/30 to-transparent"></div>
      <div 
        className="absolute bottom-0 left-0 right-0 h-px"
        style={{ 
          background: `linear-gradient(to right, transparent, rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 0.3), transparent)` 
        }}
      ></div>
      
      {/* Content */}
      <div className="relative z-10">
        {children}
      </div>
    </div>
  );
}
