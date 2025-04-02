import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { GetServerSideProps } from 'next';
import Head from 'next/head';
import { motion } from 'framer-motion';
import { supabase } from '@/lib/supabase';
import SignInForm from '@/components/auth/SignInForm';
import SignUpForm from '@/components/auth/SignUpForm';
import ThreeBackground from '@/components/auth/ThreeBackground';
import { ThemeProvider, useTheme } from '@/context/ThemeContext';
import ThemeSelector from '@/components/ThemeSelector';

export default function AuthPage() {
  const [isSignIn, setIsSignIn] = useState(true);
  const router = useRouter();

  useEffect(() => {
    // Check if user is already logged in
    const checkSession = async () => {
      const { data } = await supabase.auth.getSession();
      if (data.session) {
        router.push('/home');
      }
    };

    checkSession();
  }, [router]);

  const toggleForm = () => {
    setIsSignIn(!isSignIn);
  };

  return (
    <ThemeProvider>
      <div className="min-h-screen flex flex-col items-center justify-center px-4 py-12"
        >
        <Head>
          <title>{isSignIn ? 'Sign In' : 'Sign Up'} | ConfiOrato~Ai</title>
          <meta name="description" content="ConfiOrato - Your AI-powered public speaking coach" />
        </Head>
        
        {/* 3D Background */}
        <ThreeBackground />
        
        {/* Logo and Tagline */}
        <motion.div 
          className="text-center mb-8"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <h1 className="text-4xl font-bold text-white mb-2">
            ConfiOrato<span className="text-yellow-400">~</span>Ai
          </h1>
          <p className="text-white/70">Your AI-powered public speaking coach</p>
        </motion.div>
        
        {/* Authentication Form */}
        <motion.div
          key={isSignIn ? 'signin' : 'signup'}
          initial={{ opacity: 0, x: isSignIn ? -20 : 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: isSignIn ? 20 : -20 }}
          transition={{ duration: 0.3 }}
          className="w-full max-w-md"
        >
          {isSignIn ? (
            <SignInForm onToggleForm={toggleForm} />
          ) : (
            <SignUpForm onToggleForm={toggleForm} />
          )}
        </motion.div>
        
        {/* Features Section - Only show on sign up */}
        {!isSignIn && (
          <motion.div 
            className="mt-8 w-full max-w-md"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
          </motion.div>
        )}
        
        {/* Footer */}
        <div className="mt-4 text-white/50 text-sm">
          &copy; {new Date().getFullYear()} ConfiOrato~Ai. All rights reserved.
        </div>
      </div>
      <ThemeSelector/>
    </ThemeProvider>
  );
}

// This is needed to avoid the "Error: Hydration failed" error
export const getServerSideProps: GetServerSideProps = async () => {
  return {
    props: {},
  };
};
