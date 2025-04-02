import { useTheme } from '../../context/ThemeContext';
import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { HiChevronLeft, HiChevronRight, HiClock, HiHome, HiMicrophone, HiChartBar, HiAcademicCap, HiUserGroup, HiCog, HiUser, HiCamera, HiSupport } from 'react-icons/hi';

const navItems = [
  {
    label: 'Home',
    href: '/',
    icon: HiHome,
    color: 'from-blue-400 to-purple-400'
  },
  {
    label: 'Practice',
    href: '/practice',
    icon: HiMicrophone,
    color: 'from-purple-400 to-pink-400'
  },
  {
    label: 'Analytics',
    href: '/analytics',
    icon: HiChartBar,
    color: 'from-pink-400 to-red-400'
  },
  {
    label: 'Exercises',
    href: '/exercises',
    icon: HiAcademicCap,
    color: 'from-red-400 to-orange-400'
  },
  {
    label: 'Community',
    href: '/community',
    icon: HiUserGroup,
    color: 'from-orange-400 to-yellow-400'
  },
  {
    label: 'Video Analysis',
    href: '/video-analysis',
    icon: HiCamera,
    color: 'from-orange-400 to-yellow-400'
  },
  {
    label: 'Disabled',
    href: '/accessibility',
    icon: HiSupport,
    color: 'from-orange-400 to-yellow-400'
  },
  {
    label: 'Settings',
    href: '/settings',
    icon: HiCog,
    color: 'from-yellow-400 to-green-400'
  }
];

const recentHistory = [
  {
    title: 'Interview Practice',
    date: '2 hours ago',
    score: 85,
    duration: '15 min'
  },
  {
    title: 'Quick Practice',
    date: '5 hours ago',
    score: 78,
    duration: '5 min'
  },
  {
    title: 'Presentation',
    date: 'Yesterday',
    score: 92,
    duration: '20 min'
  }
];

interface SidebarProps {
  onCollapse?: (collapsed: boolean) => void;
}

export default function Sidebar({ onCollapse }: SidebarProps) {
  const { themeColor } = useTheme();
  const router = useRouter();
  const [isCollapsed, setIsCollapsed] = useState(false);

  useEffect(() => {
    onCollapse?.(isCollapsed);
  }, [isCollapsed, onCollapse]);

  return (
    <motion.aside
      initial={false}
      animate={{ 
        width: isCollapsed ? 90 : 320,
        paddingLeft: isCollapsed ? 16 : 24,
        paddingRight: isCollapsed ? 16 : 24
      }}
      className="fixed left-0 top-0 bottom-0 z-40 flex flex-col py-8 bg-black/50 backdrop-blur-xl border-r border-white/10 rounded-tr-2xl rounded-br-2xl"
      style={{
        top: '70px',
        height: 'calc(100vh - 120px)'
      }}
    >
      <button
        onClick={() => setIsCollapsed(!isCollapsed)}
        className="absolute -right-4 top-1/2 transform -translate-y-1/2 w-8 h-8 bg-white/10 rounded-full flex items-center justify-center hover:bg-white/20 transition-colors"
      >
        {isCollapsed ? (
          <HiChevronRight className="w-5 h-5 text-white" />
        ) : (
          <HiChevronLeft className="w-5 h-5 text-white" />
        )}
      </button>

      <div className="flex items-center space-x-3 mb-8">
        <div className="w-10 h-10 rounded-lg bg-white/10 flex items-center justify-center">
          <img src="3dlogo.webp" alt="Logo" className="w-8 h-8" />
        </div>
        {!isCollapsed && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="text-white font-medium text-lg"
          >
            ConfiOrato
          </motion.div>
        )}
      </div>

      <nav className="flex-1">
        {navItems.map((item) => {
          const isActive = router.pathname === item.href;
          const Icon = item.icon;
          
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center space-x-3 px-4 py-3 rounded-xl mb-2 transition-colors ${
                isActive 
                  ? `bg-${themeColor}22` 
                  : 'hover:bg-white/10'
              }`}
            >
              <div className={`w-7 h-7 rounded-2xl bg-gradient-to-br ${item.color} bg-opacity-20 flex items-center justify-center`}>
                <Icon 
                  className="w-7 h-7 text-white p-1"
                  style={{
                    filter: isActive ? 'drop-shadow(0 0 8px rgba(255,255,255,0.5))' : 'none'
                  }}
                />
              </div>
              {!isCollapsed && (
                <motion.span
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className={`text-white transition-colors ${isActive ? 'text-white' : 'text-white/70'}`}
                >
                  {item.label}
                </motion.span>
              )}
            </Link>
          );
        })}
      </nav>

      {/* History Section */}
      {!isCollapsed && (
        <div className="mt-4 mb-4">
          <div className="flex items-center space-x-2 mb-3 text-white/60">
            <HiClock className="w-4 h-4" />
            <span className="text-sm font-medium">Recent History</span>
          </div>
          <div className="space-y-2">
            {recentHistory.map((item, index) => (
              <div
                key={index}
                className="bg-white/5 rounded-lg p-3 hover:bg-white/10 transition-colors cursor-pointer"
              >
                <div className="flex justify-between items-start">
                  <div>
                    <div className="text-white text-sm font-medium">{item.title}</div>
                    <div className="text-white/40 text-xs">{item.date}</div>
                  </div>
                  <div className="text-right">
                    <div className="text-white/80 text-sm font-medium">{item.score}%</div>
                    <div className="text-white/40 text-xs">{item.duration}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className={`${isCollapsed ? 'px-2' : 'px-4'} py-4 bg-black/30 rounded-xl border border-white/10`}>
        <div className="flex items-center space-x-3 mb-3">
          <div className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center">
            <HiMicrophone className="w-5 h-5 text-white" />
          </div>
          {!isCollapsed && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <div className="text-white font-medium">Daily Goal</div>
              <div className="text-white/60 text-xs">15 minutes practice</div>
            </motion.div>
          )}
        </div>
        <div className="h-1.5 rounded-full bg-white/10">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: '60%' }}
            transition={{ duration: 1, ease: "easeOut" }}
            className="h-full rounded-full"
            style={{ backgroundColor: themeColor }}
          />
        </div>
        {!isCollapsed && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="mt-2 text-right text-xs text-white/40"
          >
            9/15 minutes
          </motion.div>
        )}
      </div>
    </motion.aside>
  );
}
