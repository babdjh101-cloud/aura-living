import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { checkIsAdmin } from '../services/admin';

interface AuthContextType {
  user: any | null;
  isAdmin: boolean;
  isLoading: boolean;
  isConfigured: boolean;
  signIn: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const LOCAL_ADMIN_AUTH_KEY = 'aura_local_admin_session';

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<any | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const isConfigured = isSupabaseConfigured();

  useEffect(() => {
    let mounted = true;

    async function initAuth() {
      if (isConfigured) {
        try {
          const { data: { session } } = await supabase.auth.getSession();
          if (session?.user && mounted) {
            setUser(session.user);
            const adminStatus = await checkIsAdmin(session.user.id);
            setIsAdmin(adminStatus);
          }
        } catch (err) {
          console.warn('Auth session check error:', err);
        }
      } else {
        // Fallback local session for development testing
        const stored = localStorage.getItem(LOCAL_ADMIN_AUTH_KEY);
        if (stored && mounted) {
          try {
            const parsed = JSON.parse(stored);
            setUser(parsed);
            setIsAdmin(true);
          } catch {
            // Ignore
          }
        }
      }

      if (mounted) setIsLoading(false);
    }

    initAuth();

    if (isConfigured) {
      const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
        if (!mounted) return;
        if (session?.user) {
          setUser(session.user);
          const adminStatus = await checkIsAdmin(session.user.id);
          setIsAdmin(adminStatus);
        } else {
          setUser(null);
          setIsAdmin(false);
        }
        setIsLoading(false);
      });

      return () => {
        mounted = false;
        subscription.unsubscribe();
      };
    }

    return () => {
      mounted = false;
    };
  }, [isConfigured]);

  const signIn = async (email: string, password: string): Promise<{ success: boolean; error?: string }> => {
    setIsLoading(true);

    if (isConfigured) {
      try {
        const { data, error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });

        if (error) {
          setIsLoading(false);
          return { success: false, error: error.message };
        }

        if (data.user) {
          const hasAdminRole = await checkIsAdmin(data.user.id);
          if (!hasAdminRole) {
            await supabase.auth.signOut();
            setIsLoading(false);
            return {
              success: false,
              error: 'Access restricted: Your account does not have administrator privileges.',
            };
          }

          setUser(data.user);
          setIsAdmin(true);
          setIsLoading(false);
          return { success: true };
        }
      } catch (err: any) {
        setIsLoading(false);
        return { success: false, error: err.message || 'Authentication failed' };
      }
    }

    // Local development mode demo check (when Supabase is not connected yet)
    // Allows previewing admin features using credentials: admin@auraliving.com / admin123
    if (email.toLowerCase().includes('admin') && password.length >= 6) {
      const demoUser = {
        id: '00000000-0000-0000-0000-000000000001',
        email,
        user_metadata: { full_name: 'Studio Director' },
      };
      localStorage.setItem(LOCAL_ADMIN_AUTH_KEY, JSON.stringify(demoUser));
      setUser(demoUser);
      setIsAdmin(true);
      setIsLoading(false);
      return { success: true };
    }

    setIsLoading(false);
    return {
      success: false,
      error: 'Invalid email or password. (Dev hint: use admin@auraliving.com / admin123 for preview)',
    };
  };

  const signOut = async () => {
    setIsLoading(true);
    if (isConfigured) {
      try {
        await supabase.auth.signOut();
      } catch (err) {
        console.warn('Sign out error:', err);
      }
    }
    localStorage.removeItem(LOCAL_ADMIN_AUTH_KEY);
    setUser(null);
    setIsAdmin(false);
    setIsLoading(false);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAdmin,
        isLoading,
        isConfigured,
        signIn,
        signOut,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
