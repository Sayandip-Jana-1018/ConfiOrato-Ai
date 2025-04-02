import { useEffect } from 'react';
import { useRouter } from 'next/router';
import { supabase } from '@/lib/supabase';

export default function AuthCallback() {
  const router = useRouter();

  useEffect(() => {
    // Handle the OAuth callback
    const handleAuthCallback = async () => {
      // Get the session from URL
      const { data, error } = await supabase.auth.getSession();
      
      if (error) {
        console.error('Error during auth callback:', error);
        router.push('/auth?error=Authentication failed');
        return;
      }
      
      if (data.session) {
        // Redirect to the practice page on successful login
        router.push('/home');
      } else {
        // If no session, redirect back to auth page
        router.push('/auth');
      }
    };

    handleAuthCallback();
  }, [router]);

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-white mx-auto mb-4"></div>
        <h2 className="text-xl text-white font-medium">Completing authentication...</h2>
        <p className="text-white/70 mt-2">Please wait while we log you in</p>
      </div>
    </div>
  );
}
