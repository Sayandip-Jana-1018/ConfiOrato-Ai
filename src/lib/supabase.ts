import { createClient } from '@supabase/supabase-js';

// Default values for local development if environment variables are not set
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://your-supabase-project.supabase.co';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'your-anon-key';

// Create Supabase client with debug logging in development
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true
  }
});

// Log Supabase connection status for debugging
if (process.env.NODE_ENV !== 'production') {
  console.log('Supabase initialized with URL:', supabaseUrl);
  
  // Check if keys are properly configured
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    console.warn('Supabase environment variables not properly configured. Using default values.');
  }
}
