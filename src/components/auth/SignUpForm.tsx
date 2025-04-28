import { useState } from 'react';
import { motion } from 'framer-motion';
import { supabase } from '@/lib/supabase';
import GlassmorphicCard from './GlassmorphicCard';
import { useTheme } from '@/context/ThemeContext';
import { useRouter } from 'next/router';

interface SignUpFormProps {
  onToggleForm: () => void;
}

export default function SignUpForm({ onToggleForm }: SignUpFormProps) {
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const { themeColor } = useTheme();
  const router = useRouter();

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Reset states
    setError(null);
    setSuccess(false);
    
    // Validate inputs
    if (!firstName || !lastName || !email || !phone || !password || !confirmPassword) {
      setError('All fields are required');
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
      // Store email in localStorage for verification page
      localStorage.setItem('pendingVerificationEmail', email);
      
      // Sign up with Supabase - using auto-confirm for better UX
      const { data, error } = await supabase.auth.signUp({ 
        email, 
        password,
        options: {
          data: {
            first_name: firstName,
            last_name: lastName,
            phone: phone
          },
          emailRedirectTo: `${window.location.origin}/auth/verify`
        }
      });
      
      if (error) {
        if (error.message.includes('User already registered')) {
          throw new Error('This email is already registered. Please use a different email or try signing in.');
        } else {
          throw error;
        }
      }
      
      // Success - show success message and redirect to verification page
      setSuccess(true);
      
      // Clear form
      setFirstName('');
      setLastName('');
      setEmail('');
      setPhone('');
      setPassword('');
      setConfirmPassword('');
      
      // Redirect to verification page after a short delay
      setTimeout(() => {
        router.push('/auth/verify');
      }, 2000);
      
    } catch (error: any) {
      console.error('Sign up error:', error);
      setError(error.message || 'An error occurred during sign up');
    } finally {
      setLoading(false);
    }
  };

  // If success is true, show success message
  if (success) {
    return (
      <GlassmorphicCard className="w-full max-w-md">
        <div className="space-y-6 text-center">
          <div className="flex justify-center">
            <div className="rounded-full bg-green-500/20 p-3">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
          </div>
          <h2 className="text-2xl font-bold text-white">Registration Successful!</h2>
          <p className="text-white/70">
            We've sent a verification link to your email. Please check your inbox and verify your account.
          </p>
          <div className="mt-4 flex flex-col gap-3">
            <p className="text-white/70 text-sm">
              Redirecting you to the verification page...
            </p>
            <div className="flex justify-center">
              <div className="animate-spin h-8 w-8 border-4 border-white/20 rounded-full border-t-white"></div>
            </div>
          </div>
        </div>
      </GlassmorphicCard>
    );
  }

  return (
    <GlassmorphicCard className="w-full max-w-md">
      <div className="space-y-6">
        {/* Form Header */}
        <div className="text-center mb-8">
          <h2 className="text-2xl font-bold text-white mb-2">Sign Up</h2>
          <p className="text-white/70 text-sm">Create your account to get started</p>
        </div>
        
        {/* Error Message */}
        {error && (
          <div className="bg-red-500/20 border border-red-500/50 text-white rounded-lg p-3 text-sm">
            {error}
          </div>
        )}
        
        {/* Sign Up Form */}
        <form onSubmit={handleSignUp} className="space-y-5">
          {/* Name Fields - Side by Side */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="firstName" className="block text-white/80 text-sm font-medium mb-1.5">
                First Name
              </label>
              <input
                id="firstName"
                type="text"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2.5 text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-white/20 transition-all"
                placeholder="John"
              />
            </div>
            <div>
              <label htmlFor="lastName" className="block text-white/80 text-sm font-medium mb-1.5">
                Last Name
              </label>
              <input
                id="lastName"
                type="text"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2.5 text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-white/20 transition-all"
                placeholder="Doe"
              />
            </div>
          </div>
          
          {/* Email Field */}
          <div>
            <label htmlFor="email" className="block text-white/80 text-sm font-medium mb-1.5">
              Email
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2.5 text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-white/20 transition-all"
              placeholder="your.email@example.com"
            />
          </div>
          
          {/* Phone Field */}
          <div>
            <label htmlFor="phone" className="block text-white/80 text-sm font-medium mb-1.5">
              Phone Number
            </label>
            <input
              id="phone"
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2.5 text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-white/20 transition-all"
              placeholder="+1 (555) 123-4567"
            />
          </div>
          
          {/* Password Field */}
          <div>
            <label htmlFor="password" className="block text-white/80 text-sm font-medium mb-1.5">
              Password
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2.5 text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-white/20 transition-all"
              placeholder="••••••••"
            />
            <p className="mt-1 text-white/50 text-xs">
              Password must be at least 8 characters long
            </p>
          </div>
          
          {/* Confirm Password Field */}
          <div>
            <label htmlFor="confirmPassword" className="block text-white/80 text-sm font-medium mb-1.5">
              Confirm Password
            </label>
            <input
              id="confirmPassword"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2.5 text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-white/20 transition-all"
              placeholder="••••••••"
            />
          </div>
          
          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading}
            className="w-full flex justify-center items-center py-3 px-4 rounded-lg bg-gradient-to-r from-white/20 to-white/10 hover:from-white/30 hover:to-white/20 text-white font-medium transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-white/20 disabled:opacity-70 disabled:cursor-not-allowed"
            style={{
              background: loading 
                ? `linear-gradient(to right, rgba(255,255,255,0.1), rgba(255,255,255,0.05))` 
                : `linear-gradient(to right, ${themeColor}CC, ${themeColor}99)`
            }}
          >
            {loading ? (
              <>
                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Creating Account...
              </>
            ) : (
              'Create Account'
            )}
          </button>
          
          {/* Sign In Link */}
          <div className="text-center mt-4">
            <p className="text-white/60 text-sm">
              Already have an account?{' '}
              <button
                type="button"
                onClick={onToggleForm}
                className="text-white hover:text-white/80 font-medium transition-colors"
              >
                Sign in
              </button>
            </p>
          </div>
        </form>
      </div>
    </GlassmorphicCard>
  );
}
