import { useState } from 'react';
import { motion } from 'framer-motion';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/router';
import GlassmorphicCard from './GlassmorphicCard';
import { useTheme } from '@/context/ThemeContext';

interface SignInFormProps {
  onToggleForm: () => void;
}

export default function SignInForm({ onToggleForm }: SignInFormProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const { themeColor } = useTheme();

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Reset error
    setError(null);
    
    // Validate inputs
    if (!email || !password) {
      setError('Email and password are required');
      return;
    }
    
    // Start loading
    setLoading(true);
    
    try {
      // Sign in with Supabase
      const { data, error } = await supabase.auth.signInWithPassword({ 
        email, 
        password 
      });
      
      if (error) {
        if (error.message.includes('Email not confirmed')) {
          setError('Your email is not verified. Please check your spam folder for the verification link.');
          return; 
        } else if (error.message.includes('Invalid login credentials')) {
          throw new Error('Invalid email or password. Please try again.');
        } else {
          throw error;
        }
      }
      
      // Clear form
      setEmail('');
      setPassword('');
      
      // Redirect to home page on successful login
      router.push('/home');
    } catch (error: any) {
      console.error('Sign in error:', error);
      setError(error.message || 'An error occurred during sign in');
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async () => {
    if (!email) {
      setError('Please enter your email address to reset your password');
      return;
    }
    
    setLoading(true);
    
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/auth/reset-password`,
      });
      
      if (error) throw error;
      
      setError(null);
      alert('Password reset link sent to your email!');
    } catch (error: any) {
      setError(error.message || 'Failed to send password reset email');
    } finally {
      setLoading(false);
    }
  };

  return (
    <GlassmorphicCard className="w-full max-w-md">
      <h2 className="text-2xl font-bold ml-36 text-white mb-6">Sign In</h2>
      
      <form onSubmit={handleSignIn} className="space-y-6">
        {/* Email field */}
        <div>
          <label htmlFor="email" className="block text-sm font-medium text-white/70 mb-1">
            Email
          </label>
          <input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="w-full px-4 py-2 rounded-lg bg-white/10 border border-white/20 text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
            placeholder="your@email.com"
          />
        </div>
        
        {/* Password field */}
        <div>
          <div className="flex justify-between items-center mb-1">
            <label htmlFor="password" className="block text-sm font-medium text-white/70">
              Password
            </label>
            <a href="/auth/reset-password" className="text-xs text-blue-400 hover:text-blue-300">
              Forgot password?
            </a>
          </div>
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
                Signing in...
              </span>
            ) : (
              'Sign In'
            )}
          </button>
        </div>
      </form>
      
      {/* Sign up link */}
      <div className="mt-6 text-center">
        <p className="text-white/70 text-sm">
          Don't have an account?{' '}
          <button
            onClick={onToggleForm}
            className="text-blue-400 hover:text-blue-300 font-medium"
          >
            Sign Up
          </button>
        </p>
      </div>
    </GlassmorphicCard>
  );
}
