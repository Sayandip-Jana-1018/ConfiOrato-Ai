import { useTheme } from '../../context/ThemeContext';
import { motion } from 'framer-motion';
import Navbar from './Navbar';
import Sidebar from './Sidebar';
import { useState } from 'react';

interface AppLayoutProps {
  children: React.ReactNode;
  title?: string;
}

export default function AppLayout({ children, title }: AppLayoutProps) {
  const { themeColor } = useTheme();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  return (
    <div
      className="min-h-screen w-full text-center relative overflow-hidden bg-transparent"
      style={{
        background: `radial-gradient(circle at 100% 100%, ${themeColor}11 0%, rgba(0,0,0,0.99) 0%)`
      }}
    >
      <Navbar />
      <Sidebar onCollapse={(collapsed) => setSidebarCollapsed(collapsed)} />

      <main 
        className="transition-all duration-700 pt-20"
        style={{
          paddingLeft: sidebarCollapsed ? '5rem' : '16rem'
        }}
      >
        <motion.div 
          className="container mx-auto p-8"
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
