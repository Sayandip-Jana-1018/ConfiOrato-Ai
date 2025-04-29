import { useTheme } from '../../context/ThemeContext';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { useState, useEffect } from 'react';
import { HiHome, HiMicrophone, HiChartBar, HiUserGroup, HiUser, HiBookOpen, HiCamera, HiSupport } from 'react-icons/hi';
import NavbarVoiceAssistant from './NavbarVoiceAssistant';

const navLinks = [
  { label: 'Home', href: '/', icon: HiHome, color: '#4CAF50' },
  { label: 'Practice', href: '/practice', icon: HiMicrophone, color: '#2196F3' },
  { label: 'Analytics', href: '/analytics', icon: HiChartBar, color: '#9C27B0' },
  { label: 'Video', href: '/video-analysis', icon: HiCamera, color: '#FF4081' },
  { label: 'Exercises', href: '/exercises', icon: HiBookOpen, color: '#FF9800' },
  { label: 'Community', href: '/community', icon: HiUserGroup, color: '#E91E63' },
  { label: 'Disabled', href: '/accessibility', icon: HiSupport, color: '#7C4DFF' },
  { label: 'Profile', href: '/settings', icon: HiUser, color: '#00BCD4' }
];

export default function Navbar() {
  const { themeColor } = useTheme();
  const router = useRouter();
  const [isMobile, setIsMobile] = useState(false);

  // Check if screen is mobile on mount and when window resizes
  useEffect(() => {
    const checkIfMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    // Check on mount
    checkIfMobile();
    
    // Add event listener for window resize
    window.addEventListener('resize', checkIfMobile);
    
    // Clean up event listener
    return () => window.removeEventListener('resize', checkIfMobile);
  }, []);

  return (
    <motion.nav
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      className="fixed z-50 md:top-4 top-2" style={{ 
        width: isMobile ? '95%' : '70%', 
        maxWidth: isMobile ? '390px' : '700px', 
        left: isMobile ? '4%' : '35%', 
        transform: 'translateX(-50%)',
      }}
    >
      <div className="relative flex items-center justify-center p-3 rounded-2xl nav-glass-container w-full backdrop-blur-xl bg-black/70 border border-purple-500/40 shadow-xl overflow-x-auto">
        {/* Left side icons */}
        <div className="flex-1 flex items-center md:ml-10 justify-end gap-2 md:gap-6">
        {navLinks.slice(0, 4).map((link) => {
          const isActive = router.pathname === link.href;
          const Icon = link.icon;

          return (
            <Link key={link.href} href={link.href} passHref>
              <motion.div
                className="relative px-1 md:px-2 py-1 rounded-xl transition-all duration-300"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                {isActive && (
                  <motion.div
                    layoutId="navBackground"
                    className="absolute inset-0 rounded-xl"
                    style={{ 
                      background: `linear-gradient(135deg, ${link.color}22 0%, ${link.color}44 100%)`,
                      backdropFilter: 'blur(8px)',
                      border: `1px solid ${link.color}33`
                    }}
                    transition={{ type: 'spring', duration: 0.5 }}
                  />
                )}
                <div className="relative flex flex-col items-center">
                  <Icon 
                    className={`${isMobile ? 'w-4 h-4' : 'w-6 h-6'} mb-0.5 transition-colors ${
                      isActive ? 'text-white' : 'text-white/50'
                    }`}
                    style={{ color: link.color }}
                  />
                  <span 
                    className={`${isMobile ? 'text-[7px]' : 'text-[10px]'} transition-colors ${
                      isActive ? 'text-white' : 'text-white/50'
                    }`}
                  >
                    {link.label}
                  </span>
                </div>
              </motion.div>
            </Link>
          );
        })}
        

        </div>
        
        {/* Voice Assistant in center */}
        <motion.div
          className="relative px-3 py-1 mx-1 md:mx-4 rounded-xl transition-all duration-300 -mt-4"
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          <div className="relative flex flex-col items-center">
            <div className="w-8 h-8 md:w-10 md:h-10 mb-3 mr-4 rounded-full flex items-center justify-center">
              <NavbarVoiceAssistant className="w-5 h-5 md:w-6 md:h-6 text-white" />
            </div>
            <span className={`${isMobile ? 'text-[8px]' : 'text-xs'} text-white/80 font-medium`}>Assistant</span>
          </div>
        </motion.div>
        
        {/* Right side icons */}
        <div className="flex-1 flex items-center justify-start gap-0 md:gap-2">
        {navLinks.slice(4).map((link) => {
          const isActive = router.pathname === link.href;
          const Icon = link.icon;

          return (
            <Link key={link.href} href={link.href} passHref>
              <motion.div
                className="relative px-1 md:px-2 py-1 rounded-xl transition-all duration-300"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                {isActive && (
                  <motion.div
                    layoutId="navBackground"
                    className="absolute inset-0 rounded-xl"
                    style={{ 
                      background: `linear-gradient(135deg, ${link.color}22 0%, ${link.color}44 100%)`,
                      backdropFilter: 'blur(8px)',
                      border: `1px solid ${link.color}33`
                    }}
                    transition={{ type: 'spring', duration: 0.5 }}
                  />
                )}
                <div className="relative flex flex-col items-center">
                  <Icon 
                    className={`${isMobile ? 'w-4 h-4' : 'w-6 h-6'} mb-0.5 transition-colors ${
                      isActive ? 'text-white' : 'text-white/50'
                    }`}
                    style={{ color: link.color }}
                  />
                  <span 
                    className={`${isMobile ? 'text-[7px]' : 'text-[10px]'} transition-colors ${
                      isActive ? 'text-white' : 'text-white/50'
                    }`}
                  >
                    {link.label}
                  </span>
                </div>
              </motion.div>
            </Link>
          );
        })}
        </div>
      </div>

      {/* Glowing Border and Glass Effect */}
      <style jsx>{`
        .nav-glass-container {
          background: rgba(0, 0, 0, 0.3);
          backdrop-filter: blur(16px);
          border: 1px solid rgba(255, 255, 255, 0.15);
          box-shadow: 
            0 10px 15px -3px rgba(0, 0, 0, 0.1),
            0 4px 6px -2px rgba(0, 0, 0, 0.05),
            0 0 0 1px rgba(255, 255, 255, 0.1) inset,
            0 8px 32px 0 rgba(31, 38, 135, 0.37);
          background-image: linear-gradient(
            125deg,
            rgba(255, 255, 255, 0.1) 0%,
            rgba(255, 255, 255, 0.05) 40%,
            rgba(255, 255, 255, 0) 100%
          );
        }
      `}</style>
    </motion.nav>
  );
}
