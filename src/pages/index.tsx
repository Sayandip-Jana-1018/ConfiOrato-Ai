import { useEffect } from 'react';
import { useRouter } from 'next/router';
import { supabase } from '@/lib/supabase';
import LoadingScreen from '@/components/ui/LoadingScreen';

export default function Home() {
  const router = useRouter();

  useEffect(() => {
    const checkSession = async () => {
      try {
        const { data } = await supabase.auth.getSession();
        
        if (data.session) {
          // If logged in, redirect to home page
          router.push('/home');
        } else {
          // If not logged in, redirect to auth page
          router.push('/auth');
        }
      } catch (error) {
        console.error('Auth check error:', error);
        // Fallback to auth page on error
        router.push('/auth');
      }
    };
    
    checkSession();
  }, [router]);

  return (
    <div className="min-h-screen flex items-center justify-center">
      <LoadingScreen />
    </div>
  );
}