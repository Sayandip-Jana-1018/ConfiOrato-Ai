import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import GlassmorphicCard from '@/components/auth/GlassmorphicCard';
import ThreeBackground from '@/components/auth/ThreeBackground';
import { useTheme } from '@/context/ThemeContext';
import { supabase } from '@/lib/supabase';
import { motion } from 'framer-motion';
import ThemeSelector from '@/components/ThemeSelector';

export default function VerifyEmail() {
  const router = useRouter();
  const { themeColor } = useTheme();
  const [countdown, setCountdown] = useState(10);
  const [verificationChecked, setVerificationChecked] = useState(false);
  const [isVerified, setIsVerified] = useState(false);

  // Check if user is already verified
  useEffect(() => {
    const checkVerification = async () => {
      const { data } = await supabase.auth.getSession();
      if (data.session) {
        setIsVerified(true);
        // If already verified, redirect to home page
        router.push('/home');
      }
      setVerificationChecked(true);
    };

    checkVerification();
  }, [router]);

  // Countdown timer
  useEffect(() => {
    if (!verificationChecked || isVerified) return;

    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          router.push('/auth');
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [router, verificationChecked, isVerified]);

  // Handle manual resend verification
  const handleResendVerification = async () => {
    const email = localStorage.getItem('pendingVerificationEmail');
    if (!email) {
      alert('Please go back to sign up to resend verification email');
      return;
    }

    try {
      const { error } = await supabase.auth.resend({
        type: 'signup',
        email,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/verify`,
        },
      });

      if (error) throw error;
      alert('Verification email resent successfully!');
    } catch (error: any) {
      alert(`Error: ${error.message || 'Failed to resend verification email'}`);
    }
  };

  return (
    <>
      <Head>
        <title>Verify Your Email | ConfiOrato~Ai</title>
        <meta name="description" content="Please verify your email to continue" />
      </Head>

      {/* 3D ThreeJS Background */}
      <ThreeBackground />

      {/* Main content */}
      <div className="min-h-screen flex flex-col items-center justify-center px-4 py-12">
        <motion.div 
          className="w-full max-w-md"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <GlassmorphicCard>
            <div className="text-center">
              <div className="w-20 h-20 bg-white/10 rounded-full flex items-center justify-center mx-auto mb-6">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
              </div>
              <h1 className="text-2xl font-bold text-white mb-3">Verify Your Email</h1>
              <p className="text-white/80 mb-6">
                We've sent a verification link to your email address. Please check your inbox and click the link to activate your account.
              </p>
              
              <div className="mt-8 p-5 bg-white/5 rounded-lg border border-white/10">
                <h3 className="text-white font-medium mb-2">Didn't receive an email?</h3>
                <p className="text-white/70 text-sm mb-4">
                  Check your spam folder or click below to resend the verification email.
                </p>
                <div className="flex flex-col sm:flex-row gap-3 justify-center">
                  <button 
                    onClick={handleResendVerification}
                    className="px-4 py-2 rounded-lg bg-white/10 hover:bg-white/20 text-white text-sm font-medium transition-all"
                  >
                    Resend Verification
                  </button>
                  <button 
                    onClick={() => router.push('/auth')}
                    className="px-4 py-2 rounded-lg bg-white/5 hover:bg-white/10 text-white text-sm font-medium transition-all"
                  >
                    Back to Sign In
                  </button>
                </div>
              </div>
              
              <div className="mt-8 flex items-center justify-center">
                <div className="w-8 h-8 rounded-full border-2 border-white/20 border-t-white animate-spin mr-3"></div>
                <p className="text-white/60 text-sm">
                  Redirecting to sign in page in {countdown} seconds...
                </p>
              </div>
            </div>
          </GlassmorphicCard>
        </motion.div>
        <ThemeSelector/>
      </div>
    </>
  );
}
