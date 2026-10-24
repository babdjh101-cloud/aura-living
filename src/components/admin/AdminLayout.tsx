import React from 'react';
import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  Package,
  ShoppingBag,
  ExternalLink,
  LogOut,
  Database,
  Shield,
  Layers,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export const AdminLayout: React.FC = () => {
  const { user, isAdmin, isLoading, isConfigured, signOut } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  // Route protection
  React.useEffect(() => {
    if (!isLoading && (!user || !isAdmin)) {
      navigate('/admin/login', { replace: true });
    }
  }, [user, isAdmin, isLoading, navigate]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-stone-100 flex items-center justify-center">
        <div className="text-center space-y-3">
          <div className="w-8 h-8 border-2 border-stone-800 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-xs text-stone-500 font-mono">Verifying administrative credentials...</p>
        </div>
      </div>
    );
  }

  if (!user || !isAdmin) {
    return null;
  }

  const navItems = [
    { label: 'Dashboard', href: '/admin', icon: LayoutDashboard },
    { label: 'Products & Inventory', href: '/admin/products', icon: Package },
    { label: 'Orders & Fulfillment', href: '/admin/orders', icon: ShoppingBag },
  ];

  const handleSignOut = async () => {
    await signOut();
    navigate('/admin/login');
  };

  return (
    <div className="min-h-screen bg-[#F5F5F3] flex flex-col md:flex-row">
      {/* Sidebar */}
      <aside className="w-full md:w-64 bg-stone-900 text-stone-300 flex flex-col justify-between shrink-0 border-r border-stone-800">
        <div>
          {/* Admin Header */}
          <div className="p-6 border-b border-stone-800">
            <div className="flex items-center gap-2 mb-1">
              <Shield className="w-4 h-4 text-emerald-400" />
              <span className="text-xs uppercase tracking-widest text-stone-400 font-bold">
                Studio Console
              </span>
            </div>
            <h1 className="text-lg font-bold text-white tracking-tight">AURA LIVING</h1>
            <div className="mt-2 text-[11px] text-stone-400 font-mono truncate">
              {user.email || 'Director Session'}
            </div>
          </div>

          {/* Nav links */}
          <nav className="p-4 space-y-1">
            {navItems.map((item) => {
              const active =
                item.href === '/admin'
                  ? location.pathname === '/admin'
                  : location.pathname.startsWith(item.href);
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  to={item.href}
                  className={`flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-xs font-medium transition-colors ${
                    active
                      ? 'bg-stone-800 text-white font-semibold'
                      : 'text-stone-400 hover:text-white hover:bg-stone-800/60'
                  }`}
                >
                  <Icon className="w-4 h-4 shrink-0" />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Database Status & Footer */}
        <div className="p-4 border-t border-stone-800 space-y-3">
          {/* Connection Status indicator */}
          <div className="p-2.5 rounded-lg bg-stone-800/80 border border-stone-700/60 text-[11px] space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-stone-400 flex items-center gap-1.5 font-medium">
                <Database className="w-3.5 h-3.5 text-stone-400" />
                <span>Supabase</span>
              </span>
              <span
                className={`px-1.5 py-0.5 rounded text-[10px] font-mono ${
                  isConfigured ? 'bg-emerald-950 text-emerald-300' : 'bg-amber-950 text-amber-300'
                }`}
              >
                {isConfigured ? 'Connected' : 'Local Cache'}
              </span>
            </div>
            <p className="text-[10px] text-stone-400 leading-tight">
              {isConfigured
                ? 'Live PostgreSQL instance & storage bucket active.'
                : 'Seed data active. Add Supabase keys to .env for cloud persistence.'}
            </p>
          </div>

          {/* Storefront return link */}
          <Link
            to="/"
            target="_blank"
            rel="noreferrer"
            className="flex items-center justify-between px-3 py-2 rounded-lg text-xs text-stone-400 hover:text-white hover:bg-stone-800 transition-colors"
          >
            <span>Open Public Store</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </Link>

          {/* Sign out */}
          <button
            onClick={handleSignOut}
            className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-xs text-rose-400 hover:text-rose-300 hover:bg-rose-950/40 transition-colors cursor-pointer"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Terminate Admin Session</span>
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col min-w-0 overflow-y-auto">
        <Outlet />
      </main>
    </div>
  );
};
