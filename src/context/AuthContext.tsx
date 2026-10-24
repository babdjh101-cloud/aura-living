import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { checkIsAdmin } from '../services/admin';

interface AuthContextType {
  user: any | null;
  isAdmin: boolean;
  isLoading: boolean;
  isConfigured: boolean;
  signIn: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  signUpAdmin: (email: string, password: string) => Promise<{ success: boolean; error?: string; message?: string }>;
  signInDemo: () => void;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const LOCAL_ADMIN_AUTH_KEY = 'aura_local_admin_session';

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<any | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const isConfigured = isSupabaseConfigured();

  const signInDemo = () => {
    const demoUser = {
      id: '00000000-0000-0000-0000-000000000001',
      email: 'admin@auraliving.com',
      user_metadata: { full_name: 'Studio Director', role: 'admin' },
    };
    localStorage.setItem(LOCAL_ADMIN_AUTH_KEY, JSON.stringify(demoUser));
    setUser(demoUser);
    setIsAdmin(true);
  };

  useEffect(() => {
    let mounted = true;

    async function initAuth() {
      // 1. Check local demo session
      const stored = localStorage.getItem(LOCAL_ADMIN_AUTH_KEY);
      if (stored && mounted) {
        try {
          const parsed = JSON.parse(stored);
          setUser(parsed);
          setIsAdmin(true);
          setIsLoading(false);
          return;
        } catch {
          // Ignore
        }
      }

      // 2. Check Supabase session if configured
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
      }

      if (mounted) setIsLoading(false);
    }

    initAuth();

    if (isConfigured) {
      const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
        if (!mounted) return;
        // If logged in via local demo session, do not override
        if (localStorage.getItem(LOCAL_ADMIN_AUTH_KEY)) {
          return;
        }
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
          // If credentials were the built-in preview demo credentials, seamlessly allow access
          if (email.toLowerCase().includes('admin') && password === 'admin123') {
            signInDemo();
            setIsLoading(false);
            return { success: true };
          }

          setIsLoading(false);
          return {
            success: false,
            error: `${error.message}. (Tip: If you haven't created this user in Supabase Auth yet, use "Register in Supabase" or click "Enter with Demo Access" below.)`,
          };
        }

        if (data.user) {
          const hasAdminRole = await checkIsAdmin(data.user.id);
          if (!hasAdminRole) {
            await supabase.auth.signOut();
            setIsLoading(false);
            return {
              success: false,
              error: 'Access restricted: Your Supabase user account does not have administrator privileges.',
            };
          }

          localStorage.removeItem(LOCAL_ADMIN_AUTH_KEY);
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

    // Local development mode check
    if (email.toLowerCase().includes('admin') && password.length >= 6) {
      signInDemo();
      setIsLoading(false);
      return { success: true };
    }

    setIsLoading(false);
    return {
      success: false,
      error: 'Invalid credentials. Use admin@auraliving.com / admin123 or register your account.',
    };
  };

  const signUpAdmin = async (
    email: string,
    password: string
  ): Promise<{ success: boolean; error?: string; message?: string }> => {
    setIsLoading(true);

    if (!isConfigured) {
      signInDemo();
      setIsLoading(false);
      return { success: true, message: 'Logged in to Local Demo mode.' };
    }

    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            role: 'admin',
            full_name: 'Studio Administrator',
          },
        },
      });

      setIsLoading(false);

      if (error) {
        return { success: false, error: error.message };
      }

      if (data.session) {
        localStorage.removeItem(LOCAL_ADMIN_AUTH_KEY);
        setUser(data.user);
        setIsAdmin(true);
        return { success: true, message: 'Admin account created and authenticated!' };
      }

      return {
        success: true,
        message: 'Account registered! If email confirmation is enabled on your Supabase project, verify your email before logging in.',
      };
    } catch (err: any) {
      setIsLoading(false);
      return { success: false, error: err.message || 'Registration failed' };
    }
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
        signUpAdmin,
        signInDemo,
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
