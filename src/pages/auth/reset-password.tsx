import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import GlassmorphicCard from '@/components/auth/GlassmorphicCard';
import ThreeBackground from '@/components/auth/ThreeBackground';
import { useTheme } from '@/context/ThemeContext';
import { supabase } from '@/lib/supabase';
import { motion } from 'framer-motion';
import ThemeSelector from '@/components/ThemeSelector';

export default function ResetPassword() {
  const router = useRouter();
  const { themeColor } = useTheme();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  // Check if user has a valid recovery token
  useEffect(() => {
    const checkSession = async () => {
      const { data } = await supabase.auth.getSession();
      // If no session and no recovery token in URL, redirect to login
      if (!data.session && !window.location.hash.includes('type=recovery')) {
        router.push('/auth');
      }
    };

    checkSession();
  }, [router]);

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Reset error
    setError(null);
    
    // Validate inputs
    if (!password || !confirmPassword) {
      setError('Both fields are required');
      return;
    }
    
    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }
    
    if (password.length < 8) {
      setError('Password must be at least 8 characters long');
      return;
    }
    
    // Start loading
    setLoading(true);
    
    try {
      // Update password with Supabase
      const { error } = await supabase.auth.updateUser({
        password: password
      });
      
      if (error) throw error;
      
      // Success
      setSuccess(true);
      
      // Redirect to login after 3 seconds
      setTimeout(() => {
        router.push('/auth');
      }, 3000);
    } catch (error: any) {
      console.error('Password reset error:', error);
      setError(error.message || 'An error occurred during password reset');
    } finally {
      setLoading(false);
    }
  };

  // If success is true, show success message
  if (success) {
    return (
      <>
        <Head>
          <title>Password Reset Successful | ConfiOrato~Ai</title>
          <meta name="description" content="Your password has been reset successfully" />
        </Head>

        <ThreeBackground />

        <div className="min-h-screen flex flex-col items-center justify-center px-4 py-12">
          <motion.div 
            className="w-full max-w-md"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <GlassmorphicCard>
              <div className="text-center space-y-6">
                <div className="flex justify-center">
                  <div className="rounded-full bg-green-500/20 p-3">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                </div>
                <h2 className="text-2xl font-bold text-white">Password Reset Successful!</h2>
                <p className="text-white/70">
                  Your password has been updated successfully. You can now sign in with your new password.
                </p>
                <div className="mt-4 flex flex-col gap-3">
                  <p className="text-white/70 text-sm">
                    Redirecting you to the sign in page...
                  </p>
                  <div className="flex justify-center">
                    <div className="animate-spin h-8 w-8 border-4 border-white/20 rounded-full border-t-white"></div>
                  </div>
                </div>
              </div>
            </GlassmorphicCard>
          </motion.div>
          <ThemeSelector />
        </div>
      </>
    );
  }

  return (
    <>
      <Head>
        <title>Reset Password | ConfiOrato~Ai</title>
        <meta name="description" content="Reset your password" />
      </Head>

      <ThreeBackground />

      <div className="min-h-screen flex flex-col items-center justify-center px-4 py-12">
        <motion.div 
          className="w-full max-w-md"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <GlassmorphicCard>
            <h2 className="text-2xl font-bold text-white mb-6">Reset Password</h2>
            
            <form onSubmit={handleResetPassword} className="space-y-6">
              {/* Password field */}
              <div>
                <label htmlFor="password" className="block text-sm font-medium text-white/70 mb-1">
                  New Password
                </label>
                <input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="w-full px-4 py-2 rounded-lg bg-white/10 border border-white/20 text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                  placeholder="••••••••"
                />
              </div>
              
              {/* Confirm Password field */}
              <div>
                <label htmlFor="confirmPassword" className="block text-sm font-medium text-white/70 mb-1">
                  Confirm New Password
                </label>
                <input
                  id="confirmPassword"
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  className="w-full px-4 py-2 rounded-lg bg-white/10 border border-white/20 text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                  placeholder="••••••••"
                />
              </div>
              
              {/* Error message */}
              {error && (
                <div className="bg-red-500/20 text-red-200 p-3 rounded-lg text-sm">
                  {error}
                </div>
              )}
              
              {/* Submit button */}
              <div>
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full px-4 py-2 rounded-lg bg-gradient-to-r from-blue-500 to-purple-600 text-white font-medium hover:from-blue-600 hover:to-purple-700 focus:outline-none focus:ring-2 focus:ring-blue-500/50 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                >
                  {loading ? (
                    <span className="flex items-center justify-center">
                      <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Updating Password...
                    </span>
                  ) : (
                    'Reset Password'
                  )}
                </button>
              </div>
              
              {/* Back to sign in link */}
              <div className="mt-6 text-center">
                <p className="text-white/70 text-sm">
                  Remember your password?{' '}
                  <a
                    href="/auth"
                    className="text-blue-400 hover:text-blue-300 font-medium"
                  >
                    Back to Sign In
                  </a>
                </p>
              </div>
            </form>
          </GlassmorphicCard>
        </motion.div>
        <ThemeSelector />
      </div>
    </>
  );
}
