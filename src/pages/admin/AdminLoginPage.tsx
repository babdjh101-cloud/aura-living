import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Shield, Lock, Mail, ArrowRight, AlertCircle, Info, Database } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export const AdminLoginPage: React.FC = () => {
  const { signIn, user, isAdmin, isConfigured } = useAuth();
  const navigate = useNavigate();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // If already logged in as admin, redirect to dashboard
  React.useEffect(() => {
    if (user && isAdmin) {
      navigate('/admin', { replace: true });
    }
  }, [user, isAdmin, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      const result = await signIn(email, password);
      if (result.success) {
        navigate('/admin');
      } else {
        setError(result.error || 'Authentication rejected.');
      }
    } catch (err: any) {
      setError(err.message || 'An unexpected authentication error occurred.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-stone-950 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <div className="w-12 h-12 bg-stone-900 border border-stone-800 rounded-xl flex items-center justify-center text-emerald-400 mx-auto mb-4">
          <Shield className="w-6 h-6" />
        </div>
        <h1 className="text-2xl font-serif font-normal text-white tracking-tight">
          AURA Studio Admin
        </h1>
        <p className="mt-1 text-xs text-stone-400">
          Authorized personnel only. Sessions and actions are logged and authenticated.
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md px-4 sm:px-0">
        <div className="bg-stone-900/90 border border-stone-800 py-8 px-6 shadow-2xl rounded-2xl sm:px-10">
          {error && (
            <div className="mb-6 p-3.5 bg-rose-950/60 border border-rose-800/80 rounded-xl flex items-start gap-3 text-rose-200 text-xs">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-400" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-stone-300 mb-1">
                Admin Email Address
              </label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-500" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="admin@auraliving.com"
                  className="w-full pl-10 pr-3.5 py-2.5 text-xs bg-stone-950 border border-stone-800 rounded-lg text-white placeholder:text-stone-600 focus:outline-none focus:ring-1 focus:ring-stone-400 focus:border-stone-400 transition-all"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-stone-300 mb-1">
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-500" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  className="w-full pl-10 pr-3.5 py-2.5 text-xs bg-stone-950 border border-stone-800 rounded-lg text-white placeholder:text-stone-600 focus:outline-none focus:ring-1 focus:ring-stone-400 focus:border-stone-400 transition-all"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full mt-2 py-3 px-4 rounded-lg text-xs font-semibold text-stone-950 bg-white hover:bg-stone-200 transition-colors flex items-center justify-center gap-2 cursor-pointer shadow-xs disabled:opacity-50"
            >
              <span>{isLoading ? 'Verifying Credentials...' : 'Authenticate & Enter Console'}</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </form>

          {/* Database & Setup Guide */}
          <div className="mt-8 pt-6 border-t border-stone-800 space-y-3">
            <div className="flex items-center gap-2 text-xs text-stone-400 font-medium">
              <Database className="w-3.5 h-3.5" />
              <span>Supabase Status: {isConfigured ? 'Active Project Configured' : 'Local Fallback Mode'}</span>
            </div>

            {!isConfigured ? (
              <div className="p-3 bg-stone-950 rounded-xl border border-stone-800/80 text-[11px] text-stone-400 space-y-1.5">
                <div className="flex items-center gap-1.5 text-amber-400 font-medium">
                  <Info className="w-3.5 h-3.5" />
                  <span>Preview Testing Credentials:</span>
                </div>
                <p>
                  Email: <span className="text-white font-mono">admin@auraliving.com</span>
                </p>
                <p>
                  Password: <span className="text-white font-mono">admin123</span>
                </p>
                <p className="text-[10px] text-stone-400 pt-1 border-t border-stone-850">
                  To connect your real Supabase project, supply <code className="text-stone-300">VITE_SUPABASE_URL</code> and <code className="text-stone-300">VITE_SUPABASE_ANON_KEY</code> in <code className="text-stone-300">.env</code>.
                </p>
              </div>
            ) : (
              <p className="text-[11px] text-stone-400 leading-relaxed">
                Log in with your registered Supabase administrator email and password. Your user ID must exist in the <code className="text-stone-300">admin_users</code> table to satisfy RLS authorization policies.
              </p>
            )}

            <div className="text-center pt-2">
              <Link to="/" className="text-xs text-stone-400 hover:text-stone-200 transition-colors">
                ← Return to Public Storefront
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
