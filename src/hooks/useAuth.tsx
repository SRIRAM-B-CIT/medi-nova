import { useState, useEffect, createContext, useContext } from 'react';
import { apiClient } from '@/lib/apiClient';

interface User {
  id: string;
  email: string;
  full_name: string;
  role: 'doctor' | 'non_medic';
}

interface Session {
  user: User;
  token: string;
}

interface Profile {
  id: string;
  user_id: string;
  email: string;
  full_name: string | null;
  role: 'doctor' | 'non_medic';
  created_at: string;
  updated_at: string;
}

interface AuthContextType {
  user: User | null;
  session: Session | null;
  profile: Profile | null;
  isLoading: boolean;
  isNewUser: boolean;
  hasHealthRecord: boolean | null;
  signIn: (email: string, password: string) => Promise<{ error: any }>;
  signUp: (email: string, password: string, fullName: string, role: 'doctor' | 'non_medic') => Promise<{ error: any; isPatient: boolean }>;
  signOut: () => Promise<void>;
  fetchProfile: () => Promise<void>;
  checkHealthRecord: () => Promise<boolean>;
  setIsNewUser: (value: boolean) => void;
  clearNewUserFlag: () => void;
  setHasHealthRecord: (value: boolean) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const NEW_PATIENT_KEY = 'medinova_new_patient';

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isNewUser, setIsNewUserState] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem(NEW_PATIENT_KEY) === 'true';
    }
    return false;
  });
  const [hasHealthRecord, setHasHealthRecordState] = useState<boolean | null>(null);

  const setIsNewUser = (value: boolean) => {
    setIsNewUserState(value);
    if (typeof window !== 'undefined') {
      if (value) {
        localStorage.setItem(NEW_PATIENT_KEY, 'true');
      } else {
        localStorage.removeItem(NEW_PATIENT_KEY);
      }
    }
  };

  const clearNewUserFlag = () => {
    setIsNewUser(false);
  };

  const setHasHealthRecord = (value: boolean) => {
    setHasHealthRecordState(value);
  };

  const fetchProfile = async () => {
    if (!user?.id) return;
    
    try {
      const data = await apiClient.getProfile();
      setProfile(data);
    } catch (error) {
      console.error('Error fetching profile:', error);
    }
  };

  const checkHealthRecord = async (): Promise<boolean> => {
    if (!user?.id) return false;
    
    try {
      const data = await apiClient.checkHealthRecord();
      const hasRecord = data.hasRecord;
      setHasHealthRecordState(hasRecord);
      return hasRecord;
    } catch (e) {
      return false;
    }
  };

  useEffect(() => {
    // Check for existing token on mount
    const initAuth = async () => {
      const token = localStorage.getItem('token');
      if (token) {
        apiClient.setToken(token);
        try {
          const data = await apiClient.verifyToken();
          setUser(data.user);
          setSession({ user: data.user, token });
          await fetchProfile();
        } catch (error) {
          // Token invalid, clear it
          apiClient.removeToken();
          setUser(null);
          setSession(null);
        }
      }
      setIsLoading(false);
    };

    initAuth();
  }, []);

  const signIn = async (email: string, password: string) => {
    try {
      const data = await apiClient.signIn(email, password);
      apiClient.setToken(data.token);
      setUser(data.user);
      setSession({ user: data.user, token: data.token });
      await fetchProfile();
      return { error: null };
    } catch (error: any) {
      return { error: { message: error.message } };
    }
  };

  const signUp = async (email: string, password: string, fullName: string, role: 'doctor' | 'non_medic') => {
    try {
      const data = await apiClient.signUp(email, password, fullName, role);
      apiClient.setToken(data.token);
      setUser(data.user);
      setSession({ user: data.user, token: data.token });
      
      if (role === 'non_medic') {
        setIsNewUser(true);
      }
      
      await fetchProfile();
      return { error: null, isPatient: role === 'non_medic' };
    } catch (error: any) {
      return { error: { message: error.message }, isPatient: false };
    }
  };

  const signOut = async () => {
    apiClient.removeToken();
    setUser(null);
    setSession(null);
    setProfile(null);
    setIsNewUser(false);
    setHasHealthRecordState(null);
  };

  const value = {
    user,
    session,
    profile,
    isLoading,
    isNewUser,
    hasHealthRecord,
    signIn,
    signUp,
    signOut,
    fetchProfile,
    checkHealthRecord,
    setIsNewUser,
    clearNewUserFlag,
    setHasHealthRecord,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
