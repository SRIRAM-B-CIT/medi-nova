import { useEffect, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Navigate, useLocation } from 'react-router-dom';
import { Loader2 } from 'lucide-react';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

export const ProtectedRoute = ({ children }: ProtectedRouteProps) => {
  const { user, profile, isLoading, isNewUser, hasHealthRecord, checkHealthRecord, clearNewUserFlag } = useAuth();
  const location = useLocation();
  const [isCheckingHealthRecord, setIsCheckingHealthRecord] = useState(true);
  const [redirectDestination, setRedirectDestination] = useState<string | null>(null);

  useEffect(() => {
    const checkPatientHealthRecord = async () => {
      setRedirectDestination(null);
      
      if (!user || !profile) {
        setIsCheckingHealthRecord(false);
        return;
      }

      if (profile.role === 'non_medic') {
        if (location.pathname === '/patient-details') {
          if (isNewUser) {
            clearNewUserFlag();
          }
          setIsCheckingHealthRecord(false);
          return;
        }

        if (isNewUser) {
          clearNewUserFlag();
          setRedirectDestination('/patient-details');
          setIsCheckingHealthRecord(false);
          return;
        }

        if (hasHealthRecord === true) {
          setIsCheckingHealthRecord(false);
          return;
        }

        const hasRecord = await checkHealthRecord();
        if (!hasRecord) {
          setRedirectDestination('/patient-details');
        }
      }
      
      setIsCheckingHealthRecord(false);
    };

    setIsCheckingHealthRecord(true);
    
    if (!isLoading && user && profile) {
      checkPatientHealthRecord();
    } else if (!isLoading) {
      setIsCheckingHealthRecord(false);
    }
  }, [user, profile, isLoading, isNewUser, hasHealthRecord, checkHealthRecord, clearNewUserFlag, location.pathname]);

  if (isLoading || isCheckingHealthRecord) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="flex items-center space-x-2">
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  if (redirectDestination) {
    return <Navigate to={redirectDestination} replace />;
  }

  return <>{children}</>;
};
