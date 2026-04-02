import { useEffect, useState } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { fetchProtectedData } from '@/lib/auth-api';
import { toast } from 'sonner';

export const EmployerLayout = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const checkStatus = async () => {
      const token = localStorage.getItem('authToken');
      if (!token) return;

      try {
        const userData = await fetchProtectedData('/auth/me', token);
        // Strict Onboarding Check
        if (!userData.isOnboardingComplete && !location.pathname.includes('/profile')) {
          toast.warning('Please complete your company profile first.');
          navigate('/dashboard/employer/profile');
        }
      } catch (error) {
        console.error('Auth check failed', error);
      } finally {
        setIsLoading(false);
      }
    };

    checkStatus();
  }, [location.pathname, navigate]);

  if (isLoading) return null; // Or a spinner

  return (
    <div
      className="contents"
      style={{
        // @ts-ignore - CSS variables are valid but TS might complain
        "--primary": "var(--employer)",
        "--primary-foreground": "0 0% 100%",
        "--ring": "var(--employer)",
      } as React.CSSProperties}
    >
      <Outlet />
    </div>
  );
};
