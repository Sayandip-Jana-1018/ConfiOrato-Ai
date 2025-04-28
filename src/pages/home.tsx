import { useTheme } from '../context/ThemeContext';
import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import Image from 'next/image';
import { HiMicrophone, HiChartBar, HiAcademicCap, HiLogout } from 'react-icons/hi';
import { useRouter } from 'next/router';
import { supabase } from '@/lib/supabase';

import ThemeSelector from '../components/ThemeSelector';
import Navbar from '../components/layout/Navbar';
import Sidebar from '../components/layout/Sidebar';
import LoadingScreen from '../components/ui/LoadingScreen';
import GlassCard from '../components/ui/GlassCard';

const features = [
  {
    title: "Real-time Analysis",
    description: "Get instant feedback on your speech clarity, pacing, and confidence markers",
    icon: HiMicrophone,
    delay: 0.2
  },
  {
    title: "3D Coach Avatar",
    description: "Practice with customizable virtual coaches in immersive environments",
    icon: HiChartBar,
    delay: 0.3
  },
  {
    title: "AI Feedback",
    description: "Receive personalized improvement suggestions powered by advanced AI",
    icon: HiAcademicCap,
    delay: 0.4
  }
];

export default function HomePage() {
  const { themeColor } = useTheme();
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const timer = setTimeout(() => setIsLoading(false), 1500);
    return () => clearTimeout(timer);
  }, []);

  const handleSignOut = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      router.push('/auth');
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  const darkenColor = (color: string, amount: number) => {
    if (color.startsWith('#')) {
      const r = Math.max(0, parseInt(color.slice(1, 3), 16) - amount);
      const g = Math.max(0, parseInt(color.slice(3, 5), 16) - amount);
      const b = Math.max(0, parseInt(color.slice(5, 7), 16) - amount);
      return `rgb(${r}, ${g}, ${b})`;
    }
    return color;
  };

  return (
    <div
      className="min-h-screen w-full relative overflow-hidden"
      style={{
        background: `
          linear-gradient(135deg,
            ${darkenColor(themeColor, 60)} 0%,
            ${darkenColor(themeColor, 80)} 10%,
            ${darkenColor(themeColor, 100)} 20%,
            rgba(0, 0, 0, 1) 40%,
            rgba(0, 0, 0, 1) 60%,
            ${darkenColor(themeColor, 100)} 80%,
            ${darkenColor(themeColor, 80)} 90%,
            ${darkenColor(themeColor, 60)} 100%
          )
        `
      }}
    >
      <Navbar />
      <Sidebar />
      
      <main className="flex items-center justify-center min-h-screen pt-16 pl-64">
        {isLoading ? (
          <LoadingScreen />
        ) : (
          <div className="container mx-auto px-4 z-10 flex flex-col items-center py-8">
            <motion.div
              initial={{ scale: 0.8, opacity: 0, y: 30 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              transition={{ 
                duration: 1.2, 
                ease: [0.6, 0.01, -0.05, 0.95],
                opacity: { duration: 0.8 }
              }}
              className="relative w-full max-w-4xl mx-auto mb-12 flex justify-center"
            >
              {/* Left Avatar */}
              <motion.div
                initial={{ x: -50, y: 50, opacity: 0 }}
                animate={{ x: 0, y: 0, opacity: 1 }}
                transition={{ delay: 0.3, duration: 1 }}
                className="relative w-56 h-56 -mr-8 mt-16 group"
                whileHover={{ scale: 1.05, rotate: -5 }}
              >
                <div className="absolute inset-0 rounded-full bg-gradient-to-r from-purple-500/20 to-pink-500/20 blur-2xl group-hover:blur-3xl group-hover:opacity-80 transition-all duration-300" />
                
                <div className="relative mt-8 w-full h-full rounded-full bg-gray-900/80 p-2 transition-transform duration-300">
                  <div className="relative w-full h-full rounded-full overflow-hidden bg-gradient-to-b from-gray-800 to-gray-900 p-1">
                    <Image
                      src="/avatar2.jpg"
                      alt="AI Coach Avatar Left"
                      width={224}
                      height={224}
                      className="rounded-full relative z-10 object-cover w-full h-full opacity-75 group-hover:opacity-100 transition-all duration-300 transform group-hover:scale-110"
                      priority
                    />
                  </div>
                </div>
              </motion.div>

              {/* Main Center Avatar */}
              <motion.div
                className="relative w-72 ml-16 mr-16 h-72 z-99 group"
                whileHover={{ scale: 1.1 }}
              >
                <div className="absolute inset-0 rounded-full bg-gradient-to-r from-blue-500/20 to-purple-500/20 blur-2xl group-hover:blur-3xl group-hover:opacity-80 transition-all duration-300" />
                
                <div className="relative w-full h-full rounded-full bg-gray-900/80 p-2">
                  <div className="relative w-full h-full rounded-full overflow-hidden bg-gradient-to-b from-gray-800 to-gray-900 p-1">
                    <Image
                      src="/avatar.avif"
                      alt="AI Coach Avatar"
                      width={288}
                      height={288}
                      className="rounded-full relative z-10 object-cover w-full h-full group-hover:opacity-100 transition-all duration-300 transform group-hover:scale-100"
                      priority
                    />
                  </div>
                </div>

                <motion.div
                  className="absolute -inset-2 rounded-full"
                  style={{
                    background: 'linear-gradient(45deg, rgba(59, 130, 246, 0.2), rgba(147, 51, 234, 0.2))',
                    padding: '1px'
                  }}
                  animate={{ rotate: 360 }}
                  transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
                >
                  <div className="w-full h-full rounded-full bg-gray-900" />
                </motion.div>
              </motion.div>

              {/* Right Avatar */}
              <motion.div
                initial={{ x: 50, y: 50, opacity: 0 }}
                animate={{ x: 0, y: 0, opacity: 1 }}
                transition={{ delay: 0.3, duration: 1 }}
                className="relative w-56 h-56 -ml-8 mt-16 group"
                whileHover={{ scale: 1.05, rotate: 5 }}
              >
                <div className="absolute inset-0 rounded-full bg-gradient-to-r from-pink-500/20 to-orange-500/20 blur-2xl group-hover:blur-3xl group-hover:opacity-80 transition-all duration-300" />
                
                <div className="relative w-full mt-8 h-full rounded-full bg-gray-900/80 p-2">
                  <div className="relative w-full h-full rounded-full overflow-hidden bg-gradient-to-b from-gray-800 to-gray-900 p-1">
                    <Image
                      src="/avatar3.jpg"
                      alt="AI Coach Avatar Right"
                      width={224}
                      height={224}
                      className="rounded-full relative z-10 object-cover w-full h-full opacity-75 group-hover:opacity-100 transition-all duration-300 transform group-hover:scale-110"
                      priority
                    />
                  </div>
                </div>
              </motion.div>
            </motion.div>

            <motion.h1
              initial={{ y: 40, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ duration: 0.8, delay: 0.4 }}
              className="text-5xl md:text-6xl font-bold text-white mb-6 text-center"
            >
              ConfiOrato~
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-400">AI</span>
            </motion.h1>

            <motion.p
              initial={{ y: 40, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ duration: 0.8, delay: 0.6 }}
              className="text-xl text-white/80 mb-16 text-center max-w-2xl"
            >
              Your AI-powered public speaking coach that helps you build confidence and master communication
            </motion.p>

            <motion.div
              initial={{ y: 60, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ duration: 1, delay: 0.8 }}
              className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16 w-full max-w-5xl"
            >
              {features.map((feature, index) => (
                <motion.div
                  key={feature.title}
                  initial={{ y: 40, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ duration: 0.8, delay: 0.8 + feature.delay }}
                  whileHover={{ y: -8, transition: { duration: 0.2 } }}
                >
                  <GlassCard className="h-full">
                    <div className="flex flex-col items-center text-center p-6">
                      <div className="w-16 h-16 rounded-full bg-gradient-to-br from-white/10 to-white/5 flex items-center justify-center mb-4">
                        <feature.icon className="w-8 h-8 text-white" />
                      </div>
                      <h3 className="text-xl font-semibold text-white mb-2">{feature.title}</h3>
                      <p className="text-white/70">{feature.description}</p>
                    </div>
                  </GlassCard>
                </motion.div>
              ))}
            </motion.div>

            <motion.div
              initial={{ y: 60, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ duration: 1, delay: 1 }}
              className="flex flex-col sm:flex-row gap-4 items-center justify-center"
            >
              <Link href="/practice" legacyBehavior={false}>
                <motion.button
                  className="px-8 py-3 rounded-xl bg-gradient-to-r from-blue-600 to-purple-600 text-white font-medium text-lg hover:from-blue-700 hover:to-purple-700 transition-all duration-200 shadow-lg hover:shadow-xl flex items-center justify-center"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.98 }}
                >
                  Start Practicing
                </motion.button>
              </Link>
              <motion.button
                onClick={handleSignOut}
                className="px-8 py-3 rounded-xl bg-white/10 backdrop-blur-sm text-white font-medium text-lg hover:bg-white/20 transition-all duration-200 border border-white/10 flex items-center justify-center gap-2"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.98 }}
              >
                <HiLogout className="w-5 h-5" />
                Sign Out
              </motion.button>
            </motion.div>
          </div>
        )}
      </main>

      <ThemeSelector />
    </div>
  );
}
