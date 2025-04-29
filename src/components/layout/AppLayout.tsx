import { useTheme } from '../../context/ThemeContext';
import { motion } from 'framer-motion';
import Navbar from './Navbar';
import Sidebar from './Sidebar';
import { useState, useEffect } from 'react';
import { HiMenu, HiX } from 'react-icons/hi';
import ThemeSelector from '../ThemeSelector';

interface AppLayoutProps {
  children: React.ReactNode;
  title?: string;
}

export default function AppLayout({ children, title }: AppLayoutProps) {
  const { themeColor } = useTheme();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  // Check if screen is mobile on mount and when window resizes
  useEffect(() => {
    const checkIfMobile = () => {
      setIsMobile(window.innerWidth < 768);
      if (window.innerWidth < 768) {
        setSidebarCollapsed(true);
      }
    };
    
    // Check on mount
    checkIfMobile();
    
    // Add event listener for window resize
    window.addEventListener('resize', checkIfMobile);
    
    // Clean up event listener
    return () => window.removeEventListener('resize', checkIfMobile);
  }, []);

  return (
    <div
      className="min-h-screen w-full text-center relative overflow-hidden bg-transparent"
      style={{
        background: `radial-gradient(circle at 100% 100%, ${themeColor}11 0%, rgba(0,0,0,0.99) 0%)`
      }}
    >
      {/* Mobile menu button - always visible on mobile */}
      <button 
        onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
        className="fixed top-24 left-4 z-[60] p-2 rounded-full bg-black/40 backdrop-blur-xl border border-white/20 shadow-lg md:hidden"
      >
        {mobileMenuOpen ? (
        <HiX className="w-5 h-5 text-white" />
        ) : (
          <HiMenu className="w-5 h-5 text-white" />
        )}
      </button>
      
      {/* Always show navbar, it's now properly responsive */}
      <Navbar />
      
      {/* Theme selector */}
      <ThemeSelector />
      
      {/* Show sidebar only on desktop or when mobile menu is open */}
      <div className={`${isMobile && !mobileMenuOpen ? 'hidden' : 'block'} transition-all duration-300`}>
        <Sidebar 
          onCollapse={(collapsed) => setSidebarCollapsed(collapsed)}
          isMobileView={isMobile}
          mobileMenuOpen={mobileMenuOpen}
        />
      </div>

      <main 
        className="transition-all duration-700 px-4 md:px-6 lg:px-8"
        style={{
          paddingLeft: isMobile ? '1rem' : (sidebarCollapsed ? '4rem' : '12rem'),
          paddingRight: isMobile ? '1rem' : '1rem',
          paddingTop: '5rem'
        }}
      >
        <motion.div 
          className="container mx-auto p-4 sm:p-6 md:p-8"
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ 
            duration: 1.5,
            ease: "easeOut"
          }}
        >
          {children}
        </motion.div>
      </main>

      {/* Decorative gradient orbs */}
      {[...Array(3)].map((_, i) => (
        <motion.div
          key={i}
          initial={{ opacity: 0, scale: 0.2 }}
          animate={{ opacity: 0.3, scale: 2 }}
          transition={{ 
            duration: 3.5,
            delay: i * 0.6,
            ease: "easeOut"
          }}
          className="fixed pointer-events-none blur-3xl"
          style={{
            width: '50vw',
            height: '50vw',
            background: `radial-gradient(circle, ${themeColor}25 0%, transparent 70%)`,
            left: `${[25, 65, 45][i]}%`,
            top: `${[35, 65, 25][i]}%`,
            transform: 'translate(-50%, -50%)',
            zIndex: -1
          }}
        />
      ))}
    </div>
  );
}
