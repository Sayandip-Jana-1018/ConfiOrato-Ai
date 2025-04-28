import { useEffect, useState, ReactNode } from 'react';
import { useRouter } from 'next/router';
import { supabase } from '@/lib/supabase';

interface ProtectedRouteProps {
  children: ReactNode;
}

export default function ProtectedRoute({ children }: ProtectedRouteProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const { data } = await supabase.auth.getSession();
        
        if (!data.session) {
          // Redirect to auth page if not authenticated
          router.push('/auth');
        } else {
          setIsLoading(false);
        }
      } catch (error) {
        console.error('Auth check error:', error);
        router.push('/auth');
      }
    };

    checkAuth();
  }, [router]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="flex flex-col items-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-white mb-4"></div>
          <p className="text-white/70">Verifying authentication...</p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
